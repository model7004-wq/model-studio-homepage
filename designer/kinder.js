/* ============================================================
   유치원앨범: 9×11 · 9×12 · 10×11 인치 판형의 새 디자인.
   표지 · 펼침 소개 · 반 단체 + 원아 사진 · 봄(꽃 이름표) · 봄(동물 친구) · 여름 · 가을 · 겨울 · 마지막 쪽.
   틀 모서리 장식은 틀 안에 같이 그려서 틀을 옮기거나 키워도 따라감. 배경 그림은 모두 SVG로 직접 그림.
   앨범 설정 albumType: 'kinder'인 앨범에서만 쓰임.
   ============================================================ */
const KINDER_SIZES = ['in911', 'in912', 'in1011'];
const KC = { pink: '#F4B6C2', pink2: '#EE97AC', rose: '#F7CAD3', yellow: '#F6CF4A', butter: '#FBE7A1', mint: '#A9DCC8', sky: '#BFDDF2', lav: '#C7B5E8', leaf: '#8DBF84', leaf2: '#6FA56B', leaf3: '#A9CF9B', sage: '#9DB59A', brown: '#B98A5E', orange: '#EE9B55', red: '#D9634A', gold: '#E8B44A', line: '#8B7B6B', ink: '#4A3F36' };
const KPI = Math.PI / 180;

