// 精簡版 PaddleOCR：只用 onnxruntime-web 跑偵測＋辨識（PP-OCRv5 mobile）模型，不載 OpenCV。
// 原本的 @paddleocr/paddleocr-js 在 iPhone 上峰值超過 1 GB，會被系統直接關掉。
// 固定 1.20.1：1.21 起在 iOS 26 Safari 會觸發 WebKit 編譯大型 wasm 函式時記憶體暴增，App 被系統關掉（onnxruntime 議題 26827、WebKit bug 304810）
const ORT = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/';
const M = new URL('./ocr/', import.meta.url).href;
const DET_SIDE = 1280, DET_TH = 0.3,   // 960 或 v6 tiny 偵測模型會把行距窄的票上下兩行黏在一起
      BOX_TH = 0.4, UNCLIP = 1.6, REC_H = 48, REC_MIN = 0.35;
let ort, det, rec, dict;

export async function load() {
  if (det) return;
  ort = await import(ORT + 'ort.wasm.min.mjs');
  ort.env.wasm.numThreads = 1; ort.env.wasm.wasmPaths = ORT;
  const opt = { executionProviders: ['wasm'], graphOptimizationLevel: 'all', enableCpuMemArena: false, enableMemPattern: false };
  det = await ort.InferenceSession.create(M + 'det.onnx', opt);   // 一個一個建，避免同時佔兩份暫存記憶體
  rec = await ort.InferenceSession.create(M + 'rec.onnx', opt);
  dict = ['', ...(await (await fetch(M + 'dict.txt')).text()).split('\n'), ' '];   // 0 是 CTC 空白，最後一個是空格
}

// 畫布像素 → BGR、CHW 的 Float32（Paddle 的前處理順序）
function toTensor(px, w, h, mean, std, W = w) {
  const a = new Float32Array(3 * h * W), n = h * W;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, o = y * W + x;
    a[o] = (px[i + 2] / 255 - mean[0]) / std[0]; a[n + o] = (px[i + 1] / 255 - mean[1]) / std[1]; a[2 * n + o] = (px[i] / 255 - mean[2]) / std[2];
  }
  return a;
}

// 偵測：機率圖 → 連通區塊 → 用主軸方向算出旋轉矩形（拍歪的票也能對齊）
async function detect(src, side = DET_SIDE) {
  const k = Math.min(1, side / Math.max(src.width, src.height));
  const W = Math.max(32, Math.round(src.width * k / 32) * 32), H = Math.max(32, Math.round(src.height * k / 32) * 32);
  const c = new OffscreenCanvas(W, H), g = c.getContext('2d'); g.drawImage(src, 0, 0, W, H);
  const t = toTensor(g.getImageData(0, 0, W, H).data, W, H, [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]);
  const out = await det.run({ [det.inputNames[0]]: new ort.Tensor('float32', t, [1, 3, H, W]) });
  const p = Object.values(out)[0].data, seen = new Uint8Array(W * H), boxes = [], sx = src.width / W, sy = src.height / H;
  for (let s = 0; s < W * H; s++) {
    if (seen[s] || p[s] <= DET_TH) continue;
    const pix = [s]; seen[s] = 1;
    for (let q = 0; q < pix.length; q++) {
      const v = pix[q], x = v % W, y = (v - x) / W;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy, nv = ny * W + nx;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H && !seen[nv] && p[nv] > DET_TH) { seen[nv] = 1; pix.push(nv); }
      }
    }
    if (pix.length < 10) continue;
    let mx = 0, my = 0, sc = 0;
    for (const v of pix) { mx += v % W; my += (v / W) | 0; sc += p[v]; }
    if (sc / pix.length < BOX_TH) continue;
    mx /= pix.length; my /= pix.length;
    let xx = 0, yy = 0, xy = 0;
    for (const v of pix) { const dx = v % W - mx, dy = ((v / W) | 0) - my; xx += dx * dx; yy += dy * dy; xy += dx * dy; }
    const th = 0.5 * Math.atan2(2 * xy, xx - yy), cs = Math.cos(th), sn = Math.sin(th);
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (const v of pix) {
      const dx = v % W - mx, dy = ((v / W) | 0) - my, u = dx * cs + dy * sn, w = -dx * sn + dy * cs;
      u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, w); v1 = Math.max(v1, w);
    }
    let bw = u1 - u0 + 1, bh = v1 - v0 + 1;
    const d = bw * bh * UNCLIP / (2 * (bw + bh)); bw += 2 * d; bh += 2 * d;   // DB 的機率圖比文字窄，往外擴
    if (Math.min(bw, bh) < 4) continue;
    const ox = mx + ((u0 + u1) / 2) * cs - ((v0 + v1) / 2) * sn, oy = my + ((u0 + u1) / 2) * sn + ((v0 + v1) / 2) * cs;
    boxes.push({ x: ox * sx, y: oy * sy, w: bw * sx, h: bh * sy, th });
  }
  return boxes;
}

