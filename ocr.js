// 精簡版 PaddleOCR：只用 onnxruntime-web 跑偵測＋辨識模型，不載 OpenCV。
// 原本的 @paddleocr/paddleocr-js 在 iPhone 上峰值超過 1 GB，會被系統直接關掉。
const ORT = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/';
const M = new URL('./ocr/', import.meta.url).href;
const DET_SIDE = 960, DET_TH = 0.2, BOX_TH = 0.4, UNCLIP = 1.6, REC_H = 48, REC_MIN = 0.5;
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
async function detect(src) {
  const k = Math.min(1, DET_SIDE / Math.max(src.width, src.height));
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
export async function read(src) {
  await load();
  const boxes = (await detect(src)).sort((a, b) => a.y - b.y);
  for (let i = 1; i < boxes.length; i++) {   // 和 PaddleOCR 一樣：y 差很小視為同一行，改按 x 排
    for (let j = i; j > 0 && Math.abs(boxes[j].y - boxes[j - 1].y) < Math.min(boxes[j].h, boxes[j - 1].h) / 2 && boxes[j].x < boxes[j - 1].x; j--) [boxes[j], boxes[j - 1]] = [boxes[j - 1], boxes[j]];
  }
  const lines = [];
  for (const b of boxes) { const s = await recognize(src, b); if (s) lines.push(s); }
  return lines;
}