/* ---------- 작은 그림 ---------- */
function kFlower(x, y, r, c, center = '#F8D66D', rot = 0, n = 5) {
  let s = '';
  for (let i = 0; i < n; i++) s += `<ellipse cx="${f(x)}" cy="${f(y - r * .55)}" rx="${f(r * .36)}" ry="${f(r * .55)}" transform="rotate(${f(rot + i * 360 / n)} ${f(x)} ${f(y)})" fill="${c}"/>`;
  return s + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * .24)}" fill="${center}"/>`;
}
function kLeaf(x, y, L, ang, c, wid = .32) {
  const a = ang * KPI, ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L, nx = -Math.sin(a) * L * wid, ny = Math.cos(a) * L * wid, mx = (x + ex) / 2, my = (y + ey) / 2;
  return `<path d="M${f(x)},${f(y)} Q${f(mx + nx)},${f(my + ny)} ${f(ex)},${f(ey)} Q${f(mx - nx)},${f(my - ny)} ${f(x)},${f(y)}Z" fill="${c}"/>`;
}
/** 줄기에 잎이 번갈아 달린 덩굴 (x,y에서 ang 방향으로 L만큼) */
function kVine(x, y, L, ang, c, rng, n = 6, sw = 2, leafK = .2, flowers = null) {
  const a = ang * KPI, ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L, bend = (rng() - .5) * L * .25;
  const mx = (x + ex) / 2 - Math.sin(a) * bend, my = (y + ey) / 2 + Math.cos(a) * bend;
  let s = `<path d="M${f(x)},${f(y)} Q${f(mx)},${f(my)} ${f(ex)},${f(ey)}" stroke="${c}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`;
  for (let i = 1; i <= n; i++) {
    const t = i / (n + .5), px = (1 - t) ** 2 * x + 2 * (1 - t) * t * mx + t * t * ex, py = (1 - t) ** 2 * y + 2 * (1 - t) * t * my + t * t * ey, side = i % 2 ? 1 : -1;
    s += kLeaf(px, py, L * leafK * (1.1 - t * .4), ang + side * (40 + rng() * 20), i % 3 ? c : KC.leaf3);
    if (flowers && i % 2 === 0) s += kFlower(px + side * L * .05, py, L * .06, flowers[i % flowers.length], '#F8D66D', rng() * 60);
  }
  return s;
}
function kTulip(x, y, s, c, lean = 0) {
  const tx = x + lean * s, ty = y - s * 1.6;
  return `<path d="M${f(x)},${f(y)} Q${f(x + lean * s * .3)},${f(y - s * .8)} ${f(tx)},${f(ty)}" stroke="${KC.leaf2}" stroke-width="${f(s * .09)}" fill="none"/>${kLeaf(x, y - s * .1, s * .9, -90 - 25 + lean * 20, KC.leaf, .22)}
    <path d="M${f(tx - s * .32)},${f(ty - s * .55)} Q${f(tx - s * .38)},${f(ty + s * .05)} ${f(tx)},${f(ty + s * .08)} Q${f(tx + s * .38)},${f(ty + s * .05)} ${f(tx + s * .32)},${f(ty - s * .55)} L${f(tx + s * .15)},${f(ty - s * .36)} L${f(tx)},${f(ty - s * .62)} L${f(tx - s * .15)},${f(ty - s * .36)}Z" fill="${c}"/>`;
}
function kSnow(x, y, r, c, sw, rot = 0) {
  let d = '';
  for (let i = 0; i < 6; i++) {
    const a = (rot + i * 60) * KPI;
    d += `M${f(x)},${f(y)}L${f(x + Math.cos(a) * r)},${f(y + Math.sin(a) * r)}`;
    for (const t of [.42, .7]) {
      const px = x + Math.cos(a) * r * t, py = y + Math.sin(a) * r * t, L = r * (.36 - t * .2);
      for (const sd of [-1, 1]) { const b = a + sd * .75; d += `M${f(px)},${f(py)}L${f(px + Math.cos(b) * L)},${f(py + Math.sin(b) * L)}`; }
    }
  }
  return `<path d="${d}" stroke="${c}" stroke-width="${f(sw)}" stroke-linecap="round" fill="none"/>`;
}
function kMaple(x, y, r, c, rot = 0) {
  const pts = [[-90, 1], [-62, .42], [-30, .86], [-8, .4], [28, .62], [62, .3], [90, .34], [118, .3], [152, .62], [188, .4], [210, .86], [242, .42]];
  const d = pts.map(([a, k], i) => `${i ? 'L' : 'M'}${f(x + Math.cos((a + rot) * KPI) * r * k)},${f(y + Math.sin((a + rot) * KPI) * r * k)}`).join('');
  const sa = (90 + rot) * KPI;
  return `<path d="${d}Z" fill="${c}"/><path d="M${f(x)},${f(y)}L${f(x + Math.cos(sa) * r * .9)},${f(y + Math.sin(sa) * r * .9)}" stroke="${c}" stroke-width="${f(r * .08)}"/>`;
}
function kGinkgo(x, y, r, c, rot = 0) {
  return `<g transform="rotate(${f(rot)} ${f(x)} ${f(y)})"><path d="M${f(x)},${f(y)} L${f(x - r * .95)},${f(y - r * .62)} Q${f(x - r * .5)},${f(y - r * 1.2)} ${f(x - r * .06)},${f(y - r * 1.02)} L${f(x)},${f(y - r * .82)} L${f(x + r * .06)},${f(y - r * 1.02)} Q${f(x + r * .5)},${f(y - r * 1.2)} ${f(x + r * .95)},${f(y - r * .62)}Z" fill="${c}"/><path d="M${f(x)},${f(y)}L${f(x)},${f(y + r * .55)}" stroke="${c}" stroke-width="${f(r * .08)}"/></g>`;
}
const kAcorn = (x, y, r) => `<ellipse cx="${f(x)}" cy="${f(y + r * .2)}" rx="${f(r * .55)}" ry="${f(r * .7)}" fill="#C98A4E"/><path d="M${f(x - r * .68)},${f(y - r * .05)} Q${f(x)},${f(y - r * .95)} ${f(x + r * .68)},${f(y - r * .05)}Z" fill="#8B5E3C"/><path d="M${f(x)},${f(y - r * .55)}L${f(x + r * .12)},${f(y - r * .85)}" stroke="#8B5E3C" stroke-width="${f(r * .12)}"/>`;
const kBerry = (x, y, r) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#B94A3E"/><circle cx="${f(x + r * 1.5)}" cy="${f(y + r * .6)}" r="${f(r)}" fill="#B94A3E"/>`;
function kGrass(x0, x1, y, h, c, rng, n, sw) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * rng(), hh = h * (.4 + rng() * .8), lean = (rng() - .5) * h * .6;
    s += `<path d="M${f(x)},${f(y)} Q${f(x + lean * .3)},${f(y - hh * .6)} ${f(x + lean)},${f(y - hh)}" stroke="${c}" stroke-width="${f(sw)}" fill="none" stroke-linecap="round"/>`;
  }
  return s;
}
function kFrond(x, y, L, ang, c, rng) {
  const a = ang * KPI, ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L;
  let s = `<path d="M${f(x)},${f(y)}L${f(ex)},${f(ey)}" stroke="${c}" stroke-width="${f(L * .02)}"/>`;
  for (let i = 2; i <= 12; i++) { const t = i / 13, px = x + (ex - x) * t, py = y + (ey - y) * t; for (const sd of [-1, 1]) s += kLeaf(px, py, L * .32 * (1 - t * .6), ang + sd * 52, c, .14); }
  return s;
}
const kSun = (x, y, r) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#F7CF4F"/>${Array.from({ length: 12 }, (_, i) => { const a = i * 30 * KPI; return `<path d="M${f(x + Math.cos(a) * r * 1.3)},${f(y + Math.sin(a) * r * 1.3)}L${f(x + Math.cos(a) * r * 1.65)},${f(y + Math.sin(a) * r * 1.65)}" stroke="#F2B93B" stroke-width="${f(r * .12)}" stroke-linecap="round"/>`; }).join('')}`;
const kCloud = (x, y, r, c = '#FFFFFF', st = '#BCD6EA') => `<g fill="${c}" stroke="${st}" stroke-width="${f(r * .05)}"><path d="M${f(x - r)},${f(y + r * .35)} Q${f(x - r * 1.1)},${f(y - r * .2)} ${f(x - r * .55)},${f(y - r * .15)} Q${f(x - r * .4)},${f(y - r * .75)} ${f(x + r * .1)},${f(y - r * .55)} Q${f(x + r * .5)},${f(y - r * .9)} ${f(x + r * .75)},${f(y - r * .25)} Q${f(x + r * 1.2)},${f(y - r * .15)} ${f(x + r * 1.05)},${f(y + r * .35)}Z"/></g>`;
function kBear(x, y, s, acc = '') {
  const b = '#B98A5E', m = '#EBD3B2', dk = '#4A3426';
  let g = `<ellipse cx="${f(x)}" cy="${f(y + s * 1.3)}" rx="${f(s * .95)}" ry="${f(s * .9)}" fill="${b}"/><ellipse cx="${f(x)}" cy="${f(y + s * 1.42)}" rx="${f(s * .55)}" ry="${f(s * .52)}" fill="${m}"/>`;
  for (const sd of [-1, 1]) g += `<circle cx="${f(x + sd * s * .7)}" cy="${f(y - s * .68)}" r="${f(s * .32)}" fill="${b}"/><circle cx="${f(x + sd * s * .7)}" cy="${f(y - s * .68)}" r="${f(s * .17)}" fill="${m}"/><ellipse cx="${f(x + sd * s * .62)}" cy="${f(y + s * 2.1)}" rx="${f(s * .36)}" ry="${f(s * .22)}" fill="${b}"/>`;
  g += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s)}" fill="${b}"/><ellipse cx="${f(x)}" cy="${f(y + s * .32)}" rx="${f(s * .38)}" ry="${f(s * .28)}" fill="${m}"/><ellipse cx="${f(x)}" cy="${f(y + s * .2)}" rx="${f(s * .12)}" ry="${f(s * .08)}" fill="${dk}"/>`;
  for (const sd of [-1, 1]) g += `<circle cx="${f(x + sd * s * .38)}" cy="${f(y - s * .06)}" r="${f(s * .085)}" fill="${dk}"/><ellipse cx="${f(x + sd * s * .62)}" cy="${f(y + s * .26)}" rx="${f(s * .15)}" ry="${f(s * .08)}" fill="#F2A7A0" fill-opacity=".75"/>`;
  if (acc === 'crown') for (let k = -2; k <= 2; k++) g += kFlower(x + k * s * .38, y - s * .84 + Math.abs(k) * s * .12, s * .2, KC.yellow, '#E8A33A', k * 20);
  if (acc === 'hat') g += `<path d="M${f(x - s * .95)},${f(y - s * .35)} Q${f(x)},${f(y - s * 1.55)} ${f(x + s * .95)},${f(y - s * .35)}Z" fill="#8B5E3C"/><path d="M${f(x)},${f(y - s * 1.12)}L${f(x + s * .15)},${f(y - s * 1.4)}" stroke="#8B5E3C" stroke-width="${f(s * .12)}"/>`;
  if (acc === 'swim') g += `<path d="M${f(x - s * .98)},${f(y - s * .2)} Q${f(x)},${f(y - s * 1.45)} ${f(x + s * .98)},${f(y - s * .2)}Z" fill="#D9584A"/><ellipse cx="${f(x)}" cy="${f(y + s * 1.55)}" rx="${f(s * 1.35)}" ry="${f(s * .5)}" fill="none" stroke="#F4A261" stroke-width="${f(s * .32)}" stroke-dasharray="${f(s * .5)} ${f(s * .4)}"/><ellipse cx="${f(x)}" cy="${f(y + s * 1.55)}" rx="${f(s * 1.35)}" ry="${f(s * .5)}" fill="none" stroke="#FFFFFF" stroke-width="${f(s * .32)}" stroke-dasharray="${f(s * .4)} ${f(s * .5)}" stroke-dashoffset="${f(s * .5)}"/>`;
  if (acc === 'acorn') g += kAcorn(x, y + s * 1.25, s * .38);
  return g;
}
function kSquirrel(x, y, s, flip = false, acc = '') {
  const c = '#C98A55', l = '#F3DDBD', dk = '#4A3426';
  let g = `<ellipse cx="${f(x + s * 1.05)}" cy="${f(y + s * .55)}" rx="${f(s * .62)}" ry="${f(s * 1.3)}" transform="rotate(18 ${f(x + s * 1.05)} ${f(y + s * .55)})" fill="${c}"/><ellipse cx="${f(x + s * 1.08)}" cy="${f(y + s * .5)}" rx="${f(s * .3)}" ry="${f(s * .95)}" transform="rotate(18 ${f(x + s * 1.08)} ${f(y + s * .5)})" fill="#A86F42"/>`;
  g += `<ellipse cx="${f(x)}" cy="${f(y + s * 1.15)}" rx="${f(s * .68)}" ry="${f(s * .85)}" fill="${c}"/><ellipse cx="${f(x - s * .05)}" cy="${f(y + s * 1.25)}" rx="${f(s * .38)}" ry="${f(s * .55)}" fill="${l}"/>`;
  g += `<path d="M${f(x - s * .5)},${f(y - s * .35)} L${f(x - s * .42)},${f(y - s * 1.05)} L${f(x - s * .1)},${f(y - s * .55)}Z" fill="${c}"/><path d="M${f(x + s * .5)},${f(y - s * .35)} L${f(x + s * .42)},${f(y - s * 1.05)} L${f(x + s * .1)},${f(y - s * .55)}Z" fill="${c}"/>`;
  g += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s * .68)}" fill="${c}"/><ellipse cx="${f(x)}" cy="${f(y + s * .26)}" rx="${f(s * .4)}" ry="${f(s * .3)}" fill="${l}"/>`;
  for (const sd of [-1, 1]) g += `<circle cx="${f(x + sd * s * .27)}" cy="${f(y - s * .05)}" r="${f(s * .075)}" fill="${dk}"/><ellipse cx="${f(x + sd * s * .44)}" cy="${f(y + s * .2)}" rx="${f(s * .11)}" ry="${f(s * .06)}" fill="#F2A7A0" fill-opacity=".8"/>`;
  g += `<circle cx="${f(x)}" cy="${f(y + s * .14)}" r="${f(s * .07)}" fill="${dk}"/>`;
  if (acc === 'scarf') g += `<path d="M${f(x - s * .55)},${f(y + s * .5)} Q${f(x)},${f(y + s * .78)} ${f(x + s * .55)},${f(y + s * .5)}" stroke="#E39A4E" stroke-width="${f(s * .22)}" fill="none" stroke-linecap="round"/>`;
  if (acc === 'acorn') g += kAcorn(x - s * .1, y + s * .95, s * .32);
  if (acc === 'cherry') g += `<path d="M${f(x - s * .3)},${f(y + s * 1)} L${f(x - s * .9)},${f(y - s * 1.1)}" stroke="#8B5E3C" stroke-width="${f(s * .08)}"/>${kFlower(x - s * .82, y - s * .9, s * .2, KC.pink)}${kFlower(x - s * .6, y - s * .45, s * .17, KC.rose)}${kFlower(x - s * 1.02, y - s * .4, s * .16, KC.pink)}`;
  return flip ? `<g transform="translate(${f(2 * x)} 0) scale(-1 1)">${g}</g>` : g;
}
const kLadybug = (x, y, r) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#D9473A"/><path d="M${f(x)},${f(y - r)}L${f(x)},${f(y + r)}" stroke="#333" stroke-width="${f(r * .12)}"/><circle cx="${f(x)}" cy="${f(y - r * 1.05)}" r="${f(r * .42)}" fill="#333"/><circle cx="${f(x - r * .45)}" cy="${f(y + r * .1)}" r="${f(r * .18)}" fill="#333"/><circle cx="${f(x + r * .45)}" cy="${f(y + r * .3)}" r="${f(r * .18)}" fill="#333"/>`;
function kConfetti(x0, y0, x1, y1, n, rng) {
  const cs = ['#F28FB0', '#FFC94D', '#78CFC0', '#8CC6F2', '#B9A3EA', '#FF8A5B'];
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * rng(), y = y0 + (y1 - y0) * rng(), w = (x1 - x0) * (.012 + rng() * .012);
    s += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(w * .45)}" rx="${f(w * .15)}" fill="${cs[i % cs.length]}" transform="rotate(${f(rng() * 180)} ${f(x)} ${f(y)})"/>`;
  }
  return s;
}
function kPopper(x, y, s) {
  let g = `<path d="M${f(x)},${f(y)} L${f(x + s * .5)},${f(y - s * 1.1)} L${f(x + s * 1.1)},${f(y - s * .5)}Z" fill="#F8D66D"/>`;
  [['#78CFC0', .3, -.4], ['#8CC6F2', .55, -.55], ['#F28FB0', .48, -.25], ['#78CFC0', .7, -.75]].forEach(([c, a, b]) => { g += `<circle cx="${f(x + s * a)}" cy="${f(y + s * b)}" r="${f(s * .06)}" fill="${c}"/>`; });
  g += `<path d="M${f(x + s * .8)},${f(y - s * .9)} q${f(s * .3)},${f(-s * .5)} ${f(s * .6)},${f(-s * .2)} t${f(s * .5)},${f(-s * .3)}" stroke="#8CC6F2" stroke-width="${f(s * .06)}" fill="none"/><path d="M${f(x + s * .9)},${f(y - s * .75)} q${f(s * .5)},${f(-s * .1)} ${f(s * .6)},${f(s * .3)}" stroke="#F28FB0" stroke-width="${f(s * .06)}" fill="none"/>`;
  return g;
}
/** 학사모 + 월계수 (가운데 x, y) */
function kCapLaurel(x, y, r, c = '#4A3A33') {
  let s = '';
  for (const sd of [-1, 1]) for (let i = 0; i < 8; i++) {
    const a = (90 + sd * (40 + i * 17)) * KPI, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * .95;
    s += kLeaf(px, py, r * .3, (a / KPI) + sd * 100, c, .28);
  }
  return s + `<path d="M${f(x - r * .62)},${f(y - r * .12)} L${f(x)},${f(y - r * .42)} L${f(x + r * .62)},${f(y - r * .12)} L${f(x)},${f(y + r * .16)}Z" fill="${c}"/><path d="M${f(x - r * .36)},${f(y + r * .02)} L${f(x - r * .36)},${f(y + r * .3)} Q${f(x)},${f(y + r * .45)} ${f(x + r * .36)},${f(y + r * .3)} L${f(x + r * .36)},${f(y + r * .02)} L${f(x)},${f(y + r * .16)}Z" fill="${c}"/><path d="M${f(x + r * .1)},${f(y - r * .14)} L${f(x + r * .55)},${f(y + r * .02)} L${f(x + r * .55)},${f(y + r * .34)}" stroke="${c}" stroke-width="${f(r * .04)}" fill="none"/>`;
}

