/* ============================================================
   유치원 템플릿 「도산유치원 10×11inch」 (원본: 도산유치원시안 완성.pdf, 12쪽)
   배경 · 일러스트 · 틀 장식은 원본 PDF를 300dpi로 그린 그림(tpl/dosan/pNN.jpg)을 그대로 깔고,
   사진 위로 겹치는 장식(10 · 12쪽 화환)은 투명 그림(oNN.png)으로 사진 위에 얹음.
   사진틀 위치 · 모양은 원본의 사진 자리(회색 · 검정 · 노랑 칸, 테두리 안 흰 칸)를 재서 옮김. 좌표는 재단선 안쪽 쪽 기준 %.
   5 · 6쪽의 반 제목 · 원아 이름은 명단에서 가져오도록 배경에서 지우고 앱 글자로 넣음.
   앨범 설정 kTemplate: 'dosan'인 유치원앨범에서 쓰임.
   ============================================================ */
const DOSAN_DIR = 'tpl/dosan';
const DOSAN_HEART_FULL = '95.90 55.00,94.54 58.69,93.05 62.16,91.37 65.41,88.81 68.18,86.80 70.86,85.37 73.65,83.41 76.03,79.81 77.05,79.45 80.33,77.12 81.95,74.15 82.61,71.77 83.63,69.87 85.11,69.22 88.74,67.21 90.28,65.05 91.54,61.72 89.34,59.77 90.60,57.61 91.15,56.24 96.88,53.84 98.25,51.23 96.81,48.67 99.99,46.13 98.60,43.74 97.05,41.81 93.90,39.31 93.96,37.03 93.02,35.03 91.35,33.71 88.40,32.36 85.96,29.67 85.80,26.68 85.67,24.79 83.82,22.42 82.39,20.28 80.56,18.22 78.51,18.02 75.13,17.69 72.03,15.00 70.08,11.29 68.14,9.03 65.31,6.95 62.16,4.84 58.74,3.44 55.00,3.81 51.18,3.13 47.20,2.62 43.08,0.08 38.05,0.19 33.54,1.61 29.50,0.37 23.76,1.93 19.44,3.81 15.27,7.42 12.71,8.91 8.02,10.99 3.71,14.81 1.67,18.90 0.41,23.30 0.24,29.75 5.85,32.94 5.02,36.62 6.26,40.50 9.89,43.88 13.89,46.68 17.60,48.93 18.68,51.04 19.81,53.32 17.60,56.42 11.92,59.63 9.25,63.18 6.97,66.08 7.89,72.09 1.38,76.80 0.05,81.31 0.05,85.53 1.16,89.14 3.54,92.23 6.72,94.75 10.55,96.72 14.81,98.01 19.49,98.49 24.48,96.13 30.68,96.94 34.78,99.64 38.15,94.72 43.75,93.01 47.84,93.80 51.37';     // 12쪽 하트 모양 (원본 검정 칸을 90방향으로 잰 윤곽, 상자 기준 %)

