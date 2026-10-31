/* 6 款原型共用：範例資料、統計、畫面切換、表單。資料只在記憶體，重新整理即重置。 */
const P = (() => {
  const pad = (n) => String(n).padStart(2, '0');
  const localISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const plus = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return localISO(d); };
  const today = localISO(new Date());
  const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  const shows = [
    { id: 's1', artist: '五月天 Mayday', tour: '回到那一天 巡迴演唱會', date: '2025-12-31', time: '19:30', venue: '台北大巨蛋', city: '台北', seat: '搖滾 A2', price: 4880, rating: 5, with: '阿明, 小雅', status: 'attended', setlist: ['擁抱', '知足', '倔強', '憨人', '派對動物'], encore: ['人生海海', '倔強'], notes: '跨年倒數全場大合唱，手機燈海像整座城市都亮了。', hue: 'c' },
    { id: 's2', artist: 'YOASOBI', tour: 'ASIA TOUR', date: '2025-06-22', time: '18:00', venue: '台北小巨蛋', city: '台北', seat: '2 樓 B 區', price: 3800, rating: 5, with: '小雅', status: 'attended', setlist: ['アイドル', '夜に駆ける', '群青', '怪物'], encore: ['祝福'], notes: '', hue: 'm' },
    { id: 's3', artist: 'Coldplay', tour: 'Music of the Spheres', date: '2024-11-12', time: '19:00', venue: '高雄國家體育場', city: '高雄', seat: '搖滾區', price: 6800, rating: 5, with: '阿明', status: 'attended', setlist: ['Higher Power', 'Viva la Vida', 'Yellow', 'A Sky Full of Stars'], encore: ['Fix You'], notes: '發光手環同步變色超震撼。', hue: 'c' },
    { id: 's4', artist: '告五人 Accusefive', tour: '我肯定在幾百年前就說過愛你', date: '2024-11-04', time: '19:00', venue: '高雄巨蛋', city: '高雄', seat: '特 A 區', price: 3600, rating: 4, with: '', status: 'attended', setlist: ['愛人錯過', '帶我去找夜生活'], encore: ['唯一'], notes: '', hue: 'y' },
    { id: 's5', artist: '落日飛車', tour: 'Soft Storm Tour', date: '2023-08-19', time: '20:00', venue: 'Zepp New Taipei', city: '新北', seat: '2F 自由座', price: 2200, rating: 4, with: '阿明', status: 'attended', setlist: ['My Jinji', 'Candy Wrapper'], encore: ['Vanilla Villa'], notes: '', hue: 'y' },
    { id: 's6', artist: '草東沒有派對', tour: '瓦合 巡迴', date: plus(23), time: '20:00', venue: 'Legacy Taipei', city: '台北', seat: '站位 #0128', price: 1800, rating: 0, with: '', status: 'going', setlist: [], encore: [], notes: '', hue: 'm' },
    { id: 's7', artist: 'Daft Punk', tour: '（如果他們復出）', date: plus(400), time: '', venue: '', city: '', seat: '', price: 0, rating: 0, with: '', status: 'wish', setlist: [], encore: [], notes: '永遠的願望清單。', hue: 'y' }
  ];

  const sorted = () => [...shows].sort((a, b) => b.date.localeCompare(a.date));
  const STATUS = { attended: '已參加', going: '即將前往', wish: '願望清單', presale: '等開賣' };
  const STATUS_EN = { attended: 'ATTENDED', going: 'INCOMING', wish: 'WISHLIST', presale: 'ON SALE SOON' };

  const api = {
    shows, today, MON, STATUS, STATUS_EN, pad,
    list(f = 'all', q = '') {
      q = q.trim().toLowerCase();
      return sorted().filter((s) => (f === 'all' || s.status === f) &&
        (!q || [s.artist, s.tour, s.venue, s.city, s.setlist.join(' '), s.encore.join(' ')].join(' ').toLowerCase().includes(q)));
    },
    attended() { return sorted().filter((s) => s.status === 'attended'); },
    get(id) { return shows.find((s) => s.id === id); },
    next() { return shows.filter((s) => s.status === 'going' && s.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0]; },
    parts(date) { const [y, m, d] = date.split('-'); return { y, yy: y.slice(2), m, d, mon: MON[+m - 1], md: `${m}.${d}` }; },
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
      const count = (key) => {
        const m = new Map(); for (const s of a) if (s[key]) m.set(s[key], (m.get(s[key]) || 0) + 1);
        return [...m].sort((x, y) => y[1] - x[1]);
      };
      const years = {}; for (const s of a) years[s.date.slice(0, 4)] = (years[s.date.slice(0, 4)] || 0) + 1;
      const rated = a.filter((s) => s.rating);
      return {
        total: a.length,
        artists: new Set(a.map((s) => s.artist)).size,
        venues: count('venue'), cities: count('city'), topArtists: count('artist'),
        years: Object.keys(years).sort().map((y) => [y, years[y]]),
        avg: rated.length ? (rated.reduce((t, s) => t + s.rating, 0) / rated.length).toFixed(1) : '—',
        songs: a.reduce((t, s) => t + api.songs(s), 0),
        spend: a.reduce((t, s) => t + (s.price || 0), 0)
      };
    },
    esc(v) { return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
    add(o) {
      const lines = (o.setlistText || '').split('\n').map((l) => l.trim()).filter(Boolean);
      const cut = lines.findIndex((l) => /^(encore|安可)$/i.test(l));
      const s = {
        id: 'n' + Date.now(), artist: o.artist, tour: o.tour || '', date: o.date, time: o.time || '', venue: o.venue || '', city: o.city || '',
        seat: o.seat || '', price: Number(o.price) || 0, qty: Number(o.qty) || 1, fee: Number(o.fee) || 0, cur: o.cur || 'TWD', rating: Number(o.rating) || 0, with: '', notes: o.notes || '',
        status: o.status || (o.date > today ? 'going' : 'attended'), sale: o.sale || '', photos: [], cat: o.cat || 'concert', hue: ['c', 'm', 'y'][shows.length % 3],
        setlist: cut < 0 ? lines : lines.slice(0, cut), encore: cut < 0 ? [] : lines.slice(cut + 1)
      };
      shows.push(s);
      return s;
    }
  };

  /* ---- 畫面切換 ---- */
  let hooks = {}, current = null, prev = null;
  api.go = (name) => {
    if (name !== current) { prev = current; current = name; }
    document.querySelectorAll('.screen').forEach((el) => el.classList.toggle('on', el.dataset.screen === name));
    document.querySelectorAll('[data-go]').forEach((el) => {
      if (el.closest('[data-nav]')) el.dataset.go === name ? el.setAttribute('aria-current', 'page') : el.removeAttribute('aria-current');
    });
    const sc = document.querySelector(`.screen[data-screen="${name}"]`); if (sc) sc.scrollTop = 0;
    hooks.onGo && hooks.onGo(name);
  };
  api.back = () => api.go(prev && prev !== 'detail' && prev !== 'new' ? prev : hooks.home || 'home');
  api.sheet = (id, on) => { const el = document.getElementById(id); if (el) el.classList.toggle('on', on); };
  api.toast = (msg) => {
    const t = document.querySelector('.toast'); if (!t) return;
    t.textContent = msg; t.classList.add('on'); clearTimeout(api.toast.h);
    api.toast.h = setTimeout(() => t.classList.remove('on'), 2000);
  };
  api.everySecond = (fn) => { fn(); return setInterval(fn, 1000); };

  /* 3D 封面輪播：依卡片離中心的距離做旋轉與縮放，並更新指示點 */
  api.coverflow = (track, dots) => {
    const update = () => {
      const mid = track.scrollLeft + track.clientWidth / 2;
      let active = 0, best = Infinity;
      [...track.children].forEach((card, i) => {
        const c = card.offsetLeft + card.offsetWidth / 2;
        const k = Math.max(-1.5, Math.min(1.5, (c - mid) / card.offsetWidth));
        card.style.transform = `perspective(900px) rotateY(${-k * 28}deg) scale(${1 - Math.abs(k) * 0.12})`;
        card.style.opacity = String(1 - Math.min(Math.abs(k), 1) * 0.45);
        card.style.zIndex = String(10 - Math.round(Math.abs(k) * 5));
        if (Math.abs(k) < best) { best = Math.abs(k); active = i; }
      });
      if (dots) dots.innerHTML = [...track.children].map((_, i) => `<span class="${i === active ? 'on' : ''}"></span>`).join('');
    };
    track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    addEventListener('resize', update);
    update();
    return update;
  };

  api.init = (h) => {
    hooks = h;
    document.addEventListener('click', (e) => {
      const t = e.target;
      const go = t.closest('[data-go]'); if (go) { api.go(go.dataset.go); return; }
      const open = t.closest('[data-open]'); if (open) { hooks.detail(open.dataset.open); api.go('detail'); return; }
      if (t.closest('[data-back]')) { api.back(); return; }
      const sh = t.closest('[data-sheet]'); if (sh) { api.sheet(sh.dataset.sheet, true); return; }
      const cl = t.closest('[data-close]'); if (cl) { cl.closest('.sheet').classList.remove('on'); return; }
      const ts = t.closest('[data-toast]'); if (ts) api.toast(ts.dataset.toast);
    });
    document.querySelectorAll('form[data-add]').forEach((f) => f.addEventListener('submit', (e) => {
      e.preventDefault();
      const o = Object.fromEntries(new FormData(f));
      if (!o.artist || !o.date) { api.toast(!o.artist ? '請輸入藝人名稱' : '請選擇日期'); return; }
      const s = api.add(o);
      f.reset(); f.querySelectorAll('[name=date]').forEach((i) => { i.value = today; });
      f.closest('.sheet') && f.closest('.sheet').classList.remove('on');
      hooks.render();
      hooks.detail(s.id); api.go('detail');
      api.toast('已新增（原型不會存檔）');
    }));
    document.querySelectorAll('input[type=date][name=date]').forEach((i) => { i.value = today; });
    hooks.render();
    api.go(hooks.home || 'home');
  };
  return api;
})();