/* ---------- 쪽 배경 ---------- */
/** 1 · 2쪽 색 (연한 살구 원 · 장미색 선 · 학사모) */
const K12 = { c1: '#F4E7DE', c2: '#FAF2EC', band: '#FBF7F1', line: '#C99C9A', dot: '#D4AAA7', cap: '#9C6F6E', tassel: '#D0846B', rule: '#CBA9A6' };
function kinderBg(kind, tone, seed) {
  const ds = /^k-ds(\d+)$/.exec(kind);
  if (ds) return dosanBg(+ds[1]);      // 도산유치원 템플릿: 원본 그림 배경
  if (kind.startsWith('k-gj-') && window.gjBg) return gjBg(kind);      // 학교 템플릿: 경북조리과학고 2026
  if (kind.startsWith('k-cu-') && window.cuteBg) return cuteBg(kind);      // 귀여운 유치원 템플릿
  if (kind.startsWith('k-sm-') && window.simpleBg) return simpleBg(kind);      // 심플한 스타일 (모전) 템플릿
  const { W, H } = G, rng = rngOf(seed), idx = Math.round((seed - 1009) / 97), left = (idx % 2 === 1) !== !!G.kPairFirst;     // 첫 쪽부터 펼침이면 짝수 번째가 왼쪽
  const X = v => (left ? v : 1 - v) * W, Y = v => v * H, R = v => v * W, sw = Math.max(1.6, W / 800);
  let s = '', paper = '#FBF8F1';
  switch (kind) {
    case 'k-blank': {    // 1쪽: 연한 원 · 가는 장미색 세로선 (글자 · 사진 없음). 오른쪽 위 원은 2쪽으로 이어짐
      paper = '#FFFFFF';
      const ln = `stroke="${K12.line}" stroke-width="${f(W * .0016)}" stroke-linecap="round"`;
      s += `<circle cx="${f(W * 1.016)}" cy="${f(-H * .05)}" r="${f(W * .2)}" fill="${K12.c2}"/>
        <circle cx="${f(W * .787)}" cy="${f(H * .038)}" r="${f(W * .197)}" fill="${K12.c1}"/>
        <circle cx="${f(W * .768)}" cy="${f(H * .957)}" r="${f(W * .162)}" fill="${K12.c1}"/>
        <path d="M${f(W * .829)},0 V${f(H * .618)}" ${ln}/>
        <path d="M${f(W * .846)},${f(H * .355)} V${f(H * .871)}" ${ln}/>
        <circle cx="${f(W * .846)}" cy="${f(H * .871)}" r="${f(W * .014)}" fill="${K12.dot}"/>`;
      break;
    }
    case 'k-cover': {    // 2쪽: 위아래 연한 띠 · 오른쪽 가장자리 원 · 세로선 · 학사모 · 아래 구분선
      paper = '#FFFFFF';
      const ln = `stroke="${K12.line}" stroke-width="${f(W * .0016)}" stroke-linecap="round"`, lx = W * .966, cx = W * .634, cy = H * .1, c = W * .05;     // 학사모 · 구분선은 사진틀 가운데(63.4%)
      s += `<circle cx="${f(W * .016)}" cy="${f(-H * .05)}" r="${f(W * .2)}" fill="${K12.c2}"/>
        <rect x="${f(W * .217)}" y="0" width="${f(W * .668)}" height="${f(H * .032)}" fill="${K12.band}"/>
        <rect x="${f(W * .217)}" y="${f(H * .968)}" width="${f(W * .668)}" height="${f(H * .032)}" fill="${K12.band}"/>
        <circle cx="${f(W * .998)}" cy="${f(H * .39)}" r="${f(W * .077)}" fill="${K12.c1}"/>
        <circle cx="${f(W * .998)}" cy="${f(H * .87)}" r="${f(W * .136)}" fill="${K12.c1}"/>
        <path d="M${f(lx)},0 V${f(H * .306)}" ${ln}/>
        <path d="M${f(lx - W * .009)},${f(-H * .004)} L${f(lx)},${f(H * .008)} L${f(lx + W * .009)},${f(-H * .004)}" ${ln} fill="none"/>
        <circle cx="${f(lx)}" cy="${f(H * .306)}" r="${f(W * .009)}" fill="${K12.dot}"/>
        <path d="M${f(cx - c)},${f(cy - c * .12)} L${f(cx)},${f(cy - c * .55)} L${f(cx + c)},${f(cy - c * .12)} L${f(cx)},${f(cy + c * .3)}Z" fill="${K12.cap}"/>
        <path d="M${f(cx - c * .58)},${f(cy + c * .08)} V${f(cy + c * .55)} Q${f(cx)},${f(cy + c * .8)} ${f(cx + c * .58)},${f(cy + c * .55)} V${f(cy + c * .08)} L${f(cx)},${f(cy + c * .3)}Z" fill="${K12.cap}" fill-opacity=".85"/>
        <path d="M${f(cx + c * .78)},${f(cy - c * .05)} V${f(cy + c * .78)}" stroke="${K12.tassel}" stroke-width="${f(W * .0022)}"/>
        <path d="M${f(cx + c * .7)},${f(cy + c * .72)} L${f(cx + c * .86)},${f(cy + c * .72)} L${f(cx + c * .82)},${f(cy + c * 1.08)} L${f(cx + c * .74)},${f(cy + c * 1.08)}Z" fill="${K12.tassel}"/>
        <path d="M${f(W * .544)},${f(H * .952)} H${f(W * .622)} M${f(W * .646)},${f(H * .952)} H${f(W * .724)}" stroke="${K12.rule}" stroke-width="${f(W * .0014)}"/>
        <circle cx="${f(W * .634)}" cy="${f(H * .952)}" r="${f(W * .0045)}" fill="${K12.rule}"/>`;
      break;
    }
    case 'k-intro':
      s += washes([{ x: left ? .05 : .95, y: .05, r: .3, c: '#E9DCC8', a: .8 }, { x: left ? .02 : .98, y: .92, r: .28, c: '#E9DCC8', a: .7 }], W, H, rng);
      s += kVine(X(.0), Y(.0), R(.3), left ? 40 : 140, KC.sage, rng, 8, sw * 1.4, .22, [KC.pink, '#E9C2A6']) + kVine(X(.0), Y(.08), R(.2), left ? 10 : 170, KC.leaf2, rng, 6, sw * 1.2, .22);
      s += kVine(X(.0), Y(1), R(.34), left ? -50 : -130, KC.sage, rng, 8, sw * 1.4, .22, [KC.yellow, '#E9C2A6']) + kVine(X(.16), Y(1.01), R(.26), left ? -80 : -100, KC.leaf2, rng, 6, sw * 1.2, .22);
      break;
    case 'k-class': {
      const i = R(.03);
      s += washes([{ x: left ? .02 : .98, y: .02, r: .2, c: '#EADFCF', a: .7 }, { x: left ? .98 : .02, y: .98, r: .22, c: '#EADFCF', a: .7 }], W, H, rng);
      s += `<rect x="${f(i + (S.bleed ? 30 : 0))}" y="${f(i + (S.bleed ? 30 : 0))}" width="${f(W - 2 * i - (S.bleed ? 60 : 0))}" height="${f(H - 2 * i - (S.bleed ? 60 : 0))}" fill="none" stroke="#D8C6AE" stroke-width="${f(sw)}"/>`;
      s += kVine(X(.02), Y(.13), R(.2), left ? -55 : -125, KC.sage, rng, 6, sw, .26, ['#FFFFFF', '#F3E3A6']);
      s += kVine(X(.95), Y(.97), R(.18), left ? -120 : -60, KC.sage, rng, 6, sw, .26, ['#FFFFFF', '#F3E3A6']);
      break;
    }
    case 'k-spring':
      for (let i = 0; i < 9; i++) {
        const x = W * (.04 + i * .115 + rng() * .04), y = H * (.985 - rng() * .01), h = R(.05 + rng() * .05);
        s += `<path d="M${f(x)},${f(y)} Q${f(x + h * .2)},${f(y - h * .6)} ${f(x + h * .1)},${f(y - h)}" stroke="#9AA58F" stroke-width="${f(sw * .8)}" fill="none"/>`;
        s += i % 3 ? kLeaf(x, y - h * .3, h * .45, -60 - rng() * 60, 'none') + `<path d="M${f(x)},${f(y - h * .4)} l${f(h * .25)},${f(-h * .25)}" stroke="#9AA58F" stroke-width="${f(sw * .7)}"/>` : '';
        s += kFlower(x + h * .1, y - h, h * .14, [KC.pink, '#C9B4E0', KC.yellow, '#F2C6A0'][i % 4], '#F3D27A', rng() * 60);
      }
      s += kGrass(W * .02, W * .98, H * .99, R(.03), '#A9B39C', rng, 40, sw * .7);
      break;
    case 'k-meadow':
      s += washes([{ x: left ? .02 : .98, y: .02, r: .3, c: left ? '#CFE3B8' : '#F6D3DE', a: .7 }, { x: left ? .4 : .6, y: -.05, r: .2, c: left ? '#E2EDC9' : '#FBEBB8', a: .6 }, { x: left ? .05 : .95, y: 1, r: .3, c: '#D3E6BE', a: .8 }], W, H, rng);
      s += `<path d="M0,${f(H * .9)} Q${f(W * .3)},${f(H * .86)} ${f(W * .55)},${f(H * .9)} T${W},${f(H * .89)} L${W},${H} L0,${H}Z" fill="#D7E8C0" fill-opacity=".8"/>`;
      s += kGrass(0, W, H * .99, R(.07), '#8DBF84', rng, 70, sw);
      for (let i = 0; i < 6; i++) s += kFlower(W * (.1 + rng() * .8), H * (.9 + rng() * .07), R(.012), [KC.yellow, KC.pink, '#C9B4E0'][i % 3]);
      s += left ? kBear(X(.2), Y(.8), R(.075), 'crown') + kFlower(X(.35), Y(.88), R(.015), KC.yellow) : kSquirrel(X(.16), Y(.82), R(.07), true, 'cherry') + kLadybug(X(.3), Y(.74), R(.012));
      for (let i = 0; i < 6; i++) s += `<ellipse cx="${f(W * (.5 + rng() * .45))}" cy="${f(H * (.72 + rng() * .15))}" rx="${f(R(.008))}" ry="${f(R(.004))}" fill="${KC.pink}" transform="rotate(${f(rng() * 180)} ${f(W * .7)} ${f(H * .8)})"/>`;
      break;
    case 'k-summer':
      paper = '#EAF5FB';
      s += `<defs><linearGradient id="ksk${idx}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFDDF2"/><stop offset=".5" stop-color="#E8F4FA"/><stop offset="1" stop-color="#F3F9FC"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#ksk${idx})"/>`;
      s += `<rect x="0" y="${f(H * .53)}" width="${W}" height="${f(H * .3)}" fill="#9FD7CF" fill-opacity=".75"/><rect x="0" y="${f(H * .53)}" width="${W}" height="${f(H * .05)}" fill="#7FC2C4" fill-opacity=".6"/>`;
      for (let i = 0; i < 5; i++) s += `<path d="M${f(W * rng())},${f(H * (.6 + i * .04))} q${f(R(.04))},${f(-R(.01))} ${f(R(.08))},0" stroke="#FFFFFF" stroke-width="${f(sw)}" fill="none" stroke-opacity=".8"/>`;
      s += `<path d="M0,${f(H * .82)} Q${f(W * .35)},${f(H * .78)} ${f(W * .65)},${f(H * .8)} T${W},${f(H * .79)} L${W},${H} L0,${H}Z" fill="#EFD3A0"/>`;
      s += kGrass(0, W, H * .995, R(.06), '#8DBF84', rng, 50, sw);
      s += kCloud(X(.18), Y(.07), R(.06)) + kCloud(X(.6), Y(.04), R(.05));
      if (!left) s += kSun(X(.25), Y(.08), R(.035));
      s += kFrond(X(-.02), Y(.5), R(.22), left ? -20 : 200, KC.leaf2, rng) + kFrond(X(.0), Y(.56), R(.18), left ? 15 : 165, KC.leaf, rng);
      s += left ? kBear(X(.12), Y(.875), R(.045), 'swim') + `<rect x="${f(X(.42))}" y="${f(Y(.9))}" width="${f(R(.07))}" height="${f(R(.05))}" fill="#E7C27F"/><rect x="${f(X(.43))}" y="${f(Y(.9) - R(.025))}" width="${f(R(.02))}" height="${f(R(.03))}" fill="#E7C27F"/><rect x="${f(X(.465))}" y="${f(Y(.9) - R(.025))}" width="${f(R(.02))}" height="${f(R(.03))}" fill="#E7C27F"/>` : kSquirrel(X(.12), Y(.885), R(.045), true) + `<path d="M${f(X(.3))},${f(Y(.94))} l${f(R(.02))},${f(-R(.03))} l${f(R(.02))},${f(R(.03))}Z" fill="#F6C1A8"/>`;
      break;
    case 'k-autumn':
      s += washes([{ x: left ? .02 : .98, y: .98, r: .26, c: '#F3D2A6', a: .7 }, { x: left ? .95 : .05, y: .02, r: .22, c: '#F6DDB8', a: .6 }], W, H, rng);
      s += kGrass(W * .3, W * .7, H * .99, R(.09), '#D2B48C', rng, 30, sw * .8);
      for (let i = 0; i < 12; i++) { const x = W * rng(), y = H * (.05 + rng() * .9), r = R(.012 + rng() * .01); s += i % 3 ? kMaple(x, y, r, [KC.red, KC.orange, '#E7B04A'][i % 3], rng() * 360) : kGinkgo(x, y, r, '#E8C24A', rng() * 360); }
      s += left ? kBear(X(.12), Y(.88), R(.045), 'hat') + kMaple(X(.05), Y(.97), R(.03), KC.orange, 20) + kMaple(X(.24), Y(.97), R(.025), KC.red, -30) : kSquirrel(X(.12), Y(.885), R(.045), true, 'scarf') + kAcorn(X(.26), Y(.95), R(.02)) + kAcorn(X(.3), Y(.96), R(.018));
      break;
    case 'k-winter':
      paper = '#F2F6FA';
      s += washes([{ x: .1, y: .1, r: .45, c: '#C9DAEC', a: .9 }, { x: .9, y: .2, r: .4, c: '#D3E1EF', a: .8 }, { x: .5, y: .6, r: .45, c: '#DCE7F2', a: .8 }, { x: .2, y: .75, r: .3, c: '#C9DAEC', a: .7 }], W, H, rng);
      for (let i = 0; i < 70; i++) s += `<circle cx="${f(W * rng())}" cy="${f(H * rng() * .9)}" r="${f(R(.002 + rng() * .005))}" fill="#FFFFFF" fill-opacity="${f(.6 + rng() * .4)}"/>`;
      for (let i = 0; i < 16; i++) s += kSnow(W * rng(), H * rng() * .9, R(.02 + rng() * .04), '#FFFFFF', sw * (1 + rng()), rng() * 30);
      s += `<path d="M0,${f(H * .92)} Q${f(W * .3)},${f(H * .86)} ${f(W * .6)},${f(H * .91)} T${W},${f(H * .9)} L${W},${H} L0,${H}Z" fill="#FFFFFF" stroke="#B9C9DA" stroke-width="${f(sw)}"/><path d="M0,${f(H * .96)} Q${f(W * .4)},${f(H * .92)} ${W},${f(H * .955)} L${W},${H} L0,${H}Z" fill="#F4F8FB"/>`;
      break;
    case 'k-end':
      s += washes([{ x: .1, y: .05, r: .3, c: '#FBE3C9', a: .7 }, { x: .9, y: .95, r: .3, c: '#F6D3DE', a: .6 }], W, H, rng);
      s += kConfetti(W * .05, H * .02, W * .95, H * .12, 18, rng) + kGrass(0, W, H * .99, R(.05), '#A9CF9B', rng, 50, sw);
      s += kBear(X(.82), Y(.86), R(.05), 'crown');
      break;
  }
  return `<svg class="bg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><rect width="${W}" height="${H}" fill="${paper}"/>${s}</svg>`;
}

