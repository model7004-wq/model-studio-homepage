/* 화살표 키로 옮기기 (인디자인처럼)
   사진의 가운데를 클릭하고 화살표 → 틀은 그대로, 틀 안의 사진만 옮김 (인디자인의 가운데 동그라미 '내용 잡기')
   사진의 바깥쪽(가장자리)을 클릭하고 화살표 → 사진틀을 옮김
     ← → ↑ ↓ : 1mm씩,  Shift + 화살표 : 10mm씩
     Alt + 화살표 : 어디를 클릭했든 틀 안의 사진만
   고른 틀 가운데에 동그라미가 보임: 속이 빈 동그라미 = 틀 이동, 주황색으로 찬 동그라미 = 사진 이동.
   여러 틀을 고른 경우(Shift+클릭)에는 틀을 함께 옮김. 잠근 틀은 옮기지 않음 */
(() => {
  const DIRS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  const CENTER = .25;      // 틀의 가장자리에서 25% 안쪽(가운데 절반)을 누르면 사진 이동
  const NG = { pid: null, key: null, mode: 'frame' };
  let saveT = null;
  const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(() => { saveT = null; saveState(); }, 350); };      // 누르고 있어도 저장은 한 번만
  const mmPx = el => { const pg = el.closest('.page'); return pg ? pg.getBoundingClientRect().width / G.pageMm : 4; };      // 화면에서 1mm = 몇 px
  const isContent = () => !!frameSel && frameSel.kind !== 'text' && !frameMulti.length && NG.mode === 'content' && NG.key === frameSel.key && NG.pid === frameSel.pid && !!photos[frameSel.key];

  /* ---------- 어디를 눌렀는지: 가운데 → 사진, 가장자리 → 틀 ---------- */
  addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    let ph = e.target.closest?.('.trim .photo');
    if (!ph && e.target.closest?.('#fr-sel') && !e.target.dataset?.h && frameSel && frameSel.kind !== 'text') ph = document.querySelector(`#pages .page[data-pid="${CSS.escape(frameSel.pid)}"] .photo[data-photo="${CSS.escape(frameSel.key)}"]`);      // 고른 틀 테두리 위를 눌러도
    if (!ph) { if (!e.target.closest?.('#fr-sel,#fr-multi,#ng-grab,#pro-props,#pro-top,#lk-panel')) NG.key = null; return; }
    const r = ph.getBoundingClientRect(), u = (e.clientX - r.left) / r.width, v = (e.clientY - r.top) / r.height;
    const inside = u > CENTER && u < 1 - CENTER && v > CENTER && v < 1 - CENTER;
    NG.pid = ph.closest('.page')?.dataset.pid; NG.key = ph.dataset.photo;
    NG.mode = inside && photos[NG.key] ? 'content' : 'frame';
    setTimeout(() => { drawGrab(); frameNote(NG.mode === 'content' ? '🟠 사진 이동: 화살표로 틀 안의 사진만 옮깁니다 (가장자리를 누르면 틀 이동)' : '틀 이동: 화살표로 사진틀을 옮깁니다 (사진 가운데를 누르면 사진만 이동)'); }, 0);
  }, true);

  /* ---------- 가운데 동그라미 표시 ---------- */
  document.body.insertAdjacentHTML('beforeend', '<div id="ng-grab" hidden title=""></div>');
  const grab = document.getElementById('ng-grab');
  function drawGrab() {
    const el = frameSel && frameSel.kind !== 'text' && !frameMulti.length ? document.querySelector(`#pages .page[data-pid="${CSS.escape(frameSel.pid)}"] .photo[data-photo="${CSS.escape(frameSel.key)}"]`) : null;
    if (!el || !photos[frameSel.key]) { grab.hidden = true; return; }
    const r = el.getBoundingClientRect();
    if (r.width < 30 || r.height < 30 || r.bottom < 0 || r.top > innerHeight) { grab.hidden = true; return; }
    grab.hidden = false;
    grab.classList.toggle('on', isContent());
    grab.style.left = `${r.left + r.width / 2}px`;
    grab.style.top = `${r.top + r.height / 2}px`;
  }
  const origSync = syncFrameSel;
  syncFrameSel = function () { origSync.apply(this, arguments); drawGrab(); };
  addEventListener('scroll', drawGrab, { passive: true, capture: true });
  addEventListener('resize', drawGrab);

  /* ---------- 틀 옮기기 ---------- */
  function moveFrame(s, dxMm, dyMm) {
    const isText = s.kind === 'text';
    if (frameLocked(s.pid, s.key, s.kind)) return false;
    const fr = isText ? textElOf(s.pid, s.key) : frameElOf(s.pid, s.key);
    if (!fr || !fr.isConnected) return false;
    const u = mmPx(fr) / (fr.closest('.trim').getBoundingClientRect().width / 100);       // 1mm = 몇 cqw (재단 폭 = 100cqw)
    const b = frameBox(fr);
    if (isText) { b.font = textOver()[`${s.pid}|${s.key}`]?.font || captureFont(fr); placeText(fr, b); }
    else placeFrame(fr, b);
    b.x += dxMm * u; b.y += dyMm * u;
    const t = fr.closest('.trim').getBoundingClientRect(), keep = 3;      // 쪽 밖으로 사라지지 않게 일부는 쪽 안에
    b.x = Math.min(100 - keep, Math.max(keep - b.w, b.x));
    b.y = Math.min(t.height / (t.width / 100) - keep, Math.max(keep - b.h, b.y));
    if (isText) {
      setTextStyle(fr, b);
      textOver()[`${s.pid}|${s.key}`] = { ...(textOver()[`${s.pid}|${s.key}`] || {}), ...b };
    } else {
      setFrameStyle(fr, b);
      fr.querySelectorAll('.photo').forEach(applyPhoto);
      const x = frameExtra(s.key);
      if (x) Object.assign(x, b);
      else frameData().over[`${s.pid}|${s.key}`] = { ...(frameData().over[`${s.pid}|${s.key}`] || {}), ...b };      // 순서(z) · 잠금은 유지
    }
    return true;
  }

  /* ---------- 틀 안의 사진 옮기기 (mm 단위, 화살표 방향으로 사진이 움직임) ---------- */
  function moveContent(key, pid, dxMm, dyMm) {
    const p = photos[key], el = document.querySelector(`#pages .page[data-pid="${CSS.escape(pid)}"] .photo[data-photo="${CSS.escape(key)}"]`) || document.querySelector(`.photo[data-photo="${CSS.escape(key)}"]`);
    if (!p || !el) return 'none';
    const rw = el.offsetWidth || 1, rh = el.offsetHeight || 1;
    const s = (el.classList.contains('contain') ? Math.min : Math.max)(rw / p.w, rh / p.h) * (p.z || 1);
    const R = el.getBoundingClientRect(), mm = mmPx(el);
    const ovX = (p.w * s / rw - 1) * R.width, ovY = (p.h * s / rh - 1) * R.height;      // 화면에서 사진이 틀보다 큰 만큼(px)
    let moved = false;
    if (dxMm && Math.abs(ovX) > .5) { const nx = Math.min(100, Math.max(0, p.x - dxMm * mm / ovX * 100)); moved ||= nx !== p.x; p.x = nx; }
    if (dyMm && Math.abs(ovY) > .5) { const ny = Math.min(100, Math.max(0, p.y - dyMm * mm / ovY * 100)); moved ||= ny !== p.y; p.y = ny; }
    if (!moved) return (dxMm && Math.abs(ovX) <= .5) || (dyMm && Math.abs(ovY) <= .5) ? 'fit' : 'edge';
    applyKey(key); persistPos(key);
    return 'ok';
  }

  addEventListener('keydown', e => {
    const d = DIRS[e.key];
    if (!d || e.ctrlKey || e.metaKey) return;
    if (e.target.closest?.('input,textarea,select,[contenteditable]') || document.activeElement?.closest?.('[contenteditable]')) return;      // 글자를 고치는 중이면 커서 이동
    if (document.querySelector('dialog[open]') || document.querySelector('#photo-room:not([hidden])') || document.querySelector('#lk-err,#pk-dlg')) return;
    const list = frameMulti.length ? frameMulti.map(s => ({ kind: 'frame', ...s })) : frameSel ? [frameSel] : [];
    if (!list.length) return;
    e.preventDefault();      // 화면이 스크롤되지 않게
    const step = e.shiftKey ? 10 : 1;

    if (e.altKey || isContent()) {
      const s = list[0];
      if (s.kind === 'text' || !photos[s.key]) return;
      const r = moveContent(s.key, s.pid, d[0] * step, d[1] * step);
      if (r === 'fit') frameNote('이 방향으로는 사진이 틀에 꼭 맞아 더 옮길 수 없습니다 (사진을 확대하면 옮길 수 있습니다).');
      else if (r === 'edge') frameNote('사진 끝까지 옮겼습니다.');
      return;
    }
    let n = 0;
    for (const s of list) if (moveFrame(s, d[0] * step, d[1] * step)) n++;
    if (!n) { frameNote('잠근 틀은 화살표로 옮길 수 없습니다.'); return; }
    syncFrameSel();
    saveSoon();
  });

  document.head.insertAdjacentHTML('beforeend', `<style>
    #ng-grab{position:fixed;z-index:25;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;border:2px solid #2f7de1;background:rgba(255,255,255,.35);box-shadow:0 0 0 1px rgba(255,255,255,.8);pointer-events:none}
    #ng-grab::after{content:'';position:absolute;inset:5px;border-radius:50%;border:2px solid #2f7de1}
    #ng-grab.on{border-color:#f97316;background:rgba(249,115,22,.85)}
    #ng-grab.on::after{border-color:#fff}
    #ng-grab[hidden]{display:none}
    @media print{#ng-grab{display:none!important}}
  </style>`);
})();
