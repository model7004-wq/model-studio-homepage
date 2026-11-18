'use strict';
/* ============================================================
   졸업앨범 디자이너
   - 수채화: SVG 필터(번짐·가장자리 고임·안료 입자) + 시드 고정 난수 → 매번 같은 결과
   - 판형/블리드 변경 시 @page 크기 자동 설정
   - 문구: localStorage, 사진: IndexedDB(원본 보관 → 인쇄 해상도 유지)
   ============================================================ */

const SIZES = {
  a4:     { name: 'A4 · 국배판 (210×297mm)', w: 210, h: 297 },
  b5:     { name: '4×6배판 (188×257mm)', w: 188, h: 257 },
  large:  { name: '대형 앨범 (240×320mm)', w: 240, h: 320 },
  in810:  { name: '8×10 inch (203×254mm)', w: 203.2, h: 254 },
  in911:  { name: '9×11 inch (229×279mm)', w: 228.6, h: 279.4 },
  in912:  { name: '9×12 inch (229×305mm)', w: 228.6, h: 304.8 },
  in1011: { name: '10×11 inch (254×279mm)', w: 254, h: 279.4 },
  sinsa:  { name: '신사절 (250×315mm)', w: 250, h: 315 },
  square: { name: '정사각 (250×250mm)', w: 250, h: 250 },
};
const BLEED = 3;
/* 학교별 앨범: 첫 앨범(default)은 기존 저장 위치 그대로, 새 앨범은 뒤에 번호를 붙여 따로 저장 */
const PROJECTS_KEY = 'gradAlbum.projects';
const projectList = () => { try { return JSON.parse(localStorage.getItem(PROJECTS_KEY)) || {}; } catch { return {}; } };
const PROJECT_ID = projectList().current || 'default';
const storeKeyOf = id => (id === 'default' ? 'gradAlbum.v1' : `gradAlbum.v1::${id}`);
const dbNameOf = id => (id === 'default' ? 'gradAlbum' : `gradAlbum::${id}`);
const STORE_KEY = storeKeyOf(PROJECT_ID);

const PAL = {
  blush: '#F0B9AE', peach: '#F5CDA3', butter: '#F2DFA4', sage: '#B9D1AF',
  mint: '#B5D8CC', sky: '#B6CFE6', lavender: '#CFC2E3', rose: '#E9B8C8',
  leaf: '#9DBB95', leaf2: '#86A893', leaf3: '#BCCFA6', stem: '#8A9F80', gold: '#C8A465',
};
const LEAVES = [PAL.leaf, PAL.leaf2, PAL.leaf3];
const BLOOMS = [PAL.blush, PAL.peach, PAL.rose, PAL.butter];
const TONES = [
  ['sage', 'butter', 'peach'], ['lavender', 'rose', 'sky'], ['sky', 'mint', 'lavender'],
  ['peach', 'blush', 'butter'], ['rose', 'lavender', 'peach'], ['mint', 'sage', 'sky'],
];

const DEFAULT_ROSTER = `# 6학년 1반 | 김하늘
김서윤 | 수의사 | 늘 웃게 해줘서 고마워!
이도현 | 우주비행사 | 별까지 가 볼게
박하은 | 피아니스트 | 우리 반 최고의 일 년
최준우 | 축구 선수 | 운동장에서 또 만나
정지아 | 웹툰 작가 | 너희를 그림에 담을게
강시우 | 과학자 | 궁금한 건 못 참아
조유나 | 요리사 | 맛있는 거 해줄게
윤건우 | 소방관 | 든든한 친구가 될게
장서아 | 디자이너 | 반짝반짝 빛나자
임하준 | 프로그래머 | 코딩으로 세상을 바꿀래
한지유 | 선생님 | 고마웠어, 1반!
오은찬 | 야구 선수 | 홈런 치고 싶다
서채원 | 사진작가 | 오늘을 오래 기억할게
신우진 | 건축가 | 멋진 집 지어 줄게
권나윤 | 아나운서 | 목소리로 행복을 전할래
황민재 | 로봇 공학자 | 꿈을 향해 출발!
안소율 | 플로리스트 | 꽃처럼 피어나자
송태윤 | 경찰관 | 모두 지켜 줄게
류다인 | 작가 | 우리 이야기를 쓸게
전예준 | 의사 | 아프지 말자, 친구들
홍아린 | 무용가 | 춤추듯 즐겁게
고승민 | 파일럿 | 하늘에서 손 흔들게
문가은 | 동물 사육사 | 다들 보고 싶을 거야
배지호 | 탐험가 | 새로운 세상으로!`;

const DEFAULT_TEACHERS = `교장 | 이정원
교감 | 박선영
교무부장 | 최민호 | 교무
연구부장 | 정수진 | 연구
6학년 부장 | 김하늘 | 6-1 담임
교사 | 이서준 | 6-2 담임
교사 | 한예린 | 6-3 담임
교사 | 오지훈 | 6-4 담임
교사 | 윤가람 | 영어
교사 | 송다은 | 체육
교사 | 임재현 | 과학
교사 | 강하린 | 음악
보건교사 | 문서희 | 보건
사서교사 | 조은비 | 도서관
영양교사 | 배수아 | 급식
행정실장 | 권태호 | 행정실`;

const DEFAULTS = {
  size: 'in912', bleed: true, guides: true, pad4: false, galleryPages: 11, zoom: 0.6, soloShape: 'circle',
  useFlower: true, useStrip: true, useScene: false, useSceneRow: true, useSong: true, useFaculty: false, useVice: false, useInstr: true, msgPages: 3, outdoorPer: 7, galRows: 5, kGroupN: 2, kPersonal: false, kTemplate: 'basic',   // 판 구성
  wrapOn: true, wrapSpine: 12, wrapFold: 15, wrapHinge: 8, wrapBoard: 3,   // 싸바리 표지(mm)
  school: '한빛초등학교', nth: '78', year: '2026', principal: '이정원', vice: '박선영', homeTeacher: '',
  teachers: DEFAULT_TEACHERS,
  roster: DEFAULT_ROSTER,
};

const T = {
  coverMotto: '함께 자라온 여섯 해의 봄',
  principalMsg: '사랑하는 졸업생 여러분, 졸업을 진심으로 축하합니다. 교정에서 함께한 웃음과 배움이 앞으로 걸어갈 길을 밝히는 등불이 되기를 바랍니다. 스스로를 아끼고 곁에 있는 사람을 소중히 여기는 사람으로 자라 주세요. 여러분의 내일을 언제나 응원합니다.',
  teacherProfile: '담당 · 6학년 1반 담임\n좋아하는 것 · 책 읽기와 숲길 산책\n좌우명 · 오늘도 한 걸음씩',
  classMotto: '서로 아끼며 함께 자라는 우리',
  classCaps: ['함께라서 빛났던 우리, 일 년의 기록', '봄날의 교실에서', '마지막 겨울, 다 함께'],
  galleryTitles: ['입학식의 설렘', '봄 현장체험학습', '과학의 날', '봄 운동회', '수학여행', '가을 현장체험학습', '학예회', '졸업식', '여름 물놀이 체험', '겨울 체험 활동'],
  teacherMsg: '일 년 동안 매일 아침 여러분의 얼굴을 보는 것이 선생님의 가장 큰 기쁨이었어요. 서툴러도 끝까지 해내던 모습, 서로를 먼저 챙기던 마음을 오래 기억할게요. 어디서든 반짝일 우리 반, 사랑합니다.',
  rollingCap: '마음을 모아 한 장에 담은 우리의 이야기',
  motto: '바르게 · 슬기롭게 · 튼튼하게',
  emblemDesc: '배움의 빛이 온 누리에 퍼져 나가기를 바라는 마음을 담았습니다.',
  treeName: '느티나무', treeDesc: '넓은 그늘로 모두를 품어 주는 너그러운 마음',
  flowerName: '개나리', flowerDesc: '이른 봄 가장 먼저 피어나는 희망과 기쁨',
  campusCaps: ['햇살 가득한 우리 운동장', '사계절을 함께한 교정 전경'],
  viceMsg: '이 교정에서 보낸 시간은 앞으로의 삶을 받쳐 줄 든든한 뿌리가 될 것입니다. 친구와 함께 웃고 때로는 넘어지며 배운 것들을 소중히 간직하세요. 새로운 곳에서도 호기심과 따뜻한 마음을 잃지 않기를 바랍니다.',
  memoTitle: '기억하고 싶은 이야기',
  songLyrics: '',
};

/* ---------------- 상태 ---------------- */
const $ = s => document.querySelector(s);
let S = { ...DEFAULTS };
let texts = {};
const photos = {};          // key → { url, blob, w, h, x, y, z }
const G = { W: 2160, H: 3030, aspect: 297 / 210 };

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    S = { ...DEFAULTS, ...(raw.settings || {}) };
    texts = raw.texts || {};
  } catch { /* 저장소 사용 불가 시 기본값 */ }
}
let saveTimer;
function saveState() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ settings: S, texts })); } catch {}
  }, 600);      // 빠르게 여러 번 고치면 한 번에 모아 저장
  window.pagePanelSoon?.();
  window.undoNote?.();
}

/* ---------------- IndexedDB (사진) ---------------- */
const DB = {
  db: null,
  open() {
    return new Promise(res => {
      try {
        const r = indexedDB.open(dbNameOf(PROJECT_ID), 1);
        r.onupgradeneeded = () => r.result.createObjectStore('photos');
        r.onsuccess = () => { this.db = r.result; res(); };
        r.onerror = () => res();
      } catch { res(); }
    });
  },
  req(mode, fn) {
    if (!this.db) return Promise.resolve();
    return new Promise(res => {
      const q = fn(this.db.transaction('photos', mode).objectStore('photos'));
      q.onsuccess = () => res(q.result);
      q.onerror = () => res();
    });
  },
  put(k, v) { return this.req('readwrite', s => s.put(v, k)); },
  putQuiet(k, v) { return this.put(k, v); },    // 자동 처리용: 실행취소 단계로 세지 않음 (undo.js)
  drop(k) { return this.req('readwrite', s => s['delete'](k)); },
  wipe() { return this.req('readwrite', s => s['clear']()); },
  all() {
    if (!this.db) return Promise.resolve({});
    return new Promise(res => {
      const out = {};
      const q = this.db.transaction('photos').objectStore('photos').openCursor();
      q.onsuccess = () => { const c = q.result; if (c) { out[c.key] = c.value; c.continue(); } else res(out); };
      q.onerror = () => res(out);
    });
  },
};

/* ---------------- 유틸 ---------------- */
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const f = n => Math.round(n * 10) / 10;
/** Shift를 누른 채 끌면 많이 움직인 쪽(가로 또는 세로)으로만 옮김 */
const axisLock = (e, dx, dy) => (e.shiftKey ? (Math.abs(dx) >= Math.abs(dy) ? [dx, 0] : [0, dy]) : [dx, dy]);
function rngOf(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (arr, r) => arr[Math.floor(r() * arr.length)];
const ordinal = n => { const v = n % 100; return n + (v >= 11 && v <= 13 ? 'TH' : ['TH', 'ST', 'ND', 'RD'][n % 10] || 'TH'); };

/** 편집 가능한 문구 */
function E(key, def, cls = '', tag = 'div') {
  const v = texts[key] ?? def;
  return `<${tag} class="${cls} ml" contenteditable="true" spellcheck="false" data-key="${esc(key)}">${esc(v)}</${tag}>`;
}

const CAMERA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1"><path d="M4 8h3l1.6-2.2h6.8L17 8h3v11H4z"/><circle cx="12" cy="13.2" r="3.6"/></svg>';
/** 사진 칸 */
function P(key, cls = '', alt = '') {
  const inner = alt ? `<span class="ph-alt">${alt}</span>` : `<span class="ph-hint">${CAMERA}PHOTO</span>`;
  return `<div class="photo ${cls}" data-photo="${esc(key)}">${inner}<button class="ph-rot" title="사진 90° 돌리기 (Shift: 반대로)">↻</button><button class="ph-remove" title="사진 빼기">×</button></div>`;
}
/* ============================================================
   수채화 엔진
   ============================================================ */
function defsSVG() {
  const wc = (id, bf, oct, sc, seed, grainF, rim) => `
  <filter id="${id}" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="${bf}" numOctaves="${oct}" seed="${seed}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="${sc}" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="${f(sc * .025)}" result="s"/>
    <feGaussianBlur in="s" stdDeviation="${rim}" result="b"/>
    <feComposite in="s" in2="b" operator="arithmetic" k2="1.2" k3="-0.52" result="r"/>
    <feTurbulence type="fractalNoise" baseFrequency="${grainF}" numOctaves="2" seed="${seed + 9}" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.9 0 0 0 1.32" result="ga"/>
    <feComposite in="r" in2="ga" operator="in"/>
  </filter>`;
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  ${wc('wc0', .0032, 4, 190, 7, .08, 30)}
  ${wc('wc1', .0046, 4, 130, 3, .09, 22)}
  ${wc('wc2', .0068, 3, 85, 17, .1, 14)}
  ${wc('wcm', .013, 3, 34, 5, .14, 7)}
  ${wc('wcs', .035, 3, 12, 11, .22, 3)}
  <filter id="paper" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency=".022" numOctaves="5" seed="4" result="t"/>
    <feDiffuseLighting in="t" lighting-color="#FFFDF8" surfaceScale="1.4" diffuseConstant="1.12">
      <feDistantLight azimuth="45" elevation="58"/>
    </feDiffuseLighting>
  </filter>
  </defs></svg>`;
}

/** 부드러운 불규칙 덩어리 (Catmull-Rom → Bézier) */
function blobD(cx, cy, r, rng, { n = 11, j = .34, sx = 1, sy = 1 } = {}) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (rng() - .5) * .35;
    const rr = r * (1 - j / 2 + rng() * j);
    pts.push([cx + Math.cos(a) * rr * sx, cy + Math.sin(a) * rr * sy]);
  }
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d + 'Z';
}

/** 겹겹이 올린 수채 번짐 (글레이징 3단) */
function washes(list, W, H, rng) {
  const g = ['', '', ''];
  for (const w of list) {
    const c = PAL[w.c] || w.c, a = w.a ?? 1, R = w.r * W, cx = w.x * W, cy = w.y * H;
    const sx = 1 + rng() * .35, sy = .75 + rng() * .3;
    g[0] += `<path d="${blobD(cx, cy, R, rng, { sx, sy })}" fill="${c}" fill-opacity="${(.62 * a).toFixed(2)}"/>`;
    g[1] += `<path d="${blobD(cx + (rng() - .5) * R * .5, cy + (rng() - .5) * R * .4, R * .66, rng, { sx, sy })}" fill="${c}" fill-opacity="${(.5 * a).toFixed(2)}"/>`;
    g[2] += `<path d="${blobD(cx + (rng() - .5) * R * .5, cy + (rng() - .5) * R * .5, R * .36, rng, { n: 9 })}" fill="${c}" fill-opacity="${(.42 * a).toFixed(2)}"/>`;
  }
  return g.map((s, i) => `<g filter="url(#wc${i})" style="mix-blend-mode:multiply">${s}</g>`).join('');
}

/** 물감 튄 자국 */
function splatter(list, W, H, rng, count) {
  let s = '';
  for (let i = 0; i < count && list.length; i++) {
    const w = pick(list, rng);
    const ang = rng() * Math.PI * 2, dist = w.r * W * (.7 + rng() * .7);
    const x = w.x * W + Math.cos(ang) * dist, y = w.y * H + Math.sin(ang) * dist;
    s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(W * (.0018 + rng() * .006))}" fill="${PAL[w.c] || w.c}" fill-opacity="${(.45 + rng() * .3).toFixed(2)}"/>`;
  }
  return `<g filter="url(#wcs)" style="mix-blend-mode:multiply">${s}</g>`;
}

function leafPath(L, w = .3) {
  return `M0,0 C${f(L * .28)},${f(-L * w)} ${f(L * .72)},${f(-L * w * .8)} ${f(L)},0 C${f(L * .72)},${f(L * w * .8)} ${f(L * .28)},${f(L * w)} 0,0Z`;
}
function leafEl(x, y, L, deg, col, op, round) {
  const tr = `transform="translate(${f(x)},${f(y)}) rotate(${f(deg)})"`;
  return round
    ? `<ellipse cx="${f(L * 1.05)}" cy="0" rx="${f(L)}" ry="${f(L * .86)}" ${tr} fill="${col}" fill-opacity="${op}"/>`
    : `<path d="${leafPath(L)}" ${tr} fill="${col}" fill-opacity="${op}"/>`;
}

/** 수채화 잎가지 */
function sprig(x, y, len, ang, rng, o = {}) {
  const n = o.n || 9, round = !!o.round, bend = o.bend ?? (.14 + rng() * .1) * (rng() < .5 ? -1 : 1);
  const a = ang * Math.PI / 180, ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
  const mx = (x + ex) / 2 - Math.sin(a) * len * bend, my = (y + ey) / 2 + Math.cos(a) * len * bend;
  const B = t => [(1 - t) ** 2 * x + 2 * (1 - t) * t * mx + t * t * ex, (1 - t) ** 2 * y + 2 * (1 - t) * t * my + t * t * ey];
  const Tn = t => Math.atan2(2 * (1 - t) * (my - y) + 2 * t * (ey - my), 2 * (1 - t) * (mx - x) + 2 * t * (ex - mx)) * 180 / Math.PI;
  let s = `<path d="M${f(x)},${f(y)} Q${f(mx)},${f(my)} ${f(ex)},${f(ey)}" fill="none" stroke="${PAL.stem}" stroke-width="${f(len * .011)}" stroke-linecap="round" stroke-opacity=".8"/>`;
  for (let k = 0; k < n; k++) {
    const t = .12 + .8 * k / Math.max(1, n - 1);
    const [px, py] = B(t);
    const side = k % 2 ? 1 : -1;
    const L = len * (round ? .12 : .24) * (1 - .45 * t) * (.85 + rng() * .3);
    const d = Tn(t) + side * (round ? 62 + rng() * 14 : 32 + rng() * 16);
    s += leafEl(px, py, L, d, o.col || pick(o.cols || LEAVES, rng), (.55 + rng() * .35).toFixed(2), round);
  }
  const [tx, ty] = B(1);
  s += leafEl(tx, ty, len * (round ? .08 : .15), Tn(1), o.col || pick(LEAVES, rng), .75, round);
  return `<g filter="url(#wcs)" style="mix-blend-mode:multiply">${s}</g>`;
}

/** 수채화 꽃 */
function flower(x, y, r, rng, col) {
  col = PAL[col] || col || pick(BLOOMS, rng);
  const rot = rng() * 72;
  let s = '';
  for (let i = 0; i < 5; i++) {
    s += `<ellipse cx="${f(r * .52)}" cy="0" rx="${f(r * .52)}" ry="${f(r * .36)}" transform="translate(${f(x)},${f(y)}) rotate(${f(rot + i * 72 + (rng() - .5) * 10)})" fill="${col}" fill-opacity="${(.5 + rng() * .25).toFixed(2)}"/>`;
  }
  for (let i = 0; i < 5; i++) {
    s += `<ellipse cx="${f(r * .3)}" cy="0" rx="${f(r * .3)}" ry="${f(r * .18)}" transform="translate(${f(x)},${f(y)}) rotate(${f(rot + 36 + i * 72)})" fill="${col}" fill-opacity=".45"/>`;
  }
  for (let i = 0; i < 6; i++) {
    const a = rng() * Math.PI * 2, d = rng() * r * .16;
    s += `<circle cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d)}" r="${f(r * (.05 + rng() * .05))}" fill="${PAL.gold}" fill-opacity=".85"/>`;
  }
  return `<g filter="url(#wcs)" style="mix-blend-mode:multiply">${s}</g>`;
}

