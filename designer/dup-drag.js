/* Ctrl + Alt + Shift 를 누른 채 사진틀이나 글자틀을 끌면 (인디자인의 Alt+Shift 끌기처럼)
   원본은 그대로 두고 복사본이 수평 또는 수직으로만 따라 움직임. 놓으면 그 자리에 복사본이 생김.
   사진틀: 사진 · 틀 안 위치 · 확대 · 모양 · 테두리 · 보정까지 복사.  글자틀: 글 · 글꼴 · 크기 · 색 복사.
   조금만 움직였다 놓으면(4px 미만) 아무것도 만들지 않음. Ctrl+Z로 되돌릴 수 있음 */
(() => {
  const isCombo = e => e.ctrlKey && e.altKey && e.shiftKey;
  let D = null;

  /** 누른 곳에서 복사할 틀 찾기 → { kind, pid, key, el } */
  function sourceAt(e) {
    const t = e.target;
    if (t.closest?.('#fr-sel .fr-box') && frameSel) {
      const el = selFrameEl();
      return el ? { kind: frameSel.kind === 'text' ? 'text' : 'frame', pid: frameSel.pid, key: frameSel.key, el } : null;
    }
    const page = t.closest?.(PAGE_SEL);
    if (!page) return null;
    const txt = t.closest('.trim [contenteditable][data-key]');
    if (txt) return { kind: 'text', pid: page.dataset.pid, key: txt.dataset.key, el: txt };
    const ph = t.closest('.trim .photo');
    if (ph) { const el = frameElOf(page.dataset.pid, ph.dataset.photo); return el ? { kind: 'frame', pid: page.dataset.pid, key: ph.dataset.photo, el } : null; }
    return null;
  }

  /** 같은 자리에 복사본 만들기 → 복사본 { kind, pid, key, el, box } */
  async function makeCopy(s) {
    const fd = frameData();
    if (s.kind === 'text') {
      const saved = textOver()[`${s.pid}|${s.key}`];
      const font = { ...(saved?.font || captureFont(s.el)) }, text = s.el.innerText.replace(/\n$/, '');
      if (text.includes('\n')) font.ws = 'pre-line';
      const b = saved?.x != null ? saved : frameBox(s.el);
      const id = fd.next++, key = `xt-${id}`, box = { x: b.x, y: b.y, w: b.w, h: b.h, font };
      (fd.xtext ||= []).push({ id, pid: s.pid });
      texts[key] = text;
      textOver()[`${s.pid}|${key}`] = { ...box, font: { ...font } };
      applyFrames(); applyTextFrames();
      return { kind: 'text', pid: s.pid, key, el: textElOf(s.pid, key), box };
    }
    const id = fd.next++, key = `fx-${id}`, x0 = frameExtra(s.key);
    const src = x0 ? structuredClone(x0) : { cls: [...s.el.classList].filter(c => !/^(fr-|x-frame|pro-)/.test(c)).join(' '), ...frameBox(s.el), st: structuredClone(layerRec('frame', s.pid, s.key)?.st || null) };
    if (!x0) Object.assign(src, frameBox(s.el));
    Object.assign(src, { id, pid: s.pid });
    delete src.lock; delete src.grp; delete src.z; if (!src.st) delete src.st;
    fd.extra.push(src);
    const p = photos[s.key];
    if (p) { photos[key] = { ...p, url: URL.createObjectURL(p.blob) }; await DB.put(key, recOf(photos[key])); }
    if (fd.adj?.[s.key]) fd.adj[key] = structuredClone(fd.adj[s.key]);
    applyFrames();
    applyKey(key); window.proApply?.();
    return { kind: 'frame', pid: s.pid, key, el: frameElOf(s.pid, key), box: { x: src.x, y: src.y, w: src.w, h: src.h } };
  }

  function place(c, dx, dy) {
    const b = { ...c.box, x: c.box.x + dx, y: c.box.y + dy };
    const t = c.el.closest('.trim').getBoundingClientRect(), keep = 3;      // 쪽 밖으로 사라지지 않게
    b.x = Math.min(100 - keep, Math.max(keep - b.w, b.x));
    b.y = Math.min(t.height / (t.width / 100) - keep, Math.max(keep - b.h, b.y));
    if (c.kind === 'text') setTextStyle(c.el, b);
    else { setFrameStyle(c.el, b); c.el.querySelectorAll('.photo').forEach(applyPhoto); }
    return b;
  }

  addEventListener('pointerdown', e => {
    if (e.button !== 0 || !isCombo(e)) return;
    const s = sourceAt(e);
    if (!s) return;
    e.preventDefault(); e.stopImmediatePropagation();
    getSelection()?.removeAllRanges();
    document.activeElement?.blur?.();
    D = { s, x0: e.clientX, y0: e.clientY, cq: s.el.closest('.trim').getBoundingClientRect().width / 100, copy: null, making: false, last: null };
    document.body.classList.add('dup-dragging');
  }, true);

  addEventListener('pointermove', async e => {
    if (!D) return;
    e.preventDefault(); e.stopImmediatePropagation();
    let dx = e.clientX - D.x0, dy = e.clientY - D.y0;
    if (!D.copy) {
      if (Math.hypot(dx, dy) < 4 || D.making) return;
      D.making = true;
      const d = D;
      d.copy = await (d.pending = makeCopy(d.s));
      if (D !== d || !d.copy.el) return;
    }
    [dx, dy] = Math.abs(dx) >= Math.abs(dy) ? [dx, 0] : [0, dy];      // 수평 또는 수직으로만
    D.last = place(D.copy, dx / D.cq, dy / D.cq);
    frameSel = D.copy.kind === 'text' ? { kind: 'text', key: D.copy.key, pid: D.copy.pid } : { key: D.copy.key, pid: D.copy.pid };
    frameMulti = [];
    syncFrameSel();
  }, true);

  const end = async e => {
    if (!D) return;
    e?.stopImmediatePropagation?.();
    const d = D; D = null;
    setTimeout(() => document.body.classList.remove('dup-dragging'), 0);      // 놓은 뒤 click 이 틀 선택을 바꾸지 않게
    if (d.pending) await d.pending;      // 복사본을 만드는 중에 놓아도 저장
    if (!d.copy) return;
    const c = d.copy, b = d.last || c.box;
    if (c.kind === 'text') textOver()[`${c.pid}|${c.key}`] = { ...(textOver()[`${c.pid}|${c.key}`] || {}), ...b };
    else Object.assign(frameExtra(c.key), { x: b.x, y: b.y, w: b.w, h: b.h });
    saveState();
    syncFrameSel();
    window.pagePanelSoon?.();
    frameNote(`${c.kind === 'text' ? '글자틀' : '사진틀'}을 복사했습니다 (Ctrl+Alt+Shift 끌기). Ctrl+Z로 되돌립니다.`);
  };
  addEventListener('pointerup', end, true);
  addEventListener('pointercancel', end, true);
  addEventListener('click', e => { if (document.body.classList.contains('dup-dragging')) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);

  document.head.insertAdjacentHTML('beforeend', '<style>body.dup-dragging,body.dup-dragging *{cursor:copy!important;user-select:none!important}</style>');
})();