/* 쪽마다 사진 자리. t: rect(모서리 r cqw) · rr(흰 칸: fill로 둥근 정도 계산) · ell(타원) · heart · pol(폴라로이드, rot 도) */
const DOSAN_EVENTS = [
  // 7쪽
  { pg: 7, t: 'pol', b: [13.30, 7.69, 81.52, 54.90], rot: -1.86 },
  { pg: 7, t: 'rr', b: [5.79, 67.48, 47.60, 93.75], fill: .936 },
  { pg: 7, t: 'rr', b: [51.30, 67.48, 93.11, 93.75], fill: .936 },
  // 8쪽
  { pg: 8, t: 'rr', b: [9.08, 9.87, 32.93, 42.12], fill: .938 },
  { pg: 8, t: 'rr', b: [36.33, 9.87, 89.92, 42.12], fill: .936 },
  { pg: 8, t: 'pol', b: [8.805, 54.455, 41.885, 84.585], rot: -2.92 },
  { pg: 8, t: 'pol', b: [50.33, 55.28, 83.50, 85.57], rot: -2.57 },
  // 9쪽
  { pg: 9, t: 'ell', b: [10.38, 5.07, 61.98, 51.90] },
  { pg: 9, t: 'rr', b: [66.67, 10.96, 93.21, 46.11], fill: .936 },
  { pg: 9, t: 'rr', b: [53.49, 49.18, 93.01, 93.30], fill: .935 },
  { pg: 9, t: 'rr', b: [5.09, 56.16, 49.80, 86.41], fill: .935 },
  // 10쪽
  { pg: 10, t: 'ell', b: [12.08, 2.45, 90.32, 73.55] },
  { pg: 10, t: 'rr', b: [7.78, 70.02, 34.43, 94.38], fill: .936 },
  { pg: 10, t: 'rr', b: [37.82, 77.17, 63.87, 94.20], fill: .936 },
  { pg: 10, t: 'rr', b: [67.37, 70.92, 91.22, 94.38], fill: .934 },
  // 11쪽 (분홍 하트는 배경 장식, 그 위 고리 3개와 둥근 칸이 사진 자리)
  { pg: 11, t: 'ell', b: [58.6, 7.8, 98.6, 65.6] },
  { pg: 11, t: 'ell', b: [6.4, 11.6, 67.7, 73.6] },
  { pg: 11, t: 'ell', b: [12.3, 68.0, 39.0, 95.1] },
  { pg: 11, t: 'rr', b: [42.51, 67.75, 86.33, 94.75], fill: .892 },
  // 12쪽
  { pg: 12, t: 'heart', b: [4.49, 6.07, 94.81, 75.36] },
  { pg: 12, t: 'rr', b: [5.99, 66.76, 34.33, 94.75], fill: .923 },
  { pg: 12, t: 'rr', b: [38.32, 76.45, 64.07, 94.75], fill: .940 },
  { pg: 12, t: 'rr', b: [67.56, 63.95, 90.72, 94.75], fill: .914 },
];
const DOSAN_EVENT_KEYS = DOSAN_EVENTS.map((_, i) => `ds-e${i}`);
/* 원아 사진 자리 16칸 (5쪽 8칸 · 6쪽 8칸)과 이름 줄 높이 */
const DOSAN_KIDS = [
  ...[[15.67, 30.04], [33.93, 48.40], [52.30, 66.67], [70.56, 84.93]].map(([a, b]) => ({ pg: 5, b: [a, 53.26, b, 69.47], ny: 71.95 })),
  { pg: 5, b: [15.67, 74.82, 30.04, 90.94], ny: 93.3 }, { pg: 5, b: [33.93, 74.82, 48.40, 90.94], ny: 93.3 },
  { pg: 5, b: [52.30, 74.82, 66.67, 90.94], ny: 93.3 }, { pg: 5, b: [70.16, 74.64, 84.53, 90.76], ny: 93.1 },
  { pg: 6, b: [18.46, 5.25, 32.83, 21.47], ny: 23.95 }, { pg: 6, b: [36.63, 5.25, 51.00, 21.47], ny: 23.95 },
  { pg: 6, b: [54.89, 5.25, 69.26, 21.47], ny: 23.95 }, { pg: 6, b: [73.15, 5.16, 87.62, 21.47], ny: 23.95 },
  ...[[9.68, 24.15], [28.04, 42.42], [46.31, 60.68], [64.57, 78.94]].map(([a, b]) => ({ pg: 6, b: [a, 27.45, b, 43.57], ny: 46.1 })),
];