/* ---------- 틀 모양 (구름 · 물방울 · 찢긴 종이). 틀 크기에 맞춰 % 좌표로 ---------- */
function kShapePts(type) {
  const p = [];
  if (type === 'torn') {
    const r = rngOf(77), j = () => r() * 1.8;
    for (let i = 0; i <= 30; i++) p.push([i / 30 * 100, j()]);
    for (let i = 1; i <= 40; i++) p.push([100 - j(), i / 40 * 100]);
    for (let i = 1; i <= 30; i++) p.push([100 - i / 30 * 100, 100 - j()]);
    for (let i = 1; i < 40; i++) p.push([j(), 100 - i / 40 * 100]);
    return p;
  }
  for (let i = 0; i < 120; i++) {
    const t = i / 120 * Math.PI * 2;
    const k = type === 'cloud' ? .84 + .16 * Math.abs(Math.sin(t * 4 + .4)) : .93 + .05 * Math.sin(2 * t + .6) + .02 * Math.sin(3 * t + 1.3);
    p.push([50 + 50 * k * Math.cos(t), 50 + 50 * k * Math.sin(t)]);
  }
  return p;
}
const kPoly = type => `polygon(${kShapePts(type).map(([x, y]) => `${f(x)}% ${f(y)}%`).join(',')})`;
const kPath = type => `M${kShapePts(type).map(([x, y]) => `${f(x)},${f(y)}`).join('L')}Z`;
function kinderStyle() {      // 처음 그릴 때 한 번만 (album.js의 도구를 쓰므로 불러오는 순서와 무관하게)
  if (document.getElementById('kinder-shapes')) return;
  const st = document.createElement('style');
  st.id = 'kinder-shapes';
  st.textContent = `.lf.k-cloud .photo{clip-path:${kPoly('cloud')}}.lf.k-blob .photo{clip-path:${kPoly('blob')}}.lf.k-torn{clip-path:${kPoly('torn')}}`;
  document.head.appendChild(st);
}
const kOutline = (type, col = '#C9B9A6', double = true) => `<svg class="k-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${kPath(type)}" stroke="${col}"/>${double ? `<path d="${kPath(type)}" stroke="${col}" stroke-opacity=".6" transform="translate(-1.6 -1.6) scale(1.032)"/>` : ''}</svg>`;
const kSketchLine = (col = '#8E7D6E') => `<svg class="k-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M2,1.5 Q50,.6 98.4,1.8 Q99.2,50 98.2,98.6 Q50,99.4 1.6,98.2 Q.8,50 2,1.5Z" stroke="${col}"/><path d="M.6,.8 Q50,1.6 99.6,.5 Q98.6,50 99.5,99.4 Q50,98.4 .5,99.6 Q1.6,50 .6,.8Z" stroke="${col}" stroke-opacity=".55"/></svg>`;
const kTape = (col = 'rgba(210,198,172,.78)', at = 50, rot = -2) => `<i class="k-tape" style="left:calc(${at}% - 5cqw);background:${col};transform:rotate(${rot}deg)"></i>`;

