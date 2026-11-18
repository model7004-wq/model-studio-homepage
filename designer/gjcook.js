/* ============================================================
   학교 템플릿 「경북조리과학고 2026 (84쪽 · 신사절 250×315)」
   원본: 000 경북조리과학고등학교 모델 (인디자인 시안). 사진틀 · 글자 자리는 시안 그대로 (tpl/gjcook/layout.js),
   배경 그림 · 색 · 글꼴 · 장식은 모두 새로 그림 → 크림 바탕 + 올리브 · 테라코타 · 버터 · 더스티블루.
   앨범 설정 schoolTpl: 'gjcook' 인 앨범에서 쓰임. 사진 키는 gj-<인디자인 틀 번호>.
   ============================================================ */
const GJ = {
  paper: '#FBF7EF', white: '#FFFDF9', ink: '#2B2723', sub: '#8A8076', line: '#D8CDBB', oat: '#F0E7D6',
  /* 구역별 두 색 조합: a 주색 · aL 옅은 · aD 짙은 / b 보조색 · bL 옅은 */
  th: {
    front: { a: '#5E6B4A', aL: '#E2E7D4', aD: '#3D4930', b: '#C56B45', bL: '#F4DFD2' },
    c1:    { a: '#C56B45', aL: '#F5E0D3', aD: '#8E4425', b: '#D9B453', bL: '#F7EECB' },
    c2:    { a: '#6C7D55', aL: '#E1E8D3', aD: '#435237', b: '#D9A441', bL: '#F7EECB' },
    c3:    { a: '#5C7C99', aL: '#DBE6EE', aD: '#38546D', b: '#C56B45', bL: '#F5E0D3' },
    mem:   { a: '#B5862C', aL: '#F6ECCB', aD: '#6F5216', b: '#5E6B4A', bL: '#E2E7D4' },
  },
  DROP: /^Gemini_Generated|^GenAIImage|^파스텔|졸업 앨범 스프레드|봄날의 기록|친구와 추억의 봄날/,
};
const gjL = () => window.GJ_LAYOUT;
const gjSection = n => (n <= 13 ? 'front' : n <= 29 ? 'c1' : n <= 45 ? 'c2' : n <= 61 ? 'c3' : 'mem');
const gjTheme = n => GJ.th[gjSection(n)];
const gjDark = n => n >= 62 && n <= 81;      // 추억 쪽: 버터색 바탕 + 흰 테두리 사진
const gjChapter = n => (n <= 71 ? 1 : n <= 75 ? 2 : n <= 77 ? 3 : n <= 79 ? 4 : 5);      // 우정 · 실습복 · 행사 · 일상 · 졸업사진
const gjClassNo = n => (n >= 14 && n <= 61 ? Math.floor((n - 14) / 16) + 1 : 0);
function gjLabel(pg) {
  const n = pg.n, c = gjClassNo(n);
  if (n === 1) return '학교 연혁';
  if (n <= 3) return '학교 전경';
  if (n <= 5) return '교훈 · 교장 선생님';
  if (n <= 13) return '교직원';
  if (c) return `3-${c} ` + ({ C: '학급 소개', P: '프로필 · 조별', Q: '수조 프로필', S: '야외 프로필' }[pg.m] || '');
  if (n <= 81) return '추억';
  return '롤링페이퍼';
}

/* ---------- 색 ---------- */
function gjRgbOf(name) {
  if (!name || name === 'None') return null;
  if (name === 'Paper') return [255, 255, 255];
  if (/^(Black|\[검정\]|검정)/.test(name)) { const m = /(\d+)%/.exec(name), k = m ? +m[1] / 100 : 1; const v = Math.round(255 * (1 - k * .88)); return [v, v, v]; }
  let c = null;
  const m1 = /C=([\d.]+) M=([\d.]+) Y=([\d.]+) K=([\d.]+)/i.exec(name), m2 = /R=(\d+) G=(\d+) B=(\d+)/i.exec(name);
  if (m1) c = ['CMYK', [+m1[1], +m1[2], +m1[3], +m1[4]]];
  else if (m2) c = ['RGB', [+m2[1], +m2[2], +m2[3]]];
  else c = gjL().sw?.[name];
  if (!c) return null;
  if (c[0] === 'GRAD') return [225, 232, 215];
  if (c[0] === 'RGB') return c[1].map(Math.round);
  if (c[0] !== 'CMYK') return [128, 128, 128];
  const [C, M, Y, K] = c[1].map(v => v / 100);
  return [255 * (1 - C) * (1 - K), 255 * (1 - M) * (1 - K), 255 * (1 - Y) * (1 - K)].map(Math.round);
}
function gjHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
const gjMix = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
/** 시안 색 → 새 팔레트. kind: 'fill' | 'text' | 'line'. 흰색 · 회색은 종이 · 먹색으로, 유채색은 구역 두 색 가운데 가까운 쪽(따뜻한 색 → 보조색)으로 */
function gjColor(name, tint, th, kind) {
  const rgb = gjRgbOf(name);
  if (!rgb) return kind === 'text' ? GJ.ink : null;
  let [h, s, l] = gjHsl(rgb);
  if (tint != null && tint < 100) l = l + (1 - l) * (1 - tint / 100);
  if (l > .955 && s < .5 || l > .985) return kind === 'text' ? '#FFFFFF' : GJ.white;
  if (s < .14) {      // 회색 계열
    if (kind === 'text') return l < .45 ? GJ.ink : l < .75 ? GJ.sub : '#FFFFFF';
    return l < .3 ? GJ.ink : l < .62 ? GJ.sub : l < .86 ? GJ.line : GJ.oat;
  }
  const warm = h < 75 || h > 285, base = warm ? [th.b, th.bL, gjMix(th.b, '#000000', .32)] : [th.a, th.aL, th.aD];
  if (kind === 'text') return l > .8 ? '#FFFFFF' : l > .52 ? base[0] : base[2];
  return l > .8 ? base[1] : l > .45 ? base[0] : base[2];
}
const gjIsLight = hex => { const [, , l] = gjHsl([1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))); return l > .62; };

