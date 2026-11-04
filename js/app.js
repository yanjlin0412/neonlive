const { esc } = P;

/* ================= 票價計算 ================= */
const RATE = { TWD: 1, JPY: 0.21, KRW: 0.023, USD: 32, HKD: 4.1 };   // 約略匯率，換算為台幣
const subtotal = (s) => (s.price || 0) * (s.qty || 1) + (s.fee || 0);      // 原幣別
const twd = (s) => Math.round(subtotal(s) * (RATE[s.cur] || 1));           // 換算台幣
const money = (n) => 'TWD ' + Math.round(n).toLocaleString();
function ledger() {
  const paid = P.shows.filter((s) => s.price && (s.status === 'attended' || s.status === 'going'));
  const att = paid.filter((s) => s.status === 'attended');
  const thisYear = P.today.slice(0, 4);
  const total = att.reduce((t, s) => t + twd(s), 0);
  const committed = paid.filter((s) => s.status === 'going').reduce((t, s) => t + twd(s), 0);
  const songs = att.reduce((t, s) => t + P.songs(s), 0);
  const byYear = {}, byArtist = {};
  for (const s of att) { const y = s.date.slice(0, 4); byYear[y] = (byYear[y] || 0) + twd(s); byArtist[s.artist] = (byArtist[s.artist] || 0) + twd(s); }
  const top = [...att].sort((a, b) => twd(b) - twd(a))[0];
  return {
    total, committed, tickets: att.reduce((t, s) => t + (s.qty || 1), 0),
    year: paid.filter((s) => s.date.startsWith(thisYear)).reduce((t, s) => t + twd(s), 0),
    avg: att.length ? total / att.length : 0, perSong: songs ? total / songs : 0, top,
    years: Object.keys(byYear).sort().map((y) => [y, byYear[y]]),
    artists: Object.entries(byArtist).sort((a, b) => b[1] - a[1])
  };
}
const form = document.getElementById('addf');
function calc() {
  const p = Number(form.price.value) || 0, q = Math.max(1, Number(form.qty.value) || 1), f = Number(form.fee.value) || 0, c = form.cur.value;
  const sub = p * q + f;
  document.getElementById('calc').innerHTML = `${c} ${p.toLocaleString()} × ${q} 張 + 手續費 ${f.toLocaleString()}<b>= ${c} ${sub.toLocaleString()}</b>${c !== 'TWD' ? `約 ${money(sub * RATE[c])}` : ''}${q > 1 ? `<span style="display:block">每人平均 ${c} ${Math.round(sub / q).toLocaleString()}</span>` : ''}`;
}
form.addEventListener('input', calc);
form.addEventListener('reset', () => setTimeout(calc));
calc();

/* ================= 10 種背景（全部靜態：動畫與模糊會吃 iPhone 的圖層記憶體） ================= */
const BGS = [
  { id: 'aurora', name: '液態極光', html: '<i></i><i></i><i></i>', prev: 'radial-gradient(60% 60% at 20% 30%,var(--c),transparent 70%),radial-gradient(60% 60% at 80% 60%,var(--m),transparent 70%),radial-gradient(50% 50% at 40% 100%,var(--v),transparent 70%),var(--base)' },
  { id: 'grid', name: '霓虹網格', html: '<div class="sun"></div><div class="hz"></div><div class="floor"></div>', prev: 'linear-gradient(180deg,#120726 0 55%,transparent 55%),repeating-linear-gradient(90deg,rgba(var(--m-rgb),.8) 0 2px,transparent 2px 16px),repeating-linear-gradient(0deg,rgba(var(--c-rgb),.7) 0 2px,transparent 2px 12px),#05040f' },
  { id: 'prism', name: '全息稜鏡', html: '<div class="foil"></div><div class="sheen"></div>', prev: 'linear-gradient(115deg,transparent 35%,rgba(255,255,255,.3) 50%,transparent 65%),conic-gradient(var(--c),var(--v),var(--m),var(--y),var(--g),var(--c))' },
  { id: 'space', name: '星塵深空', html: '<div class="st s1"></div><div class="st s2"></div><div class="st s3"></div>', prev: 'radial-gradient(1px 1px at 20% 30%,#fff,transparent),radial-gradient(1px 1px at 70% 20%,#fff,transparent),radial-gradient(2px 2px at 40% 70%,#fff,transparent),radial-gradient(1px 1px at 85% 75%,#fff,transparent),radial-gradient(60% 50% at 70% 30%,rgba(var(--v-rgb),.6),transparent 70%),#03040a' },
  { id: 'wave', name: '音波脈衝', html: '<canvas></canvas>', prev: 'repeating-radial-gradient(ellipse at 50% 120%,transparent 0 10px,rgba(var(--c-rgb),.5) 10px 12px,transparent 12px 22px,rgba(var(--m-rgb),.5) 22px 24px),#0a0618' },
  { id: 'mercury', name: '液態水銀', html: '<i></i><i></i><i></i><i></i><i></i>', prev: 'radial-gradient(circle at 30% 35%,#fff 0,#c9ced6 12%,#5d636e 30%,transparent 42%),radial-gradient(circle at 75% 70%,#eef1f6 0,#8d94a0 10%,#2a2d35 24%,transparent 34%),#0b0c10' },
  { id: 'laser', name: '雷射光束', html: '<div class="haze"></div><div class="beam"></div><div class="beam"></div><div class="beam"></div><div class="beam"></div><div class="beam"></div><div class="beam"></div>', prev: 'conic-gradient(from 300deg at 50% 110%,transparent 0 8deg,var(--c) 9deg 10deg,transparent 11deg 28deg,var(--m) 29deg 30deg,transparent 31deg 50deg,var(--c) 51deg 52deg,transparent 53deg 72deg,var(--m) 73deg 74deg,transparent 75deg),#050205' },
  { id: 'spot', name: '舞台聚光', html: '<div class="cone"></div><div class="cone"></div><div class="cone"></div><div class="dust"></div>', prev: 'conic-gradient(from 165deg at 30% -10%,transparent 0 8deg,rgba(var(--c-rgb),.6) 10deg 22deg,transparent 24deg),conic-gradient(from 160deg at 75% -10%,transparent 0 10deg,rgba(var(--y-rgb),.55) 12deg 26deg,transparent 28deg),#0b0805' },
  { id: 'circuit', name: '電路脈絡', html: '<svg></svg>', prev: 'linear-gradient(90deg,transparent 30%,var(--c) 30% 31%,transparent 31%),linear-gradient(0deg,transparent 55%,rgba(var(--c-rgb),.6) 55% 56.5%,transparent 56.5%),linear-gradient(90deg,transparent 70%,var(--m) 70% 71%,transparent 71%),#030a0b' },
  { id: 'stick', name: '螢光人海', html: '<canvas></canvas>', prev: 'repeating-linear-gradient(80deg,transparent 0 14px,var(--c) 14px 16px,transparent 16px 30px,var(--m) 30px 32px,transparent 32px 44px),linear-gradient(transparent 50%,#0a0412 50%),#0a0412' }
];
const motionOK = !matchMedia('(prefers-reduced-motion: reduce)').matches;
let bgId = (() => { try { return localStorage.getItem('neon-bg') || 'aurora'; } catch { return 'aurora'; } })();
function stars(n, spread) { let s = []; for (let i = 0; i < n; i++) s.push(`${Math.random() * 430 | 0}px ${Math.random() * spread | 0}px rgba(255,255,255,${(0.4 + Math.random() * 0.6).toFixed(2)})`); return s.join(','); }
function setBg(id) {
  bgId = id; try { localStorage.setItem('neon-bg', id); } catch {}
  const b = BGS.find((x) => x.id === id) || BGS[0];
  const el = document.getElementById('bg'); el.className = 'bg ' + b.id; el.innerHTML = b.html;
  document.querySelector('.app').dataset.theme = b.id;
  const meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.content = getComputedStyle(document.querySelector('.app')).getPropertyValue('--base').trim();
  if (b.id === 'space') { el.querySelector('.s1').style.boxShadow = stars(260, 1000); el.querySelector('.s2').style.boxShadow = stars(90, 1000); el.querySelector('.s3').style.boxShadow = stars(30, 1200); }
  if (b.id === 'wave') wave(el.querySelector('canvas'));
  if (b.id === 'stick') sticks(el.querySelector('canvas'));
  if (b.id === 'circuit') circuit(el.querySelector('svg'));
  document.querySelectorAll('#bgpick button').forEach((x) => x.setAttribute('aria-pressed', x.dataset.bg === id));
}
function wave(cv) {
  const ctx = cv.getContext('2d'); const dpr = Math.min(devicePixelRatio || 1, 2);
  const size = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; };
  size();
  const css = getComputedStyle(document.querySelector('.app'));
  const col = (k) => css.getPropertyValue(k).trim();
  const lines = [{ c: col('--c-rgb'), a: 90, f: 0.011, s: 0.0016, y: 0.42 }, { c: col('--m-rgb'), a: 120, f: 0.008, s: -0.0012, y: 0.5 }, { c: col('--v-rgb'), a: 70, f: 0.016, s: 0.002, y: 0.58 }, { c: col('--y-rgb'), a: 40, f: 0.021, s: -0.0024, y: 0.46 }, { c: col('--c-rgb'), a: 30, f: 0.03, s: 0.003, y: 0.9 }, { c: col('--m-rgb'), a: 24, f: 0.025, s: -0.0026, y: 0.93 }];
  const draw = (t) => {
    if (cv.width !== cv.clientWidth * dpr) size();
    const W = cv.width / dpr, H = cv.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    for (const L of lines) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 4) {
        const env = 0.35 + 0.65 * Math.sin((x / W) * Math.PI);  // 兩端略收斂
        const y = H * L.y + Math.sin(x * L.f + t * L.s) * L.a * env + Math.sin(x * L.f * 2.3 - t * L.s * 1.7) * L.a * 0.35 * env;
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = `rgba(${L.c},.85)`; ctx.lineWidth = 2; ctx.shadowColor = `rgba(${L.c},1)`; ctx.shadowBlur = 16; ctx.stroke();
    }
    ctx.shadowBlur = 0;
  };
  draw(0);
}
// 螢光棒人海：前後三排觀眾揮舞螢光棒
function sticks(cv) {
  const ctx = cv.getContext('2d'); const dpr = Math.min(devicePixelRatio || 1, 2);
  const size = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; };
  size();
  const css = getComputedStyle(document.querySelector('.app')); const cols = ['--c-rgb', '--m-rgb', '--y-rgb', '--v-rgb'].map((k) => css.getPropertyValue(k).trim());
  const rows = [{ y: .66, n: 9, len: 34, w: 4, a: .45 }, { y: .78, n: 7, len: 46, w: 5, a: .7 }, { y: .92, n: 5, len: 62, w: 7, a: 1 }];
  const fans = rows.flatMap((r, ri) => Array.from({ length: r.n }, (_, i) => ({ ...r, x: (i + .5 + (ri % 2) * .35) / r.n, ph: Math.random() * 6, sp: .0018 + Math.random() * .0012, c: cols[(i + ri) % cols.length] })));
  const draw = (t) => {
    if (cv.width !== cv.clientWidth * dpr) size();
    const W = cv.width / dpr, H = cv.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineCap = 'round';
    for (const f of fans) {
      const bx = f.x * W, by = f.y * H, ang = Math.sin(t * f.sp + f.ph) * .55;
      const tx = bx + Math.sin(ang) * f.len, ty = by - Math.cos(ang) * f.len;
      ctx.strokeStyle = `rgba(${f.c},${f.a})`; ctx.lineWidth = f.w; ctx.shadowColor = `rgba(${f.c},1)`; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.ellipse(bx, by + f.len * .55, f.len * .32, f.len * .42, 0, 0, Math.PI * 2); ctx.fill();   // 觀眾剪影
    }
  };
  draw(0);
}
// 電路脈絡：隨機產生直角走線
function circuit(svg) {
  const W = 430, H = 930; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  let paths = '', nodes = '';
  for (let i = 0; i < 16; i++) {
    let x = Math.round(Math.random() * W / 20) * 20, y = Math.round(Math.random() * H / 20) * 20; let d = `M${x} ${y}`;
    for (let k = 0; k < 5; k++) { if (k % 2) y += (Math.random() < .5 ? -1 : 1) * (60 + Math.random() * 160 | 0); else x += (Math.random() < .5 ? -1 : 1) * (40 + Math.random() * 120 | 0); d += ` L${x} ${y}`; }
    paths += `<path class="base" d="${d}"/><path class="pulse${i % 3 === 0 ? ' o' : ''}" d="${d}" style="animation-delay:${(-Math.random() * 5).toFixed(2)}s;animation-duration:${(3 + Math.random() * 4).toFixed(2)}s"/>`;
    nodes += `<circle cx="${x}" cy="${y}" r="4"/>`;
  }
  svg.innerHTML = paths + nodes;
}
document.getElementById('bgpick').innerHTML = BGS.map((b) => `<button data-bg="${b.id}" data-theme="${b.id}" style="background:${b.prev}" aria-pressed="false">${b.name}<span class="sw3"><i style="background:var(--c)"></i><i style="background:var(--m)"></i><i style="background:var(--y)"></i></span></button>`).join('');
document.getElementById('bgpick').addEventListener('click', (e) => { const b = e.target.closest('[data-bg]'); if (b) setBg(b.dataset.bg); });
document.getElementById('cycleBg').addEventListener('click', () => { const i = BGS.findIndex((b) => b.id === bgId); const nx = BGS[(i + 1) % BGS.length]; setBg(nx.id); P.toast(`背景：${nx.name}`); });
document.getElementById('rates').innerHTML = Object.entries(RATE).filter(([k]) => k !== 'TWD').map(([k, v]) => `1 ${k} ≈ ${v} TWD`).join('<br>');
setBg(bgId);