/** 원형 화관 (좌우 두 줄기 + 아래 꽃송이) */
function wreath(cx, cy, R, rng, o = {}) {
  let s = '';
  const N = o.n || 20;
  const branch = (a0, a1) => {
    const P = a => [cx + R * Math.cos(a * Math.PI / 180), cy + R * Math.sin(a * Math.PI / 180)];
    const [sx, sy] = P(a0), [ex, ey] = P(a1);
    let g = `<path d="M${f(sx)},${f(sy)} A${R},${R} 0 0 ${a1 > a0 ? 1 : 0} ${f(ex)},${f(ey)}" fill="none" stroke="${PAL.stem}" stroke-width="${f(R * .008)}" stroke-opacity=".75"/>`;
    for (let k = 0; k < N; k++) {
      const t = k / (N - 1), a = a0 + (a1 - a0) * t, [px, py] = P(a);
      const tang = a + (a1 > a0 ? 90 : -90);
      const round = k % 5 === 2;
      for (const side of [-1, 1]) {
        if (rng() < .12) continue;
        const L = R * (round ? .07 : .15) * (1 - .45 * t) * (.85 + rng() * .3);
        g += leafEl(px, py, L, tang + side * (round ? 70 : 30 + rng() * 18), pick(LEAVES, rng), (.55 + rng() * .35).toFixed(2), round);
      }
    }
    g += leafEl(ex, ey, R * .1, a1 + (a1 > a0 ? 90 : -90), PAL.leaf, .8, false);
    return `<g filter="url(#wcs)" style="mix-blend-mode:multiply">${g}</g>`;
  };
  s += branch(104, 258) + branch(76, -78);
  if (o.flowers ?? true) {
    const at = (a, r, c) => flower(cx + R * Math.cos(a * Math.PI / 180), cy + R * Math.sin(a * Math.PI / 180), R * r, rng, c);
    s += at(90, .11, PAL.blush) + at(78, .075, PAL.peach) + at(103, .08, PAL.rose) + at(66, .045, PAL.butter) + at(116, .05, PAL.peach);
    s += at(205, .05, PAL.blush) + at(-25, .05, PAL.rose) + at(250, .035, PAL.peach) + at(-70, .035, PAL.blush);
  }
  return s;
}
/* ---------------- 페이지 배경 ---------------- */
function bgSpec(kind, tone) {
  const [t0, t1, t2] = tone;
  switch (kind) {
    case 'cover': return {
      w: [{ x: .9, y: .04, r: .42, c: 'blush' }, { x: .66, y: -.03, r: .22, c: 'peach' }, { x: .04, y: .1, r: .3, c: 'peach', a: .8 },
          { x: .06, y: .97, r: .44, c: 'sage' }, { x: .38, y: 1.03, r: .24, c: 'butter' }, { x: .97, y: .9, r: .34, c: 'lavender' },
          { x: .5, y: .45, r: .3, c: 'butter', a: .28 }, { x: .99, y: .45, r: .12, c: 'rose', a: .7 }],
      s: [[.03, .3, .32, -58, {}], [.06, .27, .22, -18, { round: true }], [.97, .72, .3, 122, {}], [.94, .76, .2, 168, { round: true }]],
      fl: [[.06, .29, .04, 'blush'], [.1, .31, .025, 'peach'], [.95, .73, .038, 'peach'], [.91, .71, .022, 'rose']],
      sp: 18,
    };
    case 'center': return {
      w: [{ x: .5, y: .44, r: .4, c: t0, a: .5 }, { x: .36, y: .56, r: .24, c: t1, a: .45 }, { x: .66, y: .36, r: .22, c: t2, a: .45 },
          { x: .02, y: .02, r: .2, c: t1, a: .7 }, { x: .98, y: .98, r: .22, c: t0, a: .7 }],
      s: [[.98, .06, .2, 150, { round: true }], [.02, .94, .2, -30, {}]], fl: [], sp: 10,
    };
    case 'top': return {
      w: [{ x: .08, y: -.04, r: .28, c: t0 }, { x: .48, y: -.08, r: .3, c: t1, a: .75 }, { x: .93, y: -.03, r: .3, c: t2 },
          { x: 1.02, y: 1.02, r: .2, c: t0, a: .65 }, { x: -.02, y: 1.02, r: .18, c: t1, a: .6 }],
      s: [[.99, .1, .2, 160, { round: true }]], fl: [[.975, .085, .022, null]], sp: 10,
    };
    case 'side': return {
      w: [{ x: -.04, y: .2, r: .28, c: t0 }, { x: -.06, y: .58, r: .26, c: t1, a: .8 }, { x: .02, y: .95, r: .3, c: t2 },
          { x: 1.03, y: .05, r: .22, c: t1, a: .7 }],
      s: [[.02, .4, .24, -40, {}], [.98, .08, .16, 150, { round: true }]], fl: [[.025, .41, .03, null]], sp: 12,
    };
    default: return { // soft
      w: [{ x: 0, y: 0, r: .38, c: t0 }, { x: .2, y: -.03, r: .2, c: t1, a: .7 }, { x: 1, y: 1, r: .4, c: t2 },
          { x: .78, y: 1.03, r: .22, c: t0, a: .7 }],
      s: [[.02, .17, .24, -30, {}], [.98, .86, .24, 200, {}]], fl: [[.04, .165, .03, null], [.965, .86, .028, null]], sp: 12,
    };
  }
}
function bgSVG(kind, tone, seed) {
  if (String(kind).startsWith('k-')) return kinderBg(kind, tone, seed);     // 유치원앨범 배경 (kinder.js)
  const themed = themeBg(kind, tone, seed);
  if (themed) return themed;
  const { W, H } = G, rng = rngOf(seed), p = bgParts(kind, tone, rng);
  let s = `<rect width="${W}" height="${H}" fill="#FCF8F1"/>${p.wash}${p.top}`;
  s += `<rect width="${W}" height="${H}" filter="url(#paper)" opacity=".42" style="mix-blend-mode:multiply"/>`;
  return `<svg class="bg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${s}</svg>`;
}
/** 기본 파스텔 배경 조각: 번짐(wash) · 잎가지와 꽃(top) */
function bgParts(kind, tone, rng) {
  const { W, H } = G, sp = bgSpec(kind, tone);
  let top = '';
  for (const [x, y, len, ang, o] of sp.s) top += sprig(x * W, y * H, len * W, ang, rng, o);
  for (const [x, y, r, c] of sp.fl) top += flower(x * W, y * H, r * W, rng, c);
  return { wash: washes(sp.w, W, H, rng) + splatter(sp.w, W, H, rng, sp.sp), top };
}
/** 기본 파스텔 펼침면: 두 쪽을 한 장의 넓은 그림으로 그려 반씩 나눠 씀 → 가운데에서 번짐이 끊기지 않고 이어짐.
    오른쪽 쪽은 재단선이 왼쪽 쪽 재단선에 닿도록 도련 두 개만큼 겹쳐 놓음. 반환: [왼쪽 svg, 오른쪽 svg] 또는 null */
function spreadBgPair(a, b, seedA, seedB) {
  if (S.spreadBg === false || S.albumType === 'kinder' || themeNow().bg) return null;
  if ([a.bg[0], b.bg[0]].some(k => String(k).startsWith('k-'))) return null;
  const { W, H } = G, bp = (S.bleed ? BLEED : 0) * 10, ox = W - 2 * bp, SW = W + ox;
  const pa = bgParts(a.bg[0], a.bg[1], rngOf(seedA)), pb = bgParts(b.bg[0], b.bg[1], rngOf(seedB));
  // 가운데를 잇는 번짐: 양쪽 색을 섞어 위 · 아래 중 한두 곳에 걸쳐 둠 (W 기준 크기)
  const rng = rngOf(seedA * 7 + seedB), gx = (W - bp) / W, ta = a.bg[1], tb = b.bg[1];
  const bridge = [{ x: gx, y: .08 + rng() * .12, r: .2, c: ta[0], a: .5 }, { x: gx, y: .8 + rng() * .12, r: .22, c: tb[2] || tb[0], a: .5 }];
  if (rng() < .5) bridge.push({ x: gx, y: .45 + rng() * .1, r: .1, c: ta[1] || ta[0], a: .3 });
  const R = `<g transform="translate(${ox},0)">`;
  let s = `<rect width="${SW}" height="${H}" fill="#FCF8F1"/>${pa.wash}${R}${pb.wash}</g>${washes(bridge, W, H, rng)}${pa.top}${R}${pb.top}</g>`;
  s += `<rect width="${SW}" height="${H}" filter="url(#paper)" opacity=".42" style="mix-blend-mode:multiply"/>`;
  const svg = x => `<svg class="bg" viewBox="${x} 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${s}</svg>`;
  return [svg(0), svg(ox)];
}

/** 이름 아래 붓터치 */
function brushStroke(col, seed) {
  const r = rngOf(seed);
  const y1 = 22 + r() * 6, y2 = 16 + r() * 8;
  return `<svg viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true"><g filter="url(#wcs)" style="mix-blend-mode:multiply"><path d="M8,${f(y1)} C60,${f(y2)} 130,${f(y1 + 4)} 192,${f(y2 + 2)}" stroke="${col}" stroke-width="15" stroke-linecap="round" fill="none" stroke-opacity=".55"/></g></svg>`;
}
/** 메모 카드 배경 */
function noteWash(col, seed) {
  const r = rngOf(seed);
  return `<svg viewBox="0 0 400 240" preserveAspectRatio="none" aria-hidden="true"><g filter="url(#wcm)" style="mix-blend-mode:multiply">
    <path d="${blobD(200, 120, 150, r, { sx: 1.25, sy: .66, j: .16, n: 13 })}" fill="${col}" fill-opacity=".42"/>
    <path d="${blobD(150 + r() * 100, 110 + r() * 30, 70, r, { sx: 1.3, sy: .7 })}" fill="${col}" fill-opacity=".3"/>
  </g></svg>`;
}

/* ============================================================
   명단 파싱
   ============================================================ */
function parseRoster(text) {
  const classes = [];
  let cur = null, team = '';
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('##')) { team = line.slice(2).trim(); continue; }     // '## 1조' 아래 학생은 그 조
    if (line.startsWith('#')) {
      const [name, teacher] = line.slice(1).split('|').map(s => s.trim());
      cur = { name: name || `${classes.length + 1}반`, teacher: teacher || '', students: [] };
      classes.push(cur);
      team = '';
      continue;
    }
    if (!cur) { cur = { name: '6학년 1반', teacher: '', students: [] }; classes.push(cur); }
    const [name, dream, msg] = line.split(/\s*[|\t]\s*/);
    cur.students.push({ name: name || '', dream: dream || '', msg: msg || '', team });
  }
  return classes.length ? classes : [{ name: '6학년 1반', teacher: '', students: [] }];
}

/* ============================================================
   페이지 구성
   1쪽(대표 단체사진) 단독, 이후 짝수(왼쪽) · 홀수(오른쪽) 펼침면
   ============================================================ */
const SAFE_H = () => G.aspect * 100 - 14;      // 안전영역 높이(cqw)
const HEAD_H = 16.4;                            // 작은 머리 제목 + 간격

function maxRows(cols, cg, cap, avail) {
  const colW = (86 - (cols - 1) * cg) / cols;
  return Math.max(0, Math.floor((avail + 3) / (cap + colW * 1.25 * .78 + 3)));
}
function cardSize(cols, cg, cap, rows, avail) {
  const colW = (86 - (cols - 1) * cg) / cols;
  const ph = Math.min((avail - 3 * (rows - 1)) / rows - cap, colW * 1.25);
  return { pw: ph * .8, ph };
}
const smallest = arr => arr.reduce((a, b) => (b.ph < a.ph ? b : a));
/** 줄 수를 페이지별 용량 안에서 고르게 나눔 */
function spreadRows(total, caps) {
  const rows = caps.map(() => 0);
  for (let r = 0; r < total; r++) {
    let best = -1;
    caps.forEach((c, i) => { if (rows[i] < c && (best < 0 || rows[i] < rows[best])) best = i; });
    if (best < 0) break;
    rows[best]++;
  }
  return rows;
}
const gridStyle = (rows, cols, cg, sz) => `--rows:${Math.max(1, rows)};--cols:${cols};--cg:${cg}cqw;--pw:${f(sz.pw)}cqw;--ph:${f(sz.ph)}cqw`;
const ttl = (script, title) => `<div class="ttl"><div class="script">${script}</div><h2 class="h-ko">${title}</h2><div class="rule"></div></div>`;
const head = (script, title) => `<div class="stu-head"><div class="script">${script}</div><div class="h-ko sm">${title}</div><div class="rule"></div></div>`;
function emblemAlt() { return `<b class="gold">${esc((S.school || '학')[0])}</b>`; }

/* 1쪽 — 대표 단체사진 */
function coverPage() {
  return {
    kind: 'cover', label: '대표 단체사진', bg: ['cover', TONES[0]], run: false, folio: false,
    html: `<div class="cover-frame"></div>
    <div class="cover-in">
      <div class="emblem">${P('sym-emblem', 'contain', emblemAlt())}</div>
      <div class="eyebrow">THE ${esc(ordinal(parseInt(S.nth, 10) || 1))} GRADUATION ALBUM</div>
      <div class="cover-year"><div class="year gold">${esc(S.year).replace(/[^\d\s.]+/g, m => `<span class="year-unit">${m}</span>`)}</div><div class="script">Graduation</div></div>
      <div class="ko-title">졸업앨범</div>
      <div class="cover-school">${esc(S.school)}</div>
      <div class="cover-photo">${P('cover-group')}</div>
      ${E('coverMotto', T.coverMotto, 'cover-motto')}
    </div>`,
  };
}

/* 2–3쪽 — 학교 전경 (교표 · 교훈 · 교목 · 교화는 5쪽 상징 쪽에 있음) */
function campusPages() {
  const shot = i => `<div class="group"><div class="gframe">${P(`campus-${i}`)}</div>${E(`campus-cap-${i}`, T.campusCaps[i], 'cap')}</div>`;
  // 큰 사진 아래 작은 풍경 줄: 가로 사진(wide)은 남는 폭을 채우고 세로 사진은 3:4 칸
  const rowH = Math.min(24, (SAFE_H() - 36) * .3);
  const sceneRow = cells => S.useSceneRow === false ? "" : `<div class="campus-row" style="--rh:${f(rowH)}cqw">${cells.map(([k, wide]) => `<div class="cr-cell${wide ? ' wide' : ''}">${P(`campus-x${k}`)}</div>`).join('')}</div>`;
  return [{
    kind: 'campus', label: '학교 전경', bg: ['side', ['sky', 'sage', 'butter']],
    html: `<div class="col">
      ${ttl('Our Campus', '우리 학교')}
      ${shot(0)}
      ${sceneRow([[0], [1, true], [2]])}
    </div>`,
  }, {
    kind: 'campus', label: '교정 풍경', bg: ['soft', ['sage', 'butter', 'sky']],
    html: `<div class="col">
      ${ttl('Seasons on Campus', '교정 풍경')}
      ${shot(1)}
      ${sceneRow([[3, true], [4]])}
    </div>`,
  }];
}

/* 5쪽은 pdf-layout.js */
/* 4쪽 — 교장 · 교감 선생님 (각 2장) */
function leadersPage() {
  const band = (key, en, role, name, msgKey, msg, mirror) => `
    <div class="leader${mirror ? ' mirror' : ''}">
      <div class="oval l-oval">${P(key)}</div>
      <div class="l-text">
        <div class="en-cap">${en}</div>
        <div class="l-name"><small>${role}</small>${esc(name)}</div>
        ${E(msgKey, msg, 'l-msg')}
      </div>
      <div class="l-sub">${P(key + '-2')}</div>
    </div>`;
  if (S.useVice === false) return {     // 교감 선생님이 없는 학교: 그 자리에 단체사진
    kind: 'leaders', label: '교장 선생님 · 단체사진', bg: ['soft', ['peach', 'butter', 'lavender']],
    html: `<div class="col leader-solo">
      ${ttl('With Gratitude', '교장 선생님')}
      ${band('principal', 'Principal', '교장', S.principal, 'principalMsg', T.principalMsg, false)}
      <div class="leader-div"></div>
      <div class="group"><div class="gframe">${P('leader-group')}</div></div>
    </div>`,
  };
  return {
    kind: 'leaders', label: '교장 · 교감 선생님', bg: ['soft', ['peach', 'butter', 'lavender']],
    html: `<div class="col even">
      ${ttl('With Gratitude', '교장 · 교감 선생님')}
      ${band('principal', 'Principal', '교장', S.principal, 'principalMsg', T.principalMsg, false)}
      <div class="leader-div"></div>
      ${band('vice', 'Vice Principal', '교감', S.vice, 'viceMsg', T.viceMsg, true)}
    </div>`,
  };
}

/* 5쪽 — 선생님들 사진 · 명렬 (가능하면 한 쪽에 모두) */
function facultyPages(list) {
  // 틀이 가장 커지는 열 수를 고름. 한 쪽에 넣어 틀이 너무 작아지면 쪽을 늘림
  const cap = 5.2, cg = 2.4, rg = 1.6, minPh = 10, avail = SAFE_H() - HEAD_H, n = Math.max(1, list.length);
  const fit = (cols, count) => {
    const rows = Math.ceil(count / cols), colW = (86 - (cols - 1) * cg) / cols;
    return { cols, ph: Math.min((avail - rg * (rows - 1)) / rows - cap, colW * 1.25) };
  };
  let total = 0, best;
  do {
    total++;
    best = [4, 5, 6, 7, 8].map(c => fit(c, Math.ceil(n / total))).reduce((a, b) => (b.ph > a.ph ? b : a));
  } while (best.ph < minPh && total < 4);
  const cols = best.cols, per = Math.ceil(n / total), sz = { pw: best.ph * .8, ph: best.ph };
  return Array.from({ length: total }, (_, p) => {
    const chunk = list.slice(p * per, (p + 1) * per);
    const cards = chunk.map((t, i) => `
      <figure class="stu fac">
        <div class="arch-frame">${P(teacherKey(t, p * per + i), 'arch')}</div>
        <figcaption>
          <div class="fac-role">${esc(t.role)}${t.dept ? ` · ${esc(t.dept)}` : ''}</div>
          <div class="fac-name">${esc(t.name)}</div>
        </figcaption>
      </figure>`).join('');
    return {
      kind: 'faculty', label: `선생님들${total > 1 ? ` ${p + 1}/${total}` : ''}`, bg: ['top', ['butter', 'peach', 'sage']],
      html: `<div class="col">${head('Our Teachers', '함께해 주신 선생님들')}
        <div class="stu-grid fac-grid c${cols}" style="${gridStyle(Math.ceil(chunk.length / cols), cols, cg, sz)}">${cards}</div></div>`,
    };
  });
}

/* 6쪽~ 반 · 학생 쪽은 pdf-layout.js */

/* 12–13쪽 — 교정 곳곳 단체사진: 쪽마다 가로 3장 · 가로 1장 + 세로 1장 (좌우 쪽은 거울 배치) */
function scenePages() {
  if (S.useScene === false) return [];
  const cell = (i, cls = '') => `<div class="sc-cell ${cls}">${P(`scene-${i}`)}</div>`;
  return [0, 1].map(p => {
    const s = p * 5;
    return {
      kind: 'scene', label: `교정 곳곳 단체사진 ${p + 1}/2`, bg: [p ? 'soft' : 'side', ['sage', 'sky', 'butter']],
      html: `<div class="col">${head('Around the School', E(`scene-title-${p}`, p ? '함께 걷던 교정' : '교정 곳곳에서', 'gal-title', 'span'))}
        <div class="scene-grid${p ? ' mirror' : ''}">
          <div class="sc-col">${cell(s)}${cell(s + 1)}${cell(s + 2)}</div>
          <div class="sc-col">${cell(s + 3)}${cell(s + 4, 'tall')}</div>
        </div></div>`,
    };
  });
}

/* 14쪽~ — 행사 사진 갤러리 (한 쪽에 12장) */
const GALLERY_MAX = 40, GALLERY_PER = 12;   // 최대 쪽수, 한 쪽 사진 수
const galleryCount = () => Math.min(GALLERY_MAX, Math.max(1, parseInt(S.galleryPages, 10) || 8));

const galleryTitleDef = p => T.galleryTitles[p % T.galleryTitles.length];
/** 저장된 쪽을 행사별로 묶음: 제목 끝이 ' (2)' 꼴이면 앞 행사가 이어지는 쪽 */
function galleryEvents() {
  const pages = Math.max(galleryCount(), ...Object.keys(photos).filter(isGalKey).map(k => parseInt(k.slice(1), 10) + 1));
  const events = [];
  for (let p = 0; p < pages; p++) {
    const keys = [];
    for (let k = 0; k < GALLERY_PER; k++) if (photos[`g${p}-${k}`]) keys.push(`g${p}-${k}`);
    if (!keys.length) continue;
    const titleKey = `gal-title-${p}`, def = galleryTitleDef(p), last = events[events.length - 1];
    if (last && /\s\(\d+\)$/.test(String(texts[titleKey] ?? def))) last.keys.push(...keys);
    else events.push({ titleKey, def, keys });
  }
  return events;
}
/** 다음 사진이 들어갈 자리: 마지막 저장 쪽의 빈 칸, 꽉 찼으면 같은 행사의 다음 쪽 */
function galleryAddSlot() {
  const p = Math.max(0, ...Object.keys(photos).filter(isGalKey).map(k => parseInt(k.slice(1), 10)));
  for (let k = 0; k < GALLERY_PER; k++) if (!photos[`g${p}-${k}`]) return `g${p}-${k}`;
  if (p + 1 >= GALLERY_MAX) return null;
  const title = String(texts[`gal-title-${p}`] ?? galleryTitleDef(p)).replace(/\s*\(\d+\)$/, '');
  texts[`gal-title-${p + 1}`] = `${title} (2)`;
  return `g${p + 1}-0`;
}
/* 인물이 1명인 행사 사진 → 작은 원형 또는 육각형 틀 (얼굴 인식은 브라우저 안에서만) */
const SHAPE_ASP = { circle: 1, hex: .866 };
const SHAPE_ORDER = ['auto', 'circle', 'hex', 'rect'];
const SHAPE_LABEL = { auto: '자동', circle: '원형', hex: '육각', rect: '사각' };
function galShape(r) {
  if (r.shape && r.shape !== 'auto') return r.shape;
  return isSolo(r) && S.soloShape !== 'rect' ? (S.soloShape || 'circle') : 'rect';
}
/** 정말 1명인 사진: 약하게 잡힌 얼굴까지 합쳐 1개이고, 그 얼굴이 사진 높이의 10% 이상 (아직 다시 확인 전이면 옛 값으로 판단) */
const SOLO_MIN_FACE = .1;
const isSolo = r => r.solo ?? (r.faces === 1 && (r.fh || 0) >= SOLO_MIN_FACE);
/** 틀 가운데에 인물이 오도록 위치 조정 (사용자가 아직 옮기지 않은 사진만) */
function centerOnFace(r, a) {
  if (r.fx == null || r.x !== 50 || r.y !== 50 || r.z !== 1) return;
  const ia = r.w / r.h, iw = Math.max(a, ia), ih = iw / ia;     // 틀 높이 1 기준 사진 크기
  const pos = (f, I, B) => I - B < 1e-6 ? 50 : Math.min(100, Math.max(0, (f * I - B / 2) / (I - B) * 100));
  r.x = Math.round(pos(r.fx, iw, a)); r.y = Math.round(pos(r.fy, ih, 1));
}
const FACE_LIB = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14';
let faceApi = null;
function loadFaceApi() {
  return faceApi ||= new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = `${FACE_LIB}/dist/face-api.js`;
    s.onload = () => faceapi.nets.ssdMobilenetv1.loadFromUri(`${FACE_LIB}/model`).then(res, rej);
    s.onerror = () => rej(new Error('인물 인식 기능을 불러오지 못했습니다. 인터넷 연결을 확인하세요.'));
    document.head.appendChild(s);
  }).catch(e => { faceApi = null; throw e; });
}
/** 사진 속 인물 수: 뚜렷한 얼굴 중 가장 큰 얼굴의 40% 이상 크기만 셈 (뒤쪽의 작은 얼굴은 제외).
    solo는 행사 사진 원형틀 기준: 약하게 잡힌 얼굴까지 세어 정확히 1개이고 얼굴이 충분히 클 때만 */
