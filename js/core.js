/* ================= 核心：資料庫（IndexedDB）、統計、畫面切換 ================= */
const P = (() => {
  const pad = (n) => String(n).padStart(2, '0');
  const localISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = localISO(new Date());
  const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const STATUS = { attended: '已參加', going: '即將前往', wish: '想看', presale: '等開賣' };
  const STATUS_EN = { attended: 'ATTENDED', going: 'INCOMING', wish: 'WISHLIST', presale: 'ON SALE SOON' };
  const shows = [];
  const urls = new Map();    // 照片 id → 原圖 object URL（放大、產生票根時才用）
  const turls = new Map();   // 照片 id → 縮圖 object URL（清單、卡片、格狀都用縮圖，iPhone 不用解開大圖）
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  /* ---- IndexedDB：shows 存紀錄、photos 存照片 Blob、thumbs 存縮圖（第 2 版新增） ---- */
  let dbp;
  const open = () => dbp ||= new Promise((res, rej) => {
    const r = indexedDB.open('neonlive2', 2);
    r.onupgradeneeded = () => { const d = r.result; for (const n of ['shows', 'photos', 'thumbs']) if (!d.objectStoreNames.contains(n)) d.createObjectStore(n, { keyPath: 'id' }); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  const tx = async (store, mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction(store, mode); const req = fn(t.objectStore(store));
      t.oncomplete = () => res(req && req.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    });
  };
  const store = {
    all: (s) => tx(s, 'readonly', (o) => o.getAll()),
    get: (s, id) => tx(s, 'readonly', (o) => o.get(id)),
    put: (s, v) => tx(s, 'readwrite', (o) => o.put(v)),
    del: (s, id) => tx(s, 'readwrite', (o) => o.delete(id)),
    clear: (s) => tx(s, 'readwrite', (o) => o.clear())
  };

  const normalize = (s) => ({
    id: s.id || uid(), artist: s.artist || '', tour: s.tour || '', date: s.date || today, time: s.time || '', venue: s.venue || '', city: s.city || '',
    seat: s.seat || '', price: Number(s.price) || 0, qty: Number(s.qty) || 1, fee: Number(s.fee) || 0, cur: s.cur || 'TWD', rating: Number(s.rating) || 0,
    with: s.with || '', notes: s.notes || '', status: s.status || 'attended', sale: s.sale || '', cat: s.cat || 'concert', hue: s.hue || 'c',
    setlist: Array.isArray(s.setlist) ? s.setlist : [], encore: Array.isArray(s.encore) ? s.encore : [], photos: Array.isArray(s.photos) ? s.photos : [],
    created: s.created || Date.now(), updated: s.updated || Date.now()
  });
  const sorted = () => [...shows].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const api = {
    shows, today, MON, STATUS, STATUS_EN, pad, uid, normalize, store,
    list(f = 'all', q = '') {
      q = q.trim().toLowerCase();
      return sorted().filter((s) => (f === 'all' || s.status === f) &&
        (!q || [s.artist, s.tour, s.venue, s.city, s.with, s.notes, s.setlist.join(' '), s.encore.join(' ')].join(' ').toLowerCase().includes(q)));
    },
    attended() { return sorted().filter((s) => s.status === 'attended'); },
    get(id) { return shows.find((s) => s.id === id); },
    next() { return shows.filter((s) => s.status === 'going' && s.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0]; },
    parts(date) { const [y, m, d] = date.split('-'); return { y, yy: y.slice(2), m, d, mon: `${+m}月`, wk: '日一二三四五六'[new Date(+y, m - 1, +d).getDay()], md: `${m}.${d}` }; },
    stars(n) { return '★'.repeat(n || 0) + '☆'.repeat(5 - (n || 0)); },
    songs(s) { return s.setlist.length + s.encore.length; },
    countdown(s) {
      let ms = Math.max(0, new Date(`${s.date}T${s.time || '19:00'}`) - new Date());
      const d = Math.floor(ms / 864e5); ms -= d * 864e5;
      const h = Math.floor(ms / 36e5); ms -= h * 36e5;
      const m = Math.floor(ms / 6e4); const sec = Math.floor((ms % 6e4) / 1e3);
      return { d: pad(d), h: pad(h), m: pad(m), s: pad(sec) };
    },
    stats() {
      const a = api.attended();
      const count = (key) => { const m = new Map(); for (const s of a) if (s[key]) m.set(s[key], (m.get(s[key]) || 0) + 1); return [...m].sort((x, y) => y[1] - x[1]); };
      const years = {}; for (const s of a) years[s.date.slice(0, 4)] = (years[s.date.slice(0, 4)] || 0) + 1;
      const rated = a.filter((s) => s.rating);
      return {
        total: a.length, artists: new Set(a.map((s) => s.artist)).size,
        venues: count('venue'), cities: count('city'), topArtists: count('artist'),
        years: Object.keys(years).sort().map((y) => [y, years[y]]),
        avg: rated.length ? (rated.reduce((t, s) => t + s.rating, 0) / rated.length).toFixed(1) : '—',
        songs: a.reduce((t, s) => t + api.songs(s), 0)
      };
    },
    esc(v) { return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },

    /* ---- 讀寫 ---- */
    async load() {
      const rows = await store.all('shows');
      shows.splice(0, shows.length, ...rows.map(normalize));
      for (const p of await store.all('photos')) if (!urls.has(p.id)) urls.set(p.id, URL.createObjectURL(p.blob));
      for (const t of await store.all('thumbs')) if (!turls.has(t.id) && urls.has(t.id)) turls.set(t.id, URL.createObjectURL(t.blob));
      // 日期已過的「已購票」自動轉為「已參加」
      for (const s of shows) if (s.status === 'going' && s.date < today) { s.status = 'attended'; await api.save(s); }
    },
    async save(s) {
      s.updated = Date.now();
      await store.put('shows', JSON.parse(JSON.stringify(s)));
      if (!shows.includes(s)) shows.push(s);
    },
    async remove(id) {
      const s = api.get(id); if (!s) return;
      for (const p of s.photos) await api.delPhoto(p.id);
      await store.del('shows', id);
      shows.splice(shows.indexOf(s), 1);
    },
    async putPhoto(blob, id = uid()) { await store.put('photos', { id, blob }); if (urls.has(id)) URL.revokeObjectURL(urls.get(id)); urls.set(id, URL.createObjectURL(blob)); await api.makeThumb(id, blob); return id; },
    async delPhoto(id) { await store.del('photos', id); await store.del('thumbs', id); for (const m of [urls, turls]) { if (m.has(id)) URL.revokeObjectURL(m.get(id)); m.delete(id); } },
    url(id) { return urls.get(id) || ''; },
    thumb(id) { return turls.get(id) || urls.get(id) || ''; },
    async makeThumb(id, blob) {   // 長邊約 640 像素的 JPEG（3 倍螢幕上 214 點寬的封面也夠清楚）
      const bm = await createImageBitmap(blob, { resizeWidth: 640, resizeQuality: 'high' }).catch(() => null) || await createImageBitmap(blob).catch(() => null);
      if (!bm) return;
      const k = Math.min(1, 640 / Math.max(bm.width, bm.height)), c = document.createElement('canvas');
      c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k); c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height); bm.close();
      const t = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.8)); c.width = c.height = 0;
      if (!t) return;
      await store.put('thumbs', { id, blob: t }); if (turls.has(id)) URL.revokeObjectURL(turls.get(id)); turls.set(id, URL.createObjectURL(t));
    },
    async ensureThumbs() {   // 舊照片補做縮圖，一次一張，做完回傳張數
      let n = 0;
      for (const id of [...urls.keys()]) if (!turls.has(id)) { const b = await api.photoBlob(id); if (b) { await api.makeThumb(id, b); n++; } }
      return n;
    },
    async photoBlob(id) { const r = await store.get('photos', id); return r && r.blob; },
    async wipe() { await store.clear('shows'); await store.clear('photos'); await store.clear('thumbs'); for (const m of [urls, turls]) { for (const u of m.values()) URL.revokeObjectURL(u); m.clear(); } shows.splice(0); }
  };

  /* ---- 畫面切換 ---- */
  let hooks = {}, current = null, prev = null;
  api.go = (name) => {
    if (name !== current) { prev = current; current = name; }
    document.querySelectorAll('.screen').forEach((el) => el.classList.toggle('on', el.dataset.screen === name));
    document.querySelectorAll('[data-nav] [data-go]').forEach((el) => el.dataset.go === name ? el.setAttribute('aria-current', 'page') : el.removeAttribute('aria-current'));
    const sc = document.querySelector(`.screen[data-screen="${name}"]`); if (sc) sc.scrollTop = 0;
    hooks.onGo && hooks.onGo(name);
  };
  api.back = () => api.go(prev && !['detail', 'artist'].includes(prev) ? prev : 'home');
  api.sheet = (id, on) => { const el = document.getElementById(id); if (el) el.classList.toggle('on', on); };
  api.toast = (msg) => {
    const t = document.querySelector('.toast'); if (!t) return;
    t.textContent = msg; t.classList.add('on'); clearTimeout(api.toast.h);
    api.toast.h = setTimeout(() => t.classList.remove('on'), 2200);
  };
  api.everySecond = (fn) => { fn(); return setInterval(fn, 1000); };

  /* 首頁票卡：一般橫向捲動（不做 3D 變形，捲動時不重算每張卡的圖層），只更新指示點 */
  api.coverflow = (track, dots) => {
    let raf = 0;
    const update = () => {
      raf = 0; const kids = track.children; if (!dots) return;
      if (kids.length < 2) { dots.innerHTML = ''; return; }
      const mid = track.scrollLeft + track.clientWidth / 2; let active = 0, best = Infinity;
      for (let i = 0; i < kids.length; i++) { const d = Math.abs(kids[i].offsetLeft + kids[i].offsetWidth / 2 - mid); if (d < best) { best = d; active = i; } }
      if (dots.childElementCount !== kids.length) dots.innerHTML = '<span></span>'.repeat(kids.length);
      [...dots.children].forEach((d, i) => d.classList.toggle('on', i === active));
    };
    if (!track.dataset.cf) { track.dataset.cf = '1'; track.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true }); }
    update();
    return update;
  };

  api.init = (h) => {
    hooks = h;
    document.addEventListener('click', (e) => {
      const t = e.target;
      const go = t.closest('[data-go]'); if (go) { api.go(go.dataset.go); return; }
      const op = t.closest('[data-open]'); if (op) { hooks.detail(op.dataset.open); api.go('detail'); return; }
      if (t.closest('[data-back]')) { api.back(); return; }
      const sh = t.closest('[data-sheet]'); if (sh) { api.sheet(sh.dataset.sheet, true); return; }
      const cl = t.closest('[data-close]'); if (cl) { cl.closest('.sheet').classList.remove('on'); return; }
      const ts = t.closest('[data-toast]'); if (ts) api.toast(ts.dataset.toast);
    });
    hooks.render();
    api.go('home');
  };
  return api;
})();
