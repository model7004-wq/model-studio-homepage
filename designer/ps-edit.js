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
document.getElementById('pages')?.addEventListener('contextmenu', e => {
  const el = e.target.closest('.photo');
  if (!el || !photos[el.dataset.photo]) return;
  e.preventDefault();
  psMenu(e.clientX, e.clientY, el.dataset.photo);
});
