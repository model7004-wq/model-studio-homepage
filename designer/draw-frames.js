/* 사진틀 그리기 (인디자인 사각형 · 타원 프레임 도구처럼)
   - 페이지 패널의 [▭ 사각 틀] [◯ 원형 틀] 또는 단축키 F(사각) · L(원형)
   - 쪽(표지 전개도의 앞 · 뒤표지 포함) 위에서 끌면 그 크기로 사진틀이 생김. Shift: 정사각 · 정원, Alt: 누른 곳이 가운데
   - 끌지 않고 한 번 누르면 기본 크기로 생김. Esc 또는 같은 단추를 다시 누르면 그리기 끝
   - 만든 틀은 '복사한 틀'과 같은 방식(S.frameEdits.extra)으로 저장 → 옮기기 · 크기 · 삭제 · 되돌리기가 다른 틀과 같음
   - 두 번 누르면 사진 넣기 */
(() => {
  let tool = null;          // 'rect' | 'ellipse' | null
  let drag = null;

  const note = t => { const n = document.getElementById('pg-note'); if (n) n.textContent = t; if (typeof frameNote === 'function') frameNote(t); };
  function setTool(t) {
    tool = t && tool !== t ? t : null;      // 같은 도구를 다시 누르면 고르기 도구로
    document.body.classList.toggle('draw-on', !!tool);
    document.querySelectorAll('.df-btn').forEach(b => b.classList.toggle('on', (b.dataset.tool || null) === tool || (!tool && b.dataset.tool === 'select')));
    note(tool ? `${tool === 'rect' ? '사각' : '원형'} 사진틀 그리기: 쪽 위에서 끌어 크기를 정하세요. (Shift 정사각·정원, Esc 끝내기)` : '');
  }
  window.setDrawFrameTool = setTool;

  const editingText = () => { const a = document.activeElement; return a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)); };

  function startDraw(e) {
    if (!tool || e.button !== 0) return;
    const face = e.target.closest?.(PAGE_SEL);
    const tr = face?.querySelector('.trim');
    if (!face || !tr || face.dataset.pid.includes('~')) return;     // 쪽 밖 · 개인 앨범 사본은 그리지 않음
    e.preventDefault(); e.stopPropagation();
    const q = tr.getBoundingClientRect(), cq = q.width / 100;
    const at = ev => ({ x: (ev.clientX - q.left) / cq, y: (ev.clientY - q.top) / cq });
    const ghost = document.createElement('div');
    ghost.className = `df-ghost${tool === 'ellipse' ? ' df-ellipse' : ''}`;
    tr.appendChild(ghost);
    drag = { face, tr, cq, at, p0: at(e), box: null, ghost, shape: tool, id: e.pointerId };
    try { face.setPointerCapture(e.pointerId); } catch { /* 없어도 동작 */ }
  }
  function boxOf(p0, p1, sq, mid) {
    let w = Math.abs(p1.x - p0.x), h = Math.abs(p1.y - p0.y);
    if (sq) w = h = Math.max(w, h);
    let x = p1.x < p0.x ? p0.x - w : p0.x, y = p1.y < p0.y ? p0.y - h : p0.y;
    if (mid) { x = p0.x - w; y = p0.y - h; w *= 2; h *= 2; }
    return { x, y, w, h };
  }
  function moveDraw(e) {
    if (!drag) return;
    e.preventDefault();
    const b = drag.box = boxOf(drag.p0, drag.at(e), e.shiftKey, e.altKey);
    Object.assign(drag.ghost.style, { left: `${b.x}cqw`, top: `${b.y}cqw`, width: `${b.w}cqw`, height: `${b.h}cqw` });
  }
  function endDraw(e) {
    if (!drag) return;
    const d = drag;
    drag = null;
    d.ghost.remove();
    try { d.face.releasePointerCapture(d.id); } catch { /* 없어도 동작 */ }
    let b = d.box;
    if (!b || b.w < FRAME_MIN || b.h < FRAME_MIN) {     // 한 번 누름: 누른 곳을 가운데로 기본 크기
      const s = d.shape === 'ellipse' ? 30 : 36, h = d.shape === 'ellipse' ? 30 : 27;
      b = { x: d.p0.x - s / 2, y: d.p0.y - h / 2, w: s, h };
    }
    const fd = frameData(), id = fd.next++;
    (fd.extra ||= []).push({ id, pid: d.face.dataset.pid, cls: d.shape === 'ellipse' ? 'sy-ph x-ellipse' : 'sy-ph', shape: d.shape, x: +b.x.toFixed(2), y: +b.y.toFixed(2), w: +b.w.toFixed(2), h: +b.h.toFixed(2) });
    saveState();
    applyFrames();
    frameMulti = [];
    frameSel = { key: `fx-${id}`, pid: d.face.dataset.pid };
    framePage = d.face.dataset.pid;
    syncFrameSel();
    window.pagePanelSoon?.();
    setTool(null);            // 하나 그리면 고르기 도구로 돌아옴 (계속 그리려면 단추를 다시 누름)
    note('사진틀을 만들었습니다. 두 번 눌러 사진을 넣으세요. 손잡이로 크기 · 위치를 바꿀 수 있습니다.');
  }

  addEventListener('pointerdown', startDraw, true);       // 다른 틀 고르기보다 먼저 받음
  addEventListener('pointermove', moveDraw, true);
  addEventListener('pointerup', endDraw, true);
  addEventListener('pointercancel', e => { if (drag) { drag.ghost.remove(); drag = null; } }, true);
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && (tool || drag)) { if (drag) { drag.ghost.remove(); drag = null; } setTool(null); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || editingText() || document.querySelector('dialog[open]')) return;
    if (e.key === 'f' || e.key === 'F') { e.preventDefault(); if (tool !== 'rect') setTool('rect'); }
    else if (e.key === 'l' || e.key === 'L') { e.preventDefault(); if (tool !== 'ellipse') setTool('ellipse'); }
    else if (e.key === 'v' || e.key === 'V') { e.preventDefault(); setTool(null); }
  });

  // 인디자인처럼 화면 왼쪽의 세로 도구 상자: 고르기(V) · 사각 틀(F) · 원형 틀(L)
  document.body.insertAdjacentHTML('beforeend', `<div id="df-toolbox" role="toolbar" aria-label="도구">
    <button type="button" class="df-btn on" data-tool="select" title="고르기 도구 (V)  틀을 눌러 고르고 옮기기 · 크기 조절"><svg viewBox="0 0 24 24"><path d="M5 3l14 9-6.5 1.5L16 21l-2.6 1-2.6-7.4L5 19z"/></svg></button>
    <button type="button" class="df-btn" data-tool="rect" title="사각형 사진틀 도구 (F)  끌어서 그리기 · Shift 정사각형"><svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="1"/><path d="M4 5l16 14M20 5L4 19"/></svg></button>
    <button type="button" class="df-btn" data-tool="ellipse" title="원형 사진틀 도구 (L)  끌어서 그리기 · Shift 정원"><svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="8.5" ry="7.5"/><path d="M6 6.7l12 10.6M18 6.7L6 17.3"/></svg></button>
  </div>`);
  document.querySelectorAll('#df-toolbox .df-btn').forEach(b => b.addEventListener('click', () => setTool(b.dataset.tool === 'select' ? null : b.dataset.tool)));

  // 페이지 패널에 단추 줄
  function addButtons() {
    const ref = document.getElementById('pg-ph')?.parentElement;
    if (!ref || document.getElementById('df-rect')) return !!ref;
    ref.insertAdjacentHTML('beforebegin', `<div class="pg-tools df-tools">
      <button type="button" class="df-btn" id="df-rect" data-tool="rect" title="끌어서 사각 사진틀 그리기 (F)">▭ 사각 틀</button>
      <button type="button" class="df-btn" id="df-ellipse" data-tool="ellipse" title="끌어서 원형 사진틀 그리기 (L)">◯ 원형 틀</button></div>`);
    document.querySelectorAll('.df-btn').forEach(b => b.addEventListener('click', () => setTool(b.dataset.tool)));
    return true;
  }
  const tryAdd = () => { if (!addButtons()) setTimeout(tryAdd, 300); };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', tryAdd); else tryAdd();
})();
