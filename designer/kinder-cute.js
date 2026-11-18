/* ============================================================
   유치원 템플릿 「귀여운 유치원 (사계절 캐릭터)」
   크림색 바탕 · 파스텔 점선 사진틀(구름 · 물결 원 · 테이프 사각 · 타원) · 곰 · 해 · 무지개 · 계절 캐릭터.
   쪽 순서: 백지 · 소중한 추억들 · 선생님 명렬(10칸 + 단체 02) · 원아 · 소개 펼침 · 봄 · 여름 · 가을 · 겨울 (14쪽).
   사진 키도 기본 템플릿과 같아서 템플릿을 바꿔도 사진이 따라감 (봄 · 가을은 틀이 하나씩 더 있어 ks-b4~7 · ka-7을 새로 씀).
   배경 · 캐릭터는 모두 SVG로 직접 그려 인쇄해도 선명함. 앨범 설정 kTemplate: 'cute'
   ============================================================ */
const CUTE_EVENT_SLOTS = ['ks-b0', 'ks-b1', 'ks-b2', 'ks-b3', 'ks-b4', 'ks-b5', 'ks-b6', 'ks-b7', 'ku-0', 'ku-1', 'ku-2', 'ku-3', 'ku-4', 'ku-5', 'ku-6', 'ka-0', 'ka-1', 'ka-2', 'ka-3', 'ka-4', 'ka-5', 'ka-6', 'ka-7', 'kw-0', 'kw-1', 'kw-2', 'kw-3', 'kw-4', 'kw-5', 'kw-6', 'kw-7'];
window.CUTE_EVENT_SLOTS = CUTE_EVENT_SLOTS;      // kinder.js에서 행사 사진 넣을 자리 목록으로 씀
const CU = { pink: '#F2A7B5', yellow: '#F2CF78', green: '#A6CC95', blue: '#9CC3E6', purple: '#C4B2E2', orange: '#F0AE86', beige: '#E3CBAE', grey: '#C9C6C2', coral: '#F28B6E', ink: '#5E4B3C', cream: '#FCF8EE' };
const CU_RAINBOW = ['#F28B82', '#F6B26B', '#8CC37A', '#6FA8DC', '#F2C14E', '#C49BDE'];

/* ---------- 사진틀 모양 (0~100 좌표) ---------- */
function cuPts(type) {
  const p = [], N = 180;
  for (let i = 0; i < N; i++) {
    const t = i / N * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
    if (type === 'cloud') { const k = .8 + .2 * Math.pow(Math.abs(Math.sin(4.5 * t + .35)), .55); p.push([50 + 50 * k * c, 50 + 50 * k * s]); continue; }
    if (type === 'scallop') { const k = .935 + .065 * Math.pow(Math.abs(Math.sin(14 * t)), .5); p.push([50 + 50 * k * c, 50 + 50 * k * s]); continue; }
    const n = type === 'blob' ? 5 : 3.2, m = type === 'blob' ? 1 + .022 * Math.sin(5 * t + 1) + .014 * Math.sin(9 * t + 2) : 1 + .03 * Math.sin(4 * t + .5) + .02 * Math.sin(7 * t);
    const sx = Math.sign(c) * Math.pow(Math.abs(c), 2 / n), sy = Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
    p.push([50 + 48.5 * sx * m, 50 + 48.5 * sy * m]);
  }
  return p;
}
const cuD = (type, k = 1) => `M${cuPts(type).map(([x, y]) => `${f(50 + (x - 50) * k)},${f(50 + (y - 50) * k)}`).join('L')}Z`;
function cuStyle() {
  if (document.getElementById('cute-shapes')) return;
  const st = document.createElement('style');
  st.id = 'cute-shapes';
  st.textContent = ['cloud', 'scallop', 'blob', 'wave'].map(t => `.lf.cu-${t} .photo{clip-path:polygon(${cuPts(t).map(([x, y]) => `${f(x)}% ${f(y)}%`).join(',')})}`).join('');
  document.head.appendChild(st);
}
const cuLine = (type, col) => `<svg class="cu-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="cu-fill" d="${cuD(type)}"/><path class="cu-solid" d="${cuD(type)}" style="stroke:${col}"/><path class="cu-dash" d="${cuD(type, .925)}" style="stroke:${col}"/></svg>`;
const cuGingham = c => `repeating-linear-gradient(0deg,rgba(255,255,255,.5) 0 .55cqw,transparent .55cqw 1.1cqw),repeating-linear-gradient(90deg,rgba(255,255,255,.5) 0 .55cqw,transparent .55cqw 1.1cqw),${c}`;
const cuPin = (at = 50) => `<i class="cu-pin" style="left:calc(${at}% - 1.3cqw)"></i>`;
/** 사진틀: shape = box(둥근 사각) · circ(원 · 타원) · note(흰 메모지) · cloud · scallop · blob · wave */
function cuLF(key, box, shape, col, extra = '') {
  const sh = ['cloud', 'scallop', 'blob', 'wave'].includes(shape);
  return LF(key, box, sh ? `cu-sh cu-${shape}` : `cu-${shape}`, '', '', (sh ? cuLine(shape, col) : '') + extra).replace(' style="', ` style="--cu:${col};`);
}