const ymd = (d) => `${d.getFullYear()}-${P.pad(d.getMonth() + 1)}-${P.pad(d.getDate())}`;

/* ================= 上傳照片當封面 ================= */
const coverPhoto = (s) => s.photos.find((x) => x.cover) || s.photos.find((x) => x.kind === 'live') || s.photos[0];
const ART = {
  c: 'radial-gradient(60% 70% at 75% 25%,rgba(var(--m-rgb),.75),transparent 60%),radial-gradient(60% 70% at 15% 85%,rgba(var(--c-rgb),.6),transparent 60%),#0b0d18',
  m: 'radial-gradient(60% 70% at 25% 25%,rgba(var(--c-rgb),.7),transparent 60%),radial-gradient(60% 70% at 85% 85%,rgba(var(--m-rgb),.7),transparent 60%),#0b0d18',
  y: 'radial-gradient(60% 70% at 70% 30%,rgba(var(--y-rgb),.45),transparent 60%),radial-gradient(60% 70% at 20% 80%,rgba(var(--m-rgb),.55),transparent 60%),#0b0d18'
};
const cover = (s) => { const p = coverPhoto(s); return p && P.thumb(p.id) ? `url('${P.thumb(p.id)}') center/cover no-repeat` : ART[s.hue] || ART.c; };   // 畫面上一律用縮圖
const setCover = (s, pid) => s.photos.forEach((x) => { x.cover = x.id === pid; });
const coverIn = document.getElementById('coverIn'), coverPv = document.getElementById('coverPv');
// 選好就先壓縮，預覽也用壓縮後的小圖：直接拿原檔當背景，iPhone 會把 4800 萬畫素整張解開，App 會被系統關掉、回到首頁
let coverBlob = null;
coverIn.addEventListener('change', async () => {
  const f = coverIn.files[0]; coverIn.value = ''; if (!f) return;
  coverPv.textContent = '…';
  const b = await compress(f);
  if (!b) { coverPv.textContent = coverBlob ? '' : '＋'; P.toast('這張照片無法讀取'); return; }
  coverBlob = b; coverPv.style.backgroundImage = `url('${URL.createObjectURL(b)}')`; coverPv.textContent = '';
});
form.addEventListener('reset', () => { coverBlob = null; coverPv.style.backgroundImage = ''; coverPv.textContent = '＋'; });

/* ================= 搶票狀態 ================= */
const FLOW = ['wish', 'presale', 'going', 'attended'];
const FLOW_ZH = ['想看', '等開賣', '已購票', '已參加'];
const ST = { attended: 'g', going: 'c', wish: 'm', presale: 'y' };
function saleText(s) {
  if (!s.sale) return { t: '尚未設定開賣時間', live: false };
  let ms = new Date(s.sale) - new Date();
  if (ms <= 0) return { t: '● 開賣中！快去搶票', live: true };
  const d = Math.floor(ms / 864e5); ms -= d * 864e5;
  const h = Math.floor(ms / 36e5); ms -= h * 36e5;
  const m = Math.floor(ms / 6e4), sec = Math.floor((ms % 6e4) / 1e3);
  return { t: `開賣倒數 ${d} 天 ${P.pad(h)}:${P.pad(m)}:${P.pad(sec)}`, live: false };
}
const saleWhen = (s) => s.sale ? s.sale.replace('T', ' ').replace(/-/g, '.') : '未設定';
async function advance(id, status) {
  const s = P.get(id); s.status = status; await P.save(s);
  P.toast({ going: '恭喜搶到票！已移到即將前往', wish: '下次一定搶到，已移回想看', presale: '已設為等開賣', attended: '已標記為參加過' }[status]);
  render(); if (document.querySelector('.screen.on')?.dataset.screen === 'detail') detail(id);
}

