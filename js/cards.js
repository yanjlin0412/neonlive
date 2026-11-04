/* ================= 分享圖卡（Canvas 產生 1080×1920） ================= */
// 畫好的 1080×1920 畫布轉成 Blob 網址後立刻釋放（data URL 會在記憶體裡多留一份很長的字串）
const toURL = (cv, type, q) => new Promise((res) => cv.toBlob((b) => { cv.width = cv.height = 0; res(b ? URL.createObjectURL(b) : ''); }, type, q));
const loadImg = (url) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = url; });
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function glow(g, x, y, r, col) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 1080, 1920); }
function drawCover(g, img, x, y, w, h) { const k = Math.max(w / img.width, h / img.height); const iw = img.width * k, ih = img.height * k; g.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); }
function fit(g, text, max, size, weight, fam) { do { g.font = `${weight} ${size}px ${fam}`; size -= 2; } while (g.measureText(text).width > max && size > 20); }
function bars(g, x, y, w, h, seed, color) { let v = [...seed].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) >>> 0, 7); g.fillStyle = color; let i = 0; while (i < w) { v = (Math.imul(v, 1103515245) + 12345) >>> 0; const bw = 2 + (v >>> 16) % 6; if ((v >>> 8) & 3) g.fillRect(x + i, y, bw, h); i += bw + 3; } }
const FS = { u: 'Unbounded,"PingFang TC","Heiti TC",sans-serif', m: '"JetBrains Mono","PingFang TC",monospace', s: '-apple-system,"PingFang TC","Heiti TC",sans-serif' };
async function drawCard(s, tpl) {
  await document.fonts.ready;
  const W = 1080, H = 1920, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'); const css = getComputedStyle(document.querySelector('.app')); const v = (k) => css.getPropertyValue(k).trim();
  const C = v('--c'), M = v('--m'), Y = v('--y'), C2 = v('--c2'), M2 = v('--m2');
  g.fillStyle = v('--base'); g.fillRect(0, 0, W, H);
  glow(g, 150, 260, 760, `rgba(${v('--c-rgb')},.42)`); glow(g, 960, 1500, 820, `rgba(${v('--m-rgb')},.42)`); glow(g, 600, 950, 600, `rgba(${v('--v-rgb')},.22)`);
  const ph = coverPhoto(s); const img = ph && P.url(ph.id) ? await loadImg(P.url(ph.id)) : null;
  const p = P.parts(s.date); const songs = [...s.setlist.map((t) => [t, false]), ...s.encore.map((t) => [t, true])];
  const chrome = (x, y, w, h) => { const gr = g.createLinearGradient(x, y, x + w, y + h); [['#ffffff', 0], ['#8d94a0', .16], [C2, .3], ['#eef1f6', .44], ['#4d535e', .6], [M2, .76], ['#f1f4f8', 1]].forEach(([c, o]) => gr.addColorStop(o, c)); return gr; };
  const art = (x, y, w, h) => { if (img) { drawCover(g, img, x, y, w, h); return; } g.fillStyle = v('--card2'); g.fillRect(x, y, w, h); const a = g.createRadialGradient(x + w * .75, y + h * .25, 0, x + w * .75, y + h * .25, w * .7); a.addColorStop(0, `rgba(${v('--m-rgb')},.8)`); a.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = a; g.fillRect(x, y, w, h); const b = g.createRadialGradient(x + w * .15, y + h * .85, 0, x + w * .15, y + h * .85, w * .7); b.addColorStop(0, `rgba(${v('--c-rgb')},.65)`); b.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = b; g.fillRect(x, y, w, h); };

  if (tpl === 'ticket') {
    const L = document.createElement('canvas'); L.width = W; L.height = H; const t = L.getContext('2d');
    const x = 110, y = 210, w = 860, h = 1460, cut = 840;
    t.save(); t.shadowColor = C; t.shadowBlur = 70; rr(t, x, y, w, h, 64); t.fillStyle = chrome(x, y, w, h); t.fill(); t.restore();
    rr(t, x + 8, y + 8, w - 16, h - 16, 58); const ig = t.createLinearGradient(0, y, 0, y + h); ig.addColorStop(0, v('--card1')); ig.addColorStop(.7, v('--card2')); t.fillStyle = ig; t.fill();
    g.drawImage(L, 0, 0); L.width = L.height = 0;
    // 封面
    g.save(); rr(g, x + 8, y + 8, w - 16, cut - 8, 58); g.rect(x + 8, y + 70, w - 16, cut - 70); g.clip(); art(x + 8, y + 8, w - 16, cut - 8);
    const fade = g.createLinearGradient(0, y + cut - 380, 0, y + cut); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(5,6,12,.92)'); g.fillStyle = fade; g.fillRect(x, y, w, cut); g.restore();
    // 狀態、票價
    g.font = `600 30px ${FS.m}`; g.strokeStyle = C; g.lineWidth = 3; const stx = P.STATUS_EN[s.status]; const stw = g.measureText(stx).width + 36;
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(x + 50, y + 50, stw, 60); g.strokeRect(x + 50, y + 50, stw, 60); g.fillStyle = C; g.textBaseline = 'middle'; g.fillText(stx, x + 68, y + 81);
    if (s.price) { const tx = money(twd(s)); g.font = `600 34px ${FS.m}`; const pw = g.measureText(tx).width + 40; rr(g, x + w - 50 - pw, y + 48, pw, 64, 32); g.fillStyle = 'rgba(0,0,0,.55)'; g.fill(); g.fillStyle = Y; g.fillText(tx, x + w - 30 - pw, y + 81); }
    g.textBaseline = 'alphabetic';
    g.save(); g.shadowColor = C; g.shadowBlur = 30; g.fillStyle = '#fff'; g.font = `800 230px ${FS.u}`; g.fillText(p.d, x + 60, y + cut - 50); const dw = g.measureText(p.d).width; g.restore();
    g.font = `600 44px ${FS.m}`; g.fillStyle = '#d6deee'; g.fillText(`${p.y}年${p.mon} 週${p.wk}`, x + 90 + dw, y + cut - 60);
    // 撕線與缺口
    g.setLineDash([16, 12]); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 4; g.beginPath(); g.moveTo(x + 50, y + cut + 20); g.lineTo(x + w - 50, y + cut + 20); g.stroke(); g.setLineDash([]);
    g.save(); g.globalCompositeOperation = 'destination-out'; [x, x + w].forEach((cx) => { g.beginPath(); g.arc(cx, y + cut + 20, 34, 0, Math.PI * 2); g.fill(); }); g.restore();
    g.save(); g.globalCompositeOperation = 'destination-over'; glow(g, 960, 1500, 820, `rgba(${v('--m-rgb')},.42)`); glow(g, 150, 260, 760, `rgba(${v('--c-rgb')},.42)`); g.fillStyle = v('--base'); g.fillRect(0, 0, W, H); g.restore();   // 缺口挖空後補回背景
    // 下半資訊
    g.fillStyle = '#fff'; fit(g, s.artist, w - 120, 84, 800, FS.u); g.fillText(s.artist, x + 60, y + cut + 140);
    g.fillStyle = '#a3b0c6'; fit(g, s.tour || '', w - 120, 40, 500, FS.s); g.fillText(s.tour || '', x + 60, y + cut + 200);
    g.fillStyle = '#d6deee'; fit(g, `◉ ${s.venue || '—'}${s.seat ? ' · ' + s.seat : ''}`, w - 120, 36, 500, FS.m); g.fillText(`◉ ${s.venue || '—'}${s.seat ? ' · ' + s.seat : ''}`, x + 60, y + cut + 262);
    g.fillStyle = Y; g.font = `600 52px ${FS.m}`; g.fillText(s.rating ? '★'.repeat(s.rating) + '☆'.repeat(5 - s.rating) : P.STATUS[s.status], x + 60, y + h - 90);
    bars(g, x + w - 330, y + h - 150, 270, 80, s.id, '#d6deee');
    const hol = g.createLinearGradient(0, y, 0, y + h); [C, M, Y, v('--g'), C].forEach((c, i) => hol.addColorStop(i / 4, c)); g.fillStyle = hol; g.globalAlpha = .8; g.fillRect(x + w - 22, y + 70, 12, h - 140); g.globalAlpha = 1;
  } else if (tpl === 'receipt') {
    const x = 140, y = 170, w = 800, h = 1560;
    g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 50; g.shadowOffsetY = 20;
    g.beginPath(); g.moveTo(x, y); for (let i = 0; i <= 20; i++) g.lineTo(x + i * w / 20, y + (i % 2 ? 16 : 0)); g.lineTo(x + w, y + h); for (let i = 20; i >= 0; i--) g.lineTo(x + i * w / 20, y + h - (i % 2 ? 16 : 0)); g.closePath();
    g.fillStyle = '#f3f0e8'; g.fill(); g.restore();
    const ink = '#17171c'; let cy = y + 110; g.textAlign = 'center';
    g.fillStyle = ink; g.font = `800 46px ${FS.u}`; g.fillText('NEON//LIVE', W / 2, cy); cy += 52;
    g.font = `500 28px ${FS.m}`; g.fillStyle = '#55555c'; g.fillText('BOX OFFICE · 演唱會票券收據', W / 2, cy); cy += 50;
    const dash = () => { g.setLineDash([10, 8]); g.strokeStyle = '#9a978f'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 50, cy); g.lineTo(x + w - 50, cy); g.stroke(); g.setLineDash([]); cy += 60; };
    dash();
    g.fillStyle = ink; fit(g, s.artist, w - 120, 68, 800, FS.s); g.fillText(s.artist, W / 2, cy); cy += 52;
    g.fillStyle = '#55555c'; fit(g, s.tour || '', w - 120, 32, 500, FS.s); g.fillText(s.tour || '', W / 2, cy); cy += 56;
    g.textAlign = 'left';
    const row = (k, val, big) => { g.fillStyle = big ? ink : '#3a3a40'; g.font = `${big ? 700 : 500} ${big ? 50 : 34}px ${FS.m}`; g.fillText(k, x + 60, cy); g.textAlign = 'right'; g.fillText(val, x + w - 60, cy); g.textAlign = 'left'; cy += big ? 72 : 54; };
    dash();
    row('日期', `${s.date.replace(/-/g, '.')} ${s.time || ''}`); row('場館', s.venue || '—'); row('座位', s.seat || '—'); row('狀態', P.STATUS[s.status]);
    dash();
    const c = s.cur || 'TWD';
    if (s.price) { row('單價', `${c} ${s.price.toLocaleString()}`); row('張數', `× ${s.qty}`); row('手續費', `${c} ${(s.fee || 0).toLocaleString()}`); cy += 6; row('合計', `${c} ${subtotal(s).toLocaleString()}`, true); if (c !== 'TWD') row('約合台幣', money(twd(s))); if (songs.length) row('每首歌成本', money(twd(s) / songs.length)); }
    else row('票價', '未填寫');
    dash();
    bars(g, x + 90, cy - 20, w - 180, 110, s.id, ink); cy += 150;
    g.textAlign = 'center'; g.fillStyle = '#55555c'; g.font = `600 30px ${FS.m}`; g.fillText('THANK YOU FOR THE MUSIC', W / 2, cy); cy += 44; g.font = `500 24px ${FS.m}`; g.fillText(`NO.${s.id.toUpperCase()} · ${P.today.replace(/-/g, '.')}`, W / 2, cy);
    g.save(); g.translate(x + w - 170, y + 330); g.rotate(-.25); g.strokeStyle = M; g.fillStyle = M; g.globalAlpha = .75; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 110, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(0, 0, 92, 0, Math.PI * 2); g.lineWidth = 2; g.stroke(); g.font = `800 36px ${FS.u}`; g.fillText(s.status === 'attended' ? 'LIVE!' : 'SOON', 0, 12); g.restore();
    g.textAlign = 'left';
  } else {
    const disc = (cx, cy, r) => { g.save(); g.shadowColor = M; g.shadowBlur = 60; let gr; if (g.createConicGradient) { gr = g.createConicGradient(0, cx, cy); [['#d9dee6', 0], [C, .17], [v('--v'), .34], [M, .5], [Y, .66], [C2, .83], ['#d9dee6', 1]].forEach(([c, o]) => gr.addColorStop(o, c)); } else { gr = g.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, C2); gr.addColorStop(1, M); } g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill(); g.restore(); g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 2; for (let rr2 = 120; rr2 < r; rr2 += 10) { g.beginPath(); g.arc(cx, cy, rr2, 0, Math.PI * 2); g.stroke(); } g.fillStyle = '#c9ced6'; g.beginPath(); g.arc(cx, cy, 70, 0, Math.PI * 2); g.fill(); g.fillStyle = v('--base'); g.beginPath(); g.arc(cx, cy, 44, 0, Math.PI * 2); g.fill(); };
    disc(820, 620, 400);
    const x = 90, y = 200, sz = 820;
    g.save(); g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 60; rr(g, x, y, sz, sz, 30); g.fillStyle = chrome(x, y, sz, sz); g.fill(); g.restore();
    g.save(); rr(g, x + 8, y + 8, sz - 16, sz - 16, 24); g.clip(); art(x + 8, y + 8, sz - 16, sz - 16);
    const f2 = g.createLinearGradient(0, y + sz * .45, 0, y + sz); f2.addColorStop(0, 'rgba(0,0,0,0)'); f2.addColorStop(1, 'rgba(0,0,0,.75)'); g.fillStyle = f2; g.fillRect(x, y, sz, sz);
    g.fillStyle = '#fff'; g.shadowColor = C; g.shadowBlur = 24; fit(g, s.artist.toUpperCase(), sz - 120, 110, 800, FS.u); g.fillText(s.artist.toUpperCase(), x + 56, y + sz - 70); g.shadowBlur = 0;
    g.font = `600 32px ${FS.m}`; g.fillStyle = '#e8edf6'; g.textAlign = 'right'; g.fillText(s.date.replace(/-/g, '.'), x + sz - 50, y + 70); g.textAlign = 'left'; g.restore();
    let cy = y + sz + 110;
    g.fillStyle = C; g.font = `600 34px ${FS.m}`; g.fillText(`TRACKLIST · ${songs.length || 0} SONGS`, x + 10, cy); cy += 30;
    g.fillStyle = '#a3b0c6'; g.font = `500 30px ${FS.s}`; g.fillText(`${s.venue || ''}${s.tour ? ' · ' + s.tour : ''}`.slice(0, 40), x + 10, cy + 30); cy += 90;
    const list = songs.slice(0, 16); const half = Math.ceil(list.length / 2);
    list.forEach(([t, enc], i) => { const col = i < half ? 0 : 1, rowi = i < half ? i : i - half; const tx = x + 10 + col * 460, ty = cy + rowi * 62;
      g.fillStyle = enc ? M : C; g.font = `600 28px ${FS.m}`; g.fillText(P.pad(i + 1), tx, ty); g.fillStyle = enc ? M2 : '#eef1f6'; fit(g, t, 360, 38, 600, FS.s); g.fillText(t, tx + 64, ty); });
    if (!list.length) { g.fillStyle = '#a3b0c6'; g.font = `500 36px ${FS.s}`; g.fillText('歌單還沒填，演出後再補上吧', x + 10, cy); }
  }
  g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.75)'; g.font = `600 30px ${FS.m}`; g.fillText('NEON//LIVE · MY CONCERT LOG', W / 2, H - 80); g.textAlign = 'left';
  return toURL(cv, 'image/png');
}
let shareId = null, shareTpl = 'ticket', shareURL = '';
async function openShare(id) { shareId = id; P.sheet('share', true); await paintShare(); }
async function paintShare() {
  const img = document.getElementById('preview'); img.style.opacity = .4;
  if (shareURL) URL.revokeObjectURL(shareURL);
  shareURL = await drawCard(P.get(shareId), shareTpl); img.src = shareURL; img.style.opacity = 1;
  document.querySelectorAll('#tpl button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.t === shareTpl));
}
const shareName = () => `${P.get(shareId).artist}-${{ ticket: '票根', receipt: '收據', cd: 'CD' }[shareTpl]}.png`;
document.getElementById('tpl').addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (b) { shareTpl = b.dataset.t; paintShare(); } });
function saveCard() { const a = document.createElement('a'); a.href = shareURL; a.download = shareName(); a.click(); P.toast('圖片已儲存'); }
document.getElementById('doSave').addEventListener('click', saveCard);
document.getElementById('doShare').addEventListener('click', async () => {
  const blob = await (await fetch(shareURL)).blob(); const file = new File([blob], shareName(), { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: 'NEON//LIVE' }); } catch (err) { /* 使用者取消 */ } }
  else saveCard();
});