/* ---------- 좌표 ---------- */
const gjN = v => Math.round(v * 100) / 100;
/** 기울인 틀: 바깥 상자(bw×bh)와 각도에서 원래 크기를 구함 */
function gjUnrot(bw, bh, deg) {
  const q = Math.round(deg / 90), r = (deg - q * 90) * Math.PI / 180, c = Math.abs(Math.cos(r)), s = Math.abs(Math.sin(r)), d = c * c - s * s;
  let w = bw, h = bh;
  if (Math.abs(r) > 1e-4) { if (Math.abs(d) > .12) { w = (bw * c - bh * s) / d; h = (bh * c - bw * s) / d; } else { w = h = bw / (c + s); } }
  if (w <= 0 || h <= 0) { w = bw; h = bh; }
  return { w, h, tilt: deg - q * 90, q: ((q % 4) + 4) % 4 };
}
/** 쪽 안 위치 (mm → 쪽 폭 · 높이 기준 %). .safe(안쪽 7cqw) 안에 놓이므로 7cqw를 뺌 */
function gjBox(pg, cx, cy, w, h, rot = 0, extra = '') {
  const X = v => v / pg.w * 100, Y = v => v / pg.h * 100;
  return `left:calc(${gjN(X(cx - w / 2 - pg.x0))}cqw - 7cqw);top:calc(${gjN(Y(cy - h / 2 - pg.y0))}cqh - 7cqw);width:${gjN(X(w))}cqw;height:${gjN(Y(h))}cqh${rot ? `;transform:rotate(${gjN(-rot)}deg)` : ''}${extra}`;
}
const gjMm = (pg, mm) => gjN(mm / pg.w * 100);      // mm → cqw
const gjPt = (pg, pt) => gjN(pt * .3528 / pg.w * 100);