/* ================= 加入行事曆（.ics） ================= */
function stamp(date, time, addMin = 0) {
  const d = new Date(`${date}T${time || '19:00'}`); d.setMinutes(d.getMinutes() + addMin);
  return `${d.getFullYear()}${P.pad(d.getMonth() + 1)}${P.pad(d.getDate())}T${P.pad(d.getHours())}${P.pad(d.getMinutes())}00`;
}
function ics(s, kind) {
  const sale = kind === 'sale';
  const [date, time] = sale ? s.sale.split('T') : [s.date, s.time || '19:00'];
  const e = (t) => String(t || '').replace(/([\\,;])/g, '\\$1').replace(/\n/g, '\\n');
  const alarm = (trigger, text) => ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${e(text)}`, `TRIGGER:${trigger}`, 'END:VALARM'];
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NEON LIVE//ZH-TW', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:${s.id}-${kind}@neonlive`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART:${stamp(date, time)}`, `DTEND:${stamp(date, time, sale ? 30 : 180)}`,
    `SUMMARY:${e(sale ? `【開賣】${s.artist}` : `演唱會｜${s.artist}`)}`,
    `LOCATION:${e(s.venue)}`,
    `DESCRIPTION:${e([s.tour, s.seat && '座位：' + s.seat, s.notes].filter(Boolean).join('\n'))}`,
    ...(sale ? [...alarm('-PT30M', `${s.artist} 30 分鐘後開賣`), ...alarm('-PT5M', `${s.artist} 5 分鐘後開賣`)]
      : [...alarm('-P1D', `明天：${s.artist}`), ...alarm('-PT3H', `${s.artist} 3 小時後開演`)]),
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}
function addToCalendar(id, kind) {
  const s = P.get(id);
  if (kind === 'sale' && !s.sale) { P.toast('請先設定開賣時間'); return; }
  const text = ics(s, kind);
  const iOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (iOS) { location.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(text); return; }   // Safari 會跳出「加入行事曆」
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/calendar' }));
  a.download = `${s.artist}-${kind === 'sale' ? '開賣提醒' : '演出'}.ics`; a.click();
  P.toast(kind === 'sale' ? '已產生開賣提醒（開賣前 30 分、5 分）' : '已產生行事曆（前一天、開演前 3 小時提醒）');
}

/* ================= 畫面 ================= */
let refresh, cdT, filter = 'all', stab = 'money', view = 'list', calMonth = P.today.slice(0, 7), selDay = null;
function render() {
  const n = P.next();
  document.getElementById('cdwrap').innerHTML = n ? `<button class="cdbar edge" data-open="${n.id}"><span class="in"><span style="flex:1;min-width:0"><span class="mono m" style="display:block;font-size:10px;letter-spacing:.2em">▶ NEXT TARGET</span><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(n.artist)}</b></span><span class="cd" id="cd"></span></span></button>` : '';
  clearInterval(cdT);
  if (n) cdT = P.everySecond(() => { const c = P.countdown(n), el = document.getElementById('cd'); if (el) el.innerHTML = `<span><b>${c.d}</b><small>天</small></span><i>:</i><span><b>${c.h}</b><small>時</small></span><i>:</i><span><b>${c.m}</b><small>分</small></span>`; });
  renderTodo();
  const L = ledger();
  document.getElementById('money').innerHTML = `<span><small>今年票券</small><b>${Math.round(L.year).toLocaleString()}</b></span><span><small>平均每場</small><b>${Math.round(L.avg).toLocaleString()}</b></span><span><small>每首歌</small><b>${Math.round(L.perSong).toLocaleString()}</b></span>`;
  const tl = P.list().filter((s) => s.status === 'going' || s.status === 'attended').reverse();   // 依日期由舊到新排
  document.getElementById('track').innerHTML = tl.map((s) => { const p = P.parts(s.date); return `
    <button class="tk" data-open="${s.id}" aria-label="${esc(s.artist)}"><span class="in">
      <span class="art" style="background:${cover(s)}"><span class="st ${ST[s.status]}">${P.STATUS_EN[s.status]}</span>${s.price ? `<span class="px">${money(twd(s))}</span>` : ''}<span class="day">${p.d}<small>${p.y}年${p.mon} 週${p.wk}</small></span></span>
      <span class="tear"></span>
      <span class="mt"><span class="ar">${esc(s.artist)}</span><span style="font-size:13px;color:var(--mut)">${esc(s.tour)}</span><span class="mono" style="font-size:12px;color:#c7d2e6;margin-top:4px">◉ ${esc(s.venue)}${s.seat ? ' · ' + esc(s.seat) : ''}</span></span>
      <span class="ft"><span class="mono y" style="font-size:13px;letter-spacing:1px">${s.rating ? P.stars(s.rating) : s.status === 'presale' ? '等開賣' : s.status === 'attended' ? '尚未評分' : 'T−' + +P.countdown(s).d + ' DAYS'}</span><span class="bc"></span></span>
      <span class="holo"></span></span></button>`; }).join('');
  const track = document.getElementById('track');
  const now = (i => track.children[i < 0 ? tl.length - 1 : i])(tl.findIndex((s) => s.date >= P.today));   // 一打開就停在最近的一場
  if (now) requestAnimationFrame(() => { track.scrollLeft = now.offsetLeft - (track.clientWidth - now.offsetWidth) / 2; refresh(); });
  refresh = P.coverflow(track, document.getElementById('dots'));
  document.getElementById('homeEmpty').innerHTML = document.getElementById('track').children.length ? '' : `<div class="glass" style="margin-top:18px;text-align:center;padding:26px 18px"><div class="kick" style="color:var(--m2)">NO DATA // 記憶體空白</div><p style="color:#c7d2e6;line-height:1.7">記錄你的第一場演唱會，<br>或先載入範例資料看看效果。</p><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="cbtn" data-new>＋ 新增演唱會</button><button class="chipbtn" data-demo style="min-height:44px">載入範例</button></div></div>`;
  renderArchive(); renderStats(); storageInfo();
}
function renderTodo() {
  const list = P.shows.filter((s) => s.status === 'presale').sort((a, b) => (a.sale || '9').localeCompare(b.sale || '9'));
  document.getElementById('todo').innerHTML = list.length ? `<div class="todo edge"><div class="in"><div class="kick" style="color:var(--y)">搶票待辦 · ${list.length}</div>${list.map((s) => `
    <div class="it"><button class="t" data-open="${s.id}"><b>${esc(s.artist)}</b><span class="cdn" data-sale="${s.id}"></span></button>
      <button class="chipbtn" data-ics="${s.id}:sale" aria-label="把 ${esc(s.artist)} 的開賣時間加入行事曆">提醒我</button>
      <button class="chipbtn solid" data-advance="${s.id}:going">搶到了</button></div>`).join('')}</div></div>` : '';
  tickSale();
}
const tickSale = () => document.querySelectorAll('[data-sale]').forEach((el) => { const s = P.get(el.dataset.sale); if (!s) return; const r = saleText(s); el.textContent = r.t; el.classList.toggle('live', r.live); });
setInterval(tickSale, 1000);

const row = (s) => { const p = P.parts(s.date); return `
    <button class="row" data-open="${s.id}"><span class="in"><span class="sw"><b class="${ST[s.status]}">${p.d}</b><small>${p.yy}年${p.mon}</small></span><span class="tx"><b>${esc(s.artist)}</b><span>${s.cat !== 'concert' ? CATS[s.cat] + ' · ' : ''}${s.status === 'presale' ? '開賣 ' + saleWhen(s) : esc(s.venue || P.STATUS[s.status])}${s.qty > 1 ? ` · ${s.qty} 張` : ''}</span></span><span class="pr">${s.price ? Math.round(twd(s)).toLocaleString() : '—'}</span></span></button>`; };
const tile = (s) => { const p = P.parts(s.date); return `
    <button class="tile" data-open="${s.id}"><span class="in"><span class="cv" style="background:${cover(s)}"><b>${p.d}</b></span><span class="tt">${esc(s.artist)}<small>${CATS[s.cat]} · ${P.STATUS[s.status]}</small></span></span></button>`; };
function renderCal(list) {
  const [y, m] = calMonth.split('-').map(Number);
  const start = new Date(y, m - 1, 1); start.setDate(1 - start.getDay());
  const byDay = {}, sales = {};
  for (const s of list) { (byDay[s.date] ||= []).push(s); if (s.sale && s.status === 'presale') (sales[s.sale.slice(0, 10)] ||= []).push(s); }
  let cells = '';
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i); const iso = ymd(d); const ss = byDay[iso] || [];
    if (i === 35 && d.getMonth() !== m - 1) break;   // 最後一列全在下個月就不畫
    cells += `<button class="d${d.getMonth() !== m - 1 ? ' out' : ''}${iso === P.today ? ' today' : ''}${ss.length ? ' has' : ''}${iso === selDay ? ' sel' : ''}" data-day="${iso}" ${ss.length ? `style="background:${cover(ss[0])}"` : ''} aria-label="${iso}${ss.length ? '：' + esc(ss.map((s) => s.artist).join('、')) : ''}${sales[iso] ? '，開賣日' : ''}">${d.getDate()}${ss.length > 1 ? `<span class="n">+${ss.length - 1}</span>` : ''}${sales[iso] ? '<span class="sale"></span>' : ''}</button>`;
  }
  const inMonth = list.filter((s) => s.date.startsWith(calMonth) || (s.sale && s.sale.startsWith(calMonth) && s.status === 'presale'));
  const picked = selDay ? [...new Set([...(byDay[selDay] || []), ...(sales[selDay] || [])])] : inMonth;
  return `<div class="cal"><div class="mh"><button class="knob" data-cal="-1" aria-label="上個月"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eef1f6" stroke-width="2.2" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg></button><b>${y} 年 ${m} 月</b><button class="knob" data-cal="1" aria-label="下個月"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eef1f6" stroke-width="2.2" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button></div>
    <div class="wk" aria-hidden="true">${[...'日一二三四五六'].map((w) => `<span>${w}</span>`).join('')}</div><div class="days">${cells}</div>
    <div class="legend"><span><i style="background:linear-gradient(135deg,var(--c),var(--m))"></i>演出（顯示封面）</span><span><i style="background:var(--y);border-radius:5px"></i>開賣日</span></div></div>
    <div class="kick" style="margin:4px 20px 10px">${selDay ? selDay.replace(/-/g, '.') + ' 的行程' : `${m} 月行程 · ${picked.length}`}</div>${picked.map(row).join('') || '<div class="empty">這段時間沒有行程</div>'}`;
}
function renderArchive() {
  const list = P.list(filter, document.getElementById('q').value).filter(catHit);
  const el = document.getElementById('alist');
  renderCatSeg();
  if (view === 'cal') el.innerHTML = renderCal(list);
  else if (view === 'tiles') el.innerHTML = list.length ? `<div class="tiles">${list.map(tile).join('')}</div>` : '<div class="glass">0 RESULTS</div>';
  else el.innerHTML = list.map(row).join('') || '<div class="glass">0 RESULTS</div>';
}
function renderStatsCore() {
  const body = document.getElementById('sbody');
  if (stab === 'money') {
    const L = ledger(); const ymax = Math.max(1, ...L.years.map((y) => y[1])); const amax = Math.max(1, ...L.artists.map((a) => a[1]));
    body.innerHTML = `
      <div class="glass"><div class="lbl">已看演出的票券總花費</div><div class="big y">${money(L.total)}</div><div class="lbl" style="margin-top:4px">共 ${L.tickets} 張票（含手續費，外幣以約略匯率換算）</div></div>
      <div class="glass g2">
        <div><div class="lbl">今年（含已購票）</div><div class="mono" style="font-size:18px;font-weight:600">${money(L.year)}</div></div>
        <div><div class="lbl">已購票未看</div><div class="mono c" style="font-size:18px;font-weight:600">${money(L.committed)}</div></div>
        <div><div class="lbl">平均每場</div><div class="mono" style="font-size:18px;font-weight:600">${money(L.avg)}</div></div>
        <div><div class="lbl">每首現場歌曲</div><div class="mono m" style="font-size:18px;font-weight:600">${money(L.perSong)}</div></div>
      </div>
      ${L.top ? `<button class="glass" data-open="${L.top.id}" style="display:block;width:calc(100% - 40px);text-align:left"><div class="lbl">最貴的一場</div><b>${esc(L.top.artist)}</b><div class="mono y">${money(twd(L.top))}</div></button>` : ''}
      <div class="glass"><div class="kick" style="margin-bottom:10px">每年花費</div><div class="vbars">${L.years.map(([y, v]) => `<div><span style="color:#eef1f6">${(v / 1000).toFixed(1)}k</span><i style="height:${v / ymax * 100}%;background:linear-gradient(to top,rgba(var(--y-rgb),.25),var(--y));box-shadow:0 0 12px rgba(var(--y-rgb),.4)"></i>${y}</div>`).join('')}</div></div>
      <div class="glass"><div class="kick" style="margin-bottom:6px">各藝人花費</div>${L.artists.slice(0, 5).map(([a, v]) => `<button data-artist="${esc(a)}" style="display:block;width:100%;text-align:left;margin:10px 0;min-height:44px"><div style="display:flex;justify-content:space-between;font-size:14px"><span>${esc(a)} ›</span><span class="mono" style="color:var(--mut)">${Math.round(v).toLocaleString()}</span></div><div class="meter gold"><i style="width:${v / amax * 100}%"></i></div></button>`).join('')}</div>`;
  } else {
    const st = P.stats(); const max = Math.max(...st.topArtists.map((a) => a[1])); const ymax = Math.max(...st.years.map((y) => y[1]));
    body.innerHTML = `
      <div class="glass g2"><div><div class="big c">${st.total}</div><div class="lbl">已參加場次</div></div><div><div class="big y">${st.avg}</div><div class="lbl">平均評分</div></div><div><div class="big m">${st.songs}</div><div class="lbl">現場聽過的歌</div></div><div><div class="big g">${st.venues.length}</div><div class="lbl">場館</div></div></div>
      <div class="glass"><div class="kick" style="margin-bottom:10px">每年場次</div><div class="vbars">${st.years.map(([y, v]) => `<div><span style="color:#eef1f6">${v}</span><i style="height:${v / ymax * 100}%;background:linear-gradient(to top,rgba(var(--m-rgb),.3),var(--m));box-shadow:0 0 12px rgba(var(--m-rgb),.5)"></i>${y}</div>`).join('')}</div></div>
      <div class="glass"><div class="kick" style="margin-bottom:6px">最常看的藝人</div>${st.topArtists.slice(0, 4).map(([a, v]) => `<button data-artist="${esc(a)}" style="display:block;width:100%;text-align:left;margin:10px 0;min-height:44px"><div style="display:flex;justify-content:space-between;font-size:14px"><span>${esc(a)} ›</span><span class="mono" style="color:var(--mut)">${v}</span></div><div class="meter"><i style="width:${v / max * 100}%"></i></div></button>`).join('')}</div>`;
  }
}

