/* 디자인 테마: 색 · 글꼴 · 페이지 배경 장식을 한꺼번에 바꿈. 쪽 구성과 사진 · 글자는 그대로.
   album.js보다 먼저 읽히지만 함수들은 render 때 불리므로 PAL · washes 등을 그때 씀 */
const CORM_READ = "'Cormorant Garamond',serif";   // 필기체 대신 또렷한 영문 글씨
const SERIF = "'Nanum Myeongjo',serif", BATANG = "'Gowun Batang',serif", SANS = "'Noto Sans KR',sans-serif", NSERIF = "'Noto Serif KR',serif", JOST = "'Jost',sans-serif", CORM = "'Cormorant Garamond',serif", PINYON = CORM_READ, PEN = "'Nanum Pen Script',cursive";
const THEMES = {
  classic: { no: '', name: '기본 파스텔', dots: ['#F0B9AE', '#B9D1AF', '#C8A465'] },
  modern: { no: '01', name: '모던 클린', dots: ['#7C96AE', '#D5D9DC', '#8FB0C7'], bg: 'band', flat: 1,
    vars: { paper: '#F7F6F3', ink: '#2F3A45', soft: '#76818C', gold: '#5F7F9B', goldSoft: '#C4D0DB', empty: '#E7EAED', g1: '#4F6E8A', g2: '#7C96AE', title: SANS, script: JOST, en: JOST, body: SANS, cap: SANS },
    pal: { blush: '#D5DEE6', peach: '#E3E7EA', butter: '#E9ECEE', sage: '#CBD6DE', mint: '#D3DFE5', sky: '#BDD0DF', lavender: '#D2D8E2', rose: '#DCE1E7', leaf: '#9FB2C2', leaf2: '#88A0B4', leaf3: '#B9C7D2', stem: '#7F93A5', gold: '#7C96AE' } },
  green: { no: '02', name: '내추럴 그린', dots: ['#6F9A62', '#9FBE8C', '#6E9160'], bg: 'leaf',
    vars: { paper: '#FAFAF4', ink: '#37503A', soft: '#71856E', gold: '#6E9160', goldSoft: '#C6D6B4', empty: '#E9EEDF', g1: '#5A7F4E', g2: '#8FB07A', title: BATANG, script: PINYON, en: JOST, body: BATANG, cap: PEN },
    pal: { blush: '#D4E2BF', peach: '#E2EAC6', butter: '#EBEFCB', sage: '#BFD6A9', mint: '#BBDCC0', sky: '#C9E0CF', lavender: '#D0DFC6', rose: '#DDE8C6', leaf: '#86AE76', leaf2: '#6F9A62', leaf3: '#A8C690', stem: '#6F8F5F', gold: '#9BB56E' } },
  sun: { no: '03', name: '따뜻한 햇살', dots: ['#E3B76B', '#F0CF8B', '#CFA351'], bg: 'sun',
    vars: { paper: '#FDF9EE', ink: '#5F4A2C', soft: '#94805F', gold: '#C49A4C', goldSoft: '#EBD6A6', empty: '#F6ECD3', g1: '#B98A3E', g2: '#E6C57E', title: BATANG, script: PINYON, en: JOST, body: BATANG, cap: PEN },
    pal: { blush: '#F7D9A8', peach: '#F8DDA9', butter: '#FAE9B4', sage: '#EFDCA0', mint: '#F3E4B8', sky: '#F8E8C4', lavender: '#F4DFBC', rose: '#F6D7AE', leaf: '#D9B266', leaf2: '#C9A050', leaf3: '#E7CB8A', stem: '#B8924C', gold: '#D9A94E' } },
  line: { no: '04', name: '미니멀 라인', dots: ['#8D8D82', '#B3B3A8', '#55554D'], bg: 'line', flat: 1,
    vars: { paper: '#F6F5F1', ink: '#33332F', soft: '#7D7D74', gold: '#6F6F66', goldSoft: '#C9C9BF', empty: '#E8E7E1', g1: '#55554D', g2: '#8D8D82', title: NSERIF, script: JOST, en: JOST, body: NSERIF, cap: NSERIF },
    pal: { blush: '#E2E1DA', peach: '#E7E6DF', butter: '#ECEBE4', sage: '#DEDED6', mint: '#E2E2DB', sky: '#DDDED9', lavender: '#E0DFDA', rose: '#E4E2DC', leaf: '#A5A59A', leaf2: '#8D8D82', leaf3: '#BEBEB4', stem: '#7D7D74', gold: '#8D8D82' } },
  sky: { no: '05', name: '파스텔 스카이', dots: ['#A5C8E4', '#BCD6EC', '#8E9FD6'], bg: 'sky',
    vars: { paper: '#F7FBFE', ink: '#3A5878', soft: '#7690AB', gold: '#5F97C8', goldSoft: '#BBD7EC', empty: '#E3EFF7', g1: '#4E86BA', g2: '#8FBEE0', title: BATANG, script: PINYON, en: JOST, body: BATANG, cap: PEN },
    pal: { blush: '#D8E4F3', peach: '#DFEAF5', butter: '#E9F2F9', sage: '#CFE3EE', mint: '#C8E5EC', sky: '#B5D5EE', lavender: '#CCD4EF', rose: '#DBDDF2', leaf: '#94B9D8', leaf2: '#7FA7CB', leaf3: '#B3CFE5', stem: '#7E9FBD', gold: '#8FBEE0' } },
  film: { no: '06', name: '감성 필름', dots: ['#A98E6E', '#CDB593', '#7A6248'], bg: 'film', photoCard: 1,
    vars: { paper: '#F3EAD9', ink: '#5A4632', soft: '#8D7860', gold: '#9A7B55', goldSoft: '#D5C2A2', empty: '#E8DCC6', g1: '#8A6B46', g2: '#BFA078', title: BATANG, script: PINYON, en: JOST, body: BATANG, cap: PEN },
    pal: { blush: '#DCC6A6', peach: '#E2CFB0', butter: '#EBDDC2', sage: '#CFC4A0', mint: '#D2CBAE', sky: '#D8CFBB', lavender: '#D8CAB6', rose: '#DBC5AE', leaf: '#A6946A', leaf2: '#8F7E58', leaf3: '#BFAE85', stem: '#857554', gold: '#BFA078' } },
  sketch: { no: '07', name: '나뭇잎 스케치', dots: ['#7FA268', '#A9C48E', '#5F8A66'], bg: 'sketch',
    vars: { paper: '#FAF9F1', ink: '#3F4F38', soft: '#74846B', gold: '#7C9A5C', goldSoft: '#CBD9B5', empty: '#EDF0E1', g1: '#668448', g2: '#9DB87C', title: JOST + ",'Noto Sans KR',sans-serif", script: JOST, en: JOST, body: BATANG, cap: BATANG, line: '#7C9A5C' },
    pal: { blush: '#DFE8C8', peach: '#E5EBCD', butter: '#EEF1D6', sage: '#CCDDB2', mint: '#CDE3C6', sky: '#D7E6D2', lavender: '#DBE4CC', rose: '#E2E9CD', leaf: '#8FB073', leaf2: '#7A9C62', leaf3: '#A9C48E', stem: '#7A9463', gold: '#A9C48E' } },
  bloom: { no: '08', name: '수채화 무드', dots: ['#F0B0A6', '#F5CDBE', '#EEA39A'], bg: 'bloom',
    vars: { paper: '#FEF9F6', ink: '#5E4744', soft: '#94797A', gold: '#C78A84', goldSoft: '#EFD0C9', empty: '#F8E9E4', g1: '#B97670', g2: '#E9B5AB', title: BATANG, script: PINYON, en: JOST, body: BATANG, cap: PEN },
    pal: { blush: '#F4BFB5', peach: '#F7D1C2', butter: '#FAE3D6', sage: '#EBD6CC', mint: '#EDDAD3', sky: '#EFDCDD', lavender: '#EBD2DC', rose: '#F0B5BE', leaf: '#B9B797', leaf2: '#A3A586', leaf3: '#CFCDAF', stem: '#9B8878', gold: '#D9A28F' } },
  frame: { no: '09', name: '심플 프레임', dots: ['#ACA48F', '#C8C2AE', '#7E7868'], bg: 'frame', flat: 1,
    vars: { paper: '#F6F3EB', ink: '#4C4A42', soft: '#85826F', gold: '#8E8770', goldSoft: '#CFCAB8', empty: '#E9E5D8', g1: '#7A7460', g2: '#ACA48F', title: NSERIF, script: PINYON, en: JOST, body: NSERIF, cap: PEN },
    pal: { blush: '#DFDBCC', peach: '#E4E0D2', butter: '#ECE9DD', sage: '#D7D5C6', mint: '#DBDACD', sky: '#D9D8CF', lavender: '#DBD8CF', rose: '#DFDACE', leaf: '#ACA48F', leaf2: '#938C78', leaf3: '#C8C2AE', stem: '#85826F', gold: '#ACA48F' } },
  typo: { no: '10', name: '모던 타이포', dots: ['#7F8F99', '#B9C2C7', '#49545B'], bg: 'typo', flat: 1,
    vars: { paper: '#F5F4F1', ink: '#2D3438', soft: '#70797F', gold: '#5F7078', goldSoft: '#C4CBCF', empty: '#E6E7E6', g1: '#49545B', g2: '#7F8F99', title: SANS, script: JOST, en: JOST, body: SANS, cap: SANS },
    pal: { blush: '#DCDFE0', peach: '#E2E4E4', butter: '#E9EAE9', sage: '#D5DBDC', mint: '#D8DFE0', sky: '#D1DADF', lavender: '#D8DBDF', rose: '#DEDFE1', leaf: '#9FABB2', leaf2: '#85939B', leaf3: '#BAC3C8', stem: '#70797F', gold: '#7F8F99' } },
  draw: { no: '11', name: '미니멀 드로잉', dots: ['#D8B273', '#E7CD9B', '#A3A97A'], bg: 'draw',
    vars: { paper: '#F9F4E7', ink: '#5B4A36', soft: '#8F7D66', gold: '#B0935E', goldSoft: '#E0CFA9', empty: '#F1E8D3', g1: '#9C7E4A', g2: '#D2B27A', title: BATANG, script: PINYON, en: JOST, body: BATANG, cap: PEN, line: '#BFA878' },
    pal: { blush: '#EFE0C4', peach: '#F1E3C6', butter: '#F5EBD2', sage: '#E4E0C0', mint: '#E6E2C8', sky: '#E9E4D2', lavender: '#E9DFCE', rose: '#EEDFC8', leaf: '#BFB48B', leaf2: '#A9A479', leaf3: '#D3C9A2', stem: '#A69672', gold: '#D2B27A' } },
  premium: { no: '12', name: '프리미엄 네이처', dots: ['#6E8A68', '#A3B58F', '#2F4A35'], bg: 'premium',
    vars: { paper: '#F8F7EF', ink: '#24382A', soft: '#62745F', gold: '#4A6A4C', goldSoft: '#B7C6A6', empty: '#E6EADC', g1: '#2F4A35', g2: '#7E9A6E', title: NSERIF, script: PINYON, en: JOST, body: NSERIF, cap: NSERIF },
    pal: { blush: '#BFD0AE', peach: '#CCD9B6', butter: '#DFE5C6', sage: '#9DBB8E', mint: '#A6C7A6', sky: '#B6CFB6', lavender: '#BCCDB2', rose: '#C6D4B4', leaf: '#5F8558', leaf2: '#44693F', leaf3: '#86A777', stem: '#3F5C3C', gold: '#A8B883' } },
  simple: { no: '13', name: '심플 라인', dots: ['#222222', '#9A9A9A', '#E2E2E2'], bg: 'simple', flat: 1, plain: 1,
    vars: { paper: '#FFFFFF', ink: '#222222', soft: '#767676', gold: '#333333', goldSoft: '#BDBDBD', empty: '#EFEFEF', g1: '#222222', g2: '#555555', title: SANS, script: JOST, en: JOST, body: SANS, cap: SANS },
    pal: { blush: '#EEEEEE', peach: '#F0F0F0', butter: '#F3F3F3', sage: '#ECECEC', mint: '#EDEDED', sky: '#EBEBEB', lavender: '#EEEEEE', rose: '#F0F0F0', leaf: '#BDBDBD', leaf2: '#9A9A9A', leaf3: '#D0D0D0', stem: '#8A8A8A', gold: '#555555' } },
  kids: { no: '14', name: '귀여운 심벌', dots: ['#FFC94D', '#FF9DB4', '#78CFC0'], bg: 'kids', plain: 1,
    vars: { paper: '#FFFCF3', ink: '#4A4036', soft: '#8A7D6E', gold: '#F08AA2', goldSoft: '#FFD3DD', empty: '#FFF1D9', g1: '#F08AA2', g2: '#FFB84D', title: "'Jua',sans-serif", script: "'Jua',sans-serif", en: JOST, body: SANS, cap: "'Jua',sans-serif" },
    pal: { blush: '#FFD3DD', peach: '#FFE0C2', butter: '#FFF0B8', sage: '#CFEFD9', mint: '#C7EEE6', sky: '#CFE6FA', lavender: '#E3D8F8', rose: '#FFC9D6', leaf: '#8FD3A6', leaf2: '#6CC08C', leaf3: '#B5E3C3', stem: '#7FBF95', gold: '#FFC94D' } },
};
/* 귀여운 심벌 테마의 작은 그림 (x, y는 가운데, r은 크기) */
const KIDS_COLORS = ['#FFC94D', '#FF9DB4', '#78CFC0', '#8CC6F2', '#B9A3EA', '#FFAE70'];
function kidsStar(x, y, r, c, rot) {
  let d = '';
  for (let i = 0; i < 10; i++) { const a = (rot + i * 36 - 90) * Math.PI / 180, R = i % 2 ? r * .45 : r; d += `${i ? 'L' : 'M'}${x + Math.cos(a) * R},${y + Math.sin(a) * R}`; }
  return `<path d="${d}Z" fill="${c}" stroke="${c}" stroke-width="${r * .22}" stroke-linejoin="round"/>`;
}
const kidsHeart = (x, y, r, c, rot) => `<path transform="rotate(${rot} ${x} ${y})" d="M${x},${y + r * .8} C${x - r * 1.3},${y - r * .1} ${x - r * .7},${y - r * 1.1} ${x},${y - r * .35} C${x + r * .7},${y - r * 1.1} ${x + r * 1.3},${y - r * .1} ${x},${y + r * .8}Z" fill="${c}"/>`;
const kidsCloud = (x, y, r, c) => `<g fill="${c}"><circle cx="${x - r * .55}" cy="${y + r * .1}" r="${r * .45}"/><circle cx="${x}" cy="${y - r * .15}" r="${r * .6}"/><circle cx="${x + r * .6}" cy="${y + r * .12}" r="${r * .42}"/><rect x="${x - r * .95}" y="${y + r * .1}" width="${r * 1.9}" height="${r * .45}" rx="${r * .22}"/></g>`;
function kidsPencil(x, y, r, c, rot) {
  const w = r * .5, L = r * 2.4;
  return `<g transform="rotate(${rot} ${x} ${y})"><rect x="${x - L / 2}" y="${y - w / 2}" width="${L * .78}" height="${w}" rx="${w * .2}" fill="${c}"/><rect x="${x - L / 2}" y="${y - w / 2}" width="${L * .12}" height="${w}" rx="${w * .2}" fill="#FF9DB4"/><path d="M${x + L * .28},${y - w / 2} L${x + L / 2},${y} L${x + L * .28},${y + w / 2}Z" fill="#F6D9B0"/><path d="M${x + L * .43},${y - w * .16} L${x + L / 2},${y} L${x + L * .43},${y + w * .16}Z" fill="#4A4036"/></g>`;
}
const THEME_VAR = { paper: '--paper', ink: '--ink', soft: '--ink-soft', gold: '--gold', goldSoft: '--gold-soft', empty: '--photo-empty', g1: '--g1', g2: '--g2', title: '--f-title', script: '--f-script', en: '--f-en', body: '--f-body', cap: '--f-cap' };
let themeBasePal = null, themeGridDone = false;
const themeNow = () => THEMES[S.theme] || THEMES.classic;

