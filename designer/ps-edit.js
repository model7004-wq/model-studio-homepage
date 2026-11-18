/* 사진 오른쪽 클릭 메뉴: 포토샵(다른 프로그램)으로 편집.
   웹 페이지는 프로그램을 직접 실행할 수 없으므로, 사진을 파일로 저장해 두고 그 파일을 지켜봄.
   포토샵에서 그 파일을 열어 Ctrl+S로 저장하면 앨범의 사진이 자동으로 바뀜 (틀 안 위치 · 크기는 그대로).
   파일을 지켜보는 기능(File System Access)이 없는 브라우저는 내려받기만 하고, 고친 사진을 틀에 끌어다 놓으면 됨. */
const psWatch = new Map();      // 사진 키 → { handle, last, timer }

function psMenu(x, y, key) {
  let m = document.getElementById('ps-menu');
  if (!m) {
    document.body.insertAdjacentHTML('beforeend', '<div id="ps-menu" role="menu" hidden></div>');
    m = document.getElementById('ps-menu');
    m.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      m.hidden = true;
      ({ ps: () => psEdit(m.dataset.key), swap: () => pickPhoto(m.dataset.key), stop: () => psStop(m.dataset.key, true) })[b.dataset.act]?.();
    });
    addEventListener('pointerdown', e => { if (!e.target.closest?.('#ps-menu')) m.hidden = true; }, true);
    addEventListener('keydown', e => { if (e.key === 'Escape') m.hidden = true; });
    addEventListener('scroll', () => { m.hidden = true; }, { passive: true, capture: true });
  }
  m.dataset.key = key;
  m.innerHTML = `<button type="button" data-act="ps">포토샵으로 편집…</button><button type="button" data-act="swap">사진 바꾸기</button>${psWatch.has(key) ? '<button type="button" data-act="stop">포토샵 편집 연결 끊기</button>' : ''}`;
  m.hidden = false;
  const w = m.offsetWidth, h = m.offsetHeight;
  m.style.left = `${Math.min(x, innerWidth - w - 6)}px`;
  m.style.top = `${Math.min(y, innerHeight - h - 6)}px`;
}
const psName = (key, rec) => {
  const base = (rec.blob.name || '').replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]/g, '_');
  const ext = (rec.blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg').replace('svg+xml', 'svg');
  return `${base || key}_앨범편집.${ext}`;
};
async function psEdit(key) {
  const rec = photos[key];
  if (!rec) return;
  const name = psName(key, rec);
  if (!window.showSaveFilePicker) {       // 지켜볼 수 없는 브라우저: 내려받기만
    const a = document.createElement('a');
    a.href = rec.url; a.download = name; a.click();
    frameNote(`'${name}'을 내려받았습니다. 포토샵에서 고쳐 저장한 뒤 그 파일을 이 사진틀에 끌어다 놓으세요.`);
    return;
  }
  let handle;
  try {
    handle = await showSaveFilePicker({ id: 'gradalbum-ps', startIn: 'pictures', suggestedName: name, types: [{ description: '사진', accept: { [rec.blob.type || 'image/jpeg']: ['.' + name.split('.').pop()] } }] });
  } catch { return; }       // 취소
  const w = await handle.createWritable();
  await w.write(rec.blob);
  await w.close();
  psStop(key);
  const st = { handle, last: (await handle.getFile()).lastModified };
  psWatch.set(key, st);
  const tick = async () => {
    try {
      const file = await handle.getFile();
      if (file.lastModified !== st.last && file.size > 0) {
        await new Promise(r => setTimeout(r, 700));         // 저장이 끝날 때까지 잠깐 기다림
        const done = await handle.getFile();
        st.last = done.lastModified;
        await psApply(key, done);
      }
    } catch { /* 파일을 옮기거나 지우면 연결 끊김 */ psStop(key); return; }
    st.timer = setTimeout(tick, 1500);
  };
  st.timer = setTimeout(tick, 1500);
  frameNote(`'${handle.name}'으로 저장했습니다. 탐색기에서 이 파일을 오른쪽 클릭 → 연결 프로그램 → 포토샵으로 열고, 고친 뒤 Ctrl+S로 저장하면 앨범에 바로 반영됩니다.`);
}
async function psApply(key, file) {
  const old = photos[key];
  if (!old) return;
  const type = file.type || old.blob.type || 'image/jpeg';
  const blob = new File([file], old.blob.name || file.name, { type });
  const { w, h } = await imageSize(blob);
  URL.revokeObjectURL(old.url);
  photos[key] = { ...old, blob, w, h, url: URL.createObjectURL(blob) };       // 틀 안 위치 · 확대는 그대로
  await DB.put(key, recOf(photos[key]));
  applyKey(key);
  frameNote('포토샵에서 저장한 사진을 앨범에 반영했습니다.');
}
function psStop(key, say) {
  const st = psWatch.get(key);
  if (!st) return;
  clearTimeout(st.timer);
  psWatch.delete(key);
  if (say) frameNote('포토샵 편집 연결을 끊었습니다.');
}
/* ---------- 포토샵 바로 열기 (파일 연결 방식, serve.ps1 필요) ----------
   원본 파일과 연결이 없는 사진: 앨범 서버가 사진을 _ps 폴더에 파일로 두고 프로그램으로 엶.
   포토샵에서 Ctrl+S로 저장하면 1.5초 안에 앨범 사진이 바뀜 (틀 안 위치 · 확대는 그대로). 같은 사진을 다시 열면 고친 파일을 다시 엶 */