/* ================= 詳情：資訊／歌單／照片／花費 ================= */
let dtab = 'info', dId = null;
const KINDS = [['seat', '座位視角'], ['live', '現場'], ['stub', '實體票根']];
function detail(id) {
  if (id !== dId) { dtab = 'info'; dId = id; }
  const s = P.get(id); const songs = P.songs(s); let n = 0;
  const idx = FLOW.indexOf(s.status); const c = s.cur || 'TWD';
  const tabs = [['info', '資訊'], ['set', '歌單'], ['photo', `照片${s.photos.length ? ' ' + s.photos.length : ''}`], ['money', '花費']];
  let body = '';
  if (dtab === 'info') {
    body = `<div class="steps" aria-label="票券進度：${FLOW_ZH[idx]}">${FLOW.map((k, i) => `<div class="s ${i <= idx ? 'done' : ''} ${i === idx ? 'cur' : ''}"><i></i>${FLOW_ZH[i]}</div>`).join('')}</div>
      ${s.status === 'presale' ? `<div class="salebox"><div class="lbl">開賣時間 ${saleWhen(s)}</div><span class="cdn" style="font-size:15px;margin-top:2px" data-sale="${s.id}"></span></div>` : ''}
      <div class="acts">${{
        wish: `<button class="chipbtn solid" data-advance="${s.id}:presale">我要搶票</button>`,
        presale: `<button class="chipbtn solid" data-advance="${s.id}:going">搶到了！</button><button class="chipbtn warn" data-advance="${s.id}:wish">沒搶到</button><button class="chipbtn" data-ics="${s.id}:sale">開賣提醒加入行事曆</button>`,
        going: `<button class="chipbtn solid" data-ics="${s.id}:show">加入行事曆</button><button class="chipbtn" data-advance="${s.id}:attended">看完了，標記已參加</button>`,
        attended: `<button class="chipbtn" data-ics="${s.id}:show">加入行事曆</button>`
      }[s.status]}</div>
      <div class="edge" style="margin:12px 16px 0"><dl class="facts"><div><dt>VENUE</dt><dd>${esc(s.venue || '—')}</dd></div><div><dt>SEAT</dt><dd>${esc(s.seat || '—')}</dd></div><div><dt>RATING</dt><dd class="y">${s.rating ? P.stars(s.rating) : '—'}</dd></div><div><dt>DATE</dt><dd>${s.date.replace(/-/g, '.')}</dd></div><div><dt>TIME</dt><dd>${s.time || '—'}</dd></div><div><dt>WITH</dt><dd>${esc(s.with || '—')}</dd></div></dl></div>
      ${s.notes ? `<div class="glass" style="margin:12px 16px 0">${esc(s.notes)}</div>` : ''}`;
  } else if (dtab === 'set') {
    body = songs ? `<div class="sl">${s.setlist.map((t) => `<div><span class="c">${P.pad(++n)}</span>${esc(t)}</div>`).join('')}${s.encore.length ? `<div class="h">// ENCORE</div>` + s.encore.map((t) => `<div><span class="m">${P.pad(++n)}</span>${esc(t)}</div>`).join('') : ''}</div>` : '<div class="empty">還沒有歌單，看完演出再補上吧</div>';
  } else if (dtab === 'photo') {
    body = KINDS.map(([k, name]) => { const list = s.photos.filter((x) => x.kind === k); return `<div class="ph-sec"><div class="kick">${name} · ${list.length}</div><div class="ph-grid">${list.map((x) => `
      <div class="ph" style="background-image:url('${P.thumb(x.id)}')"><button class="open" data-photo="${P.url(x.id)}" aria-label="放大照片"></button><button class="x" data-rmphoto="${x.id}" aria-label="刪除照片">×</button><button class="cv ${coverPhoto(s) === x ? 'on' : ''}" data-setcover="${x.id}">${coverPhoto(s) === x ? '封面' : '設為封面'}</button></div>`).join('')}
      <label class="addph" aria-label="新增${name}照片">＋<small>新增</small><input type="file" accept="image/*" multiple hidden data-addphoto="${k}"></label></div></div>`; }).join('');
  } else {
    body = s.price ? `<div class="receipt" aria-label="票價明細"><div class="kick" style="color:var(--y);margin-bottom:6px">票價明細 RECEIPT</div>
      <div class="ln"><span>單價</span><span>${c} ${s.price.toLocaleString()}</span></div><div class="ln"><span>張數</span><span>× ${s.qty}</span></div><div class="ln"><span>手續費</span><span>+ ${c} ${(s.fee || 0).toLocaleString()}</span></div>
      <div class="ln tot"><span>合計</span><span>${c} ${subtotal(s).toLocaleString()}</span></div>
      ${c !== 'TWD' ? `<div class="ln"><span>約合台幣</span><span>${money(twd(s))}</span></div>` : ''}${s.qty > 1 ? `<div class="ln"><span>每人分攤</span><span>${money(twd(s) / s.qty)}</span></div>` : ''}${songs ? `<div class="ln"><span>每首歌成本</span><span>${money(twd(s) / songs)}</span></div>` : ''}
      ${s.status === 'presale' ? '<div class="ln" style="color:var(--mut)"><span>※ 預估金額，搶到票前不計入花費</span></div>' : ''}</div>` : '<div class="empty">還沒填票價</div>';
  }
  document.getElementById('detail').innerHTML = `
    <div style="padding:0 16px;display:flex;justify-content:space-between;gap:8px"><button class="knob" data-back aria-label="返回"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eef1f6" stroke-width="2" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg></button><span style="display:flex;gap:8px"><button class="knob" data-share="${s.id}" aria-label="數位票根"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eef1f6" stroke-width="1.8" aria-hidden="true"><path d="M3 7a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-3a2 2 0 0 0 0-4z"/><path d="M9 5v14" stroke-dasharray="2 2"/></svg></button><button class="knob" data-menu="${s.id}" aria-label="更多操作" aria-haspopup="menu"><svg width="20" height="20" viewBox="0 0 24 24" fill="#eef1f6" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg></button></span></div>
    <div class="case"><div class="disc" aria-hidden="true"></div><div class="jewel" aria-hidden="true"><div style="background:${cover(s)}">${coverPhoto(s) ? '' : esc(s.artist.split(' ').pop().toUpperCase())}</div></div>
      <label class="coverbtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l2-3h4l2 3"/></svg>${coverPhoto(s) ? '更換封面' : '上傳封面'}<input type="file" accept="image/*" hidden data-cover="${s.id}"></label></div>
    <div style="padding:14px 20px 0"><span class="mono ${ST[s.status]}" style="font-size:10px;letter-spacing:.18em;padding:3px 7px;border:1px solid currentColor;background:rgba(0,0,0,.4)">● ${P.STATUS_EN[s.status]} // ${P.STATUS[s.status]}</span><span class="catchip">${CATS[s.cat]}</span>
      <h2 style="margin:4px 0 0;font:800 24px Unbounded,-apple-system,'PingFang TC',sans-serif">${artistBtn(s.artist)}</h2><div style="color:var(--mut);font-size:14px">${esc(s.tour)}</div></div>
    <div class="dtabs" role="tablist">${tabs.map(([k, t]) => `<button role="tab" data-dtab="${k}" aria-selected="${k === dtab}">${t}</button>`).join('')}</div>
    <div role="tabpanel">${body}</div>`;
  tickSale();
}

/* ================= 活動分類 ================= */
const CATS = { concert: '演唱會', fest: '音樂祭', fanmeet: '見面會', musical: '音樂劇', other: '其他' };
let catF = 'all';
const catHit = (s) => catF === 'all' || s.cat === catF;
function renderCatSeg() {
  const used = new Set(P.shows.map((s) => s.cat));
  document.getElementById('cseg').innerHTML = `<button data-c="all" aria-pressed="${catF === 'all'}">全部類型</button>` + Object.entries(CATS).filter(([k]) => used.has(k)).map(([k, v]) => `<button data-c="${k}" aria-pressed="${catF === k}">${v}</button>`).join('');
}
function catBreakdown() {
  const att = P.attended(); const cnt = {}; for (const s of att) cnt[s.cat] = (cnt[s.cat] || 0) + 1;
  const rows = Object.entries(cnt).sort((a, b) => b[1] - a[1]); const max = Math.max(1, ...rows.map((r) => r[1]));
  return `<div class="glass"><div class="kick" style="margin-bottom:6px">活動類型</div>${rows.map(([k, v]) => `<div style="margin:10px 0"><div style="display:flex;justify-content:space-between;font-size:14px"><span>${CATS[k]}</span><span class="mono" style="color:var(--mut)">${v}</span></div><div class="meter"><i style="width:${v / max * 100}%"></i></div></div>`).join('')}</div>`;
}