/** 흰 칸의 둥근 정도: 칸을 채운 비율(fill)로 모서리 반지름(cqw)을 거꾸로 계산 */
function dsRadius(b, fill) {
  const w = b[2] - b[0], h = (b[3] - b[1]) * G.aspect;
  return Math.min(w, h) / 2 > 0 ? Math.min(Math.min(w, h) / 2, Math.sqrt(Math.max(0, (1 - fill) * w * h / (4 - Math.PI)))) : 0;
}
const dsHeartClip = () => `polygon(${DOSAN_HEART_FULL.split(',').map(p => { const [x, y] = p.trim().split(' '); return `${x}% ${y}%`; }).join(',')})`;
/** 사진틀 하나 (모양 · 기울기 포함). 틀 장식은 배경 그림에 있어서 틀 자체는 사진만 */
function dsFrame(key, b, { r = 0, ell = false, heart = false, rot = 0, grow = .25, cls = '' } = {}) {
  const box = [b[0] - grow, b[1] - grow, b[2] + grow, b[3] + grow];
  const st = [r ? `border-radius:${f(r)}cqw` : '', ell ? 'border-radius:50%' : '', heart ? `clip-path:${dsHeartClip()}` : '', rot ? `transform:rotate(${rot}deg)` : ''].filter(Boolean).join(';');
  return `<div class="lf k-ds ${cls}" style="${lfStyle(box)};${st}">${P(key)}</div>`;
}
/** 원본 그림을 쪽 크기에 맞춰 깔기 (원본은 재단 여백 3mm 포함) */
function dosanBg(n) {
  const sz = SIZES[S.size] || SIZES.in1011, b = S.bleed ? BLEED : 0;
  const L = (b - 3) / (sz.w + 2 * b) * 100, T = (b - 3) / (sz.h + 2 * b) * 100, W = (sz.w + 6) / (sz.w + 2 * b) * 100, H = (sz.h + 6) / (sz.h + 2 * b) * 100;
  return `<div class="bg k-dsbg" aria-hidden="true"><img src="${DOSAN_DIR}/p${String(n).padStart(2, '0')}.jpg" alt="" style="left:${f(L)}%;top:${f(T)}%;width:${f(W)}%;height:${f(H)}%"></div>`;
}
/** 사진 위에 얹는 장식 (재단 여백 포함 그림을 재단 영역에 맞춤) */
const dsOverlay = n => `<img class="k-ovl" src="${DOSAN_DIR}/o${String(n).padStart(2, '0')}.png" alt="" style="left:calc(${f(-300 / 254)}cqw - 7cqw);top:calc(${f(-300 / 279.4)}cqh - 7cqw);width:${f(26000 / 254)}cqw;height:${f(28540 / 279.4)}cqh">`;