/* ---------- 작은 그림 (배경 좌표) ---------- */
const cuHeart = (x, y, r, c) => `<path d="M${f(x)},${f(y + r * .9)} C${f(x - r * 1.4)},${f(y - r * .1)} ${f(x - r * .7)},${f(y - r * 1.1)} ${f(x)},${f(y - r * .35)} C${f(x + r * .7)},${f(y - r * 1.1)} ${f(x + r * 1.4)},${f(y - r * .1)} ${f(x)},${f(y + r * .9)}Z" fill="${c}"/>`;
const cuFace = (x, y, s, dk = '#4A3426') => `<circle cx="${f(x - s * .32)}" cy="${f(y - s * .05)}" r="${f(s * .07)}" fill="${dk}"/><circle cx="${f(x + s * .32)}" cy="${f(y - s * .05)}" r="${f(s * .07)}" fill="${dk}"/><path d="M${f(x - s * .14)},${f(y + s * .16)} Q${f(x)},${f(y + s * .3)} ${f(x + s * .14)},${f(y + s * .16)}" stroke="${dk}" stroke-width="${f(s * .05)}" fill="none" stroke-linecap="round"/><ellipse cx="${f(x - s * .55)}" cy="${f(y + s * .18)}" rx="${f(s * .14)}" ry="${f(s * .08)}" fill="#F4A3A0" fill-opacity=".7"/><ellipse cx="${f(x + s * .55)}" cy="${f(y + s * .18)}" rx="${f(s * .14)}" ry="${f(s * .08)}" fill="#F4A3A0" fill-opacity=".7"/>`;
const cuSun = (x, y, r) => kSun(x, y, r) + cuFace(x, y, r * .9, '#7A5230');
function cuRainbow(x, y, r) {
  let s = '';
  ['#F5B3BF', '#F8D884', '#BCDCA4', '#AFD2EE'].forEach((c, i) => { const R = r * (1 - i * .16); s += `<path d="M${f(x - R)},${f(y)} A${f(R)},${f(R)} 0 0 1 ${f(x + R)},${f(y)}" stroke="${c}" stroke-width="${f(r * .16)}" fill="none"/>`; });
  return s + kCloud(x - r * .82, y + r * .05, r * .32, '#FFFFFF', '#A9CDEB') + kCloud(x + r * .82, y + r * .05, r * .32, '#FFFFFF', '#A9CDEB');
}
const cuCloud = (x, y, r) => kCloud(x, y, r, '#FFFFFF', '#A9CDEB');
const cuDaisy = (x, y, r) => kFlower(x, y, r, '#FFFFFF', '#F6C84A', 0, 8);
const cuSprig = (x, y, L, ang, rng, fl) => kVine(x, y, L, ang, CU.green, rng, 4, L * .025, .3, fl);
function cuHills(W, H, top = .88, c1 = '#CFE5B8', c2 = '#B9D9A0') {
  return `<path d="M0,${f(H * top)} Q${f(W * .25)},${f(H * (top - .04))} ${f(W * .5)},${f(H * (top + .01))} T${W},${f(H * (top - .02))} V${H} H0Z" fill="${c1}"/><path d="M0,${f(H * (top + .05))} Q${f(W * .35)},${f(H * (top + .01))} ${f(W * .7)},${f(H * (top + .05))} T${W},${f(H * (top + .03))} V${H} H0Z" fill="${c2}"/>`;
}
function cuHouse(x, y, s) {      // x: 가운데, y: 바닥
  const w = s, h = s * .55;
  let g = `<rect x="${f(x - w)}" y="${f(y - h)}" width="${f(w * 2)}" height="${f(h)}" fill="#FCEFD8" stroke="#E8C9A0" stroke-width="${f(s * .02)}"/>`;
  g += `<path d="M${f(x - w * 1.08)},${f(y - h)} L${f(x - w * .55)},${f(y - h * 1.55)} L${f(x - w * .02)},${f(y - h)}Z M${f(x + w * .02)},${f(y - h)} L${f(x + w * .55)},${f(y - h * 1.55)} L${f(x + w * 1.08)},${f(y - h)}Z" fill="${CU.coral}"/>`;
  g += `<rect x="${f(x - w * .28)}" y="${f(y - h * 1.5)}" width="${f(w * .56)}" height="${f(h * 1.5)}" fill="#FFF6E6" stroke="#E8C9A0" stroke-width="${f(s * .02)}"/><path d="M${f(x - w * .36)},${f(y - h * 1.5)} L${f(x)},${f(y - h * 2)} L${f(x + w * .36)},${f(y - h * 1.5)}Z" fill="#EE7B5E"/>`;
  g += `<circle cx="${f(x)}" cy="${f(y - h * 1.22)}" r="${f(s * .12)}" fill="#FFFFFF" stroke="#B98A5E" stroke-width="${f(s * .025)}"/><path d="M${f(x)},${f(y - h * 1.22)} V${f(y - h * 1.22 - s * .08)} M${f(x)},${f(y - h * 1.22)} H${f(x + s * .06)}" stroke="#7A5230" stroke-width="${f(s * .02)}"/>`;
  g += `<path d="M${f(x)},${f(y - h * 2)} V${f(y - h * 2.45)}" stroke="#7A5230" stroke-width="${f(s * .02)}"/><path d="M${f(x)},${f(y - h * 2.45)} L${f(x + s * .2)},${f(y - h * 2.35)} L${f(x)},${f(y - h * 2.25)}Z" fill="#E8604A"/>`;
  for (const sd of [-1, 1]) for (const k of [.55, .85]) g += `<rect x="${f(x + sd * w * k - s * .09)}" y="${f(y - h * .78)}" width="${f(s * .18)}" height="${f(s * .16)}" fill="#A9D1EE"/><rect x="${f(x + sd * w * k - s * .09)}" y="${f(y - h * .4)}" width="${f(s * .18)}" height="${f(s * .16)}" fill="#A9D1EE"/>`;
  return g + `<path d="M${f(x - s * .12)},${f(y)} V${f(y - h * .45)} Q${f(x)},${f(y - h * .6)} ${f(x + s * .12)},${f(y - h * .45)} V${f(y)}Z" fill="#B47A4E"/>`;
}
const cuTree = (x, y, s, c = '#8FC27A', c2 = '#A9D18E') => `<rect x="${f(x - s * .08)}" y="${f(y - s * .7)}" width="${f(s * .16)}" height="${f(s * .7)}" fill="#A07050"/><circle cx="${f(x)}" cy="${f(y - s * 1.05)}" r="${f(s * .45)}" fill="${c}"/><circle cx="${f(x - s * .3)}" cy="${f(y - s * .8)}" r="${f(s * .32)}" fill="${c2}"/><circle cx="${f(x + s * .3)}" cy="${f(y - s * .82)}" r="${f(s * .32)}" fill="${c}"/>`;
const cuCone = (x, y, s, c) => `<rect x="${f(x - s * .05)}" y="${f(y - s * .4)}" width="${f(s * .1)}" height="${f(s * .4)}" fill="#A07050"/><path d="M${f(x)},${f(y - s * 1.6)} Q${f(x + s * .5)},${f(y - s * .7)} ${f(x + s * .38)},${f(y - s * .35)} H${f(x - s * .38)} Q${f(x - s * .5)},${f(y - s * .7)} ${f(x)},${f(y - s * 1.6)}Z" fill="${c}"/><path d="M${f(x)},${f(y - s * 1.3)} V${f(y - s * .4)}" stroke="#FFFFFF" stroke-opacity=".5" stroke-width="${f(s * .03)}"/>`;
function cuBearHat(x, y, s, flower = true) {
  let g = kBear(x, y, s, '');
  g += `<ellipse cx="${f(x)}" cy="${f(y - s * .55)}" rx="${f(s * 1.25)}" ry="${f(s * .32)}" fill="#F6D27A"/><path d="M${f(x - s * .78)},${f(y - s * .6)} Q${f(x)},${f(y - s * 1.75)} ${f(x + s * .78)},${f(y - s * .6)}Z" fill="#F8DC8E"/><path d="M${f(x - s * .76)},${f(y - s * .72)} Q${f(x)},${f(y - s * .9)} ${f(x + s * .76)},${f(y - s * .72)}" stroke="#E8A9B0" stroke-width="${f(s * .14)}" fill="none"/>`;
  g += `<path d="M${f(x - s * .7)},${f(y + s * 1.1)} Q${f(x)},${f(y + s * 1.9)} ${f(x + s * .7)},${f(y + s * 1.1)} V${f(y + s * 1.9)} H${f(x - s * .7)}Z" fill="#9FD0E8"/><rect x="${f(x + s * .7)}" y="${f(y + s * .8)}" width="${f(s * .5)}" height="${f(s * .8)}" rx="${f(s * .15)}" fill="#F2C35E"/>`;
  if (flower) g += `<path d="M${f(x - s * .45)},${f(y + s * 1.25)} L${f(x - s * .6)},${f(y + s * .55)}" stroke="#6FA56B" stroke-width="${f(s * .08)}"/>` + kFlower(x - s * .62, y + s * .45, s * .3, '#FFFFFF', '#F6C84A', 0, 8);
  return g;
}
const cuBearBouquet = (x, y, s) => kBear(x, y, s, '') + kFlower(x - s * .35, y + s * 1.05, s * .22, '#F6C84A') + kFlower(x + s * .05, y + s * .95, s * .24, '#FFFFFF', '#F6C84A', 0, 8) + kFlower(x + s * .38, y + s * 1.1, s * .2, CU.pink) + kLeaf(x - s * .1, y + s * 1.3, s * .35, 120, CU.green);
function cuBranch(x, y, L, ang, rng, col = KC.pink) {
  const a = ang * KPI, ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L;
  let s = `<path d="M${f(x)},${f(y)} Q${f((x + ex) / 2)},${f((y + ey) / 2 + L * .12)} ${f(ex)},${f(ey)}" stroke="#9A6B4A" stroke-width="${f(L * .045)}" fill="none" stroke-linecap="round"/>`;
  for (let i = 0; i < 9; i++) { const t = .15 + i * .1, px = x + (ex - x) * t + (rng() - .5) * L * .12, py = y + (ey - y) * t + (rng() - .3) * L * .14; s += kFlower(px, py, L * (.05 + rng() * .03), i % 3 ? col : '#F9CCD6', '#F3D27A', rng() * 70); if (i % 2) s += kLeaf(px, py, L * .08, ang + 60, CU.green); }
  return s;
}
const cuPetals = (W, H, n, rng, x0 = 0, x1 = 1, c = '#F6BFCB') => Array.from({ length: n }, () => { const x = W * (x0 + (x1 - x0) * rng()), y = H * (.05 + rng() * .85), r = W * (.005 + rng() * .004); return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * .6)}" fill="${c}" transform="rotate(${f(rng() * 180)} ${f(x)} ${f(y)})"/>`; }).join('');
const cuButterfly = (x, y, r, c = '#F6CF55') => `<ellipse cx="${f(x - r * .5)}" cy="${f(y - r * .3)}" rx="${f(r * .55)}" ry="${f(r * .45)}" fill="${c}"/><ellipse cx="${f(x + r * .5)}" cy="${f(y - r * .3)}" rx="${f(r * .55)}" ry="${f(r * .45)}" fill="${c}"/><ellipse cx="${f(x - r * .4)}" cy="${f(y + r * .35)}" rx="${f(r * .35)}" ry="${f(r * .3)}" fill="${c}"/><ellipse cx="${f(x + r * .4)}" cy="${f(y + r * .35)}" rx="${f(r * .35)}" ry="${f(r * .3)}" fill="${c}"/><rect x="${f(x - r * .07)}" y="${f(y - r * .6)}" width="${f(r * .14)}" height="${f(r * 1.2)}" rx="${f(r * .07)}" fill="#6B5040"/>`;
function cuBee(x, y, r) {
  return `<ellipse cx="${f(x - r * .3)}" cy="${f(y - r * .75)}" rx="${f(r * .45)}" ry="${f(r * .3)}" fill="#DDF0FA" stroke="#9CC3E6" stroke-width="${f(r * .05)}"/><ellipse cx="${f(x + r * .3)}" cy="${f(y - r * .8)}" rx="${f(r * .45)}" ry="${f(r * .3)}" fill="#DDF0FA" stroke="#9CC3E6" stroke-width="${f(r * .05)}"/>
    <ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * .72)}" fill="#F8D24E"/><path d="M${f(x - r * .3)},${f(y - r * .68)} V${f(y + r * .68)} M${f(x + r * .25)},${f(y - r * .7)} V${f(y + r * .7)}" stroke="#3E3229" stroke-width="${f(r * .2)}"/><circle cx="${f(x - r * .72)}" cy="${f(y - r * .1)}" r="${f(r * .1)}" fill="#3E3229"/><path d="M${f(x + r)},${f(y)} l${f(r * .3)},${f(r * .08)}" stroke="#3E3229" stroke-width="${f(r * .1)}"/>`;
}
function cuWatermelon(x, y, r, rot = 0) {
  return `<g transform="rotate(${f(rot)} ${f(x)} ${f(y)})"><path d="M${f(x - r)},${f(y)} A${f(r)},${f(r)} 0 0 0 ${f(x + r)},${f(y)}Z" fill="#5FAE5A"/><path d="M${f(x - r * .9)},${f(y)} A${f(r * .9)},${f(r * .9)} 0 0 0 ${f(x + r * .9)},${f(y)}Z" fill="#F3FAE9"/><path d="M${f(x - r * .82)},${f(y)} A${f(r * .82)},${f(r * .82)} 0 0 0 ${f(x + r * .82)},${f(y)}Z" fill="#F2676A"/>${[[-.45, .25], [0, .45], [.45, .25], [-.2, .2], [.22, .22]].map(([a, b]) => `<ellipse cx="${f(x + a * r)}" cy="${f(y + b * r)}" rx="${f(r * .045)}" ry="${f(r * .07)}" fill="#3E3229"/>`).join('')}</g>`;
}
function cuFrog(x, y, s, glasses = false) {
  let g = `<ellipse cx="${f(x)}" cy="${f(y + s * .95)}" rx="${f(s * .75)}" ry="${f(s * .6)}" fill="#8CCB76"/><ellipse cx="${f(x)}" cy="${f(y + s * 1.05)}" rx="${f(s * .45)}" ry="${f(s * .4)}" fill="#E4F2C6"/>`;
  g += `<circle cx="${f(x - s * .48)}" cy="${f(y - s * .55)}" r="${f(s * .34)}" fill="#8CCB76"/><circle cx="${f(x + s * .48)}" cy="${f(y - s * .55)}" r="${f(s * .34)}" fill="#8CCB76"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s)}" ry="${f(s * .7)}" fill="#8CCB76"/>`;
  g += glasses ? `<rect x="${f(x - s * .8)}" y="${f(y - s * .72)}" width="${f(s * .62)}" height="${f(s * .36)}" rx="${f(s * .12)}" fill="#2E2E2E"/><rect x="${f(x + s * .18)}" y="${f(y - s * .72)}" width="${f(s * .62)}" height="${f(s * .36)}" rx="${f(s * .12)}" fill="#2E2E2E"/><path d="M${f(x - s * .18)},${f(y - s * .6)} H${f(x + s * .18)}" stroke="#2E2E2E" stroke-width="${f(s * .06)}"/>`
    : `<circle cx="${f(x - s * .48)}" cy="${f(y - s * .55)}" r="${f(s * .2)}" fill="#FFFFFF"/><circle cx="${f(x + s * .48)}" cy="${f(y - s * .55)}" r="${f(s * .2)}" fill="#FFFFFF"/><circle cx="${f(x - s * .45)}" cy="${f(y - s * .52)}" r="${f(s * .1)}" fill="#2E2E2E"/><circle cx="${f(x + s * .45)}" cy="${f(y - s * .52)}" r="${f(s * .1)}" fill="#2E2E2E"/>`;
  return g + `<path d="M${f(x - s * .35)},${f(y + s * .1)} Q${f(x)},${f(y + s * .42)} ${f(x + s * .35)},${f(y + s * .1)}" stroke="#3E5A2E" stroke-width="${f(s * .07)}" fill="#F08A8A"/><ellipse cx="${f(x - s * .68)}" cy="${f(y + s * .1)}" rx="${f(s * .14)}" ry="${f(s * .08)}" fill="#F4A3A0"/><ellipse cx="${f(x + s * .68)}" cy="${f(y + s * .1)}" rx="${f(s * .14)}" ry="${f(s * .08)}" fill="#F4A3A0"/>`;
}
function cuUmbrella(x, y, s, rot = -20) {
  const cols = ['#EF6B5E', '#FFFFFF', '#F6CF55', '#FFFFFF', '#EF6B5E'];
  let g = '';
  cols.forEach((c, i) => { const a0 = Math.PI + i * Math.PI / 5, a1 = a0 + Math.PI / 5; g += `<path d="M${f(x)},${f(y)} L${f(x + Math.cos(a0) * s)},${f(y + Math.sin(a0) * s)} A${f(s)},${f(s)} 0 0 1 ${f(x + Math.cos(a1) * s)},${f(y + Math.sin(a1) * s)}Z" fill="${c}" stroke="#E0B8A0" stroke-width="${f(s * .01)}"/>`; });
  return `<g transform="rotate(${rot} ${f(x)} ${f(y)})">${g}<path d="M${f(x)},${f(y - s * .02)} V${f(y + s * 1.2)}" stroke="#C49060" stroke-width="${f(s * .05)}"/></g>`;
}
function cuBall(x, y, r) {
  const cols = ['#EF6B5E', '#FFFFFF', '#6FB3E0', '#FFFFFF', '#F6CF55', '#FFFFFF'];
  return cols.map((c, i) => { const a0 = i * Math.PI / 3 - .3, a1 = a0 + Math.PI / 3; return `<path d="M${f(x)},${f(y)} L${f(x + Math.cos(a0) * r)},${f(y + Math.sin(a0) * r)} A${f(r)},${f(r)} 0 0 1 ${f(x + Math.cos(a1) * r)},${f(y + Math.sin(a1) * r)}Z" fill="${c}"/>`; }).join('') + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="none" stroke="#D9C9B8" stroke-width="${f(r * .04)}"/>`;
}
const cuDuck = (x, y, s) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s)}" ry="${f(s * .6)}" fill="#F8D24E"/><circle cx="${f(x - s * .5)}" cy="${f(y - s * .6)}" r="${f(s * .45)}" fill="#F8D24E"/><path d="M${f(x - s * .9)},${f(y - s * .6)} l${f(-s * .35)},${f(s * .1)} l${f(s * .35)},${f(s * .12)}Z" fill="#F29A3B"/><circle cx="${f(x - s * .6)}" cy="${f(y - s * .72)}" r="${f(s * .07)}" fill="#3E3229"/>`;
const cuDrops = (x, y, s, rng) => Array.from({ length: 3 }, (_, i) => { const px = x + (rng() - .5) * s * 2, py = y + i * s * .7; return `<path d="M${f(px)},${f(py - s * .3)} Q${f(px + s * .22)},${f(py + s * .05)} ${f(px)},${f(py + s * .15)} Q${f(px - s * .22)},${f(py + s * .05)} ${f(px)},${f(py - s * .3)}Z" fill="#8CC6EE"/>`; }).join('');
function cuWaves(W, H, top) {
  let g = `<path d="M0,${f(H * top)} Q${f(W * .12)},${f(H * (top - .015))} ${f(W * .25)},${f(H * top)} T${f(W * .5)},${f(H * top)} T${f(W * .75)},${f(H * top)} T${W},${f(H * top)} V${H} H0Z" fill="#A9D7F2"/>`;
  for (let i = 0; i < 3; i++) { const y = H * (top + .025 + i * .025); g += `<path d="M${f(W * .02)},${f(y)} q${f(W * .03)},${f(-H * .008)} ${f(W * .06)},0 t${f(W * .06)},0 M${f(W * .4)},${f(y + H * .005)} q${f(W * .03)},${f(-H * .008)} ${f(W * .06)},0 t${f(W * .06)},0 M${f(W * .75)},${f(y)} q${f(W * .03)},${f(-H * .008)} ${f(W * .06)},0" stroke="#FFFFFF" stroke-width="${f(W * .003)}" fill="none" stroke-linecap="round"/>`; }
  return g;
}
const cuFish = (x, y, s) => `<path d="M${f(x + s * .9)},${f(y)} l${f(s * .55)},${f(-s * .45)} v${f(s * .9)}Z" fill="#F29A5B"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s)}" ry="${f(s * .62)}" fill="#F8D24E"/><path d="M${f(x - s * .2)},${f(y - s * .6)} V${f(y + s * .6)}" stroke="#7CC4E8" stroke-width="${f(s * .22)}"/><path d="M${f(x + s * .3)},${f(y - s * .55)} V${f(y + s * .55)}" stroke="#8CCB76" stroke-width="${f(s * .2)}"/><circle cx="${f(x - s * .6)}" cy="${f(y - s * .1)}" r="${f(s * .1)}" fill="#3E3229"/>`;
const cuPineapple = (x, y, s) => `${[-30, 0, 30].map(a => kLeaf(x, y - s * .7, s * .7, -90 + a, '#6FB25E', .25)).join('')}<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * .55)}" ry="${f(s * .75)}" fill="#F6CF55"/><path d="M${f(x - s * .45)},${f(y - s * .3)} L${f(x + s * .3)},${f(y + s * .6)} M${f(x - s * .1)},${f(y - s * .7)} L${f(x + s * .5)},${f(y + s * .1)} M${f(x + s * .45)},${f(y - s * .3)} L${f(x - s * .3)},${f(y + s * .6)} M${f(x + s * .1)},${f(y - s * .7)} L${f(x - s * .5)},${f(y + s * .1)}" stroke="#E0A93A" stroke-width="${f(s * .05)}"/>`;
const cuPop = (x, y, s, rot = 15) => `<g transform="rotate(${rot} ${f(x)} ${f(y)})"><rect x="${f(x - s * .05)}" y="${f(y + s * .4)}" width="${f(s * .1)}" height="${f(s * .5)}" fill="#E8C18A"/><rect x="${f(x - s * .3)}" y="${f(y - s * .7)}" width="${f(s * .6)}" height="${f(s * 1.15)}" rx="${f(s * .3)}" fill="#8CC6EE"/><rect x="${f(x - s * .3)}" y="${f(y - s * .1)}" width="${f(s * .6)}" height="${f(s * .25)}" fill="#FFFFFF"/></g>`;
const cuCastle = (x, y, s) => `<rect x="${f(x - s)}" y="${f(y - s * .7)}" width="${f(s * 2)}" height="${f(s * .7)}" fill="#EFD3A0"/><rect x="${f(x - s * .45)}" y="${f(y - s * 1.3)}" width="${f(s * .9)}" height="${f(s * .65)}" fill="#F2DBAE"/>${[-1, -.5, 0, .5].map(k => `<rect x="${f(x + k * s * .9 - s * .02)}" y="${f(y - s * 1.42)}" width="${f(s * .18)}" height="${f(s * .14)}" fill="#F2DBAE"/>`).join('')}<path d="M${f(x)},${f(y - s * 1.42)} V${f(y - s * 1.9)}" stroke="#A07050" stroke-width="${f(s * .04)}"/><path d="M${f(x)},${f(y - s * 1.9)} l${f(s * .3)},${f(s * .1)} l${f(-s * .3)},${f(s * .1)}Z" fill="#E8604A"/><path d="M${f(x - s * .12)},${f(y)} v${f(-s * .3)} q${f(s * .12)},${f(-s * .15)} ${f(s * .24)},0 v${f(s * .3)}Z" fill="#D9B680"/>`;
function cuGinkgoBranch(x, y, L, ang, rng) {
  const a = ang * KPI, ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L;
  let s = `<path d="M${f(x)},${f(y)} Q${f((x + ex) / 2)},${f((y + ey) / 2 + L * .1)} ${f(ex)},${f(ey)}" stroke="#9A6B4A" stroke-width="${f(L * .04)}" fill="none"/>`;
  for (let i = 0; i < 8; i++) { const t = .1 + i * .11; s += kGinkgo(x + (ex - x) * t, y + (ey - y) * t + L * .02, L * (.12 + rng() * .05), i % 2 ? '#F2C14E' : '#F6D46E', 160 + rng() * 60); }
  return s;
}
const cuMountain = (x0, x1, y, h) => `<path d="M${f(x0)},${f(y)} L${f(x0 + (x1 - x0) * .35)},${f(y - h)} L${f(x0 + (x1 - x0) * .55)},${f(y - h * .65)} L${f(x0 + (x1 - x0) * .7)},${f(y - h * .85)} L${f(x1)},${f(y)}Z" fill="#C9CED6"/><path d="M${f(x0 + (x1 - x0) * .29)},${f(y - h * .83)} L${f(x0 + (x1 - x0) * .35)},${f(y - h)} L${f(x0 + (x1 - x0) * .41)},${f(y - h * .83)}Z" fill="#FFFFFF"/>`;
function cuFence(x0, x1, y, h) {
  let g = `<path d="M${f(x0)},${f(y - h * .4)} L${f(x1)},${f(y - h * .55)} M${f(x0)},${f(y - h * .75)} L${f(x1)},${f(y - h * .9)}" stroke="#A9805A" stroke-width="${f(h * .1)}"/>`;
  for (let i = 0; i <= 5; i++) { const x = x0 + (x1 - x0) * i / 5; g += `<path d="M${f(x)},${f(y)} V${f(y - h)}" stroke="#A9805A" stroke-width="${f(h * .12)}"/>`; }
  return g;
}
const cuStump = (x, y, s) => `<path d="M${f(x - s)},${f(y)} V${f(y - s * .7)} H${f(x + s)} V${f(y)}Z" fill="#A9805A"/><ellipse cx="${f(x)}" cy="${f(y - s * .7)}" rx="${f(s)}" ry="${f(s * .25)}" fill="#E3C49A"/><ellipse cx="${f(x)}" cy="${f(y - s * .7)}" rx="${f(s * .5)}" ry="${f(s * .12)}" fill="none" stroke="#B98A5E" stroke-width="${f(s * .04)}"/>`;
const cuSign = (x, y, s) => `<rect x="${f(x - s * .06)}" y="${f(y - s * .9)}" width="${f(s * .12)}" height="${f(s * 1.5)}" fill="#9A6B4A"/><rect x="${f(x - s * .62)}" y="${f(y - s * 1.05)}" width="${f(s * 1.24)}" height="${f(s * .48)}" rx="${f(s * .05)}" fill="#B9875A" transform="rotate(-6 ${f(x)} ${f(y - s * .8)})"/><rect x="${f(x - s * .55)}" y="${f(y - s * .55)}" width="${f(s * 1.1)}" height="${f(s * .42)}" rx="${f(s * .05)}" fill="#B9875A" transform="rotate(4 ${f(x)} ${f(y - s * .35)})"/>`;
function cuSnowman(x, y, s, hat = '#B5523B', scarf = '#D9473A') {
  let g = `<circle cx="${f(x)}" cy="${f(y + s * 1.25)}" r="${f(s * .95)}" fill="#FFFFFF" stroke="#D5DEE8" stroke-width="${f(s * .04)}"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(s * .7)}" fill="#FFFFFF" stroke="#D5DEE8" stroke-width="${f(s * .04)}"/>`;
  g += `<path d="M${f(x - s * .8)},${f(y + s * 1)} L${f(x - s * 1.5)},${f(y + s * .5)} M${f(x + s * .8)},${f(y + s * 1)} L${f(x + s * 1.5)},${f(y + s * .5)}" stroke="#8B5E3C" stroke-width="${f(s * .07)}" stroke-linecap="round"/>`;
  g += `<circle cx="${f(x - s * .25)}" cy="${f(y - s * .08)}" r="${f(s * .07)}" fill="#3E3229"/><circle cx="${f(x + s * .25)}" cy="${f(y - s * .08)}" r="${f(s * .07)}" fill="#3E3229"/><path d="M${f(x)},${f(y + s * .05)} l${f(s * .35)},${f(s * .08)} l${f(-s * .35)},${f(s * .08)}Z" fill="#F29A3B"/><ellipse cx="${f(x - s * .42)}" cy="${f(y + s * .15)}" rx="${f(s * .1)}" ry="${f(s * .06)}" fill="#F4A3A0"/><ellipse cx="${f(x + s * .42)}" cy="${f(y + s * .15)}" rx="${f(s * .1)}" ry="${f(s * .06)}" fill="#F4A3A0"/>`;
  g += `<path d="M${f(x - s * .62)},${f(y - s * .3)} Q${f(x)},${f(y - s * 1.25)} ${f(x + s * .62)},${f(y - s * .3)}Z" fill="${hat}"/><rect x="${f(x - s * .66)}" y="${f(y - s * .42)}" width="${f(s * 1.32)}" height="${f(s * .2)}" rx="${f(s * .08)}" fill="${hat}" fill-opacity=".8"/><circle cx="${f(x)}" cy="${f(y - s * .98)}" r="${f(s * .14)}" fill="#FFFFFF"/>`;
  g += `<path d="M${f(x - s * .6)},${f(y + s * .55)} Q${f(x)},${f(y + s * .8)} ${f(x + s * .6)},${f(y + s * .55)}" stroke="${scarf}" stroke-width="${f(s * .2)}" fill="none" stroke-linecap="round"/><rect x="${f(x + s * .2)}" y="${f(y + s * .6)}" width="${f(s * .2)}" height="${f(s * .55)}" rx="${f(s * .06)}" fill="${scarf}"/>`;
  return g + `<circle cx="${f(x)}" cy="${f(y + s * 1)}" r="${f(s * .06)}" fill="#6B5040"/><circle cx="${f(x)}" cy="${f(y + s * 1.3)}" r="${f(s * .06)}" fill="#6B5040"/>`;
}
function cuReindeer(x, y, s) {
  const c = '#C99567', l = '#F2DCC0';
  let g = '';
  for (const sd of [-1, 1]) g += `<path d="M${f(x + sd * s * .35)},${f(y - s * .55)} q${f(sd * s * .1)},${f(-s * .5)} ${f(sd * s * .45)},${f(-s * .9)} M${f(x + sd * s * .5)},${f(y - s * .95)} l${f(sd * s * .35)},${f(-s * .05)} M${f(x + sd * s * .62)},${f(y - s * 1.2)} l${f(sd * s * .25)},${f(s * .12)}" stroke="#8B5E3C" stroke-width="${f(s * .12)}" fill="none" stroke-linecap="round"/><ellipse cx="${f(x + sd * s * .78)}" cy="${f(y - s * .35)}" rx="${f(s * .32)}" ry="${f(s * .15)}" fill="${c}" transform="rotate(${sd * 25} ${f(x + sd * s * .78)} ${f(y - s * .35)})"/>`;
  g += `<ellipse cx="${f(x)}" cy="${f(y + s * 1.25)}" rx="${f(s * .6)}" ry="${f(s * .7)}" fill="${c}"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * .72)}" ry="${f(s * .68)}" fill="${c}"/><ellipse cx="${f(x)}" cy="${f(y + s * .3)}" rx="${f(s * .4)}" ry="${f(s * .28)}" fill="${l}"/><circle cx="${f(x)}" cy="${f(y + s * .2)}" r="${f(s * .17)}" fill="#E0453A"/>`;
  g += `<circle cx="${f(x - s * .28)}" cy="${f(y - s * .12)}" r="${f(s * .07)}" fill="#3E3229"/><circle cx="${f(x + s * .28)}" cy="${f(y - s * .12)}" r="${f(s * .07)}" fill="#3E3229"/><ellipse cx="${f(x - s * .5)}" cy="${f(y + s * .15)}" rx="${f(s * .1)}" ry="${f(s * .06)}" fill="#F4A3A0"/><ellipse cx="${f(x + s * .5)}" cy="${f(y + s * .15)}" rx="${f(s * .1)}" ry="${f(s * .06)}" fill="#F4A3A0"/>`;
  return g + `<path d="M${f(x - s * .55)},${f(y + s * .65)} Q${f(x)},${f(y + s * .9)} ${f(x + s * .55)},${f(y + s * .65)}" stroke="#D9473A" stroke-width="${f(s * .2)}" fill="none" stroke-linecap="round"/><rect x="${f(x - s * .35)}" y="${f(y + s * .72)}" width="${f(s * .2)}" height="${f(s * .5)}" rx="${f(s * .06)}" fill="#D9473A"/>`;
}
function cuPenguin(x, y, s) {
  let g = `<ellipse cx="${f(x)}" cy="${f(y + s * .6)}" rx="${f(s * .85)}" ry="${f(s * 1.2)}" fill="#2F3A4A"/><ellipse cx="${f(x)}" cy="${f(y + s * .75)}" rx="${f(s * .58)}" ry="${f(s * .95)}" fill="#FFFFFF"/><ellipse cx="${f(x)}" cy="${f(y - s * .1)}" rx="${f(s * .55)}" ry="${f(s * .45)}" fill="#FFFFFF"/>`;
  g += cuFace(x, y - s * .1, s * .55, '#2F3A4A') + `<path d="M${f(x - s * .1)},${f(y + s * .05)} l${f(s * .1)},${f(s * .12)} l${f(s * .1)},${f(-s * .12)}Z" fill="#F29A3B"/>`;
  g += `<path d="M${f(x - s * .7)},${f(y - s * .45)} Q${f(x)},${f(y - s * 1.35)} ${f(x + s * .7)},${f(y - s * .45)}Z" fill="#7FA77A"/><rect x="${f(x - s * .74)}" y="${f(y - s * .55)}" width="${f(s * 1.48)}" height="${f(s * .22)}" rx="${f(s * .1)}" fill="#F3F0E6"/><circle cx="${f(x)}" cy="${f(y - s * 1.15)}" r="${f(s * .16)}" fill="#F3F0E6"/>`;
  g += `<path d="M${f(x - s * .62)},${f(y + s * .32)} Q${f(x)},${f(y + s * .58)} ${f(x + s * .62)},${f(y + s * .32)}" stroke="#7FA77A" stroke-width="${f(s * .2)}" fill="none" stroke-linecap="round"/>`;
  g += `<rect x="${f(x - s * .7)}" y="${f(y + s * .6)}" width="${f(s * .75)}" height="${f(s * .6)}" fill="#9FBF95"/><path d="M${f(x - s * .32)},${f(y + s * .6)} V${f(y + s * 1.2)} M${f(x - s * .7)},${f(y + s * .88)} H${f(x + s * .05)}" stroke="#F3F0E6" stroke-width="${f(s * .07)}"/>`;
  return g + `<ellipse cx="${f(x - s * .3)}" cy="${f(y + s * 1.8)}" rx="${f(s * .25)}" ry="${f(s * .1)}" fill="#F29A3B"/><ellipse cx="${f(x + s * .3)}" cy="${f(y + s * 1.8)}" rx="${f(s * .25)}" ry="${f(s * .1)}" fill="#F29A3B"/>`;
}
const cuDots = (W, H, n, rng, cols) => Array.from({ length: n }, (_, i) => `<circle cx="${f(W * rng())}" cy="${f(H * rng() * .85)}" r="${f(W * (.003 + rng() * .004))}" fill="${cols[i % cols.length]}" fill-opacity=".7"/>`).join('');
function cuSnowHills(W, H, top) {
  return `<path d="M0,${f(H * (top - .06))} Q${f(W * .3)},${f(H * (top - .12))} ${f(W * .6)},${f(H * (top - .05))} T${W},${f(H * (top - .07))} V${H} H0Z" fill="#E4EEF7" fill-opacity=".8"/><path d="M0,${f(H * top)} Q${f(W * .25)},${f(H * (top - .04))} ${f(W * .5)},${f(H * top)} T${W},${f(H * (top - .015))} V${H} H0Z" fill="#FFFFFF" stroke="#D5E0EC" stroke-width="${f(W * .002)}"/>`;
}

/* ---------- 쪽 배경 ---------- */
function cuteBg(kind) {
  const { W, H } = G, rng = rngOf(kind.length * 977 + kind.charCodeAt(kind.length - 1) * 13);
  const X = v => v * W, Y = v => v * H, R = v => v * W;
  let s = '', paper = CU.cream;
  const sprigs = (pts, fl) => pts.map(([x, y, L, a]) => cuSprig(X(x), Y(y), R(L), a, rng, fl)).join('');
  switch (kind) {
    case 'k-cu-blank':
      s += cuRainbow(X(.8), Y(.1), R(.09)) + cuCloud(X(.15), Y(.08), R(.04)) + cuHills(W, H, .9) + [.15, .3, .62, .85].map(x => cuDaisy(X(x), Y(.95), R(.012))).join('');
      break;
    case 'k-cu-cover':
      s += cuSun(X(.1), Y(.07), R(.045)) + cuCloud(X(.3), Y(.07), R(.035)) + cuRainbow(X(.84), Y(.09), R(.08));
      s += cuHills(W, H, .9) + cuHouse(X(.13), Y(.955), R(.08)) + cuTree(X(.27), Y(.95), R(.05)) + kTulip(X(.86), Y(.97), R(.035), CU.pink, -.2) + kTulip(X(.91), Y(.975), R(.03), '#F6C84A', .2);
      s += [.4, .55, .7].map(x => cuDaisy(X(x), Y(.95), R(.012))).join('') + cuHeart(X(.955), Y(.2), R(.011), '#F08A9A') + cuButterfly(X(.08), Y(.3), R(.015));
      s += cuBearHat(X(.18), Y(.4), R(.045)) + cuSprig(X(.06), Y(.58), R(.05), -60, rng, [CU.yellow]) + cuSprig(X(.3), Y(.6), R(.045), -120, rng);
      break;
    case 'k-cu-class':
      s += cuSun(X(.08), Y(.06), R(.045)) + cuCloud(X(.06), Y(.15), R(.035)) + cuCloud(X(.63), Y(.08), R(.03)) + cuCloud(X(.9), Y(.83), R(.028));
      s += sprigs([[.8, .23, .07, -120], [.07, .43, .05, -30], [.88, .5, .05, -120], [.07, .66, .04, -80]], [CU.yellow]);
      s += kFlower(X(.07), Y(.24), R(.022), '#F6C84A') + kFlower(X(.1), Y(.27), R(.016), '#F6C84A') + cuButterfly(X(.84), Y(.27), R(.014));
      s += cuBearHat(X(.86), Y(.215), R(.024));
      s += cuHeart(X(.94), Y(.44), R(.01), '#F08A9A') + cuHeart(X(.71), Y(.12), R(.012), '#F08A9A');
      s += cuHills(W, H, .91) + cuHouse(X(.13), Y(.955), R(.085)) + cuTree(X(.03), Y(.95), R(.05)) + cuTree(X(.26), Y(.95), R(.045));
      s += kTulip(X(.36), Y(.97), R(.025), '#F6C84A', .1) + kTulip(X(.72), Y(.97), R(.03), CU.pink, -.2) + kTulip(X(.76), Y(.975), R(.025), '#F29AA5', .2) + [.5, .58, .66, .84].map(x => cuDaisy(X(x), Y(.95), R(.01))).join('') + cuHeart(X(.5), Y(.9), R(.008), '#F08A9A');
      break;
    case 'k-cu-kids':
      s += kFlower(X(.66), Y(.07), R(.02), '#F6C84A') + cuSprig(X(.65), Y(.09), R(.05), 160, rng) + cuRainbow(X(.84), Y(.135), R(.07)) + cuHeart(X(.96), Y(.07), R(.01), '#F08A9A');
      s += kFlower(X(.97), Y(.33), R(.012), '#F6C84A') + kFlower(X(.97), Y(.53), R(.012), '#F6C84A') + cuButterfly(X(.97), Y(.68), R(.012), '#F2B84A');
      s += cuHills(W, H, .93, '#D8EBC4', '#C6E0AE') + kTulip(X(.94), Y(.975), R(.045), CU.pink, -.1) + kTulip(X(.9), Y(.98), R(.035), '#F6C84A', .2) + [.65, .72, .8].map(x => cuDaisy(X(x), Y(.965), R(.01))).join('');
      break;
    case 'k-cu-groupL':
      s += cuSun(X(.07), Y(.05), R(.04)) + cuCloud(X(.36), Y(.06), R(.03)) + cuBalloons(X(.6), Y(.08), R(.028));
      s += cuHeart(X(.5), Y(.15), R(.01), '#F08A9A') + kFlower(X(.04), Y(.6), R(.014), '#F6C84A') + kFlower(X(.96), Y(.6), R(.014), CU.pink);
      s += cuHills(W, H, .93) + [.12, .3, .5, .7].map(x => cuDaisy(X(x), Y(.965), R(.011))).join('') + kTulip(X(.88), Y(.975), R(.03), CU.pink, -.1) + kTulip(X(.92), Y(.98), R(.025), '#F6C84A', .2);
      break;
    case 'k-cu-groupR':
      s += cuBunting(X(.0), Y(.035), X(1), Y(.04), H * .07) + cuRainbow(X(.84), Y(.86), R(.09));
      s += cuBearBouquet(X(.18), Y(.74), R(.045)) + cuBearHat(X(.4), Y(.77), R(.035), true) + cuButterfly(X(.6), Y(.75), R(.016)) + cuHeart(X(.28), Y(.68), R(.01), '#F08A9A');
      s += cuHills(W, H, .94) + kTulip(X(.06), Y(.975), R(.035), CU.pink, -.1) + kTulip(X(.1), Y(.98), R(.03), '#F6C84A', .2) + [.55, .62, .7].map(x => cuDaisy(X(x), Y(.965), R(.011))).join('');
      break;
    case 'k-cu-introL': case 'k-cu-introR': {
      paper = '#FBF0E6';
      const left = kind === 'k-cu-introL', XX = v => X(left ? v : 1 - v);
      s += `<circle cx="${f(XX(.05))}" cy="${f(Y(.95))}" r="${f(R(.2))}" fill="#F4E1CC"/><circle cx="${f(XX(.98))}" cy="${f(Y(.03))}" r="${f(R(.15))}" fill="#F6E5D2"/>`;
      s += `<rect x="${f(X(.03))}" y="${f(Y(.04))}" width="${f(X(.94))}" height="${f(Y(.92))}" fill="none" stroke="#E2CDB8" stroke-width="${f(W * .0012)}"/>`;
      s += kVine(XX(0), Y(.02), R(.25), left ? 30 : 150, KC.sage, rng, 7, R(.003), .24, ['#FFFFFF', '#FFFFFF']) + kVine(XX(.02), Y(1), R(.25), left ? -55 : -125, KC.sage, rng, 7, R(.003), .24, ['#FFFFFF', '#FFFFFF']);
      break;
    }
    case 'k-cu-springL':
      s += cuBranch(X(-.02), Y(.02), R(.3), 25, rng) + cuPetals(W, H, 16, rng) + kFlower(X(.6), Y(.09), R(.016), '#F6C84A') + kLeaf(X(.9), Y(.12), R(.025), -60, CU.green);
      s += cuHills(W, H, .92, '#E3EFCF', '#D2E6BC') + kTulip(X(.08), Y(.97), R(.035), '#F6C84A', -.1) + kTulip(X(.12), Y(.975), R(.028), CU.pink, .2) + kTulip(X(.9), Y(.97), R(.032), CU.pink, -.2) + cuSprig(X(.84), Y(.98), R(.06), -80, rng);
      break;
    case 'k-cu-springR':
      s += cuButterfly(X(.93), Y(.06), R(.018)) + `<path d="M${f(X(.9))},${f(Y(.09))} q${f(R(.02))},${f(R(.03))} ${f(R(.005))},${f(R(.05))}" stroke="#9AA58F" stroke-dasharray="4 4" fill="none"/>` + cuPetals(W, H, 10, rng, .4, 1);
      s += cuBearBouquet(X(.9), Y(.5), R(.04)) + cuHeart(X(.84), Y(.47), R(.01), '#F08A9A') + cuSprig(X(.8), Y(.58), R(.04), -70, rng) + cuSprig(X(.97), Y(.58), R(.04), -110, rng);
      s += cuHills(W, H, .93, '#E3EFCF', '#D2E6BC') + kTulip(X(.88), Y(.975), R(.045), CU.pink, -.1) + kTulip(X(.94), Y(.98), R(.035), '#F6C84A', .2) + kTulip(X(.97), Y(.975), R(.03), '#F29AA5', .1);
      break;
    case 'k-cu-summerL':
      s += kFrond(X(-.03), Y(-.02), R(.25), 55, '#7DBE6A', rng) + kFrond(X(.0), Y(.0), R(.2), 75, '#94CC7E', rng) + kSun(X(.25), Y(.06), R(.02));
      s += cuWatermelon(X(.27), Y(.11), R(.03), -20) + cuWatermelon(X(.07), Y(.4), R(.06), 25) + cuDrops(X(.07), Y(.3), R(.015), rng) + cuDrops(X(.95), Y(.18), R(.015), rng) + cuDrops(X(.93), Y(.45), R(.015), rng);
      s += cuFrog(X(.88), Y(.53), R(.04)) + cuUmbrella(X(.12), Y(.6), R(.11)) + cuBall(X(.08), Y(.84), R(.05)) + cuWatermelon(X(.75), Y(.82), R(.065), 15);
      s += cuWaves(W, H, .9) + cuDuck(X(.9), Y(.9), R(.025));
      break;
    case 'k-cu-summerR':
      paper = '#F4F8FB';
      s += cuSun(X(.9), Y(.07), R(.04)) + cuBee(X(.62), Y(.08), R(.028)) + cuDrops(X(.06), Y(.12), R(.015), rng) + cuWatermelon(X(.07), Y(.42), R(.045), 20);
      s += cuWatermelon(X(.9), Y(.4), R(.06), 0) + cuFrog(X(.9), Y(.31), R(.04), true) + cuBall(X(.82), Y(.45), R(.035)) + cuFish(X(.9), Y(.56), R(.035)) + cuPineapple(X(.79), Y(.58), R(.03)) + cuWatermelon(X(.87), Y(.63), R(.035), -10);
      s += kFrond(X(.93), Y(.62), R(.08), -60, '#7DBE6A', rng) + kFrond(X(.93), Y(.62), R(.07), -120, '#94CC7E', rng) + cuPop(X(.94), Y(.72), R(.04));
      s += cuWaves(W, H, .9) + cuCastle(X(.92), Y(.98), R(.05)) + cuWatermelon(X(.75), Y(.97), R(.05), 0) + cuWatermelon(X(.53), Y(.98), R(.07), 180);
      break;
    case 'k-cu-autumnL':
      s += cuGinkgoBranch(X(-.02), Y(.0), R(.25), 20, rng) + Array.from({ length: 14 }, (_, i) => (i % 2 ? kMaple : kGinkgo)(X(.05 + rng() * .9), Y(.1 + rng() * .75), R(.012 + rng() * .006), [KC.orange, '#F2C14E', KC.red][i % 3], rng() * 360)).join('');
      s += kBear(X(.86), Y(.36), R(.04), 'hat') + `<path d="M${f(X(.81))},${f(Y(.39))} l${f(-R(.03))},${f(-R(.04))} M${f(X(.91))},${f(Y(.39))} l${f(R(.03))},${f(-R(.04))}" stroke="#B98A5E" stroke-width="${f(R(.014))}" stroke-linecap="round"/>`;
      s += cuMountain(X(.2), X(.75), Y(.93), Y(.08)) + cuHills(W, H, .92, '#F2E2BF', '#E7D3A6') + cuFence(X(.02), X(.28), Y(.94), Y(.04));
      s += cuCone(X(.05), Y(.96), R(.07), '#F2C14E') + cuTree(X(.15), Y(.96), R(.05), '#F2B26A', '#F6C88A') + cuCone(X(.88), Y(.97), R(.08), '#EE9B55') + cuCone(X(.95), Y(.96), R(.06), '#F2C14E') + cuTree(X(.8), Y(.97), R(.04), '#E8875A', '#F2A06A');
      break;
    case 'k-cu-autumnR':
      s += cuCloud(X(.8), Y(.07), R(.035)) + kMaple(X(.94), Y(.08), R(.02), KC.orange, 20) + Array.from({ length: 10 }, (_, i) => (i % 2 ? kMaple : kGinkgo)(X(.05 + rng() * .9), Y(.1 + rng() * .75), R(.01 + rng() * .006), [KC.orange, '#F2C14E', KC.red][i % 3], rng() * 360)).join('');
      s += cuSign(X(.115), Y(.6), R(.07)) + cuGrassTuft(X(.115), Y(.62), R(.04), rng);
      s += cuStump(X(.88), Y(.55), R(.045)) + kSquirrel(X(.86), Y(.44), R(.03), false, 'acorn') + cuSprig(X(.8), Y(.55), R(.035), -60, rng) + cuSprig(X(.96), Y(.55), R(.035), -120, rng);
      s += cuHills(W, H, .94, '#F2E2BF', '#E7D3A6') + cuCone(X(.88), Y(.98), R(.06), '#EE9B55') + cuCone(X(.94), Y(.975), R(.05), '#F2C14E') + cuTree(X(.82), Y(.98), R(.035), '#E8875A', '#F2A06A') + cuGrassTuft(X(.1), Y(.97), R(.03), rng);
      break;
    case 'k-cu-winterL':
      paper = '#FAF8F4';
      s += cuDots(W, H, 40, rng, ['#B9D3EC', '#D9C9E8', '#C9DDF0']) + Array.from({ length: 10 }, () => kSnow(X(rng()), Y(rng() * .85), R(.015 + rng() * .015), ['#A9C9E8', '#D2C2E6'][Math.floor(rng() * 2)], R(.0025))).join('');
      s += cuSnowHills(W, H, .93) + cuSnowman(X(.09), Y(.13), R(.045)) + cuReindeer(X(.88), Y(.25), R(.045));
      s += cuSnowman(X(.6), Y(.75), R(.035), '#A0623E', '#D9473A') + cuSnowman(X(.15), Y(.88), R(.035), '#D9473A', '#6FA56B');
      break;
    case 'k-cu-winterR':
      paper = '#FAF8F4';
      s += cuDots(W, H, 40, rng, ['#B9D3EC', '#D9C9E8', '#C9DDF0']) + Array.from({ length: 10 }, () => kSnow(X(rng()), Y(rng() * .85), R(.015 + rng() * .015), ['#A9C9E8', '#D2C2E6'][Math.floor(rng() * 2)], R(.0025))).join('');
      s += cuSnowHills(W, H, .94) + cuSnowman(X(.9), Y(.12), R(.035), '#6FA56B', '#6FA56B') + cuPenguin(X(.89), Y(.45), R(.05)) + cuReindeer(X(.91), Y(.84), R(.04));
      s += cuSnowman(X(.475), Y(.29), R(.022), '#FFFFFF', '#D9473A') + cuSnowman(X(.07), Y(.6), R(.03), '#FFFFFF', '#6FA56B');
      break;
  }
  return `<svg class="bg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><rect width="${W}" height="${H}" fill="${paper}"/>${s}</svg>`;
}
function cuBalloons(x, y, s) {
  return [[-1.1, .2, '#F5A3B3'], [0, -.3, '#9CC3E6'], [1.1, .25, '#F6CF6B']].map(([dx, dy, c]) => {
    const bx = x + dx * s, by = y + dy * s;
    return `<path d="M${f(bx)},${f(by + s * 1.1)} Q${f(bx + s * .2)},${f(by + s * 2)} ${f(x)},${f(y + s * 3.2)}" stroke="#A89A8A" stroke-width="${f(s * .04)}" fill="none"/><ellipse cx="${f(bx)}" cy="${f(by)}" rx="${f(s * .8)}" ry="${f(s)}" fill="${c}"/><ellipse cx="${f(bx - s * .28)}" cy="${f(by - s * .35)}" rx="${f(s * .15)}" ry="${f(s * .25)}" fill="#FFFFFF" fill-opacity=".6"/><path d="M${f(bx - s * .12)},${f(by + s * 1.12)} h${f(s * .24)} l${f(-s * .12)},${f(-s * .15)}Z" fill="${c}"/>`;
  }).join('');
}
function cuBunting(x0, y0, x1, y1, h) {
  const n = 14, cols = ['#F5A3B3', '#F6CF6B', '#A6CC95', '#9CC3E6', '#C4B2E2'];
  let s = `<path d="M${f(x0)},${f(y0)} Q${f((x0 + x1) / 2)},${f(y0 + h * .9)} ${f(x1)},${f(y1)}" stroke="#B8A08A" stroke-width="${f(h * .04)}" fill="none"/>`;
  for (let i = 0; i < n; i++) {
    const t = (i + .5) / n, x = x0 + (x1 - x0) * t, y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * (y0 + h * .9) + t * t * y1, w = (x1 - x0) / n * .38;
    s += `<path d="M${f(x - w)},${f(y)} L${f(x + w)},${f(y)} L${f(x)},${f(y + h * .75)}Z" fill="${cols[i % cols.length]}"/>`;
  }
  return s;
}
function cuGrassTuft(x, y, s, rng) { return kGrass(x - s, x + s, y, s * .6, '#8DBF84', rng, 10, s * .04); }

/* ---------- 3쪽 선생님 명렬 ----------
   교직원 명단(직위 | 이름)이 있으면 그 선생님들, 없으면 원장 + 반마다 담임 선생님.
   담임 사진은 기본 템플릿과 같은 키(c0-tch …)라 원래 넣은 사진이 그대로 들어감 */
function cuTeacherList(classes) {
  const list = parseTeachers(S.teachers).filter(t => t.name);
  if (list.length) return list.map((t, i) => ({ key: teacherKey(t, i), role: t.role, name: t.name }));
  return [{ key: 'k-dir', role: '원장', name: S.principal || '○○○' },
    ...classes.map((c, ci) => ({ key: `c${ci}-tch`, role: `${c.name} 담임`, name: (ci === 0 && S.homeTeacher) || c.teacher || '○○○' }))];
}
/** 선생님 틀 10개 (5칸 × 2줄). 앞에서부터 명단의 선생님 사진 · 이름, 남는 칸은 빈 틀 + '선생님'. 이름표는 눌러서 고침 */
const CU_TCH_N = 10;
function cuTeacherGrid(classes, tape) {
  const list = cuTeacherList(classes);
  const looks = [['scallop', CU.pink], ['box', CU.green, '#9DCB8E'], ['circ', CU.blue], ['box', CU.yellow, '#F2CF78'], ['scallop', CU.purple], ['box', CU.orange, '#F0AE86'], ['circ', CU.green], ['box', CU.pink, '#F2A7B5'], ['scallop', CU.yellow], ['box', CU.blue, '#9CC3E6']];
  const cols = 5, gx = 2.2, x0 = 6, cw = (88 - gx * (cols - 1)) / cols, ch = Math.min(13.5, cw / G.aspect * 1.08), rowH = ch + 4.6, y0 = 27.5;
  let html = '';
  for (let i = 0; i < CU_TCH_N; i++) {
    const t = list[i] || { key: `k-tch-${i}`, role: '', name: '선생님' }, [shape, col, tc] = looks[i % looks.length], round = shape !== 'box';
    const x = x0 + (i % cols) * (cw + gx), y = y0 + Math.floor(i / cols) * rowH, cx = x + cw / 2;
    const w = round ? Math.min(cw, ch * G.aspect) : cw, h = round ? w / G.aspect : ch;
    const box = [cx - w / 2, y + (ch - h) / 2, cx + w / 2, y + (ch + h) / 2], nw = cw + 2;
    html += cuLF(t.key, box, shape, col, tc ? tape(tc, 50, i % 2 ? 3 : -3) : '') +
      LT([cx - nw / 2, y + ch + .7, cx + nw / 2, y + ch + 4], E(`k-cu-tch-${i}`, t.role ? `${t.role} ${t.name}` : t.name, 'cu-pill cu-tpill'), 'lcenter');
  }
  return html;
}

/* ---------- 쪽 구성 ---------- */
const cuRainbowText = t => [...String(t)].map((c, i) => (c.trim() ? `<span style="color:${CU_RAINBOW[i % CU_RAINBOW.length]}">${esc(c)}</span>` : c)).join('');
function cutePages(classes) {
  cuStyle();
  const kidNames = classes.flatMap(c => c.students).map(s => s.name).filter(Boolean);
  const pk = (kind, def) => (S.kPersonal && kidNames[0] ? kpKey(kind, kidNames[0]) : def);
  const ev = key => pk(`ev-${key}`, key);
  const kp = (kind, label, html) => layPage(kind, label, [kind, ['butter', 'peach', 'sage']], html, { run: false, folio: false });
  const year = esc(S.year), school = S.school || '유치원';
  const tape = (c, at = 50, rot = -3) => kTape(cuGingham(c), at, rot);
  const pages = [];
  pages.push({ ...kp('k-cu-blank', '백지', ''), pairFirst: true });
  pages.push(kp('k-cu-cover', '소중한 추억들', `
    ${LT([33, 14, 93.8, 21.5], E('k-cover-title', `${S.year} 소중한 추억들`, 'cu-cover-title'), 'lcenter')}
    ${LF(pk('cover', 'k-cover'), [37.1, 23.9, 89.7, 83.1], 'k-thin cu-thin')}
    ${LT([3, 64, 35, 80], `<svg viewBox="0 0 100 70" class="k-emb k-emb-s">${kCapLaurel(50, 34, 26, '#A0764E')}${kFlower(30, 52, 5, KC.pink)}${kFlower(70, 52, 5, KC.yellow)}</svg><div class="k-emb-y cu-year">${year} 학년도</div>`, 'lcenter')}
    ${LT([33, 83.6, 93.8, 89.6], `<div class="cu-rainbow cu-rainbow-s" contenteditable="false">${cuRainbowText(school)}</div>`, 'lcenter')}
    ${LT([33, 89.6, 93.8, 93.6], `<div class="k-cover-class">${esc(classes[0]?.name || '')}${S.kPersonal && kidNames[0] ? ` <span class="k-cname">${esc(kidNames[0])}</span>` : ''}</div>`, 'lcenter')}`));
  const intro = [];
  intro.push(kp('k-cu-introL', '소개 (왼쪽)', `
    ${LT([5, 15, 33, 21], E('k-en', 'KINDERGARTEN', 'k-en'), 'lcenter')}
    ${LT([7, 24, 31, 36], `<svg viewBox="0 0 100 70" class="k-emb">${kCapLaurel(50, 36, 28, '#A0764E')}</svg>`, 'lcenter')}
    ${LT([3, 39, 35, 53], `<div class="k-year cu-year">${year}학년도</div><div class="k-name cu-iname" style="white-space:pre-line">${esc(school).replace(/(.)(병설유치원)$/, '$1\n$2')}</div><div class="k-rule"></div>`, 'lcenter')}
    ${LT([4, 58, 34, 72, -10], `${E('k-intro-script', 'Always\nbe happy', 'k-script cu-script')}<div class="k-heart-big">♡</div>`, 'lcenter')}
    ${cuLF(pk('cap', 'ki-0'), [38, 8, 93, 92], 'notch', '#B89A82')}`));
  intro.push(kp('k-cu-introR', '소개 (오른쪽)', `
    ${cuLF(pk('prof', 'ki-1'), [7, 8, 62, 92], 'notch', '#B89A82')}
    ${LT([66, 26, 96, 40], E('k-intro-1', '꿈을 향해\n한 걸음 더', 'k-pen-big'), 'lcenter')}
    ${LT([70, 42, 92, 44], '<div class="k-rule"></div>', 'lcenter')}
    ${LT([66, 46, 96, 62], E('k-intro-2', '지금 이 순간,\n너희는\n참 예쁘다.', 'k-msg'), 'lcenter')}
    ${LT([66, 64, 96, 70], E('k-en', 'KINDERGARTEN', 'k-en'), 'lcenter')}
    ${S.kPersonal ? LT([64, 74, 98, 84], `<div class="k-pname" contenteditable="false">${esc(kidNames[0] || '이름')}</div>`, 'lcenter') : ''}`));
  classes.forEach((c, ci) => {
    if (ci === 0) pages.push(kp('k-cu-class', '선생님 명렬', `
      ${LT([14, 5, 64, 9], `<div class="cu-small">${year}학년도${classes.length === 1 ? ` · ${esc(c.name)}` : ''}</div>`, 'lcenter')}
      ${LT([8, 8.5, 70, 16], `<div class="cu-rainbow cu-rainbow-l" contenteditable="false">${cuRainbowText(school)} <span class="cu-heart">♥</span></div>`, 'lcenter')}
      ${LT([12, 16, 66, 19.5], E(`k-class-en-${ci}`, 'KINDERGARTEN', 'cu-en'), 'lcenter')}
      ${LT([70, 5, 97, 17, -6], E(`k-class-pen-${ci}`, '행복한 꿈을\n함께 키워가는\n우리 ♥', 'cu-pen'), 'lcenter')}
      ${LT([25, 20.5, 75, 26.5], E('k-cu-tch-title', '사랑하는 선생님', 'cu-title cu-title-s'), 'lcenter')}
      ${cuTeacherGrid(classes, tape)}
      ${cuLF(`c${ci}-g1`, [8, 64.5, 92, 83], 'box', CU.beige, tape('#E8B8A8', 50, -1))}
      ${LT([18, 84.8, 82, 88.6], `<div class="cu-memo">${year}학년도 ${esc(school)} 졸업기념</div>`, 'lcenter')}`));
    const kids = c.students.map(s => ({ s, i: s.idx }));
    for (let p = 0; p < Math.max(1, Math.ceil(kids.length / K_PER_PAGE)); p++) {
      const chunk = kids.slice(p * K_PER_PAGE, p * K_PER_PAGE + K_PER_PAGE), first = p === 0;
      let grid = '';
      const g1Here = first && ci > 0;      // 첫 반의 단체 02는 3쪽 아래로 옮김. 다른 반은 예전처럼 명단 쪽 아래
      kKidGrid(chunk.length, 17, g1Here ? 45 : 70).forEach(([x, y, s, ch], n) => {
        const { s: st, i } = chunk[n], nw = Math.max(s, 11);
        grid += cuLF(`c${ci}-s${i}`, [x, y, x + s, y + ch], 'box cu-kid', CU.beige) + LT([x + s / 2 - nw / 2, y + ch + .5, x + s / 2 + nw / 2, y + ch + K_NAME_H], `<div class="cu-pill">${esc(st.name)}</div>`, 'lcenter');
      });
      pages.push(kp('k-cu-kids', `${c.name} 원아${p ? ` ${p + 1}` : ''}`, `
        ${LT([30, 4, 62, 11.5], E(`k-cu-roll-${ci}`, '명단', 'cu-title'), 'lcenter')}
        ${LT([7, 12, 50, 15.5], '<div class="cu-en cu-en-l">A Graduation Album</div>')}
        ${LT([64, 4.5, 94, 9], E(`k-class-cong-${ci}`, '진심으로 축하해요 ♥', 'cu-pen'), 'lright')}
        ${grid}
        ${g1Here ? cuLF(`c${ci}-g1`, [6, 64, 94, 91], 'box', CU.beige, tape('#E8B8A8', 50, -1)) : LT([30, 88, 70, 92], '<div class="cu-thanks">♥ THANK YOU ♥</div>', 'lcenter')}`));
    }
  });
  pages.push(...intro);
  // 봄
  pages.push(kp('k-cu-springL', '봄 (왼쪽)', `
    ${cuLF(ev('ks-b0'), [5, 13, 64, 58], 'cloud', CU.pink)}
    ${LT([66, 14, 97, 31], E('k-cu-spring-t', '봄처럼\n예쁜 우리 ♥', 'cu-season cu-s-spring'), 'lleft')}
    ${LT([67, 33, 97, 46], E('k-cu-spring-m', '따뜻한 봄날,\n우리의 소중한 추억이\n피어납니다. ♥', 'cu-note-t'), 'lleft')}
    ${cuLF(ev('ks-b1'), [5, 60, 42, 86], 'cloud', CU.yellow, kOrn('forsythia', ['bl'], 8))}
    ${cuLF(ev('ks-b2'), [48, 57, 92, 84, -3], 'box', CU.green, tape('#9DCB8E', 30) + kOrn('sprig', ['br'], 7))}`));
  pages.push(kp('k-cu-springR', '봄 (오른쪽)', `
    ${cuLF(ev('ks-b3'), kCircle(25, 21, 34), 'circ', CU.blue, kOrn('daisy', ['tl'], 8))}
    ${cuLF(ev('ks-b4'), [46, 8, 80, 33], 'cloud', CU.yellow, kOrn('forsythia', ['tr'], 7))}
    ${LT([81, 13, 99, 33], E('k-cu-spring-r', '알록달록\n예쁜 봄꽃처럼\n우리의 추억도\n예쁘게 자라가요\n♥', 'cu-note-t cu-note-s'), 'lcenter')}
    ${cuLF(ev('ks-b5'), [6, 39, 76, 62], 'box', CU.green, tape('#9DCB8E', 8, -6) + kOrn('sprig', ['br'], 7))}
    ${cuLF(ev('ks-b6'), [6, 66, 52, 90], 'circ', CU.purple, kOrn('daisy', ['bl'], 8))}
    ${cuLF(ev('ks-b7'), [57, 64, 94, 88, 2], 'box', CU.pink, tape('#F2A7B5', 30))}`));
  // 여름
  pages.push(kp('k-cu-summerL', '여름 (왼쪽)', `
    ${cuLF(ev('ku-0'), [11, 15, 85, 49], 'blob', CU.blue)}
    ${cuLF(ev('ku-1'), [7, 56, 58, 87], 'wave', CU.blue)}
    ${cuLF(ev('ku-2'), kCircle(77, 69, 30), 'circ', '#C8DC8A')}`));
  pages.push(kp('k-cu-summerR', '여름 (오른쪽)', `
    ${cuLF(ev('ku-3'), kCircle(23, 27, 34), 'circ', '#F2D46E', cuPin(50))}
    ${cuLF(ev('ku-4'), kCircle(59, 27, 34), 'circ', '#9CCFE0')}
    ${cuLF(ev('ku-5'), [6, 52, 58, 87, -1], 'note', '#FFFFFF', kTape('rgba(222,196,160,.85)', 40, -3))}
    ${cuLF(ev('ku-6'), [63, 57, 86, 85, 2], 'box', CU.blue)}`));
  // 가을
  pages.push(kp('k-cu-autumnL', '가을 (왼쪽)', `
    ${cuLF(ev('ka-0'), [6, 12, 66, 46, -3], 'box', CU.yellow, tape('#F2CF78', 35, 2))}
    ${LT([68, 12, 97, 30], E('k-cu-autumn-t', '가을은\n늘 좋은\n날이야 ♥', 'cu-season cu-s-autumn'), 'lleft')}
    ${cuLF(ev('ka-1'), [5, 51, 56, 78, -2], 'box', CU.orange, kOrn('leaf', ['bl'], 9))}
    ${cuLF(ev('ka-2'), [60, 53, 94, 80, 3], 'box', CU.green, kOrn('leaf', ['br'], 8))}`));
  pages.push(kp('k-cu-autumnR', '가을 (오른쪽)', `
    ${cuLF(ev('ka-3'), kCircle(25, 25, 33), 'circ', CU.orange, kOrn('leaf', ['tl'], 8))}
    ${cuLF(ev('ka-4'), [48, 12, 85, 40], 'cloud', CU.yellow)}
    ${LT([85, 15, 99, 34], E('k-cu-autumn-r', '알록달록\n예쁜 가을처럼\n우리의 추억도\n예쁘게 자라가요\n♥', 'cu-note-t cu-note-s'), 'lcenter')}
    ${cuLF(ev('ka-5'), [25, 43, 80, 61], 'box', CU.green)}
    ${LT([5, 53.5, 18.5, 60], E('k-cu-sign', '행복한\n우리 ♥', 'cu-sign'), 'lcenter')}
    ${cuLF(ev('ka-6'), [7, 65, 55, 90], 'circ', CU.yellow, kOrn('leaf', ['br'], 8))}
    ${cuLF(ev('ka-7'), [62, 62, 94, 89], 'box', CU.orange, kOrn('leaf', ['br'], 8))}`));
  // 겨울
  pages.push(kp('k-cu-winterL', '겨울 (왼쪽)', `
    ${cuLF(ev('kw-0'), [17, 11, 80, 48], 'wave', '#BDB8B3')}
    ${cuLF(ev('kw-1'), [13, 53, 50, 79], 'box', '#C9C4BE', kTape('rgba(190,186,178,.8)', 45, 0))}
    ${cuLF(ev('kw-2'), kCircle(72, 64, 30), 'circ', '#C9C4BE')}`));
  pages.push(kp('k-cu-winterR', '겨울 (오른쪽)', `
    ${cuLF(ev('kw-3'), [5, 8, 44, 34, -2], 'box', '#C9C4BE', kTape('rgba(190,186,178,.8)', 40, -2) + kOrn('snow', ['bl'], 7))}
    ${cuLF(ev('kw-4'), kCircle(66, 21, 30), 'circ', '#C9C4BE', kTape('rgba(190,186,178,.8)', 48, 0))}
    ${cuLF(ev('kw-5'), [10, 38, 82, 61], 'box', '#C9C4BE')}
    ${cuLF(ev('kw-6'), [5, 65, 47, 90], 'cloud', '#C9C4BE')}
    ${cuLF(ev('kw-7'), [55, 63, 84, 88], 'box', '#C9C4BE', kTape('rgba(190,186,178,.8)', 50, 1))}`));
  return pages;
}