/* ================= 藝人頁 ================= */
let artistFrom = null;
function songCounts(list) { const m = new Map(); for (const s of list) for (const t of [...s.setlist, ...s.encore]) if (!/^（/.test(t)) m.set(t, (m.get(t) || 0) + 1); return [...m].sort((a, b) => b[1] - a[1]); }
function openArtist(name) {
  artistFrom = { screen: document.querySelector('.screen.on')?.dataset.screen, id: dId };
  const all = P.list().filter((s) => s.artist === name);
  const att = all.filter((s) => s.status === 'attended');
  const spend = all.filter((s) => s.status === 'attended' || s.status === 'going').reduce((t, s) => t + (s.price ? twd(s) : 0), 0);
  const rated = att.filter((s) => s.rating); const avg = rated.length ? (rated.reduce((t, s) => t + s.rating, 0) / rated.length).toFixed(1) : '—';
  const songs = songCounts(att); const hero = all.find((s) => coverPhoto(s)) || all[0];
  const first = att[att.length - 1], last = att[0];
  document.getElementById('artistScreen').innerHTML = `
    <div style="padding:0 16px"><button class="knob" data-artback aria-label="返回"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eef1f6" stroke-width="2" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg></button></div>
    <div class="ahero"><div class="in" style="background:${cover(hero)}"><h2>${esc(name)}</h2><p>${first ? `第一次 ${first.date.replace(/-/g, '.')} · 最近 ${last.date.replace(/-/g, '.')}` : '還沒看過現場'}</p></div></div>
    <div class="kpis"><div><b class="c">${att.length}</b><small>看過場次</small></div><div><b class="y">${spend.toLocaleString()}</b><small>票券花費 TWD</small></div><div><b class="m">${avg}</b><small>平均評分</small></div></div>
    ${songs.length ? `<div class="glass" style="margin:12px 16px 0"><div class="kick" style="margin-bottom:4px">現場聽過最多次</div>${songs.slice(0, 5).map(([t, n], i) => `<div style="display:flex;justify-content:space-between;align-items:center;min-height:40px;border-bottom:1px solid rgba(255,255,255,.07)"><span><span class="mono c" style="margin-right:10px">${P.pad(i + 1)}</span>${esc(t)}</span><span class="mono" style="color:var(--mut)">× ${n}</span></div>`).join('')}</div>` : ''}
    <div class="kick" style="margin:16px 20px 10px">全部場次 · ${all.length}</div>${all.map(row).join('')}`;
  P.go('artist');
}
const artistBtn = (name) => `<button class="linkname" data-artist="${esc(name)}" aria-label="查看 ${esc(name)} 的藝人頁">${esc(name)}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>`;

/* ================= 場館與城市足跡 ================= */
function footprint() {
  const att = P.attended();
  const venues = new Map(); for (const s of [...att].reverse()) { if (!s.venue) continue; const v = venues.get(s.venue) || { city: s.city, n: 0, first: s.date, last: s.date }; v.n++; v.last = s.date; venues.set(s.venue, v); }
  const cities = new Map(); for (const s of att) if (s.city) cities.set(s.city, (cities.get(s.city) || 0) + 1);
  const tone = ['var(--c)', 'var(--m2)', 'var(--y)'];
  const tilt = (t) => ([...t].reduce((a, c) => a + c.charCodeAt(0), 0) % 17) - 8;
  return `<div class="glass g2"><div><div class="big c">${cities.size}</div><div class="lbl">座城市</div></div><div><div class="big m">${venues.size}</div><div class="lbl">個場館</div></div></div>
    <div class="glass"><div class="kick" style="margin-bottom:10px">城市足跡</div><div class="citychips">${[...cities].sort((a, b) => b[1] - a[1]).map(([c, n]) => `<span>${esc(c)}<b>${n}</b></span>`).join('')}</div></div>
    <div class="glass"><div class="kick" style="margin-bottom:12px">場館印章 · 點印章查看場次</div><div class="stamps">${[...venues].map(([v, d], i) => `
      <button class="stamp" data-venue="${esc(v)}" style="color:${tone[i % 3]};transform:rotate(${tilt(v)}deg)" aria-label="${esc(v)}，${d.n} 場"><small>${esc(d.city || '')}</small><b>${esc(v)}</b><span class="ct">×${d.n}</span><small>${d.first.slice(0, 4)}${d.last.slice(0, 4) !== d.first.slice(0, 4) ? '–' + d.last.slice(2, 4) : ''}</small></button>`).join('')}</div></div>`;
}

/* ================= 按需載入：票根圖卡、年度回顧用到才下載，平常不佔記憶體 ================= */
const V = new URL(document.currentScript.src).searchParams.get('v') || '';   // 和 index.html 同一個版本號
const need = (n) => need[n] || (need[n] = new Promise((res, rej) => {
  const el = document.createElement('script'); el.src = `js/${n}.js?v=${V}`;
  el.onload = res; el.onerror = () => { delete need[n]; rej(new Error('載入失敗，請確認網路')); }; document.head.appendChild(el);
}));
const later = (n, fn) => need(n).then(fn).catch((e) => P.toast(e.message));
// 年度回顧入口（內容在 recap.js）
const wYears = () => [...new Set(P.attended().map((s) => s.date.slice(0, 4)))].sort().reverse();
const wrappedEntry = () => wYears().length ? `<button class="wentry" data-wopen><svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><span><b>${wYears()[0]} 年度回顧</b><small>一頁一頁看你的現場人生</small></span></button>` : '';

/* ================= 統計頁組合 ================= */
function renderStats() {
  const body = document.getElementById('sbody');
  if (!P.attended().length && stab !== 'money') { body.innerHTML = '<div class="empty" style="margin:12px 20px">至少記錄一場「已參加」的演出，這裡就會出現數據。</div>'; return; }
  if (stab === 'map') body.innerHTML = footprint(); else renderStatsCore();
  if (stab === 'shows') body.insertAdjacentHTML('beforeend', catBreakdown());
  body.insertAdjacentHTML('afterbegin', wrappedEntry());
}

/* ================= 照片：壓縮後存進資料庫 ================= */
async function compress(file) {
  // 解碼時就先縮小：iPhone 4800 萬畫素照片完整解開約 190 MB，容易讓 App 被系統關掉
  let src = await createImageBitmap(file, { resizeWidth: 1600, resizeQuality: 'high' }).catch(() => null) || await createImageBitmap(file).catch(() => null);
  if (!src) src = await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = URL.createObjectURL(file); });
  if (!src) return null;
  const k = Math.min(1, 1600 / Math.max(src.width, src.height));
  const c = document.createElement('canvas'); c.width = Math.round(src.width * k); c.height = Math.round(src.height * k);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height); if (src.close) src.close();
  return new Promise((res) => c.toBlob((b) => { c.width = c.height = 0; res(b); }, 'image/jpeg', 0.82));   // 壓完立刻釋放畫布
}
async function addPhoto(s, file, kind, asCover) {
  const blob = await compress(file); if (!blob) { P.toast('這張照片無法讀取'); return null; }
  const id = await P.putPhoto(blob);
  s.photos.push({ id, kind, cover: false });
  if (asCover) setCover(s, id);
  return id;
}