async function countFaces(blob) {
  const bm = await createImageBitmap(blob);
  const k = Math.min(1, 1600 / Math.max(bm.width, bm.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(bm.width * k); cv.height = Math.round(bm.height * k);
  cv.getContext('2d').drawImage(bm, 0, 0, cv.width, cv.height); bm.close();
  const det = await faceapi.detectAllFaces(cv, new faceapi.SsdMobilenetv1Options({ minConfidence: .25 }));
  const boxes = det.filter(d => d.score >= .5).map(d => d.box), big = Math.max(0, ...boxes.map(b => b.width));
  const main = boxes.filter(b => b.width >= big * .4);
  const c = main.length === 1 ? main[0] : null;
  const fh = c ? c.height / cv.height : undefined;
  return { faces: main.length, solo: det.length === 1 && !!c && fh >= SOLO_MIN_FACE, fx: c ? (c.x + c.width / 2) / cv.width : undefined, fy: c ? (c.y + c.height / 2) / cv.height : undefined, fh };
}
/** 눈 위치: ed는 사진 폭 대비 눈 사이 거리, ex·ey는 두 눈 가운데 (위치 계산에만 씀, 사람을 알아보는 데 쓰지 않음) */
const ID_EYE_GAP = .1524, ID_EYE_Y = .36;     // 틀 높이 대비 눈 사이 거리 · 눈높이
let eyeNet = null;
async function eyeLine(blob) {
  await loadFaceApi();
  await (eyeNet ||= faceapi.nets.faceLandmark68Net.loadFromUri(`${FACE_LIB}/model`).catch(e => { eyeNet = null; throw e; }));
  const bm = await createImageBitmap(blob), k = Math.min(1, 1600 / Math.max(bm.width, bm.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(bm.width * k); cv.height = Math.round(bm.height * k);
  const g = cv.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
  g.drawImage(bm, 0, 0, cv.width, cv.height); bm.close();
  const dets = await faceapi.detectAllFaces(cv, new faceapi.SsdMobilenetv1Options({ minConfidence: .3 })).withFaceLandmarks();
  const d = dets.sort((a, b) => b.detection.box.width - a.detection.box.width)[0];
  if (!d) return null;
  const mid = a => ({ x: a.reduce((s, p) => s + p.x, 0) / a.length, y: a.reduce((s, p) => s + p.y, 0) / a.length });
  const L = mid(d.landmarks.getLeftEye()), R = mid(d.landmarks.getRightEye());
  return { ed: Math.hypot(R.x - L.x, R.y - L.y) / cv.width, ex: (L.x + R.x) / 2 / cv.width, ey: (L.y + R.y) / 2 / cv.height };
}
const faceQueue = [];
let faceBusy = false;
function queueFaces(keys) {
  for (const k of keys) if (!faceQueue.includes(k)) faceQueue.push(k);
  if (!faceBusy) runFaces();
}
async function runFaces() {
  faceBusy = true;
  const info = $('#g-info');
  try {
    await loadFaceApi();
    let done = 0;
    while (faceQueue.length) {
      const key = faceQueue.shift(), r = photos[key];
      if (!r) continue;
      if (faceQueue.length + done > 3) info.textContent = `인물 수 확인 중… ${++done}장 (남은 ${faceQueue.length}장)`;
      try {
        const wasSolo = galShape(r) !== 'rect' && !r.shape;
        Object.assign(r, await countFaces(r.blob));
        if (photos[key] !== r) continue;          // 확인하는 사이 사진이 바뀌거나 옮겨짐
        if (isSolo(r)) centerOnFace(r, SHAPE_ASP[galShape(r)] || 1);
        else if (wasSolo && r.z === 1) { r.x = 50; r.y = 50; }   // 원형틀에서 사각으로 돌아오면 얼굴 맞춤을 풀고 사진 전체가 보이게
        await DB.putQuiet(key, recOf(r));
        relayoutGallery(key);
      } catch (e) { console.warn('인물 인식 실패', key, e); }
    }
    if (done) info.textContent = `인물 수 확인 완료 · 1명인 사진 ${Object.keys(photos).filter(k => isGalKey(k) && isSolo(photos[k])).length}장`;
  } catch (e) { info.textContent = e.message; faceQueue.length = 0; }
  faceBusy = false;
}

/** 사진이 늘거나 줄면 콜라주 자리를 다시 나누고, 아니면 그 칸만 고침 */
let galBulk = false, galFlowTimer;
function relayoutGallery(key) {
  const el = document.querySelector(`.photo[data-photo="${CSS.escape(key)}"]`);
  if (el && galKeySig() === galSig) { applyPhoto(el); return; }
  if (galBulk) return;
  clearTimeout(galFlowTimer);
  galFlowTimer = setTimeout(render, 150);
}

/* 마지막 — 롤링페이퍼 (쪽 배치는 pdf-layout.js) */
const rollingKey = i => (i ? `rolling-${i + 1}` : 'rolling'), isRollingKey = k => /^rolling(-\d+)?$/.test(k);
const rollingCount = () => Math.min(6, Math.max(1, parseInt(S.msgPages, 10) || 1));
function memoPage(i) {
  return {
    kind: 'memo', label: '메모', bg: ['soft', TONES[(i + 2) % TONES.length]],
    html: `<div class="col">
      <div class="ttl"><div class="script">Notes</div>${E(`memo-${i}`, T.memoTitle, 'h-ko sm')}<div class="rule"></div></div>
      <div class="lines"></div>
    </div>`,
  };
}

/* ============================================================
   렌더링
   ============================================================ */
let studentKeys = [], flowerKeys = [], outdoorKeys = [], outdoorStripKeys = [], teacherKeys = [], galleryKeys = [];   // 일괄 업로드용

/*
 * 싸바리 표지 전개도: 접힘 | 뒤표지 | 홈 | 책등 | 홈 | 앞표지 | 접힘 (쪽 번호와 무관한 별도 인쇄물).
 * 보드는 본문보다 위 · 아래로 boardMm 크고, 접힘 여유까지 그림이 이어짐.
 */
function wrapSize() {
  const sz = SIZES[S.size] || SIZES.a4, num = (v, d) => { const n = parseFloat(v); return Number.isFinite(n) && n >= 0 ? n : d; };
  const fold = num(S.wrapFold, 15), spine = num(S.wrapSpine, 12), hinge = num(S.wrapHinge, 8), board = num(S.wrapBoard, 3);
  const bw = sz.w, bh = sz.h + 2 * board;
  return { fold, spine, hinge, bw, bh, W: 2 * fold + 2 * bw + 2 * hinge + spine, H: 2 * fold + bh };
}
function wrapPanelBg(kind, tone, seed, wMm, hMm) {
  const keep = [G.W, G.H];
  G.W = Math.round(wMm * 10); G.H = Math.round(hMm * 10);
  const svg = bgSVG(kind, tone, seed);
  [G.W, G.H] = keep;
  return svg;
}
/* ---------- 싸바리 표지: 시안 여러 개 · 템플릿 ----------
   S.covers = [{ id, tpl }]. 첫 시안(id 0)은 예전 키(wrap-front · wrap-title …)를 그대로 써서 예전 앨범과 이어짐.
   다른 시안은 글자 · 사진 키 뒤에 -c{id}, 쪽 번호표는 wrap{id}-front / wrap{id}-back */
const COVER_TPLS = { classic: '수채 화관 (기본)', photo: '큰 사진', band: '사진 + 아래 글자', arch: '아치 사진', minimal: '단정한 글자' };
const COVER_BG = { classic: 'cover', photo: 'soft', band: 'top', arch: 'center', minimal: 'side' };
const coverList = () => (Array.isArray(S.covers) && S.covers.length ? S.covers : [{ id: 0, tpl: 'classic' }]);
function coverFront(tpl, c) {
  const head = `<div class="eyebrow">THE ${esc(ordinal(parseInt(S.nth, 10) || 1))} GRADUATION ALBUM</div>`;
  const names = `<div class="wf-year">${c.year}</div><div class="wf-school">${esc(S.school)}</div>`;
  const title = E(c.k('wrap-title'), '졸업앨범', 'wf-title');
  switch (tpl) {
    case 'photo': return `<div class="wf-frame"></div><div class="wcf">${head}${c.photo('a', 'wc-big')}<div class="script wf-script">Graduation</div>${title}${names}</div>`;
    case 'band': return `${c.photo('a', 'wc-band')}<div class="wcf wcf-band">${c.emblem('wc-emb-s')}<div class="script wf-script">Graduation</div>${title}${names}</div>`;
    case 'arch': return `<div class="wf-frame"></div><div class="wcf">${head}${c.photo('a', 'wc-arch')}${title}${names}</div>`;
    case 'minimal': return `<div class="wf-frame"></div><div class="wcf wcf-min">${c.emblem('wc-emb-m')}${head}<div class="script wf-script">Graduation</div>${E(c.k('wrap-title'), '졸업앨범', 'wf-title wc-title-l')}<div class="wc-rule"></div>${names}</div>`;
    default: return `<div class="wf-frame"></div>
        <div class="wf-in">
          ${head}
          <div class="wf-wreath">
            <svg viewBox="0 0 1000 1000" aria-hidden="true">${wreath(500, 500, 400, rngOf(7321 + c.id * 13), { n: 24 })}</svg>
            ${c.emblem('wf-emblem')}
          </div>
          <div class="script wf-script">Graduation</div>
          ${title}
          ${names}
        </div>`;
  }
}
function wrapCoverHTML() {
  const noCover = S.size === 'sinsa';       // 신사절 앨범은 표지 디자인 없음
  $('#wrap-controls').hidden = noCover;
  if (noCover || S.wrapOn === false) return '';
  const list = coverList();
  return list.map((cv, idx) => wrapSheetHTML(cv, idx, list.length)).join('');
}
/** 책등 배경을 옆면과 이어지게: 책등 색이 양옆 표지 쪽으로 서서히 투명해지는 그라데이션 (책등 자리는 꽉 찬 색) */
function spineBlendBg(side, spine) {
  const blend = Math.min(14, side * .12), total = spine + 2 * blend, a = f(blend / total * 100), b = f((blend + spine) / total * 100);
  return `<div class="wrap-spine-bg" style="left:${f(side - blend)}mm;width:${f(total)}mm;background:linear-gradient(90deg,rgba(241,228,210,0) 0%,rgba(241,228,210,.55) ${f(a * .55)}%,#F1E4D2 ${a}%,#F1E4D2 ${b}%,rgba(241,228,210,.55) ${f(100 - (100 - b) * .55)}%,rgba(241,228,210,0) 100%)"></div>`;
}
/** 책등을 양쪽 면과 디자인으로 잇기: 뒤표지 · 책등 · 앞표지를 한 장의 수채 그림으로 그림.
    뒤 · 앞 표지 무늬는 예전과 같은 자리에 두고, 책등 위 · 아래 · 가운데에 양쪽 색을 섞은 번짐과 잎가지를 걸쳐 둠.
    테마 배경(모던 등)을 쓰는 앨범은 null → 예전 방식 + 책등 그라데이션 */
function wrapContinuousBg(z, side, tpl, id, seed) {
  if (themeNow().bg) return null;
  const Wt = Math.round(z.W * 10), Ht = Math.round(z.H * 10), sw = Math.round(side * 10), spw = Math.round(z.spine * 10), fx = sw + spw, fw = Wt - fx;
  const keep = [G.W, G.H], tone = TONES[id % TONES.length];
  G.W = sw; G.H = Ht;
  const pb = bgParts('soft', ['butter', 'sage', 'peach'], rngOf(seed));
  G.W = fw;
  const pf = bgParts(COVER_BG[tpl], tone, rngOf(seed + 6));
  G.W = sw;
  const rng = rngOf(seed * 3 + 11), cx = (sw + spw / 2) / sw;      // washes()는 x · r을 뒤표지 폭(sw) 기준으로 씀
  const bridge = [{ x: cx, y: .06, r: .2, c: 'peach', a: .6 }, { x: cx, y: .95, r: .24, c: 'sage', a: .6 }, { x: cx, y: .5, r: .1, c: tone[0], a: .32 }, { x: cx - .05, y: .3, r: .07, c: 'blush', a: .3 }, { x: cx + .05, y: .72, r: .08, c: 'butter', a: .35 }];
  const mid = sw + spw / 2, L = sw * .3;
  const vines = sprig(mid - L * .55, Ht * .1, L, 8, rng, {}) + sprig(mid + L * .55, Ht * .9, L, 188, rng, {}) + flower(mid, Ht * .095, sw * .028, rng, 'blush') + flower(mid, Ht * .905, sw * .026, rng, 'peach');
  const wash = washes(bridge, sw, Ht, rng);
  [G.W, G.H] = keep;
  const R = `<g transform="translate(${fx},0)">`;
  let s = `<rect width="${Wt}" height="${Ht}" fill="#FCF8F1"/>${pb.wash}${R}${pf.wash}</g>${wash}${pb.top}${R}${pf.top}</g>${vines}`;
  s += `<rect width="${Wt}" height="${Ht}" filter="url(#paper)" opacity=".42" style="mix-blend-mode:multiply"/>`;
  return `<svg class="bg" viewBox="0 0 ${Wt} ${Ht}" preserveAspectRatio="none" aria-hidden="true">${s}</svg>`;
}
/** 접힘 표시 (재단 표시처럼): 접히는 선마다 종이 가장자리 끝에만 짧은 선. 인쇄 · PDF에도 나옴.
    세로: 뒤표지 보드 양끝 · 책등 양쪽 · 앞표지 보드 양끝 / 가로: 보드 위 · 아래 (접힘 여유가 접혀 들어가는 선) */
function wrapFoldMarks(z, side) {
  const mm = v => `${f(v)}mm`, t = Math.min(6, Math.max(3, z.fold * .4)), frontX = side + z.spine + z.hinge;
  const xs = [z.fold, z.fold + z.bw, side, side + z.spine, frontX, frontX + z.bw], ys = [z.fold, z.H - z.fold];
  return xs.map(x => `<i class="wrap-tick" style="left:${mm(x)};top:0;height:${mm(t)}"></i><i class="wrap-tick" style="left:${mm(x)};bottom:0;height:${mm(t)}"></i>`).join('') +
    ys.map(y => `<i class="wrap-tick h" style="top:${mm(y)};left:0;width:${mm(t)}"></i><i class="wrap-tick h" style="top:${mm(y)};right:0;width:${mm(t)}"></i>`).join('');
}
function wrapSheetHTML(cv, idx, total) {
  const z = wrapSize(), side = z.fold + z.bw + z.hinge, frontX = side + z.spine + z.hinge;
  const year = esc(S.year).replace(/[^\d\s.]+/g, m => `<span class="year-unit">${m}</span>`);
  const mm = v => `${f(v)}mm`;
  const box = (x, w) => `left:${mm(x)};top:${mm(z.fold)};width:${mm(w)};height:${mm(z.bh)}`;
  const id = cv.id || 0, tpl = COVER_TPLS[cv.tpl] ? cv.tpl : 'classic', pre = id ? `wrap${id}` : 'wrap';
  const c = {
    id, year,
    k: key => (id ? `${key}-c${id}` : key),
    emblem: cls => `<div class="emblem ${cls}">${P('sym-emblem', 'contain', emblemAlt())}</div>`,
    photo: (name, cls) => `<div class="wc-photo ${cls}">${P(`wcov${id}-${name}`)}</div>`,
  };
  const seed = 7301 + id * 131;
  const cont = S.spineBlend === false ? null : wrapContinuousBg(z, side, tpl, id, seed);     // 책등을 양쪽 면과 이어진 한 장의 그림으로
  const opts = Object.entries(COVER_TPLS).map(([v, t]) => `<option value="${v}"${v === tpl ? ' selected' : ''}>${t}</option>`).join('');
  return `<div class="wrap-block" data-cov="${id}">
    <div class="sheet-label cov-bar">
      <b>표지 시안 ${idx + 1}${total > 1 ? ` / ${total}` : ''}</b>
      <label>템플릿 <select class="cov-tpl" data-cov="${id}">${opts}</select></label>
      <button type="button" class="cov-act" data-act="add" data-cov="${id}" title="이 시안 뒤에 새 표지 시안 추가">+ 새 시안</button>
      <button type="button" class="cov-act" data-act="dup" data-cov="${id}" title="이 시안을 글자 · 사진 · 틀 그대로 복제">복제</button>
      ${total > 1 ? `<button type="button" class="cov-act" data-act="del" data-cov="${id}">삭제</button>` : ''}
    </div>
    <section class="wrap-sheet cov-${tpl}${S.spineBlend === false ? '' : ' spine-blend'}" data-cov="${id}" style="width:${mm(z.W)};height:${mm(z.H)}">
      ${cont ? `<div class="wrap-bg" style="left:0;width:100%">${cont}</div>` : `<div class="wrap-bg" style="left:0;width:${mm(side)}">${wrapPanelBg('soft', ['butter', 'sage', 'peach'], seed, side, z.H)}</div>
      <div class="wrap-bg" style="left:${mm(side + z.spine)};width:${mm(z.W - side - z.spine)}">${wrapPanelBg(COVER_BG[tpl], TONES[id % TONES.length], seed + 6, z.W - side - z.spine, z.H)}</div>
      ${S.spineBlend === false ? '' : spineBlendBg(side, z.spine)}`}
      <div class="wrap-spine" style="left:${mm(side)};width:${mm(z.spine)};top:0;height:100%">
        <div class="ws-text">${E(c.k('wrap-spine'), `${S.year} 졸업앨범`, 'ws-title', 'span')}${S.nth ? E(c.k('wrap-nth'), `제${S.nth}회`, 'ws-nth', 'span') : ''}<span class="ws-school">${esc(S.school)}</span></div>
      </div>
      <div class="wrap-face wrap-back" data-pid="${pre}-back" style="${box(z.fold, z.bw)}"><div class="trim wf-trim">
        <div class="wb-in">
          ${c.emblem('wb-emblem')}
          <div class="wb-school">${esc(S.school)}</div>
          ${E(c.k('wrap-back'), '함께한 여섯 해의 봄을 오래도록 기억하며', 'wb-line')}
        </div>
      </div></div>
      <div class="wrap-face wrap-front" data-pid="${pre}-front" style="${box(frontX, z.bw)}"><div class="trim wf-trim">
        ${coverFront(tpl, c)}
      </div></div>
      <div class="guide wrap-line" style="${box(z.fold, z.bw)}"></div>
      <div class="guide wrap-line" style="${box(side, z.spine)}"></div>
      <div class="guide wrap-line" style="${box(frontX, z.bw)}"></div>
      ${wrapFoldMarks(z, side)}
    </section>
    <div class="sheet-label">싸바리 표지 전개도 · 뒤표지 | 책등 | 앞표지 · 전체 ${f(z.W)}×${f(z.H)}mm · 앞표지 보드 ${f(z.bw)}×${f(z.bh)}mm</div>
  </div>`;
}
/* 표지 시안 추가 · 복제 · 삭제 · 템플릿 바꾸기 */
function coverAct(act, id, tpl) {
  const list = (S.covers = coverList().map(x => ({ ...x })));
  const at = list.findIndex(x => (x.id || 0) === id);
  if (at < 0) return;
  const nextId = () => { const n = Math.max(S.coverNext || 1, ...list.map(x => (x.id || 0) + 1)); S.coverNext = n + 1; return n; };
  if (act === 'tpl') list[at].tpl = tpl;
  else if (act === 'add') list.splice(at + 1, 0, { id: nextId(), tpl: 'classic' });
  else if (act === 'dup') {
    const nid = nextId(), from = id ? `-c${id}` : '', to = `-c${nid}`;
    const fromPre = id ? `wrap${id}` : 'wrap', toPre = `wrap${nid}`;
    for (const key of ['wrap-title', 'wrap-spine', 'wrap-nth', 'wrap-back']) if (texts[key + from] != null) texts[key + to] = texts[key + from];
    const fd = frameData(), mapPid = p => p.replace(new RegExp(`^${fromPre}-`), `${toPre}-`);
    const mapKey = key => {         // 이 시안의 글자 · 사진 키 → 새 시안의 키 (교표처럼 함께 쓰는 키는 그대로)
      const base = key.replace(/-c\d+$/, '');
      if (['wrap-title', 'wrap-spine', 'wrap-nth', 'wrap-back'].includes(base)) return base + to;
      return key.replace(/^wcov\d+-/, `wcov${nid}-`);
    };
    const copyPhoto = (a, b) => { const p = photos[a]; if (!p) return; photos[b] = { ...p, url: p.url }; DB.put(b, { blob: p.blob, w: p.w, h: p.h, x: p.x, y: p.y, z: p.z }); };
    for (const kind of ['over', 'text']) for (const [k, v] of Object.entries(fd[kind] || {})) if (k.startsWith(`${fromPre}-`)) {
      const cut = k.indexOf('|');
      (fd[kind] ||= {})[`${mapPid(k.slice(0, cut))}|${mapKey(k.slice(cut + 1))}`] = JSON.parse(JSON.stringify(v));
    }
    for (const x of [...(fd.extra || [])]) if (x.pid.startsWith(`${fromPre}-`)) {
      const nx = { ...x, id: fd.next++, pid: mapPid(x.pid) };
      fd.extra.push(nx);
      copyPhoto(`fx-${x.id}`, `fx-${nx.id}`);
    }
    for (const name of ['a', 'b']) copyPhoto(`wcov${id}-${name}`, `wcov${nid}-${name}`);
    list.splice(at + 1, 0, { id: nid, tpl: list[at].tpl });
  } else if (act === 'del') {
    if (list.length < 2 || !confirm(`표지 시안 ${at + 1}을 삭제할까요?\n(이 시안에 넣은 사진은 앨범에 남아 있습니다)`)) return;
    list.splice(at, 1);
  }
  saveState();
  render();
}
document.addEventListener('change', e => { const s = e.target.closest?.('.cov-tpl'); if (s) coverAct('tpl', +s.dataset.cov, s.value); });
document.addEventListener('click', e => { const b = e.target.closest?.('.cov-act'); if (b) coverAct(b.dataset.act, +b.dataset.cov); });

function render() {
  applyTheme();
  const sz = SIZES[S.size] || SIZES.a4, b = S.bleed ? BLEED : 0;
  const rs = document.documentElement.style;
  rs.setProperty('--tw', sz.w + 'mm');
  rs.setProperty('--th', sz.h + 'mm');
  rs.setProperty('--b', b + 'mm');
  rs.setProperty('--zoom', S.zoom);
  $('#pagesize').textContent = `@page{size:${sz.w + 2 * b}mm ${sz.h + 2 * b}mm;margin:0}`;
  document.body.classList.toggle('show-guides', !!S.guides);
  document.body.classList.toggle('k-layflat', S.albumType === 'kinder');     // 유치원 압축앨범: 펼침면 가운데 도련 숨김
  G.W = Math.round((sz.w + 2 * b) * 10);
  G.H = Math.round((sz.h + 2 * b) * 10);
  G.pageMm = sz.w + 2 * b;
  G.aspect = sz.h / sz.w;

  const classes = S.albumType === 'kinder' ? kClasses() : parseRoster(S.roster), teachers = parseTeachers(S.teachers);     // 유치원: '선생님' 줄은 원아에서 뺌
  studentKeys = []; flowerKeys = []; outdoorKeys = []; outdoorStripKeys = [];
  classes.forEach((c, ci) => c.students.forEach((s, i) => {
    studentKeys.push({ key: `c${ci}-s${i}`, name: s.name });
    flowerKeys.push({ key: `c${ci}-fl${i}`, name: s.name });
    outdoorKeys.push({ key: `c${ci}-o${i}`, name: s.name });
    outdoorStripKeys.push({ key: `c${ci}-ox${i}`, name: s.name });
  }));
  teacherKeys = teachers.map((t, i) => ({ key: teacherKey(t, i), name: t.name }));
  galleryKeys = [];
  for (let p = 0; p < galleryCount(); p++) for (let k = 0; k < GALLERY_PER; k++) galleryKeys.push({ key: `g${p}-${k}`, name: '' });

  // 선생님 명렬을 켜면 뒤쪽 좌우가 바뀌지 않게 짝수 쪽으로 맞춤
  let pages;
  if (S.albumType === 'kinder') pages = kinderPages(classes);      // 유치원앨범 (kinder.js)
  else if (S.schoolTpl === 'gjcook' && window.gjPages) pages = gjPages();      // 학교 템플릿: 경북조리과학고 2026 (gjcook.js)
  else if (S.layoutV2 && window.v2Pages) pages = v2Pages(classes, teachers);   // 디자이너2 초안 배치 (layout-v2.js)
  else {
    const faculty = S.useFaculty === false ? [] : facultyPages(teachers);
    if (faculty.length % 2) faculty.push(memoPage(9));
    const front = S.frontLayout === 'spread' ? spreadFrontPages() : [...campusPages(), leadersPage(), symbolPage()];
    pages = [coverPage(), ...front, ...faculty];
    classes.forEach((c, ci) => {
      const tone = TONES[ci % TONES.length];
      pages.push(...classIntroPages(c, ci, tone), ...studentPages(c, ci, tone));
    });
    pages.push(...scenePages(), ...galleryPages(), ...wordsPages(classes), ...Array.from({ length: rollingCount() }, (_, i) => messagesPage(i)));
  }
  applyPageEdits(pages);     // 페이지 패널: 쪽 번호표를 붙이고 추가 · 삭제한 쪽을 반영
  if (S.pad4) { let i = 0; while (pages.length % 4) { const m = memoPage(i++); m.pid = `memo-${i}`; pages.push(m); } }

  const runL = `<div class="run run-l"><span>${esc(S.year)} Graduation</span><span></span></div>`, runR = `<div class="run run-r"><span></span><span>${esc(S.school)}</span></div>`;   // 머리글: 왼쪽 쪽은 학년도, 오른쪽 쪽은 학교 이름만
  G.kPairFirst = !!pages[0]?.pairFirst;      // 유치원앨범: 1쪽(백지)부터 펼침면 (1·2쪽이 한 펼침)
  const bgs = pages.map((p, i) => null);
  for (let i = G.kPairFirst ? 0 : 1; i + 1 < pages.length; i += 2) {     // 기본 파스텔: 펼침면 배경을 이어 그림
    const pair = spreadBgPair(pages[i], pages[i + 1], 1009 + i * 97, 1009 + (i + 1) * 97);
    if (pair) [bgs[i], bgs[i + 1]] = pair;
  }
  const sheets = pages.map((p, i) => {
    const no = String(i + 1).padStart(2, '0');
    return `<div class="sheet">
      <section class="page" data-kind="${p.kind}" data-pid="${esc(p.pid)}">
        ${bgs[i] || bgSVG(p.bg[0], p.bg[1], 1009 + i * 97)}
        <div class="trim"><div class="safe">
          ${p.run === false ? "" : (i % 2 === (G.kPairFirst ? 0 : 1) ? runL : runR)}
          ${p.html}
          ${p.folio === false ? '' : `<div class="folio"><span>${no}</span></div>`}
        </div></div>
        <div class="guide g-trim"></div><div class="guide g-safe"></div>
      </section>
      <div class="sheet-label">P.${no} · ${esc(p.label)}</div>
    </div>`;
  });
  const from = G.kPairFirst ? 0 : 1;
  let html = from ? `<div class="spread">${sheets[0]}</div>` : '';
  for (let i = from; i < sheets.length; i += 2) html += `<div class="spread">${sheets[i]}${sheets[i + 1] || ''}</div>`;
  $('#pages').innerHTML = (S.albumType === 'kinder' ? '' : wrapCoverHTML()) + html;     // 유치원앨범은 책 표지(전개도) 없음
  if (S.albumType === 'kinder' && $('#wrap-controls')) $('#wrap-controls').hidden = true;
  applyFrames();
  makeTextsEditable();
  applyTextFrames();

  document.querySelectorAll('.photo').forEach(applyPhoto);
  if (S.albumType === 'kinder') kFolios();     // 3쪽부터 아래에 작은 원아 이름 · 쪽 번호
  const copies = S.albumType === 'kinder' && S.kPersonal ? kPersonalCopies() : 1;   // 유치원: 원아 수만큼 개인 앨범 (kinder.js)
  syncFrameSel();
  window.pagePanelSoon?.();
  const n = pages.length;
  $('#info').innerHTML = (copies > 1 ? `원아 <b>${copies}</b>명 × ${n}쪽 = 총 <b>${copies * n}</b>쪽 · ` : `총 <b>${n}</b>쪽 · `) + `인쇄 용지 ${f(sz.w + 2 * b)}×${f(sz.h + 2 * b)}mm` +
    (n % 4 ? `<br>제본용으로는 4의 배수(${Math.ceil(n / 4) * 4}쪽)를 권장합니다.` : '');
}
/* ============================================================
   사진
   ============================================================ */
function applyPhoto(el) {
  const rec = photos[el.dataset.photo];
  el.querySelector('.badge')?.remove();
  if (!rec) { el.classList.remove('has-img'); el.style.backgroundImage = ''; el.style.backgroundSize = ''; el.style.backgroundPosition = ''; return; }
  el.classList.add('has-img');      // 교가 칸은 사진이 있어야 커지므로 크기를 재기 전에 표시
  const rw = el.offsetWidth || 1, rh = el.offsetHeight || 1;
  const s = (el.classList.contains('contain') ? Math.min : Math.max)(rw / rec.w, rh / rec.h) * rec.z;    // CSS px / 이미지 px
  el.style.backgroundImage = `url("${photoSrc(rec)}")`;
  if (!pvOk(rec)) pvNeed(el.dataset.photo);
  el.style.backgroundSize = `${f(rec.w * s / rw * 100)}% ${f(rec.h * s / rh * 100)}%`;
  el.style.backgroundPosition = `${f(rec.x)}% ${f(rec.y)}%`;
  el.classList.toggle('is-fit', rec.w * s < rw - .5 || rec.h * s < rh - .5);     // 사진 전체 보이기로 틀이 남으면 빈 바탕은 투명하게
  const pg = el.closest('.page');      // 페이지 실제 폭(mm) 기준 → 미리보기 배율과 무관
  const dpi = pg ? Math.round(pg.offsetWidth * 25.4 / (s * G.pageMm)) : 300;
  if (dpi < 200) el.insertAdjacentHTML('beforeend', `<span class="badge">저해상도 ${dpi}dpi</span>`);
}
const applyKey = key => { document.querySelectorAll(`.photo[data-photo="${CSS.escape(key)}"]`).forEach(applyPhoto); window.pagePanelSoon?.(); };

/* ---------------- 편집 화면용 미리보기 (인디자인의 미리보기처럼) ----------------
   원본(6000px 안팎)을 화면에 그대로 띄우면 장당 메모리 100MB 가까이 들어 스크롤 · 확대가 느려짐.
   긴 변 1600px 미리보기를 따로 만들어 화면에만 쓰고, PDF · JPG 내보내기와 앨범 파일 저장은 계속 원본(rec.blob)을 씀.
   미리보기는 별도 IndexedDB(…-pv)에 보관 → 다음에 열 때 다시 만들지 않음. 원본이 바뀌면(url이 달라지면) 자동으로 새로 만듦 */
const PV_MAX = 1600;
const PV = {
  db: null,
  open() {
    return new Promise(res => {
      try {
        const r = indexedDB.open(dbNameOf(PROJECT_ID) + '-pv', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('pv');
        r.onsuccess = () => { this.db = r.result; res(); };
        r.onerror = () => res();
      } catch { res(); }
    });
  },
  put(k, v) { try { this.db?.transaction('pv', 'readwrite').objectStore('pv').put(v, k); } catch { /* 보관 못 해도 화면에는 씀 */ } },
  all() {
    if (!this.db) return Promise.resolve({});
    return new Promise(res => {
      const out = {}, q = this.db.transaction('pv').objectStore('pv').openCursor();
      q.onsuccess = () => { const c = q.result; if (c) { out[c.key] = c.value; c.continue(); } else res(out); };
      q.onerror = () => res(out);
    });
  },
};
const pvSig = r => `${r.blob?.size}|${r.w}x${r.h}`;
const pvOk = r => !!(r && r.purl && r.pfor === r.url);
/** 화면에 띄울 주소: 미리보기가 맞으면 미리보기, 아니면 원본 */
const photoSrc = r => (pvOk(r) ? r.purl : r?.url);
const pvQueue = new Set();
let pvBusy = false;
function pvNeed(key) {
  const r = photos[key];
  if (!r?.blob || key.includes('--') || pvOk(r)) return;
  if (Math.max(r.w, r.h) <= PV_MAX * 1.25 || /svg|gif/.test(r.blob.type)) return;      // 이미 작은 사진 · 벡터는 그대로
  pvQueue.add(key);
  if (!pvBusy) setTimeout(pvRun, 300);
}
async function pvRun() {
  if (pvBusy) return;
  pvBusy = true;
  try {
    while (pvQueue.size) {
      const key = pvQueue.values().next().value;
      pvQueue.delete(key);
      const r = photos[key];
      if (!r?.blob || pvOk(r)) continue;
      const url = r.url, sig = pvSig(r);
      try {
        const k = PV_MAX / Math.max(r.w, r.h);
        const bm = await createImageBitmap(r.blob, { resizeWidth: Math.max(1, Math.round(r.w * k)), resizeHeight: Math.max(1, Math.round(r.h * k)), resizeQuality: 'high' });
        const cv = document.createElement('canvas');
        cv.width = bm.width; cv.height = bm.height;
        cv.getContext('2d').drawImage(bm, 0, 0);
        bm.close();
        const blob = await new Promise(res => cv.toBlob(res, 'image/webp', .9));
        cv.width = cv.height = 1;
        const cur = photos[key];
        if (!blob || !cur || cur.url !== url) continue;      // 만드는 사이 사진이 바뀌었으면 버림
        cur.purl = URL.createObjectURL(blob); cur.pfor = url;
        PV.put(key, { blob, sig });
        applyKey(key);
      } catch { /* 못 만들면 원본으로 계속 보임 */ }
      await new Promise(res => setTimeout(res, 30));       // 편집이 끊기지 않게 한 장씩 쉬어 가며
    }
  } finally { pvBusy = false; }
}

async function imageSize(file) {
  try { const bm = await createImageBitmap(file); const r = { w: bm.width, h: bm.height }; bm.close(); return r; }
  catch {
    return new Promise((res, rej) => {
      const img = new Image(), u = URL.createObjectURL(file);
      img.onload = () => { res({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(u); };
      img.onerror = rej; img.src = u;
    });
  }
}
async function setPhoto(key, file) {
  if (!file || !file.type.startsWith('image/')) return;
  const { w, h } = await imageSize(file);
  if (photos[key]) URL.revokeObjectURL(photos[key].url);
  if (photos[`orig--${key}`]) { delete photos[`orig--${key}`]; DB.drop(`orig--${key}`); }   // 새 사진이면 이전 이미지 도구 원본은 버림
  if (photos[`rot0--${key}`]) { delete photos[`rot0--${key}`]; DB.drop(`rot0--${key}`); }     // 돌리기 보관본도
  const rec = { blob: file, w, h, x: 50, y: 50, z: 1, nm: file.name || undefined };
  photos[key] = { ...rec, url: URL.createObjectURL(file) };
  await DB.put(key, rec);
  applyKey(key);
  if (isGalKey(key)) { relayoutGallery(key); queueFaces([key]); }
  if (key.startsWith('t-') || isStudentKey(key) || isOutdoorKey(key) || isStripKey(key) || isFlowerKey(key) || isInstrKey(key)) await cropToFace(key);
  await window.kOnPhotoSet?.(key);     // 템플릿별 자동 구도 (도산유치원 3 · 4쪽: 머리~허벅지)
}
const isStudentKey = k => /^c\d+-s\d+$/.test(k), isOutdoorKey = k => /^c\d+-o\d+$/.test(k), isStripKey = k => /^c\d+-ox\d+$/.test(k), isFlowerKey = k => /^c\d+-(fl|ca|po)\d+$/.test(k), isInstrKey = k => /^c\d+-in\d+$/.test(k), OUTDOOR_FACE_H = .18;
/** 선생님 · 학생 증명사진은 얼굴이 크게, 야외 프로필은 머리부터 허벅지까지 (사용자가 옮긴 사진은 그대로) */
async function cropToFace(key) {
  const r = photos[key];
  if (!r || r.x !== 50 || r.y !== 50 || r.z !== 1 || r.w >= r.h) return;
  try {
    await loadFaceApi();
    const c = await countFaces(r.blob);
    if (c.faces !== 1 || photos[key] !== r) return;
    const slot = document.querySelector(`.photo[data-photo="${CSS.escape(key)}"]`);            // 야외 프로필 틀은 세로로 길어 실제 비율을 씀
    const instr = isInstrKey(key);
    const a = (isOutdoorKey(key) || isFlowerKey(key) || instr) && slot?.offsetHeight ? slot.offsetWidth / slot.offsetHeight : .8;
    const ia = r.w / r.h, base = Math.max(a, ia);                                              // 틀 높이 1 기준 사진 폭
    const student = isStudentKey(key), outdoor = isOutdoorKey(key), strip = isStripKey(key), flower = isFlowerKey(key);
    if (student) {         // 증명사진: 얼굴 상자는 머리·안경에 따라 달라지므로 눈 사이 거리로 크기를 맞춤
      const e = await eyeLine(r.blob);
      if (e && photos[key] === r) {
        const sa = slot?.offsetHeight ? slot.offsetWidth / slot.offsetHeight : .8, b0 = Math.max(sa, ia);
        const z = Math.round(Math.min(3, Math.max(1, ID_EYE_GAP / (e.ed * b0))) * 1000) / 1000, iw = b0 * z, ih = iw / ia;
        const at = (v, I, B, t) => (I - B < 1e-6 ? 50 : Math.round(Math.min(100, Math.max(0, (v * I - t * B) / (I - B) * 100)) * 10) / 10);
        Object.assign(r, c, { z, x: at(e.ex, iw, sa, .5), y: at(e.ey, ih, 1, ID_EYE_Y) });
        await DB.putQuiet(key, recOf(r));
        applyKey(key);
        return;
      }
    }
    const faceH = student ? .38 : outdoor ? OUTDOOR_FACE_H : strip ? .24 : flower ? .19 : instr ? .13 : 0;     // 얼굴이 틀 높이에서 차지할 비율 (악기는 악기까지 보이게 작게)
    const zoom = faceH ? Math.round(Math.min(3, Math.max(1, faceH / (c.fh * base / ia))) * 100) / 100 : 1.7;
    const iw = base * zoom, ih = iw / ia;
    const pos = (f, I, B, at) => Math.round(Math.min(100, Math.max(0, (f * I - at * B) / (I - B) * 100)));
    Object.assign(r, c, { z: zoom, x: pos(c.fx, iw, a, .5), y: pos(c.fy, ih, 1, student ? .4 : outdoor ? .17 : strip ? .3 : flower ? .2 : instr ? .2 : .33) });
    await DB.putQuiet(key, recOf(r));
    applyKey(key);
  } catch (e) { console.warn('얼굴 위치 찾기 실패', key, e); }
}
async function removePhoto(key) {
  if (photos[key]) URL.revokeObjectURL(photos[key].url);
  if (photos[`orig--${key}`]) { delete photos[`orig--${key}`]; await DB.drop(`orig--${key}`); }
  if (photos[`rot0--${key}`]) { delete photos[`rot0--${key}`]; await DB.drop(`rot0--${key}`); }
  delete photos[key];
  await DB.drop(key);
  applyKey(key);
  if (isGalKey(key)) relayoutGallery(key);
}
/** DB에 저장하는 사진 정보 (faces: 찾은 인물 수, fx·fy: 인물 중심, shape: 틀 모양 직접 지정) */
const recOf = p => ({ blob: p.blob, w: p.w, h: p.h, x: p.x, y: p.y, z: p.z, faces: p.faces, solo: p.solo, fx: p.fx, fy: p.fy, fh: p.fh, shape: p.shape, rot: p.rot, nm: p.nm || p.blob?.name || undefined });     // nm: 원래 파일 이름 (링크 창 · 유실 확인용)
const persistPos = (() => {
  const timers = {};
  return key => {
    clearTimeout(timers[key]);
    timers[key] = setTimeout(() => { const p = photos[key]; if (p) DB.put(key, recOf(p)); }, 300);
  };
})();

function bindPhotoEvents() {
  const root = $('#pages'), picker = $('#picker');
  let pickKey = null, drag = null;
  pickPhoto = key => { pickKey = key; picker.click(); };

  picker.addEventListener('change', async () => {
    if (pickKey && picker.files[0]) await setPhoto(pickKey, picker.files[0]);
    picker.value = '';
  });

  root.addEventListener('click', e => {      // 갤러리 '사진 추가' → 그 쪽의 빈 칸에
    const sb = e.target.closest('.gal-shape');
    if (sb) {
      const r = photos[sb.dataset.key];
      if (!r) return;
      r.shape = SHAPE_ORDER[(SHAPE_ORDER.indexOf(r.shape || 'auto') + 1) % SHAPE_ORDER.length];
      if (galShape(r) !== 'rect') centerOnFace(r, SHAPE_ASP[galShape(r)]);
      DB.put(sb.dataset.key, recOf(r));
      relayoutGallery(sb.dataset.key);
      return;
    }
    const b = e.target.closest('.gal-add');
    if (!b) return;
    const slot = galleryAddSlot();
    if (slot) { pickKey = slot; picker.click(); }
  });

  root.addEventListener('pointerdown', e => {
    const el = e.target.closest('.photo');
    if (!el || e.button !== 0) return;
    const key = el.dataset.photo;
    if (e.target.closest('.ph-remove')) { e.preventDefault(); removePhoto(key); return; }
    if (e.target.closest('.ph-rot')) { e.preventDefault(); e.stopPropagation(); rotatePhoto(key, e.shiftKey ? -1 : 1); return; }
    drag = { el, key, shift: e.shiftKey, x0: e.clientX, y0: e.clientY, moved: false, start: photos[key] ? { x: photos[key].x, y: photos[key].y } : null };
    el.setPointerCapture(e.pointerId);
  });
  root.addEventListener('pointermove', e => {
    if (!drag) return;
    const k = drag.el.getBoundingClientRect().width / (drag.el.offsetWidth || 1) || 1;   // 미리보기 배율 보정
    let dx = (e.clientX - drag.x0) / k, dy = (e.clientY - drag.y0) / k;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    const p = photos[drag.key];
    if (!p || !drag.start) return;
    [dx, dy] = axisLock(e, dx, dy);      // Shift: 수평 또는 수직으로만
    drag.el.classList.add('dragging');
    const rw = drag.el.offsetWidth, rh = drag.el.offsetHeight;
    const s = (drag.el.classList.contains('contain') ? Math.min : Math.max)(rw / p.w, rh / p.h) * p.z;
    const ox = p.w * s - rw, oy = p.h * s - rh;   // 칸 밖으로 넘치는 길이
    p.x = ox > 0 ? Math.min(100, Math.max(0, drag.start.x - dx / ox * 100)) : 50;
    p.y = oy > 0 ? Math.min(100, Math.max(0, drag.start.y - dy / oy * 100)) : 50;
    drag.el.style.backgroundPosition = `${f(p.x)}% ${f(p.y)}%`;
  });
  const end = () => {
    if (!drag) return;
    const d = drag; drag = null;
    d.el.classList.remove('dragging');
    if (!d.moved) frameClick(d.el, d.key, d.shift);
    else { persistPos(d.key); applyKey(d.key); }     // 펼침면 사진은 좌우 쪽이 같은 사진
  };
  root.addEventListener('dblclick', e => {     // 틀을 두 번 누르면 사진 넣기 · 바꾸기
    const el = e.target.closest('.trim .photo');
    if (el && !e.target.closest('.ph-remove, .ph-rot')) pickPhoto(el.dataset.photo);
  });
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', () => { if (drag) drag.el.classList.remove('dragging'); drag = null; });

  // 사진 확대 · 축소는 마우스 휠이 아니라 틀을 고른 뒤 Ctrl + / Ctrl - (틀 편집 키 처리에서)

  root.addEventListener('dragover', e => {
    const el = e.target.closest('.photo');
    if (!el) return;
    e.preventDefault();
    el.classList.add('drop');
  });
  root.addEventListener('dragleave', e => e.target.closest?.('.photo')?.classList.remove('drop'));
  root.addEventListener('drop', e => {
    const el = e.target.closest('.photo');
    if (!el) return;
    e.preventDefault();
    el.classList.remove('drop');
    setPhoto(el.dataset.photo, e.dataTransfer.files[0]);
  });
}

/* ============================================================
   틀 편집 (인디자인처럼): 틀을 고르면 손잡이로 크기 조절 · 이동,
   사진 잘라내기/복사/붙여넣기, 틀 복사/붙여넣기.
   옮긴 틀은 .trim 바로 아래에 띄우고 원래 자리는 투명한 칸으로 남겨 옆 칸이 밀리지 않게 함.
   값은 페이지 폭 기준(cqw)으로 S.frameEdits에 저장 → 앨범 파일에도 함께 저장됨.
   ============================================================ */
const FRAME_SEL = '.lf,.x-frame,.sy-ph,.gslot,.gframe,.fl-frame,.out-frame,.out-mini,.oval,.arch-frame,.l-sub,.cr-cell,.sc-cell,.sym-mini,.song-sheet,.rolling,.emblem,.cover-photo,.wc-photo';
const PAGE_SEL = '.page,.wrap-face';      // 표지 전개도의 앞 · 뒤표지도 쪽처럼 틀을 옮기고 그릴 수 있음
const PG = pid => `:is(.page,.wrap-face)[data-pid="${pid}"]`;
const FRAME_MIN = 3;
let pickPhoto = () => {};
let frameSel = null, frameClip = null, framePage = null;
const frameData = () => (S.frameEdits ||= { over: {}, extra: [], next: 1 });
const frameExtra = key => S.frameEdits?.extra?.find(x => `fx-${x.id}` === key);
const frameElOf = (pid, key) => document.querySelector(`${PG(pid)} .photo[data-photo="${CSS.escape(key)}"]`)?.closest(FRAME_SEL);
function frameBox(fr) {
  const t = fr.closest('.trim').getBoundingClientRect(), r = fr.getBoundingClientRect(), cq = t.width / 100;
  return { x: (r.left - t.left) / cq, y: (r.top - t.top) / cq, w: r.width / cq, h: r.height / cq };
}
function setFrameStyle(fr, b) {
  Object.assign(fr.style, { position: 'absolute', left: `${f(b.x)}cqw`, top: `${f(b.y)}cqw`, width: `${f(b.w)}cqw`, height: `${f(b.h)}cqw`, margin: '0', flex: 'none', transform: 'none', aspectRatio: 'auto', maxWidth: 'none', zIndex: '5' });
}
/* 글자틀: 옮기면 원래 자리의 글꼴 규칙이 사라지므로 글꼴 값을 함께 저장. 글이 길어지면 틀이 아래로 늘어남 */
const textOver = () => (frameData().text ||= {});
const textElOf = (pid, key) => document.querySelector(`${PG(pid)} [data-key="${CSS.escape(key)}"]`);
const selFrameEl = () => (!frameSel ? null : frameSel.kind === 'text' ? textElOf(frameSel.pid, frameSel.key) : frameElOf(frameSel.pid, frameSel.key));
function captureFont(el) {
  const probe = document.createElement('div');       // 1cqw가 지금 몇 px인지 글꼴 크기와 같은 단위로 잼
  probe.style.cssText = 'position:absolute;visibility:hidden;width:100cqw;height:0';
  el.closest('.trim').appendChild(probe);
  const base = parseFloat(getComputedStyle(probe).width) / 100 || 1;
  probe.remove();
  const c = getComputedStyle(el), px = v => parseFloat(v) / base;
  return { fs: px(c.fontSize), ff: c.fontFamily, fw: c.fontWeight, fst: c.fontStyle, color: c.color, ls: c.letterSpacing === 'normal' ? null : px(c.letterSpacing), lh: c.lineHeight === 'normal' ? null : parseFloat(c.lineHeight) / parseFloat(c.fontSize), ta: c.textAlign, tt: c.textTransform, ws: c.whiteSpace === 'pre-line' ? 'pre-line' : 'normal' };
}
function setTextStyle(el, b) {
  const t = b.font;
  setFrameStyle(el, b);
  Object.assign(el.style, { height: 'auto', minHeight: `${f(b.h)}cqw`, display: 'block', fontSize: `${t.fs.toFixed(3)}cqw`, fontFamily: /Pinyon|Cormorant/.test(t.ff || '') ? '' : (t.ff || ''), fontWeight: t.fw, fontStyle: t.fst, color: t.color || '', letterSpacing: t.ls == null ? 'normal' : `${t.ls.toFixed(3)}cqw`, lineHeight: t.lh == null ? 'normal' : String(t.lh), textAlign: t.ta, textTransform: t.tt, whiteSpace: t.ws });
}
function placeText(el, b) {
  if (!b.font) b.font = captureFont(el);
  if (!el.classList.contains('fr-placed')) {
    const n = frameBox(el), ghost = el.cloneNode(false);
    ghost.removeAttribute('data-key'); ghost.removeAttribute('contenteditable');
    ghost.classList.add('fr-ghost');
    Object.assign(ghost.style, { width: `${f(n.w)}cqw`, height: `${f(n.h)}cqw`, flex: 'none', minHeight: '0', minWidth: '0' });
    el.before(ghost);
    el.classList.add('fr-placed');
    el.closest('.trim').appendChild(el);
  }
  setTextStyle(el, b);
}
function applyTextFrames() {
  for (const [id, b] of Object.entries(S.frameEdits?.text || {})) {
    const cut = id.indexOf('|'), el = textElOf(id.slice(0, cut), id.slice(cut + 1));
    if (!el) continue;
    if (b.x != null && !el.classList.contains('fr-placed')) placeText(el, b);
    setLayerZ(layerHolder(el), b.z);
    el.classList.toggle('fr-hidden', !!b.hidden);
  }
}
function changeFontSize(k) {
  const el = selFrameEl();
  if (!el || frameSel.kind !== 'text') return;
  const id = `${frameSel.pid}|${frameSel.key}`, cur = textOver()[id];
  const b = cur?.x != null ? cur : { ...frameBox(el), ...(cur || {}) };
  if (!b.font) b.font = captureFont(el);
  b.font.fs = Math.max(.6, b.font.fs * k);
  textOver()[id] = b;
  placeText(el, b);
  saveState();
  syncFrameSel();
}
function placeFrame(fr, b) {
  if (!fr.classList.contains('fr-placed')) {
    const n = frameBox(fr), ghost = fr.cloneNode(false);
    ghost.classList.add('fr-ghost');
    Object.assign(ghost.style, { width: `${f(n.w)}cqw`, height: `${f(n.h)}cqw`, flex: 'none' });
    fr.before(ghost);
    fr.classList.add('fr-placed');
    fr.closest('.trim').appendChild(fr);
  }
  setFrameStyle(fr, b);
}
function applyFrames() {
  const d = S.frameEdits;
  if (!d) return;
  for (const [id, b] of Object.entries(d.over || {})) {
    const cut = id.indexOf('|'), fr = frameElOf(id.slice(0, cut), id.slice(cut + 1));
    if (!fr) continue;
    if (b.x != null && !fr.classList.contains('fr-placed')) placeFrame(fr, b);
    setLayerZ(fr, b.z);
    fr.classList.toggle('fr-hidden', !!b.hidden);     // 삭제한 틀: 사진은 보관하고 안 보이게 (되돌리기 가능)
  }
  for (const x of d.extra || []) {
    const key = `fx-${x.id}`, tr = document.querySelector(`${PG(x.pid)} .trim`);
    if (!tr || tr.querySelector(`.photo[data-photo="${key}"]`)) continue;
    tr.insertAdjacentHTML('beforeend', `<div class="${esc(x.cls)} x-frame fr-placed">${P(key)}</div>`);
    setFrameStyle(tr.lastElementChild, x);
    setLayerZ(tr.lastElementChild, x.z);
    applyPhoto(tr.lastElementChild.querySelector('.photo'));
  }
  for (const x of d.xtext || []) {          // 새로 만든 글자틀
    const key = `xt-${x.id}`, tr = document.querySelector(`${PG(x.pid)} .trim`);
    if (!tr || tr.querySelector(`[data-key="${key}"]`)) continue;
    tr.insertAdjacentHTML('beforeend', `<div class="x-text ml" contenteditable="true" spellcheck="false" data-key="${key}">${esc(texts[key] ?? '')}</div>`);
  }
}
/* 페이지 패널의 쪽 추가 · 삭제. 번호표(pid)는 삭제 전에 붙여서, 쪽을 지워도 다른 쪽의 틀 · 글자 기록이 어긋나지 않음 */
function applyPageEdits(pages) {
  const seen = {};
  pages.forEach(p => { seen[p.kind] = (seen[p.kind] || 0) + 1; p.pid = `${p.lay ? 'l-' : ''}${p.kind}-${seen[p.kind]}`; });   // 새 배치 쪽은 예전 앨범의 틀 옮김 기록과 섞이지 않게 번호표를 따로 씀
  const e = S.pageEdits;
  if (!e) return;
  for (const x of e.extra || []) {
    const page = { kind: 'free', pid: `free-${x.id}`, label: '새 쪽', bg: ['soft', TONES[x.id % TONES.length]], html: '<div class="col"></div>' };
    const at = pages.findIndex(p => p.pid === x.after);
    pages.splice(at < 0 ? pages.length : at + 1, 0, page);
  }
  const hidden = new Set(e.hidden || []);
  for (let i = pages.length - 1; i >= 0; i--) if (hidden.has(pages[i].pid)) pages.splice(i, 1);
}
/* 페이지의 모든 글씨를 눌러 고치거나 지울 수 있게: E()로 만들지 않은 글씨에 저장 키를 붙임.
   키는 쪽 + 글씨 종류 + 순번이라 명단 순서가 바뀌면 고친 글씨는 자리를 따라감 */
function safeTextHtml(html) {
  const t = document.createElement('template');
  t.innerHTML = String(html);
  const clean = n => [...n.childNodes].forEach(c => {
    if (c.nodeType === 3) return;
    if (c.nodeType !== 1 || !/^(SPAN|SMALL|B|I|BR)$/.test(c.tagName)) { c.replaceWith(document.createTextNode(c.textContent || '')); return; }
    [...c.attributes].forEach(a => { if (a.name !== 'class') c.removeAttribute(a.name); });
    clean(c);
  });
  clean(t.content);
  return t.innerHTML;
}
function makeTextsEditable() {
  document.querySelectorAll('.page, .wrap-sheet').forEach(root => {
    const pid = root.dataset.pid || 'wrap', seen = {};
    const walk = el => {
      for (const c of el.children) {
        if (c.matches('.photo,.guide,.fr-ghost,button,svg,style,script')) continue;
        if (c.matches('.rule')) {      // 장식 바(선 + 마름모): 글자는 못 쓰지만 글자틀처럼 골라서 옮기기 · 크기 · 지우기
          const n = seen.rule = (seen.rule || 0) + 1;
          if (!c.dataset.key) { c.dataset.key = `tx|${pid}|rule|${n}`; c.setAttribute('contenteditable', 'false'); c.title = '장식 바 · 끌어서 옮기기, Delete로 지우기'; }
          continue;
        }
        if (c.hasAttribute('contenteditable') && !c.dataset.key?.startsWith('tx|')) continue;
        if (![...c.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && !c.dataset.key) { walk(c); continue; }
        const sig = (c.classList[0] || c.tagName).replace(/[^\w-]/g, ''), n = seen[sig] = (seen[sig] || 0) + 1;
        if (c.dataset.key) continue;
        const key = `tx|${pid}|${sig}|${n}`;
        c.dataset.key = key;
        c.setAttribute('contenteditable', 'plaintext-only');
        c.spellcheck = false;
        if (texts[key] != null) { c.innerHTML = safeTextHtml(texts[key]); if (!c.textContent.trim()) c.innerHTML = ''; }
      }
    };
    walk(root);
  });
}
function frameClick(el, key, shift) {
  if (!el.closest('.trim')) { pickPhoto(key); return; }     // 표지 전개도 등은 예전처럼
  const page = el.closest(PAGE_SEL);
  framePage = page.dataset.pid;
  if (shift && (frameMulti.length || frameSel)) {          // Shift+클릭: 여러 틀 고르기에 더하거나 빼기
    const list = frameMulti.length ? frameMulti : [frameSel];      // 글자틀을 고른 채 Shift+클릭해도 함께 고름
    const at = list.findIndex(s => s.pid === page.dataset.pid && s.key === key);
    setFrameMulti(at < 0 ? [...list, { key, pid: page.dataset.pid }] : list.filter((_, i) => i !== at));
    return;
  }
  frameMulti = [];
  frameSel = { key, pid: page.dataset.pid };
  syncFrameSel();
}
function frameNote(msg) { const n = $('#fr-note'); if (n) n.textContent = msg; }
const hiddenFrames = () => [...Object.entries(S.frameEdits?.over || {}), ...Object.entries(S.frameEdits?.text || {})].filter(([, b]) => b.hidden);
function syncFrameSel() {
  syncFrameMulti();
  const ui = $('#fr-sel');
  if (!ui) return;
  const rb = $('#fr-restore'), hid = hiddenFrames().length;
  if (rb) { rb.hidden = !hid; rb.textContent = `삭제한 틀 되돌리기 (${hid}개)`; }
  const fr = selFrameEl();
  ui.hidden = !fr;
  if (!fr) return;
  const r = fr.getBoundingClientRect(), box = ui.querySelector('.fr-box'), bar = ui.querySelector('.fr-bar');
  Object.assign(box.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
  const isText = frameSel.kind === 'text', id = `${frameSel.pid}|${frameSel.key}`;
  box.classList.toggle('is-text', isText);
  const locked = selLocked();
  box.classList.toggle('is-locked', locked);
  const has = !isText && !!photos[frameSel.key], extra = !isText && !!frameExtra(frameSel.key);
  const moved = isText ? !!S.frameEdits?.text?.[id] : !!S.frameEdits?.over?.[id];
  const on = { cut: has, copy: has, paste: !!frameClip, reset: moved && !locked, del: !locked, swap: true, frame: true, tools: has, room: has, small: !locked, big: !locked, fwd: true, back: true, lock: true };
  const forText = { small: 1, big: 1, reset: 1, del: 1, fwd: 1, back: 1, lock: 1 };
  bar.querySelector('[data-act="lock"]').textContent = locked ? '🔒 잠금 풀기' : '잠그기';
  bar.querySelectorAll('button').forEach(b => { b.disabled = !on[b.dataset.act]; b.hidden = isText ? !forText[b.dataset.act] : !!b.dataset.tx; });
  if (extra) bar.querySelector('[data-act="reset"]').hidden = true;
  bar.querySelector('[data-act="swap"]').textContent = has ? '사진 바꾸기' : '사진 넣기';
  bar.querySelector('[data-act="del"]').textContent = isText ? '글자틀 삭제' : '틀 삭제';
  bar.querySelector('[data-act="reset"]').textContent = isText ? '글자틀 원래대로' : '틀 원래대로';
  const bw = bar.offsetWidth, bh = bar.offsetHeight, panel = $('.panel')?.getBoundingClientRect().right || 0;
  bar.style.left = `${Math.max(panel + 6, Math.min(innerWidth - bw - 6, r.left + r.width / 2 - bw / 2))}px`;
  bar.style.top = `${r.top - bh - 8 >= 6 ? r.top - bh - 8 : Math.min(innerHeight - bh - 6, r.bottom + 8)}px`;
}
/** 편집 화면(미리보기) 크기. 화면 가운데 보던 곳이 그대로 가운데에 오도록 스크롤을 맞춤 */
function setViewZoom(z) {
  const box = $('#f-zoom'), min = +box.min, max = +box.max;
  z = Math.round(Math.min(max, Math.max(min, +z)) * 100) / 100;
  const se = document.scrollingElement, cx = (se.scrollLeft + innerWidth / 2) / se.scrollWidth, cy = (se.scrollTop + innerHeight / 2) / se.scrollHeight;
  S.zoom = z; box.value = z; saveState();
  document.documentElement.style.setProperty('--zoom', z);
  se.scrollLeft = cx * se.scrollWidth - innerWidth / 2;
  se.scrollTop = cy * se.scrollHeight - innerHeight / 2;
  syncFrameSel();
}
/* Ctrl + 화면 확대, Ctrl - 화면 축소 (브라우저 전체 확대 대신 편집 화면만) */
function bindViewZoom() {
  addEventListener('keydown', e => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.target.closest?.('input,textarea,select') || document.querySelector('dialog[open]')) return;
    const up = { Equal: true, NumpadAdd: true, Minus: false, NumpadSubtract: false }[e.code] ?? { '+': true, '=': true, '-': false }[e.key];
    if (up === undefined) return;
    e.preventDefault();
    setViewZoom(+S.zoom + (up ? .1 : -.1));
  });
}
/* 손바닥 도구 (인디자인처럼): 스페이스바를 누르고 있는 동안 끌면 편집 화면이 따라 움직임.
   그동안은 사진 끌기 · 틀 선택이 일어나지 않도록 가장 먼저(window 캡처 단계에서) 가로챔 */
function bindHandTool() {
  let on = false, pan = null, moved = false;
  const typing = e => e.target.closest?.('input,textarea,select,[contenteditable]') || document.querySelector('dialog[open]') || document.querySelector('#photo-room:not([hidden])');
  const set = v => { on = v; document.body.classList.toggle('hand-tool', v); if (!v) { pan = null; document.body.classList.remove('hand-pan'); } };
  addEventListener('keydown', e => { if (e.code !== 'Space' || typing(e)) return; e.preventDefault(); if (!on) set(true); });
  addEventListener('keyup', e => { if (e.code === 'Space') set(false); });
  addEventListener('blur', () => set(false));
  addEventListener('pointerdown', e => {
    if (!on) moved = false;      // 손바닥으로 끈 뒤 클릭이 안 일어났어도 다음 클릭은 정상으로
    if (!on || e.button !== 0) return;
    e.preventDefault(); e.stopImmediatePropagation();
    pan = { x: e.clientX, y: e.clientY }; moved = false;
    document.body.classList.add('hand-pan');
  }, true);
  addEventListener('pointermove', e => {
    if (!pan) return;
    e.preventDefault(); e.stopImmediatePropagation();
    scrollBy(pan.x - e.clientX, pan.y - e.clientY);
    pan = { x: e.clientX, y: e.clientY }; moved = true;
  }, true);
  addEventListener('pointerup', e => { if (!pan) return; e.stopImmediatePropagation(); pan = null; document.body.classList.remove('hand-pan'); }, true);
  addEventListener('click', e => { if (on || moved) { e.preventDefault(); e.stopImmediatePropagation(); moved = false; } }, true);     // 끈 뒤 버튼 · 틀이 눌리지 않게
}
/** 틀에 꽉 차는 배율(fill)과 사진 전체가 보이는 배율(fit). 보통 틀은 꽉 차는 크기가 1배 */
function photoScales(key) {
  const p = photos[key], el = frameSel && document.querySelector(`${PG(frameSel.pid)} .photo[data-photo="${CSS.escape(key)}"]`);
  if (!p || !el) return null;
  const a = el.offsetWidth / p.w, b = el.offsetHeight / p.h, contain = el.classList.contains('contain');
  return { p, fill: contain ? Math.max(a, b) / Math.min(a, b) : 1, fit: contain ? 1 : Math.min(a, b) / Math.max(a, b) };
}
/** 고른 틀 안의 사진 확대(up) · 축소. 틀 크기는 그대로, 사진 전체가 보이는 크기 ~ 5배 */
function zoomPhoto(key, up) {
  const sc = photoScales(key);
  if (!sc) return;
  const { p } = sc;
  p.z = Math.min(5, Math.max(Math.min(1, sc.fit), p.z * (up ? 1.08 : 1 / 1.08)));
  applyKey(key);
  persistPos(key);
  frameNote(`사진 크기 ${Math.round(p.z / sc.fill * 100)}%`);
}
/** 틀 안의 사진을 90° 돌림 (dir 1: 시계 방향, -1: 반대) */
const rotatePhoto = (key, dir = 1) => rotatePhotoTo(key, (photos[key]?.rot || 0) + 90 * dir);
/** 틀 안의 사진을 deg도로 돌림 (인디자인처럼 아무 각도나). 처음 돌리기 전 사진을 'rot0--키'로 보관하고 늘 그 사진에서 돌리므로
    여러 번 돌려도 화질이 떨어지지 않음. 비스듬히 돌리면 귀퉁이에 빈 곳이 생기지 않게 사진 안쪽을 잘라 씀 (인쇄 · PDF에도 그대로) */
async function rotatePhotoTo(key, deg) {
  const p = photos[key];
  if (!p?.blob || /svg/.test(p.blob.type)) return;
  deg = Math.round((((deg % 360) + 540) % 360 - 180) * 10) / 10;      // -180 ~ 180, 0.1° 단위
  const bk = `rot0--${key}`, r0 = p.rot || 0;
  if (!photos[bk]) { photos[bk] = { blob: p.blob, w: p.w, h: p.h, x: 50, y: 50, z: 1 }; await DB.putQuiet(bk, recOf(photos[bk])); }      // 보관본 저장은 실행취소 단계로 세지 않음
  const base = photos[bk], bm = await createImageBitmap(base.blob);
  const q = Math.round(deg / 90), phi = Math.abs(deg - q * 90) * Math.PI / 180, c = Math.cos(phi), s = Math.sin(phi);
  const W0 = q % 2 ? bm.height : bm.width, H0 = q % 2 ? bm.width : bm.height;
  const k = Math.min(W0 / (W0 * c + H0 * s), H0 / (W0 * s + H0 * c));      // 돌린 사진 안에 꽉 차는 같은 비율 사각형
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(W0 * k)); cv.height = Math.max(1, Math.round(H0 * k));
  const g = cv.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.translate(cv.width / 2, cv.height / 2); g.rotate(deg * Math.PI / 180); g.drawImage(bm, -bm.width / 2, -bm.height / 2); bm.close();
  const type = base.blob.type === 'image/png' ? 'image/png' : 'image/jpeg', blob = await new Promise(r => cv.toBlob(r, type, .95));
  if (!blob || photos[key] !== p) return;
  let { x, y } = p;
  for (let t = Math.round(r0 / 90), n = Math.abs(q - t), d = Math.sign(q - t); n > 0; n--) [x, y] = d > 0 ? [100 - y, x] : [y, 100 - x];     // 90°씩 넘어가면 보이던 자리도 함께 돌림
  URL.revokeObjectURL(p.url);
  Object.assign(p, { blob, w: cv.width, h: cv.height, url: URL.createObjectURL(blob), x, y, rot: deg || undefined, fx: undefined, fy: undefined, fh: undefined });
  if (!deg) { delete photos[bk]; await DB.drop(bk); }      // 0°로 돌아오면 보관본은 필요 없음 (사진이 처음과 같아짐)
  if (!deg) Object.assign(p, { blob: base.blob, w: base.w, h: base.h, url: URL.createObjectURL(base.blob) });
  await DB.put(key, recOf(p));
  applyKey(key);
  frameNote(`사진 각도 ${deg}°`);
}
/** 인디자인처럼 Ctrl+Alt+Shift+C: 틀에 꽉 차게, Ctrl+Alt+Shift+E: 사진 전체가 보이게 (가운데 맞춤) */
function fitPhoto(key, mode) {
  const sc = photoScales(key);
  if (!sc) return;
  Object.assign(sc.p, { z: mode === 'fill' ? sc.fill : sc.fit, x: 50, y: 50 });
  applyKey(key);
  persistPos(key);
  frameNote(mode === 'fill' ? '사진을 틀에 꽉 차게 맞췄습니다.' : '사진 전체가 보이게 맞췄습니다.');
}
function cutCopyPhoto(cut) {
  const p = frameSel && photos[frameSel.key];
  if (!p) return;
  frameClip = { kind: 'photo', blob: p.blob };
  frameNote(cut ? '사진을 잘라냈습니다. 옮길 틀을 누르고 Ctrl+Alt+V (또는 Ctrl+V)를 누르세요.' : '사진을 복사했습니다. 넣을 틀을 누르고 Ctrl+Alt+V (또는 Ctrl+V)를 누르세요.');
  if (cut) removePhoto(frameSel.key);
  syncFrameSel();
}
const clipFile = c => new File([c.blob], 'paste', { type: c.blob.type || 'image/jpeg' });
function copyFrame() {
  const fr = frameSel && frameElOf(frameSel.pid, frameSel.key);
  if (!fr) return;
  const p = photos[frameSel.key];
  frameClip = { kind: 'frame', pid: frameSel.pid, box: frameBox(fr), cls: [...fr.classList].filter(c => !/^(fr-|x-frame)/.test(c)).join(' '), blob: p?.blob, pos: p && { x: p.x, y: p.y, z: p.z } };
  frameNote('틀을 복사했습니다. 넣을 쪽을 누르고 붙여넣기(Ctrl+V)를 하세요.');
  syncFrameSel();
}
async function pasteFrame() {
  const c = frameClip, pid = framePage || c.pid, d = frameData();
  const same = pid === c.pid, id = d.next++, key = `fx-${id}`;
  const x = { id, pid, cls: c.cls, x: c.box.x + (same ? 3 : 0), y: c.box.y + (same ? 3 : 0), w: c.box.w, h: c.box.h };
  d.extra.push(x);
  saveState();
  applyFrames();
  if (c.blob) {
    await setPhoto(key, clipFile(c));
    Object.assign(photos[key], c.pos);
    await DB.put(key, recOf(photos[key]));
    applyKey(key);
  }
  frameSel = { key, pid };
  frameNote('틀을 붙여 넣었습니다. 위쪽 ✥ 를 끌어 옮기세요.');
  syncFrameSel();
}
/** 글자틀 복사 (Ctrl+C · 글자를 고르지 않은 채로). 모양(글꼴 · 크기 · 색) · 크기 · 글이 같은 새 글자틀을 붙여넣기로 만듦 */
function copyTextFrame() {
  const el = frameSel?.kind === 'text' && selFrameEl();
  if (!el) return false;
  const id = `${frameSel.pid}|${frameSel.key}`, saved = textOver()[id];
  const font = { ...(saved?.font || captureFont(el)) }, text = el.innerText.replace(/\n$/, '');
  if (text.includes('\n')) font.ws = 'pre-line';
  const b = saved?.x != null ? saved : frameBox(el);
  frameClip = { kind: 'text', pid: frameSel.pid, box: { x: b.x, y: b.y, w: b.w, h: b.h }, font, text, n: 0 };
  frameNote('글자틀을 복사했습니다. 넣을 쪽의 빈 곳을 누르고 붙여넣기(Ctrl+V)를 하세요.');
  syncFrameSel();
  return true;
}
/** at: { pid, x, y } 마우스 오른쪽 버튼으로 붙일 때 그 자리(쪽 폭 % 단위) */
function pasteTextFrame(at = null) {
  const c = frameClip;
  if (c?.kind !== 'text') return;
  const pid = at?.pid || framePage || c.pid, d = frameData(), id = d.next++, key = `xt-${id}`;
  const step = !at && pid === c.pid ? 3 * ++c.n : 0;          // 같은 쪽이면 조금씩 비켜서
  (d.xtext ||= []).push({ id, pid });
  texts[key] = c.text;
  textOver()[`${pid}|${key}`] = { x: at ? at.x : c.box.x + step, y: at ? at.y : c.box.y + step, w: c.box.w, h: c.box.h, font: { ...c.font } };
  saveState();
  applyFrames();
  applyTextFrames();
  frameSel = { kind: 'text', key, pid };
  frameNote('글자틀을 붙여 넣었습니다. 글자를 끌어서 옮기세요.');
  syncFrameSel();
}
async function pasteClip() {
  const c = frameClip;
  if (!c) return;
  if (c.kind === 'text') return pasteTextFrame();
  if (c.kind === 'frame') return pasteFrame();
  return pasteInto();
}
/** 고른 사진틀 안으로 붙여넣기 (Ctrl+Alt+V): 복사한 틀이어도 그 안의 사진만 넣음 */
async function pasteInto() {
  const c = frameClip;
  if (!c?.blob) return;
  if (!frameSel || frameSel.kind === 'text') { frameNote('붙여 넣을 사진틀을 먼저 누르세요.'); return; }
  const old = photos[frameSel.key];
  frameClip = old ? { kind: 'photo', blob: old.blob } : null;     // 있던 사진은 잃지 않도록 클립보드에 남김
  await setPhoto(frameSel.key, clipFile(c));
  frameNote(old ? '붙여 넣었습니다. 원래 있던 사진은 클립보드에 남아 있어 다른 틀에 붙여 넣을 수 있습니다.' : '붙여 넣었습니다.');
  syncFrameSel();
}
async function deleteFrame() {
  if (!frameSel) return;
  if (selLocked()) { frameNote('잠긴 틀은 지울 수 없습니다. Ctrl+L로 잠금을 먼저 푸세요.'); return; }
  if (frameSel.kind === 'text') {          // 글자틀도 숨겨 두어 되돌릴 수 있게
    const id = `${frameSel.pid}|${frameSel.key}`, t = textOver();
    t[id] = { ...(t[id] || {}), hidden: true };
    selFrameEl()?.classList.add('fr-hidden');
    document.activeElement?.blur?.();
    frameSel = null;
    saveState();
    frameNote('글자틀을 삭제했습니다. 왼쪽의 [삭제한 틀 되돌리기]로 살릴 수 있습니다.');
    syncFrameSel();
    return;
  }
  const x = frameExtra(frameSel.key), key = frameSel.key, d = frameData(), fr = frameElOf(frameSel.pid, key);
  if (x) {                       // 복사한 틀은 사진과 함께 완전히 지움
    fr?.remove();
    d.extra = d.extra.filter(e => e !== x);
    frameSel = null;
    saveState();
    if (photos[key]) await removePhoto(key);
  } else {                       // 원래 틀은 숨겨 두어 되돌릴 수 있게
    const id = `${frameSel.pid}|${key}`;
    d.over[id] = { ...(d.over[id] || {}), hidden: true };
    fr?.classList.add('fr-hidden');
    frameSel = null;
    saveState();
    frameNote('틀을 삭제했습니다. 왼쪽의 [삭제한 틀 되돌리기]로 살릴 수 있습니다.');
  }
  syncFrameSel();
}
function restoreFrames() {
  const over = frameData().over, tx = textOver();
  for (const [id, b] of hiddenFrames()) {
    if (b.x != null) delete b.hidden;
    else if (tx[id] === b) delete tx[id];
    else delete over[id];
  }
  frameNote('');
  saveState();
  render();
}
/* ============================================================
   레이어 순서 · 잠금 (인디자인처럼)
   Ctrl+]  앞으로 · Ctrl+Shift+]  맨 앞으로 · Ctrl+[  뒤로 · Ctrl+Shift+[  맨 뒤로
   Ctrl+L  고른 틀 잠금 / 풀기 · Ctrl+Alt+L  이 쪽의 잠금 모두 풀기
   순서는 쪽 안의 사진틀 · 글자틀 전체에 1부터 번호(z)를 다시 매겨 저장. 잠근 틀은 옮기기 · 크기 · 삭제가 막힘(사진 바꾸기 · 글 고치기는 됨)
   ============================================================ */
function layerRec(kind, pid, key, create) {
  const x = kind !== 'text' && frameExtra(key);
  if (x) return x;
  const map = kind === 'text' ? textOver() : frameData().over, id = `${pid}|${key}`;
  if (create && !map[id]) map[id] = {};
  return map[id];
}
const frameLocked = (pid, key, kind) => !!layerRec(kind, pid, key)?.lock;
const selLocked = () => !!frameSel && frameLocked(frameSel.pid, frameSel.key, frameSel.kind);
/** z-index를 받는 요소: 옮기지 않은 글자는 감싼 글자 상자(.lt)째로 */
const layerHolder = el => (el.matches('[data-key]') && !el.classList.contains('fr-placed') ? el.closest('.lt') || el : el);
function setLayerZ(h, z) {
  if (z == null) return;
  if (getComputedStyle(h).position === 'static') h.style.position = 'relative';
  h.style.zIndex = z;
}
function pageLayers(pid) {
  const page = document.querySelector(PG(CSS.escape(pid)));
  if (!page) return [];
  const list = [], byHolder = new Map();
  page.querySelectorAll('.trim .photo[data-photo]').forEach(ph => {
    const fr = ph.closest(FRAME_SEL) || ph.closest('.x-frame');
    if (!fr || byHolder.has(fr)) return;
    const it = { h: fr, items: [{ kind: 'frame', key: ph.dataset.photo }] };
    byHolder.set(fr, it); list.push(it);
  });
  page.querySelectorAll('.trim [data-key]').forEach(t => {
    if (!t.isContentEditable && !t.hasAttribute('contenteditable')) return;
    const h = layerHolder(t);
    if (byHolder.has(h)) { byHolder.get(h).items.push({ kind: 'text', key: t.dataset.key }); return; }
    const it = { h, items: [{ kind: 'text', key: t.dataset.key }] };
    byHolder.set(h, it); list.push(it);
  });
  const zOf = h => parseInt(getComputedStyle(h).zIndex, 10) || 0;
  return list.sort((a, b) => zOf(a.h) - zOf(b.h) || (a.h.compareDocumentPosition(b.h) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
}
function layerMove(dir) {
  if (!frameSel) return;
  const el = selFrameEl();
  if (!el) return;
  const pid = frameSel.pid, list = pageLayers(pid), h = frameSel.kind === 'text' ? layerHolder(el) : el;
  const at = list.findIndex(it => it.h === h);
  if (at < 0) return;
  const [it] = list.splice(at, 1);
  const to = { front: list.length, rear: 0, fwd: Math.min(list.length, at + 1), back: Math.max(0, at - 1) }[dir];
  list.splice(to, 0, it);
  list.forEach((l, i) => {
    setLayerZ(l.h, i + 1);
    for (const x of l.items) layerRec(x.kind, pid, x.key, true).z = i + 1;
  });
  saveState();
  frameNote({ front: '맨 앞으로 보냈습니다.', rear: '맨 뒤로 보냈습니다.', fwd: '한 단계 앞으로 보냈습니다.', back: '한 단계 뒤로 보냈습니다.' }[dir] + ' (Ctrl+Z로 되돌리기)');
  syncFrameSel();
}
function toggleLock() {
  const sel = frameMulti.length ? frameMulti.map(s => ({ ...s, kind: s.kind || 'frame' })) : frameSel ? [frameSel] : [];
  if (!sel.length) return false;
  const lock = !sel.every(s => frameLocked(s.pid, s.key, s.kind));
  for (const s of sel) { const r = layerRec(s.kind, s.pid, s.key, true); if (lock) r.lock = true; else delete r.lock; }
  if (lock && frameMulti.length) { frameSel = frameMulti[0]; frameMulti = []; }
  saveState();
  frameNote(lock ? `${sel.length > 1 ? `틀 ${sel.length}개를` : '틀을'} 잠갔습니다. 옮기기 · 크기 · 삭제가 막힙니다. Ctrl+L로 풉니다.` : '잠금을 풀었습니다.');
  syncFrameSel();
  return true;
}
function unlockPage() {
  const pid = frameSel?.pid || framePage;
  if (!pid) return;
  let n = 0;
  for (const map of [frameData().over, textOver()]) for (const [id, b] of Object.entries(map)) if (id.startsWith(`${pid}|`) && b.lock) { delete b.lock; n++; }
  for (const x of frameData().extra || []) if (x.pid === pid && x.lock) { delete x.lock; n++; }
  saveState();
  frameNote(n ? `이 쪽의 잠긴 틀 ${n}개를 모두 풀었습니다.` : '이 쪽에 잠긴 틀이 없습니다.');
  syncFrameSel();
}
/** 사진 바꾸기 (인디자인 Swap Images): Shift+클릭으로 고른 사진틀 두 개의 사진을 맞바꿈. F8 · 오른쪽 버튼 메뉴. 한쪽이 비어 있으면 사진이 옮겨감 */
async function swapPhotos() {
  if (frameMulti.length !== 2 || frameMulti.some(s => s.kind === 'text')) { frameNote('사진틀 두 개를 Shift+클릭으로 고른 뒤 F8(또는 오른쪽 버튼 → 사진 바꾸기)을 누르세요.'); return; }
  const [a, b] = frameMulti.map(s => s.key);
  if (a === b || (!photos[a] && !photos[b])) { frameNote('바꿀 사진이 없습니다.'); return; }
  const put = async (k, p) => {
    if (p) { photos[k] = { ...p, z: 1 }; await DB.put(k, recOf(photos[k])); }     // 틀 크기가 달라도 꽉 차게 (확대는 처음으로, 위치는 유지)
    else { delete photos[k]; await DB.drop(k); }
  };
  const pa = photos[a], pb = photos[b], oa = photos[`orig--${a}`], ob = photos[`orig--${b}`];
  await put(a, pb); await put(b, pa);
  if (oa || ob) { await put(`orig--${a}`, ob); await put(`orig--${b}`, oa); }     // 이미지 도구의 원본도 함께
  { const ra = photos[`rot0--${a}`], rb = photos[`rot0--${b}`]; if (ra || rb) { await put(`rot0--${a}`, rb); await put(`rot0--${b}`, ra); } }     // 돌리기 보관본도 함께
  applyKey(a); applyKey(b);
  frameNote('두 사진의 자리를 바꿨습니다. (Ctrl+Z로 되돌리기)');
  syncFrameSel();
}
/* 마우스 오른쪽 버튼 메뉴: 글자 위에서는 글자틀 복사 · 붙여넣기 · 순서 · 잠금 · 삭제, 쪽의 빈 곳에서는 누른 자리에 붙여넣기,
   사진틀 두 개를 고른 채로는 사진 바꾸기 */
function bindContextMenu() {
  document.body.insertAdjacentHTML('beforeend', '<div id="ctx-menu" hidden></div>');
  const menu = $('#ctx-menu');
  const hide = () => { menu.hidden = true; };
  let at = null;
  const items = {
    swap: ['사진 바꾸기  F8', () => swapPhotos()],
    copyText: ['글자만 복사', () => document.execCommand('copy')],
    copy: ['글자틀 복사  Ctrl+C', () => copyTextFrame()],
    paste: ['글자틀 붙여넣기  Ctrl+V', () => pasteTextFrame(at)],
    fwd: ['앞으로  Ctrl+]', () => layerMove('fwd')],
    front: ['맨 앞으로  Ctrl+Shift+]', () => layerMove('front')],
    back: ['뒤로  Ctrl+[', () => layerMove('back')],
    rear: ['맨 뒤로  Ctrl+Shift+[', () => layerMove('rear')],
    lock: ['잠그기  Ctrl+L', () => toggleLock()],
    del: ['글자틀 삭제', () => deleteFrame()],
  };
  const show = (list, e) => {
    menu.innerHTML = list.map(k => (k === '-' ? '<hr>' : `<button type="button" data-k="${k}">${items[k][0].replace(/  (.+)$/, '<small>$1</small>')}</button>`)).join('');
    menu.hidden = false;
    const w = menu.offsetWidth, h = menu.offsetHeight;
    menu.style.left = `${Math.min(innerWidth - w - 6, e.clientX)}px`;
    menu.style.top = `${Math.min(innerHeight - h - 6, e.clientY)}px`;
  };
  document.addEventListener('contextmenu', e => {
    // 사진틀 두 개를 고른 채로 그 위(또는 묶음 테두리 안)에서 누르면: 사진 바꾸기
    const ph = e.target.closest?.('.photo');
    if (frameMulti.length === 2 && (e.target.closest?.('#fr-multi') || frameMulti.some(s => s.key === ph?.dataset.photo))) { e.preventDefault(); show(['swap'], e); return; }
    const page = e.target.closest?.(PAGE_SEL);
    const tr = page?.querySelector('.trim');
    if (!page || !tr || page.dataset.pid.includes('~')) { hide(); return; }
    const txt = e.target.closest('.trim [contenteditable][data-key]');
    const onPhoto = !txt && e.target.closest('.trim .photo');
    if (onPhoto || (!txt && frameClip?.kind !== 'text')) { hide(); return; }      // 사진 위 · 붙일 것이 없으면 보통 메뉴
    e.preventDefault();
    framePage = page.dataset.pid;
    const q = tr.getBoundingClientRect(), cq = q.width / 100;
    at = { pid: page.dataset.pid, x: (e.clientX - q.left) / cq, y: (e.clientY - q.top) / cq };
    let list;
    if (txt) {
      const hasSel = !getSelection().isCollapsed && txt.contains(getSelection().anchorNode);
      frameSel = { kind: 'text', key: txt.dataset.key, pid: page.dataset.pid };
      syncFrameSel();
      const locked = selLocked();
      list = [...(hasSel ? ['copyText'] : []), 'copy', ...(frameClip?.kind === 'text' ? ['paste'] : []), '-', 'fwd', 'front', 'back', 'rear', '-', 'lock', ...(locked ? [] : ['del'])];
      items.lock[0] = locked ? '🔒 잠금 풀기  Ctrl+L' : '잠그기  Ctrl+L';
    } else list = ['paste'];
    show(list, e);
  });
  menu.addEventListener('pointerdown', e => e.preventDefault());       // 메뉴를 눌러도 글자 선택이 풀리지 않게
  menu.addEventListener('click', e => { const k = e.target.closest('button')?.dataset.k; hide(); if (k) items[k][1](); });
  document.addEventListener('pointerdown', e => { if (!e.target.closest?.('#ctx-menu')) hide(); }, true);
  addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  addEventListener('scroll', hide, { passive: true, capture: true });
  addEventListener('blur', hide);
}
function bindLayerKeys() {
  document.addEventListener('keydown', e => {
    if (e.key === 'F8' && !e.ctrlKey && !e.altKey && !document.querySelector('dialog[open]') && !e.target.closest?.('input,textarea,select')) {      // F8: 고른 두 사진 바꾸기
      e.preventDefault(); e.stopPropagation(); swapPhotos(); return;
    }
    if (!(e.ctrlKey || e.metaKey) || document.querySelector('dialog[open]') || e.target.closest?.('input,textarea,select')) return;
    if (e.code === 'KeyL') {
      if (e.altKey) { e.preventDefault(); e.stopPropagation(); unlockPage(); return; }
      if (frameSel || frameMulti.length) { e.preventDefault(); e.stopPropagation(); toggleLock(); }
      return;
    }
    // 글자틀 복사 · 붙여넣기: 글자를 드래그로 고른 상태면 예전처럼 글자만 복사, 아니면 글자틀째로
    const editing = document.activeElement?.isContentEditable, sel = getSelection();
    if (e.code === 'KeyC' && !e.altKey && frameSel?.kind === 'text') {
      if (editing && sel && !sel.isCollapsed && !e.shiftKey) return;
      e.preventDefault(); e.stopPropagation(); copyTextFrame(); return;
    }
    if (e.code === 'KeyX' && !e.altKey && frameSel?.kind === 'text') {      // 글자틀 잘라내기: 복사한 뒤 지움 → Ctrl+V로 원래 자리(다른 쪽이면 같은 위치)에 붙음
      if (editing && sel && !sel.isCollapsed && !e.shiftKey) return;      // 글자를 고른 상태면 글자만 잘라내기
      e.preventDefault(); e.stopPropagation();
      if (selLocked()) { frameNote('잠긴 틀은 잘라낼 수 없습니다. Ctrl+L로 잠금을 먼저 푸세요.'); return; }
      if (!copyTextFrame()) return;
      frameClip.n = -1;      // 처음 붙일 때는 비켜서지 않고 잘라낸 자리 그대로
      deleteFrame();
      frameNote('글자틀을 잘라냈습니다. 넣을 쪽을 누르고 Ctrl+V로 붙여넣으세요.');
      return;
    }
    if (e.code === 'KeyV' && !e.altKey && frameClip?.kind === 'text' && !editing) {
      e.preventDefault(); e.stopPropagation(); pasteTextFrame(); return;
    }
    if ((e.code === 'BracketRight' || e.code === 'BracketLeft') && frameSel) {
      e.preventDefault(); e.stopPropagation();
      layerMove(e.code === 'BracketRight' ? (e.shiftKey ? 'front' : 'fwd') : (e.shiftKey ? 'rear' : 'back'));
    }
  }, true);
}
/* ============================================================
   여러 사진틀 함께 편집 (인디자인처럼): 빈 곳에서 끌면 선택 상자가 그려지고 닿은 틀이 모두 골라짐.
   Shift+클릭으로 더하거나 빼기. 묶음 테두리의 손잡이를 끌면 고른 틀이 함께 늘거나 줄고, 테두리 · ✥ 를 끌면 함께 옮겨짐.
   ============================================================ */
let frameMulti = [];
/* 여러 틀 고르기에는 사진틀 { key, pid } 과 글자틀 { kind: 'text', key, pid } 이 함께 들어갈 수 있음 */
const multiEls = () => frameMulti.map(s => ({ ...s, fr: s.kind === 'text' ? textElOf(s.pid, s.key) : frameElOf(s.pid, s.key) })).filter(s => s.fr && !s.fr.closest('.fr-hidden') && s.fr.isConnected);
const multiLabel = (list = frameMulti) => { const t = list.filter(s => s.kind === 'text').length, p = list.length - t; return [p && `사진틀 ${p}개`, t && `글자틀 ${t}개`].filter(Boolean).join(' · '); };
function setFrameMulti(list) {
  const seen = new Set();
  frameMulti = list.map(s => (s.kind === 'text' ? { kind: 'text', key: s.key, pid: s.pid } : { key: s.key, pid: s.pid }))
    .filter(s => { const id = `${s.pid}|${s.key}`; if (seen.has(id) || (list.length > 1 && frameLocked(s.pid, s.key, s.kind))) return false; seen.add(id); return true; });     // 잠근 틀은 여러 틀 고르기에서 빠짐
  if (frameMulti.length === 1) { frameSel = frameMulti[0]; frameMulti = []; }
  else if (frameMulti.length) { frameSel = null; if (document.activeElement?.isContentEditable) document.activeElement.blur(); }
  const photosOnly = frameMulti.every(s => s.kind !== 'text');
  if (frameMulti.length) frameNote(`${multiLabel()}를 골랐습니다. 테두리를 끌면 함께 옮겨지고, 모서리 손잡이를 끌면 함께 크기가 바뀝니다 (Shift: 비율 유지).${frameMulti.length === 2 && photosOnly ? " F8을 누르면 두 사진이 맞바뀝니다." : ""}`);
  syncFrameSel();
}
function multiRect(list) {
  const rs = list.map(s => s.fr.getBoundingClientRect());
  const l = Math.min(...rs.map(r => r.left)), t = Math.min(...rs.map(r => r.top));
  return { l, t, w: Math.max(...rs.map(r => r.right)) - l, h: Math.max(...rs.map(r => r.bottom)) - t, rs };
}
function syncFrameMulti() {
  const ui = $('#fr-multi');
  if (!ui) return;
  const list = multiEls();
  if (list.length < frameMulti.length) frameMulti = list.map(({ key, pid, kind }) => (kind === 'text' ? { kind, key, pid } : { key, pid }));    // 다시 그려져 사라진 틀은 뺌
  ui.hidden = list.length < 2;
  if (ui.hidden) return;
  const m = multiRect(list), box = ui.querySelector('.fr-box');
  Object.assign(box.style, { left: `${m.l}px`, top: `${m.t}px`, width: `${m.w}px`, height: `${m.h}px` });
  ui.querySelector('.fm-outs').innerHTML = m.rs.map(r => `<i class="fm-out" style="left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px"></i>`).join('');
  const tag = ui.querySelector('.fm-tag');
  tag.textContent = `${multiLabel(list)} · 손잡이를 끌면 함께 크기 변경`;
  tag.style.left = `${Math.max(($('.panel')?.getBoundingClientRect().right || 0) + 6, m.l)}px`;
  tag.style.top = `${m.t - 34 >= 6 ? m.t - 34 : m.t + m.h + 8}px`;
}
function bindMultiFrames() {
  document.body.insertAdjacentHTML('beforeend', `<div id="fr-multi" hidden><div class="fm-outs"></div>
    <div class="fr-box fm-box">${['t', 'r', 'b', 'l'].map(s => `<i class="fr-edge fr-edge-${s}" data-h="move" title="끌어서 함께 옮기기"></i>`).join('')}<button type="button" class="fr-grip" title="함께 옮기기" data-h="move">✥</button>${['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(h => `<i class="fr-h fr-${h}" data-h="${h}"></i>`).join('')}</div>
    <div class="fm-tag"></div></div><div id="fr-marquee" hidden></div>`);
  const ui = $('#fr-multi'), box = ui.querySelector('.fr-box'), mq = $('#fr-marquee');

  // 묶음 크기 바꾸기 · 옮기기
  let g = null;
  box.addEventListener('pointerdown', e => {
    const h = e.target.dataset.h, list = multiEls();
    if (!h || list.length < 2) return;
    e.preventDefault(); e.stopPropagation();
    list.forEach(s => {
      if (s.kind !== 'text') { placeFrame(s.fr, frameBox(s.fr)); return; }
      const b = frameBox(s.fr);      // 글자틀: 글꼴 값을 함께 들고 다님 (옮기면 원래 자리의 글꼴 규칙이 사라지므로)
      b.font = textOver()[`${s.pid}|${s.key}`]?.font || captureFont(s.fr);
      placeText(s.fr, b);
      s.font = b.font;
    });
    const m = multiRect(list);
    g = { h, m, x0: e.clientX, y0: e.clientY, items: list.map((s, i) => { const t = s.fr.closest('.trim').getBoundingClientRect(); return { ...s, r: m.rs[i], t, cq: t.width / 100 }; }) };
    e.target.setPointerCapture(e.pointerId);
  });
  box.addEventListener('pointermove', e => {
    if (!g) return;
    const { m, h } = g, dx = e.clientX - g.x0, dy = e.clientY - g.y0, min = 20;
    let l = m.l, t = m.t, w = m.w, hh = m.h;
    if (h === 'move') { const [ax, ay] = axisLock(e, dx, dy); l += ax; t += ay; }
    else {
      if (h.includes('e')) w = Math.max(min, m.w + dx);
      if (h.includes('s')) hh = Math.max(min, m.h + dy);
      if (h.includes('w')) { w = Math.max(min, m.w - dx); l = m.l + m.w - w; }
      if (h.includes('n')) { hh = Math.max(min, m.h - dy); t = m.t + m.h - hh; }
      if (e.shiftKey && h.length === 2) {
        const k = Math.max(w / m.w, hh / m.h);
        w = m.w * k; hh = m.h * k;
        if (h.includes('w')) l = m.l + m.w - w;
        if (h.includes('n')) t = m.t + m.h - hh;
      }
    }
    const sx = w / m.w, sy = hh / m.h;
    g.items.forEach(it => {
      const nl = l + (it.r.left - m.l) * sx, nt = t + (it.r.top - m.t) * sy;
      it.box = { x: (nl - it.t.left) / it.cq, y: (nt - it.t.top) / it.cq, w: Math.max(FRAME_MIN, it.r.width * sx / it.cq), h: Math.max(FRAME_MIN, it.r.height * sy / it.cq) };
      if (it.kind === 'text') setTextStyle(it.fr, { ...it.box, font: it.font });
      else { setFrameStyle(it.fr, it.box); it.fr.querySelectorAll('.photo').forEach(applyPhoto); }
    });
    syncFrameMulti();
  });
  const finish = () => {
    if (!g) return;
    const d = g; g = null;
    d.items.forEach(it => {
      if (!it.box) return;
      if (it.kind === 'text') { const id = `${it.pid}|${it.key}`; textOver()[id] = { ...(textOver()[id] || {}), ...it.box, font: it.font }; return; }
      const x = frameExtra(it.key);
      if (x) Object.assign(x, it.box);
      else frameData().over[`${it.pid}|${it.key}`] = { ...(frameData().over[`${it.pid}|${it.key}`] || {}), ...it.box };
    });
    saveState();
    syncFrameSel();
  };
  box.addEventListener('pointerup', finish);
  box.addEventListener('pointercancel', finish);

  // 빈 곳에서 끌어 선택 상자 그리기
  let sel = null;
  $('#pages').addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('.photo,[contenteditable],button,input,select,textarea,a,.gal-add,.gal-shape')) return;
    sel = { x0: e.clientX, y0: e.clientY, on: false, add: e.shiftKey, id: e.pointerId };
  });
  addEventListener('pointermove', e => {
    if (!sel) return;
    if (!sel.on) {
      if (Math.hypot(e.clientX - sel.x0, e.clientY - sel.y0) < 5) return;
      sel.on = true;
      document.body.classList.add('fr-marqueeing');
      getSelection()?.removeAllRanges();
    }
    e.preventDefault();
    const l = Math.min(sel.x0, e.clientX), t = Math.min(sel.y0, e.clientY);
    sel.r = { l, t, r: Math.max(sel.x0, e.clientX), b: Math.max(sel.y0, e.clientY) };
    Object.assign(mq.style, { left: `${l}px`, top: `${t}px`, width: `${sel.r.r - l}px`, height: `${sel.r.b - t}px` });
    mq.hidden = false;
  });
  const done = () => {
    if (!sel) return;
    const s = sel; sel = null;
    mq.hidden = true;
    document.body.classList.remove('fr-marqueeing');
    if (!s.on || !s.r) return;
    const hit = [...document.querySelectorAll('#pages .trim .photo[data-photo]')].map(p => ({ p, fr: p.closest(FRAME_SEL) })).filter(({ fr }) => {
      if (!fr || fr.closest('.fr-hidden,.fr-ghost')) return false;
      const r = fr.getBoundingClientRect();
      return r.width && r.right > s.r.l && r.left < s.r.r && r.bottom > s.r.t && r.top < s.r.b;
    }).map(({ p, fr }) => ({ key: p.dataset.photo, pid: fr.closest(PAGE_SEL).dataset.pid }));
    // 글자틀: 선택 상자 안에 글자틀 가운데가 들어오면 함께 고름 (가장자리만 스친 큰 글자틀까지 잡히지 않게)
    for (const t of document.querySelectorAll('#pages .trim [contenteditable][data-key]')) {
      if (t.closest('.fr-hidden,.fr-ghost') || !t.textContent.trim()) continue;
      const r = t.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (r.width && cx > s.r.l && cx < s.r.r && cy > s.r.t && cy < s.r.b) hit.push({ kind: 'text', key: t.dataset.key, pid: t.closest(PAGE_SEL).dataset.pid });
    }
    const base = s.add ? (frameMulti.length ? frameMulti : frameSel ? [frameSel] : []) : [];
    if (!hit.length && !base.length) return;
    framePage = hit[0]?.pid || framePage;
    frameSel = null; frameMulti = [];
    setFrameMulti([...base, ...hit]);
  };
  addEventListener('pointerup', done);
  addEventListener('pointercancel', done);
}
function resetFrame() {
  if (!frameSel) return;
  delete (frameSel.kind === 'text' ? textOver() : frameData().over)[`${frameSel.pid}|${frameSel.key}`];
  saveState();
  render();
}
function bindFrameEditor() {
  document.body.insertAdjacentHTML('beforeend', `<div id="fr-sel" hidden>
    <div class="fr-box">${['t', 'r', 'b', 'l'].map(s => `<i class="fr-edge fr-edge-${s}" data-h="move" title="끌어서 틀 옮기기"></i>`).join('')}<button type="button" class="fr-grip" title="틀 옮기기" data-h="move">✥</button>${['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(h => `<i class="fr-h fr-${h}" data-h="${h}"></i>`).join('')}</div>
    <div class="fr-bar">
      <button type="button" data-act="small" data-tx="1" title="글자 작게">글자 작게</button>
      <button type="button" data-act="big" data-tx="1" title="글자 크게">글자 크게</button>
      <button type="button" data-act="cut" title="Ctrl+X 또는 Ctrl+Alt+X">사진 잘라내기</button>
      <button type="button" data-act="copy" title="Ctrl+C">사진 복사</button>
      <button type="button" data-act="paste" title="Ctrl+V · 틀 안으로는 Ctrl+Alt+V">붙여넣기</button>
      <button type="button" data-act="swap" title="두 번 누르기">사진 바꾸기</button>
      <button type="button" data-act="room" title="업무노트의 사진 편집실에서 보정">사진 편집실</button>
      <button type="button" data-act="tools" title="고해상도 · 벡터 · 계절">이미지 도구</button>
      <button type="button" data-act="frame" title="Ctrl+Shift+C">틀 복사</button>
      <button type="button" data-act="reset">틀 원래대로</button>
      <button type="button" data-act="fwd" title="앞으로 Ctrl+] · 맨 앞으로 Ctrl+Shift+]">앞으로</button>
      <button type="button" data-act="back" title="뒤로 Ctrl+[ · 맨 뒤로 Ctrl+Shift+[">뒤로</button>
      <button type="button" data-act="lock" title="Ctrl+L · 이 쪽 전부 풀기 Ctrl+Alt+L">잠그기</button>
      <button type="button" data-act="del">틀 삭제</button>
    </div></div>`);
  const ui = $('#fr-sel');
  ui.querySelector('.fr-bar').addEventListener('pointerdown', e => e.preventDefault());    // 버튼을 눌러도 글자 입력 상태 유지
  const acts = { small: () => changeFontSize(1 / 1.08), big: () => changeFontSize(1.08), cut: () => cutCopyPhoto(true), copy: () => cutCopyPhoto(false), paste: pasteClip, swap: () => frameSel && pickPhoto(frameSel.key), tools: () => frameSel && openImageTools(frameSel.key), room: () => frameSel && openPhotoRoom(frameSel.key), frame: copyFrame, reset: resetFrame, del: deleteFrame, fwd: () => layerMove('fwd'), back: () => layerMove('back'), lock: toggleLock };
  ui.querySelector('.fr-bar').addEventListener('click', e => { const a = e.target.closest('button')?.dataset.act; if (a) acts[a](); });

  let g = null;
  ui.querySelector('.fr-box').addEventListener('pointerdown', e => {
    const h = e.target.dataset.h;
    if (!h || !frameSel || selLocked()) return;     // 잠근 틀은 옮기기 · 크기 조절 안 됨
    const fr = selFrameEl();
    if (!fr) return;
    e.preventDefault();
    e.stopPropagation();
    const start = frameBox(fr), isText = frameSel.kind === 'text';
    if (isText) {
      start.font = textOver()[`${frameSel.pid}|${frameSel.key}`]?.font || captureFont(fr);
      placeText(fr, start);
    } else placeFrame(fr, start);
    g = { h, fr, start, isText, x0: e.clientX, y0: e.clientY, cq: fr.closest('.trim').getBoundingClientRect().width / 100, target: e.target, id: e.pointerId };
    e.target.setPointerCapture(e.pointerId);
  });
  // 글자를 눌러 바로 끌면 글자틀이 옮겨짐 (그냥 누르면 예전처럼 글자 고치기). 이미 고치는 중인 글자는 끌면 글자 선택
  let txPend = null;
  const startTextDrag = (e, txt, pid) => { if (frameLocked(pid, txt.dataset.key, 'text')) return; txPend ={ txt, pid, x0: e.clientX, y0: e.clientY, id: e.pointerId }; };
  addEventListener('pointermove', e => {
    if (txPend && !g && e.pointerId === txPend.id) {
      if (Math.hypot(e.clientX - txPend.x0, e.clientY - txPend.y0) < 5) return;
      const { txt, pid, x0, y0 } = txPend; txPend = null;
      if (!txt.isConnected) return;
      getSelection()?.removeAllRanges();
      txt.blur();
      frameSel = { kind: 'text', key: txt.dataset.key, pid };
      const start = frameBox(txt);
      start.font = textOver()[`${pid}|${txt.dataset.key}`]?.font || captureFont(txt);
      placeText(txt, start);
      g = { h: 'move', fr: txt, start, isText: true, x0, y0, cq: txt.closest('.trim').getBoundingClientRect().width / 100, win: true };
      document.body.classList.add('tx-dragging');
    }
    if (g?.win) { e.preventDefault(); dragMove(e); }
  });
  const endWin = () => { txPend = null; if (g?.win) { document.body.classList.remove('tx-dragging'); finish(); } };
  addEventListener('pointerup', endWin);
  addEventListener('pointercancel', endWin);
  ui.querySelector('.fr-box').addEventListener('pointermove', e => { if (g && !g.win) dragMove(e); });
  function dragMove(e) {
    if (!g) return;
    const dx = (e.clientX - g.x0) / g.cq, dy = (e.clientY - g.y0) / g.cq, s = g.start, b = { ...s };
    if (g.h === 'move') { const [ax, ay] = axisLock(e, dx, dy); b.x += ax; b.y += ay; }      // Shift: 수평 또는 수직으로만
    else {
      if (g.h.includes('e')) b.w = Math.max(FRAME_MIN, s.w + dx);
      if (g.h.includes('s')) b.h = Math.max(FRAME_MIN, s.h + dy);
      if (g.h.includes('w')) { b.w = Math.max(FRAME_MIN, s.w - dx); b.x = s.x + s.w - b.w; }
      if (g.h.includes('n')) { b.h = Math.max(FRAME_MIN, s.h - dy); b.y = s.y + s.h - b.h; }
      if (e.shiftKey && g.h.length === 2) {              // Shift: 비율 유지
        const k = Math.max(b.w / s.w, b.h / s.h);
        b.w = s.w * k; b.h = s.h * k;
        if (g.h.includes('w')) b.x = s.x + s.w - b.w;
        if (g.h.includes('n')) b.y = s.y + s.h - b.h;
      }
    }
    g.box = b;
    if (g.isText) setTextStyle(g.fr, b); else setFrameStyle(g.fr, b);
    g.fr.querySelectorAll('.photo').forEach(applyPhoto);
    syncFrameSel();
  }
  function finish() {
    if (!g) return;
    const d = g; g = null;
    const b = { ...(d.box || d.start) };
    if (d.isText) {
      const t0 = d.fr.closest('.trim').getBoundingClientRect(), keep0 = 3;
      b.x = Math.min(100 - keep0, Math.max(keep0 - b.w, b.x));
      b.y = Math.min(t0.height / (t0.width / 100) - keep0, Math.max(keep0 - b.h, b.y));
      setTextStyle(d.fr, b);
      textOver()[`${frameSel.pid}|${frameSel.key}`] = { ...(textOver()[`${frameSel.pid}|${frameSel.key}`] || {}), ...b };     // 순서(z) · 잠금은 유지
      saveState();
      syncFrameSel();
      return;
    }
    const x = frameExtra(frameSel.key);
    const fr = d.fr, r = fr.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const over = [...document.querySelectorAll(PAGE_SEL)].find(p => { const q = p.getBoundingClientRect(); return cx >= q.left && cx <= q.right && cy >= q.top && cy <= q.bottom; });
    let tr = fr.closest('.trim');
    if (x && over && over.dataset.pid !== x.pid) {        // 복사한 틀은 옆 쪽으로 끌어다 놓을 수 있음
      const nt = over.querySelector('.trim'), q = nt.getBoundingClientRect(), cq = q.width / 100;
      b.x = (r.left - q.left) / cq; b.y = (r.top - q.top) / cq;
      x.pid = frameSel.pid = framePage = over.dataset.pid;
      nt.appendChild(fr);
      tr = nt;
    }
    const t = tr.getBoundingClientRect(), keep = 5;       // 쪽 밖으로 사라지지 않도록 일부는 항상 쪽 안에
    b.x = Math.min(100 - keep, Math.max(keep - b.w, b.x));
    b.y = Math.min(t.height / (t.width / 100) - keep, Math.max(keep - b.h, b.y));
    setFrameStyle(fr, b);
    fr.querySelectorAll('.photo').forEach(applyPhoto);
    if (x) Object.assign(x, b);
    else frameData().over[`${frameSel.pid}|${frameSel.key}`] = { ...(frameData().over[`${frameSel.pid}|${frameSel.key}`] || {}), ...b };     // 순서(z) · 잠금은 유지
    saveState();
    syncFrameSel();
  };
  ui.querySelector('.fr-box').addEventListener('pointerup', finish);
  ui.querySelector('.fr-box').addEventListener('pointercancel', finish);

  document.addEventListener('pointerdown', e => {
    if (e.target.closest?.('#fr-sel,#fr-multi,#ph-rot-h')) return;      // 사진 돌리기 핸들을 눌러도 고른 틀 유지
    const page = e.target.closest?.(PAGE_SEL);
    if (page) framePage = page.dataset.pid;
    if (frameMulti.length && !e.shiftKey && e.button !== 2) { frameMulti = []; frameNote(''); syncFrameSel(); }    // 여러 틀 고르기는 다른 곳을 누르면 풀림 (Shift는 더하기 · 오른쪽 버튼은 메뉴)
    const txt = e.target.closest?.('.trim [contenteditable][data-key]');
    if (txt && e.shiftKey && e.button === 0 && (frameMulti.length || (frameSel && !(frameSel.kind === 'text' && frameSel.key === txt.dataset.key)))) {      // Shift+클릭: 글자틀도 여러 틀 고르기에 더하거나 빼기
      e.preventDefault();
      addEventListener('mousedown', ev => ev.preventDefault(), { once: true, capture: true });      // 글자 고치기(커서)로 들어가지 않게
      const list = frameMulti.length ? frameMulti : [frameSel], pid = page.dataset.pid;
      const at = list.findIndex(s => s.pid === pid && s.key === txt.dataset.key);
      framePage = pid;
      setFrameMulti(at < 0 ? [...list, { kind: 'text', key: txt.dataset.key, pid }] : list.filter((_, i) => i !== at));
      return;
    }
    if (txt) {
      frameSel = { kind: 'text', key: txt.dataset.key, pid: page.dataset.pid }; syncFrameSel();
      if (e.button === 0 && !e.shiftKey && document.activeElement !== txt) startTextDrag(e, txt, page.dataset.pid);
      return;
    }
    if (!e.target.closest?.('.trim .photo') && frameSel && !e.shiftKey) { frameSel = null; syncFrameSel(); }
  }, true);
  $('#pages').addEventListener('input', syncFrameSel);    // 글을 쓰면 틀 크기가 변하므로 테두리도 따라감
  document.addEventListener('keydown', e => {
    if (e.target.closest?.('input,textarea,select,[contenteditable]') || document.querySelector('dialog[open]') || document.querySelector('#photo-room:not([hidden])')) return;
    if (e.key === 'Escape') { frameSel = null; frameMulti = []; frameClip = null; frameNote(''); syncFrameSel(); return; }
    if (frameSel?.kind === 'text' && !(e.key === 'Delete' || e.key === 'Backspace')) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && frameSel) { e.preventDefault(); deleteFrame(); return; }
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = /^Key([A-Z])$/.exec(e.code)?.[1].toLowerCase() || e.key.toLowerCase();     // 한글 입력 상태에서도 같은 자리의 키로 동작
    const photoKey = frameSel?.kind !== 'text' && photos[frameSel?.key] ? frameSel.key : null;
    const zoomKey = { Period: true, Comma: false }[e.code] ?? { '>': true, '.': true, '<': false, ',': false }[e.key];
    if (zoomKey !== undefined && !e.altKey && photoKey) {     // Ctrl > 확대, Ctrl < 축소 (Shift 없이 Ctrl . / Ctrl , 도 같음)
      e.preventDefault();
      zoomPhoto(photoKey, zoomKey);
      return;
    }
    if (e.altKey && e.shiftKey) {      // Ctrl+Alt+Shift+C 틀에 꽉 차게, Ctrl+Alt+Shift+E 사진 전체 보이기
      const mode = { c: 'fill', e: 'fit' }[k];
      if (mode && photoKey) { e.preventDefault(); fitPhoto(photoKey, mode); }
      return;
    }
    if (e.altKey) {      // 인디자인처럼 Ctrl+Alt+X: 틀 안의 사진만 잘라내기, Ctrl+Alt+V: 고른 틀 안으로 붙여넣기
      const act = k === 'x' && frameSel?.kind !== 'text' && photos[frameSel?.key] ? () => cutCopyPhoto(true) : k === 'v' && frameClip?.blob ? pasteInto : null;
      if (act) { e.preventDefault(); act(); }
      return;
    }
    const run = k === 'x' ? () => cutCopyPhoto(true) : k === 'c' ? () => (e.shiftKey ? copyFrame() : cutCopyPhoto(false)) : k === 'v' ? pasteClip : null;
    if (!run || (k !== 'v' && !frameSel) || (k === 'v' && !frameClip)) return;
    e.preventDefault();
    run();
  });
  $('#fr-restore')?.addEventListener('click', restoreFrames);
  bindMultiFrames();
  bindLayerKeys();
  bindContextMenu();
  syncFrameSel();
  addEventListener('scroll', syncFrameSel, { passive: true, capture: true });
  addEventListener('resize', syncFrameSel);
}

async function bulkUpload(files, keys = studentKeys, info = $('#bulk-info')) {
  const list = [...files].filter(x => x.type.startsWith('image/'))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko', { numeric: true }));
  const assigned = new Map();
  const rest = [];
  for (const file of list) {
    const hit = keys.find(s => s.name && !assigned.has(s.key) && file.name.normalize('NFC').includes(s.name));
    if (hit) assigned.set(hit.key, file); else rest.push(file);
  }
  for (const s of keys) {
    if (!rest.length) break;
    if (!assigned.has(s.key)) assigned.set(s.key, rest.shift());
  }
  let i = 0;
  const gallery = keys === galleryKeys;
  if (gallery) galBulk = true;
  for (const [key, file] of assigned) {
    info.textContent = `사진 넣는 중… ${++i}/${assigned.size}`;
    await setPhoto(key, file);
  }
  if (gallery) { galBulk = false; render(); }
  info.textContent = `${assigned.size}장 배치 완료` + (rest.length ? ` · 남은 사진 ${rest.length}장(학생 수 초과)` : '');
}

/* ============================================================
   편집 패널
   ============================================================ */
function bindPanel() {
  const sel = $('#f-size');
  sel.innerHTML = Object.entries(SIZES).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('');
  const fields = { size: '#f-size', school: '#f-school', nth: '#f-nth', year: '#f-year', principal: '#f-principal', vice: '#f-vice', homeTeacher: '#f-hteacher', galleryPages: '#f-gallery', soloShape: '#f-solo' };
  const checks = { bleed: '#f-bleed', guides: '#f-guides', pad4: '#f-pad4' };
  for (const [k, id] of Object.entries(fields)) $(id).value = S[k];
  for (const [k, id] of Object.entries(checks)) $(id).checked = !!S[k];
  $('#f-roster').value = S.roster;
  $('#f-teachers').value = S.teachers;
  $('#f-zoom').value = S.zoom;
  $('#f-zoom').addEventListener('input', e => setViewZoom(e.target.value));
  $('#f-bulk-o').addEventListener('change', async e => { await bulkUpload(e.target.files, outdoorKeys); e.target.value = ''; });
  $('#f-bulk-fl').addEventListener('change', async e => { await bulkUpload(e.target.files, flowerKeys); e.target.value = ''; });
  $('#f-bulk-ox').addEventListener('change', async e => { await bulkUpload(e.target.files, outdoorStripKeys); e.target.value = ''; });
  $('#f-gal-dir').addEventListener('change', async e => { await importGalleryFolders(e.target.files, false); e.target.value = ''; });
  $('#b-faces').addEventListener('click', () => {
    const keys = Object.keys(photos).filter(isGalKey).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
    if (!keys.length) { $('#g-info').textContent = '행사 사진이 없습니다.'; return; }
    queueFaces(keys);
  });
  $('#f-gal-add').addEventListener('change', async e => { await importGalleryFolders(e.target.files, true); e.target.value = ''; });
  $('#f-bulk-g').addEventListener('change', async e => { await bulkUpload(e.target.files, galleryKeys, $('#g-info')); e.target.value = ''; });

  let t;
  for (const [k, id] of Object.entries(fields)) {
    $(id).addEventListener('input', e => {
      S[k] = e.target.value; saveState();
      clearTimeout(t); t = setTimeout(render, k === 'size' ? 0 : 350);
    });
  }
  for (const [k, id] of Object.entries(checks)) {
    $(id).addEventListener('change', e => {
      S[k] = e.target.checked; saveState();
      if (k === 'guides') document.body.classList.toggle('show-guides', S.guides); else render();
    });
  }
  $('#b-roster').addEventListener('click', () => { S.roster = $('#f-roster').value; saveState(); render(); });
  $('#b-teachers').addEventListener('click', () => { S.teachers = $('#f-teachers').value; saveState(); render(); });
  $('#f-xlsx').addEventListener('change', async e => { if (e.target.files[0]) await importStudents(e.target.files[0], $('#xlsx-info')); e.target.value = ''; });
  $('#f-xlsx-t').addEventListener('change', async e => { if (e.target.files[0]) await importTeachers(e.target.files[0], $('#t-info')); e.target.value = ''; });
  $('#b-template').addEventListener('click', () => downloadTemplate($('#xlsx-info')));
  $('#f-bulk-t').addEventListener('change', async e => { await bulkUpload(e.target.files, teacherKeys, $('#t-info')); e.target.value = ''; });
  $('#f-bulk').addEventListener('change', async e => { await bulkUpload(e.target.files); e.target.value = ''; });
  $('#b-print').addEventListener('click', async () => { await document.fonts.ready; window.print(); });
  $('#b-reset-text').addEventListener('click', () => {
    if (!confirm('페이지에서 직접 고친 문구를 모두 기본값으로 되돌릴까요?')) return;
    texts = {}; saveState(); render();
  });
  $('#b-clear-photos').addEventListener('click', async () => {
    if (!confirm('넣은 사진을 모두 지울까요?')) return;
    for (const k of Object.keys(photos)) { URL.revokeObjectURL(photos[k].url); delete photos[k]; }
    await DB.wipe(); render();
  });

  // 페이지 위 직접 편집
  const pages = $('#pages');
  pages.addEventListener('input', e => {
    const el = e.target.closest('[data-key]');
    if (!el) return;
    if (!el.textContent.trim() && el.innerHTML) el.innerHTML = '';     // 다 지우면 빈 칸으로 (다시 눌러 쓸 수 있게 자리는 남음)
    texts[el.dataset.key] = el.dataset.key.startsWith('tx|') ? el.innerHTML : el.innerText.replace(/\n$/, '');
    saveState();
  });
  pages.addEventListener('keydown', e => {       // 제목처럼 한 줄인 글씨는 Enter로 수정을 마침, Esc는 글자틀 선택 해제
    if (e.key === 'Enter' && e.target.dataset?.key?.startsWith('tx|')) { e.preventDefault(); e.target.blur(); }
    if (e.key === 'Escape' && e.target.closest?.('[contenteditable]')) { e.target.blur(); frameSel = null; syncFrameSel(); }
  });
  pages.addEventListener('paste', e => {
    if (!e.target.closest('[contenteditable]')) return;
    e.preventDefault();
    document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
  });
}

/* ---------------- 교직원 명단 ---------------- */
function parseTeachers(text) {
  return String(text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => {
    const [role, name, dept] = l.split(/\s*[|\t]\s*/);
    return { role: role || '', name: name || '', dept: dept || '' };
  });
}
const teacherKey = (t, i) => `t-${t.name || i}`;   // 이름 기준이라 순서가 바뀌어도 사진 유지
/* ============================================================
   엑셀 명단 (SheetJS, 필요할 때만 불러옴)
   ============================================================ */
function loadXLSX() {
  if (window.XLSX) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    s.onload = res;
    s.onerror = () => rej(new Error('엑셀 기능을 불러오지 못했습니다. 인터넷 연결을 확인하세요.'));
    document.head.appendChild(s);
  });
}
const norm = s => String(s ?? '').replace(/\s+/g, '');
const clean = s => String(s ?? '').replace(/[|\r\n\t]+/g, ' ').trim();
const sheetRows = ws => XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false }).map(r => r.map(clean));