const psLinked = new Map();     // 사진 키 → { name, mtime, timer }
const psFileName = (key, rec) => `${key.replace(/[^\w가-힣-]+/g, '_')}.${(rec.blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg').replace('svg+xml', 'svg')}`;
/** _ps 폴더의 사진 사본을 지켜보다가 저장되면 앨범에 반영 */
function psStartWatch(key, name, mtime) {
  if (psLinked.has(key)) return;
  const rec = photos[key], st = { name, mtime };
  psLinked.set(key, st);
  const tick = async () => {
    if (!psLinked.has(key)) return;
    try {
      const s = await (await fetch(`/__ps/stat?name=${encodeURIComponent(name)}`, { cache: 'no-store' })).json();
      if (s.error) { psLinked.delete(key); return; }
      if (s.mtime !== st.mtime && s.size > 0) {
        await new Promise(r => setTimeout(r, 800));        // 저장이 끝날 때까지 잠깐 기다림
        const s2 = await (await fetch(`/__ps/stat?name=${encodeURIComponent(name)}`, { cache: 'no-store' })).json();
        st.mtime = s2.mtime;
        const blob = await (await fetch(`/_ps/${encodeURIComponent(name)}?t=${s2.mtime}`, { cache: 'no-store' })).blob();
        await psApply(key, new File([blob], rec.blob.name || name, { type: blob.type || rec.blob.type }));
      }
    } catch { /* 잠깐 실패해도 계속 지켜봄 */ }
    st.timer = setTimeout(tick, 1500);
  };
  st.timer = setTimeout(tick, 1500);
}
async function psOpenDirect(key) {
  const rec = photos[key];
  if (!rec) return false;
  const cur = psLinked.get(key), name = cur?.name || psFileName(key, rec);
  let res;
  try {
    res = await fetch(`/__ps/open?name=${encodeURIComponent(name)}${cur ? '&reuse=1' : ''}`, { method: 'POST', body: cur ? null : rec.blob });
  } catch { return false; }
  if (res.status === 404 && !res.headers.get('content-type')?.includes('json')) return false;     // 예전 서버: 포토샵 연결 없음
  const j = await res.json().catch(() => ({}));
  if (j.error === 'nophotoshop') { frameNote(`포토샵을 찾지 못했습니다. ${j.path} 파일을 직접 열어 고친 뒤 저장하세요.`); }
  else if (!j.ok) return false;
  else frameNote('포토샵에서 사진을 열었습니다. 고친 뒤 Ctrl+S로 저장하면 앨범에 바로 반영됩니다.');
  psStartWatch(key, name, j.mtime);
  return true;
}