/* ---------- 틀 모서리 장식 (틀 안에 그려서 틀을 따라감) ---------- */
function kOrn(kind, corners = ['tl', 'br'], size = 11) {
  const r = rngOf(kind.length * 31 + corners.join('').length * 7);
  const art = c => {
    const flipX = c.includes('r'), flipY = c.includes('b');
    let g = '';
    switch (kind) {
      case 'blossom': g = kVine(12, 12, 85, 0, KC.leaf, r, 5, 1.6, .16, [KC.pink, KC.lav]) + kVine(12, 12, 70, 90, KC.leaf, r, 4, 1.6, .16, [KC.pink]) + kFlower(14, 14, 9, KC.pink) + kFlower(28, 8, 7, KC.yellow); break;
      case 'tulip': g = kTulip(30, 92, 22, KC.pink2, -.2) + kTulip(52, 96, 18, '#F3A06B', .2) + kFlower(14, 90, 7, KC.yellow); break;
      case 'vine': g = kVine(6, 6, 80, 0, '#8E7D6E', r, 5, 1.2, .2) + kVine(6, 6, 70, 90, '#8E7D6E', r, 4, 1.2, .2); break;
      case 'tropic': g = kFrond(4, 30, 60, -15, KC.leaf2, r) + kFrond(20, 6, 55, 20, KC.leaf, r) + kFlower(20, 22, 9, '#F28A7A', '#F8D66D') + kFlower(34, 12, 7, KC.yellow) + kFlower(10, 42, 7, '#9AA7E8'); break;
      case 'wreath': g = kVine(8, 40, 70, -70, KC.sage, r, 5, 1.2, .2, [KC.pink, KC.rose]); break;
      case 'leaf': g = kMaple(12, 12, 9, KC.red, 10) + kGinkgo(32, 8, 7, '#E8C24A', -30) + kMaple(8, 34, 7, KC.orange, -20) + kVine(12, 12, 60, 0, '#8E6B4E', r, 3, 1, .15) + kBerry(46, 10, 2.4) + kAcorn(26, 26, 5); break;
      case 'snow': g = kSnow(20, 20, 18, '#FFFFFF', 1.6) + kSnow(40, 10, 8, '#FFFFFF', 1.1, 15); break;
      case 'daisy': g = kVine(16, 16, 50, 70, KC.leaf2, r, 4, 1.4, .26) + kFlower(18, 18, 14, '#FFFFFF', '#F6C84A', 0, 9) + kFlower(36, 10, 9, '#FFFFFF', '#F6C84A', 20, 9) + kFlower(10, 36, 8, '#FFFFFF', '#F6C84A', 10, 9); break;
      case 'forsythia': for (let i = 0; i < 7; i++) g += kFlower(10 + i * 8, 8 + (i % 2) * 8 + i * 3, 6, KC.yellow, '#E8A33A', i * 20, 4); g = kVine(6, 6, 70, 30, '#8B6B3E', r, 3, 1.4, .18) + g; break;
      case 'gyp': for (let i = 0; i < 5; i++) { const a = (-70 - i * 18) * KPI; g += `<path d="M30,90 L${f(30 + Math.cos(a) * 40)},${f(90 + Math.sin(a) * 40)}" stroke="#9AA58F" stroke-width="1"/><circle cx="${f(30 + Math.cos(a) * 40)}" cy="${f(90 + Math.sin(a) * 40)}" r="2.4" fill="none" stroke="#9AA58F"/>`; } break;
      case 'sprig': g = kVine(40, 95, 80, -60, KC.sage, r, 6, 1.3, .2); break;
    }
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><g transform="translate(${flipX ? 100 : 0} ${flipY ? 100 : 0}) scale(${flipX ? -1 : 1} ${flipY ? -1 : 1})">${g}</g></svg>`;
  };
  size *= 1.7;      // 장식이 틀 모서리를 넉넉히 덮도록
  const o = `${f(-size * .22)}cqw`, pos = { tl: `left:${o};top:${o}`, tr: `right:${o};top:${o}`, bl: `left:${o};bottom:${o}`, br: `right:${o};bottom:${o}` };
  return corners.map(c => `<i class="k-orn" style="${pos[c]};width:${f(size)}cqw;height:${f(size)}cqw">${art(c)}</i>`).join('');
}
const kCircle = (cx, cy, w) => { const h = w / G.aspect; return [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2]; };
const kTag = (box, key, text, col) => LT(box, `<span class="k-heart">♥</span>${E(key, text, 'k-tag-t')}<span class="k-heart">♥</span>`, `k-tag k-${col}`);

/* ---------- 원아 사진 (6쪽): 주어진 칸(위 top부터 높이 H %)을 원아 수만큼의 사진틀이 꽉 채우도록, 인원이 적으면 크게 · 많으면 작게 ----------
   이름은 각 사진 바로 밑에 따라가고 글자 크기는 그대로. 6쪽 첫 장은 아래에 단체 02가 있어 위쪽 칸만 씀 */
const K_PER_PAGE = 30, K_NAME_H = 3.2, K_FILL = 77;
function kKidGrid(n, top = 12, H = K_FILL) {
  if (!n) return [];
  const left = 5, right = 95, W = right - left, gx = 2.2, gy = 1.4, TALL = 1.4;     // 틀은 정사각형 ~ 세로 1.4배까지 늘려 빈 곳을 채움
  let best = null;
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const cellH = (H - gy * (rows - 1)) / rows - K_NAME_H;      // 이름을 뺀 사진 높이(쪽 높이 %)
    if (cellH <= 0) continue;
    const s = Math.min((W - gx * (cols - 1)) / cols, cellH * G.aspect, 40);      // 폭(쪽 폭 %) — 적어도 정사각형이 들어가게
    const ch = Math.min(cellH, s * TALL / G.aspect);
    const area = s * ch;
    if (s > 0 && (!best || area > best.area + .01)) best = { cols, rows, s, ch, area };
  }
  const { cols, rows, s, ch } = best, rowH = ch + K_NAME_H;
  const usedH = rows * rowH + (rows - 1) * gy, y0 = top + (H - usedH) / 2;
  return Array.from({ length: n }, (_, k) => {
    const row = Math.floor(k / cols), inRow = row === rows - 1 ? n - row * cols : cols;     // 마지막 줄은 가운데로
    const x0 = 50 - (inRow * s + (inRow - 1) * gx) / 2;
    return [x0 + (k % cols) * (s + gx), y0 + row * (rowH + gy), s, ch];
  });
}


/* 개인 앨범 사진 키: 2쪽 · 3쪽 개인 학사모 · 4쪽 개인 프로필. 이름 기준이라 명단 순서가 바뀌어도 사진이 따라감 */
/** 유치원 명단: '이채연 선생님'처럼 선생님 · 교사 · 원장 · 원감이 붙은 줄은 원아가 아니라 담임으로 */
const K_TEACHER_RX = /\s*(선생님|선생|교사|담임|원장|원감)$/;
function kClasses() {
  return parseRoster(S.roster).map(c => {
    const students = [];
    let teacher = c.teacher;
    c.students.forEach((s, idx) => { if (K_TEACHER_RX.test(s.name)) teacher ||= s.name.replace(K_TEACHER_RX, ''); else students.push({ ...s, idx }); });
    return { ...c, teacher, students };
  });
}
const kpKey = (kind, name) => `kp-${kind}|${name}`;
/* ---------- 쪽 구성 ---------- */
function kinderPages(classes) {
  if (S.kTemplate === 'dosan') return dosanPages(classes);      // 도산유치원 10×11 템플릿 (dosan.js)
  if (S.kTemplate === 'cute' && window.cutePages) return cutePages(classes);      // 귀여운 유치원 템플릿 (kinder-cute.js)
  if (S.kTemplate === 'simple' && window.simplePages) return simplePages(classes);      // 심플한 스타일 (모전) 템플릿 (kinder-simple.js)
  kinderStyle();
  const kidNames = classes.flatMap(c => c.students).map(s => s.name).filter(Boolean);
  const pk = (kind, def) => (S.kPersonal && kidNames[0] ? kpKey(kind, kidNames[0]) : def);     // 개인 앨범이면 2·3·4쪽 사진은 원아마다 따로
  const ev = key => pk(`ev-${key}`, key);     // 7~14쪽 행사 사진도 개인 앨범이면 원아마다 따로
  const kp = (kind, label, html) => layPage(kind, label, [kind, ['butter', 'peach', 'sage']], html, { run: false, folio: false });
  const pages = [];
  const year = esc(S.year), school = esc(S.school);
  // 1쪽 백지(왼쪽) + 2쪽 '소중한 추억들'(오른쪽)로 첫 펼침면. 책 표지는 따로 만들지 않음
  pages.push({ ...kp('k-blank', '백지', ''), pairFirst: true });
  // 2쪽: 오른쪽에 가는 테두리 세로 사진틀, 위에 제목, 왼쪽 아래 학사모 장식 · 학년도, 사진 밑에 유치원 이름 (작은 학사모 · 구분선은 배경)
  pages.push(kp('k-cover', '소중한 추억들', `
    ${LT([33, 14, 93.8, 21.5], E('k-cover-title', `${S.year} 소중한 추억들`, 'k-cover-title'), 'lcenter')}
    ${LF(pk('cover', 'k-cover'), [37.1, 23.9, 89.7, 83.1], 'k-thin')}
    ${LT([3, 62, 35, 82], `<svg viewBox="0 0 100 70" class="k-emb k-emb-s">${kCapLaurel(50, 34, 26, '#2F4A5C')}${kFlower(30, 52, 5, KC.pink)}${kFlower(70, 52, 5, KC.yellow)}</svg><div class="k-emb-y">${year} 학년도</div>`, 'lcenter')}
    ${LT([33, 84, 93.8, 89.5], `<div class="k-cover-school">${school}</div>`, 'lcenter')}
    ${LT([33, 89.6, 93.8, 93.6], `<div class="k-cover-class">${esc(classes[0]?.name || '')}${S.kPersonal && kidNames[0] ? ` <span class="k-cname">${esc(kidNames[0])}</span>` : ''}</div>`, 'lcenter')}`));     // 제목 · 유치원 이름 · 반 이름은 사진틀(37.1~89.7)과 같은 가운데(63.4)
  // 소개 펼침면 (반 단체 · 원아 쪽 뒤에 넣음)
  const intro = [];
  intro.push(kp('k-intro', '소개 (왼쪽)', `
    ${LT([4, 13, 33, 20], E('k-en', 'KINDERGARTEN', 'k-en'), 'lcenter')}
    ${LT([6, 24, 31, 37], `<svg viewBox="0 0 100 70" class="k-emb">${kCapLaurel(50, 36, 28)}</svg>`, 'lcenter')}
    ${LT([3, 39, 34, 52], `<div class="k-year">${year}학년도</div><div class="k-name" style="white-space:pre-line">${school.replace(/(.)(병설유치원)$/, '$1\n$2')}</div><div class="k-rule"></div>`, 'lcenter')}
    ${LT([4, 58, 34, 70, -10], `${E('k-intro-script', 'Always\nbe happy', 'k-script')}<div class="k-heart-big">♡</div>`, 'lcenter')}
    ${LF(pk('cap', 'ki-0'), [37, 8, 94, 92], 'k-sk', '', '', kSketchLine() + kOrn('vine', ['tl', 'tr', 'bl', 'br'], 9))}`));
  intro.push(kp('k-intro', '소개 (오른쪽)', `
    ${LF(pk('prof', 'ki-1'), [6, 8, 63, 92], 'k-sk', '', '', kSketchLine() + kOrn('vine', ['tl', 'tr', 'bl', 'br'], 9))}
    ${LT([66, 24, 96, 38], E('k-intro-1', '꿈을 향해\n한 걸음 더', 'k-pen-big'), 'lcenter')}
    ${LT([68, 40, 94, 42], '<div class="k-rule"></div>', 'lcenter')}
    ${LT([66, 44, 96, 60], E('k-intro-2', '지금 이 순간,\n너희는\n참 예쁘다.', 'k-msg'), 'lcenter')}
    ${LT([66, 63, 96, 69], E('k-en', 'KINDERGARTEN', 'k-en'), 'lcenter')}
    ${S.kPersonal ? LT([64, 73, 98, 84], `<div class="k-pname" contenteditable="false">${esc(kidNames[0] || '이름')}</div>`, 'lcenter') : ''}`));
  // 반마다: 왼쪽 단체사진 두 장, 오른쪽 원아 사진 (한 쪽에 최대 25명)
  classes.forEach((c, ci) => {
    const name = esc(c.name), tName = (ci === 0 && S.homeTeacher) || c.teacher || '';
    // 5쪽: 위에 담임 선생님 사진 → 단체 03 · 04 (세로), 아래에 단체 01 (가로로 길게)
    pages.push(kp('k-class', `${c.name} 단체`, `
      ${LT([10, 6, 56, 18.5], `<div class="k-year-s">${year}학년도</div><div class="k-class-name">${school} ${name}</div><div class="k-en k-en-s">${E(`k-class-en-${ci}`, 'GRADUATION ALBUM', '')}</div>`)}
      ${LT([62, 5, 92, 17, -6], E(`k-class-pen-${ci}`, '행복한 꿈을\n함께 키워가는\n우리 ♥', 'k-pen'), 'lcenter')}
      ${LF(`c${ci}-tch`, [6, 21, 33.3, 54.5], 'k-ticket')}
      ${LT([3, 55.2, 36.3, 59.6], `<div class="k-tname">담임 ${esc(tName || '○○○')} 선생님</div>`, 'lcenter')}
      ${LF(`c${ci}-g2`, [36.4, 21, 63.6, 59.6], 'k-ticket')}
      ${LF(`c${ci}-g3`, [66.7, 21, 94, 59.6], 'k-ticket')}
      ${LF(`c${ci}-g0`, [6, 62.5, 94, 94], 'k-ticket')}`));
    // 6쪽: 위에 원아 수만큼 사진틀(빈 곳을 채우도록), 아래에 단체 02 (가로로 길게). 원아가 많아 넘치면 다음 쪽은 원아 사진만
    const kids = c.students.map(s => ({ s, i: s.idx }));     // 원래 명단 자리 번호로 사진 키를 써서, 선생님 줄을 빼도 사진이 밀리지 않음
    for (let p = 0; p < Math.max(1, Math.ceil(kids.length / K_PER_PAGE)); p++) {
      const chunk = kids.slice(p * K_PER_PAGE, p * K_PER_PAGE + K_PER_PAGE), first = p === 0;
      let grid = '';
      kKidGrid(chunk.length, 12.5, first ? 47.5 : K_FILL).forEach(([x, y, s, ch], n) => {
        const { s: st, i } = chunk[n], nw = Math.max(s + 2, 12);
        grid += LF(`c${ci}-s${i}`, [x, y, x + s, y + ch], 'k-round k-sq') + LT([x + s / 2 - nw / 2, y + ch + .4, x + s / 2 + nw / 2, y + ch + K_NAME_H], `<div class="k-sname">${esc(st.name)}</div>`, 'lcenter');
      });
      pages.push(kp('k-class', `${c.name} 원아${p ? ` ${p + 1}` : ''}`, `
        ${LT([8, 6.5, 50, 10.5], '<div class="k-en k-en-l">A Graduation Album</div>')}
        ${LT([56, 5.5, 92, 11], E(`k-class-cong-${ci}`, '진심으로 축하해요 ♥', 'k-pen'), 'lright')}
        ${grid}
        ${first ? LF(`c${ci}-g1`, [6, 63, 94, 94], 'k-ticket') : LT([52, 89, 92, 93], '<div class="k-en k-thanks">THANK YOU</div>', 'lcenter')}`));
    }
  });
  pages.push(...intro);     // 소개 펼침면은 반 단체(3쪽) · 원아(4쪽) 다음 → 5 · 6쪽
  // 봄 — 동물 친구
  pages.push(kp('k-meadow', '봄 · 동물 친구 (왼쪽)', `
    ${LF(ev('ks-b0'), [6, 12, 39, 61], 'k-sk', '', '', kSketchLine('#7C7066') + kOrn('blossom', ['tl'], 13) + kOrn('tulip', ['bl', 'br'], 12))}
    ${LF(ev('ks-b1'), [45, 14, 92, 46], 'k-sk', '', '', kSketchLine('#7C7066') + kOrn('blossom', ['tr', 'bl'], 11))}
    ${LF(ev('ks-b2'), [45, 50, 92, 82], 'k-sk', '', '', kSketchLine('#7C7066') + kOrn('blossom', ['tr'], 11) + kOrn('tulip', ['br'], 11))}`));
  pages.push(kp('k-meadow', '봄 · 동물 친구 (오른쪽)', `
    ${LF(ev('ks-b3'), [6, 13, 91, 73], 'k-sk', '', '', kSketchLine('#7C7066') + kOrn('blossom', ['tr', 'bl'], 15))}`));
  // 여름
  pages.push(kp('k-summer', '여름 (왼쪽)', `
    ${LF(ev('ku-0'), [14, 9, 90, 47], 'k-sk', '', '', kSketchLine('#6C8A8A') + kOrn('tropic', ['tl', 'tr', 'bl', 'br'], 13))}
    ${LF(ev('ku-1'), [8, 55, 54, 83], 'k-sk', '', '', kSketchLine('#6C8A8A') + kOrn('wreath', ['tl', 'tr'], 10))}
    ${LF(ev('ku-2'), kCircle(76, 70, 32), 'k-ci k-l-white', '', '', kOrn('wreath', ['tl', 'br'], 10))}`));
  pages.push(kp('k-summer', '여름 (오른쪽)', `
    ${LF(ev('ku-3'), kCircle(28, 25, 36), 'k-ci k-l-white', '', '', kOrn('wreath', ['tl', 'br'], 11))}
    ${LF(ev('ku-4'), kCircle(72, 28, 36), 'k-ci k-l-white', '', '', kOrn('wreath', ['tr', 'bl'], 11))}
    ${LF(ev('ku-5'), [9, 46, 58, 88], 'k-sk', '', '', kSketchLine('#6C8A8A') + kOrn('wreath', ['tl', 'tr'], 10))}
    ${LF(ev('ku-6'), [63, 54, 92, 80], 'k-sk', '', '', kSketchLine('#6C8A8A') + kOrn('wreath', ['tr'], 9))}`));
  // 가을
  pages.push(kp('k-autumn', '가을 (왼쪽)', `
    ${LF(ev('ka-0'), [6, 8, 90, 44], 'k-sk', '', '', kSketchLine('#8A7262') + kOrn('leaf', ['tl', 'br'], 12))}
    ${LF(ev('ka-1'), [6, 48, 46, 82], 'k-sk', '', '', kSketchLine('#8A7262'))}
    ${LF(ev('ka-2'), [51, 48, 90, 82], 'k-sk', '', '', kSketchLine('#8A7262') + kOrn('leaf', ['tr', 'bl'], 11))}`));
  pages.push(kp('k-autumn', '가을 (오른쪽)', `
    ${LF(ev('ka-3'), [8, 8, 43, 46], 'k-sk', '', '', kSketchLine('#8A7262') + kOrn('leaf', ['tl', 'br'], 11))}
    ${LF(ev('ka-4'), [8, 50, 43, 88], 'k-sk', '', '', kSketchLine('#8A7262') + kOrn('leaf', ['tr', 'bl'], 10))}
    ${LF(ev('ka-5'), [50, 27, 92, 61], 'k-sk', '', '', kSketchLine('#8A7262') + kOrn('leaf', ['tr', 'br'], 11))}
    ${LF(ev('ka-6'), [50, 65, 92, 82], 'k-sk', '', '', kSketchLine('#8A7262') + kOrn('leaf', ['tr'], 10))}`));
  // 겨울
  pages.push(kp('k-winter', '겨울 (왼쪽)', `
    ${LF(ev('kw-0'), [12, 11, 80, 47], 'k-round k-l-ice', '', '', kOrn('snow', ['tl', 'tr', 'br'], 12))}
    ${LF(ev('kw-1'), [14, 54, 52, 80], 'k-round k-l-ice', '', '', kTape('rgba(200,200,200,.75)', 35) + kOrn('snow', ['br'], 10))}
    ${LF(ev('kw-2'), kCircle(72, 65, 30), 'k-ci k-l-ice')}`));
  pages.push(kp('k-winter', '겨울 (오른쪽)', `
    ${LF(ev('kw-3'), [6, 10, 42, 34], 'k-round k-l-ice', '', '', kTape('rgba(200,200,200,.75)', 45) + kOrn('snow', ['br'], 10))}
    ${LF(ev('kw-4'), kCircle(70, 22, 30), 'k-ci k-l-ice', '', '', kTape('rgba(200,200,200,.75)', 40, 0))}
    ${LF(ev('kw-5'), [10, 38, 84, 60], 'k-round k-l-ice', '', '', kOrn('snow', ['tr', 'bl'], 11))}
    ${LF(ev('kw-6'), [6, 65, 50, 90], 'k-cloud', '', '', kOutline('cloud', '#C4D2E0'))}
    ${LF(ev('kw-7'), [57, 63, 89, 87], 'k-round k-l-ice', '', '', kTape('rgba(200,200,200,.75)', 50, 1) + kOrn('snow', ['br'], 11))}`));
  return pages;
}

/* 유치원 템플릿 목록 (도산유치원은 10×11 판형 고정) */
const K_TEMPLATE_OPTS = '<option value="basic">기본 (수채화 사계절)</option><option value="dosan">도산유치원 10×11inch</option><option value="cute">귀여운 유치원 (사계절 캐릭터)</option><option value="simple">심플한 스타일 (모전)</option>';
/* ---------- 메뉴: 유치원앨범 만들기 ---------- */
function kinderAlbumDialog() {
  const sizeOpts = KINDER_SIZES.map(k => `<option value="${k}">${esc(SIZES[k].name)}</option>`).join('');
  showPrj('유치원앨범 만들기', `
    <div class="pd-grid prj-grid">
      <span>유치원 이름:</span><input type="text" id="ka-school" placeholder="예: ○○유치원">
      <span>학년도:</span><input type="text" id="ka-year" value="${esc(S.year)}">
      <span>템플릿:</span><select id="ka-tpl">${K_TEMPLATE_OPTS}</select>
      <span>판형:</span><select id="ka-size">${sizeOpts}</select>
      <span>반 이름:</span><input type="text" id="ka-class" placeholder="예: 햇살반">
      <span>담임 선생님:</span><input type="text" id="ka-teacher">
      <span>원아 이름:</span><textarea id="ka-kids" rows="6" placeholder="한 줄에 한 명씩&#10;반이 여러 개면 '# 반 이름' 줄로 나눔"></textarea>
    </div>
    <p class="pd-note">백지 · 소중한 추억들 · 소개 · 반 단체/원아 사진 · 봄 · 여름 · 가을 · 겨울 쪽이 만들어집니다. 지금 앨범은 그대로 남습니다.</p>
    <div id="ka-msg" class="prj-msg"></div>`, [
    { text: '만들기', main: true, on: () => {
      const school = $('#ka-school').value.trim();
      if (!school) { $('#ka-msg').textContent = '유치원 이름을 입력하세요.'; return; }
      const kids = $('#ka-kids').value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      const cls = $('#ka-class').value.trim() || '햇살반', teacher = $('#ka-teacher').value.trim();
      const roster = kids[0]?.startsWith('#') ? kids.join('\n') : [`# ${cls}${teacher ? ` | ${teacher}` : ''}`, ...kids].join('\n');
      flushState();
      const tpl = $('#ka-tpl').value;
      const id = createAlbum({ ...DEFAULTS, albumType: 'kinder', kTemplate: tpl, theme: 'classic', size: tpl === 'dosan' ? 'in1011' : $('#ka-size').value, school, year: $('#ka-year').value.trim(), nth: '', principal: '', vice: '', teachers: '', roster, pad4: false, zoom: S.zoom });
      switchAlbum(id);
    } },
    { text: '취소', on: closePrj },
  ]);
}
document.getElementById('p-kinder')?.addEventListener('click', kinderAlbumDialog);
/* ---------- 원아별 개인 앨범: 원아 수만큼 앨범 전체를 반복하고, 각 앨범 4쪽에 그 원아 이름 ----------
   첫 앨범(첫 원아)이 원본이라 거기서 고친 틀 · 글자 · 사진이 나머지 앨범에 그대로 복사됨. 나머지 앨범은 보기 · 인쇄용 */