/* ================= 數位票根：10 種主題風格 ================= */
const TICKETS = [
  ['aurora', '液態極光'], ['grid', '霓虹網格'], ['prism', '全息稜鏡'], ['space', '星塵深空'], ['wave', '音波脈衝'],
  ['mercury', '液態水銀'], ['laser', '雷射光束'], ['spot', '舞台聚光'], ['circuit', '電路脈絡'], ['stick', '螢光人海']
];
function themeVars(id) {
  const el = document.createElement('div'); el.dataset.theme = id; el.style.display = 'none'; document.querySelector('.app').appendChild(el);
  const cs = getComputedStyle(el); const v = (k) => cs.getPropertyValue(k).trim();
  const T = { c: v('--c'), m: v('--m'), y: v('--y'), g: v('--g'), v: v('--v'), c2: v('--c2'), m2: v('--m2'), base: v('--base'), card1: v('--card1'), card2: v('--card2'), mut: v('--mut') };
  const rgbs = Object.fromEntries(['c', 'm', 'y', 'v'].map((k) => [k, v(`--${k}-rgb`)]));   // 先讀完再移除元素，移除後就讀不到了
  el.remove();
  return { ...T, rgb: (k) => rgbs[k] };
}
function wrapLines(g, text, max, maxLines) {
  // 中日韓字逐字換行，英文單字整個換行
  const tokens = String(text).match(/[\u2E80-\u9FFF\uAC00-\uD7AF\uFF00-\uFFEF]|[^\s\u2E80-\u9FFF\uAC00-\uD7AF\uFF00-\uFFEF]+|\s+/g) || [];
  const out = []; let line = '', cut = false;
  for (const tk of tokens) {
    if (g.measureText(line + tk).width > max && line.trim()) { out.push(line.trim()); line = tk.trim() ? tk : ''; if (out.length === maxLines) { cut = true; break; } }
    else line += tk;
  }
  if (!cut && line.trim()) out.push(line.trim());
  if (cut) { let l = out[maxLines - 1]; while (l && g.measureText(l + '…').width > max) l = l.slice(0, -1); out[maxLines - 1] = l + '…'; }
  return out.slice(0, maxLines);
}
function motif(g, id, T, W, H) {
  const rnd = (() => { let x = 9; return () => (x = (Math.imul(x, 1103515245) + 12345) >>> 0) / 4294967296; })();
  const blob = (x, y, r, col, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
  const line = (x1, y1, x2, y2, col, w, blur) => { g.save(); g.strokeStyle = col; g.lineWidth = w; g.shadowColor = col; g.shadowBlur = blur; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.restore(); };
  if (id === 'aurora') { blob(150, 350, 700, T.rgb('c'), .7); blob(950, 1100, 700, T.rgb('m'), .7); blob(450, 1750, 600, T.rgb('v'), .6); }
  if (id === 'grid') {
    const sky = g.createLinearGradient(0, 0, 0, 1150); sky.addColorStop(0, '#0b0418'); sky.addColorStop(1, `rgba(${T.rgb('c')},.55)`); g.fillStyle = sky; g.fillRect(0, 0, W, 1150);
    const sun = g.createLinearGradient(0, 600, 0, 1150); sun.addColorStop(0, T.y); sun.addColorStop(1, T.m); g.fillStyle = sun; g.beginPath(); g.arc(540, 1050, 330, Math.PI, 0); g.fill();
    g.fillStyle = '#0b0418'; for (let i = 0, y = 900; y < 1060; i++, y += 34) g.fillRect(0, y, W, 6 + i * 3);
    g.fillStyle = '#0b0418'; g.fillRect(0, 1150, W, H);
    for (let i = -12; i <= 12; i++) line(540 + i * 45, 1150, 540 + i * 300, H, T.c, 3, 12);
    for (let y = 1160, k = 18; y < H; y += k, k *= 1.3) line(0, y, W, y, T.c, 3, 12);
  }
  if (id === 'prism') { if (g.createConicGradient) { const cg = g.createConicGradient(0, 540, 960); [T.c, T.v, T.m, T.y, T.g, T.c].forEach((c, i) => cg.addColorStop(i / 5, c)); g.globalAlpha = .45; g.fillStyle = cg; g.fillRect(0, 0, W, H); g.globalAlpha = 1; } for (let x = -H; x < W; x += 26) line(x, 0, x + H * .7, H, 'rgba(255,255,255,.06)', 2, 0); }
  if (id === 'space') { blob(800, 400, 600, T.rgb('v'), .6); blob(200, 1300, 600, T.rgb('c'), .35); blob(800, 1700, 500, T.rgb('m'), .35); for (let i = 0; i < 380; i++) { const r = rnd() * 2.6; g.fillStyle = `rgba(255,255,255,${.3 + rnd() * .7})`; g.beginPath(); g.arc(rnd() * W, rnd() * H, r, 0, 7); g.fill(); } }
  if (id === 'wave') { blob(540, 1000, 900, T.rgb('m'), .25); [['c', 120, .006, 760], ['m', 160, .004, 900], ['v', 90, .009, 1050], ['y', 60, .012, 840], ['c', 50, .015, 1700]].forEach(([k, a, f, y0], j) => { g.save(); g.strokeStyle = `rgba(${T.rgb(k)},.9)`; g.lineWidth = 5; g.shadowColor = `rgba(${T.rgb(k)},1)`; g.shadowBlur = 24; g.beginPath(); for (let x = 0; x <= W; x += 6) { const y = y0 + Math.sin(x * f + j) * a * (.4 + .6 * Math.sin(x / W * Math.PI)); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.restore(); }); }
  if (id === 'mercury') { blob(540, 300, 900, '42,45,53', .9); [[160, 360, 150], [930, 1250, 220], [300, 1780, 120], [880, 260, 70]].forEach(([x, y, r]) => { const gr = g.createRadialGradient(x - r * .35, y - r * .4, r * .05, x, y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.25, '#c9ced6'); gr.addColorStop(.6, '#4d535e'); gr.addColorStop(1, '#0b0c10'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = `rgba(${T.rgb('c')},.5)`; g.lineWidth = 4; g.beginPath(); g.arc(x, y, r - 3, .3, 2.8); g.stroke(); }); }
  if (id === 'laser') { blob(540, 1950, 800, T.rgb('m'), .45); for (let i = 0; i < 9; i++) { const a = -1.05 + i * .2625; line(540, 1900, 540 + Math.sin(a) * 2600, 1900 - Math.cos(a) * 2600, i % 2 ? T.m : T.c, 5, 30); } blob(540, 1900, 160, '255,255,255', .9); }
  if (id === 'spot') { [[200, T.rgb('c')], [540, T.rgb('y')], [880, T.rgb('m')]].forEach(([x, col], i) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, `rgba(${col},.55)`); gr.addColorStop(.85, `rgba(${col},0)`); g.save(); g.translate(x, -40); g.rotate((i - 1) * .22); g.fillStyle = gr; g.beginPath(); g.moveTo(-40, 0); g.lineTo(40, 0); g.lineTo(420, H + 100); g.lineTo(-420, H + 100); g.closePath(); g.fill(); g.restore(); }); blob(540, 1900, 600, T.rgb('y'), .5); }
  if (id === 'circuit') { for (let i = 0; i < 26; i++) { let x = Math.round(rnd() * 27) * 40, y = Math.round(rnd() * 48) * 40; g.save(); g.strokeStyle = `rgba(${T.rgb('c')},.35)`; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { if (k % 2) y += (rnd() < .5 ? -1 : 1) * (80 + rnd() * 260); else x += (rnd() < .5 ? -1 : 1) * (60 + rnd() * 200); g.lineTo(x, y); } g.stroke(); g.fillStyle = i % 3 ? T.c : T.m; g.shadowColor = g.fillStyle; g.shadowBlur = 20; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); g.restore(); } }
  if (id === 'stick') { blob(540, 0, 900, T.rgb('m'), .5); const cols = ['c', 'm', 'y', 'v']; [[1500, 12, 70, 9], [1700, 9, 100, 12], [1900, 6, 140, 16]].forEach(([y, n, len, w], r) => { for (let i = 0; i < n; i++) { const x = (i + .5 + (r % 2) * .3) / n * W, a = Math.sin(i * 1.7 + r) * .45; line(x, y, x + Math.sin(a) * len, y - Math.cos(a) * len, `rgba(${T.rgb(cols[(i + r) % 4])},1)`, w, 30); g.fillStyle = 'rgba(0,0,0,.6)'; g.beginPath(); g.ellipse(x, y + len * .5, len * .35, len * .45, 0, 0, 7); g.fill(); } }); }
}
async function drawTicket(s, id) {
  await document.fonts.ready;
  const W = 1080, H = 1920, T = themeVars(id), name = TICKETS.find((t) => t[0] === id)[1];
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.fillStyle = T.base; g.fillRect(0, 0, W, H); motif(g, id, T, W, H);
  // 票卡（另一層畫好再挖缺口）
  const L = document.createElement('canvas'); L.width = W; L.height = H; const t = L.getContext('2d');
  const x = 120, y = 190, w = 840, h = 1520, cut = y + 1010, R = id === 'grid' || id === 'circuit' ? 14 : 52;
  t.save(); t.shadowColor = T.c; t.shadowBlur = 60; rr(t, x, y, w, h, R);
  const ch = t.createLinearGradient(x, y, x + w, y + h); [['#ffffff', 0], ['#8d94a0', .16], [T.c2, .3], ['#eef1f6', .44], ['#4d535e', .6], [T.m2, .76], ['#f1f4f8', 1]].forEach(([c, o]) => ch.addColorStop(o, c));
  t.fillStyle = ch; t.fill(); t.restore();
  t.save(); rr(t, x + 7, y + 7, w - 14, h - 14, Math.max(8, R - 6)); t.clip();
  const ig = t.createLinearGradient(0, y, 0, y + h); ig.addColorStop(0, T.card1); ig.addColorStop(.75, T.card2); t.fillStyle = ig; t.fillRect(x, y, w, h);
  t.globalAlpha = .22; motif(t, id, T, W, H); t.globalAlpha = 1;          // 票面底紋：同主題圖樣淡淡印在票上
  t.restore();
  // 封面
  const ph = coverPhoto(s); const img = ph && P.url(ph.id) ? await loadImg(P.url(ph.id)) : null;
  const cx0 = x + 36, cy0 = y + 100, cw = w - 72, chh = 540;
  t.save(); rr(t, cx0, cy0, cw, chh, Math.max(8, R - 24)); t.clip();
  if (img) drawCover(t, img, cx0, cy0, cw, chh);
  else {
    t.fillStyle = T.card2; t.fillRect(cx0, cy0, cw, chh);
    [[cx0 + cw * .75, cy0 + chh * .3, T.rgb('m')], [cx0 + cw * .2, cy0 + chh * .85, T.rgb('c')]].forEach(([gx, gy, col]) => { const gr = t.createRadialGradient(gx, gy, 0, gx, gy, 480); gr.addColorStop(0, `rgba(${col},.85)`); gr.addColorStop(1, `rgba(${col},0)`); t.fillStyle = gr; t.fillRect(cx0, cy0, cw, chh); });
    t.fillStyle = 'rgba(255,255,255,.94)'; t.font = `800 84px ${FS.u}`; t.shadowColor = T.c; t.shadowBlur = 24;
    const ls = wrapLines(t, s.artist.toUpperCase(), cw - 80, 3); ls.forEach((l, i) => t.fillText(l, cx0 + 40, cy0 + chh - 44 - (ls.length - 1 - i) * 96)); t.shadowBlur = 0;
  }
  t.restore();
  // 頂列
  t.font = `600 26px ${FS.m}`; t.fillStyle = T.c; t.fillText('NEON//LIVE', x + 40, y + 66);
  t.textAlign = 'right'; t.fillStyle = T.mut; t.fillText(`${name} · No.${s.id.slice(-6).toUpperCase()}`, x + w - 40, y + 66); t.textAlign = 'left';
  // 標題
  let ty = y + 720;
  t.font = `600 30px ${FS.m}`; t.fillStyle = T.c; t.fillText(wrapLines(t, `${CATS[s.cat] || '演唱會'} · ${s.artist}`, w - 80, 1)[0], x + 40, ty);
  t.font = `800 64px ${FS.s}`; t.fillStyle = '#ffffff';
  for (const l of wrapLines(t, s.tour ? `${s.artist} - ${s.tour}` : s.artist, w - 80, 3)) { ty += 78; t.fillText(l, x + 40, ty); }
  // 撕線
  t.setLineDash([18, 14]); t.strokeStyle = 'rgba(255,255,255,.3)'; t.lineWidth = 4; t.beginPath(); t.moveTo(x + 56, cut); t.lineTo(x + w - 56, cut); t.stroke(); t.setLineDash([]);
  // 下半資訊：日期、場館、座位／狀態／評分、條碼
  t.font = `700 80px ${FS.m}`; t.fillStyle = T.y; t.shadowColor = T.y; t.shadowBlur = 18; t.fillText(s.date.replace(/-/g, '.'), x + 40, cut + 110); t.shadowBlur = 0;
  t.font = `600 30px ${FS.m}`; t.fillStyle = T.mut; t.textAlign = 'right'; t.fillText(s.time ? `${s.time} 開演` : '', x + w - 40, cut + 104); t.textAlign = 'left';
  t.font = `700 38px ${FS.s}`; t.fillStyle = '#eef1f6'; t.fillText(wrapLines(t, `◉ ${s.venue || '場館未定'}${s.city ? '・' + s.city : ''}`, w - 80, 1)[0], x + 40, cut + 180);
  const cell = (lx, lab, val) => { t.font = `600 24px ${FS.m}`; t.fillStyle = T.mut; t.fillText(lab, lx, cut + 250); t.font = `700 34px ${FS.s}`; t.fillStyle = '#eef1f6'; t.fillText(wrapLines(t, val || '—', 240, 1)[0] || '—', lx, cut + 296); };
  cell(x + 40, 'SEAT', s.seat); cell(x + 320, 'STATUS', P.STATUS[s.status]); cell(x + 580, 'RATING', s.rating ? '★'.repeat(s.rating) : '—');
  bars(t, x + 40, cut + 350, w - 80, 110, s.id + id, 'rgba(238,241,246,.85)');
  const hol = t.createLinearGradient(0, y, 0, y + h); [T.c, T.m, T.y, T.g, T.c].forEach((c, i) => hol.addColorStop(i / 4, c)); t.fillStyle = hol; t.globalAlpha = .85; t.fillRect(x + w - 18, y + 60, 8, h - 120); t.globalAlpha = 1;
  // 缺口
  t.globalCompositeOperation = 'destination-out'; [x, x + w].forEach((nx) => { t.beginPath(); t.arc(nx, cut, 38, 0, 7); t.fill(); }); t.globalCompositeOperation = 'source-over';
  g.drawImage(L, 0, 0);
  g.font = `600 26px ${FS.m}`; g.fillStyle = 'rgba(255,255,255,.75)'; g.textAlign = 'center'; g.fillText(`${name} EDITION · MY CONCERT LOG`, W / 2, H - 90); g.textAlign = 'left';
  L.width = L.height = 0;
  return toURL(cv, 'image/jpeg', .92);
}

