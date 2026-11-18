/* 졸업앨범 디자이너 PRO 화면 (포토샵 · 캔바 · 인디자인 방식)
   - 위: 파일 · 실행 취소 · 확대 · 저장 · 내보내기
   - 왼쪽: 아이콘 팔레트 12개 → 누르면 그 도구의 설정 창이 열림. 맨 위 [설정]은 예전 왼쪽 설정 패널
   - 오른쪽: 고른 개체(사진틀 · 글자 · 도형)의 속성
   - 아래: 쪽 썸네일 (기존 페이지 패널을 가로로)
   기존 기능은 그대로 두고 그 위에 얹음. 모든 값은 S(앨범 상태)에 저장 → 자동 저장 · Ctrl+Z · 파일 저장에 함께 들어감.
   원본 사진 파일은 바꾸지 않음 (보정 · 모양 · 테두리는 화면 표시와 내보내기 때만 입힘). */
(() => {
  const PRO_KEY = 'gradAlbum.proUI', SIDE_KEY = 'gradAlbum.proSide', UNIT_KEY = 'gradAlbum.proUnit', PPI_KEY = 'gradAlbum.targetPpi', BIND_KEY = 'gradAlbum.proBind', RECENT_KEY = 'gradAlbum.recentColors';
  const ls = { get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* 저장 못 해도 동작 */ } } };
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const r1 = n => Math.round(n * 10) / 10, r2 = n => Math.round(n * 100) / 100;
  const clone = o => JSON.parse(JSON.stringify(o));
  const body = document.body;

  /* ============ 단위 · 선택 ============ */
  const pxmm = () => { const p = document.querySelector('#pages .page'); return p ? p.getBoundingClientRect().width / G.pageMm : 3.78; };
  const trimOf = el => el?.closest(PAGE_SEL)?.querySelector('.trim');
  const trimMm = el => { const t = trimOf(el); return t ? t.getBoundingClientRect().width / pxmm() : (SIZES[S.size] || SIZES.a4).w; };
  const trimAsp = el => { const r = trimOf(el)?.getBoundingClientRect(); return r && r.width ? r.height / r.width * 100 : G.aspect * 100; };
  const unit = () => ls.get(UNIT_KEY, 'mm');
  const REF_KEY = 'gradAlbum.proRefPt', RATIO_KEY = 'gradAlbum.proRatio', ALIGNTO_KEY = 'gradAlbum.proAlignTo', GAP_KEY = 'gradAlbum.proGap', GAPON_KEY = 'gradAlbum.proGapOn';
  const alignTo = () => ls.get(ALIGNTO_KEY, 'sel');      // 여러 틀 정렬 기준: 'sel' 고른 것끼리 · 'page' 쪽(재단선)
  const refPt = () => ls.get(REF_KEY, 'tl');            // 변형 기준점 (인디자인 9점): t/m/b + l/c/r
  const refF = () => { const p = refPt(); return { fx: { l: 0, c: .5, r: 1 }[p[1]] ?? 0, fy: { t: 0, m: .5, b: 1 }[p[0]] ?? 0 }; };
  const mmShow = mm => (unit() === 'in' ? r2(mm / 25.4) : r1(mm));
  const mmRead = v => (unit() === 'in' ? +v * 25.4 : +v);
  const uLabel = () => (unit() === 'in' ? 'in' : 'mm');
  const note = t => { const n = document.getElementById('pt-msg'); if (n) { n.textContent = t || ''; n.title = t || ''; } if (typeof frameNote === 'function') frameNote(t || ''); };
  const toHex = c => {
    if (!c) return '#000000';
    if (/^#[0-9a-f]{6}$/i.test(c)) return c.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(c)) return '#' + c.slice(1).split('').map(x => x + x).join('').toLowerCase();
    const m = c.match(/\d+(\.\d+)?/g);
    return m ? '#' + m.slice(0, 3).map(v => (+v | 0).toString(16).padStart(2, '0')).join('') : '#000000';
  };

  function sel() {
    if (frameMulti.length > 1) return { kind: 'multi', list: frameMulti.slice() };
    if (!frameSel) return null;
    const el = selFrameEl();
    if (!el) return null;
    const { pid, key } = frameSel, id = `${pid}|${key}`;
    if (frameSel.kind === 'text') return { kind: 'text', pid, key, el, id };
    const x = frameExtra(key);
    return { kind: x && /\bx-shape\b/.test(x.cls) ? 'shape' : 'frame', pid, key, el, x, id };
  }
  const recOfSel = s => s.x || layerRec('frame', s.pid, s.key, true);
  const stOf = s => { const r = recOfSel(s); return (r.st ||= {}); };
  const stPeek = s => (s.x || layerRec('frame', s.pid, s.key))?.st || {};      // 보기만 할 때는 기록을 만들지 않음
  const curPid = () => frameSel?.pid || framePage || window.pgCurrent?.() || document.querySelector('#pages .page')?.dataset.pid;
  const pageEl = pid => pid && document.querySelector(`#pages .page[data-pid="${CSS.escape(pid)}"]`);
  const pageNo = pid => { const i = $$('#pages .page').filter(p => !p.dataset.pid.includes('~')).findIndex(p => p.dataset.pid === pid); return i < 0 ? '' : `P.${String(i + 1).padStart(2, '0')}`; };
  const pidLabel = pid => (!pid ? '없음' : /wrap/.test(pid) ? (/front/.test(pid) ? '앞표지' : '뒤표지') : pageNo(pid) || pid);

  /* ============ 모양 (사진틀 모양 · 도형이 같이 씀) ============ */
  const P2 = n => Math.round(n * 10) / 10;
  const poly = pts => (a, b, c, d) => pts.map(([u, v], i) => `${i ? 'L' : 'M'}${P2(a + (c - a) * u)} ${P2(b + (d - b) * v)}`).join('') + 'Z';
  const starPts = (() => { const p = []; for (let i = 0; i < 10; i++) { const t = (-90 + i * 36) * Math.PI / 180, R = i % 2 ? .2 : .5; p.push([.5 + R * Math.cos(t), .54 + R * Math.sin(t) * 1.04]); } return p; })();
  function smooth(pts, a, b, c, d) {
    const P = pts.map(([u, v]) => [a + (c - a) * u, b + (d - b) * v]), n = P.length;
    let s = `M${P2(P[0][0])} ${P2(P[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
      s += `C${P2(p1[0] + (p2[0] - p0[0]) / 6)} ${P2(p1[1] + (p2[1] - p0[1]) / 6)} ${P2(p2[0] - (p3[0] - p1[0]) / 6)} ${P2(p2[1] - (p3[1] - p1[1]) / 6)} ${P2(p2[0])} ${P2(p2[1])}`;
    }
    return s + 'Z';
  }
  const SHP = {
    rect: (a, b, c, d) => `M${P2(a)} ${P2(b)}H${P2(c)}V${P2(d)}H${P2(a)}Z`,
    rrect: (a, b, c, d, st) => { const r = Math.max(0, Math.min(st?._r || 0, (c - a) / 2, (d - b) / 2)); return `M${P2(a + r)} ${P2(b)}H${P2(c - r)}Q${P2(c)} ${P2(b)} ${P2(c)} ${P2(b + r)}V${P2(d - r)}Q${P2(c)} ${P2(d)} ${P2(c - r)} ${P2(d)}H${P2(a + r)}Q${P2(a)} ${P2(d)} ${P2(a)} ${P2(d - r)}V${P2(b + r)}Q${P2(a)} ${P2(b)} ${P2(a + r)} ${P2(b)}Z`; },      // 모퉁이 크기(mm) 지정 (속성 창 '모양')
    round: (a, b, c, d) => { const r = Math.min(c - a, d - b) * .14; return `M${P2(a + r)} ${P2(b)}H${P2(c - r)}Q${P2(c)} ${P2(b)} ${P2(c)} ${P2(b + r)}V${P2(d - r)}Q${P2(c)} ${P2(d)} ${P2(c - r)} ${P2(d)}H${P2(a + r)}Q${P2(a)} ${P2(d)} ${P2(a)} ${P2(d - r)}V${P2(b + r)}Q${P2(a)} ${P2(b)} ${P2(a + r)} ${P2(b)}Z`; },
    ellipse: (a, b, c, d) => { const rx = (c - a) / 2, ry = (d - b) / 2, y = P2(b + ry); return `M${P2(a)} ${y}A${P2(rx)} ${P2(ry)} 0 1 0 ${P2(c)} ${y}A${P2(rx)} ${P2(ry)} 0 1 0 ${P2(a)} ${y}Z`; },
    arch: (a, b, c, d) => { const rx = (c - a) / 2, ry = Math.min(rx, (d - b) / 2); return `M${P2(a)} ${P2(d)}V${P2(b + ry)}A${P2(rx)} ${P2(ry)} 0 0 1 ${P2(c)} ${P2(b + ry)}V${P2(d)}Z`; },
    hex: poly([[0, .5], [.25, 0], [.75, 0], [1, .5], [.75, 1], [.25, 1]]),
    oct: poly([[.29, 0], [.71, 0], [1, .29], [1, .71], [.71, 1], [.29, 1], [0, .71], [0, .29]]),
    diamond: poly([[.5, 0], [1, .5], [.5, 1], [0, .5]]),
    tri: poly([[.5, 0], [1, 1], [0, 1]]),
    star: poly(starPts),
    heart: (a, b, c, d) => { const X = u => P2(a + (c - a) * u), Y = v => P2(b + (d - b) * v); return `M${X(.5)} ${Y(1)}C${X(.12)} ${Y(.72)} ${X(0)} ${Y(.46)} ${X(.04)} ${Y(.26)}C${X(.1)} ${Y(.02)} ${X(.42)} ${Y(-.02)} ${X(.5)} ${Y(.22)}C${X(.58)} ${Y(-.02)} ${X(.9)} ${Y(.02)} ${X(.96)} ${Y(.26)}C${X(1)} ${Y(.46)} ${X(.88)} ${Y(.72)} ${X(.5)} ${Y(1)}Z`; },
    blob: (a, b, c, d) => smooth([[.5, .02], [.84, .1], [.98, .42], [.9, .8], [.56, .98], [.2, .92], [.02, .62], [.08, .22]], a, b, c, d),
    cloud: (a, b, c, d) => smooth([[.2, .35], [.38, .12], [.62, .14], [.8, .32], [.97, .52], [.86, .82], [.6, .9], [.36, .88], [.1, .82], [.03, .55]], a, b, c, d),
    poly: (a, b, c, d, st) => poly(st?.pts || [[0, 0], [1, 0], [1, 1], [0, 1]])(a, b, c, d),
  };
  const SHAPE_LABEL = { rect: '사각', round: '둥근 사각', ellipse: '원형', arch: '아치', hex: '육각', oct: '팔각', diamond: '마름모', tri: '삼각', star: '별', heart: '하트', blob: '자유형', cloud: '구름', poly: '직접 그린 모양' };
  const shapeIcon = k => `<svg viewBox="-4 -4 108 108"><path d="${(SHP[k] || SHP.rect)(4, 10, 96, 90)}" fill="#8fb4e8" fill-opacity=".35" stroke="#cfe0ff" stroke-width="5"/></svg>`;
  const LINES = {
    lineh: (W, H) => `M0 ${H / 2}H${W}`, linev: (W, H) => `M${W / 2} 0V${H}`, lined: (W, H) => `M0 0L${W} ${H}`, lineu: (W, H) => `M0 ${H}L${W} 0`,
    curve: (W, H) => `M0 ${H * .85}Q${W / 2} ${-H * .7} ${W} ${H * .85}`,
    wave: (W, H) => { let s = `M0 ${H / 2}`; const n = 4, q = W / n; for (let i = 0; i < n; i++) s += `Q${q * i + q / 4} ${i % 2 ? H * .9 : H * .1} ${q * i + q / 2} ${H / 2}T${q * (i + 1)} ${H / 2}`; return s; },
  };
  const LINE_LABEL = { lineh: '가로선', linev: '세로선', lined: '사선 ↘', lineu: '사선 ↗', curve: '곡선', wave: '물결선' };

  /* ============ 일러스트 (봄 · 여름 · 가을 · 겨울 · 졸업) ============ */
  const petal = (r, c) => `<path transform="rotate(${r} 50 50)" d="M50 50C38 38 37 18 46 11L50 16 54 11C63 18 62 38 50 50Z" fill="${c}"/>`;
  const ILLU = {
    sakura: { s: 'spring', n: '벚꽃', c: ['#F6B8C8', '#E98AA4'], d: ([a, b]) => [0, 72, 144, 216, 288].map(r => petal(r, a)).join('') + `<circle cx="50" cy="50" r="7" fill="${b}"/>` },
    tulip: { s: 'spring', n: '튤립', c: ['#F28BA0', '#7DB46C'], d: ([a, b]) => `<path d="M50 96V56" stroke="${b}" stroke-width="4" fill="none"/><path d="M50 86C36 82 30 72 29 62 42 66 48 74 50 86Z" fill="${b}"/><path d="M32 28 40 41 50 26 60 41 68 28C71 49 63 60 50 60S29 49 32 28Z" fill="${a}"/>` },
    sprout: { s: 'spring', n: '새싹', c: ['#8CC97A', '#5E9E50'], d: ([a, b]) => `<path d="M50 92V50" stroke="${b}" stroke-width="4" fill="none"/><path d="M50 56C34 58 20 48 18 30 36 28 48 38 50 56Z" fill="${a}"/><path d="M50 50C54 32 68 22 86 24 84 44 70 52 50 50Z" fill="${b}"/>` },
    butterfly: { s: 'spring', n: '나비', c: ['#F7C66B', '#9B7AD1'], d: ([a, b]) => `<ellipse cx="32" cy="36" rx="20" ry="16" fill="${a}"/><ellipse cx="68" cy="36" rx="20" ry="16" fill="${a}"/><ellipse cx="36" cy="64" rx="14" ry="12" fill="${b}"/><ellipse cx="64" cy="64" rx="14" ry="12" fill="${b}"/><rect x="47" y="28" width="6" height="46" rx="3" fill="#5a4a3a"/><path d="M48 28C44 18 40 14 34 12M52 28C56 18 60 14 66 12" stroke="#5a4a3a" stroke-width="2" fill="none"/>` },
    sun: { s: 'summer', n: '해', c: ['#FFC94D', '#FF9F43'], d: ([a, b]) => `<circle cx="50" cy="50" r="20" fill="${a}"/>` + Array.from({ length: 12 }, (_, i) => `<path transform="rotate(${i * 30} 50 50)" d="M50 8V22" stroke="${b}" stroke-width="5" stroke-linecap="round"/>`).join('') },
    wave: { s: 'summer', n: '파도', c: ['#5BB8E8', '#A8DCF5'], d: ([a, b]) => `<path d="M2 46Q14 32 26 46T50 46 74 46 98 46" stroke="${a}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M2 64Q14 50 26 64T50 64 74 64 98 64" stroke="${b}" stroke-width="6" fill="none" stroke-linecap="round"/>` },
    shell: { s: 'summer', n: '조개', c: ['#F9C8A8', '#E29A72'], d: ([a, b]) => `<path d="M50 88 14 46Q50 6 86 46Z" fill="${a}"/><path d="M50 88 30 30M50 88 50 22M50 88 70 30M50 88 20 44M50 88 80 44" stroke="${b}" stroke-width="2.5" fill="none"/><rect x="40" y="84" width="20" height="8" rx="3" fill="${b}"/>` },
    cloud: { s: 'summer', n: '구름', c: ['#FFFFFF', '#CFE6FA'], d: ([a, b]) => `<g fill="${a}" stroke="${b}" stroke-width="3"><path d="${SHP.cloud(6, 26, 94, 78)}"/></g>` },
    maple: { s: 'autumn', n: '단풍', c: ['#E0663A', '#B8432A'], d: ([a, b]) => `<path d="M50 4 57 24 70 17 66 37 88 31 80 47 96 54 74 62 79 75 58 68 54 88H46L42 68 21 75 26 62 4 54 20 47 12 31 34 37 30 17 43 24Z" fill="${a}"/><path d="M50 70V98" stroke="${b}" stroke-width="3.5"/>` },
    ginkgo: { s: 'autumn', n: '은행잎', c: ['#F2C14E', '#C9962B'], d: ([a, b]) => `<path d="M50 92V62" stroke="${b}" stroke-width="3.5"/><path d="M50 62C22 58 8 34 14 14 30 24 40 20 50 30 60 20 70 24 86 14 92 34 78 58 50 62Z" fill="${a}"/>` },
    acorn: { s: 'autumn', n: '도토리', c: ['#C98B4E', '#8A5A2E'], d: ([a, b]) => `<path d="M30 46H70V58C70 78 60 90 50 92 40 90 30 78 30 58Z" fill="${a}"/><path d="M26 46C26 30 74 30 74 46Z" fill="${b}"/><path d="M50 32V20" stroke="${b}" stroke-width="4" stroke-linecap="round"/>` },
    leafb: { s: 'autumn', n: '낙엽 가지', c: ['#D9873E', '#9C6B3A'], d: ([a, b]) => `<path d="M10 90C40 70 60 50 90 10" stroke="${b}" stroke-width="3" fill="none"/>` + [[30, 72, -30], [50, 52, 20], [66, 36, -40], [80, 22, 30]].map(([x, y, r]) => `<path transform="rotate(${r} ${x} ${y})" d="M${x} ${y}c-10-4-14-14-10-22 10 2 14 12 10 22z" fill="${a}"/>`).join('') },
    snow: { s: 'winter', n: '눈송이', c: ['#8FB8E0', '#C9DDF2'], d: ([a]) => Array.from({ length: 6 }, (_, i) => `<g transform="rotate(${i * 60} 50 50)" stroke="${a}" stroke-width="4" stroke-linecap="round" fill="none"><path d="M50 50V8"/><path d="M50 22 41 14M50 22 59 14M50 36 43 30M50 36 57 30"/></g>`).join('') },
    snowman: { s: 'winter', n: '눈사람', c: ['#FFFFFF', '#E25B4C'], d: ([a, b]) => `<circle cx="50" cy="68" r="24" fill="${a}" stroke="#b9cce0" stroke-width="2"/><circle cx="50" cy="34" r="16" fill="${a}" stroke="#b9cce0" stroke-width="2"/><rect x="30" y="47" width="40" height="7" rx="3" fill="${b}"/><circle cx="44" cy="31" r="2" fill="#333"/><circle cx="56" cy="31" r="2" fill="#333"/><path d="M50 36 62 39 50 40Z" fill="#F39A3B"/><rect x="38" y="10" width="24" height="10" fill="#444"/><rect x="33" y="19" width="34" height="4" fill="#444"/>` },
    tree: { s: 'winter', n: '트리', c: ['#4E9A6A', '#E25B4C'], d: ([a, b]) => `<path d="M50 6 74 40H62L82 66H60L86 88H14L40 66H18L38 40H26Z" fill="${a}"/><rect x="44" y="88" width="12" height="9" fill="#8A5A2E"/><circle cx="44" cy="52" r="3.5" fill="${b}"/><circle cx="58" cy="72" r="3.5" fill="${b}"/><circle cx="38" cy="78" r="3.5" fill="#FFC94D"/><circle cx="55" cy="34" r="3.5" fill="#FFC94D"/>` },
    star: { s: 'winter', n: '별', c: ['#FFD25E', '#E8A93A'], d: ([a, b]) => `<path d="${SHP.star(6, 4, 94, 92)}" fill="${a}" stroke="${b}" stroke-width="3" stroke-linejoin="round"/>` },
    cap: { s: 'grad', n: '학사모', c: ['#3A3F4B', '#E8B84A'], d: ([a, b]) => `<path d="M28 48V64C28 72 72 72 72 64V48" fill="${a}"/><path d="M50 22 94 40 50 58 6 40Z" fill="${a}"/><path d="M50 40 80 46V68" stroke="${b}" stroke-width="2.5" fill="none"/><circle cx="80" cy="71" r="4" fill="${b}"/>` },
    diploma: { s: 'grad', n: '졸업장', c: ['#F6EBD2', '#C9302C'], d: ([a, b]) => `<rect x="10" y="38" width="80" height="24" rx="12" fill="${a}" stroke="#cdb88a" stroke-width="2.5"/><circle cx="22" cy="50" r="7" fill="#e9dbb8" stroke="#cdb88a" stroke-width="2"/><path d="M46 38V62M54 38V62" stroke="${b}" stroke-width="5"/><path d="M50 62 42 84 50 78 58 84Z" fill="${b}"/>` },
    ribbon: { s: 'grad', n: '리본', c: ['#F08AA2', '#D4657F'], d: ([a, b]) => `<path d="M50 50C36 30 14 28 14 42S36 62 50 50ZM50 50C64 30 86 28 86 42S64 62 50 50Z" fill="${a}"/><path d="M48 52 34 86 44 80 50 90 52 54ZM52 52 66 86 56 80 50 90 48 54Z" fill="${b}"/><circle cx="50" cy="50" r="7" fill="${b}"/>` },
    heart: { s: 'grad', n: '하트', c: ['#FF9DB4', '#F06A8A'], d: ([a, b]) => `<path d="${SHP.heart(8, 12, 92, 90)}" fill="${a}" stroke="${b}" stroke-width="3"/>` },
    balloon: { s: 'grad', n: '풍선', c: ['#8CC6F2', '#FFAE70'], d: ([a, b]) => `<ellipse cx="36" cy="34" rx="18" ry="22" fill="${a}"/><ellipse cx="64" cy="40" rx="18" ry="22" fill="${b}"/><path d="M36 56C38 70 46 80 50 96M64 62C62 74 54 84 50 96" stroke="#777" stroke-width="1.5" fill="none"/>` },
  };
  const SEASONS = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울', grad: '졸업' };
  const illuSvg = (k, cols) => { const it = ILLU[k]; return it ? it.d(cols?.length ? cols : it.c) : ''; };

  /* 계절 프레임: 틀 네 모서리 장식 (왼쪽 위 모서리 그림을 뒤집어 씀) */
  const DECO = {
    spring: { n: '봄 벚꽃', d: () => `<g transform="translate(4 4) scale(.42)">${illuSvg('sakura')}</g><g transform="translate(36 2) scale(.24)">${illuSvg('sakura', ['#FBD3DE', '#E98AA4'])}</g><g transform="translate(2 36) scale(.24)">${illuSvg('sakura', ['#FBD3DE', '#E98AA4'])}</g><path d="M30 12C44 8 56 10 68 4M12 30C8 44 10 56 4 68" stroke="#9BC48A" stroke-width="2" fill="none"/>` },
    summer: { n: '여름 바다', d: () => `<g transform="translate(0 0) scale(.45)">${illuSvg('sun')}</g><path d="M40 10Q47 4 54 10T68 10 82 10M10 40Q4 47 10 54T10 68 10 82" stroke="#5BB8E8" stroke-width="3" fill="none" stroke-linecap="round"/>` },
    autumn: { n: '가을 단풍', d: () => `<g transform="translate(2 2) scale(.4) rotate(-20 50 50)">${illuSvg('maple')}</g><g transform="translate(38 4) scale(.24) rotate(25 50 50)">${illuSvg('ginkgo')}</g><g transform="translate(4 40) scale(.24) rotate(-35 50 50)">${illuSvg('maple', ['#F2A541', '#B8432A'])}</g>` },
    winter: { n: '겨울 눈꽃', d: () => `<g transform="translate(2 2) scale(.4)">${illuSvg('snow')}</g><g transform="translate(40 6) scale(.18)">${illuSvg('snow', ['#B7CCE0'])}</g><g transform="translate(6 40) scale(.18)">${illuSvg('snow', ['#B7CCE0'])}</g>` },
    grad: { n: '졸업 리본', d: () => `<g transform="translate(0 0) scale(.42)">${illuSvg('cap')}</g><g transform="translate(36 6) scale(.22)">${illuSvg('star')}</g><g transform="translate(6 36) scale(.22)">${illuSvg('star')}</g>` },
    line: { n: '모서리 선', d: () => '<path d="M4 40V4H40M10 30V10H30" stroke="#B8975A" stroke-width="2.4" fill="none"/>' },
  };

  /* ============ 배경 질감 ============ */
  const svgUrl = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
  const noise = (op, f = .85) => svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="${f}" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#n)" opacity="${op}"/></svg>`);
  const rgb01 = c => { const h = toHex(c); return [1, 3, 5].map(i => (parseInt(h.slice(i, i + 2), 16) / 255).toFixed(3)); };
  const wash = c => { const [r, g, b] = rgb01(c); return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><filter id="w"><feTurbulence type="fractalNoise" baseFrequency=".004" numOctaves="4" seed="7"/><feColorMatrix values="0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 2.4 -1"/></filter><rect width="100%" height="100%" filter="url(#w)"/></svg>`); };
  const TEX = {
    paper: { n: '종이', f: c => `${noise(.1)} 0 0/60mm 60mm, ${c[0]}` },
    linen: { n: '린넨', f: c => `repeating-linear-gradient(0deg,rgba(0,0,0,.035) 0 .3mm,transparent .3mm .9mm),repeating-linear-gradient(90deg,rgba(0,0,0,.03) 0 .3mm,transparent .3mm .9mm),${c[0]}` },
    kraft: { n: '크라프트', f: c => `${noise(.18, .7)} 0 0/50mm 50mm, ${c[0]}` },
    wash: { n: '수채 번짐', f: c => `${wash(c[1])} center/cover no-repeat, ${c[0]}` },
    dots: { n: '물방울', f: c => `radial-gradient(${c[1]} 17%, transparent 19%) 0 0/9mm 9mm, ${c[0]}` },
    grid: { n: '모눈', f: c => `linear-gradient(${c[1]} .25mm, transparent .25mm) 0 0/10mm 10mm, linear-gradient(90deg, ${c[1]} .25mm, transparent .25mm) 0 0/10mm 10mm, ${c[0]}` },
    stripe: { n: '사선 줄', f: c => `repeating-linear-gradient(45deg, ${c[1]} 0 3mm, ${c[0]} 3mm 9mm)` },
    check: { n: '체크', f: c => `repeating-linear-gradient(0deg, ${c[1]}55 0 6mm, transparent 6mm 12mm), repeating-linear-gradient(90deg, ${c[1]}55 0 6mm, transparent 6mm 12mm), ${c[0]}` },
  };

  /* ============ 색상 팔레트 ============ */
  const PALETTES = [
    ['모던 내추럴', ['#F4F1EA', '#D9CBB4', '#A89F8C', '#7D8B6A', '#4F5D46', '#2E2E2A']],
    ['파스텔 스쿨', ['#FBE3E8', '#FFF1C9', '#D6F0E0', '#D8E8F8', '#E7DDF6', '#F7CFC0']],
    ['미니멀 화이트', ['#FFFFFF', '#F5F5F3', '#E3E3E0', '#BDBDB8', '#6E6E6A', '#222222']],
    ['프리미엄 베이지', ['#F6EFE3', '#E8D9C0', '#CBB08A', '#A88B62', '#6E5A3E', '#3B2F22']],
    ['소프트 핑크', ['#FFF4F5', '#FCE1E4', '#F7C5CC', '#EFA3AF', '#D27D8C', '#8E4C5A']],
    ['빈티지 크림', ['#FBF5E6', '#F1E4C3', '#DCC59A', '#B89B6A', '#8A6F4B', '#5A4632']],
    ['클래식 네이비', ['#F4F6FA', '#C9D3E3', '#8EA0BD', '#3F567A', '#1F3355', '#0F1E36']],
    ['봄', ['#FADADD', '#F9C5D1', '#FFE9A8', '#C8E6C0', '#9FD3A8', '#F6A9B8']],
    ['여름', ['#E0F4FF', '#A8DCF5', '#5BB8E8', '#FFE27A', '#7ED6C1', '#2D8FC9']],
    ['가을', ['#FBE8D3', '#F2C38B', '#E0904F', '#B85C38', '#8A3B2B', '#6E7F3F']],
    ['겨울', ['#F5F9FC', '#DDE8F2', '#B7CCE0', '#8AA7C8', '#4E6E96', '#C9302C']],
  ];
  const recent = () => { try { return JSON.parse(ls.get(RECENT_KEY, '[]')); } catch { return []; } };
  const pushRecent = c => ls.set(RECENT_KEY, JSON.stringify([c, ...recent().filter(x => x !== c)].slice(0, 12)));

  const FONTS = [["'Gowun Batang', serif", '고운 바탕'], ["'Nanum Myeongjo', serif", '나눔 명조'], ["'Noto Serif KR', serif", '본명조 (Noto Serif)'], ["'Noto Sans KR', sans-serif", '본고딕 (Noto Sans)'], ["'Jua', sans-serif", '주아 (귀여운)'], ["'Nanum Pen Script', cursive", '나눔 손글씨 펜'], ["'Jost', sans-serif", 'Jost (영문)'], ["'Cormorant Garamond', serif", 'Cormorant (영문 명조)']];
  const fontKey = ff => { const m = String(ff || '').match(/['"]?([^,'"]+)/); const n = m ? m[1].trim() : ''; return FONTS.find(([f]) => f.includes(n))?.[0] || ''; };

  /* ============ 편집 화면에 입히기 ============ */
  const pathFor = (shape, W, H, inset, st) => (SHP[shape] || SHP.rect)(inset, inset, W - inset, H - inset, st);
  function decorateFrame(fr, st) {
    const ph = fr.querySelector('.photo');
    fr.querySelectorAll(':scope > .pro-deco').forEach(n => n.remove());
    ph?.querySelectorAll(':scope > .pro-stroke').forEach(n => n.remove());
    if (ph) { ph.classList.remove('pro-masked'); ph.style.webkitMaskImage = ph.style.maskImage = ''; if (ph.dataset.proRad) { ph.style.borderRadius = ''; delete ph.dataset.proRad; } if (ph.dataset.proFill) { ph.style.backgroundColor = ''; delete ph.dataset.proFill; } }
    fr.style.filter = '';
    fr.classList.remove('pro-shaped');
    if (!st || !ph) return;
    const r = ph.getBoundingClientRect(), W = 1000, H = r.width && r.height ? Math.round(1000 * r.height / r.width) : 1000;
    const wMm = r.width ? r.width / pxmm() : 50;
    let shape = st.shape && st.shape !== 'none' ? st.shape : null;
    if (+st.rad > 0 && (!shape || shape === 'rect')) { shape = 'rrect'; st = { ...st, _r: +st.rad / wMm * W }; }      // 모퉁이 둥글게 (mm)
    if (st.fill) { ph.style.backgroundColor = st.fill; ph.dataset.proFill = '1'; }      // 채우기: 사진 뒤 · 빈 틀의 바탕색
    if (shape && shape !== 'rect') fr.classList.add('pro-shaped');      // 흰 사진 카드 모양(.sy-ph)은 빼고 모양대로만
    if (shape && shape !== 'rect') {
      const url = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${pathFor(shape, W, H, 0, st)}"/></svg>`);
      ph.classList.add('pro-masked');
      ph.style.webkitMaskImage = ph.style.maskImage = url;
    } else if (shape === 'rect') { ph.style.borderRadius = '0'; ph.dataset.proRad = '1'; }
    if (+st.sw > 0) {
      const sw = +st.sw / wMm * W, kind = shape || (getComputedStyle(ph).borderRadius.startsWith('50%') ? 'ellipse' : 'rect');
      ph.insertAdjacentHTML('beforeend', `<svg class="pro-stroke" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${pathFor(kind, W, H, sw / 2, st)}" fill="none" stroke="${esc(st.sc || '#ffffff')}" stroke-width="${r1(sw)}" stroke-linejoin="round"/></svg>`);
    }
    const shd = { s: [.25, .6, .12], m: [.5, 1.2, .2], l: [.9, 2.2, .3] }[st.shadow];
    if (shd) fr.style.filter = `drop-shadow(0 ${shd[0]}cqw ${shd[1]}cqw rgba(40,30,20,${shd[2]}))`;
    if (st.deco && DECO[st.deco]) {
      const svg = cls => `<svg class="${cls}" viewBox="0 0 100 100">${DECO[st.deco].d()}</svg>`;
      fr.insertAdjacentHTML('beforeend', `<div class="pro-deco">${svg('tl')}${svg('tr')}${svg('bl')}${svg('br')}</div>`);
      if (getComputedStyle(fr).position === 'static') fr.style.position = 'relative';
    }
  }
  function drawShape(fr, x) {
    const ph = fr.querySelector('.photo'), st = x.st || {};
    if (!ph) return;
    ph.querySelectorAll(':scope > .pro-shape-svg').forEach(n => n.remove());
    const r = ph.getBoundingClientRect(), W = 1000, H = r.width && r.height ? Math.round(1000 * r.height / r.width) : 1000;
    const wMm = r.width ? r.width / pxmm() : 50, sw = (+st.sw || 0) / wMm * W;
    let inner;
    if (st.illu) inner = `<svg viewBox="0 0 100 100" width="${W}" height="${H}" preserveAspectRatio="xMidYMid meet" overflow="visible">${illuSvg(st.illu, st.cols)}</svg>`;
    else if (LINES[st.kind]) inner = `<path d="${LINES[st.kind](W, H)}" fill="none" stroke="${esc(st.stroke || '#8E7A62')}" stroke-width="${r1(Math.max(sw, 2))}" stroke-linecap="round"/>`;
    else inner = `<path d="${pathFor(st.kind || 'rect', W, H, sw / 2)}" fill="${esc(st.fill || 'none')}" fill-opacity="${st.fo ?? 1}" stroke="${sw > 0 ? esc(st.stroke || '#8E7A62') : 'none'}" stroke-width="${r1(sw)}" stroke-linejoin="round"/>`;
    ph.insertAdjacentHTML('beforeend', `<svg class="pro-shape-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" overflow="visible">${inner}</svg>`);
    const shd = { s: [.25, .6, .12], m: [.5, 1.2, .2], l: [.9, 2.2, .3] }[st.shadow];
    fr.style.filter = shd ? `drop-shadow(0 ${shd[0]}cqw ${shd[1]}cqw rgba(40,30,20,${shd[2]}))` : '';
  }
  const adjFilter = a => {
    if (!a) return '';
    const p = [];
    if (a.br) p.push(`brightness(${r2(1 + a.br / 200)})`);
    if (a.ct) p.push(`contrast(${r2(1 + a.ct / 200)})`);
    if (a.sa) p.push(`saturate(${r2(Math.max(0, 1 + a.sa / 100))})`);
    if (a.tp > 0) p.push(`sepia(${r2(a.tp / 260)})`, `saturate(${r2(1 + a.tp / 500)})`);
    if (a.tp < 0) p.push(`sepia(${r2(-a.tp / 300)})`, `hue-rotate(185deg)`, `saturate(${r2(1 - a.tp / 400)})`);
    if (a.bw) p.push('grayscale(1)');
    return p.join(' ');
  };
  function bgCss(r) {
    const c = [r.c1 || '#ffffff', r.c2 || '#e8e0d4'];
    switch (r.t) {
      case 'solid': return `background:${c[0]}`;
      case 'grad': return `background:linear-gradient(${r.ang ?? 180}deg, ${c[0]}, ${c[1]})`;
      case 'radial': return `background:radial-gradient(ellipse at 50% 40%, ${c[0]}, ${c[1]})`;
      case 'tex': return `background:${(TEX[r.tex] || TEX.paper).f(c)}`;
      case 'img': { const p = photos[r.img]; return p ? `background:url("${p.url}") center/cover no-repeat ${c[0]}` : ''; }
      default: return '';
    }
  }
  const bgData = () => (S.proBg ||= {});
  function applyBackgrounds() {
    $$('#pages .pro-bg').forEach(n => n.remove());
    const d = S.proBg;
    if (!d) return;
    for (const [pid, r] of Object.entries(d)) {
      const css = bgCss(r);
      if (!css) continue;
      $$('#pages .page').filter(p => p.dataset.pid === pid || p.dataset.pid.startsWith(`${pid}~`)).forEach(p => {
        const tr = p.querySelector(':scope > .trim');
        if (!tr) return;
        tr.insertAdjacentHTML('beforebegin', `<div class="pro-bg" style="opacity:${r.op ?? 1}"><i class="${r.half || ''}" style="${esc(css)}"></i></div>`);
      });
    }
  }
  function proApply() {
    const d = S.frameEdits;
    if (d) {
      for (const [id, b] of Object.entries(d.over || {})) {
        if (!b.st && !b.off) continue;
        const cut = id.indexOf('|'), fr = frameElOf(id.slice(0, cut), id.slice(cut + 1));
        if (!fr) continue;
        decorateFrame(fr, b.st);
        fr.classList.toggle('pro-off', !!b.off);
        fr.style.opacity = b.st?.op != null && b.st.op < 1 ? b.st.op : '';
      }
      for (const x of d.extra || []) {
        const fr = frameElOf(x.pid, `fx-${x.id}`);
        if (!fr) continue;
        if (/\bx-shape\b/.test(x.cls)) drawShape(fr, x); else if (x.st) decorateFrame(fr, x.st);
        fr.classList.toggle('pro-off', !!x.off);
        fr.style.opacity = x.st?.op != null && x.st.op < 1 ? x.st.op : '';
      }
      for (const [id, b] of Object.entries(d.text || {})) {
        if (b.off == null) continue;
        const cut = id.indexOf('|'), el = textElOf(id.slice(0, cut), id.slice(cut + 1));
        el?.classList.toggle('pro-off', !!b.off);
      }
      $$('#pages .photo[data-photo]').forEach(ph => { const f = adjFilter(d.adj?.[ph.dataset.photo]); if (ph.style.filter !== f) ph.style.filter = f; });
    }
    applyBackgrounds();
  }
  window.proApply = proApply;

  /* 기존 함수 뒤에 이어 붙이기 (전역 함수를 감쌈 → album.js 안의 호출도 이 쪽을 지남) */
  const after = (name, fn) => { const o = window[name]; if (typeof o !== 'function') return; window[name] = function (...a) { const r = o.apply(this, a); try { fn(r, a); } catch (e) { console.warn('[PRO]', name, e); } return r; }; };
  let applyTimer = 0;
  const applySoon = () => { clearTimeout(applyTimer); applyTimer = setTimeout(proApply, 60); };
  after('render', () => { proApply(); refreshAll(); });
  after('applyFrames', applySoon);
  after('applyTextFrames', applySoon);
  after('setViewZoom', () => { zoomLabel(); applySoon(); });
  let selSig = '';
  after('syncFrameSel', () => {
    const sig = frameMulti.length > 1 ? `m${frameMulti.map(s => s.key).join(',')}` : frameSel ? `${frameSel.kind || 'f'}|${frameSel.pid}|${frameSel.key}` : '';
    if (sig !== selSig) { selSig = sig; refreshSoon(); }
  });
  /* 그룹: 묶은 틀 하나를 누르면 그룹 전체가 골라짐 */
  after('frameClick', (_, [, , shift]) => {
    if (shift || !frameSel || frameSel.kind === 'text') return;
    const g = layerRec('frame', frameSel.pid, frameSel.key)?.grp;
    if (!g) return;
    const list = [];
    for (const [id, b] of Object.entries(S.frameEdits?.over || {})) if (b.grp === g) { const cut = id.indexOf('|'); list.push({ pid: id.slice(0, cut), key: id.slice(cut + 1) }); }
    for (const x of S.frameEdits?.extra || []) if (x.grp === g) list.push({ pid: x.pid, key: `fx-${x.id}` });
    if (list.length > 1) { frameMulti = []; setFrameMulti(list); note(`그룹 (${list.length}개)을 골랐습니다. 하나만 고치려면 Shift+클릭으로 빼거나 그룹을 푸세요.`); }
  });

  /* ============ 틀 위치 · 크기 바꾸기 ============ */
  function boxOf(s) { return frameBox(s.el); }
  function putBox(s, nb) {
    if (s.kind === 'text') {
      const cur = textOver()[s.id], b = cur?.x != null ? cur : { ...frameBox(s.el), ...(cur || {}) };
      if (!b.font) b.font = captureFont(s.el);
      Object.assign(b, nb);
      textOver()[s.id] = b;
      placeText(s.el, b);
      return;
    }
    if (s.x) { Object.assign(s.x, nb); setFrameStyle(s.el, s.x); }
    else { const m = frameData().over, b = { ...(m[s.id] || {}), ...frameBox(s.el), ...nb }; m[s.id] = b; placeFrame(s.el, b); }
    applyKey(s.key);
  }
  const itemOf = ({ pid, key, kind }) => {
    if (kind === 'text') { const el = textElOf(pid, key); return el && { kind: 'text', pid, key, el, id: `${pid}|${key}` }; }
    const el = frameElOf(pid, key), x = frameExtra(key);
    return el && { kind: 'frame', pid, key, el, x, id: `${pid}|${key}` };
  };
  function commitGeom(msg) { saveState(); proApply(); syncFrameSel(); refreshAll(); if (msg) note(msg); }
  function align(how) {
    const s = sel();
    if (!s) { note('정렬할 틀을 먼저 고르세요. 여러 개는 Shift+클릭이나 빈 곳에서 끌어 고릅니다.'); return; }
    const items = (s.kind === 'multi' ? s.list.map(itemOf) : [s]).filter(Boolean).filter(it => !frameLocked(it.pid, it.key, it.kind));
    if (!items.length) { note('잠긴 틀은 옮길 수 없습니다.'); return; }
    const boxes = items.map(boxOf);
    const toPage = items.length === 1 || alignTo() === 'page' || new Set(items.map(i => i.pid)).size > 1;
    const ref = toPage ? { x: 0, y: 0, w: 100, h: trimAsp(items[0].el) } : (() => { const x = Math.min(...boxes.map(b => b.x)), y = Math.min(...boxes.map(b => b.y)); return { x, y, w: Math.max(...boxes.map(b => b.x + b.w)) - x, h: Math.max(...boxes.map(b => b.y + b.h)) - y }; })();
    if (/^d-[lcrtmb]$/.test(how)) {      // 개체 분포: 고른 틀의 왼쪽(가운데 · 오른쪽 · 위 …) 끝을 같은 간격으로
      if (items.length < 3) { note('분포는 틀 3개 이상을 고르세요.'); return; }
      const e = how[2], hz = 'lcr'.includes(e), f = { l: 0, c: .5, r: 1, t: 0, m: .5, b: 1 }[e];
      const pos = b => (hz ? b.x + b.w * f : b.y + b.h * f);
      const ord = items.map((it, i) => ({ it, b: boxes[i] })).sort((a, z) => pos(a.b) - pos(z.b));
      const p0 = pos(ord[0].b), step = (pos(ord.at(-1).b) - p0) / (ord.length - 1);
      ord.forEach((o, i) => putBox(o.it, hz ? { x: p0 + step * i - o.b.w * f } : { y: p0 + step * i - o.b.h * f }));
      commitGeom('같은 간격으로 분포했습니다. Ctrl+Z로 되돌립니다.');
      return;
    }
    if ((how === 'dh' || how === 'dv') && ls.get(GAPON_KEY, '0') === '1') {      // 분포 간격: 정한 간격(mm)으로 차례로 붙임
      if (items.length < 2) { note('틀 2개 이상을 고르세요.'); return; }
      const hz = how === 'dh', k = trimMm(items[0].el) / 100, gap = (+ls.get(GAP_KEY, '4') || 0) / k;
      const ord = items.map((it, i) => ({ it, b: boxes[i] })).sort((a, z) => (hz ? a.b.x - z.b.x : a.b.y - z.b.y));
      let at = hz ? ord[0].b.x : ord[0].b.y;
      for (const o of ord) { putBox(o.it, hz ? { x: at } : { y: at }); at += (hz ? o.b.w : o.b.h) + gap; }
      commitGeom(`간격 ${ls.get(GAP_KEY, '4')}mm로 맞췄습니다. Ctrl+Z로 되돌립니다.`);
      return;
    }
    if (how === 'dh' || how === 'dv') {
      if (items.length < 3) { note('간격 맞추기는 틀 3개 이상을 고르세요.'); return; }
      const hz = how === 'dh', ord = items.map((it, i) => ({ it, b: boxes[i] })).sort((a, b) => (hz ? a.b.x - b.b.x : a.b.y - b.b.y));
      const total = ord.reduce((t, o) => t + (hz ? o.b.w : o.b.h), 0), span = hz ? ref.w : ref.h, gap = (span - total) / (ord.length - 1);
      let at = hz ? ref.x : ref.y;
      for (const o of ord) { putBox(o.it, hz ? { x: at } : { y: at }); at += (hz ? o.b.w : o.b.h) + gap; }
    } else if (how === 'sw' || how === 'sh') {
      const b0 = boxes[0];
      items.forEach((it, i) => i && putBox(it, how === 'sw' ? { w: b0.w } : { h: b0.h }));
    } else {
      items.forEach((it, i) => {
        const b = boxes[i];
        putBox(it, { l: { x: ref.x }, c: { x: ref.x + (ref.w - b.w) / 2 }, r: { x: ref.x + ref.w - b.w }, t: { y: ref.y }, m: { y: ref.y + (ref.h - b.h) / 2 }, b: { y: ref.y + ref.h - b.h } }[how]);
      });
    }
    commitGeom(toPage ? '쪽(재단선) 기준으로 맞췄습니다. Ctrl+Z로 되돌립니다.' : '고른 틀끼리 맞췄습니다. Ctrl+Z로 되돌립니다.');
  }
  async function duplicate() {
    const s = sel();
    if (!s || s.kind === 'multi') { note('복제할 틀을 하나 고르세요.'); return; }
    if (s.kind === 'text') { copyTextFrame(); pasteTextFrame(); return; }
    const fd = frameData(), id = fd.next++, nk = `fx-${id}`;
    const src = s.x ? clone(s.x) : { cls: [...s.el.classList].filter(c => !/^(fr-|x-frame|pro-)/.test(c)).join(' '), ...frameBox(s.el), st: clone(layerRec('frame', s.pid, s.key)?.st || null) };
    Object.assign(src, { id, pid: s.pid, x: src.x + 3, y: src.y + 3 });
    delete src.lock; delete src.grp; delete src.z; if (!src.st) delete src.st;
    fd.extra.push(src);
    const p = photos[s.key];
    if (p) { photos[nk] = { ...p, url: URL.createObjectURL(p.blob) }; await DB.put(nk, recOf(photos[nk])); }
    if (fd.adj?.[s.key]) fd.adj[nk] = clone(fd.adj[s.key]);
    saveState(); applyFrames();
    frameMulti = []; frameSel = { key: nk, pid: s.pid };
    applyKey(nk); proApply(); syncFrameSel(); window.pagePanelSoon?.();
    note('복제했습니다. 사진 · 모양 · 테두리가 함께 복사됩니다.');
  }
  function groupSel(on) {
    const s = sel();
    if (on) {
      if (s?.kind !== 'multi') { note('묶을 틀을 Shift+클릭으로 2개 이상 고르세요.'); return; }
      const g = `g${Date.now().toString(36)}`;
      s.list.forEach(it => { layerRec('frame', it.pid, it.key, true).grp = g; });
      saveState(); note(`틀 ${s.list.length}개를 그룹으로 묶었습니다. 하나를 누르면 함께 골라집니다.`);
    } else {
      const list = s?.kind === 'multi' ? s.list : s ? [s] : [];
      let n = 0;
      const gs = new Set(list.map(it => layerRec('frame', it.pid, it.key)?.grp).filter(Boolean));
      for (const b of [...Object.values(S.frameEdits?.over || {}), ...(S.frameEdits?.extra || [])]) if (gs.has(b.grp)) { delete b.grp; n++; }
      saveState(); note(n ? '그룹을 풀었습니다.' : '고른 틀은 그룹이 아닙니다.');
    }
    refreshAll();
  }

  /* ============ 새 개체 (모양 틀 · 도형 · 일러스트) ============ */
  function needPage() {
    const pid = curPid();
    if (!pid || !document.querySelector(`#pages ${PG(CSS.escape(pid))}`)) { note('넣을 쪽(또는 앞 · 뒤표지)을 먼저 한 번 누르세요.'); return null; }
    return pid;
  }
  function addExtra(rec, msg) {
    const pid = needPage();
    if (!pid) return;
    const fd = frameData(), id = fd.next++;
    const el = document.querySelector(`#pages ${PG(CSS.escape(pid))}`), asp = trimAsp(el?.querySelector('.trim'));
    const w = rec.w ?? 40, h = rec.h ?? 30;
    fd.extra.push({ id, pid, x: r1((100 - w) / 2), y: r1((asp - h) / 2), w, h, ...rec });
    saveState(); applyFrames();
    frameMulti = []; frameSel = { key: `fx-${id}`, pid }; framePage = pid;
    proApply(); syncFrameSel(); window.pagePanelSoon?.();
    note(msg);
  }
  const addShape = k => addExtra(LINES[k] ? { cls: 'x-shape', w: 50, h: k === 'linev' ? 40 : k === 'lineh' ? 3 : 25, st: { kind: k, stroke: '#8E7A62', sw: .6 } } : { cls: 'x-shape', w: 34, h: k === 'rect' || k === 'round' ? 24 : 34, st: { kind: k, fill: '#E9CDBE', stroke: '#8E7A62', sw: 0 } }, `${LINE_LABEL[k] || SHAPE_LABEL[k]}을(를) 넣었습니다. 손잡이로 크기를 바꾸고, 오른쪽 속성에서 색을 고르세요.`);
  const addIllu = k => addExtra({ cls: 'x-shape x-illu', w: 22, h: 22, st: { illu: k, cols: ILLU[k].c.slice() } }, `${ILLU[k].n} 일러스트를 넣었습니다. 오른쪽 속성에서 색을 바꿀 수 있습니다.`);
  function setFrameShape(k) {
    const s = sel();
    const list = s?.kind === 'multi' ? s.list.map(itemOf).filter(Boolean) : s && s.kind === 'frame' ? [s] : [];
    if (s?.kind === 'shape') { stOf(s).kind = k; saveState(); proApply(); refreshAll(); return; }
    if (!list.length) { addExtra({ cls: 'sy-ph', w: 40, h: k === 'rect' || k === 'round' ? 30 : 40, st: { shape: k } }, `${SHAPE_LABEL[k]} 사진틀을 넣었습니다. 두 번 눌러 사진을 넣으세요.`); return; }
    list.forEach(it => { const st = (recOfSel(it).st ||= {}); st.shape = k; });
    saveState(); proApply(); refreshAll();
    note(`사진틀 모양을 '${SHAPE_LABEL[k]}'(으)로 바꿨습니다. 사진은 그대로입니다.`);
  }
  function setFrameStyle2(fn, msg) {
    const s = sel();
    const list = s?.kind === 'multi' ? s.list.map(itemOf).filter(Boolean) : s && (s.kind === 'frame' || s.kind === 'shape') ? [s] : [];
    if (!list.length) { note('사진틀을 먼저 고르세요.'); return false; }
    list.forEach(it => fn((recOfSel(it).st ||= {}), it));
    saveState(); proApply();
    if (msg) note(msg);
    return true;
  }

  /* 자유형 사진틀: 쪽 위를 눌러 꼭짓점을 찍음 */
  let polyMode = false, polyD = null;
  function polyStart() {
    polyMode = true; polyD = null;
    window.setDrawFrameTool?.(null);
    body.classList.add('pro-polying');
    note('자유형 사진틀: 쪽 위를 차례로 눌러 꼭짓점을 찍으세요. 첫 점을 다시 누르거나 Enter · 두 번 누르기로 끝냅니다. Esc 취소');
  }
  function polyStop() { polyMode = false; polyD?.svg.remove(); polyD = null; body.classList.remove('pro-polying'); }
  function polyDraw(cur) {
    if (!polyD) return;
    const pts = [...polyD.pts, ...(cur ? [cur] : [])];
    polyD.svg.innerHTML = `<polyline points="${pts.map(p => `${r2(p.x)},${r2(p.y)}`).join(' ')}" fill="rgba(47,125,225,.12)" stroke="#2f7de1" stroke-width=".35" stroke-dasharray="1 .6"/>` + polyD.pts.map((p, i) => `<circle cx="${r2(p.x)}" cy="${r2(p.y)}" r="${i ? .6 : 1}" fill="${i ? '#2f7de1' : '#e0457b'}"/>`).join('');
  }
  function polyFinish() {
    const d = polyD;
    polyStop();
    if (!d || d.pts.length < 3) { note('점이 3개 이상이어야 합니다.'); return; }
    const xs = d.pts.map(p => p.x), ys = d.pts.map(p => p.y), x = Math.min(...xs), y = Math.min(...ys), w = Math.max(...xs) - x, h = Math.max(...ys) - y;
    if (w < FRAME_MIN || h < FRAME_MIN) { note('너무 작습니다. 다시 그려 주세요.'); return; }
    const fd = frameData(), id = fd.next++;
    fd.extra.push({ id, pid: d.pid, cls: 'sy-ph', x: r1(x), y: r1(y), w: r1(w), h: r1(h), st: { shape: 'poly', pts: d.pts.map(p => [r2((p.x - x) / w), r2((p.y - y) / h)]) } });
    saveState(); applyFrames();
    frameMulti = []; frameSel = { key: `fx-${id}`, pid: d.pid }; framePage = d.pid;
    proApply(); syncFrameSel(); window.pagePanelSoon?.();
    note('자유형 사진틀을 만들었습니다. 두 번 눌러 사진을 넣으세요.');
  }
  addEventListener('pointerdown', e => {
    if (e.target.closest?.('#pro-top,#pro-rail,#pro-fly,#pro-props,#pro-menu')) { e.stopPropagation(); return; }     // 패널을 눌러도 고른 틀이 풀리지 않게
    if (!polyMode || e.button !== 0) return;
    const face = e.target.closest?.(PAGE_SEL), tr = face?.querySelector('.trim');
    if (!face || !tr) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const q = tr.getBoundingClientRect(), cq = q.width / 100, p = { x: (e.clientX - q.left) / cq, y: (e.clientY - q.top) / cq };
    if (!polyD || polyD.tr !== tr) {
      polyD?.svg.remove();
      tr.insertAdjacentHTML('beforeend', `<svg class="pro-poly" viewBox="0 0 100 ${r2(q.height / cq)}" preserveAspectRatio="none"></svg>`);
      polyD = { tr, pid: face.dataset.pid, pts: [], svg: tr.lastElementChild, cq, q };
    }
    const last = polyD.pts.at(-1), first = polyD.pts[0];
    if (polyD.pts.length >= 3 && Math.hypot(p.x - first.x, p.y - first.y) < 2) { polyFinish(); return; }
    if (last && Math.hypot(p.x - last.x, p.y - last.y) < .8) { if (polyD.pts.length >= 3) polyFinish(); return; }   // 두 번 누르기
    polyD.pts.push(p);
    polyDraw();
  }, true);
  addEventListener('pointermove', e => { if (!polyD) return; const q = polyD.tr.getBoundingClientRect(), cq = q.width / 100; polyDraw({ x: (e.clientX - q.left) / cq, y: (e.clientY - q.top) / cq }); });
  addEventListener('keydown', e => {
    if (!polyMode) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); polyStop(); note('자유형 그리기를 취소했습니다.'); }
    else if (e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); polyFinish(); }
  }, true);
  // 도형 · 일러스트는 사진을 넣는 틀이 아니므로 두 번 눌러도 사진 고르기 창이 뜨지 않게
  addEventListener('dblclick', e => { if (e.target.closest?.('#pages .x-shape')) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  addEventListener('drop', e => { if (e.target.closest?.('#pages .x-shape')) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);

  /* ============ 글자 ============ */
  function textB(s) {
    const cur = textOver()[s.id], b = cur?.x != null ? cur : { ...frameBox(s.el), ...(cur || {}) };
    if (!b.font) b.font = captureFont(s.el);
    return b;
  }
  function setText(fn) {
    const s = sel();
    if (s?.kind !== 'text') { note('글자를 먼저 누르세요.'); return; }
    if (selLocked()) { note('잠긴 글자틀입니다. Ctrl+L로 풀고 고치세요.'); return; }
    const b = textB(s);
    fn(b.font, b, s);
    textOver()[s.id] = b;
    placeText(s.el, b);
    saveState(); syncFrameSel();
  }
  const ptOf = (fs, el) => fs * trimMm(el) / 100 / .35278;
  const fsOf = (pt, el) => pt * .35278 * 100 / trimMm(el);

  /* ============ 색 넣기 (고른 개체에 바로) ============ */
  function applyColor(c, how = 'auto') {
    c = toHex(c);
    pushRecent(c);
    const s = sel();
    if (how === 'bg' || !s) { setBg({ t: 'solid', c1: c }, 'page'); return; }
    if (s.kind === 'text') { setText(f => { f.color = c; }); note(`글자색 ${c}`); }
    else if (s.kind === 'shape') {
      setFrameStyle2(st => { if (st.illu) { st.cols = [c, ...(st.cols || ILLU[st.illu].c).slice(1)]; } else if (LINES[st.kind] || how === 'stroke') { st.stroke = c; if (!+st.sw) st.sw = .6; } else st.fill = c; }, `도형 색 ${c}`);
    } else setFrameStyle2(st => { st.sc = c; if (!+st.sw) st.sw = 1; }, `사진틀 테두리 ${c}`);
    refreshAll();
  }
  async function eyedrop() {
    if (!window.EyeDropper) { note('이 브라우저는 스포이드를 지원하지 않습니다. Edge · Chrome 최신판에서 쓰세요.'); return; }
    try { const r = await new EyeDropper().open(); applyColor(r.sRGBHex); } catch { /* 취소 */ }
  }
  let photoCols = [];
  async function colorsFromPhoto() {
    const s = sel(), p = s && photos[s.key];
    if (!p) { note('색을 뽑을 사진틀(사진이 든 틀)을 고르세요.'); return; }
    const img = new Image();
    img.src = photoSrc(p);      // 색 뽑기는 미리보기로 충분 (빠름)
    await img.decode().catch(() => {});
    const cv = document.createElement('canvas'), n = 64;
    cv.width = n; cv.height = Math.max(1, Math.round(n * p.h / p.w));
    const cx = cv.getContext('2d');
    cx.drawImage(img, 0, 0, cv.width, cv.height);
    const px = cx.getImageData(0, 0, cv.width, cv.height).data, bins = new Map();
    for (let i = 0; i < px.length; i += 4) { const k = (px[i] >> 5) << 6 | (px[i + 1] >> 5) << 3 | (px[i + 2] >> 5); const b = bins.get(k) || [0, 0, 0, 0]; b[0] += px[i]; b[1] += px[i + 1]; b[2] += px[i + 2]; b[3]++; bins.set(k, b); }
    photoCols = [...bins.values()].sort((a, b) => b[3] - a[3]).slice(0, 8).map(b => toHex(`rgb(${b[0] / b[3]},${b[1] / b[3]},${b[2] / b[3]})`));
    refreshAll();
    note('사진에서 많이 쓰인 색 8가지를 뽑았습니다. 눌러서 쓰세요.');
  }

  /* ============ 배경 ============ */
  let bgDraft = { t: 'grad', c1: '#FDF6EE', c2: '#F3D9CF', ang: 180, tex: 'paper', op: 1 };
  function setBg(rec, scope = 'page') {
    const pid = curPid(), page = pageEl(pid);
    if (!page && scope !== 'all') { note('배경을 바꿀 쪽을 먼저 누르세요. (표지 전개도는 표지 템플릿으로 바꿉니다)'); return; }
    const d = bgData();
    if (scope === 'all') { $$('#pages .page').filter(p => !p.dataset.pid.includes('~')).forEach(p => { d[p.dataset.pid] = { ...rec }; delete d[p.dataset.pid].half; }); }
    else if (scope === 'spread') {
      const pair = $$('.page', page.closest('.spread')).filter(p => !p.dataset.pid.includes('~'));
      pair.forEach((p, i) => { d[p.dataset.pid] = { ...rec, half: pair.length > 1 ? (i ? 'R' : 'L') : undefined }; });
    } else { d[pid] = { ...rec }; delete d[pid].half; }
    saveState(); applyBackgrounds(); window.pagePanelSoon?.();
    note(scope === 'all' ? '모든 쪽의 배경을 바꿨습니다. Ctrl+Z로 되돌립니다.' : scope === 'spread' ? '펼침면 두 쪽에 이어지는 배경을 넣었습니다.' : `${pidLabel(pid)} 배경을 바꿨습니다.`);
  }
  function clearBg(scope) {
    const pid = curPid(), page = pageEl(pid), d = bgData();
    if (scope === 'all') S.proBg = {};
    else if (page) $$('.page', scope === 'spread' ? page.closest('.spread') : page.parentElement).forEach(p => delete d[p.dataset.pid]);
    saveState(); applyBackgrounds(); note('원래 테마 배경으로 돌렸습니다.');
  }
  async function bgImage(file, scope) {
    const pid = curPid(), page = pageEl(pid);
    if (!page || !file) { note('배경 사진을 넣을 쪽을 먼저 누르세요.'); return; }
    const key = `pbg-${pid}`;
    await setPhoto(key, file);
    setBg({ t: 'img', img: key, c1: '#ffffff', op: bgDraft.op }, scope);
  }

  /* ============ 페이지 ============ */
  async function dupPage() {
    const pid = curPid();
    if (!pageEl(pid)) { note('복제할 쪽을 아래 썸네일이나 편집 화면에서 먼저 누르세요.'); return; }
    const pd = pgData(), nid = pd.next++, npid = `free-${nid}`;
    pd.extra.push({ id: nid, after: pid });
    const fd = frameData();
    for (const x of [...(fd.extra || [])].filter(x => x.pid === pid)) {
      const id = fd.next++, nx = { ...clone(x), id, pid: npid };
      delete nx.lock; delete nx.grp;
      fd.extra.push(nx);
      const p = photos[`fx-${x.id}`];
      if (p) { photos[`fx-${id}`] = { ...p, url: URL.createObjectURL(p.blob) }; await DB.put(`fx-${id}`, recOf(photos[`fx-${id}`])); }
    }
    for (const x of [...(fd.xtext || [])].filter(x => x.pid === pid)) {
      const id = fd.next++, nk = `xt-${id}`;
      fd.xtext.push({ id, pid: npid });
      texts[nk] = texts[`xt-${x.id}`] ?? '';
      const tb = textOver()[`${pid}|xt-${x.id}`];
      if (tb) textOver()[`${npid}|${nk}`] = clone(tb);
    }
    if (S.proBg?.[pid]) { bgData()[npid] = { ...S.proBg[pid] }; delete bgData()[npid].half; }
    saveState(); render();
    window.pgSelect?.(npid, true); window.pagePanelSoon?.();
    note(/^free-/.test(pid) ? '쪽을 복제했습니다 (틀 · 사진 · 글자 · 배경 포함).' : '쪽을 복제했습니다. 기본 쪽은 직접 넣은 틀 · 글자 · 배경만 복사되고, 원래 들어 있던 명단 · 사진 칸은 새 쪽에 생기지 않습니다.');
  }
  function movePage(dir) {
    const pid = curPid(), pd = pgData();
    const x = pd.extra.find(e => `free-${e.id}` === pid);
    if (!x) { note('순서를 바꿀 수 있는 쪽은 [페이지 추가]로 만든 쪽입니다. 기본 쪽은 판 구성 순서를 따릅니다.'); return; }
    const pids = pgPages().map(p => p.dataset.pid), at = pids.indexOf(pid);
    if (dir < 0 && at <= 1) { note('더 앞으로 갈 수 없습니다.'); return; }
    if (dir > 0 && at >= pids.length - 1) { note('맨 뒤입니다.'); return; }
    const target = dir < 0 ? pids[at - 2] : pids[at + 1];
    x.after = target;
    pd.extra = pd.extra.filter(e => e !== x);
    const ti = pd.extra.findIndex(e => `free-${e.id}` === target);
    pd.extra.splice(ti < 0 ? 0 : ti + 1, 0, x);       // 다른 추가 쪽 뒤에 붙을 때는 그 쪽이 먼저 놓이도록
    saveState(); render();
    window.pgSelect?.(pid, true);
    note(dir < 0 ? '쪽을 한 칸 앞으로 옮겼습니다.' : '쪽을 한 칸 뒤로 옮겼습니다.');
  }

  /* ============ 인쇄 · 출력 검증 ============ */
  const targetPpi = () => +ls.get(PPI_KEY, '300') || 300;
  function setCustomSize(wMm, hMm) {
    if (!(wMm >= 50 && hMm >= 50 && wMm <= 1000 && hMm <= 1000)) { note('크기는 50~1000mm 사이로 넣으세요.'); return; }
    S.customW = r1(wMm); S.customH = r1(hMm);
    ensureCustom();
    S.size = 'custom';
    const f = document.getElementById('f-size'); if (f) f.value = 'custom';
    saveState(); render();
    note(`사용자 지정 판형 ${S.customW}×${S.customH}mm로 바꿨습니다.`);
  }
  function ensureCustom() {
    if (!(S.customW && S.customH)) return;
    SIZES.custom = { name: `사용자 지정 (${S.customW}×${S.customH}mm)`, w: +S.customW, h: +S.customH };
    const f = document.getElementById('f-size');
    if (f) { let o = f.querySelector('option[value="custom"]'); if (!o) { o = document.createElement('option'); o.value = 'custom'; f.append(o); } o.textContent = SIZES.custom.name; }
  }
  function setSize(k) {
    const f = document.getElementById('f-size');
    if (!SIZES[k] || !f) return;
    f.value = k;
    f.dispatchEvent(new Event('input', { bubbles: true }));
    setTimeout(refreshAll, 50);
  }
  function proxyCheck(id, on) { const el = document.getElementById(id); if (!el) return; el.checked = on; el.dispatchEvent(new Event('change', { bubbles: true })); el.dispatchEvent(new Event('input', { bubbles: true })); setTimeout(refreshAll, 50); }
  let checkResult = null;
  function preflight() {
    const tgt = targetPpi(), out = [];
    const faces = $$('#pages .page, #pages .wrap-face').filter(p => !p.dataset.pid?.includes('~'));
    let photosN = 0, low = 0, empty = 0;
    for (const face of faces) {
      const pid = face.dataset.pid, label = pidLabel(pid);
      for (const el of $$('.trim .photo[data-photo]', face)) {
        if (el.closest('.fr-hidden,.fr-ghost,.x-shape,.pro-off') || !el.offsetWidth) continue;
        const key = el.dataset.photo, rec = photos[key];
        if (!rec) { empty++; out.push({ lv: 'warn', t: `${label} 빈 사진틀`, pid, key }); continue; }
        photosN++;
        const rw = el.offsetWidth, rh = el.offsetHeight, sc = (el.classList.contains('contain') ? Math.min : Math.max)(rw / rec.w, rh / rec.h) * rec.z;
        const pg = face.closest('.page') || document.querySelector('#pages .page');
        const ppi = Math.round((pg.offsetWidth / G.pageMm * 25.4) / sc);
        if (ppi < tgt) { low++; out.push({ lv: ppi < 200 ? 'err' : 'warn', t: `${label} 사진 해상도 ${ppi}ppi (목표 ${tgt})`, pid, key }); }
      }
      for (const t of $$('.trim [contenteditable][data-key]', face)) {
        if (t.closest('.fr-hidden,.pro-off') || !t.offsetWidth) continue;
        if (t.scrollHeight > t.clientHeight + 3 && getComputedStyle(t).overflow !== 'visible') out.push({ lv: 'warn', t: `${label} 글자가 틀 밖으로 넘침: "${t.textContent.trim().slice(0, 14)}"`, pid, key: t.dataset.key, kind: 'text' });
        const tr = t.closest('.trim'), q = tr.getBoundingClientRect(), r = t.getBoundingClientRect(), m = 4 * pxmm();
        if (t.textContent.trim() && (r.left < q.left + m - 1 || r.right > q.right - m + 1 || r.top < q.top + m - 1 || r.bottom > q.bottom - m + 1)) out.push({ lv: 'warn', t: `${label} 글자가 안전영역(재단선 안 4mm) 밖: "${t.textContent.trim().slice(0, 14)}"`, pid, key: t.dataset.key, kind: 'text' });
      }
      for (const fr of $$('.trim > .fr-placed', face)) {
        const ph = fr.querySelector('.photo[data-photo]');
        if (!ph || fr.matches('.x-shape,.pro-off')) continue;
        const tr = fr.closest('.trim'), q = tr.getBoundingClientRect(), r = fr.getBoundingClientRect(), b = 3 * pxmm(), e = 1;
        const cross = side => (side === 'l' ? r.left < q.left - e && r.left > q.left - b + e : side === 'r' ? r.right > q.right + e && r.right < q.right + b - e : side === 't' ? r.top < q.top - e && r.top > q.top - b + e : r.bottom > q.bottom + e && r.bottom < q.bottom + b - e);
        if (['l', 'r', 't', 'b'].some(cross)) out.push({ lv: 'warn', t: `${label} 사진틀이 재단선을 넘었지만 도련(3mm) 끝까지 닿지 않음`, pid, key: ph.dataset.photo });
      }
    }
    const n = $$('#pages .page').filter(p => !p.dataset.pid.includes('~')).length;
    if (!S.bleed) out.unshift({ lv: 'err', t: '도련(재단 여백 3mm)이 꺼져 있습니다. 인쇄소 파일은 도련을 켜세요.' });
    if (n % 4) out.unshift({ lv: 'warn', t: `총 ${n}쪽: 제본은 4의 배수(${Math.ceil(n / 4) * 4}쪽)를 권장합니다.` });
    checkResult = { at: new Date(), out, photosN, low, empty, n, tgt };
    refreshAll();
    note(out.filter(o => o.lv === 'err').length ? '출력 검증: 고칠 곳이 있습니다. 목록을 눌러 그 자리로 가세요.' : '출력 검증을 마쳤습니다.');
  }
  function goIssue(o) {
    const face = o.pid && document.querySelector(`#pages ${PG(CSS.escape(o.pid))}`);
    if (!face) return;
    face.closest('.sheet, .wrap-block, .spread')?.scrollIntoView({ block: 'center', inline: 'center' });
    framePage = o.pid;
    if (o.key) { frameMulti = []; frameSel = o.kind === 'text' ? { kind: 'text', key: o.key, pid: o.pid } : { key: o.key, pid: o.pid }; }
    setTimeout(syncFrameSel, 300);
  }

  /* ============ 화면 만들기 ============ */
  const ICONS = {
    settings: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="#383838"/><circle cx="15" cy="12" r="2" fill="#383838"/><circle cx="8" cy="18" r="2" fill="#383838"/>',
    tpl: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/>',
    photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M3 17l5-5 4 4 3-3 6 6"/>',
    frame: '<rect x="3" y="4" width="11" height="9" rx="1"/><circle cx="16.5" cy="16" r="4.5"/><path d="M3 4l11 9M14 4L3 13"/>',
    bg: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15c4-3 7-3 10 0s5 2 8-1"/><path d="M3 10c4-3 7-3 10 0s5 2 8-1"/>',
    color: '<path d="M12 3a9 9 0 1 0 0 18c1.6 0 2-1 2-2s-1-1.6-1-2.6S14 15 15.5 15H18a3 3 0 0 0 3-3c0-5-4-9-9-9z"/><circle cx="7.5" cy="11" r="1.3"/><circle cx="10" cy="7" r="1.3"/><circle cx="15" cy="7.5" r="1.3"/>',
    text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
    shape: '<path d="M3 20L20 4"/><circle cx="7" cy="7" r="3.5"/><rect x="13" y="13" width="7" height="7"/>',
    illu: '<path d="M12 21c-4-3-8-6-8-11a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5-4 8-8 11z"/><path d="M12 9v12"/>',
    layer: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/><path d="M3 17l9 5 9-5" opacity=".6"/>',
    adjust: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16" /><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>',
    page: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="1.5"/><path d="M7 14h10v7H7z"/>',
  };
  const MENUS = [['tpl', '템플릿'], ['photo', '사진'], ['frame', '사진틀'], ['bg', '배경'], ['color', '색상'], ['text', '텍스트'], ['shape', '도형'], ['illu', '일러스트'], ['layer', '레이어'], ['adjust', '사진 보정'], ['page', '페이지'], ['print', '인쇄']];
  const MENU_NAME = Object.fromEntries([...MENUS, ['settings', '앨범 설정']]);
  let side = ls.get(SIDE_KEY, 'settings'), tplTab = 'elem', illuTab = 'spring';

  const B = (act, label, o = {}) => `<button type="button" class="pu-b${o.on ? ' on' : ''}${o.cls ? ` ${o.cls}` : ''}" data-act="${act}"${o.arg != null ? ` data-arg="${esc(o.arg)}"` : ''}${o.title ? ` title="${esc(o.title)}"` : ''}${o.dis ? ' disabled' : ''}>${label}</button>`;
  const SEC = (title, html) => `<section class="pu-sec">${title ? `<h4>${title}</h4>` : ''}${html}</section>`;
  const ROW = (...x) => `<div class="pu-row">${x.join('')}</div>`;
  const NUM = (set, label, val, o = {}) => `<label class="pu-num"><span>${label}</span><input type="number" data-set="${set}" value="${val}" step="${o.step ?? .1}"${o.min != null ? ` min="${o.min}"` : ''}${o.max != null ? ` max="${o.max}"` : ''}${o.dis ? ' disabled' : ''}>${o.u ? `<i>${o.u}</i>` : ''}</label>`;
  const RNG = (set, label, val, min, max, step = 1) => `<label class="pu-rng"><span>${label}</span><input type="range" data-set="${set}" min="${min}" max="${max}" step="${step}" value="${val}"><b>${val}</b></label>`;
  const COL = (set, label, val) => `<label class="pu-col"><span>${label}</span><input type="color" data-set="${set}" value="${toHex(val)}"></label>`;
  const SELECT = (set, label, val, opts) => `<label class="pu-sel"><span>${label}</span><select data-set="${set}">${opts.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(val) ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
  const CHK = (set, label, on) => `<label class="pu-chk"><input type="checkbox" data-set="${set}"${on ? ' checked' : ''}> ${label}</label>`;
  const HINT = t => `<p class="pu-hint">${t}</p>`;
  const SW = (cols, how = 'auto') => `<div class="pu-sw">${cols.map(c => `<button type="button" data-act="color" data-arg="${c}|${how}" title="${c}" style="background:${c}"></button>`).join('')}</div>`;
  const selName = s => (!s ? '선택 없음' : s.kind === 'multi' ? multiLabel(s.list) : s.kind === 'text' ? '글자틀' : s.kind === 'shape' ? (s.x.st?.illu ? `일러스트 · ${ILLU[s.x.st.illu]?.n || ''}` : `도형 · ${LINE_LABEL[s.x.st?.kind] || SHAPE_LABEL[s.x.st?.kind] || ''}`) : photos[s.key] ? '사진틀 (사진 있음)' : '사진틀 (비어 있음)');

  /* --- 공통 묶음 --- */
  function secPos(s) {
    if (!s || s.kind === 'multi') return '';
    const b = boxOf(s), k = trimMm(s.el) / 100, u = uLabel(), st = unit() === 'in' ? .01 : .5, lock = selLocked();
    return SEC(`위치 · 크기 (${u}, 재단선 기준)`, `<div class="pu-pos">${NUM('px', 'X', mmShow(b.x * k), { step: st, dis: lock })}${NUM('py', 'Y', mmShow(b.y * k), { step: st, dis: lock })}${NUM('pw', 'W', mmShow(b.w * k), { step: st, min: 1, dis: lock })}${NUM('ph', 'H', mmShow(b.h * k), { step: st, min: 1, dis: lock, })}</div>` +
      (lock ? '<p class="pu-warn">🔒 잠긴 개체입니다. 옮기기 · 크기 · 삭제가 막혀 있습니다.</p>' : ''));
  }
  function secArrange(s) {
    if (!s) return '';
    const multi = s.kind === 'multi', lock = !multi && selLocked();
    return SEC(multi ? `정렬 (고른 ${s.list.length}개끼리)` : '정렬 (쪽 기준)', ROW(B('align', '⇤ 왼쪽', { arg: 'l' }), B('align', '↔ 가운데', { arg: 'c' }), B('align', '⇥ 오른쪽', { arg: 'r' })) + ROW(B('align', '⤒ 위', { arg: 't' }), B('align', '↕ 가운데', { arg: 'm' }), B('align', '⤓ 아래', { arg: 'b' })) +
      (multi ? ROW(B('align', '가로 간격 같게', { arg: 'dh' }), B('align', '세로 간격 같게', { arg: 'dv' })) + ROW(B('align', '너비 같게', { arg: 'sw' }), B('align', '높이 같게', { arg: 'sh' })) : '')) +
      SEC('순서 · 잠금', ROW(B('layer', '맨 앞', { arg: 'front', dis: multi }), B('layer', '앞으로', { arg: 'fwd', dis: multi }), B('layer', '뒤로', { arg: 'back', dis: multi }), B('layer', '맨 뒤', { arg: 'rear', dis: multi })) +
        ROW(B('lock', lock ? '🔒 잠금 풀기' : '🔓 잠그기', { on: lock }), B('dup', '⧉ 복제', { dis: multi }), B('del', '삭제', { cls: 'danger', dis: lock || multi })) +
        (multi ? ROW(B('group', '그룹으로 묶기', { arg: '1' }), B('group', '그룹 풀기', { arg: '0' })) : (s.kind !== 'text' && layerRec('frame', s.pid, s.key)?.grp ? ROW(B('group', '그룹 풀기', { arg: '0' })) : '')));
  }
  /* --- 인디자인식 속성 묶음: 연결된 파일 · 변형 · 모양 · 정렬 · 프레임 맞춤 · 빠른 작업 --- */
  const IC = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${d}</svg>`;
  const IB = (act, arg, icon, title, o = {}) => `<button type="button" class="id-ib${o.on ? ' on' : ''}" data-act="${act}" data-arg="${esc(arg)}" title="${esc(title)}"${o.dis ? ' disabled' : ''}>${IC(icon)}</button>`;
  const ICONS_AL = {
    l: '<path d="M4 3v18"/><rect x="7" y="6" width="11" height="4"/><rect x="7" y="14" width="7" height="4"/>',
    c: '<path d="M12 3v18"/><rect x="6" y="6" width="12" height="4"/><rect x="8" y="14" width="8" height="4"/>',
    r: '<path d="M20 3v18"/><rect x="6" y="6" width="11" height="4"/><rect x="10" y="14" width="7" height="4"/>',
    t: '<path d="M3 4h18"/><rect x="6" y="7" width="4" height="11"/><rect x="14" y="7" width="4" height="7"/>',
    m: '<path d="M3 12h18"/><rect x="6" y="6" width="4" height="12"/><rect x="14" y="8" width="4" height="8"/>',
    b: '<path d="M3 20h18"/><rect x="6" y="6" width="4" height="11"/><rect x="14" y="10" width="4" height="7"/>',
  };
  const ICONS_DI = {
    't': '<path d="M3 5h18M3 12h18M3 19h18" opacity=".45"/><rect x="5" y="5" width="4" height="4"/><rect x="10" y="12" width="4" height="5"/><rect x="15" y="19" width="4" height="2"/>',
    'm': '<path d="M3 6h18M3 12h18M3 18h18" opacity=".45"/><rect x="5" y="4" width="4" height="4"/><rect x="10" y="10" width="4" height="4"/><rect x="15" y="16" width="4" height="4"/>',
    'b': '<path d="M3 5h18M3 12h18M3 19h18" opacity=".45"/><rect x="5" y="2" width="4" height="3"/><rect x="10" y="8" width="4" height="4"/><rect x="15" y="14" width="4" height="5"/>',
    'l': '<path d="M5 3v18M12 3v18M19 3v18" opacity=".45"/><rect x="5" y="5" width="4" height="4"/><rect x="12" y="10" width="5" height="4"/><rect x="19" y="15" width="2" height="4"/>',
    'c': '<path d="M6 3v18M12 3v18M18 3v18" opacity=".45"/><rect x="4" y="5" width="4" height="4"/><rect x="10" y="10" width="4" height="4"/><rect x="16" y="15" width="4" height="4"/>',
    'r': '<path d="M5 3v18M12 3v18M19 3v18" opacity=".45"/><rect x="2" y="5" width="3" height="4"/><rect x="8" y="10" width="4" height="4"/><rect x="14" y="15" width="5" height="4"/>',
  };
  const ICONS_FIT = {
    fill: '<rect x="4" y="5" width="16" height="14"/><rect x="2" y="3" width="20" height="18" stroke-dasharray="2 1.5" opacity=".6"/>',
    fit: '<rect x="3" y="3" width="18" height="18"/><rect x="3" y="7" width="18" height="10" fill="currentColor" opacity=".35" stroke="none"/>',
    frame: '<rect x="5" y="7" width="14" height="10" fill="currentColor" opacity=".35" stroke="none"/><path d="M5 7h14v10H5z"/><path d="M2 4l3 3M22 4l-3 3M2 20l3-3M22 20l-3-3"/>',
    center: '<rect x="3" y="3" width="18" height="18"/><circle cx="12" cy="12" r="3"/><path d="M12 6v3M12 15v3M6 12h3M15 12h3"/>',
    zin: '<circle cx="11" cy="11" r="6"/><path d="M15.5 15.5L20 20M8.5 11h5M11 8.5v5"/>',
    zout: '<circle cx="11" cy="11" r="6"/><path d="M15.5 15.5L20 20M8.5 11h5"/>',
  };
  const ICON_LINK = '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>';
  function secLinked(s) {
    if (s?.kind !== 'frame') return '';
    const p = photos[s.key], st = window.lkStatus?.(s.key) || 'embed';
    if (!p && st !== 'lost') return SEC('연결된 파일', HINT('빈 사진틀입니다.') + ROW(B('pick', '📂 사진 불러오기…', { cls: 'main' })));
    const path = window.lkPathOf?.(s.key);
    const ph = s.el.querySelector('.photo'), pg = s.el.closest('.page');
    let dpi = 0;
    if (p && ph && pg) { const rw = ph.offsetWidth || 1, rh = ph.offsetHeight || 1, k = (ph.classList.contains('contain') ? Math.min : Math.max)(rw / p.w, rh / p.h) * (p.z || 1); dpi = Math.round(pg.offsetWidth * 25.4 / (k * G.pageMm)); }
    const badge = { lost: '<b class="id-bad">⛔ 사진 유실</b>', missing: '<b class="id-bad">⛔ 원본 파일 없음</b>', modified: '<b class="id-warn">⚠ 원본 수정됨</b>', linked: '<b class="id-ok">🔗 원본 연결됨</b>', embed: '<b class="id-mute">▣ 앨범 안에만 있음</b>' }[st];
    const name = p?.nm || p?.blob?.name || '(이름 모름)';
    return SEC('연결된 파일', `<div class="id-file">${p ? `<img src="${esc(photoSrc(p))}" alt="">` : '<i></i>'}<div><div class="id-fname" title="${esc(path || name)}">${esc(name)}</div><div class="id-fmeta">${badge}</div>${p ? `<div class="id-fmeta">${p.w}×${p.h}px · ${(p.blob.size / 1048576).toFixed(1)}MB · <span class="${dpi && dpi < 200 ? 'id-warn' : ''}">${dpi}dpi</span></div>` : ''}</div></div>` +
      ROW(B('lk-open', '🔗 링크 창'), B('ow', 'Ps 열기', { arg: 'ps', dis: !p }), B('ow', '탐색기', { arg: 'explorer', dis: !p })));
  }
  function secTransform(s) {
    if (!s || s.kind === 'multi') return '';
    const b = boxOf(s), k = trimMm(s.el) / 100, u = uLabel(), stp = unit() === 'in' ? .01 : .5, lock = selLocked(), { fx, fy } = refF(), ratio = ls.get(RATIO_KEY, '0') === '1';
    const grid = ['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br'].map(p => `<button type="button" class="${refPt() === p ? 'on' : ''}" data-act="refpt" data-arg="${p}" title="기준점"></button>`).join('');
    return SEC(`변형 <small>(${u}, 재단선 기준)</small>`, `<div class="id-tf"><div class="id-ref">${grid}</div><div class="id-xywh">${NUM('tx', 'X', mmShow((b.x + b.w * fx) * k), { step: stp, dis: lock })}${NUM('tw', 'W', mmShow(b.w * k), { step: stp, min: 1, dis: lock })}${NUM('ty', 'Y', mmShow((b.y + b.h * fy) * k), { step: stp, dis: lock })}${NUM('th', 'H', mmShow(b.h * k), { step: stp, min: 1, dis: lock })}</div>` +
      `<button type="button" class="id-chain${ratio ? ' on' : ''}" data-act="ratio" title="${ratio ? '비율 고정 켜짐' : '비율 고정 꺼짐'} (W · H를 같은 비율로)">${IC(ratio ? ICON_LINK : '<path d="M10 14a4 4 0 0 0 5.7 0l1-1M14 10a4 4 0 0 0-5.7 0l-1 1"/><path d="M5 5l3 3M19 19l-3-3"/>')}</button></div>` +
      (lock ? '<p class="pu-warn">🔒 잠긴 개체입니다. 옮기기 · 크기 · 삭제가 막혀 있습니다.</p>' : ''));
  }
  function secLook(s) {
    if (s?.kind !== 'frame' && s?.kind !== 'multi') return '';
    const st = s.kind === 'frame' ? stPeek(s) : {}, pt = r1((+st.sw || 0) * 72 / 25.4);
    return SEC('모양', `<label class="pu-col"><span>채우기</span><input type="color" data-set="ffill" value="${toHex(st.fill || '#ffffff')}">${B('ffill-x', st.fill ? '없음으로' : '없음', { cls: 'sm', dis: !st.fill })}</label>` +
      `<div class="id-stroke"><label class="pu-num"><span>획</span><input type="number" data-set="fswpt" value="${pt}" step=".5" min="0" max="30"><i>pt</i></label><input type="color" data-set="fsc" value="${toHex(st.sc || '#ffffff')}" title="획 색"></div>` +
      NUM('frad', '모퉁이', r1(+st.rad || 0), { step: .5, min: 0, max: 100, u: 'mm' }) +
      RNG('fop', '불투명도', Math.round((st.op ?? 1) * 100), 0, 100) +
      SELECT('fshadow', '그림자', st.shadow || '', [['', '없음'], ['s', '약하게'], ['m', '보통'], ['l', '강하게']]));
  }
  function secAlignID(s) {
    if (!s) return '';
    const multi = s.kind === 'multi', to = multi ? alignTo() : 'page';
    const al = ['l', 'c', 'r', 't', 'm', 'b'].map(k => IB('align', k, ICONS_AL[k], { l: '왼쪽 가장자리 정렬', c: '수평 가운데 정렬', r: '오른쪽 가장자리 정렬', t: '위쪽 가장자리 정렬', m: '수직 가운데 정렬', b: '아래쪽 가장자리 정렬' }[k])).join('');
    const sel2 = `<select class="id-to" data-set="alignto"${multi ? '' : ' disabled'}><option value="sel"${to === 'sel' ? ' selected' : ''}>선택 영역에 정렬</option><option value="page"${to === 'page' ? ' selected' : ''}>쪽(재단선)에 정렬</option></select>`;
    let h = `<div class="id-al">${al}</div>${sel2}`;
    if (multi) {
      const gOn = ls.get(GAPON_KEY, '0') === '1';
      h += `<h5>개체 분포</h5><div class="id-al">${['t', 'm', 'b', 'l', 'c', 'r'].map(k => IB('align', `d-${k}`, ICONS_DI[k], { t: '위쪽 가장자리 분포', m: '수직 가운데 분포', b: '아래쪽 가장자리 분포', l: '왼쪽 가장자리 분포', c: '수평 가운데 분포', r: '오른쪽 가장자리 분포' }[k])).join('')}</div>` +
        `<h5>분포 간격</h5><div class="id-gap">${IB('align', 'dv', '<rect x="5" y="3" width="14" height="5"/><rect x="5" y="16" width="14" height="5"/><path d="M12 9.5v5M10 11l2-1.5 2 1.5M10 13l2 1.5 2-1.5"/>', '세로 간격 같게')}${IB('align', 'dh', '<rect x="3" y="5" width="5" height="14"/><rect x="16" y="5" width="5" height="14"/><path d="M9.5 12h5M11 10l-1.5 2 1.5 2M13 10l1.5 2-1.5 2"/>', '가로 간격 같게')}` +
        `<label class="pu-chk"><input type="checkbox" data-set="gapon"${gOn ? ' checked' : ''}> 간격 사용</label><label class="pu-num id-gapv"><input type="number" data-set="gapv" value="${esc(ls.get(GAP_KEY, '4'))}" step=".5" min="0"${gOn ? '' : ' disabled'}><i>mm</i></label></div>` +
        ROW(B('align', '너비 같게', { arg: 'sw' }), B('align', '높이 같게', { arg: 'sh' }));
    }
    return SEC(multi ? `정렬 <small>(${s.list.length}개)</small>` : '정렬 <small>(쪽 기준)</small>', h);
  }
  function secFitID(s) {
    if (s?.kind !== 'frame') return '';
    const has = !!photos[s.key];
    return SEC('프레임 맞춤', `<div class="id-al">${IB('fit', 'fill', ICONS_FIT.fill, '비율에 맞게 프레임 채우기 (Ctrl+Alt+Shift+C)', { dis: !has })}${IB('fit', 'fit', ICONS_FIT.fit, '비율에 맞게 내용 맞추기 · 사진 전체 보이기 (Ctrl+Alt+Shift+E)', { dis: !has })}${IB('fitframe', '', ICONS_FIT.frame, '내용에 프레임 맞추기 (틀을 사진 비율로)', { dis: !has || selLocked() })}${IB('pcenter', '', ICONS_FIT.center, '내용 가운데 배치', { dis: !has })}${IB('pzoom', '1', ICONS_FIT.zin, '사진 확대', { dis: !has })}${IB('pzoom', '0', ICONS_FIT.zout, '사진 축소', { dis: !has })}</div>` +
      HINT('사진 가운데를 누르고 화살표: 사진만 이동 · 가장자리를 누르고 화살표: 틀 이동'));
  }
  function secQuick(s) {
    if (!s) return '';
    const multi = s.kind === 'multi', lock = !multi && selLocked(), grp = !multi && s.kind !== 'text' && layerRec('frame', s.pid, s.key)?.grp;
    return SEC('빠른 작업', ROW(B('lock', lock ? '🔒 잠금 풀기' : '잠그기', { on: lock }), B('arr', '정렬 ▾', { dis: multi })) +
      `<div class="id-arr" hidden>${ROW(B('layer', '맨 앞', { arg: 'front' }), B('layer', '앞으로', { arg: 'fwd' }), B('layer', '뒤로', { arg: 'back' }), B('layer', '맨 뒤', { arg: 'rear' }))}</div>` +
      ROW(multi ? B('group', '그룹', { arg: '1' }) : grp ? B('group', '그룹 풀기', { arg: '0' }) : B('group', '그룹', { arg: '1', dis: true, title: 'Shift+클릭으로 여러 틀을 고른 뒤 묶습니다' }), s.kind === 'frame' || multi ? B('menu', '모양 변환', { arg: 'frame' }) : B('dup', '⧉ 복제')) +
      ROW((s.kind === 'frame' ? B('dup', '⧉ 복제') : ''), B('del', '삭제', { cls: 'danger', dis: lock || multi })));
  }
  function secPhoto(s) {
    if (s?.kind !== 'frame') return SEC('사진', HINT('사진틀을 누르면 여기서 사진을 넣고 맞춥니다. <b>두 번 누르면</b> 바로 사진 고르기 창이 열립니다.'));
    const has = !!photos[s.key];
    return SEC('사진', ROW(B('pick', has ? '사진 교체' : '사진 넣기', { cls: 'main' }), B('unphoto', '사진 빼기', { dis: !has })) +
      ROW(B('fit', '틀에 꽉 차게', { arg: 'fill', dis: !has, title: 'Ctrl+Alt+Shift+C' }), B('fit', '사진 전체 보이기', { arg: 'fit', dis: !has, title: 'Ctrl+Alt+Shift+E' })) +
      ROW(B('pzoom', '확대 +', { arg: '1', dis: !has }), B('pzoom', '축소 −', { arg: '0', dis: !has }), B('pcenter', '가운데', { dis: !has })) +
      ROW(B('prot', '↺ 왼쪽으로 90°', { arg: '-1', dis: !has }), B('prot', '↻ 오른쪽으로 90°', { arg: '1', dis: !has })) +
      ROW(B('pnudge', '←', { arg: '-5,0', cls: 'sm', dis: !has }), B('pnudge', '→', { arg: '5,0', cls: 'sm', dis: !has }), B('pnudge', '↑', { arg: '0,-5', cls: 'sm', dis: !has }), B('pnudge', '↓', { arg: '0,5', cls: 'sm', dis: !has }), B('room', '사진 편집실', { dis: !has })) +
      HINT('사진 비율은 항상 유지됩니다. 사진을 끌면 틀 안에서 위치가 바뀌고, 원본 파일은 바뀌지 않습니다.'));
  }
  function secFrameStyle(s) {
    const ok = s && (s.kind === 'frame' || s.kind === 'multi');
    const st = ok && s.kind === 'frame' ? stPeek(s) : {};
    const shapes = Object.keys(SHAPE_LABEL).filter(k => k !== 'poly');
    return SEC(ok ? '사진틀 모양' : '모양 틀 넣기 (누르면 지금 쪽에 새 틀)', `<div class="pu-grid">${shapes.map(k => `<button type="button" class="pu-tile${st.shape === k ? ' on' : ''}" data-act="fshape" data-arg="${k}">${shapeIcon(k)}${SHAPE_LABEL[k]}</button>`).join('')}<button type="button" class="pu-tile" data-act="poly">${shapeIcon('poly')}점 찍어 그리기</button></div>`) +
      (ok ? SEC('테두리 · 그림자', COL('fsc', '테두리 색', st.sc || '#ffffff') + NUM('fsw', '두께', st.sw || 0, { step: .25, min: 0, max: 10, u: 'mm' }) +
        SELECT('fshadow', '그림자', st.shadow || '', [['', '없음'], ['s', '약하게'], ['m', '보통'], ['l', '강하게']]) +
        ROW(B('fstyle-reset', '모양 · 테두리 원래대로'))) +
        SEC('계절별 프레임 장식', `<div class="pu-grid g3">${[['', '없음'], ...Object.entries(DECO).map(([k, v]) => [k, v.n])].map(([k, n]) => `<button type="button" class="pu-tile${(st.deco || '') === k ? ' on' : ''}" data-act="deco" data-arg="${k}">${k ? `<svg viewBox="0 0 100 100">${DECO[k].d()}</svg>` : '<svg viewBox="0 0 100 100"><path d="M20 20L80 80M80 20L20 80" stroke="#999" stroke-width="5"/></svg>'}${n}</button>`).join('')}</div>`) : '');
  }
  function secText(s) {
    if (s?.kind !== 'text') return SEC('글자', ROW(B('addtext', '+ 새 글자틀', { cls: 'main' })) + HINT('페이지의 글씨를 누르면 여기서 글꼴 · 크기 · 자간 · 행간 · 정렬 · 색을 바꿉니다.'));
    const f = textB(s).font, el = s.el, pt = r1(ptOf(f.fs, el)), tr = f.ls == null ? 0 : Math.round(f.ls / f.fs * 1000), lh = f.lh == null ? 140 : Math.round(f.lh * 100);
    const fk = fontKey(f.ff || getComputedStyle(el).fontFamily);
    return SEC('글꼴', SELECT('tff', '글꼴', fk, [['', '(테마 글꼴)'], ...FONTS]) + NUM('tfs', '크기', pt, { step: .5, min: 4, max: 200, u: 'pt' }) +
      NUM('tls', '자간', tr, { step: 10, min: -200, max: 1000, u: '/1000' }) + NUM('tlh', '행간', lh, { step: 5, min: 60, max: 400, u: '%' }) +
      ROW(B('tal', '왼쪽', { arg: 'left', on: f.ta === 'left' || f.ta === 'start' }), B('tal', '가운데', { arg: 'center', on: f.ta === 'center' }), B('tal', '오른쪽', { arg: 'right', on: f.ta === 'right' || f.ta === 'end' }), B('tal', '양쪽', { arg: 'justify', on: f.ta === 'justify' })) +
      ROW(B('tbold', '<b>굵게</b>', { on: +f.fw >= 600 }), B('tital', '<i>기울임</i>', { on: f.fst === 'italic' })) + COL('tcolor', '글자색', f.color)) +
      SEC('', ROW(B('addtext', '+ 새 글자틀')));
  }
  function secShape(s) {
    if (s?.kind !== 'shape') return '';
    const st = stPeek(s);
    if (st.illu) {
      const cols = st.cols || ILLU[st.illu].c;
      return SEC('일러스트 색', cols.map((c, i) => COL(`icol${i}`, i ? '보조색' : '주 색', c)).join('') + SELECT('sshadow', '그림자', st.shadow || '', [['', '없음'], ['s', '약하게'], ['m', '보통'], ['l', '강하게']]) + ROW(B('illu-reset', '원래 색으로')));
    }
    const line = !!LINES[st.kind];
    return SEC('도형', (line ? '' : COL('sfill', '채우기', st.fill || '#E9CDBE') + RNG('sfo', '불투명도', Math.round((st.fo ?? 1) * 100), 0, 100)) +
      COL('sstroke', '선 색', st.stroke || '#8E7A62') + NUM('ssw', '선 두께', st.sw || 0, { step: .1, min: 0, max: 10, u: 'mm' }) +
      SELECT('skind', '모양', st.kind, [...Object.entries(SHAPE_LABEL).filter(([k]) => k !== 'poly'), ...Object.entries(LINE_LABEL)]) +
      SELECT('sshadow', '그림자', st.shadow || '', [['', '없음'], ['s', '약하게'], ['m', '보통'], ['l', '강하게']]));
  }
  function secAdjust(s) {
    if (s?.kind !== 'frame' || !photos[s.key]) return SEC('사진 보정', HINT('사진이 든 틀을 고르면 밝기 · 대비 · 채도 · 색온도를 바꿉니다. 원본 파일은 그대로 두고 화면과 내보내기에만 입힙니다.'));
    const a = frameData().adj?.[s.key] || {};
    return SEC('사진 보정 (원본 그대로)', RNG('abr', '밝기', a.br || 0, -100, 100) + RNG('act', '대비', a.ct || 0, -100, 100) + RNG('asa', '채도', a.sa || 0, -100, 100) + RNG('atp', '색온도', a.tp || 0, -100, 100) +
      CHK('abw', '흑백', !!a.bw) +
      ROW(B('apre', '화사하게', { arg: 'bright' }), B('apre', '선명하게', { arg: 'crisp' }), B('apre', '따뜻하게', { arg: 'warm' })) +
      ROW(B('apre', '시원하게', { arg: 'cool' }), B('apre', '빈티지', { arg: 'vintage' }), B('apre', '원래대로', { arg: 'reset' })) +
      ROW(B('aall', '같은 쪽 사진 모두에 적용')) +
      ROW(B('room', '사진 편집실 (세밀하게)'), `<a class="pu-b" href="tone.html" target="_blank" rel="noopener" style="text-align:center;text-decoration:none">졸업색톤</a>`));
  }

  /* --- 팔레트별 설정 창 --- */
  const TPL_TABS = { kinder: ['유치원', ['kids', 'bloom', 'sun', 'sky', 'classic', 'draw']], elem: ['초등학교', ['classic', 'sky', 'green', 'sketch', 'sun', 'kids', 'draw']], mid: ['중학교', ['modern', 'film', 'line', 'bloom', 'frame', 'premium']], high: ['고등학교', ['premium', 'typo', 'simple', 'modern', 'line', 'frame', 'film']] };
  const themeTile = k => { const t = THEMES[k]; return t ? `<button type="button" class="pu-tile${(S.theme || 'classic') === k ? ' on' : ''}" data-act="theme" data-arg="${k}"><span class="pu-dots">${t.dots.map(c => `<i style="background:${c}"></i>`).join('')}</span>${esc(t.name)}</button>` : ''; };
  const FLY = {
    tpl() {
      const [, list] = TPL_TABS[tplTab];
      const kt = document.getElementById('l-ktpl'), lt = document.getElementById('l-tpl');
      const covers = S.albumType === 'kinder' || S.size === 'sinsa' ? '' : SEC('표지 템플릿', coverList().map((c, i) => SELECT(`cover:${c.id}`, `시안 ${i + 1}`, c.tpl || 'classic', Object.entries(COVER_TPLS))).join('') + ROW(B('cover-add', '+ 표지 시안 추가')));
      return `<div class="pu-sec"><div class="pu-tabs">${Object.entries(TPL_TABS).map(([k, [n]]) => B('tpltab', n, { arg: k, on: tplTab === k })).join('')}</div>
        <h4>${TPL_TABS[tplTab][0]} 추천 디자인</h4><div class="pu-grid g3">${list.map(themeTile).join('')}</div>${HINT('색 · 글꼴 · 배경 장식이 바뀝니다. 쪽 구성 · 사진 · 글자는 그대로이고 Ctrl+Z로 되돌립니다.')}</div>` +
        (tplTab === 'kinder' ? SEC('유치원 앨범', ROW(B('click', '유치원 앨범 새로 만들기', { arg: 'p-kinder', cls: 'main' })) + (kt ? SELECT('ktpl', '템플릿', kt.value, [...kt.options].map(o => [o.value, o.textContent])) : '') + HINT('유치원 앨범을 열었을 때 템플릿을 바꿉니다.')) : '') +
        (lt && lt.options.length ? SEC('판 구성 템플릿 (직접 저장한 것)', SELECT('ltpl', '템플릿', lt.value, [...lt.options].map(o => [o.value, o.textContent])) + ROW(B('click', '이 템플릿 적용', { arg: 'l-apply' }))) : '') +
        covers + SEC('모든 디자인', `<div class="pu-grid g3">${Object.keys(THEMES).map(themeTile).join('')}</div>`);
    },
    photo(s) {
      return secPhoto(s) + (s?.kind === 'multi' ? secArrange(s) : '') +
        SEC('한꺼번에 넣기', ROW(B('click', '학교 폴더 한 번에', { arg: 'p-dir', cls: 'main' })) + ROW(B('click', '학생 프로필', { arg: 'f-bulk' }), B('click', '꽃 프로필', { arg: 'f-bulk-fl' })) + ROW(B('click', '야외 프로필', { arg: 'f-bulk-o' }), B('click', '선생님 사진', { arg: 'f-bulk-t' })) + ROW(B('click', '행사 폴더 (전체)', { arg: 'f-gal-dir' }), B('click', '행사 사진', { arg: 'f-bulk-g' })) +
          HINT('파일 이름에 학생 이름이 있으면 그 학생 자리에, 없으면 이름순으로 들어갑니다.')) +
        SEC('사진 바꾸기 · 해상도', ROW(B('swap', '고른 두 틀 사진 맞바꾸기 (F8)'), B('menu', '저해상도 찾기', { arg: 'print' })));
    },
    frame(s) {
      return SEC('그리기 도구', ROW(B('draw', '▭ 사각 틀 (F)', { arg: 'rect' }), B('draw', '◯ 원형 틀 (L)', { arg: 'ellipse' })) + ROW(B('poly', '✎ 자유형 (점 찍기)'), B('addframe', '+ 기본 사진틀')) + HINT('도구를 누른 뒤 쪽 위에서 끌면 그 크기로 틀이 생깁니다. Shift: 정사각 · 정원')) +
        secFrameStyle(s) + (s && s.kind !== 'text' ? secArrange(s) : '') + (s?.kind === 'frame' ? SEC('사진만 교체', ROW(B('pick', photos[s.key] ? '이 틀의 사진만 교체' : '사진 넣기'))) : '');
    },
    bg() {
      const d = bgDraft, pid = curPid(), cur = S.proBg?.[pid];
      return SEC(`지금 쪽: ${pidLabel(pid)}${cur ? ' (바꾼 배경)' : ''}`, `<div class="pu-tabs">${[['solid', '단색'], ['grad', '그라데이션'], ['img', '이미지'], ['tex', '텍스처']].map(([k, n]) => B('bgtype', n, { arg: k, on: d.t === k || (k === 'grad' && d.t === 'radial') })).join('')}</div>` +
        (d.t === 'solid' ? COL('bgc1', '색', d.c1) + SW(['#FFFFFF', '#FBF7F0', '#F6EFE3', '#FCE1E4', '#E0F4FF', '#E7F2E2', '#F4F6FA', '#2E2E2A'], 'bgdraft') : '') +
        (d.t === 'grad' || d.t === 'radial' ? COL('bgc1', '시작 색', d.c1) + COL('bgc2', '끝 색', d.c2) + SELECT('bgkind', '모양', d.t, [['grad', '직선'], ['radial', '원형 (가운데 밝게)']]) + (d.t === 'grad' ? RNG('bgang', '각도', d.ang ?? 180, 0, 360, 15) : '') : '') +
        (d.t === 'tex' ? `<div class="pu-grid">${Object.entries(TEX).map(([k, v]) => `<button type="button" class="pu-tile${d.tex === k ? ' on' : ''}" data-act="bgtex" data-arg="${k}"><span style="display:block;width:36px;height:36px;border-radius:4px;background:${esc(v.f([d.c1, d.c2]))}"></span>${v.n}</button>`).join('')}</div>` + COL('bgc1', '바탕색', d.c1) + COL('bgc2', '무늬색', d.c2) : '') +
        (d.t === 'img' ? ROW(`<label class="pu-b main" style="text-align:center">이 쪽 배경 사진 고르기<input type="file" accept="image/*" data-set="bgimg" hidden></label>`) + ROW(`<label class="pu-b" style="text-align:center">펼침면 두 쪽에 한 장으로<input type="file" accept="image/*" data-set="bgimg2" hidden></label>`) + HINT('사진은 쪽을 꽉 채우도록 비율을 유지해 맞춥니다.') : '') +
        RNG('bgop', '불투명도', Math.round((d.op ?? 1) * 100), 10, 100, 5) +
        (d.t !== 'img' ? ROW(B('bgapply', '이 쪽에', { arg: 'page', cls: 'main' }), B('bgapply', '펼침면 이어서', { arg: 'spread' }), B('bgapply', '모든 쪽', { arg: 'all' })) : '') +
        ROW(B('bgclear', '이 쪽 원래대로', { arg: 'page' }), B('bgclear', '펼침면 원래대로', { arg: 'spread' }), B('bgclear', '전부 원래대로', { arg: 'all' })) +
        HINT('불투명도를 낮추면 테마의 수채 장식이 비쳐 보입니다. 펼침면 이어서: 그라데이션 · 무늬가 두 쪽에 끊기지 않게 이어집니다.'));
    },
    color(s) {
      const how = s ? '대상: <b>' + (s.kind === 'text' ? '글자색' : s.kind === 'shape' ? '도형 채우기' : '사진틀 테두리') + '</b>' : '대상: <b>지금 쪽 배경</b> (개체를 고르면 그 개체에)';
      return SEC('색 넣기', HINT(how) + `<div style="display:flex;gap:6px;margin:6px 0"><input class="pu-txt" data-set="hex" placeholder="#RRGGBB" maxlength="7" style="flex:1">${B('hexgo', '적용', { cls: 'sm' })}<input type="color" data-set="pick" value="#c8a465" title="색 고르기" style="width:34px;height:28px;border:0;padding:0;background:none"></div>` +
        ROW(B('eyedrop', '스포이드 (화면에서 색 추출)'), B('fromphoto', '사진에서 색 뽑기')) + (photoCols.length ? `<div class="pu-pal"><b>사진에서 뽑은 색</b>${SW(photoCols)}</div>` : '') + (recent().length ? `<div class="pu-pal"><b>최근 쓴 색</b>${SW(recent())}</div>` : '') +
        (s?.kind === 'shape' ? ROW(B('colhow', '선 색으로 넣기 모드', { arg: 'stroke' })) : '')) +
        SEC('졸업앨범 컬러 팔레트', PALETTES.map(([n, cols]) => `<div class="pu-pal"><b>${n}</b>${SW(cols, colorHow)}</div>`).join('') + HINT('색을 누르면 고른 개체에 바로 들어가고 Ctrl+Z로 되돌립니다.'));
    },
    text(s) { return secText(s) + (s?.kind === 'text' ? secPos(s) + secArrange(s) : ''); },
    shape(s) {
      return SEC('도형 넣기', `<div class="pu-grid">${['rect', 'round', 'ellipse', 'tri', 'star', 'heart', 'diamond', 'hex'].map(k => `<button type="button" class="pu-tile" data-act="addshape" data-arg="${k}">${shapeIcon(k)}${SHAPE_LABEL[k]}</button>`).join('')}${Object.keys(LINES).map(k => `<button type="button" class="pu-tile" data-act="addshape" data-arg="${k}"><svg viewBox="0 0 100 100"><path d="${LINES[k](100, k === 'lineh' ? 100 : 70)}" transform="${k === 'lineh' ? '' : 'translate(0 15)'}" stroke="#cfe0ff" stroke-width="6" fill="none"/></svg>${LINE_LABEL[k]}</button>`).join('')}</div>` + HINT('누르면 지금 쪽 가운데에 생깁니다. 손잡이로 크기 · 위치를 바꿉니다.')) + secShape(s) + (s?.kind === 'shape' ? secPos(s) + secArrange(s) : '');
    },
    illu(s) {
      return `<div class="pu-sec"><div class="pu-tabs">${Object.entries(SEASONS).map(([k, n]) => B('illutab', n, { arg: k, on: illuTab === k })).join('')}</div>
        <div class="pu-grid">${Object.entries(ILLU).filter(([, v]) => v.s === illuTab).map(([k, v]) => `<button type="button" class="pu-tile" data-act="addillu" data-arg="${k}"><svg viewBox="0 0 100 100">${illuSvg(k)}</svg>${v.n}</button>`).join('')}</div>${HINT('누르면 지금 쪽에 들어갑니다. 크기 · 위치 · 색을 바꿀 수 있고, 인쇄에도 그대로 나옵니다.')}</div>` +
        SEC('계절별 사진틀 장식', HINT('사진틀을 고른 뒤 <b>사진틀</b> 팔레트의 계절별 프레임에서 모서리 장식을 넣을 수 있습니다.') + ROW(B('menu', '사진틀 팔레트 열기', { arg: 'frame' }))) + secShape(s);
    },
    layer(s) {
      const pid = curPid();
      if (!pid) return SEC('레이어', HINT('쪽을 먼저 누르세요.'));
      const list = pageLayers(pid).slice().reverse();
      const rows = list.map(it => {
        const x = it.items[0], key = x.key, kind = x.kind, rec = layerRec(kind, pid, key) || {};
        const ex = kind === 'frame' && frameExtra(key), isShape = ex && /\bx-shape\b/.test(ex.cls);
        const name = kind === 'text' ? `“${(textElOf(pid, key)?.textContent || '').trim().slice(0, 18) || '빈 글자'}”` : isShape ? (ex.st?.illu ? `일러스트 · ${ILLU[ex.st.illu]?.n || ''}` : `도형 · ${LINE_LABEL[ex.st?.kind] || SHAPE_LABEL[ex.st?.kind] || ''}`) : photos[key] ? `사진 · ${key}` : `빈 사진틀 · ${key}`;
        const on = frameSel && frameSel.pid === pid && frameSel.key === key;
        const ic = kind === 'text' ? 'T' : isShape ? '◆' : '▣';
        return `<div class="pu-li${on ? ' on' : ''}" data-act="lsel" data-arg="${esc(kind)}|${esc(key)}"><span class="pu-ic">${ic}</span><span class="pu-nm">${esc(name)}${rec.grp ? ' · 그룹' : ''}</span><button type="button" data-act="lvis" data-arg="${esc(kind)}|${esc(key)}" class="${rec.off ? 'off' : ''}" title="보이기 · 숨기기">👁</button><button type="button" data-act="llock" data-arg="${esc(kind)}|${esc(key)}" class="${rec.lock ? '' : 'off'}" title="잠금">🔒</button></div>`;
      }).join('');
      return SEC(`${pidLabel(pid)}의 레이어 (위가 앞)`, `<div class="pu-list">${rows || HINT('이 쪽에는 틀이 없습니다.')}</div>` + HINT('줄을 누르면 고르고, 👁 숨기기(인쇄에도 안 나옴), 🔒 잠금. Ctrl+L 잠금 · Ctrl+Alt+L 이 쪽 잠금 모두 풀기')) +
        (s ? secArrange(s) : SEC('그룹', ROW(B('group', '그룹으로 묶기', { arg: '1' }), B('group', '그룹 풀기', { arg: '0' })) + HINT('Shift+클릭으로 여러 틀을 고른 뒤 묶습니다.')));
    },
    adjust(s) { return secAdjust(s); },
    page() {
      const pid = curPid(), hid = S.pageEdits?.hidden?.length || 0, n = $$('#pages .page').filter(p => !p.dataset.pid.includes('~')).length;
      return SEC(`지금 쪽: ${pidLabel(pid)} · 총 ${n}쪽`, ROW(B('pgadd', '+ 뒤에 새 쪽', { cls: 'main' }), B('pgdup', '⧉ 쪽 복제')) + ROW(B('pgmove', '◀ 앞으로', { arg: '-1' }), B('pgmove', '뒤로 ▶', { arg: '1' })) + ROW(B('pgdel', '− 이 쪽 삭제', { cls: 'danger' }), B('pgrestore', `삭제한 쪽 되돌리기 (${hid})`, { dis: !hid })) +
        CHK('pad4', '4의 배수 쪽수로 맞추기 (메모 쪽 추가)', !!S.pad4) +
        HINT('쪽을 고르려면 아래 썸네일이나 편집 화면의 쪽을 누르세요. 순서 바꾸기는 [새 쪽]으로 추가한 쪽에 쓸 수 있고, 기본 쪽 순서는 판 구성(앨범 설정)을 따릅니다. 쪽이 하나 늘거나 줄면 뒤쪽의 좌우가 바뀝니다.')) +
        SEC('표지', HINT('표지 시안 추가 · 템플릿은 <b>템플릿</b> 팔레트나 표지 전개도 위 막대에서 바꿉니다.'));
    },
    print() {
      const sz = SIZES[S.size] || SIZES.a4, b = S.bleed ? BLEED : 0, u = unit(), ppi = targetPpi();
      const W = sz.w + 2 * b, H = sz.h + 2 * b, pxW = Math.round(W / 25.4 * ppi), pxH = Math.round(H / 25.4 * ppi);
      const cw = S.customW || sz.w, ch = S.customH || sz.h;
      const cr = checkResult;
      return SEC('판형', ROW(B('unit', 'mm', { arg: 'mm', on: u === 'mm' }), B('unit', 'inch', { arg: 'in', on: u === 'in' })) +
        ROW(B('size', '9×12 inch', { arg: 'in912', on: S.size === 'in912' }), B('size', '18×11 inch 펼침', { arg: 'in911', on: S.size === 'in911', title: '한 쪽 9×11 inch (펼치면 18×11)' }), B('size', '250×315 mm', { arg: 'sinsa', on: S.size === 'sinsa' })) +
        SELECT('fsize', '판형', S.size, Object.entries(SIZES).map(([k, v]) => [k, v.name])) +
        `<div class="pu-pos">${NUM('cw', 'W', mmShow(cw), { step: u === 'in' ? .01 : .5, u: uLabel() })}${NUM('ch', 'H', mmShow(ch), { step: u === 'in' ? .01 : .5, u: uLabel() })}</div>` + ROW(B('custom', '사용자 지정 크기로')) +
        HINT(`지금: 재단 ${mmShow(sz.w)}×${mmShow(sz.h)}${uLabel()} · 도련 포함 ${mmShow(W)}×${mmShow(H)}${uLabel()}<br>${ppi}ppi 기준 한 쪽 ${pxW.toLocaleString()}×${pxH.toLocaleString()}px · 18×11처럼 펼침 크기는 한 쪽(9×11)으로 만들고 스프레드로 내보냅니다.`)) +
        SEC('도련 · 안내선', CHK('bleed', '도련(재단 여백) 3mm 넣기', !!S.bleed) + CHK('guides', '재단선 · 안전영역 표시 (화면 전용)', !!S.guides) + CHK('bind', '중앙 제본선 표시 (화면 전용)', body.classList.contains('pro-bind')) +
          SELECT('ppi', '목표 해상도', ppi, [[300, '300ppi (권장)'], [350, '350ppi'], [250, '250ppi'], [200, '200ppi (최소)']])) +
        SEC('출력 검증', ROW(B('check', '출력 검증 실행', { cls: 'main' })) + (cr ? `<div class="pu-sum"><div><b>${cr.n}</b>쪽</div><div><b>${cr.photosN}</b>사진</div><div><b style="color:${cr.low ? '#ffb3a8' : '#a8e6a8'}">${cr.low}</b>저해상도</div><div><b>${cr.empty}</b>빈 틀</div></div>` +
          (cr.out.length ? `<div class="pu-list">${cr.out.slice(0, 200).map((o, i) => `<div class="pu-issue" data-act="issue" data-arg="${i}"><i class="${o.lv}">${o.lv === 'err' ? '고침' : '확인'}</i><span>${esc(o.t)}</span></div>`).join('')}</div>` : '<div class="pu-issue"><i class="ok">통과</i><span>문제가 없습니다.</span></div>') +
          HINT(`${cr.at.toLocaleTimeString()} 검사 · 해상도는 사진이 틀에 실제로 찍히는 크기로 계산합니다.`) : HINT('사진 해상도(목표 ppi), 빈 사진틀, 넘친 글자, 안전영역 밖 글자, 도련 끝까지 닿지 않은 틀, 쪽수를 확인합니다.'))) +
        SEC('내보내기', ROW(B('click', '인쇄용 PDF (CMYK · 재단선)', { arg: 'b-print-pdf', cls: 'main' })) + ROW(B('click', '대화형 PDF', { arg: 'b-pdf' }), B('export', 'JPG · 모두 (Ctrl+E)')) + ROW(B('click', '표지만 인쇄', { arg: 'b-print-wrap' }), B('click', '브라우저 인쇄', { arg: 'b-print' })));
    },
  };
  let colorHow = 'auto';

  /* --- 오른쪽 속성 --- */
  function propsHtml(s) {
    if (!s) {
      const pid = curPid();
      return SEC('선택 없음', HINT('편집 화면에서 사진틀 · 글자 · 도형을 누르면 여기에 속성이 나옵니다.<br>여러 개: <b>Shift+클릭</b> 또는 빈 곳에서 끌기.')) +
        SEC(`지금 쪽 ${pidLabel(pid)} 배경`, SW(['#FFFFFF', '#FBF7F0', '#F6EFE3', '#FCE1E4', '#FFF1C9', '#E0F4FF', '#E7F2E2', '#F4F6FA'], 'bg') + ROW(B('menu', '배경 자세히', { arg: 'bg' }), B('bgclear', '원래대로', { arg: 'page' }))) +
        SEC('빠른 넣기', ROW(B('addframe', '+ 사진틀'), B('addtext', '+ 글자틀')) + ROW(B('draw', '▭ 사각 틀', { arg: 'rect' }), B('draw', '◯ 원형 틀', { arg: 'ellipse' }))) +
        SEC('단축키', HINT('V 고르기 · F 사각 틀 · L 원형 틀 · Ctrl+Z 되돌리기 · Ctrl+E 내보내기 · Ctrl+L 잠금 · Ctrl+] / Ctrl+[ 순서 · 스페이스+끌기 화면 이동'));
    }
    // 인디자인 속성 패널 순서: 연결된 파일 → 변형 → 모양 → 정렬 → 프레임 맞춤 → 빠른 작업 (그 아래에 사진 · 모양 틀 · 보정)
    if (s.kind === 'multi') return secAlignID(s) + secLook(s) + secQuick(s) + secFrameStyle(s).replace(/<section class="pu-sec"><h4>테두리[\s\S]*$/, '');
    if (s.kind === 'text') return secTransform(s) + secText(s) + secAlignID(s) + secQuick(s);
    if (s.kind === 'shape') return secTransform(s) + secShape(s) + secAlignID(s) + secQuick(s);
    return secLinked(s) + secTransform(s) + secLook(s) + secAlignID(s) + secFitID(s) + secQuick(s) +
      secPhoto(s) + secFrameStyle(s).replace(/<section class="pu-sec"><h4>테두리[\s\S]*$/, '') + (photos[s.key] ? secAdjust(s) : '');
  }

  /* --- 다시 그리기 --- */
  let refreshTimer = 0;
  const refreshSoon = () => { clearTimeout(refreshTimer); refreshTimer = setTimeout(refreshAll, 30); };
  const busy = box => box && box.contains(document.activeElement) && /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName);
  function refreshAll(force) {
    if (!body.classList.contains('pro')) return;
    const s = sel(), pp = document.querySelector('#pro-props .pu-body'), fb = document.querySelector('#pro-fly .pu-body');
    document.querySelector('#pro-props .pu-head span').textContent = `속성 · ${selName(s)}`;
    if (pp && (force === true || !busy(pp))) { const k = pp.scrollTop; pp.innerHTML = propsHtml(s); pp.scrollTop = k; }
    if (fb && FLY[side] && (force === true || !busy(fb))) { const k = fb.scrollTop; fb.innerHTML = FLY[side](s); fb.scrollTop = k; }
  }
  window.proRefresh = refreshAll;

  /* --- 단추 동작 --- */
  const textKey = a => { const i = a.indexOf('|'); return { kind: a.slice(0, i), key: a.slice(i + 1) }; };
  const PRESET = { bright: { br: 18, ct: 5, sa: 10 }, crisp: { ct: 22, sa: 15 }, warm: { tp: 40, br: 4 }, cool: { tp: -40 }, vintage: { tp: 30, sa: -35, ct: -10 }, reset: {} };
  const ACT = {
    color: a => { const [c, how] = a.split('|'); if (how === 'bgdraft') { bgDraft.c1 = c; refreshAll(); return; } applyColor(c, how === 'bg' ? 'bg' : colorHow); },
    colhow: () => { colorHow = colorHow === 'stroke' ? 'auto' : 'stroke'; note(colorHow === 'stroke' ? '이제 팔레트 색이 도형의 선 색으로 들어갑니다.' : '팔레트 색이 채우기로 들어갑니다.'); refreshAll(); },
    hexgo: (_, b) => { const v = b.closest('.pu-sec').querySelector('[data-set="hex"]').value.trim(); if (/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(v)) applyColor(v.startsWith('#') ? v : `#${v}`, colorHow); else note('색 코드를 #RRGGBB 형식으로 넣으세요. 예: #C8A465'); },
    eyedrop, fromphoto: colorsFromPhoto,
    align: a => align(a),
    refpt: a => { ls.set(REF_KEY, a); refreshAll(true); },
    ratio: () => { ls.set(RATIO_KEY, ls.get(RATIO_KEY, '0') === '1' ? '0' : '1'); refreshAll(true); },
    'lk-open': () => window.openLinks?.(),
    ow: a => { const s = sel(); if (s?.kind === 'frame' && typeof openWith === 'function') openWith(s.key, a); },
    'ffill-x': () => { if (setFrameStyle2(st => { delete st.fill; }, '채우기를 없앴습니다.')) refreshAll(true); },
    arr: (_, b) => { const n = b.closest('.pu-sec').querySelector('.id-arr'); if (n) n.hidden = !n.hidden; },
    fitframe: () => {      // 내용에 프레임 맞추기: 틀 비율을 사진 비율로 (기준점 쪽은 그대로)
      const s = sel(), p = s?.kind === 'frame' && photos[s.key];
      if (!p || selLocked()) return;
      const b = boxOf(s), { fy } = refF(), asp = p.h / p.w, ph = s.el.querySelector('.photo');
      const extraW = b.w - (ph ? ph.getBoundingClientRect().width / (s.el.closest('.trim').getBoundingClientRect().width / 100) : b.w);      // 흰 카드 여백 등
      const nh = (b.w - extraW) * asp + extraW;
      putBox(s, { h: nh, y: b.y + (b.h - nh) * fy });
      p.x = 50; p.y = 50; p.z = 1; applyKey(s.key); persistPos(s.key);
      commitGeom('틀을 사진 비율에 맞췄습니다. Ctrl+Z로 되돌립니다.');
    },
    layer: a => layerMove(a),
    lock: () => { toggleLock(); refreshAll(); },
    dup: duplicate,
    del: async () => { if (selLocked()) return; await deleteFrame(); refreshAll(); },
    group: a => groupSel(a === '1'),
    pick: () => { const s = sel(); if (s?.kind === 'frame') pickPhoto(s.key); },
    unphoto: async () => { const s = sel(); if (s?.kind === 'frame' && photos[s.key] && confirm('이 틀의 사진을 뺄까요? (Ctrl+Z로 되돌릴 수 있습니다)')) { await removePhoto(s.key); refreshAll(); } },
    fit: a => { const s = sel(); if (s?.kind === 'frame') fitPhoto(s.key, a); },
    pzoom: a => { const s = sel(); if (s?.kind === 'frame') zoomPhoto(s.key, a === '1'); },
    prot: a => { const s = sel(); if (s?.kind === 'frame' && photos[s.key]) rotatePhoto(s.key, +a); },
    pcenter: () => { const s = sel(), p = s && photos[s.key]; if (!p) return; p.x = 50; p.y = 50; applyKey(s.key); persistPos(s.key); },
    pnudge: a => { const s = sel(), p = s && photos[s.key]; if (!p) return; const [dx, dy] = a.split(',').map(Number); p.x = Math.min(100, Math.max(0, p.x + dx)); p.y = Math.min(100, Math.max(0, p.y + dy)); applyKey(s.key); persistPos(s.key); },
    room: () => { const s = sel(); if (s?.kind === 'frame' && photos[s.key]) window.openPhotoRoom?.(s.key); },
    swap: () => swapPhotos(),
    fshape: k => setFrameShape(k),
    poly: polyStart,
    draw: t => window.setDrawFrameTool?.(t),
    addframe: () => window.pgAddPhotoFrame?.(),
    addtext: () => window.pgAddTextFrame?.(),
    deco: k => { if (setFrameStyle2(st => { if (k) st.deco = k; else delete st.deco; }, k ? `${DECO[k].n} 장식을 넣었습니다.` : '장식을 뺐습니다.')) refreshAll(); },
    'fstyle-reset': () => { if (setFrameStyle2(st => { for (const k of Object.keys(st)) delete st[k]; }, '모양 · 테두리 · 장식을 원래대로 돌렸습니다.')) refreshAll(); },
    'illu-reset': () => { if (setFrameStyle2(st => { st.cols = ILLU[st.illu].c.slice(); })) refreshAll(); },
    tal: a => setText(f => { f.ta = a; }), tbold: () => { setText(f => { f.fw = +f.fw >= 600 ? '400' : '700'; }); refreshAll(true); }, tital: () => { setText(f => { f.fst = f.fst === 'italic' ? 'normal' : 'italic'; }); refreshAll(true); },
    addshape: addShape, addillu: addIllu,
    illutab: k => { illuTab = k; refreshAll(true); },
    tpltab: k => { tplTab = k; refreshAll(true); },
    theme: k => { document.querySelector(`#theme-grid [data-theme="${k}"]`)?.click(); setTimeout(() => refreshAll(true), 80); },
    'cover-add': () => { const l = coverList(); coverAct('add', l[l.length - 1].id); setTimeout(() => refreshAll(true), 80); },
    click: id => { const el = document.getElementById(id); if (!el) return; el.click(); setTimeout(refreshAll, 120); },
    menu: k => openSide(k),
    export: () => window.openExport?.(),
    bgtype: k => { bgDraft.t = k; refreshAll(true); }, bgtex: k => { bgDraft.tex = k; refreshAll(true); },
    bgapply: scope => setBg({ ...bgDraft }, scope), bgclear: scope => clearBg(scope),
    lsel: (a, el, e) => { if (e?.target.closest('button')) return; const { kind, key } = textKey(a), pid = curPid(); frameMulti = []; frameSel = kind === 'text' ? { kind: 'text', key, pid } : { key, pid }; syncFrameSel(); refreshAll(true); },
    lvis: a => { const { kind, key } = textKey(a), r = layerRec(kind, curPid(), key, true); if (r.off) delete r.off; else r.off = true; saveState(); proApply(); refreshAll(true); note(r.off ? '숨겼습니다. 인쇄 · 내보내기에도 나오지 않습니다.' : '다시 보이게 했습니다.'); },
    llock: a => { const { kind, key } = textKey(a), r = layerRec(kind, curPid(), key, true); if (r.lock) delete r.lock; else r.lock = true; saveState(); syncFrameSel(); refreshAll(true); },
    apre: k => { const s = sel(); if (s?.kind !== 'frame') return; const adj = (frameData().adj ||= {}); if (k === 'reset') delete adj[s.key]; else adj[s.key] = { ...PRESET[k] }; saveState(); proApply(); refreshAll(true); },
    aall: () => { const s = sel(); if (s?.kind !== 'frame') return; const a = frameData().adj?.[s.key]; const adj = (frameData().adj ||= {}); let n = 0; $$('.trim .photo[data-photo]', s.el.closest(PAGE_SEL)).forEach(ph => { const k = ph.dataset.photo; if (!photos[k] || k === s.key) return; if (a) adj[k] = { ...a }; else delete adj[k]; n++; }); saveState(); proApply(); note(`같은 쪽 사진 ${n}장에 같은 보정을 넣었습니다.`); },
    pgadd: () => { window.pgAdd?.(); setTimeout(refreshAll, 400); }, pgdup: dupPage, pgmove: a => movePage(+a),
    pgdel: () => { const pid = curPid(); if (!pageEl(pid)) return; if (!confirm(`${pidLabel(pid)} 쪽을 삭제할까요? (사진은 보관되어 [삭제한 쪽 되돌리기]로 살릴 수 있습니다)`)) return; window.pgSelect?.(pid); window.pgDelete?.(); setTimeout(refreshAll, 400); },
    pgrestore: () => { window.pgRestore?.(); setTimeout(refreshAll, 400); },
    unit: u => { ls.set(UNIT_KEY, u); refreshAll(true); },
    size: k => setSize(k),
    custom: (_, b) => { const sec = b.closest('.pu-sec'); setCustomSize(mmRead(sec.querySelector('[data-set="cw"]').value), mmRead(sec.querySelector('[data-set="ch"]').value)); },
    check: preflight,
    issue: i => checkResult && goIssue(checkResult.out[+i]),
  };
  const SET = {
    px: v => geomSet({ x: v }), py: v => geomSet({ y: v }), pw: v => geomSet({ w: v }), ph: v => geomSet({ h: v }),
    tx: v => geomRef('x', v), ty: v => geomRef('y', v), tw: v => geomRef('w', v), th: v => geomRef('h', v),
    ffill: (v, el, commit) => { setFrameStyle2(st => { st.fill = v; }); if (commit) { pushRecent(v); refreshAll(); } },
    fswpt: v => { setFrameStyle2(st => { st.sw = Math.max(0, (+v || 0) * 25.4 / 72); if (!st.sc) st.sc = '#ffffff'; }); },
    frad: v => { setFrameStyle2(st => { const r = Math.max(0, +v || 0); if (r) st.rad = r; else delete st.rad; }); },
    fop: (v, el) => { if (el?.nextElementSibling) el.nextElementSibling.textContent = v; setFrameStyle2(st => { const o = Math.min(1, Math.max(0, (+v || 0) / 100)); if (o < 1) st.op = o; else delete st.op; }); },
    alignto: v => { ls.set(ALIGNTO_KEY, v === 'page' ? 'page' : 'sel'); refreshAll(true); },
    gapon: (v, el) => { ls.set(GAPON_KEY, el.checked ? '1' : '0'); refreshAll(true); },
    gapv: v => { ls.set(GAP_KEY, String(Math.max(0, +v || 0))); },
    fsc: (v, el, commit) => { setFrameStyle2(st => { st.sc = v; if (!+st.sw) st.sw = 1; }); if (commit) { pushRecent(v); refreshAll(); } },
    fsw: v => { setFrameStyle2(st => { st.sw = Math.max(0, +v || 0); }); },
    fshadow: v => setFrameStyle2(st => { if (v) st.shadow = v; else delete st.shadow; }),
    sshadow: v => setFrameStyle2(st => { if (v) st.shadow = v; else delete st.shadow; }),
    sfill: (v, el, commit) => { setFrameStyle2(st => { st.fill = v; }); if (commit) pushRecent(v); },
    sfo: (v, el) => { el.nextElementSibling.textContent = v; setFrameStyle2(st => { st.fo = +v / 100; }); },
    sstroke: v => setFrameStyle2(st => { st.stroke = v; if (!+st.sw) st.sw = .6; }),
    ssw: v => setFrameStyle2(st => { st.sw = Math.max(0, +v || 0); }),
    skind: v => { setFrameStyle2(st => { st.kind = v; }); refreshAll(true); },
    icol0: v => setFrameStyle2(st => { st.cols = [v, ...(st.cols || ILLU[st.illu].c).slice(1)]; }),
    icol1: v => setFrameStyle2(st => { const c = (st.cols || ILLU[st.illu].c).slice(); c[1] = v; st.cols = c; }),
    tff: v => setText(f => { f.ff = v; }),
    tfs: (v, el) => { const s = sel(); if (s?.kind === 'text' && +v > 0) setText(f => { const k = fsOf(+v, s.el) / f.fs; f.fs *= k; if (f.ls != null) f.ls *= k; }); },
    tls: v => setText(f => { f.ls = (+v || 0) / 1000 * f.fs; }),
    tlh: v => setText(f => { f.lh = Math.max(.5, (+v || 140) / 100); }),
    tcolor: (v, el, commit) => { setText(f => { f.color = v; }); if (commit) pushRecent(v); },
    abr: (v, el, c) => adjSet('br', v, el, c), act: (v, el, c) => adjSet('ct', v, el, c), asa: (v, el, c) => adjSet('sa', v, el, c), atp: (v, el, c) => adjSet('tp', v, el, c),
    abw: (v, el) => adjSet('bw', el.checked ? 1 : 0, el, true),
    bgc1: v => { bgDraft.c1 = v; }, bgc2: v => { bgDraft.c2 = v; },
    bgkind: v => { bgDraft.t = v; refreshAll(true); },
    bgang: (v, el) => { el.nextElementSibling.textContent = v; bgDraft.ang = +v; },
    bgop: (v, el) => { el.nextElementSibling.textContent = v; bgDraft.op = +v / 100; },
    bgimg: (v, el) => bgImage(el.files[0], 'page'), bgimg2: (v, el) => bgImage(el.files[0], 'spread'),
    hex: () => {}, pick: (v, el, commit) => { if (commit) applyColor(v, colorHow); },
    ktpl: v => { const k = document.getElementById('l-ktpl'); if (k) { k.value = v; k.dispatchEvent(new Event('change', { bubbles: true })); } },
    ltpl: v => { const k = document.getElementById('l-tpl'); if (k) k.value = v; },
    pad4: (v, el) => proxyCheck('f-pad4', el.checked),
    bleed: (v, el) => proxyCheck('f-bleed', el.checked), guides: (v, el) => proxyCheck('f-guides', el.checked),
    bind: (v, el) => { body.classList.toggle('pro-bind', el.checked); ls.set(BIND_KEY, el.checked ? '1' : '0'); },
    ppi: v => { ls.set(PPI_KEY, v); checkResult = null; refreshAll(true); },
    fsize: v => setSize(v),
    cw: () => {}, ch: () => {},
  };
  const NUMERIC_LIVE = new Set(['fsw', 'ssw']);
  /** 변형: 기준점(9점)에 따라 X · Y는 그 점의 위치, W · H는 그 점을 고정한 채 크기 바꿈 (비율 고정이면 함께) */
  function geomRef(field, v) {
    const s = sel();
    if (!s || s.kind === 'multi') return;
    if (selLocked()) { note('잠긴 개체입니다.'); refreshAll(true); return; }
    const k = trimMm(s.el) / 100, mm = mmRead(v);
    if (!Number.isFinite(mm)) return;
    const b = boxOf(s), { fx, fy } = refF(), val = mm / k, nb = {};
    if (field === 'x') nb.x = val - b.w * fx;
    else if (field === 'y') nb.y = val - b.h * fy;
    else {
      if (val < FRAME_MIN) { note(`너무 작습니다 (최소 ${r1(FRAME_MIN * k)}mm).`); refreshAll(true); return; }
      const ratio = ls.get(RATIO_KEY, '0') === '1';
      let w = b.w, h = b.h;
      if (field === 'w') { w = val; if (ratio) h = b.h * val / b.w; } else { h = val; if (ratio) w = b.w * val / b.h; }
      Object.assign(nb, { w, h, x: b.x + (b.w - w) * fx, y: b.y + (b.h - h) * fy });
    }
    putBox(s, nb);
    commitGeom();
  }
  function geomSet(part) {
    const s = sel();
    if (!s || s.kind === 'multi') return;
    if (selLocked()) { note('잠긴 개체입니다.'); refreshAll(true); return; }
    const k = trimMm(s.el) / 100, nb = {};
    for (const [key, v] of Object.entries(part)) { const mm = mmRead(v); if (!Number.isFinite(mm)) return; if ((key === 'w' || key === 'h') && mm / k < FRAME_MIN) { note(`너무 작습니다 (최소 ${r1(FRAME_MIN * k)}mm).`); return; } nb[key] = mm / k; }
    putBox(s, nb);
    commitGeom();
  }
  function adjSet(k, v, el, commit) {
    const s = sel();
    if (s?.kind !== 'frame') return;
    if (el.type === 'range') el.nextElementSibling.textContent = v;
    const adj = (frameData().adj ||= {}), a = (adj[s.key] ||= {});
    if (+v) a[k] = +v; else delete a[k];
    if (!Object.keys(a).length) delete adj[s.key];
    $$(`.photo[data-photo="${CSS.escape(s.key)}"]`).forEach(ph => { ph.style.filter = adjFilter(adj[s.key]); });
    if (commit) saveState();
  }

  /* ============ 뼈대 만들기 ============ */
  function openSide(k) {
    if (k && body.classList.contains('pro-lc')) { foldPanel('left', false); side = null; }      // 접혀 있으면 펼치고 그 창을 엶
    side = k && side === k && body.classList.contains('pro-side') ? null : k;
    ls.set(SIDE_KEY, side || '');
    body.classList.toggle('lp-closed', side !== 'settings');
    body.classList.toggle('pro-flyon', !!side && side !== 'settings');
    body.classList.toggle('pro-side', !!side);
    $$('#pro-rail button[data-menu]').forEach(b => b.classList.toggle('on', b.dataset.menu === side));
    const head = document.querySelector('#pro-fly .pu-head span');
    if (head) head.textContent = MENU_NAME[side] || '';
    refreshAll(true);
    setTimeout(() => window.syncFrameSel?.(), 230);
  }
  function zoomLabel() { const z = document.getElementById('pt-zoom'); if (z) z.textContent = `${Math.round((+S.zoom || .6) * 100)}%`; }
  function fitZoom() {
    const left = body.classList.contains('pro-side') ? 56 + 300 + 50 : 56 + 50, avail = innerWidth - left - 268 - 70;
    const spreadPx = (2 * G.pageMm + 1) * 96 / 25.4;
    setViewZoom(avail / spreadPx);
  }
  function fileMenu(btn) {
    const m = document.getElementById('pro-menu'), r = btn.getBoundingClientRect();
    m.innerHTML = [['p-new', '새 앨범'], ['p-kinder', '새 유치원 앨범'], ['-'], ['p-open', '파일 열기 (.album)'], ['p-save', '파일로 저장 (.album)'], ['p-links', '🔗 링크 창 (사진 목록 · 유실 확인)'], ['p-pack', '📦 패키지 (사진 원본 · 글꼴 모으기)'], ['p-leaflet', '📰 리플렛 · 팜플렛 (작년 시안 → 올해 추천)'], ['-'], ['p-dir', '학교 폴더 한 번에 불러오기'], ['f-xlsx', '학생 명단 엑셀 불러오기'], ['p-check', '점검표 보기'], ['-'], ['p-del', '이 앨범 지우기']].map(([id, t]) => (id === '-' ? '<hr>' : `<button type="button" data-id="${id}">${t}</button>`)).join('');
    m.hidden = false;
    m.style.left = `${r.left}px`; m.style.top = `${r.bottom + 4}px`;
  }
  function build() {
    body.insertAdjacentHTML('beforeend', `
      <header id="pro-top">
        <div class="pt-brand">졸업앨범 디자이너5</div>
        <button type="button" data-top="file">파일 ▾</button>
        <select id="pt-album" title="지금 앨범"></select>
        <span class="pt-sep"></span>
        <button type="button" data-top="undo" title="Ctrl+Z (12번까지)">↶ 실행 취소</button>
        <span class="pt-sep"></span>
        <button type="button" data-top="zout" title="Ctrl −">−</button><span class="pt-zoom" id="pt-zoom"></span><button type="button" data-top="zin" title="Ctrl +">+</button><button type="button" data-top="zfit" title="펼침면이 화면에 맞게">맞춤</button>
        <span class="pt-sep"></span>
        <span class="pt-msg" id="pt-msg"></span>
        <span class="pt-fill"></span>
        <button type="button" data-top="fast" title="느려졌을 때 한 번 누르세요: 작업을 저장하고 메모리를 비운 뒤 같은 자리로 다시 엽니다 (2~3초)">⚡ 가볍게</button>
        <button type="button" data-top="save" title="앨범 파일(.album)로 저장 · 작업 중에는 브라우저에 자동 저장됩니다">저장</button>
        <button type="button" data-top="export" class="pt-main" title="Ctrl+E">내보내기</button>
        <button type="button" data-top="classic" title="예전 화면으로 (언제든 다시 켤 수 있음)">예전 화면</button>
      </header>
      <nav id="pro-rail" aria-label="팔레트">
        <button type="button" data-menu="settings" title="학교 · 명단 · 판 구성 등 기존 설정"><svg viewBox="0 0 24 24">${ICONS.settings}</svg>설정</button>
        <span class="pr-sep"></span>
        ${MENUS.map(([k, n]) => `<button type="button" data-menu="${k}" title="${n}"><svg viewBox="0 0 24 24">${ICONS[k]}</svg>${n}</button>`).join('')}
        <button type="button" class="pr-fold" data-fold="left" title="왼쪽 팔레트 접기 (Shift+Tab: 양옆 팔레트 함께)">«</button>
      </nav>
      <aside id="pro-fly"><div class="pu-head"><span></span><button type="button" data-top="flyclose" title="닫기">×</button></div><div class="pu-body"></div></aside>
      <aside id="pro-props"><div class="pu-head"><span>속성</span><button type="button" data-fold="right" title="속성 팔레트 접기 (Shift+Tab: 양옆 팔레트 함께)">»</button></div><div class="pu-body"></div></aside>
      <button type="button" id="pro-open-left" data-fold="left" title="왼쪽 팔레트 펼치기">»</button>
      <button type="button" id="pro-open-right" data-fold="right" title="속성 팔레트 펼치기">« 속성</button>
      <div id="pro-menu" hidden></div>
      <button type="button" id="pro-on" title="새 편집 화면 켜기">새 편집 화면</button>`);
    // 위 도구줄
    document.getElementById('pro-top').addEventListener('click', e => {
      const b = e.target.closest('[data-top]');
      if (!b) return;
      ({
        file: () => fileMenu(b), undo: () => window.undoRun?.(), zin: () => setViewZoom(+S.zoom + .1), zout: () => setViewZoom(+S.zoom - .1), zfit: fitZoom,
        save: () => document.getElementById('p-save')?.click(), export: () => window.openExport?.(), classic: () => setPro(false), fast: () => window.speedUp?.(),
      })[b.dataset.top]?.();
    });
    document.querySelector('#pro-fly [data-top="flyclose"]').addEventListener('click', () => openSide(null));
    document.getElementById('pro-menu').addEventListener('click', e => { const id = e.target.closest('[data-id]')?.dataset.id; document.getElementById('pro-menu').hidden = true; if (id) document.getElementById(id)?.click(); });
    addEventListener('pointerdown', e => { if (!e.target.closest?.('#pro-menu,[data-top="file"]')) document.getElementById('pro-menu').hidden = true; }, true);
    const al = document.getElementById('pt-album'), src = document.getElementById('p-list');
    const fillAlbums = () => { if (src) { al.innerHTML = src.innerHTML; al.value = src.value; } };
    fillAlbums();
    src && new MutationObserver(fillAlbums).observe(src, { childList: true, subtree: true, attributes: true });
    al.addEventListener('change', () => { if (!src) return; src.value = al.value; src.dispatchEvent(new Event('change', { bubbles: true })); });
    // 팔레트
    document.getElementById('pro-rail').addEventListener('click', e => { const b = e.target.closest('[data-menu]'); if (b) openSide(b.dataset.menu); });
    document.getElementById('pro-on').addEventListener('click', () => setPro(true));
    // 양옆 팔레트 접기 · 펼치기 (상태 기억). Shift+Tab: 양옆 함께 (Tab은 예전처럼 쪽 썸네일까지 모두)
    document.querySelectorAll('[data-fold]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); foldPanel(b.dataset.fold); }));
    addEventListener('keydown', e => {
      if (!body.classList.contains('pro') || e.key !== 'Tab' || e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.target.closest?.('input,textarea,select,button,[contenteditable],dialog') || document.querySelector('dialog[open]') || document.querySelector('#photo-room:not([hidden])')) return;
      e.preventDefault(); e.stopImmediatePropagation();
      const anyOpen = !body.classList.contains('pro-lc') || !body.classList.contains('pro-rc');
      foldPanel('left', anyOpen); foldPanel('right', anyOpen);
      if (!e.shiftKey) window.pgSetOpen?.(!anyOpen);
    }, true);
    // 설정 창 · 속성 창 공통
    for (const box of [document.querySelector('#pro-fly .pu-body'), document.querySelector('#pro-props .pu-body')]) {
      box.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b || b.disabled) return; ACT[b.dataset.act]?.(b.dataset.arg, b, e); });
      box.addEventListener('input', e => { const i = e.target.closest('[data-set]'); if (!i || i.type === 'file') return; if (i.type === 'number' && !NUMERIC_LIVE.has(i.dataset.set)) return; if (i.type === 'checkbox' || i.tagName === 'SELECT') return; SET[i.dataset.set]?.(i.value, i, false); });
      box.addEventListener('change', e => { const i = e.target.closest('[data-set]'); if (!i) return; if (i.dataset.set.startsWith('cover:')) { coverAct('tpl', +i.dataset.set.slice(6), i.value); return; } SET[i.dataset.set]?.(i.value, i, true); });
      box.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('input[type=number]')) e.target.blur(); if (e.key === 'Enter' && e.target.matches('[data-set="hex"]')) ACT.hexgo(null, e.target); });
    }
    // 아래 쪽 썸네일 줄: 마우스 휠로 옆으로
    document.getElementById('pg-list')?.addEventListener('wheel', e => { if (!body.classList.contains('pro') || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; e.currentTarget.scrollLeft += e.deltaY; e.preventDefault(); }, { passive: false });
    // 틀을 끌어 옮기거나 크기를 바꾼 뒤 숫자 · 모양 다시 맞춤
    addEventListener('pointerup', e => { if (e.target.closest?.('#pro-fly,#pro-props,#pro-top,#pro-rail')) return; setTimeout(() => { proApply(); refreshAll(); }, 120); });
    // 쪽을 누르면 배경 · 레이어 · 페이지 창의 '지금 쪽'이 바뀜
    let lastPid = null;
    document.getElementById('pages').addEventListener('click', () => { const p = curPid(); if (p !== lastPid) { lastPid = p; if (['bg', 'layer', 'page'].includes(side) || !sel()) refreshSoon(); } });
  }
  const FOLD_KEY = 'gradAlbum.proFold';
  /** which: left(아이콘 팔레트 + 설정 창) · right(속성). close: true 접기 · false 펼치기 · 없으면 바꾸기 */
  function foldPanel(which, close) {
    const cls = which === 'left' ? 'pro-lc' : 'pro-rc';
    const on = close ?? !body.classList.contains(cls);
    body.classList.toggle(cls, on);
    let st = {};
    try { st = JSON.parse(ls.get(FOLD_KEY, '{}')) || {}; } catch { /* 기본값 */ }
    st[which] = on;
    ls.set(FOLD_KEY, JSON.stringify(st));
    setTimeout(() => window.syncFrameSel?.(), 230);
  }
  function restoreFold() {
    let st = {};
    try { st = JSON.parse(ls.get(FOLD_KEY, '{}')) || {}; } catch { /* 기본값 */ }
    body.classList.toggle('pro-lc', !!st.left);
    body.classList.toggle('pro-rc', !!st.right);
  }
  function setPro(on) {
    ls.set(PRO_KEY, on ? '1' : '0');
    body.classList.toggle('pro', on);
    if (on) openSide(side === null ? null : side || 'settings');
    else { body.classList.remove('pro-flyon', 'pro-side'); body.classList.toggle('lp-closed', ls.get('gradAlbum.leftPanel', '1') === '0'); }
    setTimeout(() => window.syncFrameSel?.(), 250);
    note(on ? '' : '예전 화면입니다. 왼쪽 아래 [새 편집 화면]으로 다시 켭니다.');
  }

  /* 도구 팔레트(tool-palette.js)가 쓰는 연결 함수 */
  const isShapeIt = it => !!(it.x && /\bx-shape\b/.test(it.x.cls));
  function paint(o) {
    const s = sel();
    if (!s) {
      if (o.fill && o.fill !== 'none') setBg({ t: 'solid', c1: o.fill }, 'page');
      else note('색을 넣을 개체를 고르세요. 아무것도 안 고르고 채우기 색을 고르면 지금 쪽 배경이 바뀝니다.');
      return;
    }
    if (s.kind === 'text') {
      if (o.fill && o.fill !== 'none') setText(f => { f.color = o.fill; });
      else if (o.stroke !== undefined || o.sw !== undefined || o.op !== undefined) note('글자에는 채우기(글자색)만 넣을 수 있습니다.');
      return;
    }
    setFrameStyle2((st, it) => {
      const shp = isShapeIt(it);
      if (o.fill !== undefined) {
        if (shp && st.illu) { if (o.fill !== 'none') st.cols = [o.fill, ...(st.cols || ILLU[st.illu].c).slice(1)]; }
        else if (shp && !LINES[st.kind]) st.fill = o.fill;
        else if (shp && o.fill !== 'none') { st.stroke = o.fill; if (!+st.sw) st.sw = .6; }
      }
      if (o.stroke !== undefined) {
        if (o.stroke === 'none') { if (shp && LINES[st.kind]) st.stroke = 'transparent'; else st.sw = 0; }
        else if (shp) { st.stroke = o.stroke; if (!+st.sw) st.sw = .6; }
        else { st.sc = o.stroke; if (!+st.sw) st.sw = 1; }
      }
      if (o.sw !== undefined) st.sw = Math.max(0, +o.sw || 0);
      if (o.op !== undefined) { if (+o.op >= 1) delete st.op; else st.op = Math.max(.05, +o.op); }
    });
    for (const c of [o.fill, o.stroke]) if (c && c !== 'none') pushRecent(toHex(c));
    refreshAll();
  }
  function selColors() {
    const s = sel();
    if (!s) return { kind: 'none', fill: S.proBg?.[curPid()]?.c1 || null, stroke: null };
    if (s.kind === 'multi') return { kind: 'multi', fill: null, stroke: null };
    if (s.kind === 'text') return { kind: 'text', fill: toHex(textOver()[s.id]?.font?.color || getComputedStyle(s.el).color), stroke: 'none' };
    const st = stPeek(s), op = st.op ?? 1;
    if (s.kind === 'shape') {
      if (st.illu) return { kind: 'shape', fill: (st.cols || ILLU[st.illu].c)[0], stroke: 'none', sw: 0, op };
      if (LINES[st.kind]) return { kind: 'shape', fill: 'none', stroke: st.stroke || '#8E7A62', sw: st.sw ?? .6, op };
      return { kind: 'shape', fill: st.fill || 'none', stroke: +st.sw > 0 ? st.stroke || '#8E7A62' : 'none', sw: st.sw || 0, op };
    }
    return { kind: 'frame', fill: 'none', stroke: +st.sw > 0 ? st.sc || '#ffffff' : 'none', sw: st.sw || 0, op };
  }
  window.proAPI = { sel, paint, selColors, addShape, addIllu, align, eyedrop, openSide, polyStart, setBg, layerMove, duplicate, groupSel, recent, pushRecent, toHex, note, refresh: refreshAll, bgDraft: () => bgDraft };

  ensureCustom();
  if (S.size === 'custom' && SIZES.custom) render();
  build();
  if (ls.get(BIND_KEY, '0') === '1') body.classList.add('pro-bind');
  zoomLabel();
  restoreFold();
  side = side || null;
  setPro(ls.get(PRO_KEY, '1') !== '0');
  proApply();
})();