function kPersonalCopies() {
  const names = kClasses().flatMap(c => c.students).map(s => s.name).filter(Boolean);
  const box = document.getElementById('pages');
  const master = [...box.querySelectorAll(':scope > .spread')];
  if (!master.length || names.length < 2) return 1;
  const label = (sheet, name) => { const l = sheet.querySelector('.sheet-label'); if (l) l.textContent = `${name} · ${l.textContent.replace(/^.*? · (?=P\.)/, '')}`; };
  master.forEach(sp => sp.querySelectorAll('.sheet').forEach(s => label(s, names[0])));
  const frag = document.createDocumentFragment();
  names.slice(1).forEach((name, k) => {
    master.forEach(sp => {
      const c = sp.cloneNode(true);
      c.classList.add('k-copy');
      c.querySelectorAll('.page').forEach(p => { p.dataset.pid = `${p.dataset.pid}~${k + 1}`; });
      c.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
      c.querySelectorAll('.photo:not([data-photo^="kp-"]) .ph-remove, .k-shared .ph-remove, .photo:not([data-photo^="kp-"]) .ph-rot, .k-shared .ph-rot').forEach(el => el.remove());
      c.querySelectorAll('.k-pname, .k-folio-name, .k-cname').forEach(el => { el.textContent = name; });     // 2쪽 · 6쪽 이름 · 쪽 아래 이름
      c.querySelectorAll('.sheet').forEach(s => label(s, name));
      c.querySelectorAll('.photo[data-photo^="kp-"]:not(.k-shared .photo)').forEach(el => { el.dataset.photo = kpKey(el.dataset.photo.slice(3, el.dataset.photo.indexOf('|')), name); });   // 2·3·4쪽은 이 원아의 사진
      frag.appendChild(c);
    });
  });
  box.appendChild(frag);
  box.querySelectorAll('.spread.k-copy .photo[data-photo^="kp-"]').forEach(applyPhoto);
  return names.length;
}
/* ---------- 마스터 쪽 (개인 앨범의 3 · 4쪽: 선생님 명렬 · 원아 명단) ----------
   - 어느 원아 앨범의 3 · 4쪽에서 틀을 옮기거나 크기 · 모양을 바꿔도 모든 원아 앨범의 3 · 4쪽이 똑같이 바뀜
     (사본 쪽에서 고친 기록은 첫 앨범 쪽 기록으로 옮기고, 사본 쪽은 첫 앨범 쪽을 다시 복사)
   - 다른 쪽은 원아마다 따로: 사본 쪽에서 고친 틀은 그 원아 앨범에만 적용되고 다시 열어도 남음 */