/* ================= 新增／編輯／刪除 ================= */
const ed = document.getElementById('addf');
const F = (k) => ed.elements.namedItem(k);
const parseSetlist = (text) => {
  const lines = (text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const cut = lines.findIndex((l) => /^(encore|安可|アンコール|앵콜)$/i.test(l));
  return cut < 0 ? [lines, []] : [lines.slice(0, cut), lines.slice(cut + 1)];
};
const FIELDS = ['artist', 'tour', 'cat', 'status', 'sale', 'date', 'time', 'venue', 'city', 'seat', 'price', 'qty', 'cur', 'fee', 'with', 'notes'];
function openEditor(id) {
  const s = id ? P.get(id) : null;
  ed.reset(); copyFrom = null; document.getElementById('venueSug').hidden = true;
  F('sid').value = s ? s.id : '';
  if (s) {
    for (const k of FIELDS) F(k).value = s[k] ?? '';
    if (!s.price) F('price').value = ''; if (!s.fee) F('fee').value = '';
    F('setlistText').value = s.setlist.join('\n') + (s.encore.length ? '\nENCORE\n' + s.encore.join('\n') : '');
    ed.querySelectorAll('[name=rating]').forEach((r) => { r.checked = Number(r.value) === s.rating; });
  } else { F('date').value = P.today; F('qty').value = 1; }
  const cp = s && coverPhoto(s);
  coverPv.style.backgroundImage = cp ? `url('${P.thumb(cp.id)}')` : ''; coverPv.textContent = cp ? '' : '＋';
  document.getElementById('edTitle').textContent = s ? 'EDIT.ENTRY' : 'NEW.ENTRY';
  document.getElementById('edDel').hidden = !s;
  calc(); syncPicks();
  P.sheet('add', true);
  ed.closest('.panel').scrollTop = 0;
}
ed.addEventListener('submit', async (e) => {
  e.preventDefault();
  const o = Object.fromEntries(new FormData(ed));
  if (!o.artist.trim() || !o.date) { P.toast(!o.artist.trim() ? '請輸入藝人名稱' : '請選擇日期'); return; }
  const btn = ed.querySelector('button.cbtn'); btn.disabled = true;
  try {
    const isNew = !o.sid;
    const s = isNew ? P.normalize({ id: P.uid(), hue: ['c', 'm', 'y'][P.shows.length % 3] }) : P.get(o.sid);
    const [setlist, encore] = parseSetlist(o.setlistText);
    Object.assign(s, {
      artist: o.artist.trim(), tour: o.tour.trim(), cat: o.cat, date: o.date, time: o.time, venue: o.venue.trim(), city: o.city.trim(), seat: o.seat.trim(),
      price: Number(o.price) || 0, qty: Math.max(1, Number(o.qty) || 1), fee: Number(o.fee) || 0, cur: o.cur, rating: Number(o.rating) || 0,
      with: o.with.trim(), notes: o.notes.trim(), sale: o.sale, setlist, encore,
      status: o.status || (o.date > P.today ? 'going' : 'attended')
    });
    if (coverBlob) { const id = await P.putPhoto(coverBlob); s.photos.push({ id, kind: 'live', cover: false }); setCover(s, id); coverBlob = null; }
    else if (isNew && copyFrom && coverPhoto(copyFrom)) {   // 複製演唱會：沿用原本的封面照片（另存一份）
      const b = await P.photoBlob(coverPhoto(copyFrom).id); if (b) { const nid = await P.putPhoto(b); s.photos.push({ id: nid, kind: 'live', cover: true }); }
    }
    copyFrom = null;
    await P.save(s);
    P.sheet('add', false); render(); detail(s.id); P.go('detail');
    P.toast(isNew ? '已儲存' : '已更新');
  } catch (err) { P.toast('儲存失敗：' + err.message); }
  btn.disabled = false;
});
document.getElementById('edDel').addEventListener('click', async () => {
  const s = P.get(F('sid').value);
  if (!s || !confirm(`確定刪除「${s.artist}」？照片也會一起刪除，無法復原。`)) return;
  await P.remove(s.id);
  P.sheet('add', false); render(); P.go('home'); P.toast('已刪除');
});

/* ================= 第一版資料搬移、備份、範例 ================= */
const fromV1 = (o) => {
  const [setlist, encore] = parseSetlist(o.setlist || '');
  return P.normalize({
    id: o.id, artist: o.artist, tour: o.tour, date: o.date, time: o.time, venue: o.venue, city: o.city, seat: o.seat, price: o.price, cur: o.currency,
    rating: o.rating, with: o.companions, notes: o.notes, status: o.status, hue: o.color, setlist, encore,
    photos: (o.photos || []).map((id, i) => ({ id, kind: 'live', cover: i === 0 })), created: o.created
  });
};
async function migrateV1() {
  try { if (localStorage.getItem('neonlive2-migrated')) return 0; } catch { /* 私密瀏覽 */ }
  let n = 0;
  try {
    const dbs = P.shows.length || !indexedDB.databases ? [] : await indexedDB.databases();
    if (dbs.some((d) => d.name === 'neonlive')) {
      const old = await new Promise((res, rej) => { const r = indexedDB.open('neonlive'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
      const getAll = (st) => old.objectStoreNames.contains(st) ? new Promise((res) => { const q = old.transaction(st).objectStore(st).getAll(); q.onsuccess = () => res(q.result); q.onerror = () => res([]); }) : [];
      for (const p of await getAll('photos')) await P.putPhoto(p.blob, p.id);
      for (const o of await getAll('shows')) { await P.save(fromV1(o)); n++; }
      old.close();
    }
  } catch (err) { console.warn('migrate', err); }
  try { localStorage.setItem('neonlive2-migrated', '1'); } catch { /* 私密瀏覽 */ }
  return n;
}
const blobToDataURL = (b) => new Promise((r) => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
async function exportBackup() {
  P.toast('打包中…');
  const photos = await P.store.all('photos');
  const data = { app: 'neonlive2', v: 1, exported: new Date().toISOString(), shows: P.shows, photos: await Promise.all(photos.map(async (p) => ({ id: p.id, data: await blobToDataURL(p.blob) }))) };
  const file = new File([JSON.stringify(data)], `neonlive-backup-${P.today}.json`, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: 'NEON//LIVE 備份' }); return; } catch (err) { if (err.name === 'AbortError') return; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; a.click();
  P.toast('備份檔已下載');
}
async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    const isV1 = data.app === 'neonlive';
    if (!isV1 && data.app !== 'neonlive2') throw new Error('不是 NEON//LIVE 的備份檔');
    if (!confirm(`將匯入 ${data.shows.length} 筆紀錄（相同紀錄會被覆蓋），繼續？`)) return;
    P.toast('匯入中…');
    for (const p of data.photos || []) await P.putPhoto(await (await fetch(p.data)).blob(), p.id);
    for (const o of data.shows) { const s = isV1 ? fromV1(o) : P.normalize(o); const ex = P.get(s.id); if (ex) Object.assign(ex, s); await P.save(ex || s); }
    render(); P.toast(`匯入完成：${data.shows.length} 筆`);
  } catch (err) { P.toast('匯入失敗：' + err.message); }
}
async function loadDemo() {
  const plus = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };
  const demo = [
    { artist: '五月天 Mayday', tour: '回到那一天 巡迴演唱會', date: '2025-12-31', time: '19:30', venue: '台北大巨蛋', city: '台北', seat: '搖滾 A2', price: 4880, qty: 2, fee: 60, rating: 5, with: '阿明, 小雅', status: 'attended', setlist: ['擁抱', '知足', '倔強', '憨人', '派對動物'], encore: ['人生海海', '倔強'], notes: '跨年倒數全場大合唱，手機燈海像整座城市都亮了。', hue: 'c' },
    { artist: 'YOASOBI', tour: 'ASIA TOUR', date: '2025-06-22', time: '18:00', venue: '台北小巨蛋', city: '台北', seat: '2 樓 B 區', price: 3800, fee: 30, rating: 5, with: '小雅', status: 'attended', setlist: ['アイドル', '夜に駆ける', '群青', '怪物'], encore: ['祝福'], hue: 'm' },
    { artist: '大港開唱 Megaport', tour: '2025 大港開唱', date: '2025-03-29', time: '12:00', venue: '高雄駁二藝術特區', city: '高雄', seat: '雙日票', price: 3200, fee: 50, rating: 5, with: '阿明', status: 'attended', cat: 'fest', notes: '海風、啤酒、一整天的搖滾。', hue: 'y' },
    { artist: 'Coldplay', tour: 'Music of the Spheres', date: '2024-11-12', time: '19:00', venue: '高雄國家體育場', city: '高雄', seat: '搖滾區', price: 6800, qty: 2, fee: 100, rating: 5, with: '阿明', status: 'attended', setlist: ['Higher Power', 'Viva la Vida', 'Yellow', 'A Sky Full of Stars'], encore: ['Fix You'], notes: '發光手環同步變色超震撼。', hue: 'c' },
    { artist: '告五人 Accusefive', tour: '我肯定在幾百年前就說過愛你', date: '2024-11-04', time: '19:00', venue: '高雄巨蛋', city: '高雄', seat: '特 A 區', price: 3600, rating: 4, status: 'attended', setlist: ['愛人錯過', '帶我去找夜生活'], encore: ['唯一'], hue: 'y' },
    { artist: '落日飛車', tour: 'Soft Storm Tour', date: '2023-08-19', time: '20:00', venue: 'Zepp New Taipei', city: '新北', seat: '2F 自由座', price: 2200, rating: 4, with: '阿明', status: 'attended', setlist: ['My Jinji', 'Candy Wrapper'], encore: ['Vanilla Villa'], hue: 'y' },
    { artist: '草東沒有派對', tour: '瓦合 巡迴', date: plus(23), time: '20:00', venue: 'Legacy Taipei', city: '台北', seat: '站位 #0128', price: 1800, fee: 20, status: 'going', hue: 'm' },
    { artist: 'YOASOBI', tour: '2027 ASIA TOUR', date: plus(120), time: '19:00', venue: '台北大巨蛋', city: '台北', seat: '目標：搖滾區', price: 3800, qty: 2, fee: 40, with: '小雅', status: 'presale', sale: plus(5) + 'T12:00', notes: '會員預售，記得先登入售票網站。', hue: 'm' },
    { artist: 'Daft Punk', tour: '（如果他們復出）', date: plus(400), status: 'wish', notes: '永遠的願望清單。', hue: 'y' }
  ];
  for (const o of demo) await P.save(P.normalize({ ...o, id: P.uid() }));
  render(); P.go('home'); P.toast(`已載入 ${demo.length} 筆範例`);
}
async function storageInfo() {
  const el = document.getElementById('storageInfo'); if (!el) return;
  let t = `${P.shows.length} 筆紀錄`;
  try { if (navigator.storage && navigator.storage.persist) t += (await navigator.storage.persist()) ? ' · 儲存已鎖定' : ''; } catch { /* 不支援 */ }
  try { const e = navigator.storage && await navigator.storage.estimate(); if (e) t += ` · 已用 ${(e.usage / 1048576).toFixed(1)} MB`; } catch { /* 不支援 */ }
  el.textContent = t;
}
document.getElementById('btnExport').addEventListener('click', exportBackup);
document.getElementById('importIn').addEventListener('change', (e) => { const f = e.target.files[0]; if (f) importBackup(f); e.target.value = ''; });
document.getElementById('btnDemo').addEventListener('click', loadDemo);
document.getElementById('btnWipe').addEventListener('click', async () => {
  if (!confirm('確定清除全部紀錄與照片？建議先匯出備份。') || !confirm('最後確認：資料將無法復原。')) return;
  await P.wipe(); render(); P.go('home'); P.toast('已清除全部資料'); storageInfo();
});

/* ================= 場館關鍵字提示 ================= */
// n 場館名稱、c 城市、k 搜尋用別名（中英文、簡稱）
const VENUES = [
  { n: '台北小巨蛋', c: '台北', k: '臺北小巨蛋 Taipei Arena 小巨蛋 南京東路' },
  { n: '台北大巨蛋', c: '台北', k: '臺北大巨蛋 Taipei Dome 大巨蛋 遠雄' },
  { n: '台北流行音樂中心', c: '台北', k: '北流 Taipei Music Center TMC 表演廳 南港' },
  { n: 'Legacy Taipei 音樂展演空間', c: '台北', k: 'Legacy 華山 傳音樂展演空間' },
  { n: 'Legacy TERA', c: '新北', k: 'Legacy 新莊 宏匯' },
  { n: 'Zepp New Taipei', c: '新北', k: 'Zepp 新莊 宏匯廣場' },
  { n: 'The Wall Live House', c: '台北', k: '這牆 公館' },
  { n: 'Riverside Live House', c: '台北', k: '河岸留言 西門紅樓' },
  { n: '台北國際會議中心', c: '台北', k: '臺北國際會議中心 TICC 信義' },
  { n: '台北南港展覽館', c: '台北', k: '南港展覽館 Nangang Exhibition Center 南港展覽館二館' },
  { n: '台大綜合體育館', c: '台北', k: '臺大 NTU Sports Center 新體' },
  { n: '台北和平籃球館', c: '台北', k: '和平籃球館 Heping Basketball' },
  { n: '臺北田徑場', c: '台北', k: '台北田徑場 Taipei Stadium 田徑場' },
  { n: '國家音樂廳', c: '台北', k: '兩廳院 National Concert Hall 中正紀念堂' },
  { n: '國家戲劇院', c: '台北', k: '兩廳院 National Theater' },
  { n: '國立體育大學綜合體育館', c: '桃園', k: '林口體育館 體大 NTSU Arena 林口' },
  { n: '桃園國際棒球場', c: '桃園', k: '樂天桃園棒球場 Taoyuan Baseball' },
  { n: '新莊體育館', c: '新北', k: 'Xinzhuang Gymnasium' },
  { n: '新北市立板橋第一運動場', c: '新北', k: '板橋體育場 板橋第一運動場' },
  { n: '臺中洲際棒球場', c: '台中', k: '台中洲際 Intercontinental Baseball Stadium' },
  { n: '臺中國家歌劇院', c: '台中', k: '台中歌劇院 National Taichung Theater' },
  { n: '臺中圓滿戶外劇場', c: '台中', k: '圓滿劇場 文心森林公園' },
  { n: '高雄巨蛋', c: '高雄', k: 'Kaohsiung Arena 巨蛋 小港 左營 漢神巨蛋' },
  { n: '高雄國家體育場', c: '高雄', k: '世運主場館 World Games Stadium 世運' },
  { n: '高雄流行音樂中心', c: '高雄', k: '高流 Kaohsiung Music Center 海音館 珊瑚礁群' },
  { n: '衛武營國家藝術文化中心', c: '高雄', k: '衛武營 Weiwuying' },
  { n: '高雄駁二藝術特區', c: '高雄', k: '駁二 大港開唱 Pier-2' },
  { n: '東京巨蛋', c: '東京', k: 'Tokyo Dome 東京ドーム 後樂園' },
  { n: '日本武道館', c: '東京', k: 'Nippon Budokan 武道館' },
  { n: '有明競技場', c: '東京', k: 'Ariake Arena 有明アリーナ' },
  { n: '埼玉超級競技場', c: '埼玉', k: 'Saitama Super Arena さいたまスーパーアリーナ SSA' },
  { n: 'K-Arena 橫濱', c: '橫濱', k: 'K-Arena Yokohama Karena' },
  { n: '橫濱體育館', c: '橫濱', k: 'Yokohama Arena 横浜アリーナ' },
  { n: '京瓷巨蛋大阪', c: '大阪', k: 'Kyocera Dome Osaka 京セラドーム 大阪巨蛋' },
  { n: '名古屋巨蛋', c: '名古屋', k: 'Vantelin Dome バンテリンドーム ナゴヤドーム' },
  { n: '福岡 PayPay 巨蛋', c: '福岡', k: 'Fukuoka PayPay Dome 福岡巨蛋' },
  { n: '高尺天空巨蛋', c: '首爾', k: 'Gocheok Sky Dome 고척스카이돔 高尺巨蛋' },
  { n: 'KSPO DOME', c: '首爾', k: '奧林匹克體操競技場 Olympic Gymnastics Arena 체조경기장 KSPO' },
  { n: '首爾奧林匹克主競技場', c: '首爾', k: '蠶室 Jamsil Olympic Stadium 잠실' },
  { n: 'INSPIRE Arena', c: '仁川', k: '仁川 Incheon 인스파이어' },
  { n: '啟德主場館', c: '香港', k: 'Kai Tak Stadium 啟德體育園' },
  { n: '亞洲國際博覽館', c: '香港', k: 'AsiaWorld-Expo 亞博 AWE' },
  { n: '香港體育館', c: '香港', k: '紅館 紅磡 Hong Kong Coliseum' },
  { n: '澳門威尼斯人綜藝館', c: '澳門', k: 'Cotai Arena 金光綜藝館 Venetian' },
  { n: '新加坡國家體育場', c: '新加坡', k: 'Singapore National Stadium' },
  { n: '曼谷拉加曼加拉國家體育場', c: '曼谷', k: 'Rajamangala Stadium Bangkok' }
];
const norm = (t) => String(t || '').toLowerCase().replace(/臺/g, '台').replace(/\s+/g, '');
function venueMatches(q) {
  q = norm(q); if (!q) return [];
  const mine = new Map();
  for (const s of P.shows) if (s.venue && !mine.has(s.venue)) { const known = VENUES.find((v) => v.n === s.venue); mine.set(s.venue, { n: s.venue, c: s.city || (known && known.c), k: known ? known.k : '', mine: true }); }
  const all = [...mine.values(), ...VENUES.filter((v) => !mine.has(v.n))];
  const score = (v) => { const n = norm(v.n), k = norm(v.k), c = norm(v.c); if (n.startsWith(q)) return 0; if (n.includes(q)) return 1; if (k.includes(q)) return 2; if (c.includes(q)) return 3; return 9; };
  return all.map((v) => [score(v), v]).filter(([sc]) => sc < 9).map(([sc, v]) => [sc - (v.mine ? .5 : 0), v]).sort((a, b) => a[0] - b[0]).slice(0, 7).map(([, v]) => v);   // 去過的場館排前面
}
const vIn = F('venue'), vSug = document.getElementById('venueSug');
function showVenueSug() {
  const list = venueMatches(vIn.value);
  if (!list.length || document.activeElement !== vIn) { vSug.hidden = true; return; }
  vSug.innerHTML = list.map((v, i) => `<button type="button" role="option" data-vi="${i}"><b>${esc(v.n)}</b><span>${esc(v.c || '')}${v.mine ? ' · 去過' : ''}</span></button>`).join('');
  vSug._list = list; vSug.hidden = false;
}
vIn.setAttribute('autocomplete', 'off'); vIn.setAttribute('role', 'combobox'); vIn.setAttribute('aria-controls', 'venueSug');
vIn.addEventListener('input', showVenueSug); vIn.addEventListener('focus', showVenueSug);
vIn.addEventListener('blur', () => setTimeout(() => { vSug.hidden = true; }, 180));
vSug.addEventListener('pointerdown', (e) => e.preventDefault());   // 點選項時不讓輸入框先失焦
vSug.addEventListener('click', (e) => {
  const b = e.target.closest('[data-vi]'); if (!b) return;
  const v = vSug._list[b.dataset.vi]; vIn.value = v.n; if (v.c) F('city').value = v.c;
  vSug.hidden = true; F('seat').focus();
});

/* ================= 詳情操作選單：數位票根／修改／複製／刪除 ================= */
let menuId = null;
function openMenu(id, btn) {
  menuId = id; const m = document.getElementById('actMenu'); const r = btn.getBoundingClientRect(), app = document.querySelector('.app').getBoundingClientRect();
  m.style.top = `${r.bottom - app.top + 8}px`; m.style.right = `${app.right - r.right}px`; m.hidden = false;
  m.querySelector('button').focus();
}
const closeMenu = () => { document.getElementById('actMenu').hidden = true; };
let copyFrom = null;
// 統一的滾輪選擇器：日期、時間、開賣時間、下拉選單都用同一個，配色吃主題變數，換主題會跟著變
const IH = 40, pkEl = document.getElementById('picker'), pkW = document.getElementById('pkWheels');
const range = (a, b, st = 1) => { const r = []; for (let v = a; v <= b; v += st) r.push(v); return r; };
const YEARS = range(1990, +P.today.slice(0, 4) + 5);
const dim = (y, m) => new Date(y, m, 0).getDate();
const dateLabel = (v) => { const p = P.parts(v); return `${p.y}年${+p.m}月${+p.d}日 週${p.wk}`; };
let PK = null;
const pkVals = () => PK.cols.map((c) => c.vals[c.i]);
const pkFill = (c) => { c.el.innerHTML = c.vals.map((v) => `<div>${c.txt(v)}</div>`).join(''); };
const pkLabel = () => { document.getElementById('pkLabel').textContent = PK.label(pkVals()); };
const pkScroll = (smooth) => { for (const c of PK.cols) c.el.scrollTo({ top: c.i * IH, behavior: smooth ? 'smooth' : 'instant' }); };
function pkSet(vals) {   // 依值把每一欄轉到對的位置
  PK.cols.forEach((c, k) => { const i = c.vals.indexOf(vals[k]); if (i >= 0) c.i = i; if (k === 1 && PK.fix) PK.fix(); });
  PK.fix?.(); pkLabel(); pkScroll(true);
}
function pkOpen(o) {   // o: { title, cols:[{vals, txt, i, w}], label(vals), done(vals), fix?, now?, clear? }
  PK = o; pkW.innerHTML = ''; pkW.style.gridTemplateColumns = o.cols.map((c) => c.w || '1fr').join(' '); pkW.classList.toggle('many', o.cols.length > 3);
  for (const c of o.cols) {
    c.el = document.createElement('div'); c.el.className = 'wheel'; pkFill(c); pkW.append(c.el);
    let t;
    c.el.addEventListener('scroll', () => {
      const i = Math.max(0, Math.min(c.vals.length - 1, Math.round(c.el.scrollTop / IH)));
      if (i === c.i) return; c.i = i; PK.fix?.(); pkLabel();
      clearTimeout(t); t = setTimeout(() => { for (const d of PK.cols) if (Math.round(d.el.scrollTop / IH) !== d.i) d.el.scrollTo({ top: d.i * IH, behavior: 'smooth' }); }, 150);
    }, { passive: true });
    c.el.addEventListener('click', (e) => { const it = e.target.closest('.wheel>div'); if (it) c.el.scrollTo({ top: [...c.el.children].indexOf(it) * IH, behavior: 'smooth' }); });   // 點一下也能選
  }
  document.getElementById('pkTitle').textContent = o.title;
  document.getElementById('pkNow').hidden = !o.now; document.getElementById('pkNow').textContent = o.nowText || '今天';
  document.getElementById('pkClear').hidden = !o.clear;
  pkEl.classList.add('on'); pkLabel();
  requestAnimationFrame(() => pkScroll(false));
}
const pkClose = () => { pkEl.classList.remove('on'); document.querySelectorAll('.pickbtn.on').forEach((b) => b.classList.remove('on')); };
document.getElementById('pkOk').addEventListener('click', () => { PK.done(pkVals()); pkClose(); });
document.getElementById('pkNow').addEventListener('click', () => pkSet(PK.now()));
document.getElementById('pkClear').addEventListener('click', () => { PK.clear(); pkClose(); });
document.querySelector('[data-pkclose]').addEventListener('click', pkClose);

// 各欄位的滾輪組合
const dateCols = (y, m, d) => [
  { vals: YEARS, txt: (v) => v + '年', i: Math.max(0, YEARS.indexOf(y)), w: '1.3fr' },
  { vals: range(1, 12), txt: (v) => v + '月', i: m - 1 },
  { vals: range(1, dim(y, m)), txt: (v) => v + '日', i: d - 1 }];
function fixDays() {   // 換年月時重排天數（2 月、小月）
  const [yc, mc, dc] = PK.cols, n = dim(yc.vals[yc.i], mc.vals[mc.i]);
  if (dc.vals.length !== n) { dc.vals = range(1, n); dc.i = Math.min(dc.i, n - 1); pkFill(dc); dc.el.scrollTop = dc.i * IH; }
}
const MINS = range(0, 55, 5);
const timeCols = (h, mi) => { const ms = MINS.includes(mi) ? MINS : [...MINS, mi].sort((a, b) => a - b); return [
  { vals: range(0, 23), txt: (v) => P.pad(v) + ' 時', i: h },
  { vals: ms, txt: (v) => P.pad(v) + ' 分', i: ms.indexOf(mi) }]; };
const nowYMD = () => P.today.split('-').map(Number);
const saleLabel = (v) => { const [d, t] = v.split('T'); const p = P.parts(d); return `${p.y}年${+p.m}月${+p.d}日 ${t.slice(0, 5)}`; };
const PICKS = {
  date: {
    show: (v) => { if (!v) return '選擇日期'; const p = P.parts(v); return `${p.y}/${+p.m}/${+p.d}`; },
    open(v) {
      const [y, m, d] = (v || P.today).split('-').map(Number);
      return { title: '日期', cols: dateCols(y, m, d), fix: fixDays, now: nowYMD,
        label: ([y, m, d]) => dateLabel(`${y}-${P.pad(m)}-${P.pad(d)}`), done: ([y, m, d]) => `${y}-${P.pad(m)}-${P.pad(d)}` };
    }
  },
  time: {
    show: (v) => v ? v.slice(0, 5) : '未設定',
    open(v) {
      const [h, mi] = (v || '19:30').split(':').map(Number);
      return { title: '開演時間', cols: timeCols(h, mi), now: () => [19, 30], nowText: '19:30', clear: true,
        label: ([h, m]) => `${P.pad(h)}:${P.pad(m)}`, done: ([h, m]) => `${P.pad(h)}:${P.pad(m)}` };
    }
  },
  sale: {
    show: (v) => { if (!v) return '未設定'; const p = P.parts(v.slice(0, 10)); return `${+p.m}月${+p.d}日 ${v.slice(11, 16)}`; },
    open(v) {
      const [d, t] = (v || P.today + 'T12:00').split('T'), [y, m, dd] = d.split('-').map(Number), [h, mi] = t.split(':').map(Number);
      return { title: '開賣時間', cols: [...dateCols(y, m, dd).map((c, i) => ({ ...c, w: i ? '.85fr' : '1.25fr' })), ...timeCols(h, mi).map((c) => ({ ...c, txt: (v) => P.pad(v), w: '.75fr' }))],
        fix: fixDays, now: () => [...nowYMD(), 12, 0], clear: true,
        label: ([y, m, d, h, mi]) => saleLabel(`${y}-${P.pad(m)}-${P.pad(d)}T${P.pad(h)}:${P.pad(mi)}`), done: ([y, m, d, h, mi]) => `${y}-${P.pad(m)}-${P.pad(d)}T${P.pad(h)}:${P.pad(mi)}` };
    }
  }
};
const pickTitle = { cat: '活動類型', status: '狀態', cur: '幣別' };
for (const name of ['cat', 'status', 'cur']) {   // 下拉選單也改成同款滾輪
  const sel = F(name);
  PICKS[name] = {
    show: () => sel.selectedOptions[0]?.textContent || '',
    open: () => ({ title: pickTitle[name], cols: [{ vals: [...sel.options].map((o) => o.value), txt: (v) => [...sel.options].find((o) => o.value === v).textContent, i: Math.max(0, sel.selectedIndex) }],
      label: ([v]) => [...sel.options].find((o) => o.value === v).textContent, done: ([v]) => v })
  };
}
const pickBtns = {};
for (const [name, cfg] of Object.entries(PICKS)) {
  const el = F(name), b = document.createElement('button');
  b.type = 'button'; b.className = 'pickbtn'; el.after(b); pickBtns[name] = b;
  b.addEventListener('click', () => {
    b.classList.add('on');
    const o = cfg.open(el.value), set = (v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); syncPicks(); };
    pkOpen({ ...o, done: (vals) => set(o.done(vals)), clear: o.clear && (() => set('')) });
  });
}
function syncPicks() { for (const [name, b] of Object.entries(pickBtns)) { const v = F(name).value; b.textContent = PICKS[name].show(v); b.classList.toggle('unset', !v && name !== 'status'); } }