/**
 * 머리글 행에서 열 위치 찾기
 * 1) '성명'·'이름'처럼 정확히 일치하는 머리글이 있는 행을 먼저 찾고
 * 2) 없으면 짧은 칸에서 포함 일치(예: '학생 성명')로 찾음 — 긴 제목 줄은 머리글로 오인하지 않음
 * 3) 머리글이 아예 없으면 한글 이름처럼 보이는 열을 자동으로 고름
 */
const NAME_RX = /^[가-힣]{2,4}$/;
function findColumns(rows, spec, required) {
  const limit = Math.min(rows.length, 20);
  const match = (head, { names, not = [] }, loose) => {
    let i = head.findIndex(c => names.includes(c));
    if (i < 0 && loose) i = head.findIndex(c => c && c.length <= 10 && names.some(n => c.includes(n)) && !not.some(n => c.includes(n)));
    return i;
  };
  for (const loose of [false, true]) {
    for (let h = 0; h < limit; h++) {
      const head = rows[h].map(norm);
      if (match(head, spec[required], loose) < 0) continue;
      const idx = {};
      for (const [k, s] of Object.entries(spec)) idx[k] = match(head, s, true);
      return { h, idx, label: rows[h][idx[required]] };
    }
  }
  let best = -1, bestN = 1;
  const width = Math.max(0, ...rows.slice(0, 300).map(r => r.length));
  for (let c = 0; c < width; c++) {
    const n = rows.filter(r => NAME_RX.test(norm(r[c]))).length;
    if (n > bestN) { best = c; bestN = n; }
  }
  if (best < 0) return null;
  const idx = Object.fromEntries(Object.keys(spec).map(k => [k, -1]));
  idx[required] = best;
  return { h: -1, idx, label: '이름 열(자동 감지)', strict: true };
}const STU_COLS = {
  cls: { names: ['반', '학급', '학년반', '반명'], not: ['담임', '번호'] },
  no: { names: ['번호', '번', '출석번호'] },
  name: { names: ['성명', '이름', '학생명', '학생이름', '학생성명'], not: ['담임', '교사', '선생', '영문', '영어', '한자', '보호자', '학부모'] },
  dream: { names: ['장래희망', '꿈', '희망'] },
  msg: { names: ['한마디', '메시지', '소감', '하고싶은말', '좌우명'] },
  teacher: { names: ['담임', '담임교사', '담임선생님', '담임이름'] },
  team: { names: ['조', '모둠', '조별', '조이름'], not: ['구조', '조건', '참조', '조회'] },
};
const TEA_COLS = {
  role: { names: ['직위', '직책', '직급', '구분'] },
  name: { names: ['성명', '이름', '교사명', '교원명', '선생님'], not: ['영문', '영어', '한자'] },
  dept: { names: ['담당', '업무', '담당업무', '과목', '담당학년', '학년반'] },
};
const TEACHER_SHEET = /교직원|선생님|교사|교원/;