const K_MASTER_IDX = [2, 3];      // 3쪽 · 4쪽 (심플 템플릿은 2쪽 표지 + 선생님 · 원아 · 조 단체사진인 5~8쪽. 2쪽 사진 · 이름은 원아마다 바뀜)
const kMasterIdx = () => (S.kTemplate === 'simple' ? [1, 4, 5, 6, 7] : K_MASTER_IDX);
const kMasterPids = () => [...document.querySelectorAll('#pages > .spread:not(.k-copy) .page')].filter((p, i) => kMasterIdx().includes(i)).map(p => p.dataset.pid);
const kMasterSig = {};
const kHash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; };
function kCopyPage(master, k, name) {
  const c = master.cloneNode(true);
  c.dataset.pid = `${master.dataset.pid}~${k}`;
  c.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
  c.querySelectorAll('.photo:not([data-photo^="kp-"]) .ph-remove, .k-shared .ph-remove, .photo:not([data-photo^="kp-"]) .ph-rot, .k-shared .ph-rot').forEach(el => el.remove());
  c.querySelectorAll('.k-pname, .k-folio-name, .k-cname').forEach(el => { el.textContent = name; });
  c.querySelectorAll('.fr-sel-on, .pg-flash').forEach(el => el.classList.remove('fr-sel-on', 'pg-flash'));
  c.querySelectorAll('.photo[data-photo^="kp-"]:not(.k-shared .photo)').forEach(el => { el.dataset.photo = kpKey(el.dataset.photo.slice(3, el.dataset.photo.indexOf('|')), name); });
  return c;
}
function kRefreshCopies(force = false) {      // force: render 직후처럼 사본이 마스터 쪽 고친 모양 없이 복사됐을 때 다시 복사
  const names = kClasses().flatMap(c => c.students).map(s => s.name).filter(Boolean);
  let n = 0;
  const masters = kMasterPids();
  document.querySelectorAll('#pages > .spread:not(.k-copy) .page').forEach(m => {
    if (!masters.includes(m.dataset.pid)) return;
    const pid = m.dataset.pid, sig = kHash(m.innerHTML);
    if (kMasterSig[pid] === sig) return;
    const first = kMasterSig[pid] === undefined;
    kMasterSig[pid] = sig;
    if (first && !force) return;      // 처음 그릴 때는 render가 이미 복사함
    document.querySelectorAll(`#pages .page[data-pid^="${CSS.escape(pid)}~"]`).forEach(old => {
      const k = +old.dataset.pid.split('~').pop(), c = kCopyPage(m, k, names[k] || '');
      old.replaceWith(c);
      c.querySelectorAll('.photo[data-photo]').forEach(applyPhoto);
      n++;
    });
  });
  return n;
}
/** 사본 쪽에서 고친 틀 기록(쪽 번호표에 ~가 붙은 것)을 마스터 쪽 기록으로 옮김. 옮긴 게 있으면 true */
function kMoveCopyEdits() {
  const d = S.frameEdits;
  if (!d) return false;
  const first = kClasses().flatMap(c => c.students).map(s => s.name).filter(Boolean)[0] || '';
  const toMaster = (pid, key) => [pid.replace(/~\d+$/, ''), key.startsWith('kp-') ? kpKey(key.slice(3, key.indexOf('|')), first) : key];
  const masters = new Set(kMasterPids()), isMasterCopy = pid => !!pid && pid.includes('~') && masters.has(pid.replace(/~\d+$/, ''));
  let moved = false;
  for (const map of [d.over, d.text]) {
    if (!map) continue;
    for (const id of Object.keys(map)) {
      const cut = id.indexOf('|'), pid = id.slice(0, cut);
      if (!isMasterCopy(pid)) continue;
      const [mp, mk] = toMaster(pid, id.slice(cut + 1));
      map[`${mp}|${mk}`] = { ...(map[`${mp}|${mk}`] || {}), ...map[id] };
      delete map[id];
      moved = true;
    }
  }
  for (const x of d.extra || []) if (isMasterCopy(x.pid)) { x.pid = x.pid.replace(/~\d+$/, ''); moved = true; }
  for (const x of d.xtext || []) if (isMasterCopy(x.pid)) { x.pid = x.pid.replace(/~\d+$/, ''); moved = true; }
  return moved;
}
addEventListener('DOMContentLoaded', () => {
  const save = window.saveState;
  if (typeof save !== 'function') return;
  let t = 0, busy = false;
  const sync = () => {
    if (busy || S.albumType !== 'kinder' || !S.kPersonal) return;
    busy = true;
    try {
      if (kMoveCopyEdits()) {
        const sel = frameSel && { ...frameSel };
        save(); render();
        if (sel) { frameSel = sel; syncFrameSel(); }
        window.pgNote?.('사본 쪽에서 고친 틀을 마스터 쪽에 옮겨, 모든 원아 앨범에 똑같이 적용했습니다.');
      } else kRefreshCopies();
    } finally { busy = false; }
  };
  window.saveState = function (...a) { const r = save.apply(this, a); clearTimeout(t); t = setTimeout(sync, 300); return r; };
  const rd = window.render;     // 새로 그리면 사본도 새로 복사되므로 마스터 모양을 다시 기억
  if (typeof rd === 'function') window.render = function (...a) {
    const r = rd.apply(this, a);
    for (const k of Object.keys(kMasterSig)) delete kMasterSig[k];
    if (S.albumType === 'kinder' && S.kPersonal) {
      // 사본은 render 끝에 복사되므로, 원아 앨범마다 따로 고친 틀(번호표에 ~)은 복사한 뒤 다시 입힘
      if (Object.keys(S.frameEdits?.over || {}).some(id => id.includes('~')) || (S.frameEdits?.extra || []).some(x => x.pid?.includes('~'))) { applyFrames(); applyTextFrames(); }
      const mp = kMasterPids(), edited = id => mp.includes(id.slice(0, id.indexOf("|")));     // 마스터 쪽에 고친 틀 · 글자가 있으면 그 모양대로 사본을 다시 복사
      const force = Object.keys(S.frameEdits?.over || {}).some(edited) || Object.keys(S.frameEdits?.text || {}).some(edited) || (S.frameEdits?.extra || []).some(x => mp.includes(x.pid)) || (S.frameEdits?.xtext || []).some(x => mp.includes(x.pid));
      if (force) { applyFrames(); applyTextFrames(); }      // 마스터 쪽 고친 모양을 먼저 입힌 뒤 복사
      kRefreshCopies(force);
    }
    return r;
  };
});
// 원본 앨범에서 글자를 고치면 나머지 개인 앨범에도 바로 반영
document.getElementById('pages')?.addEventListener('input', e => {
  if (!S.kPersonal) return;
  const el = e.target.closest?.('[data-key]'), page = el?.closest('.page');
  if (!el || !page || page.dataset.pid.includes('~')) return;
  document.querySelectorAll(`#pages .page[data-pid^="${CSS.escape(page.dataset.pid)}~"] [data-key="${CSS.escape(el.dataset.key)}"]`).forEach(c => { c.innerHTML = el.innerHTML; });
});

/* ---------- 행사 사진 → 7~14쪽 사진틀에 번호순으로 ----------
   폴더 · 파일 이름의 번호순(01, 02 … 10)으로 정렬해 7쪽 첫 틀부터 14쪽 마지막 틀까지 차례로 채움 */
const K_EVENT_SLOTS = ['ks-b0', 'ks-b1', 'ks-b2', 'ks-b3', 'ku-0', 'ku-1', 'ku-2', 'ku-3', 'ku-4', 'ku-5', 'ku-6', 'ka-0', 'ka-1', 'ka-2', 'ka-3', 'ka-4', 'ka-5', 'ka-6', 'kw-0', 'kw-1', 'kw-2', 'kw-3', 'kw-4', 'kw-5', 'kw-6', 'kw-7'];
/** 7~14쪽 사진 키 목록. 개인 앨범이면 원아마다 따로 (name 없으면 공통) */
const kEventSlotList = () => (S.kTemplate === 'dosan' ? DOSAN_EVENT_KEYS : S.kTemplate === 'cute' && window.CUTE_EVENT_SLOTS ? CUTE_EVENT_SLOTS : S.kTemplate === 'simple' && window.SM_EVENT_SLOTS ? SM_EVENT_SLOTS : K_EVENT_SLOTS);
const kEventKeys = name => kEventSlotList().map(k => (name ? kpKey(`ev-${k}`, name) : k));
/** replace: 7~14쪽에 있던 사진을 비우고 처음부터 / 아니면 빈 틀에만 이어서.
    개인 앨범이면 폴더 · 파일 이름의 원아 이름(예: '01 김다정/김다정 (1).jpg')으로 그 원아 앨범에 넣음 */
