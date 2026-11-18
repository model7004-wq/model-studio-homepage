/* 자동 백업: 앨범을 고치면 잠시 뒤 .album 파일을 M:\Model ppa\album-backups 에 저장
   (브라우저 저장 공간이 지워져도 파일이 남도록. serve.ps1 의 /__backup 이 있을 때만 동작) */
(() => {
  const IDLE_MS = 2 * 60 * 1000;      // 마지막으로 고친 뒤 2분 동안 손을 안 대면 백업
  const MAX_WAIT_MS = 10 * 60 * 1000; // 계속 고치는 중이어도 10분마다 한 번은 백업
  const LS_KEY = id => `gradAlbum.backup::${id}`;
  let enabled = false, dir = '', dirty = false, firstDirty = 0, lastEdit = 0, running = false;

  const fmtTime = t => new Date(t).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  const lastInfo = () => { try { return JSON.parse(localStorage.getItem(LS_KEY(PROJECT_ID))) || null; } catch { return null; } };
  const fileName = () => albumFileName().replace(/\.album$/, '') + `__${PROJECT_ID}.album`;

  function show(text, err = false) {
    const el = document.getElementById('bk-status');
    if (!el) return;
    el.textContent = text;
    el.style.color = err ? '#b3261e' : '';
  }
  function showIdle() {
    const li = lastInfo();
    show(li ? `자동 백업: ${fmtTime(li.at)} 저장됨${dirty ? ' · 고친 내용 곧 백업' : ''}` : (dirty ? '자동 백업: 곧 첫 백업' : '자동 백업: 켜짐'));
  }
  function markDirty() {
    if (!enabled) return;
    const now = Date.now();
    if (!dirty) { dirty = true; firstDirty = now; }
    lastEdit = now;
  }

  async function backupNow(manual = false) {
    if (!enabled || running) return;
    running = true;
    const startedEdit = lastEdit;
    try {
      show('자동 백업: 파일 만드는 중…');
      const { blob, count } = await buildAlbumBlob();
      if (!count && !manual) { dirty = false; showIdle(); return; }
      show(`자동 백업: 저장 중… (${Math.round(blob.size / 1048576)}MB)`);
      const name = fileName();
      const r = await fetch(`/__backup?name=${encodeURIComponent(name)}&size=${blob.size}`, { method: 'POST', body: blob });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || `HTTP ${r.status}`);
      localStorage.setItem(LS_KEY(PROJECT_ID), JSON.stringify({ at: Date.now(), path: j.path, size: j.size, count }));
      if (lastEdit === startedEdit) dirty = false; else firstDirty = Date.now();
      showIdle();
    } catch (e) {
      show(`자동 백업 실패: ${e.message} — '파일로 저장'을 눌러 주세요`, true);
    } finally { running = false; }
  }

  function tick() {
    if (!enabled || !dirty || running) return;
    const now = Date.now();
    if (now - lastEdit >= IDLE_MS || now - firstDirty >= MAX_WAIT_MS) backupNow();
  }

  // 고친 것을 알아채기: 글자·설정(saveState)과 사진(DB.put/drop)
  const wrap = (obj, key) => {
    const f = obj[key];
    if (typeof f !== 'function') return;
    obj[key] = function (...a) { markDirty(); return f.apply(this, a); };
  };
  wrap(window, 'saveState');
  if (window.DB) { wrap(DB, 'put'); wrap(DB, 'putQuiet'); wrap(DB, 'drop'); }

  window.addEventListener('DOMContentLoaded', async () => {
    try {
      const r = await fetch('/__backup/ping', { cache: 'no-store' });
      const j = await r.json();
      if (!j.ok) return;
      enabled = true; dir = j.dir || '';
    } catch { return; }   // 인터넷 주소(github)에서 열면 서버가 없어 자동 백업 없이 동작
    const box = document.getElementById('p-saved');
    if (box && !document.getElementById('bk-status')) {
      const wrapEl = document.createElement('div');
      wrapEl.className = 'bk-row';
      wrapEl.innerHTML = '<span id="bk-status" class="hint"></span> <button type="button" class="btn ghost bk-now" id="bk-now">지금 백업</button>';
      wrapEl.title = `백업 폴더: ${dir}\n앨범마다 최근 3판까지 보관합니다.`;
      box.after(wrapEl);
      document.getElementById('bk-now').addEventListener('click', () => backupNow(true));
    }
    // 이 앨범을 한 번도 백업하지 않았으면 곧 첫 백업
    if (!lastInfo()) { dirty = true; firstDirty = Date.now() - MAX_WAIT_MS + 30 * 1000; lastEdit = Date.now(); }
    showIdle();
    setInterval(() => { tick(); if (!running) showIdle(); }, 20 * 1000);
  });
  window.albumBackupNow = backupNow;
})();