function dosanPages(classes) {
  const kidNames = classes.flatMap(c => c.students).map(s => s.name).filter(Boolean);
  const pk = (kind, def) => (S.kPersonal && kidNames[0] ? kpKey(kind, kidNames[0]) : def);
  const ev = i => pk(`ev-${DOSAN_EVENT_KEYS[i]}`, DOSAN_EVENT_KEYS[i]);
  const dp = (n, label, html) => layPage(`k-ds${n}`, label, [`k-ds${n}`, ['butter', 'peach', 'sage']], html, { run: false, folio: false });
  const pages = [];
  const c0 = classes[0] || { name: '' };
  pages.push({ ...dp(1, '백지', ''), pairFirst: true });
  // 2쪽: 사진 아래 영어 이름, 그 아래 반 · 원아 이름 (개인 앨범 복사본에서는 이름만 바뀜: k-cname)
  pages.push(dp(2, '표지 사진', dsFrame(pk('cover', 'k-cover'), [43.21, 20.11, 87.43, 83.88], { grow: .4 }) +
    // 사진 · 종이 가운데(65.3%)에 맞추고, 아래 안전선(93%) 안에 두 줄이 들어가도록
    LT([45.3, 87.4, 85.3, 90.1], E('ds-eng', 'DOSAN KINDERGARTEN', 'ds-eng'), 'lcenter') +     // 원본의 잘못된 영어(Dosan Elementary School…)는 배경에서 지움
    LT([45.3, 90.3, 85.3, 92.9], `<div class="ds-who"><span class="ds-who-c">${esc(c0.name)}</span>${kidNames[0] && S.kPersonal ? `<i class="ds-dot"></i><span class="k-cname">${esc(kidNames[0])}</span>` : ''}</div>`, 'lcenter')));
  pages.push(dp(3, '개인 학사모', dsFrame(pk('cap', 'ki-0'), [3.29, 3.80, 94.71, 94.57], { r: 2.6, grow: 0, cls: 'ds-mat' })));
  pages.push(dp(4, '개인 프로필', `
    ${dsFrame(pk('x1', 'ds-4a'), [2.2, 27.75, 19.55, 54.95], { r: 1.9, grow: 0, cls: 'ds-bord' })}
    ${dsFrame(pk('x2', 'ds-4b'), [2.2, 57.92, 19.55, 85.2], { r: 1.9, grow: 0, cls: 'ds-bord' })}
    ${dsFrame(pk('prof', 'ki-1'), [21.36, 4.35, 97.01, 95.65], { r: 2.6, grow: 0, cls: 'ds-mat' })}`));
  // 반마다 5 · 6쪽: 단체사진 두 장 + 원아 16칸 (원아가 적으면 남는 칸은 흰색으로 덮음, 많으면 다음 쪽에)
  classes.forEach((c, ci) => {
    const kids = c.students.map(s => ({ s, i: s.idx ?? 0 }));
    const kidHtml = pg => DOSAN_KIDS.map((slot, n) => ({ slot, n })).filter(x => x.slot.pg === pg).map(({ slot, n }) => {
      const k = kids[n];
      if (!k) return `<div class="ds-empty" style="${lfStyle([slot.b[0] - .3, slot.b[1] - .3, slot.b[2] + .3, slot.b[3] + .3])}"></div>`;
      const cx = (slot.b[0] + slot.b[2]) / 2;
      return dsFrame(`c${ci}-s${k.i}`, slot.b, { r: 1.1, grow: .3, cls: 'ds-kid' }) + LT([cx - 9, slot.ny - 1.9, cx + 9, slot.ny + 1.9], `<div class="ds-name">${esc(k.s.name)}</div>`, 'lcenter');
    }).join('');
    const memo = /하늘/.test(c.name) ? '졸업기념' : '수료기념';      // 하늘반(만5세)은 졸업, 나머지 반은 수료
    // 5쪽 위 제목: 새싹 그림 · 학년도(작게) · 반 이름(굵게) · 수료기념/졸업기념 배지(단체사진 테두리 색)
    const year = `${esc(S.year)}학년도${S.nth ? ` 제${esc(S.nth)}회` : ''}`;
    pages.push(dp(5, `${c.name} 단체 · 원아`, `
      ${LT([7.6, 2.3, 92, 7.9], `<div class="ds-head2"><svg class="ds-sprout" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22V11" stroke="#7FA36E" stroke-width="1.8" stroke-linecap="round"/><path d="M12 13C12 8 8.5 5 3.5 5.5 3.5 10.5 7 13 12 13Z" fill="#9DBE8C"/><path d="M12 11C12 6.5 15.5 3.5 20.5 4 20.5 8.5 17 11 12 11Z" fill="#B9D3A6"/></svg><span class="ds-h-year">${year}</span><span class="ds-h-class">${esc(c.name)}</span><span class="ds-h-badge">${memo}</span><i class="ds-h-line"></i></div>`)}
      ${dsFrame(`c${ci}-g0`, [7.29, 8.61, 92.71, 50.27], { r: 2.2 })}
      ${kidHtml(5)}`));
    pages.push(dp(6, `${c.name} 원아 · 단체`, `
      ${LT([2.6, 9.2, 16.9, 17.6], E(`ds-quote-${ci}`, "Congratulation cheers.\nI keep thinking that\nit's not good bye,\nmy friends!", 'ds-quote'), 'lright')}
      ${kidHtml(6)}
      ${dsFrame(`c${ci}-g1`, [4.39, 50.27, 93.41, 90.13], { r: 2.2 })}`));
    const extra = kids.slice(DOSAN_KIDS.length);      // 16명이 넘으면 원아 사진만 따로
    for (let p = 0; p < Math.ceil(extra.length / K_PER_PAGE); p++) {
      const chunk = extra.slice(p * K_PER_PAGE, p * K_PER_PAGE + K_PER_PAGE);
      const grid = kKidGrid(chunk.length, 8, 84).map(([x, y, s, ch], n) => {
        const { s: st, i } = chunk[n], cx = x + s / 2;
        return dsFrame(`c${ci}-s${i}`, [x, y, x + s, y + ch], { r: 1.1, grow: 0, cls: 'ds-kid' }) + LT([cx - 9, y + ch + .4, cx + 9, y + ch + K_NAME_H], `<div class="ds-name">${esc(st.name)}</div>`, 'lcenter');
      }).join('');
      pages.push(dp(6, `${c.name} 원아 ${p + 2}`, grid));
    }
  });
  // 7 ~ 12쪽 행사 사진 (오른쪽 고리가 왼쪽 고리 뒤로 가도록 순서대로 그림)
  for (let pg = 7; pg <= 12; pg++) {
    const html = DOSAN_EVENTS.map((e, i) => ({ e, i })).filter(x => x.e.pg === pg).map(({ e, i }) =>
      dsFrame(ev(i), e.b, { r: e.t === 'rr' ? dsRadius(e.b, e.fill) : 0, ell: e.t === 'ell', heart: e.t === 'heart', rot: e.rot || 0, grow: e.t === 'rr' ? .1 : .35 })).join('');
    pages.push(dp(pg, `행사 ${pg - 6}`, html + (pg === 10 || pg === 12 ? dsOverlay(pg) : '')));
  }
  return pages;
}

/* ---------- 3 · 4쪽 개인 사진 구도: 얼굴 크기 · 위치를 사진마다 같게 ----------
   기준은 조다원 4쪽에 직접 맞춘 구도 (얼굴이 틀 높이에서 차지하는 비율 h, 얼굴 가운데 높이 y). 직접 옮긴 사진은 건드리지 않음 */
const DS_FRAMING = { cap: { h: .16, y: .25 }, prof: { h: .164, y: .249 }, x1: { h: .15, y: .256 }, x2: { h: .15, y: .256 } };     // 조다원 4쪽처럼: 몸이 크게, 꽃은 아래에 살짝
const DS_THIGH_KEY = /^kp-(cap|prof|x1|x2)\|/;
async function dsThighCrop(key, force = false) {
  const r = photos[key];
  if (!r || (!force && (r.x !== 50 || r.y !== 50 || r.z !== 1))) return false;
  const slot = document.querySelector(`.page:not([data-pid*="~"]) .photo[data-photo="${CSS.escape(key)}"], .photo[data-photo="${CSS.escape(key)}"]`);
  if (!slot?.offsetHeight) return false;
  await loadFaceApi();
  const c = await countFaces(r.blob);
  if (!c.faces || c.fy == null || photos[key] !== r) return false;
  const t = DS_FRAMING[key.slice(3, key.indexOf("|"))] || DS_FRAMING.cap;
  const a = slot.offsetWidth / slot.offsetHeight, ia = r.w / r.h, base = Math.max(a, ia);
  const z = Math.round(Math.min(4, Math.max(1, t.h * ia / (c.fh * base))) * 1000) / 1000, iw = base * z, ih = iw / ia;
  const pos = (v, I, B, at) => (I - B < 1e-6 ? 50 : Math.round(Math.min(100, Math.max(0, (v * I - at * B) / (I - B) * 100)) * 10) / 10);
  Object.assign(r, { z, x: pos(c.fx, iw, a, .5), y: pos(c.fy, ih, 1, t.y), faces: c.faces });
  await DB.put(key, recOf(r));
  applyKey(key);
  return true;
}
window.kOnPhotoSet = key => { if (S.kTemplate === 'dosan' && DS_THIGH_KEY.test(key)) dsThighCrop(key); };