function applyTheme() {
  const t = themeNow(), el = document.getElementById('pages');
  themeBasePal ||= { ...PAL };
  Object.assign(PAL, themeBasePal, t.pal || {});
  LEAVES.splice(0, LEAVES.length, PAL.leaf, PAL.leaf2, PAL.leaf3);
  BLOOMS.splice(0, BLOOMS.length, PAL.blush, PAL.peach, PAL.rose, PAL.butter);
  if (el) {
    el.dataset.theme = THEMES[S.theme] ? S.theme : 'classic';
    el.classList.toggle('th-flat', !!t.flat);
    el.classList.toggle('th-print', !!t.photoCard);
    for (const [k, v] of Object.entries(THEME_VAR)) { if (t.vars?.[k]) el.style.setProperty(v, t.vars[k]); else el.style.removeProperty(v); }
  }
  themeGrid();
}
function themeGrid() {
  const box = document.getElementById('theme-grid');
  if (!box) return;
  const cur = THEMES[S.theme] ? S.theme : 'classic';
  if (!themeGridDone) {
    themeGridDone = true;
    box.innerHTML = Object.entries(THEMES).map(([k, t]) => `<button type="button" class="th-card" data-theme="${k}"><span class="th-dots">${t.dots.map(c => `<i style="background:${c}"></i>`).join('')}</span><b>${t.no ? `${t.no} ` : ''}${t.name}</b></button>`).join('');
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-theme]');
      if (!b || b.dataset.theme === S.theme) return;
      S.theme = b.dataset.theme;
      // 옮겨 둔 글자틀도 새 테마의 글꼴과 색을 따르게
      for (const v of Object.values(S.frameEdits?.text || {})) if (v.font) { delete v.font.ff; delete v.font.color; }
      saveState();
      render();
    });
  }
  box.querySelectorAll('[data-theme]').forEach(b => b.classList.toggle('on', b.dataset.theme === cur));
}

