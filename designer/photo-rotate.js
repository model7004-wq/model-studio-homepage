/* ============================================================
   사진 돌리기 핸들 (인디자인처럼 마우스로 각도 돌리기)
   사진이 들어간 사진틀을 누르면 틀 위에 둥근 핸들이 나옴 → 끌면 마우스 방향대로 사진이 돌아감 (틀은 그대로).
   Shift: 15°씩 · 0 · 90 · 180°에 가까우면 살짝 붙음 · 핸들 두 번 누르면 0°로.
   놓는 순간 rotatePhotoTo(album.js)가 사진을 그 각도로 돌려 저장 → 인쇄 · PDF에도 그대로.
   ============================================================ */
(() => {
  const h = document.createElement('div');
  h.id = 'ph-rot-h';
  h.hidden = true;
  h.title = '끌어서 사진 돌리기 (Shift: 15°씩 · 두 번 누르면 0°)';
  h.innerHTML = '<i class="prh-line"></i><b class="prh-knob">↻</b><span class="prh-deg"></span>';
  document.body.appendChild(h);
  const knob = h.querySelector('.prh-knob'), degEl = h.querySelector('.prh-deg');
  let drag = null;

  const selPhoto = () => {
    const s = typeof frameSel !== 'undefined' ? frameSel : null;
    if (!s?.key || !s.pid || !photos[s.key]?.blob || /svg/.test(photos[s.key].blob.type)) return null;
    const el = document.querySelector(`${PG(s.pid)} .photo[data-photo="${CSS.escape(s.key)}"]`);
    return el?.classList.contains('has-img') ? { key: s.key, el } : null;
  };
  function place() {
    if (drag) return;
    const sp = document.body.classList.contains('tp-hand') ? null : selPhoto();
    if (!sp) { h.hidden = true; return; }
    const r = sp.el.getBoundingClientRect();
    if (r.width < 8 || r.bottom < 0 || r.top > innerHeight) { h.hidden = true; return; }
    h.hidden = false;
    h.style.left = `${r.right}px`;      // 틀 오른쪽 아래 바깥 (위쪽은 틀 도구 막대 자리)
    h.style.top = `${r.bottom}px`;
    const rot = photos[sp.key].rot || 0;
    degEl.textContent = rot ? `${rot}°` : '';
  }
  const placeSoon = () => setTimeout(place, 30);
  const ss = window.syncFrameSel;
  if (typeof ss === 'function') window.syncFrameSel = function (...a) { const r = ss.apply(this, a); placeSoon(); return r; };
  addEventListener('scroll', placeSoon, true);
  addEventListener('resize', placeSoon);
  addEventListener('pointerup', placeSoon);
  setInterval(() => { if (!h.hidden || selPhoto()) place(); }, 400);

  const angleAt = (e, c) => Math.atan2(e.clientY - c.y, e.clientX - c.x) * 180 / Math.PI;
  function preview(el, d) {
    let pv = el.querySelector('.ph-rprev');
    if (!pv) {
      pv = document.createElement('div');
      pv.className = 'ph-rprev';
      Object.assign(pv.style, { backgroundImage: el.style.backgroundImage, backgroundSize: el.style.backgroundSize, backgroundPosition: el.style.backgroundPosition });
      el.appendChild(pv);
    }
    const W = el.offsetWidth, H = el.offsetHeight, a = Math.abs(d % 180) * Math.PI / 180, c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
    const k = Math.max((W * c + H * s) / W, (W * s + H * c) / H);      // 돌려도 틀 귀퉁이가 비지 않게 키움 (놓으면 사진 안쪽을 잘라 쓰는 것과 같은 모양)
    pv.style.transform = `rotate(${d}deg) scale(${k})`;
  }
  knob.addEventListener('pointerdown', e => {
    const sp = selPhoto();
    if (!sp || e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const r = sp.el.getBoundingClientRect(), c = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    drag = { ...sp, c, a0: angleAt(e, c), r0: photos[sp.key].rot || 0, d: 0 };
    knob.setPointerCapture(e.pointerId);
    h.classList.add('on');
  });
  knob.addEventListener('pointermove', e => {
    if (!drag) return;
    let d = angleAt(e, drag.c) - drag.a0;
    d = ((d + 540) % 360) - 180;
    let t = drag.r0 + d;
    if (e.shiftKey) t = Math.round(t / 15) * 15;
    else { const n = Math.round(t / 90) * 90; if (Math.abs(t - n) < 1.5) t = n; t = Math.round(t * 10) / 10; }
    drag.d = t - drag.r0;
    preview(drag.el, drag.d);
    degEl.textContent = `${Math.round(((((t % 360) + 540) % 360) - 180) * 10) / 10}°`;
  });
  const end = async () => {
    if (!drag) return;
    const dr = drag; drag = null;
    h.classList.remove('on');
    if (Math.abs(dr.d) < .05) { dr.el.querySelector('.ph-rprev')?.remove(); place(); return; }
    frameNote('사진을 돌리는 중…');
    try { await rotatePhotoTo(dr.key, dr.r0 + dr.d); } finally { dr.el.querySelector('.ph-rprev')?.remove(); place(); }
  };
  knob.addEventListener('pointerup', end);
  knob.addEventListener('pointercancel', end);
  knob.addEventListener('dblclick', async e => {
    e.preventDefault(); e.stopPropagation();
    const sp = selPhoto();
    if (sp && photos[sp.key].rot) { await rotatePhotoTo(sp.key, 0); place(); }
  });
  ['click', 'mousedown'].forEach(t => h.addEventListener(t, e => e.stopPropagation()));
})();