function duplicate(id) {
  const s = P.get(id); openEditor(id);
  F('sid').value = ''; F('status').value = ''; syncPicks(); copyFrom = s;   // 以原紀錄為底的新紀錄，狀態改回依日期自動判斷
  document.getElementById('edTitle').textContent = 'COPY.ENTRY';
  document.getElementById('edDel').hidden = true;
  P.toast('已複製內容，修改日期等資料後按儲存');
}
async function deleteShow(id) {
  const s = P.get(id); if (!s || !confirm(`確定刪除「${s.artist}」？照片也會一起刪除，無法復原。`)) return;
  await P.remove(id); render(); P.go('home'); P.toast('已刪除');
}

/* ================= 事件 ================= */
document.querySelector('.app').addEventListener('click', (e) => {
  const t = e.target;
  if (t.closest('[data-new]')) { openEditor(); return; }
  const edb = t.closest('[data-edit]'); if (edb) { openEditor(edb.dataset.edit); return; }
  if (t.closest('[data-demo]')) { loadDemo(); return; }
  const ar = t.closest('[data-artist]'); if (ar) { openArtist(ar.dataset.artist); return; }
  if (t.closest('[data-artback]')) { if (artistFrom?.screen === 'detail') { detail(artistFrom.id); P.go('detail'); } else P.go(artistFrom?.screen || 'home'); return; }
  if (t.closest('[data-wopen]')) { later('recap', () => openWrapped()); return; }
  const vn = t.closest('[data-venue]'); if (vn) { document.getElementById('q').value = vn.dataset.venue; P.go('archive'); renderArchive(); return; }
  const ic = t.closest('[data-ics]'); if (ic) { const [id, k] = ic.dataset.ics.split(':'); addToCalendar(id, k); return; }
  const ad = t.closest('[data-advance]'); if (ad) { const [id, st] = ad.dataset.advance.split(':'); advance(id, st); return; }
  if (!t.closest('#actMenu') && !t.closest('[data-menu]')) closeMenu();
  const mn = t.closest('[data-menu]'); if (mn) { const m = document.getElementById('actMenu'); if (!m.hidden && menuId === mn.dataset.menu) closeMenu(); else openMenu(mn.dataset.menu, mn); return; }
  const act = t.closest('[data-act]'); if (act) { const id = menuId; closeMenu(); ({ ticket: () => later('cards', () => openTicket(id)), edit: () => openEditor(id), dup: () => duplicate(id), del: () => deleteShow(id) })[act.dataset.act](); return; }
  const sh = t.closest('[data-share]'); if (sh) { const id = sh.dataset.share; later('cards', () => openTicket(id)); return; }
  const dt = t.closest('[data-dtab]'); if (dt) { dtab = dt.dataset.dtab; detail(dId); return; }
  const ph = t.closest('[data-photo]'); if (ph) { const lb = document.getElementById('lb'); lb.querySelector('img').src = ph.dataset.photo; lb.classList.add('on'); return; }
  if (t.closest('#lb')) { document.getElementById('lb').classList.remove('on'); return; }
  const rm = t.closest('[data-rmphoto]'); if (rm) { if (!confirm('刪除這張照片？')) return; const s = P.get(dId); P.delPhoto(rm.dataset.rmphoto); s.photos = s.photos.filter((x) => x.id !== rm.dataset.rmphoto); P.save(s).then(() => { detail(dId); render(); }); return; }
  const sc = t.closest('[data-setcover]'); if (sc) { const s = P.get(dId); setCover(s, sc.dataset.setcover); P.save(s).then(() => { detail(dId); render(); P.toast('已設為票面封面'); }); return; }
  const cm = t.closest('[data-cal]'); if (cm) { const [y, m] = calMonth.split('-').map(Number); const d = new Date(y, m - 1 + Number(cm.dataset.cal), 1); calMonth = `${d.getFullYear()}-${P.pad(d.getMonth() + 1)}`; selDay = null; renderArchive(); return; }
  const dy = t.closest('[data-day]'); if (dy) { selDay = selDay === dy.dataset.day ? null : dy.dataset.day; renderArchive(); return; }
});
document.querySelector('.app').addEventListener('change', async (e) => {
  const t = e.target; if (!t.files || !t.files.length || !(t.dataset.cover || t.dataset.addphoto)) return;
  const files = [...t.files]; t.value = '';
  P.toast('處理照片中…');
  if (t.dataset.cover) { const s = P.get(t.dataset.cover); await addPhoto(s, files[0], 'live', true); await P.save(s); detail(s.id); render(); P.toast('封面已更新'); }
  else { const s = P.get(dId); for (const f of files) { await addPhoto(s, f, t.dataset.addphoto); await new Promise((r) => setTimeout(r, 250)); } /* 一張一張處理，中間讓瀏覽器回收記憶體 */ await P.save(s); detail(dId); render(); P.toast(`已新增 ${files.length} 張照片`); }
  storageInfo();
});
document.getElementById('q').addEventListener('input', renderArchive);
document.getElementById('seg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; filter = b.dataset.f; document.querySelectorAll('#seg button').forEach((x) => x.setAttribute('aria-pressed', x === b)); renderArchive(); });
document.getElementById('cseg').addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (b) { catF = b.dataset.c; renderArchive(); } });
document.getElementById('vt').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; view = b.dataset.v; document.querySelectorAll('#vt button').forEach((x) => x.setAttribute('aria-pressed', x === b)); renderArchive(); });
document.getElementById('sseg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; stab = b.dataset.t; document.querySelectorAll('#sseg button').forEach((x) => x.setAttribute('aria-pressed', x === b)); renderStats(); });
P.everySecond(() => { document.getElementById('clock').textContent = new Date().toTimeString().slice(0, 5); });
/* ================= 啟動 ================= */
(async () => {
  try { await P.load(); } catch (err) { P.toast('資料庫無法開啟：' + err.message); }
  const moved = await migrateV1(); if (moved) await P.load();
  P.init({ render, detail, onGo: (n) => { document.querySelector('nav.pill').style.display = ['detail', 'sys', 'artist'].includes(n) ? 'none' : ''; if (n === 'home' && refresh) requestAnimationFrame(refresh); } });
  if (moved) P.toast(`已從第一版搬移 ${moved} 筆紀錄`);
  if (await P.ensureThumbs()) render();   // 舊照片補做縮圖
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((r) => { r.update(); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') r.update(); }); });   // 每次回到 App 都檢查新版
})();