/* ---- 票根選擇器 ----
   12 種樣式不一次全部畫好：每張 1080×1920 解開約 8 MB，全留在畫面上 iPhone 會被關掉。
   只產生目前這張，滑到哪畫到哪；離目前超過一張的圖就釋放。 */
const TV = { id: null, idx: 0, urls: [], styles: [], busy: {} };
const tvTrack = document.getElementById('tvTrack');
async function openTicket(id) {
  closeMenu();
  TV.id = id; TV.busy = {};
  TV.styles = [...TICKETS.map(([k, n]) => ({ k, n })), { k: 'receipt', n: '熱感收據' }, { k: 'cd', n: 'CD 封面' }];
  TV.urls.forEach((u) => u && URL.revokeObjectURL(u)); TV.urls = Array(TV.styles.length).fill('');
  TV.idx = Math.floor(Math.random() * TICKETS.length);         // 隨機套用一種主題風格
  tvTrack.innerHTML = TV.styles.map((st, i) => `<div class="tvs" data-i="${i}"><div class="tvimg"><span>產生中…</span></div><b>${st.n}</b></div>`).join('');
  document.getElementById('ticketView').classList.add('on');
  requestAnimationFrame(() => tvGo(TV.idx, false));
}
async function tvPaint() {
  const id = TV.id, s = P.get(id); if (!s) return;
  for (let i = 0; i < TV.urls.length; i++) {   // 釋放離目前太遠的圖
    const far = Math.min(Math.abs(i - TV.idx), TV.urls.length - Math.abs(i - TV.idx)) > 1;
    if (far && TV.urls[i]) { URL.revokeObjectURL(TV.urls[i]); TV.urls[i] = ''; const box = tvTrack.children[i]?.querySelector('.tvimg'); if (box) box.innerHTML = '<span>產生中…</span>'; }
  }
  const i = TV.idx; if (TV.urls[i] || TV.busy[i]) return;
  TV.busy[i] = true; const st = TV.styles[i];
  const url = st.k === 'receipt' || st.k === 'cd' ? await drawCard(s, st.k) : await drawTicket(s, st.k);
  TV.busy[i] = false;
  if (TV.id !== id || Math.min(Math.abs(i - TV.idx), TV.urls.length - Math.abs(i - TV.idx)) > 1) { URL.revokeObjectURL(url); return; }
  TV.urls[i] = url;
  const box = tvTrack.children[i]?.querySelector('.tvimg'); if (box) box.innerHTML = `<img src="${url}" alt="${esc(s.artist)} 的${st.n}數位票根">`;
  if (i !== TV.idx) tvPaint();
}
function tvGo(i, smooth = true) {
  const n = TV.styles.length; TV.idx = (i + n) % n;
  const el = tvTrack.children[TV.idx]; if (el) tvTrack.scrollTo({ left: el.offsetLeft - (tvTrack.clientWidth - el.offsetWidth) / 2, behavior: smooth ? 'smooth' : 'auto' });
  tvSync();
}
function tvSync() {
  tvPaint();
  document.getElementById('tvCount').textContent = `${TV.idx + 1} / ${TV.styles.length}`;
  document.getElementById('tvDots').innerHTML = TV.styles.map((_, i) => `<i class="${i === TV.idx ? 'on' : ''}"></i>`).join('');
}
tvTrack.addEventListener('scroll', () => {
  const mid = tvTrack.scrollLeft + tvTrack.clientWidth / 2; let best = 0, d = Infinity;
  [...tvTrack.children].forEach((c, i) => { const k = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (k < d) { d = k; best = i; } });
  if (best !== TV.idx) { TV.idx = best; tvSync(); }
}, { passive: true });
const tvName = () => `${P.get(TV.id).artist}-${TV.styles[TV.idx].n}.jpg`;
async function tvFile() { if (!TV.urls[TV.idx]) { P.toast('還在產生，請稍等'); return null; } const b = await (await fetch(TV.urls[TV.idx])).blob(); return new File([b], tvName(), { type: 'image/jpeg' }); }
document.getElementById('tvPrev').addEventListener('click', () => tvGo(TV.idx - 1));
document.getElementById('tvNext').addEventListener('click', () => tvGo(TV.idx + 1));
document.getElementById('tvRand').addEventListener('click', () => { let i; do i = Math.floor(Math.random() * TICKETS.length); while (i === TV.idx); tvGo(i); });
document.getElementById('tvClose').addEventListener('click', () => {
  TV.id = null; TV.urls.forEach((u) => u && URL.revokeObjectURL(u)); TV.urls = []; tvTrack.innerHTML = '';   // 關閉就把圖全部釋放
  document.getElementById('ticketView').classList.remove('on');
});
document.getElementById('tvSave').addEventListener('click', async () => {
  const f = await tvFile(); if (!f) return;
  if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f] }); return; } catch (err) { if (err.name === 'AbortError') return; } }   // iPhone 分享選單裡選「儲存影像」
  const a = document.createElement('a'); a.href = TV.urls[TV.idx]; a.download = tvName(); a.click(); P.toast('圖片已儲存');
});
document.getElementById('tvShare').addEventListener('click', async () => {
  const f = await tvFile(); if (!f) return;
  if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title: P.get(TV.id).artist }); } catch (err) { /* 取消 */ } }
  else { const a = document.createElement('a'); a.href = TV.urls[TV.idx]; a.download = tvName(); a.click(); P.toast('此瀏覽器不支援分享，已改為下載'); }
});