/* ---------- 배경 장식 ---------- */
function themeLineSprig(x, y, len, ang, col, rng, sw) {
  const r = ang * Math.PI / 180, ex = x + Math.cos(r) * len, ey = y + Math.sin(r) * len, bend = (rng() - .5) * len * .3;
  const mx = (x + ex) / 2 - Math.sin(r) * bend, my = (y + ey) / 2 + Math.cos(r) * bend;
  let s = `<path d="M${x},${y} Q${mx},${my} ${ex},${ey}"/>`;
  const n = 7;
  for (let i = 1; i <= n; i++) {
    const t = i / (n + .6), px = (1 - t) ** 2 * x + 2 * (1 - t) * t * mx + t * t * ex, py = (1 - t) ** 2 * y + 2 * (1 - t) * t * my + t * t * ey;
    for (const side of [-1, 1]) {
      const a = r + side * (.65 + rng() * .25), L = len * (.15 - t * .07), lx = px + Math.cos(a) * L, ly = py + Math.sin(a) * L;
      const nx = -Math.sin(a) * L * .28, ny = Math.cos(a) * L * .28, cx = (px + lx) / 2, cy = (py + ly) / 2;
      s += `<path d="M${px},${py} Q${cx + nx},${cy + ny} ${lx},${ly} Q${cx - nx},${cy - ny} ${px},${py}Z"/>`;
    }
  }
  return `<g fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-opacity=".8">${s}</g>`;
}
function themeLineFlower(x, y, R, col, rng, sw) {
  const n = 6, off = rng() * 60;
  let s = `<circle cx="${x}" cy="${y}" r="${R * .14}"/>`;
  for (let i = 0; i < n; i++) s += `<ellipse cx="${x}" cy="${y - R * .55}" rx="${R * .27}" ry="${R * .46}" transform="rotate(${off + i * 60} ${x} ${y})"/>`;
  return `<g fill="none" stroke="${col}" stroke-width="${sw}" stroke-opacity=".8">${s}</g>`;
}
function themeBg(kind, tone, seed) {
  const t = themeNow();
  if (!t.bg) return null;
  const { W, H } = G, rng = rngOf(seed), idx = Math.round((seed - 1009) / 97), left = idx % 2 === 1;
  const X = v => (left ? v : 1 - v);       // 쪽의 바깥 가장자리 기준 위치 (v=0이 바깥)
  const wsh = list => washes(list, W, H, rng), [t0, t1, t2] = tone, sw = Math.max(1.4, W / 900), col = t.vars.line || PAL.stem;
  let s = `<rect width="${W}" height="${H}" fill="${t.vars.paper}"/>`, extra = '';
  switch (t.bg) {
    case 'band':
      s += `<rect x="${left ? 0 : W * .968}" y="0" width="${W * .032}" height="${H}" fill="${t.vars.g2}" fill-opacity=".55"/>`;
      s += `<rect x="${left ? W * .036 : W * .958}" y="${H * .04}" width="${sw}" height="${H * .92}" fill="${t.vars.goldSoft}"/>`;
      break;
    case 'leaf':
      s += wsh([{ x: X(.02), y: .02, r: .24, c: t0, a: .6 }, { x: X(.96), y: .98, r: .26, c: t1, a: .55 }]);
      for (const [x, y, l, a] of [[.03, .02, .34, 62], [.14, .01, .24, 38], [.01, .2, .2, 25], [.97, .99, .34, 238], [.82, 1, .22, 268], [.99, .78, .2, 205]]) s += sprig(X(x) * W, y * H, l * W, left ? a : 180 - a, rng, {});
      break;
    case 'sun':
      s += wsh([{ x: X(.9), y: .02, r: .4, c: 'butter', a: .75 }, { x: X(.6), y: -.02, r: .25, c: 'peach', a: .5 }, { x: X(.04), y: 1, r: .36, c: 'peach', a: .55 }]);
      s += sprig(X(.96) * W, .04 * H, .26 * W, left ? 125 : 55, rng, {}) + sprig(X(.03) * W, .96 * H, .24 * W, left ? -40 : 220, rng, {});
      break;
    case 'line': {
      const n = 22, g = W * .012;
      let p = '';
      for (let i = 0; i < n; i++) { const a = g * i; p += `M${left ? 0 : W},${a * 2} L${left ? a * 1.4 : W - a * 1.4},0 `; }
      for (let i = 0; i < n; i++) { const a = g * i; p += `M${left ? W : 0},${H - a * 2} L${left ? W - a * 1.4 : a * 1.4},${H} `; }
      s += `<path d="${p}" fill="none" stroke="${t.vars.g2}" stroke-width="${sw * .6}" stroke-opacity=".7"/>`;
      break;
    }
    case 'sky':
      s += `<defs><linearGradient id="thSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE3F4"/><stop offset=".45" stop-color="#EEF6FB"/><stop offset="1" stop-color="#F7FBFE"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#thSky)"/>`;
      s += wsh([{ x: X(.2), y: .05, r: .24, c: '#FFFFFF', a: .85 }, { x: X(.45), y: .02, r: .18, c: '#FFFFFF', a: .7 }, { x: X(.85), y: .11, r: .2, c: '#FFFFFF', a: .7 }, { x: X(.96), y: .98, r: .28, c: 'sky', a: .5 }]);
      s += themeLineSprig(X(.9) * W, .97 * H, .22 * W, left ? -115 : -65, PAL.leaf2, rng, sw);
      break;
    case 'film':
      s += `<defs><filter id="thBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${W * .022}"/></filter></defs><g filter="url(#thBlur)">`;
      for (let i = 0; i < 26; i++) {
        const c = rng() < .5, x = c ? X(rng() * .28) : X(.72 + rng() * .28), y = c ? rng() * .32 : .7 + rng() * .3;
        s += `<circle cx="${x * W}" cy="${y * H}" r="${W * (.025 + rng() * .05)}" fill="${[PAL.leaf, PAL.leaf2, PAL.blush, '#FFFFFF'][Math.floor(rng() * 4)]}" fill-opacity="${.22 + rng() * .3}"/>`;
      }
      s += '</g>';
      break;
    case 'sketch':
      s += wsh([{ x: X(.02), y: .02, r: .2, c: t0, a: .45 }, { x: X(.97), y: .98, r: .22, c: t1, a: .4 }]);
      s += sprig(X(.03) * W, .03 * H, .26 * W, left ? 60 : 120, rng, {}) + themeLineSprig(X(.02) * W, .24 * H, .24 * W, left ? 28 : 152, col, rng, sw) + themeLineSprig(X(.97) * W, .98 * H, .3 * W, left ? 235 : -55, col, rng, sw);
      break;
    case 'bloom':
      s += wsh([{ x: X(.05), y: .01, r: .34, c: 'blush', a: .7 }, { x: X(.3), y: -.02, r: .2, c: 'peach', a: .5 }, { x: X(.97), y: .97, r: .34, c: 'rose', a: .55 }]);
      s += sprig(X(.02) * W, .06 * H, .34 * W, left ? 25 : 155, rng, { round: true });
      for (const [x, y, r] of [[.1, .06, .028], [.18, .1, .022], [.26, .075, .025], [.06, .13, .02]]) s += flower(X(x) * W, y * H, r * W, rng, null);
      break;
    case 'frame': {
      const i = W * .03;
      s += wsh([{ x: X(.02), y: .01, r: .22, c: 'sage', a: .6 }, { x: X(.98), y: 1, r: .16, c: 'leaf', a: .55 }]);
      s += `<rect x="${i}" y="${i}" width="${W - i * 2}" height="${H - i * 2}" fill="none" stroke="${t.vars.goldSoft}" stroke-width="${sw}"/>`;
      break;
    }
    case 'typo': {
      const size = W * .036, x = left ? W * .045 : W * .955, y = H * .5;
      s += wsh([{ x: X(.98), y: .01, r: .18, c: 'leaf3', a: .5 }]);
      extra = `<text x="${x}" y="${y}" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="${size}" letter-spacing="${size * .62}" fill="${t.vars.g2}" fill-opacity=".55" transform="rotate(${left ? -90 : 90} ${x} ${y})" dominant-baseline="central">GRADUATION</text>`;
      break;
    }
    case 'draw':
      s += themeLineSprig(X(.02) * W, .03 * H, .3 * W, left ? 55 : 125, col, rng, sw) + themeLineFlower(X(.12) * W, .1 * H, W * .045, col, rng, sw) + themeLineSprig(X(.98) * W, .97 * H, .32 * W, left ? -125 : -55, col, rng, sw) + themeLineFlower(X(.86) * W, .91 * H, W * .05, col, rng, sw);
      break;
    case 'simple': {      // 흰 바탕에 위 · 아래 가는 선, 바깥쪽 위에 짧고 굵은 선 하나
      const a = left ? 0 : W * .05, b = left ? W * .95 : W, y1 = H * .045, y2 = H * .956, hair = sw * .7;
      s += `<rect x="${a}" y="${y1}" width="${b - a}" height="${hair}" fill="${t.vars.ink}"/><rect x="${a}" y="${y2}" width="${b - a}" height="${hair}" fill="${t.vars.goldSoft}"/>`;
      s += `<rect x="${left ? W * .06 : W * .86}" y="${y1 - sw * 1.6}" width="${W * .08}" height="${sw * 2.2}" fill="${t.vars.ink}"/>`;
      break;
    }
    case 'kids': {      // 점선 테두리 + 모서리와 가장자리에 작은 별 · 하트 · 구름 · 연필 · 동그라미
      const i = W * .028, R = W * .018, pick = () => KIDS_COLORS[Math.floor(rng() * KIDS_COLORS.length)];
      s += `<rect x="${i}" y="${i}" width="${W - i * 2}" height="${H - i * 2}" rx="${W * .03}" fill="none" stroke="${t.vars.goldSoft}" stroke-width="${sw * 1.4}" stroke-dasharray="${sw * 5} ${sw * 4}" stroke-linecap="round"/>`;
      const draw = [kidsStar, kidsHeart, (x, y, r, c) => kidsCloud(x, y, r * 1.3, '#E3F1FB'), kidsStar, (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r * .4}" fill="${c}"/>`, kidsHeart];
      // 바깥쪽 위 모서리와 안쪽 아래 모서리에 모아서, 나머지 가장자리에는 드문드문
      const spots = [[.05, .03, 1.3], [.12, .055, .8], [.2, .025, .6], [.04, .1, .7], [.95, .975, 1.2], [.88, .955, .7], [.96, .91, .6], [.5, .018, .5], [.018, .5, .5], [.75, .985, .5], [.985, .3, .45], [.3, .985, .45]];
      spots.forEach(([x, y, k], n) => { s += draw[n % draw.length](X(x) * W, y * H, R * k * (.85 + rng() * .3), pick(), rng() * 40 - 20); });
      s += kidsPencil(X(.9) * W, .03 * H, R * .9, '#FFC94D', left ? 160 : 20);
      break;
    }
    case 'premium':
      s += wsh([{ x: X(.02), y: .01, r: .24, c: 'leaf', a: .75 }, { x: X(.22), y: -.03, r: .18, c: 'leaf2', a: .55 }, { x: X(.98), y: 1, r: .26, c: 'leaf', a: .7 }, { x: X(.78), y: 1.03, r: .16, c: 'leaf2', a: .5 }]);
      s += sprig(X(.03) * W, .02 * H, .3 * W, left ? 55 : 125, rng, {}) + sprig(X(.97) * W, .98 * H, .3 * W, left ? 235 : -55, rng, {});
      s += `<rect x="${W * .025}" y="${W * .025}" width="${W * .95}" height="${H - W * .05}" fill="none" stroke="${t.vars.g1}" stroke-opacity=".28" stroke-width="${sw}"/>`;
      break;
  }
  if (!t.plain) s += `<rect width="${W}" height="${H}" filter="url(#paper)" opacity=".28" style="mix-blend-mode:multiply"/>`;     // plain 테마는 종이 질감 없이 깨끗하게
  s += extra;
  return `<svg class="bg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${s}</svg>`;
}
