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
function kinderBg(kind, tone, seed) {
  const { W, H } = G, rng = rngOf(seed), idx = Math.round((seed - 1009) / 97), left = idx % 2 === 1;
  const X = v => (left ? v : 1 - v) * W, Y = v => v * H, R = v => v * W, sw = Math.max(1.6, W / 800);
  let s = '', paper = '#FBF8F1';
  switch (kind) {
    case 'k-cover':
      paper = '#FFFFFF';
      s += `<defs><radialGradient id="kcv" cx=".75" cy=".6" r=".8"><stop offset="0" stop-color="#FBE6EA"/><stop offset=".6" stop-color="#FDF3F2"/><stop offset="1" stop-color="#FFFFFF"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#kcv)"/>`;
      for (let i = 0; i < 26; i++) s += `<circle cx="${f(W * (.3 + rng() * .7))}" cy="${f(H * rng())}" r="${f(R(.004 + rng() * .01))}" fill="#FFFFFF" fill-opacity="${f(.5 + rng() * .5)}"/>`;
      s += kConfetti(W * .05, H * .02, W * .98, H * .14, 26, rng) + kPopper(W * .08, H * .16, R(.13));
      break;
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

/* ---------- 쪽 구성 ---------- */
function kinderPages(classes) {
  kinderStyle();
  const kp = (kind, label, html) => layPage(kind, label, [kind, ['butter', 'peach', 'sage']], html, { run: false, folio: false });
  const pages = [];
  const year = esc(S.year), school = esc(S.school);
  // 1쪽 표지
  pages.push(kp('k-cover', '표지', `
    ${LT([8, 6.5, 92, 14], E('k-cover-title', `${S.year} 소중한 추억들`, 'k-cover-title'), 'lcenter')}
    ${LF('k-cover', [16, 16, 84, 78], 'k-torn')}
    ${LT([6, 79, 38, 96], `<svg viewBox="0 0 100 70" class="k-emb k-emb-s">${kCapLaurel(50, 34, 26, '#2F4A5C')}${kFlower(30, 52, 5, KC.pink)}${kFlower(70, 52, 5, KC.yellow)}</svg><div class="k-emb-y">${year} 학년도</div>`, 'lcenter')}
    ${LT([38, 82, 94, 90], `<div class="k-cover-school">${school}</div>`, 'lcenter')}`));
  // 2~3쪽 펼침 소개
  pages.push(kp('k-intro', '소개 (왼쪽)', `
    ${LT([4, 13, 33, 20], E('k-en', 'KINDERGARTEN', 'k-en'), 'lcenter')}
    ${LT([6, 24, 31, 37], `<svg viewBox="0 0 100 70" class="k-emb">${kCapLaurel(50, 36, 28)}</svg>`, 'lcenter')}
    ${LT([3, 39, 34, 52], `<div class="k-year">${year}학년도</div><div class="k-name">${school}</div><div class="k-rule"></div>`, 'lcenter')}
    ${LT([4, 58, 34, 70, -10], `${E('k-intro-script', 'Always\nbe happy', 'k-script')}<div class="k-heart-big">♡</div>`, 'lcenter')}
    ${LF('ki-0', [37, 8, 94, 92], 'k-sk', '', '', kSketchLine() + kOrn('vine', ['tl', 'tr', 'bl', 'br'], 9))}`));
  pages.push(kp('k-intro', '소개 (오른쪽)', `
    ${LF('ki-1', [6, 8, 63, 92], 'k-sk', '', '', kSketchLine() + kOrn('vine', ['tl', 'tr', 'bl', 'br'], 9))}
    ${LT([66, 24, 96, 38], E('k-intro-1', '꿈을 향해\n한 걸음 더', 'k-pen-big'), 'lcenter')}
    ${LT([68, 40, 94, 42], '<div class="k-rule"></div>', 'lcenter')}
    ${LT([66, 44, 96, 60], E('k-intro-2', '지금 이 순간,\n너희는\n참 예쁘다.', 'k-msg'), 'lcenter')}
    ${LT([66, 63, 96, 69], E('k-en', 'KINDERGARTEN', 'k-en'), 'lcenter')}`));
  // 반마다: 왼쪽 단체사진 두 장, 오른쪽 원아 사진 (한 쪽에 최대 25명)
  classes.forEach((c, ci) => {
    const name = esc(c.name);
    pages.push(kp('k-class', `${c.name} 단체`, `
      ${LT([10, 6, 56, 18.5], `<div class="k-year-s">${year}학년도</div><div class="k-class-name">${school} ${name}</div><div class="k-en k-en-s">${E(`k-class-en-${ci}`, 'GRADUATION ALBUM', '')}</div>`)}
      ${LT([62, 5, 92, 17, -6], E(`k-class-pen-${ci}`, '행복한 꿈을\n함께 키워가는\n우리 ♥', 'k-pen'), 'lcenter')}
      ${LF(`c${ci}-g0`, [8, 22, 92, 56.5], 'k-ticket')}
      ${LF(`c${ci}-g1`, [8, 59.5, 92, 94], 'k-ticket')}`));
    const kids = c.students.map((s, i) => ({ s, i }));
    for (let p = 0; p < Math.max(1, Math.ceil(kids.length / 25)); p++) {
      const chunk = kids.slice(p * 25, p * 25 + 25), rows = Math.max(1, Math.ceil(chunk.length / 5));
      const gx = 2.6, nameH = 3.2, gy = 1.6, top = 14.5, avail = 86 - top;
      const cw = Math.min(14.6, (avail / rows - nameH - gy) * G.aspect), ch = cw / G.aspect, x0 = 50 - (cw * 5 + gx * 4) / 2;
      let grid = '';
      chunk.forEach(({ s, i }, n) => {
        const col = n % 5, row = Math.floor(n / 5), x = x0 + col * (cw + gx), y = top + row * (ch + nameH + gy);
        grid += LF(`c${ci}-s${i}`, [x, y, x + cw, y + ch], 'k-round k-sq') + LT([x - 1, y + ch + .4, x + cw + 1, y + ch + nameH], `<div class="k-sname">${esc(s.name)}</div>`, 'lcenter');
      });
      pages.push(kp('k-class', `${c.name} 원아${p ? ` ${p + 1}` : ''}`, `
        ${LT([8, 6.5, 50, 10.5], '<div class="k-en k-en-l">A Graduation Album</div>')}
        ${LT([56, 5.5, 92, 11], E(`k-class-cong-${ci}`, '진심으로 축하해요 ♥', 'k-pen'), 'lright')}
        ${grid}
        ${LT([52, 89, 92, 93], '<div class="k-en k-thanks">THANK YOU</div>', 'lcenter')}`));
    }
  });
  // 봄 — 꽃 이름표
  pages.push(kp('k-spring', '봄 · 꽃 이름표 (왼쪽)', `
    ${LF('ks-a0', [8, 10, 46, 40], 'k-round k-l-beige', '', '', kOrn('gyp', ['bl'], 12))}
    ${kTag([12, 37, 36, 42.5, -4], 'k-tag-0', '벚꽃처럼 예쁜 우리', 'sage')}
    ${LF('ks-a1', [53, 11, 92, 41], 'k-round k-l-slate', '', '', kOrn('forsythia', ['tr', 'bl'], 13))}
    ${kTag([68, 37, 92, 43, -8], 'k-tag-1', '개나리처럼 밝은 우리', 'tan')}
    ${LF('ks-a2', kCircle(28, 67, 38), 'k-ci k-l-beige', '', '', kOrn('tulip', ['bl'], 14))}
    ${kTag([25, 79, 49, 85, -5], 'k-tag-2', '튤립처럼 사랑스러운 우리', 'beige')}
    ${LF('ks-a3', [55, 52, 91, 82], 'k-round k-l-slate', '', '', kTape() + kOrn('sprig', ['br'], 12))}
    ${kTag([56, 78, 76, 84, -3], 'k-tag-3', '들꽃처럼 소중한 우리', 'gray')}`));
  pages.push(kp('k-spring', '봄 · 꽃 이름표 (오른쪽)', `
    ${LF('ks-a4', [5, 12, 46, 42], 'k-blob', '', '', kOutline('blob', '#A9B8A0', false) + kOrn('daisy', ['tl', 'br'], 13))}
    ${kTag([24, 38, 44, 44, -6], 'k-tag-4', '데이지처럼 밝은 우리', 'sage')}
    ${LF('ks-a5', [53, 11, 95, 44], 'k-ci k-oval k-l-beige', '', '', kOrn('tulip', ['tr'], 12))}
    ${kTag([75, 39, 96, 45, -10], 'k-tag-5', '꽃처럼 예쁜 우리', 'peach')}
    ${LF('ks-a6', [7, 52, 48, 83], 'k-cloud', '', '', kOutline('cloud', '#CDBBA8', false) + kOrn('sprig', ['tl', 'br'], 12))}
    ${kTag([22, 79, 46, 85, -6], 'k-tag-6', '꽃향기처럼 사랑스러운 우리', 'peach')}
    ${LF('ks-a7', [56, 52, 93, 82], 'k-round k-l-sage', '', '', kTape('rgba(196,204,198,.8)'))}
    ${kTag([73, 77, 95, 83, -10], 'k-tag-7', '봄처럼 행복한 우리', 'yellow')}
    ${LT([22, 86, 62, 92, -4], E('k-spring-script', 'Spring is here', 'k-script k-script-s'), 'lcenter')}`));
  // 봄 — 동물 친구
  pages.push(kp('k-meadow', '봄 · 동물 친구 (왼쪽)', `
    ${LF('ks-b0', [6, 12, 39, 61], 'k-sk', '', '', kSketchLine('#7C7066') + kOrn('blossom', ['tl'], 13) + kOrn('tulip', ['bl', 'br'], 12))}
    ${LF('ks-b1', [45, 14, 92, 46], 'k-sk', '', '', kSketchLine('#7C7066') + kOrn('blossom', ['tr', 'bl'], 11))}
    ${LF('ks-b2', [45, 50, 92, 82], 'k-sk', '', '', kSketchLine('#7C7066') + kOrn('blossom', ['tr'], 11) + kOrn('tulip', ['br'], 11))}`));
  pages.push(kp('k-meadow', '봄 · 동물 친구 (오른쪽)', `
    ${LF('ks-b3', [6, 13, 91, 73], 'k-sk', '', '', kSketchLine('#7C7066') + kOrn('blossom', ['tr', 'bl'], 15))}`));
  // 여름
  pages.push(kp('k-summer', '여름 (왼쪽)', `
    ${LF('ku-0', [14, 9, 90, 47], 'k-sk', '', '', kSketchLine('#6C8A8A') + kOrn('tropic', ['tl', 'tr', 'bl', 'br'], 13))}
    ${LF('ku-1', [8, 55, 54, 83], 'k-sk', '', '', kSketchLine('#6C8A8A') + kOrn('wreath', ['tl', 'tr'], 10))}
    ${LF('ku-2', kCircle(76, 70, 32), 'k-ci k-l-white', '', '', kOrn('wreath', ['tl', 'br'], 10))}`));
  pages.push(kp('k-summer', '여름 (오른쪽)', `
    ${LF('ku-3', kCircle(28, 25, 36), 'k-ci k-l-white', '', '', kOrn('wreath', ['tl', 'br'], 11))}
    ${LF('ku-4', kCircle(72, 28, 36), 'k-ci k-l-white', '', '', kOrn('wreath', ['tr', 'bl'], 11))}
    ${LF('ku-5', [9, 46, 58, 88], 'k-sk', '', '', kSketchLine('#6C8A8A') + kOrn('wreath', ['tl', 'tr'], 10))}
    ${LF('ku-6', [63, 54, 92, 80], 'k-sk', '', '', kSketchLine('#6C8A8A') + kOrn('wreath', ['tr'], 9))}`));
  // 가을
  pages.push(kp('k-autumn', '가을 (왼쪽)', `
    ${LF('ka-0', [6, 8, 90, 44], 'k-sk', '', '', kSketchLine('#8A7262') + kOrn('leaf', ['tl', 'br'], 12))}
    ${LF('ka-1', [6, 48, 46, 82], 'k-sk', '', '', kSketchLine('#8A7262'))}
    ${LF('ka-2', [51, 48, 90, 82], 'k-sk', '', '', kSketchLine('#8A7262') + kOrn('leaf', ['tr', 'bl'], 11))}`));
  pages.push(kp('k-autumn', '가을 (오른쪽)', `
    ${LF('ka-3', [8, 8, 43, 46], 'k-sk', '', '', kSketchLine('#8A7262') + kOrn('leaf', ['tl', 'br'], 11))}
    ${LF('ka-4', [8, 50, 43, 88], 'k-sk', '', '', kSketchLine('#8A7262') + kOrn('leaf', ['tr', 'bl'], 10))}
    ${LF('ka-5', [50, 27, 92, 61], 'k-sk', '', '', kSketchLine('#8A7262') + kOrn('leaf', ['tr', 'br'], 11))}
    ${LF('ka-6', [50, 65, 92, 82], 'k-sk', '', '', kSketchLine('#8A7262') + kOrn('leaf', ['tr'], 10))}`));
  // 겨울
  pages.push(kp('k-winter', '겨울 (왼쪽)', `
    ${LF('kw-0', [12, 11, 80, 47], 'k-round k-l-ice', '', '', kOrn('snow', ['tl', 'tr', 'br'], 12))}
    ${LF('kw-1', [14, 54, 52, 80], 'k-round k-l-ice', '', '', kTape('rgba(200,200,200,.75)', 35) + kOrn('snow', ['br'], 10))}
    ${LF('kw-2', kCircle(72, 65, 30), 'k-ci k-l-ice')}`));
  pages.push(kp('k-winter', '겨울 (오른쪽)', `
    ${LF('kw-3', [6, 10, 42, 34], 'k-round k-l-ice', '', '', kTape('rgba(200,200,200,.75)', 45) + kOrn('snow', ['br'], 10))}
    ${LF('kw-4', kCircle(70, 22, 30), 'k-ci k-l-ice', '', '', kTape('rgba(200,200,200,.75)', 40, 0))}
    ${LF('kw-5', [10, 38, 84, 60], 'k-round k-l-ice', '', '', kOrn('snow', ['tr', 'bl'], 11))}
    ${LF('kw-6', [6, 65, 50, 90], 'k-cloud', '', '', kOutline('cloud', '#C4D2E0'))}
    ${LF('kw-7', [57, 63, 89, 87], 'k-round k-l-ice', '', '', kTape('rgba(200,200,200,.75)', 50, 1) + kOrn('snow', ['br'], 11))}`));
  // 마지막 쪽
  pages.push(kp('k-end', '마지막 쪽', `
    ${LT([10, 9, 90, 17], E('k-end-title', '졸업을 축하해요!', 'k-cover-title k-end-title'), 'lcenter')}
    ${LF('k-end', [9, 20, 91, 68], 'k-round k-l-beige', '', '', kOrn('blossom', ['tl', 'br'], 14))}
    ${LT([12, 72, 88, 86], E('k-end-msg', '함께 웃고, 함께 자란 소중한 시간\n언제나 너희를 응원할게!', 'k-msg'), 'lcenter')}
    ${LT([12, 87, 70, 91], `<div class="k-en">${school}</div>`, 'lcenter')}`));
  return pages;
}

/* ---------- 메뉴: 유치원앨범 만들기 ---------- */
function kinderAlbumDialog() {
  const sizeOpts = KINDER_SIZES.map(k => `<option value="${k}">${esc(SIZES[k].name)}</option>`).join('');
  showPrj('유치원앨범 만들기', `
    <div class="pd-grid prj-grid">
      <span>유치원 이름:</span><input type="text" id="ka-school" placeholder="예: ○○유치원">
      <span>학년도:</span><input type="text" id="ka-year" value="${esc(S.year)}">
      <span>판형:</span><select id="ka-size">${sizeOpts}</select>
      <span>반 이름:</span><input type="text" id="ka-class" placeholder="예: 햇살반">
      <span>담임 선생님:</span><input type="text" id="ka-teacher">
      <span>원아 이름:</span><textarea id="ka-kids" rows="6" placeholder="한 줄에 한 명씩&#10;반이 여러 개면 '# 반 이름' 줄로 나눔"></textarea>
    </div>
    <p class="pd-note">표지 · 소개 · 반 단체/원아 사진 · 봄 · 여름 · 가을 · 겨울 · 마지막 쪽이 만들어집니다. 지금 앨범은 그대로 남습니다.</p>
    <div id="ka-msg" class="prj-msg"></div>`, [
    { text: '만들기', main: true, on: () => {
      const school = $('#ka-school').value.trim();
      if (!school) { $('#ka-msg').textContent = '유치원 이름을 입력하세요.'; return; }
      const kids = $('#ka-kids').value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      const cls = $('#ka-class').value.trim() || '햇살반', teacher = $('#ka-teacher').value.trim();
      const roster = kids[0]?.startsWith('#') ? kids.join('\n') : [`# ${cls}${teacher ? ` | ${teacher}` : ''}`, ...kids].join('\n');
      flushState();
      const id = createAlbum({ ...DEFAULTS, albumType: 'kinder', theme: 'classic', size: $('#ka-size').value, school, year: $('#ka-year').value.trim(), nth: '', principal: '', vice: '', teachers: '', roster, pad4: false, zoom: S.zoom });
      switchAlbum(id);
    } },
    { text: '취소', on: closePrj },
  ]);
}
document.getElementById('p-kinder')?.addEventListener('click', kinderAlbumDialog);