function className(v) {
  v = clean(v);
  let m;
  if (/^\d+$/.test(v)) return `${v}반`;
  if ((m = v.match(/^(\d+)\s*[-–.]\s*(\d+)$/))) return `${m[1]}학년 ${m[2]}반`;
  return v;
}
/** 이름 정리: 한글 이름 사이 띄어쓰기 제거('김 서윤' → '김서윤'), 반복된 머리글 줄 걸러냄 */
function pickName(raw, spec, found) {
  let v = clean(raw);
  if (/^[가-힣\s]+$/.test(v)) v = v.replace(/\s+/g, '');
  if (!v || spec.name.names.includes(norm(v))) return '';
  if (found.strict && (!NAME_RX.test(v) || /(반|명단|학년|학급|목록|교사)$/.test(v))) return '';   // 머리글 없는 표: 제목 줄 제외
  return v;
}
/** 명단 글: 엑셀에 조 칸이 있으면 조별로 묶어 '## 1조' 줄을 넣음 */
function studentLines(list) {
  const line = s => [s.name, s.dream, s.msg].join(' | ').replace(/( \| )+$/, '');
  const tags = [...new Set(list.map(s => s.team).filter(Boolean))];
  if (tags.length < 2) return list.map(line).join('\n');
  return tags.map(t => `## ${/^\d+$/.test(t) ? `${t}조` : t}\n${list.filter(s => s.team === t).map(line).join('\n')}`).join('\n');
}
function studentsFromRows(rows) {
  const found = findColumns(rows, STU_COLS, 'name');
  if (!found) return null;
  const { h, idx } = found, get = (r, k) => (idx[k] >= 0 ? clean(r[idx[k]]) : '');
  const fallback = parseRoster(S.roster)[0].name;
  const groups = new Map();
  for (const r of rows.slice(h + 1)) {
    const name = pickName(r[idx.name], STU_COLS, found);
    if (!name) continue;
    const cls = className(get(r, 'cls')) || fallback;
    if (!groups.has(cls)) groups.set(cls, { teacher: '', list: [] });
    const g = groups.get(cls);
    if (!g.teacher) g.teacher = get(r, 'teacher');
    g.list.push({ no: parseFloat(get(r, 'no')), name, dream: get(r, 'dream'), msg: get(r, 'msg'), team: get(r, 'team') });
  }
  let text = '', count = 0;
  for (const [cls, g] of groups) {
    if (g.list.every(s => !isNaN(s.no))) g.list.sort((a, b) => a.no - b.no);
    text += `# ${cls}${g.teacher ? ` | ${g.teacher}` : ''}\n`
      + studentLines(g.list) + '\n\n';
    count += g.list.length;
  }
  return { text: text.trim(), classes: groups.size, count, col: found.label };
}
function teachersFromRows(rows) {
  const found = findColumns(rows, TEA_COLS, 'name');
  if (!found) return null;
  const { h, idx } = found, get = (r, k) => (idx[k] >= 0 ? clean(r[idx[k]]) : '');
  const list = [];
  for (const r of rows.slice(h + 1)) {
    const name = pickName(r[idx.name], TEA_COLS, found);
    if (name) list.push([get(r, 'role') || '교사', name, get(r, 'dept')].join(' | ').replace(/ \| $/, ''));
  }
  return { text: list.join('\n'), count: list.length, col: found.label };
}async function readWorkbook(file) {
  await loadXLSX();
  return XLSX.read(await file.arrayBuffer(), { type: 'array' });
}
async function importStudents(file, info) {
  try {
    info.textContent = '엑셀 읽는 중…';
    const wb = await readWorkbook(file);
    const stuSheet = wb.SheetNames.find(n => !TEACHER_SHEET.test(n)) || wb.SheetNames[0];
    const res = studentsFromRows(sheetRows(wb.Sheets[stuSheet]));
    if (!res || !res.count) throw new Error('"성명" 또는 "이름" 열을 찾지 못했습니다. 머리글 줄에 성명(이름) 칸이 있는지 확인하세요.');
    S.roster = res.text; $('#f-roster').value = res.text;
    let msg = `'${res.col}' 열에서 학생 ${res.count}명 · ${res.classes}개 학급을 불러왔습니다.`;
    const tSheet = wb.SheetNames.find(n => TEACHER_SHEET.test(n));
    const tres = tSheet && teachersFromRows(sheetRows(wb.Sheets[tSheet]));
    if (tres && tres.count) { S.teachers = tres.text; $('#f-teachers').value = tres.text; msg += ` 교직원 ${tres.count}명도 함께 불러왔습니다.`; }
    saveState(); render();
    info.textContent = msg;
  } catch (err) { info.textContent = err.message; }
}
async function importTeachers(file, info) {
  try {
    info.textContent = '엑셀 읽는 중…';
    const wb = await readWorkbook(file);
    const sheet = wb.SheetNames.find(n => TEACHER_SHEET.test(n)) || wb.SheetNames[0];
    const res = teachersFromRows(sheetRows(wb.Sheets[sheet]));
    if (!res || !res.count) throw new Error('"성명" 또는 "이름" 열을 찾지 못했습니다. 머리글 줄에 성명(이름) 칸이 있는지 확인하세요.');
    S.teachers = res.text; $('#f-teachers').value = res.text;
    saveState(); render();
    info.textContent = `'${res.col}' 열에서 교직원 ${res.count}명을 불러왔습니다.`;
  } catch (err) { info.textContent = err.message; }
}
async function downloadTemplate(info) {
  try {
    await loadXLSX();
    const wb = XLSX.utils.book_new();
    const stu = XLSX.utils.aoa_to_sheet([
      ['반', '번호', '이름', '장래희망', '한마디', '담임'],
      ['6학년 1반', 1, '김서윤', '수의사', '늘 웃게 해줘서 고마워!', '김하늘'],
      ['6학년 1반', 2, '이도현', '우주비행사', '별까지 가 볼게', '김하늘'],
      ['6학년 2반', 1, '박하은', '피아니스트', '우리 반 최고의 일 년', '이서준'],
    ]);
    stu['!cols'] = [{ wch: 12 }, { wch: 6 }, { wch: 10 }, { wch: 14 }, { wch: 30 }, { wch: 10 }];
    const tea = XLSX.utils.aoa_to_sheet([
      ['직위', '이름', '담당'],
      ['교장', '이정원', ''], ['교감', '박선영', ''], ['교사', '김하늘', '6-1 담임'], ['교사', '송다은', '체육'],
    ]);
    tea['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, stu, '학생명단');
    XLSX.utils.book_append_sheet(wb, tea, '교직원');
    XLSX.writeFile(wb, '졸업앨범_명단양식.xlsx');
  } catch (err) { info.textContent = err.message; }
}
/* ============================================================
   행사 사진 — 폴더별 불러오기 (폴더명 = 행사 제목, 12장씩 한 쪽)
   상위 폴더/행사 폴더/사진 구조면 행사 폴더 이름을, 행사 폴더 하나만 고르면 그 이름을 씀
   ============================================================ */
const isGalKey = k => /^g\d+-\d+$/.test(k);
/** '01_입학식', '2026-05-03 운동회' → 앞쪽 순서 번호·날짜는 정렬에만 쓰고 제목에서 뺌 */
const eventTitle = folder => folder.replace(/^(\d+[\s._)\-]+)+/, '').trim() || folder;