/* ---------- 사진 오른쪽 클릭: 프로그램으로 열기 (포토샵 · 브리지 · 윈도우) ----------
   원본 파일과 연결돼 있으면(링크 창) 원본을 그대로 엶 → 포토샵에서 저장하면 앨범 사진도 자동 업데이트.
   연결이 없으면 앨범 안 사진을 사본(_ps 폴더)으로 만들어 엶 → 그 사본을 저장해도 앨범에 반영 */
const OW_H = { 'X-Album': '1' };
let owSrv = null;
const owSrvOk = () => (owSrv ||= fetch('/__lk/ping', { headers: OW_H }).then(r => r.ok).catch(() => false));
const OW_APPS = { ps: 'Adobe Photoshop', bridge: 'Adobe Bridge', default: 'Windows 사진 앱', explorer: 'Windows 탐색기' };
async function openWith(key, app) {
  const rec = photos[key];
  if (!rec) return;
  let path = window.lkPathOf?.(key);
  try {
    if (!path) {
      if (app === 'ps') { if (!(await psOpenDirect(key))) psEdit(key); return; }      // 사본을 포토샵으로 (저장하면 반영)
      const cur = psLinked.get(key), name = cur?.name || psFileName(key, rec);
      const t = await (await fetch(`/__lk/temp?name=${encodeURIComponent(name)}${cur ? '&reuse=1' : ''}`, { method: 'POST', headers: OW_H, body: cur ? null : rec.blob })).json();
      if (!t.ok) throw new Error('사진 파일을 만들지 못했습니다');
      path = t.p;
      if (!cur) { const s = await (await fetch(`/__ps/stat?name=${encodeURIComponent(name)}`, { cache: 'no-store' })).json(); psStartWatch(key, name, s.mtime); }      // 브리지에서 포토샵으로 열어 저장해도 반영
    }
    const j = await (await fetch(`/__lk/open?${new URLSearchParams({ path, app })}`, { headers: OW_H })).json();
    if (j.error === 'noapp') { frameNote(`${j.app} 프로그램을 찾지 못했습니다.`); return; }
    if (!j.ok) throw new Error(j.error || '열지 못했습니다');
    if (app === 'ps') window.lkWatch?.(key);
    const orig = !!window.lkPathOf?.(key);
    frameNote(app === 'explorer' ? `탐색기에서 ${orig ? '원본' : '사진 사본'} 위치를 열었습니다.`
      : `${OW_APPS[app]}에서 ${orig ? '원본 파일' : '사진 사본'}을 열었습니다.${app === 'ps' || app === 'bridge' ? ' 포토샵에서 고쳐 Ctrl+S로 저장하면 앨범에 자동 반영됩니다.' : ''}`);
  } catch (e) { frameNote(`열지 못했습니다: ${e.message}`); }
}
function owMenu(x, y, key) {
  let m = document.getElementById('ps-menu');
  if (!m) {
    document.body.insertAdjacentHTML('beforeend', '<div id="ps-menu" role="menu" hidden></div>');
    m = document.getElementById('ps-menu');
    addEventListener('pointerdown', e => { if (!e.target.closest?.('#ps-menu')) m.hidden = true; }, true);
    addEventListener('keydown', e => { if (e.key === 'Escape') m.hidden = true; });
    addEventListener('scroll', () => { m.hidden = true; }, { passive: true, capture: true });
  }
  if (!m.dataset.ow) {      // 예전 메뉴(psMenu)와 같은 상자를 쓰므로 누르기 처리는 한 번만 바꿔 닮
    m.dataset.ow = '1';
    m.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || !m.dataset.owOpen) return;
      e.stopImmediatePropagation();
      m.hidden = true;
      const k = m.dataset.key, a = b.dataset.act;
      if (OW_APPS[a]) openWith(k, a);
      else if (a === 'swap') pickPhoto(k);
      else if (a === 'links') { window.openLinks?.(); const ph = document.querySelector(`.photo[data-photo="${CSS.escape(k)}"]`); if (ph) frameClick(ph, k, false); }
      else if (a === 'stop') { psStop(k, true); const s = psLinked.get(k); if (s) { clearTimeout(s.timer); psLinked.delete(k); frameNote('포토샵 편집 연결을 끊었습니다.'); } }
    }, true);
  }
  const path = window.lkPathOf?.(key);
  m.dataset.key = key;
  m.dataset.owOpen = '1';
  m.innerHTML = `<div class="ow-src" title="${esc(path || '')}">${path ? `🔗 원본: ${esc(path.split('\\').pop())}` : '▣ 앨범 안 사진 (사본으로 엽니다)'}</div>
    <button type="button" data-act="ps"><b class="ow-ic ps">Ps</b>Adobe Photoshop으로 열기</button>
    <button type="button" data-act="bridge"><b class="ow-ic br">Br</b>Adobe Bridge로 열기</button>
    <button type="button" data-act="default"><b class="ow-ic win">⊞</b>Windows 사진 앱으로 열기</button>
    <button type="button" data-act="explorer"><b class="ow-ic win">📂</b>Windows 탐색기에서 위치 보기</button>
    <hr><button type="button" data-act="swap"><b class="ow-ic"></b>사진 바꾸기…</button>
    <button type="button" data-act="links"><b class="ow-ic">🔗</b>링크 창에서 보기</button>
    ${psWatch.has(key) || psLinked.has(key) ? '<button type="button" data-act="stop"><b class="ow-ic"></b>포토샵 편집 연결 끊기</button>' : ''}`;
  m.hidden = false;
  const w = m.offsetWidth, h = m.offsetHeight;
  m.style.left = `${Math.min(x, innerWidth - w - 6)}px`;
  m.style.top = `${Math.min(y, innerHeight - h - 6)}px`;
}
document.getElementById('pages')?.addEventListener('contextmenu', async e => {
  const el = e.target.closest('.photo');
  if (!el || !photos[el.dataset.photo]) return;
  if (frameMulti.length === 2 && frameMulti.some(s => s.key === el.dataset.photo)) return;     // 두 틀을 고른 채로는 사진 바꾸기 메뉴
  e.preventDefault();
  const key = el.dataset.photo, x = e.clientX, y = e.clientY;
  if (await owSrvOk()) owMenu(x, y, key);
  else { const m = document.getElementById('ps-menu'); if (m) delete m.dataset.owOpen; psMenu(x, y, key); }     // 앨범 서버가 없으면 예전 메뉴(파일로 저장해서 지켜보기)
});
document.head.insertAdjacentHTML('beforeend', `<style>
  #ps-menu{min-width:250px}
  #ps-menu .ow-src{padding:5px 10px 6px;color:#aab;font:11px/1.3 system-ui,'Malgun Gothic',sans-serif;border-bottom:1px solid #444;margin-bottom:3px;max-width:300px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
  #ps-menu hr{border:0;border-top:1px solid #444;margin:3px 0}
  #ps-menu button{display:flex;align-items:center;gap:8px}
  #ps-menu .ow-ic{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:3px;font:700 11px/1 system-ui,sans-serif;flex:none}
  #ps-menu .ow-ic.ps{background:#001e36;color:#31a8ff;border:1px solid #31a8ff}
  #ps-menu .ow-ic.br{background:#2b1700;color:#e8a040;border:1px solid #e8a040}
  #ps-menu .ow-ic.win{font-size:13px}
</style>`);
