/* 링크 창 (인디자인의 '링크' 패널처럼) · 유실 사진 확인
   - 링크 창: 앨범에 놓인 사진을 모두 보여 줌 (파일 이름 · 쪽 · 픽셀 · 실제 dpi · 상태).
     줄을 누르면 그 사진틀로 가서 고르고, 틀을 누르면 그 줄이 표시됨.
     [사진 불러오기]: 고른 틀에 사진을 넣거나 다른 파일로 바꿈(다시 연결). 비율이 비슷하면 위치 · 확대는 그대로 둠.
   - 사진은 앨범 안(브라우저 저장 공간)에 복사돼 있고, 원본 파일과도 '연결'해 둘 수 있음
     (패키지를 만들면 Links 폴더 파일과 자동 연결, 또는 링크 창의 [원본 폴더 연결]).
     연결된 원본이 옮겨지거나 지워지면 ⛔ 원본 파일 없음, 내용이 바뀌면 ⚠ 원본 수정됨.
     앨범을 열 때와 다른 창(탐색기 등)에서 돌아올 때마다 검사함.
   - 사진 데이터 유실: 브라우저 저장 공간에서 사진 데이터가 사라지거나 읽을 수 없게 된 사진 (⛔ 사진 유실) */
(() => {
  const LOW = 200;
  const LK = { lost: new Map(), file: new Map(), links: {}, roots: [], need: 0, checked: false, filter: 'all', open: false, shown: '' };
  const $l = s => document.querySelector(s);
  const isBackup = k => k.includes('--');      // orig-- · rot0-- 등 보관본
  const nameOf = (key, r) => r?.nm || r?.blob?.name || LK.lost.get(key)?.nm || LK.links[key]?.nm || '(이름 모름)';
  const pageList = () => [...document.querySelectorAll('#pages .page')];
  const pageNoOf = el => { const pg = el.closest('.page'); return pg ? pageList().indexOf(pg) + 1 : 0; };
  const stOf = key => (LK.lost.has(key) ? 'lost' : LK.file.get(key) || (LK.links[key] ? 'linked' : 'embed'));
  const isBad = st => st === 'lost' || st === 'missing';
  const IMG_RE = /\.(jpe?g|png|webp|gif|tiff?|bmp|heic)$/i;
  const note = t => window.proNote?.(t);

  /* ---------- 원본 파일 연결 정보 (별도 IndexedDB: 파일 핸들) ---------- */
  const LKDB = {
    db: null,
    async open() {
      if (this.db) return this.db;
      this.db = await new Promise(res => {
        try {
          const r = indexedDB.open(dbNameOf(PROJECT_ID) + '-lk', 1);
          r.onupgradeneeded = () => r.result.createObjectStore('k');
          r.onsuccess = () => res(r.result); r.onerror = () => res(null);
        } catch { res(null); }
      });
      return this.db;
    },
    async get(k) { const db = await this.open(); if (!db) return; return new Promise(res => { const q = db.transaction('k').objectStore('k').get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(); }); },
    async set(k, v) { const db = await this.open(); if (!db) return; return new Promise(res => { const t = db.transaction('k', 'readwrite'); t.objectStore('k').put(v, k); t.oncomplete = res; t.onerror = res; }); },
  };
  const saveLinks = () => Promise.all([LKDB.set('links', LK.links), LKDB.set('roots', LK.roots)]);
  async function addRoot(dir) {
    for (const d of LK.roots) { try { if (await d.isSameEntry(dir)) return; } catch {} }
    LK.roots.push(dir);
  }
  /** src: 파일 경로(문자열, 서버가 확인 · 인디자인 방식) 또는 브라우저 파일 핸들. f: { name, size, lastModified } */
  const setLink = (key, src, f) => { LK.links[key] = { ...(typeof src === 'string' ? { path: src } : { fh: src }), nm: f.name, size: f.size, mod: f.lastModified }; if (photos[key]) photos[key].nm ||= f.name; };

  /* ---------- 앨범 서버(serve.ps1): 실제 경로로 원본 확인 · 폴더 고르기 창 ---------- */
  const SH = { 'X-Album': '1' };
  let srvP = null;
  const srvOk = () => (srvP ||= fetch('/__lk/ping', { headers: SH }).then(r => r.ok).catch(() => false));
  async function srv(op, q = {}, body) {
    const r = await fetch(`/__lk/${op}?${new URLSearchParams(q)}`, { method: body ? 'POST' : 'GET', headers: SH, body });
    if (!r.ok && r.status !== 404) throw new Error(`서버 오류 (${op} ${r.status})`);
    return r.json();
  }
  /** 경로의 파일을 서버에서 받아 File로 */
  async function readPath(path, nm) {
    const r = await fetch(`/__lk/read?${new URLSearchParams({ path })}`, { headers: SH });
    if (!r.ok) throw new Error(`원본 파일을 읽을 수 없습니다: ${path}`);
    const b = await r.blob();
    return new File([b], nm || path.split('\\').pop(), { type: b.type });
  }
  const statInfo = f => ({ name: f.n || f.p.split('\\').pop(), size: f.s, lastModified: f.m });

  /* ---------- 검사 ---------- */
  async function readable(b) {
    if (!b || !b.size) return false;
    try { await b.slice(0, 32).arrayBuffer(); return true; } catch { return false; }
  }
  async function checkData() {
    const recs = await DB.all(), lost = new Map();
    await Promise.all(Object.entries(recs).map(async ([k, r]) => {
      if (isBackup(k) || !r) return;
      if (r.blob?.name && photos[k] && !photos[k].nm) photos[k].nm = r.blob.name;
      if (!(await readable(r.blob))) lost.set(k, { nm: r.nm || r.blob?.name || '', w: r.w, h: r.h, rec: r });
    }));
    LK.lost = lost;
  }
  /** 연결된 원본 파일 확인. ask: 권한을 물어도 되는지 (단추를 누른 때만 가능) */
  async function checkFiles(ask) {
    const file = new Map();
    let need = 0, dirty = false;
    if (ask) for (const d of LK.roots) { try { if (await d.queryPermission({ mode: 'read' }) !== 'granted') await d.requestPermission({ mode: 'read' }); } catch {} }
    const byPath = [];
    for (const [key, e] of Object.entries(LK.links)) {
      const r = photos[key];
      if (r && e.nm && r.nm && r.nm !== e.nm) { delete LK.links[key]; dirty = true; continue; }      // 앱에서 다른 사진으로 바꿈 → 연결 풀기
      if (!r && !LK.lost.has(key)) continue;
      if (e.path) { byPath.push([key, e]); continue; }
      let p = 'granted';
      try { p = (await e.fh.queryPermission?.({ mode: 'read' })) || 'granted'; if (p !== 'granted' && ask) p = await e.fh.requestPermission({ mode: 'read' }); } catch {}
      if (p !== 'granted') { need++; continue; }
      try {
        const f = await e.fh.getFile();
        if (f.size !== e.size || f.lastModified > e.mod + 2000) file.set(key, 'modified');
      } catch (err) {
        if (err.name === 'NotFoundError') file.set(key, 'missing'); else need++;
      }
    }
    // 경로로 연결된 원본: 서버가 한 번에 확인 (권한 묻기 없음)
    LK.srvDown = false;
    if (byPath.length) {
      if (await srvOk()) {
        try {
          const res = await srv('stat', {}, JSON.stringify(byPath.map(([, e]) => e.path)));
          (res.files || []).forEach((f, i) => {
            const [key, e] = byPath[i] || [];
            if (!key) return;
            if (!f.ok) file.set(key, 'missing');
            else if (f.s !== e.size || (e.mod && f.m > e.mod + 2000)) file.set(key, 'modified');
          });
        } catch (err) { console.warn('링크 확인 실패', err); LK.srvDown = true; }
      } else LK.srvDown = true;
    }
    if (dirty) saveLinks();
    LK.file = file; LK.need = need;
  }
  let busy = false;
  /** 전체 검사 → 표시 · 숫자 · (새 문제가 있으면) 오류 창 */
  async function runCheck({ ask = false, dialog = 'new' } = {}) {
    if (busy) return;
    busy = true;
    try {
      await checkData();
      await checkFiles(ask);
      LK.checked = true;
      markAll(); topCount(); refresh();
      const bad = problems().map(([k, st]) => k + st).sort().join('|');
      if (dialog === 'always' || (dialog === 'new' && bad && bad !== LK.shown)) showLostDialog();
      LK.shown = bad;
      if (LK.need && dialog !== 'none') note('원본 파일을 확인하려면 링크 창에서 [원본 확인 허용]을 눌러 주세요.');
    } finally { busy = false; }
  }
  const problems = () => {
    const out = [...LK.lost.keys()].map(k => [k, 'lost']);
    for (const [k, st] of LK.file) if (!LK.lost.has(k)) out.push([k, st]);
    return out;
  };

  /* ---------- 사진틀 표시 ---------- */
  const BADGE = {
    lost: ['', '⛔ 사진 유실'],
    missing: ['lnk-mis', '⛔ 원본 파일 없음'],
    modified: ['lnk-mod', '⚠ 원본 수정됨'],
  };
  function mark(el) {
    const key = el.dataset.photo, st = stOf(key), want = BADGE[st];
    el.classList.toggle('lnk-lost', st === 'lost');
    const b = el.querySelector(':scope > .lnk-badge');
    if (b && (!want || b.dataset.st !== st)) b.remove();
    if (want && (!b || b.dataset.st !== st)) el.insertAdjacentHTML('beforeend', `<span class="lnk-badge ${want[0]}" data-st="${st}"><b>${want[1]}</b><i>${esc(nameOf(key, photos[key]))}</i></span>`);
  }
  const markAll = () => document.querySelectorAll('.photo[data-photo]').forEach(mark);
  const origApply = applyPhoto;
  applyPhoto = function (el) { origApply(el); if (LK.lost.size || LK.file.size || el.querySelector(':scope > .lnk-badge')) mark(el); };      // 다시 그려도 표시가 남게

  /* ---------- 줄 목록 ---------- */
  function rows() {
    const out = [], seen = new Set();
    pageList().forEach((pg, i) => {
      const pw = pg.offsetWidth;
      pg.querySelectorAll('.photo[data-photo]').forEach(el => {
        const key = el.dataset.photo, r = photos[key], st = stOf(key);
        if ((!r && st !== 'lost') || seen.has(key)) return;
        seen.add(key);
        let dpi = 0;
        const rw = el.offsetWidth, rh = el.offsetHeight;
        if (r && rw && rh && pw) {
          const s = (el.classList.contains('contain') ? Math.min : Math.max)(rw / r.w, rh / r.h) * (r.z || 1);
          dpi = Math.round(pw * 25.4 / (s * G.pageMm));
        }
        out.push({ key, page: i + 1, pid: pg.dataset.pid, name: nameOf(key, r), dpi, st, low: st !== 'lost' && dpi && dpi < LOW, hidden: !rw });
      });
    });
    for (const [key] of problems()) if (!seen.has(key)) { seen.add(key); out.push({ key, page: 0, name: nameOf(key, photos[key]), dpi: 0, st: stOf(key) }); }      // 쪽에 없는 사진 (예: 빠진 갤러리 칸)
    return out;
  }

  /* ---------- 고르기 · 이동 ---------- */
  function goTo(key, pid) {
    const ph = document.querySelector(`#pages .page${pid ? `[data-pid="${CSS.escape(pid)}"]` : ''} .photo[data-photo="${CSS.escape(key)}"]`) || document.querySelector(`.photo[data-photo="${CSS.escape(key)}"]`);
    if (!ph) return false;
    ph.scrollIntoView({ block: 'center', inline: 'center' });
    try { frameClick(ph, key, false); } catch (e) { console.warn(e); }
    LK.cur = key; hilite();
    return true;
  }
  const selKey = () => (frameSel && frameSel.kind !== 'text' ? frameSel.key : null);
  function hilite() {
    const k = selKey() || LK.cur;
    document.querySelectorAll('#lk-panel .lk-row').forEach(r => r.classList.toggle('on', r.dataset.key === k));
    drawSel();
  }
  const origSync = syncFrameSel;
  syncFrameSel = function () { origSync.apply(this, arguments); if (LK.open) { LK.cur = selKey() || LK.cur; hilite(); $l(`#lk-panel .lk-row[data-key="${CSS.escape(LK.cur || '')}"]`)?.scrollIntoView({ block: 'nearest' }); } };

  /* ---------- 사진 불러오기 / 다시 연결 ---------- */
  /** 사진 데이터를 file로 바꿈. fh가 있으면 원본 파일로 연결 */
  async function relink(key, file, src, info) {
    if (!file || !(/^image\//.test(file.type) || IMG_RE.test(file.name))) throw new Error('사진 파일이 아닙니다.');
    const old = photos[key] || LK.lost.get(key)?.rec;
    const { w, h } = await imageSize(file);
    const keep = old?.w && old?.h && Math.abs(Math.log((old.w / old.h) / (w / h))) < .03 && !old.rot;      // 비율이 같으면 위치 · 확대 그대로
    if (!keep) await setPhoto(key, file);
    else {
      if (photos[key]?.url) URL.revokeObjectURL(photos[key].url);
      for (const p of ['orig--', 'rot0--']) if (photos[p + key]) { delete photos[p + key]; await DB.drop(p + key); }
      const rec = { blob: file, w, h, x: old.x ?? 50, y: old.y ?? 50, z: old.z ?? 1, shape: old.shape, solo: old.solo, nm: file.name };
      photos[key] = { ...rec, url: URL.createObjectURL(file) };
      await DB.put(key, rec);
      applyKey(key);
      if (isGalKey(key)) relayoutGallery(key);
    }
    if (photos[key]) photos[key].nm = file.name;
    if (src) setLink(key, src, info || file); else delete LK.links[key];
    await saveLinks();
    LK.lost.delete(key); LK.file.delete(key);
    document.querySelectorAll(`.photo[data-photo="${CSS.escape(key)}"]`).forEach(mark);
    topCount();
  }
  function pickInput(multiple, dir) {
    return new Promise(res => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = !!multiple;
      if (dir) inp.webkitdirectory = true;
      inp.onchange = () => res([...inp.files]);
      inp.addEventListener('cancel', () => res([]));
      inp.click();
    });
  }
  /** 파일 하나 고르기: 가능하면 핸들까지 (원본 연결용) */
  async function pickOne() {
    if (window.showOpenFilePicker) {
      try {
        const [fh] = await showOpenFilePicker({ id: 'gradalbum-links', types: [{ description: '사진', accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tif', '.tiff', '.bmp'] } }] });
        return { fh, file: await fh.getFile() };
      } catch (e) { if (e.name === 'AbortError') return {}; }
    }
    const [file] = await pickInput();
    return { file };
  }
  async function relinkPick(key) {
    try {
      const r = photos[key], same = s => LK.file.get(key) === 'missing' && r?.blob && s === LK.links[key]?.size;
      if (await srvOk()) {      // 서버의 파일 고르기 창 → 실제 경로로 연결
        note('파일 고르기 창을 띄웠습니다 (안 보이면 작업 표시줄을 확인하세요)');
        const f = await srv('pickfile');
        if (!f.ok) return;
        const info = statInfo(f);
        if (same(f.s)) setLink(key, f.p, info);      // 옮겨진 같은 파일: 연결만 다시
        else await relink(key, await readPath(f.p, info.name), f.p, info);
        await saveLinks(); LK.file.delete(key); markAll(); topCount();
        note(`연결했습니다: ${f.p}`);
        return;
      }
      const { fh, file } = await pickOne();
      if (!file) return;
      if (fh && same(file.size)) { setLink(key, fh, file); await saveLinks(); LK.file.delete(key); markAll(); topCount(); }
      else await relink(key, file, fh);
      note(`연결했습니다: ${file.name}`);
    } catch (e) { alert(e.message); }
    finally { refresh(); }
  }
  /** 수정된 원본 · 유실된 데이터를 연결된 원본 파일에서 다시 읽기 */
  async function updateFromLink(key) {
    const e = LK.links[key];
    if (!e) return false;
    try {
      if (e.path) {
        const st = (await srv('stat', {}, JSON.stringify([e.path]))).files?.[0];
        if (!st?.ok) throw new Error('원본 파일이 없습니다');
        await relink(key, await readPath(e.path, e.nm), e.path, statInfo(st));
      } else await relink(key, await e.fh.getFile(), e.fh);
      return true;
    } catch (err) { console.warn('업데이트 실패', key, err); alert(`업데이트하지 못했습니다: ${err.message}`); return false; }
  }
  /** 원본 폴더 연결 / 찾기 (서버): 실제 폴더를 고르면 하위 폴더까지 같은 이름의 파일을 찾아 경로로 연결 */
  async function connectFolderSrv() {
    note('폴더 고르기 창을 띄웠습니다 (안 보이면 작업 표시줄을 확인하세요)');
    const pk = await srv('pick', { title: '원본 사진 폴더를 고르세요 (하위 폴더까지 같은 이름의 파일을 찾습니다)' });
    if (!pk.ok) return;
    note('폴더 살펴보는 중…');
    const sc = await srv('scan', { dir: pk.path }), byName = new Map();
    for (const f of sc.files || []) if (!byName.has(f.n.toLowerCase())) byName.set(f.n.toLowerCase(), f);
    let linked = 0, fixed = 0;
    const miss = [], keys = new Set([...Object.keys(photos).filter(k => !isBackup(k)), ...LK.lost.keys()]);
    for (const key of keys) {
      const nm = nameOf(key, photos[key]), f = byName.get(String(nm).toLowerCase()), st = stOf(key);
      if (!f) { if (isBad(st)) miss.push(nm); continue; }
      try {
        if (st === 'lost') { await relink(key, await readPath(f.p, f.n), f.p, statInfo(f)); fixed++; }
        else { setLink(key, f.p, statInfo(f)); linked++; }
      } catch { if (isBad(st)) miss.push(nm); }
    }
    await saveLinks();
    await runCheck({ dialog: 'none' });
    alert(`'${pk.path}' 폴더와 연결했습니다.\n연결 ${linked + fixed}장${fixed ? ` (유실 데이터 복구 ${fixed}장)` : ''}${miss.length ? `\n못 찾은 사진 ${miss.length}장: ${miss.slice(0, 8).join(', ')}${miss.length > 8 ? ' …' : ''}` : ''}`);
  }
  /** 원본 폴더 연결 / 찾기: 폴더(하위 폴더 포함)에서 같은 이름의 파일과 연결. 데이터가 유실된 사진은 그 파일로 복구 */
  async function connectFolder() {
    if (await srvOk()) { try { return await connectFolderSrv(); } catch (e) { alert(e.message); return; } }
    if (!window.showDirectoryPicker) return relinkFolderInput();
    let dir;
    try { dir = await showDirectoryPicker({ id: 'gradalbum-links', mode: 'read' }); } catch { return; }
    note('폴더 살펴보는 중…');
    const byName = new Map();
    let n = 0;
    const walk = async (d, depth) => {
      for await (const [name, h] of d.entries()) {
        if (n > 50000) return;
        if (h.kind === 'file') { n++; if (IMG_RE.test(name) && !byName.has(name.toLowerCase())) byName.set(name.toLowerCase(), h); }
        else if (depth < 5 && !name.startsWith('.')) await walk(h, depth + 1);
      }
    };
    await walk(dir, 0);
    await addRoot(dir);
    let linked = 0, fixed = 0;
    const miss = [], keys = new Set([...Object.keys(photos).filter(k => !isBackup(k)), ...LK.lost.keys()]);
    for (const key of keys) {
      const nm = nameOf(key, photos[key]), fh = byName.get(String(nm).toLowerCase()), st = stOf(key);
      if (!fh) { if (isBad(st)) miss.push(nm); continue; }
      try {
        const f = await fh.getFile();
        if (st === 'lost') { await relink(key, f, fh); fixed++; } else { setLink(key, fh, f); linked++; }
      } catch { if (isBad(st)) miss.push(nm); }
    }
    await saveLinks();
    await runCheck({ dialog: 'none' });
    alert(`'${dir.name}' 폴더와 연결했습니다.\n연결 ${linked + fixed}장${fixed ? ` (유실 데이터 복구 ${fixed}장)` : ''}${miss.length ? `\n못 찾은 사진 ${miss.length}장: ${miss.slice(0, 8).join(', ')}${miss.length > 8 ? ' …' : ''}` : ''}`);
  }
  /** 폴더 고르기 창이 없는 브라우저: 파일 목록으로 유실 데이터만 복구 */
  async function relinkFolderInput() {
    const files = await pickInput(true, true);
    if (!files.length) return;
    const byName = new Map(files.map(f => [f.name.toLowerCase(), f]));
    let ok = 0;
    const miss = [];
    for (const [key, v] of [...LK.lost]) {
      const f = v.nm && byName.get(v.nm.toLowerCase());
      if (!f) { miss.push(v.nm || key); continue; }
      try { await relink(key, f); ok++; } catch { miss.push(v.nm || key); }
    }
    refresh();
    alert(`${ok}장을 다시 연결했습니다.${miss.length ? `\n못 찾은 사진 ${miss.length}장: ${miss.slice(0, 8).join(', ')}` : ''}`);
  }
  /** 패키지가 Links 폴더에 쓴 파일과 연결 (package.js) */
  async function register(root, items) {
    if (root) await addRoot(root);
    for (const it of items) { try { if (it.path) setLink(it.key, it.path, { name: it.n, size: it.s, lastModified: it.m }); else setLink(it.key, it.fh, await it.fh.getFile()); } catch {} }
    await saveLinks();
    await runCheck({ dialog: 'none' });
  }

  /* ---------- 링크 창 ---------- */
  const ICON = {
    lost: '<span class="lk-st lost" title="사진 데이터 유실">⛔</span>',
    missing: '<span class="lk-st lost" title="원본 파일 없음 (옮겨지거나 지워짐)">⛔</span>',
    modified: '<span class="lk-st low" title="원본 파일이 바뀜">⚠</span>',
    linked: '<span class="lk-st ok" title="원본 파일과 연결됨">🔗</span>',
    embed: '<span class="lk-st em" title="앨범 안에만 있음 (원본 파일과 연결 안 됨)">▣</span>',
  };
  const STXT = { lost: '유실', missing: '파일 없음', modified: '수정됨' };
  function drawPanel() {
    const p = $l('#lk-panel');
    if (!p) return;
    const all = rows(), nBad = all.filter(r => isBad(r.st)).length, nMod = all.filter(r => r.st === 'modified').length, nLow = all.filter(r => r.low).length;
    const list = all.filter(r => LK.filter === 'all' || (LK.filter === 'bad' ? isBad(r.st) : LK.filter === 'mod' ? r.st === 'modified' : r.low));
    p.querySelector('.lk-tabs').innerHTML = [['all', `전체 ${all.length}`], ['bad', `⛔ 유실 ${nBad}`], ...(nMod ? [['mod', `⚠ 수정됨 ${nMod}`]] : []), ['low', `저해상도 ${nLow}`]].map(([k, t]) => `<button type="button" data-f="${k}" class="${LK.filter === k ? 'on' : ''}">${t}</button>`).join('');
    p.querySelector('.lk-list').innerHTML = list.length ? list.map(r => {
      const rec = photos[r.key], src = r.st !== 'lost' && rec ? photoSrc(rec) : '';
      return `<div class="lk-row ${isBad(r.st) ? 'lost' : r.st === 'modified' ? 'mod' : ''}" data-key="${esc(r.key)}" data-pid="${esc(r.pid || '')}" title="${esc(r.name)}">
        ${ICON[r.st]}<span class="lk-th">${src ? `<img loading="lazy" src="${esc(src)}" alt="">` : ''}</span>
        <span class="lk-nm">${esc(r.name)}</span><span class="lk-pg">${r.page ? `P.${String(r.page).padStart(2, '0')}` : '—'}</span><span class="lk-dpi${r.low ? ' low' : ''}">${STXT[r.st] || (r.dpi ? `${r.dpi}dpi` : r.hidden ? '숨김' : '')}</span></div>`;
    }).join('') : `<p class="lk-empty">${LK.filter === 'bad' ? '유실된 사진이 없습니다 ✔' : LK.filter === 'low' ? '저해상도 사진이 없습니다 ✔' : LK.filter === 'mod' ? '수정된 원본이 없습니다 ✔' : '놓인 사진이 없습니다.'}</p>`;
    const nLinked = Object.keys(LK.links).length;
    p.querySelector('.lk-perm').hidden = !LK.need;
    p.querySelector('.lk-perm span').textContent = `원본 파일 ${LK.need}개를 확인하려면 허용이 필요합니다.`;
    p.querySelector('.lk-foot small').textContent = LK.srvDown ? '앨범 서버가 꺼져 있어 원본을 확인하지 못했습니다' : nLinked ? `원본 연결 ${nLinked}장` : '원본 파일과 연결된 사진이 없습니다';
    hilite();
  }
  function drawSel() {
    const box = $l('#lk-panel .lk-sel');
    if (!box) return;
    const key = selKey() || LK.cur;
    if (!key || !(document.querySelector(`.photo[data-photo="${CSS.escape(key)}"]`) || problems().some(([k]) => k === key))) { box.innerHTML = '<span class="lk-hint">사진틀을 누르거나 위 목록에서 사진을 고르세요.</span>'; delete box.dataset.key; return; }
    const r = photos[key], st = stOf(key), el = document.querySelector(`.photo[data-photo="${CSS.escape(key)}"]`), pg = el ? ` · P.${String(pageNoOf(el)).padStart(2, '0')}` : '';
    const stLine = { lost: '<b class="lk-red">⛔ 사진 데이터 유실</b>', missing: '<b class="lk-red">⛔ 원본 파일 없음 (옮겨지거나 지워짐)</b>', modified: '<b class="lk-amber">⚠ 원본 파일이 바뀜</b>', linked: '🔗 원본 파일과 연결됨', embed: '▣ 앨범 안에만 있음' }[st];
    const lp = LK.links[key]?.path, pathLine = lp ? `<br><small class="lk-path" title="${esc(lp)}">${esc(lp)}</small>` : '';
    const info = !r && st !== 'lost' ? `빈 사진틀${pg}` : `${esc(nameOf(key, r))}<br><small>${r ? `${r.w}×${r.h}px · ${(r.blob?.size / 1048576 || 0).toFixed(1)}MB` : ''}${pg}</small><br><small>${stLine}</small>${pathLine}`;
    const can = !!LK.links[key] && (st === 'modified' || st === 'lost');
    box.innerHTML = `<div class="lk-info">${info}</div><div class="lk-acts">
      ${can ? `<button type="button" class="btn primary-soft" data-a="update">${st === 'lost' ? '원본에서 복구' : '⟳ 업데이트'}</button>` : ''}
      <button type="button" class="btn ${can ? 'ghost' : 'primary-soft'}" data-a="load">${isBad(st) ? '🔗 다시 연결…' : r ? '🔗 다른 사진으로 바꾸기…' : '📂 사진 불러오기…'}</button>
      ${el && (r || st === 'lost') ? '<button type="button" class="btn ghost" data-a="go">틀로 가기</button>' : ''}${lp && st !== 'missing' ? '<button type="button" class="btn ghost" data-a="reveal" title="원본 파일이 있는 폴더를 탐색기로 엽니다">📂 탐색기</button>' : ''}</div>`;
    box.dataset.key = key;
  }
  function refresh() { if (LK.open) drawPanel(); }
  function openPanel(filter) {
    if (filter) LK.filter = filter;
    let p = $l('#lk-panel');
    if (!p) {
      document.body.insertAdjacentHTML('beforeend', `<div id="lk-panel" role="dialog" aria-label="링크">
        <div class="lk-head"><b>🔗 링크</b><span class="lk-fill"></span><button type="button" data-a="recheck" title="사진 · 원본 파일을 다시 검사">다시 검사</button><button type="button" data-a="close" title="닫기">✕</button></div>
        <div class="lk-perm" hidden><span></span><button type="button" class="btn primary-soft" data-a="perm">원본 확인 허용</button></div>
        <div class="lk-tabs"></div>
        <div class="lk-list"></div>
        <div class="lk-foot"><button type="button" class="btn ghost" data-a="folder" title="원본 사진 폴더(예: 패키지의 Links)를 고르면 같은 이름의 파일과 연결합니다. 옮겨진 파일 · 유실된 사진도 이걸로 찾습니다">📁 원본 폴더 연결 / 찾기</button><small></small></div>
        <div class="lk-sel"></div></div>`);
      p = $l('#lk-panel');
      p.addEventListener('click', async e => {
        const t = e.target.closest('[data-f],[data-a],.lk-row');
        if (!t) return;
        if (t.dataset.f) { LK.filter = t.dataset.f; drawPanel(); return; }
        if (t.classList.contains('lk-row')) { if (!goTo(t.dataset.key, t.dataset.pid)) { LK.cur = t.dataset.key; hilite(); } return; }
        const a = t.dataset.a, key = p.querySelector('.lk-sel').dataset.key;
        if (a === 'close') closePanel();
        else if (a === 'recheck' || a === 'perm') { t.disabled = true; await runCheck({ ask: true, dialog: 'none' }); t.disabled = false; const n = problems().length; note(n ? `링크 문제 ${n}개` : '모든 사진이 정상입니다 ✔'); }
        else if (a === 'folder') connectFolder();
        else if (a === 'update' && key) { await updateFromLink(key); refresh(); }
        else if (a === 'load' && key) relinkPick(key);
        else if (a === 'go' && key) goTo(key);
        else if (a === 'reveal' && key && LK.links[key]?.path) srv('show', { path: LK.links[key].path }).catch(() => {});
      });
      // 머리를 끌어 옮기기
      const head = p.querySelector('.lk-head');
      head.addEventListener('pointerdown', e => {
        if (e.target.closest('button')) return;
        const r = p.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
        const mv = ev => { p.style.left = `${Math.max(0, Math.min(innerWidth - 80, ev.clientX - dx))}px`; p.style.top = `${Math.max(0, Math.min(innerHeight - 40, ev.clientY - dy))}px`; p.style.right = 'auto'; };
        const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); };
        addEventListener('pointermove', mv); addEventListener('pointerup', up);
      });
    }
    p.hidden = false; LK.open = true;
    drawPanel();
  }
  function closePanel() { const p = $l('#lk-panel'); if (p) p.hidden = true; LK.open = false; }

  /* ---------- 오류 창 ---------- */
  const WHY = { lost: '사진 데이터 유실', missing: '원본 파일 없음 (옮겨지거나 지워짐)', modified: '원본 파일이 바뀜' };
  function showLostDialog() {
    const all = rows().filter(r => WHY[r.st]);
    $l('#lk-err')?.remove();
    if (!all.length) return;
    const nBad = all.filter(r => isBad(r.st)).length, nMod = all.length - nBad;
    document.body.insertAdjacentHTML('beforeend', `<div id="lk-err"><div class="lk-ebox${nBad ? '' : ' mod'}">
      <h3>${nBad ? `⛔ 사진 ${nBad}장의 링크가 끊어졌습니다` : ''}${nBad && nMod ? ' · ' : ''}${nMod ? `⚠ 원본 ${nMod}장이 수정되었습니다` : ''}</h3>
      <p>사진틀에도 표시했습니다. 앨범 안에 사진 데이터가 남아 있는 사진은 화면 · 내보내기에 그대로 쓸 수 있습니다.<br>
      <b>원본 파일 없음</b>: 파일을 옮겼으면 [📁 폴더에서 한 번에 찾기]로 새 위치를 고르세요. <b>수정됨</b>: [업데이트]로 바뀐 원본을 다시 읽습니다.</p>
      <div class="lk-etable"><table><thead><tr><th>쪽</th><th>파일 이름</th><th>상태</th><th></th></tr></thead><tbody>
      ${all.map(r => `<tr data-key="${esc(r.key)}" data-pid="${esc(r.pid || '')}"><td>${r.page ? `P.${String(r.page).padStart(2, '0')}` : isGalKey(r.key) ? '행사갤러리 (자리 빠짐)' : '쪽 없음'}</td><td>${esc(r.name)}</td><td class="${isBad(r.st) ? 'lk-red' : 'lk-amber'}">${WHY[r.st]}</td><td>${r.page ? '<button type="button" class="btn ghost" data-e="go">가기</button>' : ''}${LK.links[r.key] && (r.st === 'modified' || r.st === 'lost') ? `<button type="button" class="btn ghost" data-e="upd">${r.st === 'lost' ? '원본에서 복구' : '업데이트'}</button>` : ''}<button type="button" class="btn ghost" data-e="one">다시 연결…</button></td></tr>`).join('')}
      </tbody></table></div>
      <div class="lk-ebtns"><button type="button" class="btn primary-soft" data-e="folder">📁 폴더에서 한 번에 찾기</button>${nMod ? '<button type="button" class="btn ghost" data-e="updall">⟳ 수정된 것 모두 업데이트</button>' : ''}<button type="button" class="btn ghost" data-e="panel">링크 창 열기</button><span class="lk-fill"></span><button type="button" class="btn ghost" data-e="close">닫기</button></div>
    </div></div>`);
    const d = $l('#lk-err');
    const again = () => { d.remove(); if (problems().length) showLostDialog(); };
    d.addEventListener('click', async e => {
      const b = e.target.closest('[data-e]');
      if (!b) return;
      const tr = b.closest('tr'), a = b.dataset.e;
      if (a === 'close') d.remove();
      else if (a === 'panel') { d.remove(); openPanel('bad'); }
      else if (a === 'go') { d.remove(); openPanel(); goTo(tr.dataset.key, tr.dataset.pid); }
      else if (a === 'one') { await relinkPick(tr.dataset.key); again(); }
      else if (a === 'upd') { await updateFromLink(tr.dataset.key); refresh(); again(); }
      else if (a === 'updall') { for (const [k, st] of problems()) if (st === 'modified') await updateFromLink(k); refresh(); again(); }
      else if (a === 'folder') { await connectFolder(); again(); }
    });
  }

  /* ---------- 위 도구줄 단추 ---------- */
  function topCount() {
    const b = $l('#pro-top [data-top="links"]');
    if (!b) return;
    const ps = problems(), bad = ps.filter(([, st]) => isBad(st)).length, mod = ps.length - bad;
    b.innerHTML = `🔗 링크${bad ? ` <span class="lk-cnt">⛔${bad}</span>` : ''}${mod ? ` <span class="lk-cnt amber">⚠${mod}</span>` : ''}${LK.need ? ' <span class="lk-cnt grey" title="원본 확인 허용이 필요합니다">?</span>' : ''}`;
  }
  function addTop() {
    const fast = $l('#pro-top [data-top="fast"]');
    if (!fast || $l('#pro-top [data-top="links"]')) return !!fast;
    fast.insertAdjacentHTML('beforebegin', '<button type="button" data-top="links" title="링크 창: 놓인 사진 목록 · 사진 불러오기 · 유실 사진 확인 (Ctrl+Shift+D)">🔗 링크</button>');
    $l('#pro-top [data-top="links"]').addEventListener('click', () => (LK.open ? closePanel() : openPanel()));
    topCount();
    return true;
  }
  addEventListener('keydown', e => { if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') { e.preventDefault(); LK.open ? closePanel() : openPanel(); } });

  window.openLinks = openPanel;
  window.relinkPhoto = async (key, file, fh) => { await relink(key, file, fh); refresh(); };
  /** 원본 파일 경로 (경로로 연결돼 있고 파일이 있을 때만) — 사진 오른쪽 클릭 메뉴(ps-edit.js)가 씀 */
  window.lkStatus = key => stOf(key);      // 'lost' | 'missing' | 'modified' | 'linked' | 'embed' (속성 창 '연결된 파일')
  window.lkPathOf = key => (!LK.lost.has(key) && LK.file.get(key) !== 'missing' && LK.links[key]?.path) || null;
  /** 포토샵으로 원본을 연 뒤: 원본을 저장하면(시간이 바뀌면) 앨범 사진을 자동으로 업데이트 (2시간 동안 지켜봄) */
  const watching = new Map();
  window.lkWatch = key => {
    const e = LK.links[key];
    if (!e?.path || watching.has(key)) return;
    const st = { m: null, until: Date.now() + 7200000 };
    watching.set(key, st);
    const stat = async () => (await srv('stat', {}, JSON.stringify([e.path]))).files?.[0];
    const tick = async () => {
      if (LK.links[key]?.path !== e.path || Date.now() > st.until) { watching.delete(key); return; }
      try {
        const f = await stat();
        if (f?.ok) {
          if (st.m == null) st.m = f.m;
          else if (f.m !== st.m) {
            await new Promise(r => setTimeout(r, 900));      // 저장이 끝날 때까지 잠깐
            const f2 = await stat();
            st.m = f2.m;
            await relink(key, await readPath(e.path, e.nm), e.path, statInfo(f2));
            refresh();
            note(`원본을 저장해서 앨범 사진을 업데이트했습니다: ${e.nm}`);
          }
        }
      } catch { /* 잠깐 실패해도 계속 */ }
      st.t = setTimeout(tick, 1500);
    };
    stat().then(f => { st.m = f?.ok ? f.m : null; }).catch(() => {}).finally(() => { st.t = setTimeout(tick, 1500); });
  };
  window.checkLinks = (o) => runCheck(o || { dialog: 'none' });
  window.lkRegister = register;
  window.showLostDialog = showLostDialog;

  // 앨범을 다 열면 검사 → 문제가 있으면 오류 창. 다른 창(탐색기 등)에서 돌아올 때도 다시 검사
  (function wait(n) {
    addTop();
    if (!window.__photosLoaded) { if (n < 200) setTimeout(() => wait(n + 1), 300); return; }
    setTimeout(async () => {
      addTop();
      LK.links = (await LKDB.get('links')) || {};
      LK.roots = (await LKDB.get('roots')) || [];
      await runCheck({ dialog: 'new' });
    }, 1200);
  })(0);
  let lastFocus = 0;
  const onBack = () => {
    if (!LK.checked || document.hidden || Date.now() - lastFocus < 1500 || !Object.keys(LK.links).length) return;
    lastFocus = Date.now();
    runCheck({ dialog: 'new' });
  };
  addEventListener('focus', onBack);
  document.addEventListener('visibilitychange', onBack);
  document.getElementById('p-links')?.addEventListener('click', () => openPanel());

  document.head.insertAdjacentHTML('beforeend', `<style>
    .lnk-badge{position:absolute;inset:0;z-index:6;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
      background:repeating-linear-gradient(45deg,rgba(225,29,72,.18) 0 8px,rgba(255,255,255,.35) 8px 16px);outline:2px solid #e11d48;outline-offset:-2px;color:#be123c;text-align:center;overflow:hidden}
    .lnk-badge b{font:700 11px/1.3 system-ui,sans-serif;background:#fff;padding:2px 6px;border-radius:4px}
    .lnk-badge i{font:500 9px/1.2 system-ui,sans-serif;font-style:normal;background:rgba(255,255,255,.85);padding:1px 4px;border-radius:3px;max-width:95%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #lk-panel{position:fixed;right:300px;top:70px;width:380px;max-height:76vh;z-index:10040;background:#fff;color:#222;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,.3);display:flex;flex-direction:column;font:13px/1.4 system-ui,sans-serif}
    #lk-panel[hidden]{display:none}
    #lk-panel .lk-head{display:flex;align-items:center;gap:6px;padding:8px 10px;background:#2b2f36;color:#fff;border-radius:8px 8px 0 0;cursor:move;user-select:none}
    #lk-panel .lk-head button{background:transparent;color:#ddd;border:1px solid #555;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:12px}
    .lk-fill{flex:1}
    #lk-panel .lk-tabs{display:flex;gap:4px;padding:6px 8px;border-bottom:1px solid #eee}
    #lk-panel .lk-tabs button{border:1px solid #ddd;background:#f7f7f7;border-radius:12px;padding:2px 10px;cursor:pointer;font-size:12px}
    #lk-panel .lk-tabs button.on{background:#2b2f36;color:#fff;border-color:#2b2f36}
    #lk-panel .lk-list{overflow:auto;flex:1;min-height:120px}
    #lk-panel .lk-row{display:grid;grid-template-columns:18px 40px 1fr 44px 52px;gap:6px;align-items:center;padding:3px 8px;border-bottom:1px solid #f2f2f2;cursor:pointer}
    #lk-panel .lk-row:hover{background:#f4f7ff}
    #lk-panel .lk-row.on{background:#dbe6ff}
    #lk-panel .lk-row.lost{color:#be123c}
    #lk-panel .lk-th{width:40px;height:30px;background:#eee;border-radius:3px;overflow:hidden;display:block}
    #lk-panel .lk-th img{width:100%;height:100%;object-fit:cover;display:block}
    #lk-panel .lk-nm{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
    #lk-panel .lk-pg,#lk-panel .lk-dpi{font-size:11px;color:#666;text-align:right}
    #lk-panel .lk-row.lost .lk-dpi{color:#be123c;font-weight:600}
    .lk-st.lost{color:#e11d48}.lk-st.low{color:#d97706}.lk-st.ok{color:#16a34a}
    #lk-panel .lk-empty{padding:16px;color:#666;text-align:center}
    #lk-panel .lk-find{margin:6px 8px 0}
    #lk-panel .lk-find[hidden]{display:none}
    #lk-panel .lk-sel{border-top:1px solid #ddd;padding:8px 10px;background:#fafafa;border-radius:0 0 8px 8px}
    #lk-panel .lk-info{margin-bottom:6px;word-break:break-all}
    #lk-panel .lk-acts{display:flex;gap:6px;flex-wrap:wrap}
    #lk-panel .lk-hint{color:#777;font-size:12px}
    .lk-red{color:#e11d48}
    .lnk-badge.lnk-mis,.lnk-badge.lnk-mod{background:rgba(225,29,72,.08);justify-content:flex-start;align-items:flex-start;padding:4px;text-align:left}
    .lnk-badge.lnk-mod{background:rgba(217,119,6,.08);outline-color:#d97706;color:#b45309}
    .lk-amber{color:#b45309}
    #lk-panel .lk-path{color:#1d4ed8;font-size:11px;word-break:break-all}
    .lk-st.em{color:#9ca3af}
    #lk-panel .lk-row.mod{color:#b45309}
    #lk-panel .lk-dpi.low{color:#d97706;font-weight:600}
    #lk-panel .lk-perm{display:flex;gap:8px;align-items:center;padding:6px 10px;background:#fef3c7;color:#92400e;font-size:12px}
    #lk-panel .lk-perm[hidden]{display:none}
    #lk-panel .lk-perm span{flex:1}
    #lk-panel .lk-foot{display:flex;gap:8px;align-items:center;padding:6px 8px 0}
    #lk-panel .lk-foot small{color:#777;font-size:11px}
    .lk-cnt.amber{background:#d97706}.lk-cnt.grey{background:#6b7280}
    #lk-err .lk-ebox.mod{border-top-color:#d97706}
    #lk-err .lk-ebox.mod h3{color:#b45309}
    .lk-cnt{background:#e11d48;color:#fff;border-radius:8px;padding:0 5px;font-size:11px;margin-left:2px}
    #lk-err{position:fixed;inset:0;z-index:10060;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center}
    #lk-err .lk-ebox{background:#fff;color:#222;border-radius:10px;padding:20px 22px;width:min(640px,94vw);max-height:86vh;display:flex;flex-direction:column;border-top:6px solid #e11d48;font:14px/1.5 system-ui,sans-serif}
    #lk-err h3{margin:0 0 8px;color:#be123c;font-size:17px}
    #lk-err p{margin:0 0 10px;font-size:13px;color:#444}
    #lk-err .lk-etable{overflow:auto;border:1px solid #eee;border-radius:6px}
    #lk-err table{width:100%;border-collapse:collapse;font-size:13px}
    #lk-err th,#lk-err td{padding:5px 8px;border-bottom:1px solid #f0f0f0;text-align:left;word-break:break-all}
    #lk-err td:last-child{white-space:nowrap;text-align:right}
    #lk-err .btn,#lk-panel .btn{display:inline-block;width:auto;margin:0}
    #lk-err td .btn{padding:2px 8px;font-size:12px;margin-left:4px}
    #lk-err td:first-child{white-space:nowrap}
    #lk-err .lk-ebtns{display:flex;gap:8px;margin-top:14px;align-items:center}
  </style>`);
})();
