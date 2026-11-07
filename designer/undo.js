/* 실행취소 (Ctrl+Z, 최대 3번): 작업 전의 설정 · 글자와 바뀐 사진을 기억해 두었다가 되돌림.
   사진은 파일을 복사하지 않고 참조만 들고 있어 가벼움. 연달아 한 작업은 잠깐 멈출 때까지 한 번으로 묶음.
   새로고침하면 기록은 사라짐. 자동 얼굴 맞춤 · 인물 수 확인은 사용자의 작업으로 세지 않음. */
const UNDO_MAX = 3, UNDO_IDLE = 450;
let undoStack = [], undoPending = null, undoTimer = null, undoHold = 0, undoBusy = false, undoQueued = 0, undoShadow = null, undoLast = null;

const undoSnap = () => { const { zoom, ...s } = S; return JSON.stringify({ s, texts }); };   // 미리보기 크기는 작업으로 치지 않음
const undoPlain = r => { const { url, ...rest } = r; return rest; };
function undoInit() {
  if (undoShadow) return;
  undoShadow = {};
  for (const k of Object.keys(photos)) undoShadow[k] = undoPlain(photos[k]);
  undoLast = undoSnap();
}
function undoArm() {
  clearTimeout(undoTimer);
  undoTimer = setTimeout(undoCommit, UNDO_IDLE);
}
function undoCommit() {
  clearTimeout(undoTimer);
  if (!undoPending) return;
  if (undoHold > 0) { undoArm(); return; }
  const now = undoSnap(), p = undoPending;
  undoPending = null;
  if (now !== p.state || Object.keys(p.photos).length) {
    undoStack.push(p);
    if (undoStack.length > UNDO_MAX) undoStack.shift();
  }
  undoLast = now;
}
function undoBegin() {
  if (!undoShadow) return false;
  if (!undoPending) undoPending = { state: undoLast, photos: {} };
  undoArm();
  return true;
}
function undoNote() {
  if (!undoBusy) undoBegin();
}
function undoTrack(key) {
  if (undoBusy || !undoBegin()) return;
  if (!(key in undoPending.photos)) undoPending.photos[key] = undoShadow[key] || null;
}
const undoRawPut = DB.put.bind(DB), undoRawDrop = DB.drop.bind(DB), undoRawWipe = DB.wipe.bind(DB);
DB.put = (k, v) => { undoTrack(k); if (undoShadow) undoShadow[k] = undoPlain(v); return undoRawPut(k, v); };
DB.putQuiet = (k, v) => { if (undoShadow) undoShadow[k] = undoPlain(v); return undoRawPut(k, v); };
DB.drop = k => { undoTrack(k); if (undoShadow) delete undoShadow[k]; return undoRawDrop(k); };
DB.wipe = () => { undoStack = []; undoPending = null; if (undoShadow) undoShadow = {}; return undoRawWipe(); };

function undoSyncControls() {
  const fields = { size: '#f-size', school: '#f-school', nth: '#f-nth', year: '#f-year', principal: '#f-principal', vice: '#f-vice', galleryPages: '#f-gallery', soloShape: '#f-solo', roster: '#f-roster', teachers: '#f-teachers' };
  for (const [k, id] of Object.entries(fields)) { const el = $(id); if (el && S[k] != null) el.value = S[k]; }
  for (const [k, id] of Object.entries({ bleed: '#f-bleed', guides: '#f-guides', pad4: '#f-pad4' })) { const el = $(id); if (el) el.checked = !!S[k]; }
  window.undoFillLayout?.();
}
async function undoRun() {
  undoCommit();
  const step = undoStack.pop();
  if (!step) { pgNote('더 되돌릴 작업이 없습니다. (최대 3번)'); return; }
  undoBusy = true;
  try {
    const st = JSON.parse(step.state);
    S = { ...st.s, zoom: S.zoom };
    texts = st.texts;
    for (const [key, before] of Object.entries(step.photos)) {
      if (photos[key]?.url) URL.revokeObjectURL(photos[key].url);
      if (before) {
        photos[key] = { ...before, url: URL.createObjectURL(before.blob) };
        undoShadow[key] = before;
        await undoRawPut(key, before);
      } else {
        delete photos[key];
        delete undoShadow[key];
        await undoRawDrop(key);
      }
    }
    flushState();
    undoSyncControls();
    if (frameSel && !selFrameEl()) frameSel = null;
    render();
    undoLast = undoSnap();
    pgNote(undoStack.length ? `실행취소했습니다. (${undoStack.length}번 더 가능)` : '실행취소했습니다.');
  } catch (e) { console.warn('실행취소 실패', e); pgNote('실행취소하지 못했습니다.'); }
  clearTimeout(undoTimer);
  undoPending = null;
  undoLast = undoSnap();
  undoBusy = false;
  if (undoQueued > 0) { undoQueued--; undoRun(); }     // 빠르게 여러 번 눌러도 누른 만큼 되돌림
}
// 여러 장을 한꺼번에 넣는 작업은 한 번으로 묶음
for (const name of ['bulkUpload', 'applyFolderPlan', 'importGalleryFolders']) {
  const fn = window[name];
  if (typeof fn !== 'function') continue;
  window[name] = async (...a) => { undoHold++; try { return await fn(...a); } finally { undoHold--; undoArm(); } };
}
document.addEventListener('keydown', e => {
  if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey || e.key.toLowerCase() !== 'z') return;
  if (e.target.closest?.('input,textarea,select') || document.querySelector('dialog[open]') || document.querySelector('#photo-room:not([hidden])')) return;
  e.preventDefault();
  if (undoBusy) undoQueued = Math.min(UNDO_MAX, undoQueued + 1); else undoRun();
});
if (window.__photosLoaded) undoInit();