// 辨識：把旋轉矩形轉正裁成高 48 的長條，CTC 貪婪解碼
async function recognize(src, b) {
  const rw = Math.max(8, Math.min(3200, Math.ceil(REC_H * b.w / b.h))), W = Math.max(rw, 320);
  const c = new OffscreenCanvas(rw, REC_H), g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, rw, REC_H);
  g.scale(rw / b.w, REC_H / b.h); g.translate(b.w / 2, b.h / 2); g.rotate(-b.th); g.translate(-b.x, -b.y); g.drawImage(src, 0, 0);
  const t = toTensor(g.getImageData(0, 0, rw, REC_H).data, rw, REC_H, [0.5, 0.5, 0.5], [0.5, 0.5, 0.5], W);
  const out = Object.values(await rec.run({ [rec.inputNames[0]]: new ort.Tensor('float32', t, [1, 3, REC_H, W]) }))[0];
  const [, T, C] = out.dims, p = out.data;
  let s = '', last = 0, sc = 0, n = 0;
  for (let i = 0; i < T; i++) {
    let best = 0, bv = -1;
    for (let j = 0, o = i * C; j < C; j++) if (p[o + j] > bv) { bv = p[o + j]; best = j; }
    if (best && best !== last) { s += dict[best] || ''; sc += bv; n++; }
    last = best;
  }
  return n && sc / n >= REC_MIN ? s.trim() : '';
}

// 回傳一行一個文字框，由上到下、同一行由左到右
export async function read(src, side = DET_SIDE) {
  await load();
  const boxes = (await detect(src, side)).sort((a, b) => a.y - b.y);
  for (let i = 1; i < boxes.length; i++) {   // 和 PaddleOCR 一樣：y 差很小視為同一行，改按 x 排
    for (let j = i; j > 0 && Math.abs(boxes[j].y - boxes[j - 1].y) < Math.min(boxes[j].h, boxes[j - 1].h) / 2 && boxes[j].x < boxes[j - 1].x; j--) [boxes[j], boxes[j - 1]] = [boxes[j - 1], boxes[j]];
  }
  // 同一行、間隔小於兩個半字高的框接成一行（字距寬的票，「NMIXX 1ST WORLD TOUR」會被拆成好幾個框）
  const lines = []; let last = null;
  for (const b of boxes) {
    const s = await recognize(src, b); if (!s) continue;
    const flat = Math.abs(Math.sin(b.th)) < 0.2, w = flat ? b.w : b.h, h = flat ? b.h : b.w;
    if (last && flat && last.flat && Math.abs(b.y - last.y) < Math.min(h, last.h) / 2 && b.x - w / 2 - last.r < 2.5 * Math.min(h, last.h)) lines[lines.length - 1] += ' ' + s;
    else lines.push(s);
    last = { flat, y: b.y, h, r: b.x + w / 2 };
  }
  return lines;
}

// 找出照片裡票券的範圍：用較小的偵測尺寸找文字框，把彼此靠近的框連成一群，取總面積最大的那群（背景零星的字會被排除）
export async function region(src) {
  await load();
  const bs = await detect(src, 960);
  if (!bs.length) return null;
  const r = bs.map((b) => {
    const c = Math.abs(Math.cos(b.th)), s = Math.abs(Math.sin(b.th)), ex = (b.w * c + b.h * s) / 2, ey = (b.w * s + b.h * c) / 2;
    return { x0: b.x - ex, y0: b.y - ey, x1: b.x + ex, y1: b.y + ey, t: Math.min(b.w, b.h), a: b.w * b.h };
  });
  const up = r.map((_, i) => i), root = (i) => (up[i] === i ? i : (up[i] = root(up[i])));
  for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) {
    const g = 2.5 * Math.min(r[i].t, r[j].t);   // 間隔小於約兩行半就算同一張票
    if (r[i].x0 - g < r[j].x1 && r[j].x0 - g < r[i].x1 && r[i].y0 - g < r[j].y1 && r[j].y0 - g < r[i].y1) up[root(i)] = root(j);
  }
  const area = {};
  r.forEach((b, i) => { const k = root(i); area[k] = (area[k] || 0) + b.a; });
  const best = +Object.keys(area).sort((a, b) => area[b] - area[a])[0];
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  r.forEach((b, i) => { if (root(i) === best) { x0 = Math.min(x0, b.x0); y0 = Math.min(y0, b.y0); x1 = Math.max(x1, b.x1); y1 = Math.max(y1, b.y1); } });
  const m = 0.04 * Math.max(x1 - x0, y1 - y0);
  x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(src.width, x1 + m); y1 = Math.min(src.height, y1 + m);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