async function kEventFill(fileList, info, replace) {
  const path = x => x.webkitRelativePath || x.name;
  const files = [...fileList].filter(x => x.type.startsWith('image/')).sort((a, b) => path(a).localeCompare(path(b), 'ko', { numeric: true }));
  if (!files.length) { info.textContent = '사진이 없습니다.'; return; }
  const groups = new Map(), noName = [];
  if (S.kPersonal) {
    const kids = kClasses().flatMap(c => c.students);
    for (const file of files) {
      const p = path(file), kid = kFindKid(p, kids) || p.split('/').slice(0, -1).reverse().map(d => kFindKid(d, kids)).find(Boolean);
      if (!kid) { noName.push(file); continue; }
      if (!groups.has(kid.name)) groups.set(kid.name, []);
      groups.get(kid.name).push(file);
    }
  } else groups.set('', files);
  if (!groups.size) { info.textContent = `개인 앨범에서는 폴더나 파일 이름에 원아 이름이 있어야 합니다(예: '01 김다정' 폴더). 이름을 찾지 못한 사진 ${noName.length}장은 넣지 않았습니다.`; return; }
  const oldN = [...groups.keys()].reduce((n, name) => n + kEventKeys(name).filter(k => photos[k]).length, 0);
  if (replace && oldN && !confirm(`7~14쪽에 있는 행사 사진 ${oldN}장을 비우고 새 사진을 번호순으로 넣을까요?`)) return;
  const done = [];
  let over = 0;
  for (const [name, list] of groups) {
    const keys = kEventKeys(name);
    if (replace) for (const k of keys) if (photos[k]) await removePhoto(k);
    const free = keys.filter(k => !photos[k]), n = Math.min(free.length, list.length);
    for (let i = 0; i < n; i++) { info.textContent = `${name ? `${name} ` : ''}행사 사진 넣는 중 ${i + 1}/${n}…`; await setPhoto(free[i], list[i]); }
    over += list.length - n;
    done.push(`${name ? `${name} ` : ''}${n}장`);
  }
  info.textContent = `${S.kTemplate === "dosan" ? "7~12쪽" : S.kTemplate === "simple" ? "9~16쪽" : "7~14쪽"}에 번호순으로 넣었습니다: ${done.join(' · ')}.` +
    (over ? ` 사진틀이 모자라 ${over}장은 넣지 못했습니다(틀 ${kEventSlotList().length}개).` : '') +
    (noName.length ? ` 원아 이름을 찾지 못한 사진 ${noName.length}장은 넣지 않았습니다.` : '');
}
// 유치원앨범에서는 '행사 사진' 단추가 7~14쪽 채우기로 동작 (전체 불러오기는 새로, 하나 추가 · 한꺼번에 넣기는 이어서)
for (const [id, replace] of [['f-gal-dir', true], ['f-gal-add', false], ['f-bulk-g', false]]) {
  document.getElementById(id)?.addEventListener('change', async e => {
    if (S.albumType !== 'kinder') return;
    e.stopImmediatePropagation();
    const input = e.target;
    await kEventFill(input.files, document.getElementById('g-info'), replace);
    input.value = '';
  });
}

/* ---------- 유치원 사진 폴더 한 번에: 폴더 · 파일 이름을 보고 자리를 정함 ----------
   표지 폴더 단체사진 → 2쪽 · 학사모(크게) → 3쪽 · 학사모 작게 → 원아 사진 쪽 · 프로필 → 4쪽 (파일 이름 속 원아 이름으로 짝지음)
   단체 → 반 단체사진 · 나머지(행사) → 7~14쪽 번호순. 표지 폴더의 교표 · 드론 사진 등은 넣지 않음 */
function kFindKid(path, kids) {
  const base = path.split('/').pop();
  let best = null;
  for (const k of kids) if (k.name && base.includes(k.name) && (!best || k.name.length > best.name.length)) best = k;     // 긴 이름 먼저 (하나 ↔ 황하나)
  return best;
}
async function kFolderImport(fileList, info) {
  const files = [...fileList].filter(x => x.type.startsWith('image/'));
  if (!files.length) { info.textContent = '선택한 폴더에 사진이 없습니다.'; return; }
  const classes = kClasses(), kids = classes.flatMap((c, ci) => c.students.map(s => ({ name: s.name, key: `c${ci}-s${s.idx}`, ci })));
  const path = x => x.webkitRelativePath || x.name;
  const byPath = (a, b) => path(a).localeCompare(path(b), 'ko', { numeric: true });
  const big = {}, small = {}, prof = {}, groups = [], events = [], skipped = [], noName = [];
  let cover = null, teacher = null;
  const tName = S.homeTeacher || classes[0]?.teacher || '';
  for (const file of files.sort(byPath)) {
    const p = path(file), dir = p.split('/').slice(0, -1).join('/');
    const kid = kFindKid(p, kids), cap = /학사모/.test(p), pro = /프로필/.test(p);
    const base = p.split('/').pop();
    if (!kid && !/단체/.test(base) && ((tName && base.includes(tName)) || /선생님|담임/.test(base))) { teacher ||= file; continue; }     // 담임 선생님 사진 → 5쪽
    if (kid && (cap || pro)) {          // '학사모작게 반단체사진' 폴더처럼 섞여 있어도 원아 이름이 있으면 개인 사진
      const slot = pro ? prof : /작게|작은/.test(dir) ? small : big;
      slot[kid.name] ||= file;
      continue;
    }
    if (/표지/.test(dir) && /단체/.test(p.split('/').pop()) && !cover) { cover = file; continue; }     // 표지 폴더의 단체사진 → 2쪽
    if (/단체/.test(p.split('/').pop()) || (/단체/.test(dir) && !cap && !pro)) { groups.push(file); continue; }
    if (/표지/.test(dir)) { skipped.push(file); continue; }
    if (cap || pro) { noName.push(file); continue; }
    events.push(file);
  }
  const jobs = [];
  for (const kid of kids) {
    const b = big[kid.name] || small[kid.name], s = small[kid.name] || big[kid.name];
    if (b) { jobs.push([kpKey('cap', kid.name), b]); jobs.push([kpKey('cover', kid.name), b]); }     // 학사모(학사복) → 2쪽 · 3쪽
    if (s) jobs.push([kid.key, s]);     // 원아 사진 쪽은 작은 학사모
    if (prof[kid.name]) jobs.push([kpKey('prof', kid.name), prof[kid.name]]);
  }
  const g = groups.slice(0, 4);     // 단체 01 → 5쪽 아래 · 02 → 6쪽 아래 · 03 · 04 → 5쪽 위
  g.forEach((file, i) => jobs.push([`c0-g${i}`, file]));
  if (teacher) jobs.push(['c0-tch', teacher]);
  if (cover) jobs.push(['k-cover', cover]);
  const personal = jobs.some(([k]) => k.startsWith('kp-'));
  if (personal && !S.kPersonal) { S.kPersonal = true; const cb = document.getElementById('l-kpersonal'); if (cb) cb.checked = true; }
  saveState(); render();
  for (let i = 0; i < jobs.length; i++) { info.textContent = `원아 · 단체 사진 넣는 중 ${i + 1}/${jobs.length}…`; await setPhoto(jobs[i][0], jobs[i][1]); }
  const evInfo = { textContent: '' };
  if (events.length) await kEventFill(events, evInfo, true);
  const missing = kids.filter(k => !big[k.name] && !small[k.name] && !prof[k.name]).map(k => k.name);
  info.textContent = [
    `원아 ${kids.length - missing.length}명의 학사모 · 프로필 사진을 넣었습니다.`,
    g.length ? `단체사진 ${g.length}장${groups.length > 4 ? `(${groups.length}장 중 앞 4장)` : ''}.` : '',
    evInfo.textContent ? `행사: ${evInfo.textContent}` : '',
    missing.length ? `사진을 찾지 못한 원아: ${missing.join(', ')}.` : '',
    (() => { const n = kids.filter(k => !missing.includes(k.name) && !prof[k.name]).map(k => k.name); return n.length ? `프로필 사진이 없는 원아: ${n.join(', ')}.` : ''; })(),
    noName.length ? `파일 이름에서 원아 이름을 못 찾은 사진 ${noName.length}장은 넣지 않았습니다.` : '',
    skipped.length ? `표지 폴더 사진 ${skipped.length}장은 넣지 않았습니다.` : '',
  ].filter(Boolean).join(' ');
}
document.getElementById('p-dir')?.addEventListener('change', async e => {
  if (S.albumType !== 'kinder') return;      // 학교 앨범은 예전처럼 새 앨범 만들기
  e.stopImmediatePropagation();
  const input = e.target;
  await kFolderImport(input.files, document.getElementById('p-info'));
  input.value = '';
});

/* ---------- 쪽 아래 작은 원아 이름 · 쪽 번호: 3쪽이 1쪽. 왼쪽 쪽은 왼쪽 아래, 오른쪽 쪽은 오른쪽 아래 ----------
   개인 앨범이면 각 앨범의 원아 이름 (복사본은 kPersonalCopies에서 이름만 바꿈) */
const K_FOLIO_FROM = 2;      // 0부터 세어 세 번째 쪽(3쪽)부터
function kFolios() {
  const name = S.kPersonal ? kClasses().flatMap(c => c.students)[0]?.name || '' : '';
  const pages = [...document.querySelectorAll('#pages > .spread .page')].filter(p => !p.dataset.pid.includes('~'));
  pages.forEach((p, i) => {
    if (i < K_FOLIO_FROM) return;
    const left = (i % 2 === 1) !== !!G.kPairFirst, no = i - K_FOLIO_FROM + 1;
    const nm = `<span class="k-folio-name">${esc(name)}</span>`, num = `<span class="k-folio-no">${no}</span>`;
    p.querySelector('.trim')?.insertAdjacentHTML('beforeend', `<div class="k-folio ${left ? 'is-left' : 'is-right'}" contenteditable="false">${left ? num + nm : nm + num}</div>`);
  });
}
// 판 구성: 지금 유치원앨범의 템플릿 바꾸기 (사진 · 글자는 그대로, 쪽 구성만 바뀜)
addEventListener('DOMContentLoaded', () => {      // album.js(S)가 읽힌 뒤에
  const sel = document.getElementById('l-ktpl');
  if (!sel) return;
  sel.innerHTML = K_TEMPLATE_OPTS;
  sel.value = S.kTemplate || 'basic';
  sel.addEventListener('change', () => {
    if (S.albumType !== 'kinder') { sel.value = 'basic'; return; }
    S.kTemplate = sel.value;
    if (S.kTemplate === 'dosan') { S.size = 'in1011'; const fs = document.getElementById('f-size'); if (fs) fs.value = 'in1011'; }
    saveState();
    render();
  });
});