async function importGalleryFolders(fileList, append) {
  const info = $('#g-info');
  const files = [...fileList].filter(x => x.type.startsWith('image/'));
  if (!files.length) { info.textContent = '선택한 폴더에 사진이 없습니다.'; return; }

  const byName = (a, b) => a.localeCompare(b, 'ko', { numeric: true });
  const groups = new Map();
  for (const file of files) {
    const parts = (file.webkitRelativePath || file.name).split('/');
    const folder = parts.length >= 3 ? parts[1] : parts.length === 2 ? parts[0] : '행사';
    if (!groups.has(folder)) groups.set(folder, []);
    groups.get(folder).push(file);
  }
  const folders = [...groups.keys()].sort(byName);

  // 배치 계획: 추가 모드면 사진이 들어 있는 마지막 쪽 다음부터
  let start = 0;
  if (append) for (const k of Object.keys(photos)) if (isGalKey(k)) start = Math.max(start, parseInt(k.slice(1), 10) + 1);
  const jobs = [], titles = {};
  let page = start;
  for (const folder of folders) {
    const title = eventTitle(folder), list = groups.get(folder).sort((a, b) => byName(a.name, b.name));
    const n = Math.ceil(list.length / GALLERY_PER);
    for (let q = 0; q < n; q++) {
      titles[`gal-title-${page + q}`] = q ? `${title} (${q + 1})` : title;
      list.slice(q * GALLERY_PER, (q + 1) * GALLERY_PER).forEach((file, k) => jobs.push([`g${page + q}-${k}`, file]));
    }
    page += n;
  }
  if (page > GALLERY_MAX) { info.textContent = `갤러리는 최대 ${GALLERY_MAX}쪽(${GALLERY_MAX * GALLERY_PER}장)까지입니다. 지금 선택은 ${page}쪽이 필요합니다.`; return; }

  if (!append) {
    const old = Object.keys(photos).filter(isGalKey);
    if (old.length && !confirm(`기존 행사 사진 ${old.length}장을 지우고 선택한 폴더 내용으로 바꿀까요?`)) return;
    galBulk = true;
    for (const k of old) await removePhoto(k);
  }
  galBulk = true;
  Object.assign(texts, titles);
  S.galleryPages = page;
  $('#f-gallery').value = page;
  saveState();
  render();

  let i = 0;
  for (const [key, file] of jobs) {
    info.textContent = `행사 사진 넣는 중… ${++i}/${jobs.length}`;
    await setPhoto(key, file);
  }
  galBulk = false;
  render();
  info.textContent = `${folders.length}개 행사 · 사진 ${jobs.length}장을 갤러리에 넣었습니다: ${folders.map(eventTitle).join(', ')}`;
}

/* ---------------- 시작 ---------------- */
(async function init() {
  loadState();
  document.body.insertAdjacentHTML('afterbegin', defsSVG());
  await DB.open();
  const saved = await DB.all();
  for (const [k, v] of Object.entries(saved)) {
    if (v && v.blob) photos[k] = { ...v, url: URL.createObjectURL(v.blob) };
  }
  await PV.open();
  for (const [k, v] of Object.entries(await PV.all())) {
    const r = photos[k];
    if (r && v?.blob && v.sig === pvSig(r)) { r.purl = URL.createObjectURL(v.blob); r.pfor = r.url; }
  }
  bindPanel();
  bindPhotoEvents();
  bindFrameEditor();
  bindHandTool();
  bindViewZoom();
  render();
  window.__photosLoaded = true;
  window.undoInit?.();
  const unchecked = Object.keys(photos).filter(k => isGalKey(k) && photos[k].solo == null);
  if (unchecked.length) queueFaces(unchecked.sort((a, b) => a.localeCompare(b, 'en', { numeric: true })));
  // 웹폰트 로드 후 사진 칸 크기가 바뀔 수 있어 한 번 더 맞춤
  document.fonts.ready.then(() => document.querySelectorAll('.photo').forEach(applyPhoto));
})();