/* ---------- 쪽에 놓이는 것 고르기 ---------- */
const gjLinkName = im => gjL().links[im.li] || '';
const gjCovers = (pg, it) => (it.b[3] - it.b[1]) >= pg.w * .8 && (it.b[2] - it.b[0]) >= pg.h * .8;
function gjTree(pg) {
  const sp = gjL().spreads[pg.sp], kids = {}, tops = [];
  for (const it of sp.items) { if (it.par != null) (kids[it.par] ||= []).push(it); else tops.push(it); }
  const x0 = pg.x0, x1 = pg.x0 + pg.w;
  const on = it => { const ov = Math.min(it.b[3], x1) - Math.max(it.b[1], x0), w = it.b[3] - it.b[1]; return ov > Math.min(4, w * .5); };
  let list = tops.filter(on);
  // 시안에서 배경 그림 밑에 깔려 안 보이던 예전 틀은 뺌 (배경 그림을 새로 그리면서 드러나지 않게)
  let cut = -1;
  list.forEach((it, i) => { if (it.t === 'R' && gjCovers(pg, it)) { const im = gjImgOf(it, kids); if (im && !/롤링페이퍼\(/.test(gjLinkName(im))) cut = i; } });
  list = list.slice(cut + 1).filter(t => !gjIsFooter(t));
  // 같은 자리에 겹쳐 놓은 사진틀은 맨 위 것만
  const hidden = new Set(), last = {};
  const walk = it => {
    if (it.t === 'G') { (kids[it.id] || []).forEach(walk); return; }
    if (it.t === 'T' || it.t === 'L' || !gjImgOf(it, kids)) return;
    const k = it.b.map(v => Math.round(v)).join(',');
    if (last[k] != null) hidden.add(last[k]);
    last[k] = it.id;
  };
  list.forEach(walk);
  return { tops: list, kids, hidden };
}
/** 틀에 든 그림 (틀 안에 틀을 붙여 넣은 경우는 안쪽 틀의 그림) */
function gjImgOf(it, kids) {
  const ch = kids[it.id] || [], im = ch.find(k => k.t === 'I');
  if (im || it.t === 'G') return im;
  for (const k of ch) { if (k.t === 'R' || k.t === 'O' || k.t === 'P') { const x = gjImgOf(k, kids); if (x) return x; } }
  return null;
}
function gjIsDecorImg(pg, fr, im) {
  const name = gjLinkName(im);
  if (/롤링페이퍼\(/.test(name)) return false;
  return GJ.DROP.test(name) || /\.psd$/i.test(name) || gjCovers(pg, fr);
}
const gjIsFooter = it => it.b[0] > 296 && it.t !== 'I';      // 쪽 아래 쪽번호 자리 (시안의 쪽번호 묶음 · 띠)는 새 쪽번호로 바꿈
/* 글자 손질: 시안에서 글자틀 여러 개로 나눠 쓴 제목을 한 틀로 합치는 등 (인디자인 틀 번호 기준) */
const GJ_FIX = {
  29204: { tx: 'GYEONGBUK CULINARY\nARTS SCIENCE HIGH SCHOOL' }, 29181: { skip: true },
};
const gjDecorText = it => /^\s*graduation\s+anniversary\s+album\s*$/i.test(it.tx || '') || !(it.tx || '').trim();

/* ---------- 사진 구도: 틀과 그림 상자에서 앨범의 x · y · z 값을 계산 ---------- */
function gjCrop(fr, im) {
  const F = gjUnrot(fr.b[3] - fr.b[1], fr.b[2] - fr.b[0], fr.rot || 0);
  const irot = im.rot || 0, fx = !!im.fx;      // 쪽 기준 실제 각도 · 좌우 뒤집힘 (인디자인 변환 행렬에서 구한 값)
  // 그림 상자는 쪽 기준 각도로 돌아간 그림의 바깥 상자 → 쪽 기준 각도로 원래 크기를 풀고, 틀 안에서 90° 단위로 몇 번 돌았는지는 틀 기울기를 뺀 각도로 셈
  const A = gjUnrot(im.b[3] - im.b[1], im.b[2] - im.b[0], irot), qRel = ((Math.round((irot - F.tilt) / 90) % 4) + 4) % 4;
  const I = (qRel - A.q) % 2 ? { w: A.h, h: A.w, q: qRel } : { w: A.w, h: A.h, q: qRel };
  const fcx = (fr.b[1] + fr.b[3]) / 2, fcy = (fr.b[0] + fr.b[2]) / 2, icx = (im.b[1] + im.b[3]) / 2, icy = (im.b[0] + im.b[2]) / 2;
  const t = F.tilt * Math.PI / 180, dx0 = icx - fcx, dy0 = icy - fcy;
  const dx = dx0 * Math.cos(t) - dy0 * Math.sin(t), dy = dx0 * Math.sin(t) + dy0 * Math.cos(t);
  const left = F.w / 2 + dx - I.w / 2, top = F.h / 2 + dy - I.h / 2;
  const z = Math.min(I.w / F.w, I.h / F.h);
  const pos = (off, box, img) => (Math.abs(box - img) < .02 ? 50 : off / (box - img) * 100);
  // q: 사진을 시계 반대 방향으로 90°씩 돌린 횟수 (앨범 파일을 만들 때 사진 자체를 돌려 넣음)
  return { x: Math.round(pos(left, F.w, I.w) * 100) / 100, y: Math.round(pos(top, F.h, I.h) * 100) / 100, z: Math.round(z * 10000) / 10000, q: I.q, fx, ar: Math.round(I.w / I.h * 10000) / 10000, wmm: Math.round(I.w * 10) / 10 };      // wmm: 쪽에 놓인 사진 전체 폭(mm) → 인쇄 해상도 계산용
}
/** 앨범 파일을 만들 때 쓰는 사진 목록: [{ key, li, x, y, z, q, fx, ar }] */
function gjManifest() {
  const out = {}, L = gjL();
  for (const pg of L.pages) {
    const { tops, kids, hidden } = gjTree(pg);
    const walk = it => {
      if (it.t === 'G') { (kids[it.id] || []).forEach(walk); return; }
      const im = gjImgOf(it, kids);
      if (!im || hidden.has(it.id) || gjIsDecorImg(pg, it, im)) return;
      out[`gj-${it.id}`] ||= { key: `gj-${it.id}`, li: im.li, pdf: im.pdf ? 1 : 0, ...gjCrop(it, im) };
    };
    tops.forEach(walk);
  }
  return Object.values(out);
}

/* ---------- 글꼴 ---------- */
function gjFont(name, big) {
  const n = name || '';
  if (/Hyeki|62570|안단테/i.test(n)) return big ? 'gj-f-disp' : 'gj-f-hand';
  if (/명조|바탕|Serif|Hebrew/i.test(n)) return /Hebrew/i.test(n) || big ? 'gj-f-disp' : 'gj-f-serif';
  if (/Din|Helvetica|견고딕|헤드라인|SUITE|단정해/i.test(n)) return big ? 'gj-f-disp' : 'gj-f-cap';
  return 'gj-f-sans';
}
const gjLatin = s => !/[가-힣]/.test(s);

/* ---------- 쪽 그리기 ---------- */
function gjPageHtml(pg) {
  const th = gjTheme(pg.n), { tops, kids, hidden } = gjTree(pg), out = [];
  const shapes = [];      // 흰 글자 밑에 깔린 도형을 찾기 위한 기록 { b, dark, i }
  for (const d of gjDecor(pg, th)) {      // 배경의 짙은 면도 함께 기록
    if (!d.dark) continue;
    if (d.k === 'r') shapes.push({ b: [pg.y0 + d.y, pg.x0 + d.x, pg.y0 + d.y + d.h, pg.x0 + d.x + d.w], dark: true, i: -1 });
    else if (d.k === 'c') shapes.push({ b: [pg.y0 + d.cy - d.r * .75, pg.x0 + d.cx - d.r * .75, pg.y0 + d.cy + d.r * .75, pg.x0 + d.cx + d.r * .75], dark: true, i: -1 });
  }
  let png = 0;
  const zi = () => 10 + out.length;      // 겹침 순서 = 시안의 순서
  const cardTints = [th.aL, th.bL, GJ.oat, gjMix(th.aL, th.bL, .5)];
  const center = it => [(it.b[1] + it.b[3]) / 2, (it.b[0] + it.b[2]) / 2];

  const emitPhoto = (it, im) => {
    const [cx, cy] = center(it), F = gjUnrot(it.b[3] - it.b[1], it.b[2] - it.b[0], it.rot || 0), name = gjLinkName(im);
    const r = it.t === 'O' ? '50%' : it.cr ? `${gjMm(pg, Math.min(it.cr, F.w / 2, F.h / 2))}cqw` : (pg.m === 'Q' ? `${gjMm(pg, 1.6)}cqw` : pg.m === 'B' || pg.m === 'C' ? `${gjMm(pg, 1.2)}cqw` : '0');
    let cls = 'lf gj-ph', st = `;border-radius:${r}`;
    const pol = it.st === 'Paper' && it.sw >= 2;      // 흰 테두리 사진 (폴라로이드)
    if (pol) { cls += ' gj-pol'; st += `;--gj-bw:${gjPt(pg, it.sw)}cqw`; }
    if (/\.png$/i.test(name)) { cls += ' gj-cut'; st += `;--gj-card:${cardTints[png++ % cardTints.length]}`; }
    if (pg.m === 'S' && !pol) cls += ' gj-soft';
    if (pg.m === 'Q') cls += ' gj-mat';
    if (pg.n >= 82) cls += ' gj-sheet';
    if (gjDark(pg.n) && !pol) { cls += ' gj-ondark'; if (r === '0') st += `;border-radius:${gjMm(pg, 1.2)}cqw`; }
    if (pg.m === 'C') out.push(`<div class="gj-off" style="${gjBox(pg, cx + 3.2, cy + 3.2, F.w, F.h, F.tilt)};border-radius:${r};background:${off++ % 2 ? th.bL : th.aL}"></div>`);
    shapes.push({ b: it.b, photo: true, i: out.length });
    out.push(`<div class="${cls}" style="${gjBox(pg, cx, cy, F.w, F.h, F.tilt)}${st}">${P(`gj-${it.id}`)}</div>`);
  };
  let off = 0;
  const emitShape = it => {
    if (gjCovers(pg, it)) return;
    let fill = gjColor(it.fill, it.ft, th, 'fill');
    const stroke = it.st && it.sw ? gjColor(it.st, null, th, 'line') : null;
    if (!fill && !stroke) return;
    const [cx, cy] = center(it), F = gjUnrot(it.b[3] - it.b[1], it.b[2] - it.b[0], it.rot || 0);
    const rec = { b: it.b, dark: fill ? !gjIsLight(fill) : false, strokeOnly: !fill, i: out.length, it, F, cx, cy, fill, stroke };
    shapes.push(rec);
    out.push(rec);
  };
  const shapeHtml = rec => {
    const { it, F, cx, cy } = rec, r = it.t === 'O' ? '50%' : it.cr ? `${gjMm(pg, Math.min(it.cr, F.w / 2, F.h / 2))}cqw` : '0';
    const border = !rec.fill && rec.stroke ? `;border:${Math.max(.06, gjPt(pg, it.sw))}cqw solid ${rec.stroke}` : '';
    return `<div class="gj-sh" style="${gjBox(pg, cx, cy, F.w, F.h, F.tilt)};border-radius:${r}${rec.fill ? `;background:${rec.fill}` : ''}${border}${it.op != null ? `;opacity:${it.op / 100}` : ''}${rec.fill === GJ.white ? `;box-shadow:0 0 0 .08cqw ${GJ.line}` : ''}"></div>`;
  };
  const emitVector = it => {      // 선 · 다각형은 쪽 전체를 덮는 SVG 한 장에 mm 좌표로
    if (!it.path) return;
    const fill = it.t === 'P' ? gjColor(it.fill, it.ft, th, 'fill') : null, stroke = it.st && it.sw ? gjColor(it.st, null, th, 'line') : null;
    if (!fill && !stroke) return;
    const pt = p => (Array.isArray(p[0]) ? p : [p, p, p]);
    const P0 = it.path.map(pt), xy = p => `${gjN(p[0] - pg.x0)},${gjN(p[1] - pg.y0)}`;
    let d = `M${xy(P0[0][1])}`;
    for (let i = 1; i <= (it.t === 'P' ? P0.length : P0.length - 1); i++) { const a = P0[i - 1], b = P0[i % P0.length]; d += `C${xy(a[2])} ${xy(b[0])} ${xy(b[1])}`; }
    if (it.t === 'P') d += 'Z';
    if (fill && it.t === 'P') shapes.push({ b: it.b, dark: !gjIsLight(fill), i: out.length });
    out.push(`<svg class="gj-vec" viewBox="0 0 ${pg.w} ${pg.h}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" fill="${fill || 'none'}"${stroke ? ` stroke="${stroke}" stroke-width="${gjN(Math.max(.12, it.sw * .3528))}"` : ''}${it.op != null ? ` opacity="${it.op / 100}"` : ''}/></svg>`);
  };
  const texts = [];
  const emitText = it => {
    if (gjDecorText(it) || GJ_FIX[it.id]?.skip) return;
    texts.push({ it, i: out.length, z: zi() });
    out.push(null);
  };
  const walk = it => {
    if (it.t === 'G') { (kids[it.id] || []).forEach(walk); return; }
    if (it.t === 'T') return emitText(it);
    if (it.t === 'L') return emitVector(it);
    const im = gjImgOf(it, kids);
    if (im) { if (!hidden.has(it.id) && !gjIsDecorImg(pg, it, im)) emitPhoto(it, im); return; }
    if (it.t === 'P') { if (it.fill && it.fill !== 'None') emitVector(it); return; }      // 테두리만 있는 다각형(이름표 장식 선)은 뺌
    emitShape(it);
  };
  tops.forEach(walk);

  // 글자: 흰 글자가 밝은 바탕 위에 놓이면 밑에 색 띠를 깔거나(테두리만 있던 칸은 채움) 먹색으로 바꿈
  for (const t of texts) {
    const it = t.it, run = [...it.runs].sort((a, b) => b[0] - a[0])[0] || [0, '', 10, 'Black'], size = run[2] || 10;
    let tx = (GJ_FIX[it.id]?.tx || it.tx || '').replace(/\s+$/, '').replace(/^[ \t]+/, '');
    if (gjClassNo(pg.n) && /^3-\s*$/.test(tx)) tx = `3-${gjClassNo(pg.n)}`;
    const note = pg.n >= 82;      // 롤링페이퍼 쪽의 손글씨는 메모지 위에
    const big = size >= 22, latin = gjLatin(tx);
    let color = gjColor(run[3], null, th, 'text'), back = '';
    const [cx, cy] = center(it), F0 = gjUnrot(it.b[3] - it.b[1], it.b[2] - it.b[0], it.rot || 0), F = F0.q % 2 ? { w: F0.h, h: F0.w } : F0;      // 글자틀은 90° 돌린 것도 그대로 돌려 놓음
    // 글자가 실제로 놓이는 자리 (틀이 글보다 클 때가 많아 틀 가운데가 아니라 정렬 쪽에서 어림)
    const bw = it.b[3] - it.b[1], bh = it.b[2] - it.b[0], estW = Math.min(bw, [...tx.split('\n')[0]].reduce((a, ch) => a + (/[가-힣]/.test(ch) ? 1 : .58), 0) * size * .3528), estH = Math.min(bh, size * .3528 * 1.3 * Math.min(tx.split('\n').length, 3));
    const ax = it.rot || it.vert ? cx : it.ju === 'CENTER' ? cx : it.ju === 'RIGHT' ? it.b[3] - estW / 2 : it.b[1] + estW / 2;
    const ay = it.rot || it.vert ? cy : it.vj === 'CENTER' ? cy : it.vj === 'BOTTOM' ? it.b[2] - estH / 2 : it.b[0] + estH / 2;
    const under = shapes.filter(s => s.i < t.i).reverse().find(s => ax > s.b[1] && ax < s.b[3] && ay > s.b[0] && ay < s.b[2]);
    if (color === '#FFFFFF' && !(under && (under.dark || under.photo))) {
      if (under?.strokeOnly) { under.fill = th.a; under.stroke = null; under.dark = true; }
      else if (big || tx.length <= 12) color = big ? th.a : th.aD;
      else back = `;background:${th.a};padding:${gjMm(pg, 2.2)}cqw ${gjMm(pg, 2.6)}cqw;border-radius:${gjMm(pg, 1.2)}cqw`;
    } else if (color !== '#FFFFFF' && under?.dark) color = '#FFFFFF';
    const upper = latin && !/\d/.test(tx) && !/Hyeki|62570|안단테/i.test(run[1] || '');      // 영문 문구는 대문자 + 넓은 자간으로 통일
    const fcls = upper ? (size >= 20 ? 'gj-f-disp' : 'gj-f-cap') : gjFont(run[1], big && tx.length <= 14);
    const lh = /^\d/.test(String(run[4])) && size ? Math.max(1, Math.min(2.4, +run[4] / size)) : (tx.includes('\n') || tx.length > 40 ? 1.62 : 1.25);
    const ju = { CENTER: 'center', RIGHT: 'right', FULLY: 'justify', LEFT: 'left' }[it.ju] || 'left';
    const vj = { CENTER: 'center', BOTTOM: 'flex-end' }[it.vj] || 'flex-start';
    const tall = !latin && tx.length <= 12 && bw < size * .3528 * 1.7 && bh > bw * 2.4;      // 좁고 긴 틀에 한 글자씩 내려 쓴 글 → 세로쓰기
    const vert = it.vert || tall ? ';writing-mode:vertical-rl' : '';
    const fs = gjPt(pg, size * (fcls === 'gj-f-disp' ? 1.06 : fcls === 'gj-f-hand' ? 1.12 : .96));
    if (note) { color = GJ.ink; back = `;background:#FFF3C4;padding:${gjMm(pg, 3)}cqw;box-shadow:0 .25cqw .9cqw rgba(60,45,30,.2);justify-content:center`; }
    // 오른쪽 맞춤 글 끝에 넣어 둔 빈칸(시안에서 글을 안쪽으로 들이려고 넣은 것)은 오른쪽 여백으로 살림
    const tail = it.ju === 'RIGHT' && !it.vert ? ((GJ_FIX[it.id]?.tx || it.tx || '').match(/ +$/) || [''])[0].length : 0, padR = tail ? `;padding-right:${gjN(tail * .3)}em` : '';
    // 한 줄짜리 짧은 글은 줄이 바뀌지 않게 (틀보다 길면 글자 크기를 줄여 맞춤)
    const oneLine = !it.vert && !tall && (GJ_FIX[it.id]?.tx || (!tx.includes('\n') && tx.length <= 30 && (it.rot ? F.h : bh) < size * .3528 * 3.6)) ? ';white-space:pre' : '';
    const trk = upper ? (size >= 20 ? '.1em' : '.16em') : fcls === 'gj-f-cap' ? '.14em' : fcls === 'gj-f-disp' ? '.01em' : `${gjN(Math.max(-.03, Math.min(.2, (run[5] || 0) / 1000)))}em`;
    const style = `font-size:${fs}cqw;line-height:${gjN(lh)};color:${color};text-align:${note ? 'center' : ju};letter-spacing:${trk}${oneLine}${padR}`;
    const multi = it.runs.length > 1 && it.runs.some(r => Math.abs(r[2] - size) / size > .12);
    let inner;
    if (multi) {      // 크기가 다른 글자가 섞인 틀 (이름 크게 + 직함 작게 등)
      let at = 0;
      inner = `<div class="gj-tx ${fcls}${upper ? ' gj-up' : ''}" style="${style}">` + it.runs.map(r => { const s = (it.tx || '').substr(at, r[0]); at += r[0]; const k = Math.round(r[2] / size * 10) * 10; return k === 100 ? esc(s) : `<span class="gj-r${Math.max(40, Math.min(220, k))}">${esc(s)}</span>`; }).join('').replace(/\s+$/, '') + '</div>';
    } else inner = E(`gj-t${it.id}`, tx, `gj-tx ${fcls}${upper || fcls === 'gj-f-cap' ? ' gj-up' : ''}`).replace('<div ', `<div style="${style}" `);
    out[t.i] = `<div class="lt gj-lt" style="${tall ? gjBox(pg, cx, cy, bw, bh) : gjBox(pg, cx, cy, F.w, F.h, it.rot || 0)};justify-content:${vj}${vert}${back}">${inner}</div>`;
  }
  // 겹침 순서는 문서에 놓인 차례 그대로 (z-index를 쓰지 않아야 앱에서 새로 그린 틀 · 옮긴 틀이 위로 올라옴)
  return out.map(o => (o == null ? '' : typeof o === 'string' ? o : shapeHtml(o))).join('') + (GJ_EXTRA[pg.n]?.(pg, th) || '') + gjChrome(pg, th);
}
/* 시안에서는 배경 그림 속에 그려져 있던 글 (교훈 · 교장 선생님 이름): 배경을 새로 그렸으므로 글자로 다시 넣음. 좌표는 쪽 기준 mm */
const gjXT = (pg, key, def, x, y, w, h, cls, style, vj = 'center') => `<div class="lt gj-lt" style="${gjBox(pg, pg.x0 + x + w / 2, pg.y0 + y + h / 2, w, h)};justify-content:${vj}">${E(key, def, `gj-tx ${cls}`).replace('<div ', `<div style="${style}" `)}</div>`;
const GJ_EXTRA = {
  2: (pg, th) => gjXT(pg, 'gj-x-51', '51st', 14, 126, 96, 30, 'gj-f-disp', `font-size:${gjPt(pg, 78)}cqw;color:${th.aD};letter-spacing:-.01em`, 'flex-end') +
    gjXT(pg, 'gj-x-ga', 'GRADUATION ALBUM', 15, 159, 96, 8, 'gj-f-cap', `font-size:${gjPt(pg, 13.5)}cqw;letter-spacing:.34em;color:${th.a}`) +
    `<div class="gj-sh" style="${gjBox(pg, pg.x0 + 15.5 + 17, pg.y0 + 172, 34, .35)};background:${th.b}"></div>` +
    gjXT(pg, 'gj-x-slogan', '함께한 시간은\n언제나 빛난다', 15, 177, 96, 20, 'gj-f-serif', `font-size:${gjPt(pg, 12.5)}cqw;line-height:1.75;letter-spacing:.18em;color:${GJ.ink}`, 'flex-start'),
  3: (pg, th) => gjXT(pg, 'gj-x-story', 'OUR SCHOOL · OUR STORY', 120, 17, 119, 7, 'gj-f-cap', `font-size:${gjPt(pg, 9)}cqw;letter-spacing:.34em;text-align:right;color:${th.a}`) +
    gjXT(pg, 'gj-x-school', '경북조리과학고등학교', 13, 277, 150, 9, 'gj-f-serif', `font-size:${gjPt(pg, 15)}cqw;font-weight:700;letter-spacing:.08em;color:${th.aD}`) +
    gjXT(pg, 'gj-x-school-en', 'GYEONGBUK CULINARY ARTS SCIENCE HIGH SCHOOL', 13, 286, 180, 6, 'gj-f-cap', `font-size:${gjPt(pg, 7.5)}cqw;letter-spacing:.26em;color:${th.a}`),
  4: (pg, th) => `<div class="gj-sh" style="${gjBox(pg, pg.x0 + 13.6, pg.y0 + 27.5, 1.6, 21)};background:${th.b}"></div>` +
    gjXT(pg, 'gj-x-motto-cap', 'SCHOOL MOTTO · 교훈', 18, 17, 100, 6, 'gj-f-cap', `font-size:${gjPt(pg, 8.5)}cqw;letter-spacing:.24em;color:${th.a}`) +
    gjXT(pg, 'gj-x-motto', '부지런히 배우고 바르게 살자', 18, 23.5, 108, 14, 'gj-f-serif', `font-size:${gjPt(pg, 23)}cqw;font-weight:700;letter-spacing:.04em;color:${th.aD}`),
  5: (pg, th) => gjXT(pg, 'gj-x-principal', '강미경 교장선생님', 60, 286.5, 80, 10, 'gj-f-serif', `font-size:${gjPt(pg, 16)}cqw;font-weight:700;text-align:center;letter-spacing:.06em;color:${GJ.ink}`),
};

/* ---------- 쪽 번호 · 머리글 (모든 쪽 공통) ---------- */
function gjChrome(pg, th) {
  const left = pg.n % 2 === 0, no = String(pg.n).padStart(2, '0');
  const folio = pg.n === 1 || pg.n >= 82 ? '' : `<div class="gj-folio ${left ? 'gj-l' : 'gj-r'}" contenteditable="false" style="color:${th.aD}"><b>${no}</b><i style="background:${th.a}"></i><span>GYEONGBUK CULINARY ARTS SCIENCE HIGH SCHOOL · THE 51ST GRADUATION</span></div>`;
  if (gjDark(pg.n)) {      // 추억 첫 펼침면: 머리글에 장 번호
    const c = th.aD, ln = 'rgba(111,82,22,.3)';
    return `<div class="gj-folio ${left ? 'gj-l' : 'gj-r'}" contenteditable="false" style="color:${c}"><b>${no}</b><i style="background:${th.a}"></i><span>GYEONGBUK CULINARY ARTS SCIENCE HIGH SCHOOL · THE 51ST GRADUATION</span></div>` +
      `<div class="gj-head ${left ? 'gj-l' : 'gj-r'}" contenteditable="false" style="color:${c}"><i style="background:${th.a}"></i><span>${left ? `OUR MEMORIES · CHAPTER 0${gjChapter(pg.n)}` : 'CLASS OF 2026'}</span><u style="background:${ln}"></u></div>`;
  }
  let head = '';
  if (pg.m === 'B' && pg.n >= 4) head = `<div class="gj-head ${left ? 'gj-l' : 'gj-r'}" contenteditable="false" style="color:${th.aD}"><i style="background:${th.b}"></i><span>${left ? 'FACULTY &amp; STAFF' : '경북조리과학고등학교 교직원'}</span><u style="background:${GJ.line}"></u></div>`;
  if (pg.m === 'K' && pg.n <= 81) head = `<div class="gj-head ${left ? 'gj-l' : 'gj-r'}" contenteditable="false" style="color:${th.aD}"><i style="background:${th.a}"></i><span>${left ? 'OUR MEMORIES' : 'CLASS OF 2026'}</span><u style="background:${GJ.line}"></u></div>`;
  if (pg.n >= 82) head = `<div class="gj-head gj-mid" contenteditable="false" style="color:${th.aD}"><u style="background:${GJ.line}"></u><i style="background:${th.a}"></i><span>ROLLING PAPER · 3-${pg.n - 81}</span><i style="background:${th.a}"></i><u style="background:${GJ.line}"></u></div>`;
  return folio + head;
}

/* ---------- 배경 장식 ----------
   쪽 종류마다 큰 원 · 띠 · 점 무늬. 좌표는 쪽 기준 mm (재단선 안쪽 왼쪽 위가 0,0). ox: 책 바깥쪽 가장자리에서 잰 x.
   dark: 그 위의 글자를 흰색으로 둘 짙은 면 */
function gjDecor(pg, th) {
  const n = pg.n, left = n % 2 === 0, W = pg.w, D = [];
  const ox = (x, w = 0) => (left ? x : W - x - w);
  const R = (x, y, w, h, c, o = {}) => D.push({ k: 'r', x, y, w, h, c, ...o });
  const OR = (x, y, w, h, c, o = {}) => R(ox(x, w), y, w, h, c, o);
  const C = (cx, cy, r, c, o = {}) => D.push({ k: 'c', cx: ox(cx), cy, r, c, ...o });
  const RING = (cx, cy, r, c, sw = .25) => D.push({ k: 'ring', cx: ox(cx), cy, r, c, sw });
  const DOTS = (x, y, cols, rows, c, gap = 3.2) => { for (let i = 0; i < cols * rows; i++) D.push({ k: 'c', cx: ox(x + (i % cols) * gap), cy: y + Math.floor(i / cols) * gap, r: .42, c }); };
  if (n === 1) {      // 연혁: 왼쪽 위 51st 원 + 가운데 세로 띠(연도)
    D.push({ k: 'c', cx: 36, cy: 14, r: 47, c: th.aD, dark: true }, { k: 'ring', cx: 36, cy: 14, r: 51.5, c: th.b, sw: .3 });
    R(132.5, -3, 26, 321, th.aD, { dark: true }); R(158.5, -3, 1, 321, th.b);
  } else if (n <= 3) {      // 학교 전경
    OR(-3, -3, 9, 321, th.aL); C(250, 304, 44, th.bL, { o: .8 }); RING(250, 304, 50, th.b); DOTS(10, 302, 6, 2, th.a);
  } else if (pg.m === 'B') {
    C(-6, 322, 54, th.aL, { o: .75 }); RING(-6, 322, 60, th.a, .22);
  } else if (pg.m === 'C') {
    OR(-3, -3, 256, 9, th.a); C(-4, 318, 30, th.aL, { o: .9 }); RING(-4, 318, 35, th.a); DOTS(11, 292, 5, 3, th.b);
  } else if (pg.m === 'P') {
    C(0, 0, 92, th.aL, { o: .7 }); RING(0, 0, 99, th.a, .22); C(250, 318, 58, th.bL, { o: .85 }); DOTS(232, 14, 3, 5, th.a);
  } else if (pg.m === 'Q') {
    R(-3, 118.5, W + 6, 31, th.aL); R(-3, 118.5, W + 6, .5, th.a); R(-3, 149, W + 6, .5, th.a); C(0, 315, 40, th.bL, { o: .8 }); DOTS(8, 8, 5, 2, th.a);
  } else if (pg.m === 'S') {
    OR(-3, -3, 9, 321, th.aL); C(250, 0, 62, th.bL, { o: .75 }); RING(250, 0, 69, th.b, .22); C(236, 318, 44, th.aL, { o: .7 });
  } else if (gjDark(n)) {      // 추억 첫 펼침면: 옅은 버터색 바탕 위에 흰 테두리 사진을 전시하듯
    R(-3, -3, W + 6, 321, th.aL); OR(-3, -3, 256, 5.2, th.a); C(250, 320, 40, GJ.paper, { o: .85 }); RING(250, 320, 46, th.a, .3); C(0, 0, 34, GJ.paper, { o: .6 }); DOTS(232, 300, 4, 2, th.a);
  } else if (n <= 81) {      // 추억
    OR(-3, -3, 256, 5.2, th.a); C(250, 320, 36, th.aL, { o: .9 });
  } else {      // 롤링페이퍼
    R(-3, -3, W + 6, 321, th.bL); R(9, 9, W - 18, 297, GJ.paper, { rx: 5 }); C(0, 0, 60, th.aL, { o: .9 }); RING(0, 0, 67, th.a); C(250, 316, 52, th.aL, { o: .9 }); DOTS(14, 298, 8, 2, th.a);
  }
  return D;
}
/** 배경 SVG (단위 0.1mm · 재단 여백 포함) */
function gjBg(kind) {
  const n = +kind.slice(5), pg = gjL().pages[n - 1], th = gjTheme(n), { W, H } = G;
  const bp = (S.bleed ? BLEED : 0) * 10, kx = (W - 2 * bp) / (pg.w * 10);
  const X = mm => f(bp + mm * 10 * kx), Y = mm => f(bp + mm * 10), U = mm => f(mm * 10);
  const o = d => (d.o != null && d.o < 1 ? ` opacity="${d.o}"` : '');
  let s = `<rect width="${W}" height="${H}" fill="${GJ.paper}"/>`;
  for (const d of gjDecor(pg, th)) {
    if (d.k === 'r') s += `<rect x="${X(d.x)}" y="${Y(d.y)}" width="${U(d.w)}" height="${U(d.h)}"${d.rx ? ` rx="${U(d.rx)}"` : ''} fill="${d.c}"${o(d)}/>`;
    else if (d.k === 'c') s += `<circle cx="${X(d.cx)}" cy="${Y(d.cy)}" r="${U(d.r)}" fill="${d.c}"${o(d)}/>`;
    else s += `<circle cx="${X(d.cx)}" cy="${Y(d.cy)}" r="${U(d.r)}" fill="none" stroke="${d.c}" stroke-width="${U(d.sw)}"/>`;
  }
  return `<svg class="bg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${s}</svg>`;
}

/* ---------- 글자 넘침 맞춤: 글꼴이 시안과 달라 틀을 넘치면 글자 크기를 조금씩 줄임 (틀을 직접 옮긴 글자는 그대로) ---------- */
function gjFit() {
  document.querySelectorAll('.page[data-kind^="k-gj-"] .gj-lt').forEach(lt => {
    const tx = lt.firstElementChild;
    if (!tx || tx.classList.contains('fr-placed') || !lt.clientWidth) return;
    const base = tx.dataset.fs0 || (tx.dataset.fs0 = tx.style.fontSize);
    let fs = parseFloat(base);
    if (!fs) return;
    tx.style.fontSize = base;
    const vert = lt.style.writingMode === 'vertical-rl';
    const over = () => (vert ? tx.offsetWidth > lt.clientWidth * 1.15 + 2 || tx.scrollHeight > lt.clientHeight + 2 : tx.offsetHeight > lt.clientHeight * 1.15 + 2 || tx.scrollWidth > lt.clientWidth + 2);
    for (let k = 0; k < 9 && over(); k++) { fs *= .94; tx.style.fontSize = `${fs.toFixed(3)}cqw`; }
  });
}
let gjFitTimer = 0;
const gjFitSoon = () => { clearTimeout(gjFitTimer); gjFitTimer = setTimeout(gjFit, 30); };
document.fonts?.ready?.then(gjFitSoon);

function gjPages() {
  const L = gjL();
  if (!L) return [];
  gjFitSoon();
  return L.pages.map(pg => layPage(`k-gj-${pg.n}`, gjLabel(pg), [`k-gj-${pg.n}`, []], gjPageHtml(pg), { run: false, folio: false }));
}
window.gjPages = gjPages;
window.gjBg = gjBg;
window.gjManifest = gjManifest;
window.gjFit = gjFit;
