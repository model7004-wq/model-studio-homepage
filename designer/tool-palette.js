/* 도구 팔레트 (일러스트레이터 도구 패널처럼)
   - 왼쪽에 붙어 있는 2열 세로 팔레트. 머리를 끌어 옮기면 떠 있는 팔레트가 되고, 머리를 두 번 누르면 다시 붙음
   - «» 1열/2열, – 접기. 위치 · 열 · 접힘은 이 컴퓨터에 기억
   - 아이콘에 마우스를 올리면 도구 이름 · 단축키. ◢ 표시가 있는 도구는 길게 누르거나 오른쪽 버튼으로 세부 도구
   - 아래: 채우기 · 선 색 (바꾸기 Shift+X, 기본 색 D, 색 없음 /)
   새 편집기를 따로 만들지 않고 기존 틀 · 글자 · 도형 기능(album.js · draw-frames.js · pro-ui.js)을 그대로 부름 */
(() => {
  const POS_KEY = 'gradAlbum.toolPalette', COL_KEY = 'gradAlbum.toolColors';
  const ls = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 저장 못 해도 동작 */ } } };
  const api = () => window.proAPI || {};
  const note = t => (api().note ? api().note(t) : (typeof frameNote === 'function' && frameNote(t)));
  const body = document.body;
  const typing = e => e.target.closest?.('input,textarea,select,[contenteditable]') || document.querySelector('dialog[open]') || document.querySelector('#photo-room:not([hidden])');

  /* ---------- 아이콘 (24 × 24) ---------- */
  const I = {
    V: '<path d="M6 3l12 9.5-5.6 1L15.8 21l-2.6 1.1-3.3-7.4L6 18.6z" fill="currentColor" stroke="none"/>',
    A: '<path d="M6 3l12 9.5-5.6 1L15.8 21l-2.6 1.1-3.3-7.4L6 18.6z" fill="none"/>',
    F: '<rect x="3.5" y="5" width="17" height="14" rx="1"/><path d="M3.5 5l17 14M20.5 5l-17 14"/>',
    P: '<rect x="3" y="5" width="14" height="12" rx="1.5"/><circle cx="8" cy="9.5" r="1.6"/><path d="M3 15l4-3.5 3 2.5 2.5-2 4.5 4"/><path d="M19.5 14v7M16 17.5h7"/>',
    T: '<path d="M5 6V4h14v2M12 4v16M8.5 20h7"/>',
    L: '<path d="M4 20L20 4"/>',
    B: '<path d="M12 3l5 8-5 10-5-10z"/><circle cx="12" cy="12" r="1.6"/><path d="M12 3v7.4"/>',
    N: '<path d="M20.5 3.5c-3 1.5-8 6-9.5 8.5l1.2 1.2c2.5-1.5 7-6.5 8.3-9.7z"/><path d="M10.5 12.6c-2.3.2-3.8 1.8-4 4-.1 1.6-1.2 2.9-3 3.4 3.4 1.1 7.6.4 8.4-3.4.3-1.4-.4-2.9-1.4-4z"/>',
    R: '<rect x="4" y="6" width="16" height="12"/>',
    O: '<ellipse cx="12" cy="12" rx="8.5" ry="7"/>',
    C: '<path d="M7 2v15h15"/><path d="M2 7h15v15"/>',
    X: '<circle cx="6" cy="17.5" r="2.8"/><circle cx="18" cy="17.5" r="2.8"/><path d="M8 15.5L18 3M16 15.5L6 3"/>',
    G: '<defs><linearGradient id="tpg" x1="0" x2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".05"/><stop offset="1" stop-color="currentColor"/></linearGradient></defs><rect x="3.5" y="5" width="17" height="14" rx="1" fill="url(#tpg)"/>',
    I: '<path d="M14.5 4.5l5 5-2 2-5-5z" fill="currentColor"/><path d="M13.5 8.5L5 17l-.8 3.3L7.5 19.5 16 11"/>',
    H: '<path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4a1.5 1.5 0 0 1 3 0v6M14 10.5V5.5a1.5 1.5 0 0 1 3 0V13c0 4.5-2.5 8-6.5 8-3 0-4.4-1.6-6-4.4L3 14a1.5 1.5 0 0 1 2.4-1.7L8 15"/>',
    Z: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21M7.5 10.5h6M10.5 7.5v6"/>',
    layer: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 12.5l9 5 9-5"/><path d="M3 16.5l9 5 9-5" opacity=".55"/>',
    align: '<path d="M4 3v18"/><rect x="7" y="5" width="12" height="5" rx="1"/><rect x="7" y="14" width="7" height="5" rx="1"/>',
  };
  /* 도구: [키, 이름, 단축키, 설명, 동작 종류]  kind: mode(계속 켜짐) · act(한 번 실행) · soon(다음 단계) · menu(세부 메뉴만) */
  const TOOLS = [
    ['V', '선택 도구', 'V', '틀 · 글자 · 도형을 눌러 고르고, 끌어 옮기고, 손잡이로 크기 조절 (Shift: 비율 유지)', 'mode'],
    ['A', '직접 선택 도구', 'A', '도형의 점과 경로를 고칩니다', 'soon', 4],
    ['F', '사진틀 도구', 'F', '쪽 위에서 끌어 사진틀을 만듭니다. 길게 누르면 사각 · 원형 · 자유형', 'mode'],
    ['P', '사진 배치', 'P', '파일에서 사진을 불러와 고른 틀(없으면 새 틀)에 넣습니다', 'act'],
    ['T', '텍스트 도구', 'T', '지금 쪽에 글자틀을 만들고 바로 입력합니다', 'act'],
    ['L', '선 도구', 'L', '지금 쪽에 선을 넣습니다. 길게 누르면 가로 · 세로 · 사선 · 곡선 · 물결', 'act'],
    ['B', '펜 도구', 'B', '점을 찍어 자유로운 벡터 경로를 그립니다', 'soon', 4],
    ['N', '브러시 도구', 'N', '마우스로 자유 곡선을 그립니다', 'soon', 4],
    ['R', '사각형 도구', 'R', '지금 쪽에 사각형을 넣습니다. 길게 누르면 둥근 사각 · 삼각 · 별 · 하트 등', 'act'],
    ['O', '원형 도구', 'O', '지금 쪽에 원을 넣습니다', 'act'],
    ['C', '자르기 도구', 'C', '사진틀 위에서 휠: 사진 확대 · 축소, 끌기: 사진 위치. 틀 크기는 그대로', 'mode'],
    ['X', '가위 도구', 'X', '벡터 경로를 둘로 나눕니다', 'soon', 4],
    ['G', '그라디언트 도구', 'G', '그라디언트 배경 설정을 엽니다', 'act'],
    ['I', '스포이트 도구', 'I', '화면 어디서나 색을 찍어 지금 채우기(또는 선) 색으로 씁니다', 'act'],
    ['H', '손 도구', 'H', '끌어서 작업 화면을 옮깁니다 (언제든 스페이스를 누른 채 끌어도 됨)', 'mode'],
    ['Z', '확대 도구', 'Z', '누르면 확대, Alt+누르기 축소. 길게 누르면 맞춤 · 100%', 'mode'],
    ['layer', '레이어', '', '이 쪽 개체의 순서 · 잠금 · 숨기기. 길게 누르면 순서 바로 바꾸기', 'act'],
    ['align', '정렬', '', '고른 개체 정렬 · 간격 맞추기', 'menu'],
  ];
  const TOOL = Object.fromEntries(TOOLS.map(t => [t[0], t]));
  const CODE = { KeyV: 'V', KeyA: 'A', KeyF: 'F', KeyP: 'P', KeyT: 'T', KeyL: 'L', KeyB: 'B', KeyN: 'N', KeyR: 'R', KeyO: 'O', KeyC: 'C', KeyX: 'X', KeyG: 'G', KeyI: 'I', KeyH: 'H', KeyZ: 'Z' };
  const SUB = {
    F: [['rect', '사각 사진틀', 'F'], ['ellipse', '원형 사진틀', ''], ['free', '자유형 사진틀 (점 찍기)', '']],
    L: [['lineh', '가로선', ''], ['linev', '세로선', ''], ['lined', '사선 ↘', ''], ['lineu', '사선 ↗', ''], ['curve', '곡선', ''], ['wave', '물결선', '']],
    R: [['rect', '사각형', 'R'], ['round', '둥근 사각형', ''], ['tri', '삼각형', ''], ['diamond', '마름모', ''], ['hex', '육각형', ''], ['star', '별', ''], ['heart', '하트', '']],
    Z: [['in', '확대', 'Ctrl +'], ['out', '축소', 'Ctrl −'], ['fit', '펼침면 화면 맞춤', ''], ['100', '100%', '']],
    layer: [['open', '레이어 창 열기', ''], ['front', '맨 앞으로', 'Ctrl+Shift+]'], ['fwd', '앞으로', 'Ctrl+]'], ['back', '뒤로', 'Ctrl+['], ['rear', '맨 뒤로', 'Ctrl+Shift+['], ['lock', '잠그기 / 풀기', 'Ctrl+L']],
    align: [['l', '왼쪽 맞춤', ''], ['c', '가로 가운데', ''], ['r', '오른쪽 맞춤', ''], ['t', '위쪽 맞춤', ''], ['m', '세로 가운데', ''], ['b', '아래쪽 맞춤', ''], ['dh', '가로 간격 같게', ''], ['dv', '세로 간격 같게', '']],
  };

  /* ---------- 상태 ---------- */
  const pos = Object.assign({ dock: true, x: 70, y: 60, cols: 2, min: false }, ls.get(POS_KEY, {}));
  const col = Object.assign({ fill: '#E9CDBE', stroke: '#8E7A62', sw: .6, op: 1, active: 'fill' }, ls.get(COL_KEY, {}));
  const sub = { F: 'rect', L: 'lineh', R: 'rect' };
  let mode = 'V';

  /* ---------- 뼈대 ---------- */
  const btn = t => `<button type="button" class="tp-tool${t[4] === 'soon' ? ' tp-soon' : ''}" data-tool="${t[0]}" aria-label="${t[1]}">${`<svg viewBox="0 0 24 24">${I[t[0]]}</svg>`}${SUB[t[0]] ? '<i class="tp-more"></i>' : ''}</button>`;
  body.insertAdjacentHTML('beforeend', `
    <div id="tp" role="toolbar" aria-label="도구">
      <div class="tp-head" title="끌어서 옮기기 · 두 번 누르면 왼쪽에 다시 붙음"><span class="tp-grip"></span><button type="button" class="tp-hb" data-h="cols" title="1열 / 2열">«»</button><button type="button" class="tp-hb" data-h="min" title="접기 / 펼치기">–</button></div>
      <div class="tp-tools">${TOOLS.map(btn).join('')}</div>
      <div class="tp-color">
        <div class="tp-sq">
          <button type="button" class="tp-sw tp-stroke" data-c="stroke" aria-label="선 색"></button>
          <button type="button" class="tp-sw tp-fill" data-c="fill" aria-label="채우기 색"></button>
          <button type="button" class="tp-mini tp-swap" data-c="swap" aria-label="채우기와 선 바꾸기">⇄</button>
          <button type="button" class="tp-mini tp-def" data-c="def" aria-label="기본 색"><i></i><i></i></button>
        </div>
        <div class="tp-modes"><button type="button" data-c="color" aria-label="색상"></button><button type="button" data-c="grad" aria-label="그라디언트"></button><button type="button" data-c="none" aria-label="색 없음"></button></div>
      </div>
    </div>
    <div id="tp-tip" hidden></div><div id="tp-sub" hidden></div><div id="tp-pop" hidden></div>`);
  body.classList.add('tp-on');
  const tp = document.getElementById('tp'), tip = document.getElementById('tp-tip'), subEl = document.getElementById('tp-sub'), pop = document.getElementById('tp-pop');

  function layout() {
    tp.classList.toggle('dock', pos.dock);
    tp.classList.toggle('one', pos.cols === 1);
    tp.classList.toggle('min', pos.min);
    body.classList.toggle('tp-docked', pos.dock && !pos.min);
    if (pos.dock) { tp.style.left = tp.style.top = ''; }
    else {
      pos.x = Math.max(0, Math.min(innerWidth - tp.offsetWidth, pos.x));
      pos.y = Math.max(0, Math.min(innerHeight - 40, pos.y));
      tp.style.left = `${pos.x}px`; tp.style.top = `${pos.y}px`;
    }
    ls.set(POS_KEY, pos);
    setTimeout(() => window.syncFrameSel?.(), 220);
  }
  addEventListener('resize', () => { if (!pos.dock) layout(); });

  /* 머리 끌기 · 두 번 누르기 · 열 · 접기 */
  function headDown(e) {      // window 캡처 단계에서 부름 (아래 pointerdown 참고)
    if (e.button !== 0 || e.target.closest('.tp-hb')) return;
    e.preventDefault();
    const r = tp.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
    let moved = false;
    const mv = ev => {
      if (!moved && Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) < 4) return;
      moved = true; pos.dock = false; pos.x = ev.clientX - dx; pos.y = ev.clientY - dy;
      tp.classList.remove('dock'); tp.style.left = `${pos.x}px`; tp.style.top = `${pos.y}px`;
    };
    const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); if (moved) layout(); };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  }
  tp.querySelector('.tp-head').addEventListener('dblclick', e => { if (e.target.closest('.tp-hb')) return; pos.dock = true; layout(); note('도구 팔레트를 왼쪽에 다시 붙였습니다.'); });
  tp.querySelector('.tp-head').addEventListener('click', e => {
    const h = e.target.closest('.tp-hb')?.dataset.h;
    if (h === 'cols') pos.cols = pos.cols === 1 ? 2 : 1;
    if (h === 'min') pos.min = !pos.min;
    if (h) layout();
  });

  /* ---------- 도구 고르기 ---------- */
  function setMode(m) {
    mode = m;
    tp.querySelectorAll('.tp-tool').forEach(b => b.classList.toggle('on', b.dataset.tool === m));
    body.classList.toggle('tp-hand', m === 'H');
    body.classList.toggle('tp-zoom', m === 'Z');
    body.classList.toggle('tp-crop', m === 'C');
  }
  function stopDrawing() { if (body.classList.contains('draw-on')) window.setDrawFrameTool?.(null); }
  const RUN = {
    V: () => { stopDrawing(); setMode('V'); },
    F: () => {
      stopDrawing();
      setMode('F');
      if (sub.F === 'free') api().polyStart?.();
      else window.setDrawFrameTool?.(sub.F);
    },
    P: () => {
      const s = api().sel?.();
      if (s?.kind === 'frame') { pickPhoto(s.key); return; }
      window.pgAddPhotoFrame?.();
      if (frameSel?.key) setTimeout(() => pickPhoto(frameSel.key), 50);
    },
    T: () => window.pgAddTextFrame?.(),
    L: () => api().addShape?.(sub.L),
    R: () => api().addShape?.(sub.R),
    O: () => api().addShape?.('ellipse'),
    C: () => { stopDrawing(); setMode('C'); note('자르기: 사진틀 위에서 마우스 휠로 사진 확대 · 축소, 사진을 끌어 위치를 바꿉니다. 틀 크기는 그대로. V로 끝냅니다.'); },
    G: () => { const d = api().bgDraft?.(); if (d) d.t = 'grad'; openSideFresh('bg'); note('그라디언트: 시작 · 끝 색과 각도를 고르고 [이 쪽에] 또는 [펼침면 이어서]를 누르세요. 도형에 그라디언트 채우기는 4단계에서 연결합니다.'); },
    I: () => eyedrop(),
    H: () => { stopDrawing(); setMode('H'); note('손 도구: 끌어서 화면을 옮깁니다. V로 끝냅니다.'); },
    Z: () => { stopDrawing(); setMode('Z'); note('확대 도구: 누르면 확대, Alt를 누른 채 누르면 축소. V로 끝냅니다.'); },
    layer: () => openSideFresh('layer'),
    align: () => {},
  };
  const SUBRUN = {
    Z: k => ({ in: () => setViewZoom(+S.zoom + .1), out: () => setViewZoom(+S.zoom - .1), fit: () => document.querySelector('#pro-top [data-top="zfit"]')?.click(), 100: () => setViewZoom(1) })[k]?.(),
    layer: k => (k === 'open' ? openSideFresh('layer') : k === 'lock' ? toggleLock() : api().layerMove?.(k)),
    align: k => api().align?.(k),
  };
  function openSideFresh(k) {
    if (!body.classList.contains('pro')) { note('이 기능은 새 편집 화면에서 씁니다. 왼쪽 아래 [새 편집 화면]을 누르세요.'); return; }
    if (body.classList.contains('pro-side') && document.querySelector(`#pro-rail [data-menu="${k}"].on`)) api().refresh?.(true);
    else api().openSide?.(k);
  }
  function choose(id) {
    const t = TOOL[id];
    if (!t) return;
    if (t[4] === 'soon') { note(`${t[1]}(${t[2]})는 ${t[5]}단계에서 연결합니다. 지금은 팔레트에 자리만 있습니다.`); flash(id); return; }
    if (t[4] === 'menu') { openSub(id); return; }
    RUN[id]?.();
    if (t[4] === 'act') flash(id);
  }
  function flash(id) { const b = tp.querySelector(`[data-tool="${id}"]`); b?.classList.add('hit'); setTimeout(() => b?.classList.remove('hit'), 220); }
  // 사진틀을 하나 그리면 draw-frames.js가 고르기 도구로 돌아가므로 팔레트도 V로
  new MutationObserver(() => {
    if (mode === 'F' && !body.classList.contains('draw-on') && !body.classList.contains('pro-polying')) setMode('V');
  }).observe(body, { attributes: true, attributeFilter: ['class'] });

  /* 누르기 · 길게 누르기 · 오른쪽 버튼 */
  let hold = null;
  function toolDown(e) {      // window 캡처 단계에서 부름
    const b = e.target.closest('.tp-tool');
    if (!b || e.button !== 0) return;
    hideTip();
    const id = b.dataset.tool;
    clearTimeout(hold?.t);
    hold = { id, fired: false, t: SUB[id] ? setTimeout(() => { if (hold) { hold.fired = true; openSub(id); } }, 420) : 0 };
  }
  tp.querySelector('.tp-tools').addEventListener('pointerup', e => {
    const b = e.target.closest('.tp-tool');
    if (!hold) return;
    clearTimeout(hold.t);
    const h = hold; hold = null;
    if (!h.fired && b?.dataset.tool === h.id) choose(h.id);
  });
  tp.querySelector('.tp-tools').addEventListener('pointerleave', () => { if (hold && !hold.fired) { clearTimeout(hold.t); hold = null; } });
  tp.querySelector('.tp-tools').addEventListener('contextmenu', e => { const b = e.target.closest('.tp-tool'); if (!b) return; e.preventDefault(); if (SUB[b.dataset.tool]) openSub(b.dataset.tool); });

  function openSub(id) {
    const b = tp.querySelector(`[data-tool="${id}"]`), r = b.getBoundingClientRect();
    subEl.innerHTML = `<div class="tp-sub-t">${TOOL[id][1]}</div>` + SUB[id].map(([k, n, key]) => `<button type="button" data-k="${k}" class="${sub[id] === k ? 'on' : ''}"><span>${n}</span><kbd>${key}</kbd></button>`).join('');
    subEl.dataset.tool = id;
    subEl.hidden = false;
    subEl.style.left = `${Math.min(innerWidth - subEl.offsetWidth - 6, r.right + 4)}px`;
    subEl.style.top = `${Math.max(6, Math.min(innerHeight - subEl.offsetHeight - 6, r.top))}px`;
  }
  subEl.addEventListener('click', e => {
    const k = e.target.closest('[data-k]')?.dataset.k, id = subEl.dataset.tool;
    subEl.hidden = true;
    if (!k) return;
    if (SUBRUN[id]) { SUBRUN[id](k); return; }
    sub[id] = k;
    const b = tp.querySelector(`[data-tool="${id}"] svg`);
    if (b && id === 'F') b.innerHTML = k === 'ellipse' ? '<ellipse cx="12" cy="12" rx="8.5" ry="7"/><path d="M6 7l12 10M18 7L6 17"/>' : k === 'free' ? '<path d="M4 8l7-4 9 5-3 10-11 1z"/><path d="M4 8l13 11M20 9L6 20"/>' : I.F;
    choose(id);
  });

  /* 이름 · 단축키 말풍선 */
  let tipT = 0;
  function hideTip() { clearTimeout(tipT); tip.hidden = true; }
  tp.addEventListener('pointerover', e => {
    const b = e.target.closest('.tp-tool, .tp-sw, .tp-mini, .tp-modes button');
    if (!b) { hideTip(); return; }
    clearTimeout(tipT);
    tipT = setTimeout(() => {
      let h;
      if (b.dataset.tool) { const t = TOOL[b.dataset.tool]; h = `<b>${t[1]}</b>${t[2] ? ` <kbd>${t[2]}</kbd>` : ''}<br>${t[3]}${SUB[t[0]] ? '<br><small>길게 누르기 · 오른쪽 버튼: 세부 도구</small>' : ''}${t[4] === 'soon' ? `<br><small class="tp-soon-t">${t[5]}단계에서 연결 예정</small>` : ''}`; }
      else h = { fill: '<b>채우기 색</b><br>누르면 색 고르기 (HEX · RGB · 투명도)', stroke: '<b>선 색</b><br>누르면 색 · 선 두께 고르기', swap: '<b>채우기와 선 바꾸기</b> <kbd>Shift+X</kbd>', def: '<b>기본 색</b> <kbd>D</kbd>', color: '<b>색상</b> <kbd>,</kbd>', grad: '<b>그라디언트</b> <kbd>.</kbd>', none: '<b>색 없음</b> <kbd>/</kbd>' }[b.dataset.c];
      tip.innerHTML = h;
      tip.hidden = false;
      const r = b.getBoundingClientRect();
      tip.style.left = `${Math.min(innerWidth - tip.offsetWidth - 6, tp.getBoundingClientRect().right + 8)}px`;
      tip.style.top = `${Math.max(6, Math.min(innerHeight - tip.offsetHeight - 6, r.top))}px`;
    }, 350);
  });
  tp.addEventListener('pointerleave', hideTip);

  /* ---------- 채우기 · 선 색 ---------- */
  const isNone = c => !c || c === 'none';
  function drawSwatches() {
    for (const k of ['fill', 'stroke']) {
      const el = tp.querySelector(`.tp-${k}`), c = col[k];
      el.classList.toggle('none', isNone(c));
      el.style.setProperty('--c', isNone(c) ? 'transparent' : c);
      el.classList.toggle('front', col.active === k);
    }
    ls.set(COL_KEY, col);
  }
  function fromSelection() {
    const c = api().selColors?.();
    if (!c || c.kind === 'none' || c.kind === 'multi') { drawSwatches(); return; }
    if (c.fill != null) col.fill = c.fill;
    if (c.stroke != null) col.stroke = c.stroke;
    if (c.sw != null) col.sw = c.sw;
    if (c.op != null) col.op = c.op;
    drawSwatches();
    if (!pop.hidden) openPop(pop.dataset.k, true);
  }
  const paint = o => { api().paint?.(o); setTimeout(fromSelection, 60); };
  tp.querySelector('.tp-color').addEventListener('click', e => {
    const c = e.target.closest('[data-c]')?.dataset.c;
    if (!c) return;
    if (c === 'fill' || c === 'stroke') { col.active = c; drawSwatches(); openPop(c); return; }
    if (c === 'swap') swapColors();
    else if (c === 'def') { col.fill = '#ffffff'; col.stroke = '#000000'; drawSwatches(); note('기본 색: 채우기 흰색 · 선 검정 (고른 개체에는 넣지 않음)'); }
    else if (c === 'none') { col[col.active] = 'none'; drawSwatches(); paint({ [col.active]: 'none' }); }
    else if (c === 'color') { if (isNone(col[col.active])) col[col.active] = col.active === 'fill' ? '#E9CDBE' : '#8E7A62'; drawSwatches(); paint({ [col.active]: col[col.active] }); }
    else if (c === 'grad') RUN.G();
  });
  function swapColors() { [col.fill, col.stroke] = [col.stroke, col.fill]; drawSwatches(); paint({ fill: col.fill, stroke: col.stroke }); }

  const rgbOf = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const hexOf = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, +v | 0)).toString(16).padStart(2, '0')).join('');
  const userColors = () => (Array.isArray(S.userColors) ? S.userColors : []);
  function openPop(k, keepPos) {
    const c = isNone(col[k]) ? (k === 'fill' ? '#ffffff' : '#000000') : api().toHex?.(col[k]) || col[k], [r, g, b] = rgbOf(c);
    const sw = (list, tag) => `<div class="tp-pal">${list.map(x => `<button type="button" data-pick="${x}" data-tag="${tag}" title="${x}${tag === 'user' ? ' · 오른쪽 버튼: 빼기' : ''}" style="background:${x}"></button>`).join('')}</div>`;
    pop.dataset.k = k;
    pop.innerHTML = `<div class="tp-pop-h"><b>${k === 'fill' ? '채우기' : '선'} 색</b><button type="button" data-p="close" aria-label="닫기">×</button></div>
      <div class="tp-pop-row"><input type="color" data-p="native" value="${c}"><input type="text" data-p="hex" value="${c.toUpperCase()}" maxlength="7" spellcheck="false"><button type="button" data-p="nonebtn" title="색 없음">∅</button></div>
      <div class="tp-pop-row tp-rgb"><label>R<input type="number" data-p="r" min="0" max="255" value="${r}"></label><label>G<input type="number" data-p="g" min="0" max="255" value="${g}"></label><label>B<input type="number" data-p="b" min="0" max="255" value="${b}"></label></div>
      ${k === 'stroke' ? `<label class="tp-pop-line"><span>선 두께</span><input type="number" data-p="sw" min="0" max="10" step="0.1" value="${col.sw}"> mm</label>` : ''}
      <label class="tp-pop-line"><span>투명도</span><input type="range" data-p="op" min="5" max="100" step="5" value="${Math.round((col.op ?? 1) * 100)}"><b>${Math.round((col.op ?? 1) * 100)}%</b></label>
      ${api().recent?.().length ? `<div class="tp-pop-t">최근 사용 색</div>${sw(api().recent(), 'recent')}` : ''}
      <div class="tp-pop-t">이 앨범의 색 <button type="button" data-p="save" title="지금 색을 이 앨범 팔레트에 저장">+ 저장</button></div>${userColors().length ? sw(userColors(), 'user') : '<p class="tp-pop-n">자주 쓰는 학교 색을 저장해 두면 앨범 파일에 함께 저장됩니다.</p>'}
      <p class="tp-pop-n">${({ none: '아무것도 고르지 않았으면 채우기 색이 지금 쪽 배경에 들어갑니다.', text: '글자는 채우기 색이 글자색입니다.', frame: '사진틀은 선 색이 테두리입니다.' })[api().selColors?.().kind] || '고른 개체에 바로 들어가고 Ctrl+Z로 되돌립니다.'}</p>`;
    pop.hidden = false;
    if (!keepPos) {
      const tr = tp.getBoundingClientRect();
      pop.style.left = `${Math.min(innerWidth - pop.offsetWidth - 6, tr.right + 8)}px`;
      pop.style.top = `${Math.max(6, Math.min(innerHeight - pop.offsetHeight - 6, tr.bottom - pop.offsetHeight))}px`;
    }
  }
  function setColor(k, c) {
    col[k] = c; drawSwatches();
    paint({ [k]: c });
    openPop(k, true);
  }
  pop.addEventListener('click', e => {
    const p = e.target.closest('[data-p]')?.dataset.p, k = pop.dataset.k;
    if (p === 'close') { pop.hidden = true; return; }
    if (p === 'nonebtn') { setColor(k, 'none'); return; }
    if (p === 'save') {
      const c = col[k];
      if (isNone(c)) return;
      S.userColors = [c, ...userColors().filter(x => x !== c)].slice(0, 24);
      saveState(); openPop(k, true); note(`${c}를 이 앨범 색에 저장했습니다.`);
      return;
    }
    const pick = e.target.closest('[data-pick]')?.dataset.pick;
    if (pick) setColor(k, pick);
  });
  pop.addEventListener('contextmenu', e => {
    const b = e.target.closest('[data-tag="user"]');
    if (!b) return;
    e.preventDefault();
    S.userColors = userColors().filter(x => x !== b.dataset.pick);
    saveState(); openPop(pop.dataset.k, true);
  });
  pop.addEventListener('change', e => {
    const p = e.target.dataset.p, k = pop.dataset.k;
    if (p === 'native') setColor(k, e.target.value);
    else if (p === 'hex') { const v = e.target.value.trim(), h = v.startsWith('#') ? v : `#${v}`; if (/^#[0-9a-f]{6}$/i.test(h)) setColor(k, h.toLowerCase()); else { note('HEX는 #RRGGBB 형식으로 넣으세요. 예: #C8A465'); openPop(k, true); } }
    else if (['r', 'g', 'b'].includes(p)) { const v = ['r', 'g', 'b'].map(x => pop.querySelector(`[data-p="${x}"]`).value); setColor(k, hexOf(...v)); }
    else if (p === 'sw') { col.sw = Math.max(0, +e.target.value || 0); drawSwatches(); paint({ sw: col.sw }); }
    else if (p === 'op') { col.op = +e.target.value / 100; drawSwatches(); paint({ op: col.op }); }
  });
  pop.addEventListener('input', e => { if (e.target.dataset.p === 'op') e.target.nextElementSibling.textContent = `${e.target.value}%`; });
  pop.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('input')) e.target.blur(); });

  async function eyedrop() {
    if (!window.EyeDropper) { note('이 브라우저는 스포이트를 지원하지 않습니다. Edge · Chrome 최신판에서 쓰세요.'); return; }
    try {
      const r = await new EyeDropper().open();
      col[col.active] = r.sRGBHex; drawSwatches();
      paint({ [col.active]: r.sRGBHex });
      note(`스포이트: ${r.sRGBHex}를 ${col.active === 'fill' ? '채우기' : '선'} 색으로 썼습니다.`);
    } catch { /* 취소 */ }
  }

  /* ---------- 손 · 확대 · 자르기 도구의 화면 동작 ---------- */
  let pan = null;
  addEventListener('pointerdown', e => {
    if (e.target.closest?.('#tp,#tp-sub,#tp-pop')) {
      e.stopPropagation();      // 팔레트를 눌러도 고른 틀이 풀리지 않게 (그래서 팔레트 자체의 누르기도 여기서 처리)
      if (!e.target.closest('#tp-sub,.tp-tool')) subEl.hidden = true;
      if (e.target.closest('#tp .tp-head')) headDown(e);
      else if (e.target.closest('#tp .tp-tool')) toolDown(e);
      return;
    }
    if (!subEl.hidden) subEl.hidden = true;
    if (!pop.hidden && !e.target.closest?.('#pro-props,#pro-fly')) pop.hidden = true;
    if (e.button !== 0 || !e.target.closest?.('#pages')) return;
    if (mode === 'H') { e.preventDefault(); e.stopImmediatePropagation(); pan = { x: e.clientX, y: e.clientY }; body.classList.add('hand-pan'); }
    else if (mode === 'Z') { e.preventDefault(); e.stopImmediatePropagation(); setViewZoom(+S.zoom + (e.altKey ? -.1 : .1)); }
  }, true);
  addEventListener('pointermove', e => { if (!pan) return; e.preventDefault(); scrollBy(pan.x - e.clientX, pan.y - e.clientY); pan = { x: e.clientX, y: e.clientY }; }, true);
  addEventListener('pointerup', () => { if (pan) { pan = null; body.classList.remove('hand-pan'); } }, true);
  addEventListener('click', e => { if ((mode === 'H' || mode === 'Z') && e.target.closest?.('#pages')) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  document.getElementById('pages').addEventListener('wheel', e => {
    if (e.ctrlKey || mode === 'H' || mode === 'Z') return;
    const ph = e.target.closest('.trim .photo.has-img'), face = ph?.closest(PAGE_SEL);
    if (!ph || !face) return;
    // 마우스 휠로 사진 확대 · 축소: 자르기 도구(C)일 때는 아무 사진이나, 평소에는 눌러서 고른 사진 위에서 · Alt+휠은 어느 사진이든
    if (mode !== 'C' && !e.altKey && frameSel?.key !== ph.dataset.photo) return;
    e.preventDefault();
    if (frameSel?.key !== ph.dataset.photo) { frameMulti = []; frameSel = { key: ph.dataset.photo, pid: face.dataset.pid }; framePage = face.dataset.pid; syncFrameSel(); }
    zoomPhoto(ph.dataset.photo, e.deltaY < 0);
  }, { passive: false });

  /* ---------- 단축키 (한글 입력 상태에서도 같은 자리 키) ---------- */
  addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || typing(e)) return;
    if (e.key === 'Escape') { subEl.hidden = true; pop.hidden = true; if (mode !== 'V') setMode('V'); return; }
    if (e.code === 'KeyX' && e.shiftKey) { e.preventDefault(); e.stopImmediatePropagation(); swapColors(); return; }
    if (e.shiftKey) return;
    if (e.code === 'KeyD') { e.preventDefault(); e.stopImmediatePropagation(); col.fill = '#ffffff'; col.stroke = '#000000'; drawSwatches(); return; }
    if (e.code === 'Slash') { e.preventDefault(); e.stopImmediatePropagation(); col[col.active] = 'none'; drawSwatches(); paint({ [col.active]: 'none' }); return; }
    const id = CODE[e.code];
    if (!id) return;
    e.preventDefault(); e.stopImmediatePropagation();      // draw-frames.js의 L(원형)보다 먼저: 일러스트레이터처럼 L은 선, O는 원형
    choose(id);
  }, true);

  /* 고른 개체가 바뀌면 채우기 · 선 견본도 그 개체 색으로 */
  const o = window.syncFrameSel;
  let sig = '';
  if (typeof o === 'function') window.syncFrameSel = function (...a) {
    const r = o.apply(this, a);
    const s = frameMulti.length > 1 ? 'm' : frameSel ? `${frameSel.pid}|${frameSel.key}` : '';
    if (s !== sig) { sig = s; setTimeout(fromSelection, 40); }
    return r;
  };

  layout();
  setMode('V');
  drawSwatches();
  window.toolPalette = { setMode, choose, colors: col };
})();
