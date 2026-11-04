// 年度回顧（按「年度回顧」才載入）
/* ================= 年度回顧 ================= */
let wYear = null, wIdx = 0, wTimer = null;
function wData(y) {
  const att = P.attended().filter((s) => s.date.startsWith(y));
  const months = Array(12).fill(0); for (const s of att) months[+s.date.slice(5, 7) - 1]++;
  const by = new Map(); for (const s of att) by.set(s.artist, (by.get(s.artist) || 0) + 1);
  const topArtist = [...by].sort((a, b) => b[1] - a[1] || 0)[0];
  const songs = songCounts(att); const total = songs.reduce((t, x) => t + x[1], 0);   // 不算「（多組演出）」這類備註
  const spend = att.reduce((t, s) => t + (s.price ? twd(s) : 0), 0);
  const priciest = [...att].sort((a, b) => twd(b) - twd(a))[0];
  const best = [...att].sort((a, b) => (b.rating || 0) - (a.rating || 0) || b.date.localeCompare(a.date))[0];
  return { att, months, topArtist, songs, total, spend, priciest, best, venues: [...new Set(att.map((s) => s.venue).filter(Boolean))], cities: [...new Set(att.map((s) => s.city).filter(Boolean))] };
}
const glowBg = (a, b) => `<div aria-hidden="true" style="position:absolute;inset:0;background:radial-gradient(70% 50% at ${a},rgba(var(--c-rgb),.35),transparent 70%),radial-gradient(70% 50% at ${b},rgba(var(--m-rgb),.35),transparent 70%)"></div>`;
function wSlides() {
  const d = wData(wYear), ta = d.topArtist && P.list().find((s) => s.artist === d.topArtist[0]);
  return [
    () => `${glowBg('20% 20%', '80% 80%')}<div class="k">YEAR IN LIVE</div><h3>你的 ${wYear}<br>現場回顧</h3><p>這一年，你把自己交給了音樂。</p><div class="wyears z">${wYears().map((y) => `<button data-wy="${y}" aria-pressed="${y === wYear}">${y}</button>`).join('')}</div><p style="font-size:13px;color:var(--mut)">點畫面右側繼續 ›</p>`,
    () => `${glowBg('80% 20%', '20% 90%')}<div class="k">SHOWS</div><p>${wYear} 年你去了</p><div class="wnum">${d.att.length}</div><h3>場現場</h3><div class="wmonths">${d.months.map((n, i) => `<div><i style="height:${n / Math.max(1, ...d.months) * 100}%"></i>${i + 1}</div>`).join('')}</div>`,
    () => d.topArtist ? `${glowBg('50% 30%', '50% 90%')}<div class="k">TOP ARTIST</div><p>你最常奔赴的是</p><div class="wcover"><div style="background:${cover(ta)}"></div></div><h3>${esc(d.topArtist[0])}</h3><p>${d.topArtist[1]} 場</p><button class="chipbtn solid z" style="align-self:flex-start" data-wartist="${esc(d.topArtist[0])}">看藝人頁</button>` : `<h3>這年還沒有紀錄</h3>`,
    () => `${glowBg('10% 60%', '90% 30%')}<div class="k">SONGS</div><p>你在現場一共聽了</p><div class="wnum">${d.total}</div><h3>首歌</h3>${d.songs[0] ? `<p>聽最多次的是「${esc(d.songs[0][0])}」<br>現場聽了 ${d.songs[0][1]} 次</p>` : ''}`,
    () => `${glowBg('70% 70%', '20% 20%')}<div class="k">TICKETS</div><p>今年的票券總花費</p><div class="wnum sm" style="font-size:52px">TWD ${d.spend.toLocaleString()}</div><p>平均每場 TWD ${d.att.length ? Math.round(d.spend / d.att.length).toLocaleString() : 0}${d.total ? `<br>每首歌約 TWD ${Math.round(d.spend / d.total).toLocaleString()}` : ''}</p>${d.priciest ? `<p>最貴的一場：<b>${esc(d.priciest.artist)}</b>（TWD ${twd(d.priciest).toLocaleString()}）</p>` : ''}`,
    () => `${glowBg('30% 80%', '80% 20%')}<div class="k">FOOTPRINT</div><p>你跑了</p><div class="wnum sm">${d.venues.length} 個場館</div><h3>${d.cities.length} 座城市</h3><p>${d.venues.map(esc).join('<br>')}</p>`,
    () => d.best ? `${glowBg('50% 20%', '50% 100%')}<div class="k">BEST NIGHT</div><p>年度最佳現場</p><div class="wcover"><div style="background:${cover(d.best)}"></div></div><h3>${esc(d.best.artist)}</h3><p class="y" style="font-size:22px">${P.stars(d.best.rating)}</p>${d.best.notes ? `<p>「${esc(d.best.notes)}」</p>` : ''}` : '',
    () => `${glowBg('20% 30%', '80% 70%')}<div class="k">${wYear} SUMMARY</div><h3>這就是你的 ${wYear}</h3><div class="wsum"><div><b>${d.att.length}</b><small>場現場</small></div><div><b>${d.total}</b><small>首歌</small></div><div><b>${d.venues.length}</b><small>個場館</small></div><div><b>${(d.spend / 1000).toFixed(1)}k</b><small>TWD 票券</small></div><div style="grid-column:1/3"><b style="font-size:18px">${d.topArtist ? esc(d.topArtist[0]) : '—'}</b><small>年度藝人</small></div></div><p>明年，也一起去更多現場吧。</p>`
  ].filter((f) => f() !== '');
}
function wShow() {
  const slides = wSlides(); wIdx = Math.max(0, Math.min(wIdx, slides.length - 1));
  document.getElementById('wbars').innerHTML = slides.map((_, i) => `<i class="${i < wIdx ? 'done' : i === wIdx ? 'cur' : ''}"><b></b></i>`).join('');
  document.getElementById('wslide').innerHTML = `<div class="wslide">${slides[wIdx]()}</div>`;
  clearTimeout(wTimer);
  if (motionOK && wIdx < slides.length - 1) wTimer = setTimeout(() => { wIdx++; wShow(); }, 6000);
}
function openWrapped(y) { wYear = y || wYears()[0]; wIdx = 0; document.getElementById('wrapped').classList.add('on'); wShow(); }
function closeWrapped() { clearTimeout(wTimer); document.getElementById('wrapped').classList.remove('on'); }
document.getElementById('wprev').addEventListener('click', () => { wIdx = Math.max(0, wIdx - 1); wShow(); });
document.getElementById('wnext').addEventListener('click', () => { const n = wSlides().length; if (wIdx >= n - 1) closeWrapped(); else { wIdx++; wShow(); } });
document.getElementById('wclose').addEventListener('click', closeWrapped);
document.getElementById('wslide').addEventListener('click', (e) => {
  const y = e.target.closest('[data-wy]'); if (y) { wYear = y.dataset.wy; wShow(); return; }
  const a = e.target.closest('[data-wartist]'); if (a) { closeWrapped(); openArtist(a.dataset.wartist); }
});
// 長按暫停（跟限時動態一樣）
const wr = document.getElementById('wrapped');
wr.addEventListener('pointerdown', () => { wr.classList.add('paused'); clearTimeout(wTimer); });
wr.addEventListener('pointerup', () => { wr.classList.remove('paused'); });

