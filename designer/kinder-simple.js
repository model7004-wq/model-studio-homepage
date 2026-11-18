/* ============================================================
   유치원 템플릿 「심플한 스타일 (모전)」
   흰 · 크림 바탕에 둥근 사각 사진틀, 쪽 귀퉁이에만 작은 그림(해 · 구름 · 별 · 크레파스 · 연필 · 지구 · 새싹 · 왕관 …).
   쪽 순서: 흰 백지 · 표지(2쪽) · 개인 사진 펼침 · 선생님 + 단체 / 반 원아 · 조 단체사진 4장(마스터) · 활동 사진 펼침 4개.
   사진 키는 기본 템플릿과 같은 것을 먼저 써서 템플릿을 바꿔도 사진이 따라감 (모자라는 칸은 km-0~ 새 키).
   그림은 모두 SVG로 직접 그려 인쇄해도 선명함. 앨범 설정 kTemplate: 'simple'
   ============================================================ */
const SM_ALL_SLOTS = [...K_EVENT_SLOTS, ...Array.from({ length: 14 }, (_, i) => `km-${i}`)];      // 앞 4개는 7 · 8쪽 조 단체사진, 나머지는 9~16쪽 활동 사진
const SM_EVENT_SLOTS = SM_ALL_SLOTS.slice(4);
window.SM_EVENT_SLOTS = SM_EVENT_SLOTS;      // kinder.js에서 행사 사진 넣을 자리 목록으로 씀
// 활동 쪽 틀 테두리: 크림 바탕과 어울리는 흐린 파스텔 11색 (세이지 · 라일락 · 살구 · 장미 · 버터 · 하늘 · 민트 · 복숭아 · 연보라 · 산호 · 모래)
const SM_PAL = ['#D3D7B0', '#D2D0EA', '#F3CBB0', '#EFC4C8', '#F2DE9E', '#C6DCEC', '#C8E0CF', '#F5D2A8', '#DCCFE6', '#F1BFAE', '#E6D3B3'];
const SM = { beige: '#F3EADB', sage: '#D3D7B0', lilac: '#D2D0EA', gold: '#EFCB8E', tag: '#E3D9C7', ink: '#4E4B48', paper: '#FDF6E9' };

/* ---------- 작은 그림 (배경 좌표) ---------- */
function smStar(x, y, r, c, rot = -8) {
  const p = Array.from({ length: 10 }, (_, i) => { const a = (rot - 90 + i * 36) * Math.PI / 180, k = i % 2 ? r * .48 : r; return `${f(x + Math.cos(a) * k)},${f(y + Math.sin(a) * k)}`; });
  return `<path d="M${p.join('L')}Z" fill="${c}" stroke="${c}" stroke-width="${f(r * .28)}" stroke-linejoin="round"/>`;
}
const smG = (x, y, ang, inner) => `<g transform="translate(${f(x)},${f(y)}) rotate(${ang})">${inner}</g>`;
function smCrayon(x, y, L, ang, c = '#A9C8EE', dk = '#5C86C7') {
  const w = L * .2;
  return smG(x, y, ang, `<rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${f(L * .82)}" height="${f(w)}" rx="${f(w * .2)}" fill="${c}"/><path d="M${f(L * .32)},${f(-w / 2)} L${f(L / 2)},0 L${f(L * .32)},${f(w / 2)}Z" fill="${dk}"/>` +
    [.05, .16].map(t => `<rect x="${f(-L / 2 + L * t)}" y="${f(-w / 2)}" width="${f(L * .045)}" height="${f(w)}" fill="${dk}"/>`).join(''));
}
function smPencil(x, y, L, ang) {
  const w = L * .17;
  return smG(x, y, ang, `<rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${f(L * .74)}" height="${f(w)}" fill="#F6D45C"/><rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${f(L * .74)}" height="${f(w * .33)}" fill="#F0BE3A"/>` +
    `<path d="M${f(L * .24)},${f(-w / 2)} L${f(L * .46)},0 L${f(L * .24)},${f(w / 2)}Z" fill="#F7E2BF"/><path d="M${f(L * .4)},${f(-w * .14)} L${f(L / 2)},0 L${f(L * .4)},${f(w * .14)}Z" fill="#6B6B6B"/><rect x="${f(-L / 2 - L * .08)}" y="${f(-w / 2)}" width="${f(L * .08)}" height="${f(w)}" rx="${f(w * .25)}" fill="#F2A7B5"/>`);
}
function smBrush(x, y, L, ang) {
  const w = L * .09;
  return smG(x, y, ang, `<rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${f(L * .6)}" height="${f(w)}" rx="${f(w / 2)}" fill="#E0B07E"/><rect x="${f(L * .1)}" y="${f(-w * .7)}" width="${f(L * .12)}" height="${f(w * 1.4)}" fill="#7DA7D9"/>` +
    `<path d="M${f(L * .22)},${f(-w * .8)} Q${f(L * .45)},${f(-w * 1.4)} ${f(L / 2)},0 Q${f(L * .45)},${f(w * 1.4)} ${f(L * .22)},${f(w * .8)}Z" fill="#7FB77E"/>`);
}
function smEarth(x, y, r) {
  return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#8CC6EE"/><path d="M${f(x - r * .7)},${f(y - r * .45)} q${f(r * .3)},${f(-r * .35)} ${f(r * .6)},${f(-r * .1)} q${f(r * .15)},${f(r * .3)} ${f(-r * .1)},${f(r * .45)} q${f(-r * .35)},${f(r * .1)} ${f(-r * .5)},${f(-r * .35)}Z" fill="#7FB77E"/>` +
    `<path d="M${f(x + r * .15)},${f(y - r * .1)} q${f(r * .45)},${f(-r * .2)} ${f(r * .7)},${f(r * .15)} q${f(-r * .05)},${f(r * .45)} ${f(-r * .45)},${f(r * .5)} q${f(-r * .3)},${f(-r * .2)} ${f(-r * .25)},${f(-r * .65)}Z" fill="#7FB77E"/>`;
}
function smLeaf(x, y, s, ang, c = '#9CC48D') {
  return smG(x, y, ang, `<path d="M0,0 Q${f(s * .55)},${f(-s * .5)} ${f(s)},0 Q${f(s * .55)},${f(s * .5)} 0,0Z" fill="${c}"/>`);
}
function smSprout(x, y, s) {      // x, y: 줄기 아래
  return `<path d="M${f(x)},${f(y)} Q${f(x - s * .05)},${f(y - s * .45)} ${f(x)},${f(y - s * .7)}" stroke="#7FB77E" stroke-width="${f(s * .07)}" fill="none" stroke-linecap="round"/>` +
    smLeaf(x, y - s * .68, s * .6, -150, '#8CC48A') + smLeaf(x, y - s * .68, s * .55, -35, '#8CC48A');
}
function smBlocks(x, y, s) {      // x: 가운데, y: 바닥
  return `<rect x="${f(x - s * 1.25)}" y="${f(y - s * .9)}" width="${f(s * .8)}" height="${f(s * .9)}" fill="#F5B7BE"/><path d="M${f(x - s * .4)},${f(y)} A${f(s * .4)},${f(s * .4)} 0 0 1 ${f(x + s * .4)},${f(y)}Z" fill="#A9A6A3"/>` +
    `<rect x="${f(x + s * .45)}" y="${f(y - s * 1.05)}" width="${f(s * .8)}" height="${f(s * 1.05)}" fill="#9CC3E6"/><rect x="${f(x - s * .45)}" y="${f(y - s * .58)}" width="${f(s * .5)}" height="${f(s * .1)}" fill="#F2CF78"/>`;
}
function smCrown(x, y, s, c = '#F2C55C') {
  const sw = f(s * .09);
  const rays = [[-1.15, -.55, -1.45, -.75], [-.6, -1.05, -.75, -1.35], [0, -1.15, 0, -1.5], [.6, -1.05, .75, -1.35], [1.15, -.55, 1.45, -.75]]
    .map(([a, b, c2, d]) => `<path d="M${f(x + a * s)},${f(y + b * s)} L${f(x + c2 * s)},${f(y + d * s)}" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>`).join('');
  return `<path d="M${f(x - s * .6)},${f(y + s * .45)} L${f(x - s * .7)},${f(y - s * .45)} L${f(x - s * .25)},${f(y - s * .05)} L${f(x)},${f(y - s * .6)} L${f(x + s * .25)},${f(y - s * .05)} L${f(x + s * .7)},${f(y - s * .45)} L${f(x + s * .6)},${f(y + s * .45)}Z" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linejoin="round"/>${rays}`;
}
const smCloud = (x, y, r, c = '#B9D7F0') => kCloud(x, y, r, c, c);
const smCloudLine = (x, y, r) => kCloud(x, y, r, 'none', '#A9CDEB');
const smRays = (x, y, r, c = '#F2C55C') => Array.from({ length: 8 }, (_, i) => { const a = (i * 45 + 20) * Math.PI / 180; return `<path d="M${f(x + Math.cos(a) * r * 1.35)},${f(y + Math.sin(a) * r * 1.35)}L${f(x + Math.cos(a) * r * 1.75)},${f(y + Math.sin(a) * r * 1.75)}" stroke="${c}" stroke-width="${f(r * .16)}" stroke-linecap="round"/>`; }).join('');
const smSmile = (x, y, r) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#F8D877"/>${smRays(x, y, r)}${cuFace(x, y, r * .9, '#8A5A2E')}`;

/* ---------- 쪽 배경 ---------- */
function simpleBg(kind) {
  const { W, H } = G, X = v => v * W, Y = v => v * H, R = v => v * W;
  let s = '', paper = SM.paper;
  switch (kind) {
    case 'k-sm-blank':
      paper = '#FFFFFF';
      break;
    case 'k-sm-cover':
      paper = '#FFFFFF';
      s += `<defs><radialGradient id="sm-glow" cx="${f(X(.64))}" cy="${f(Y(.53))}" r="${f(R(.42))}" gradientUnits="userSpaceOnUse" gradientTransform="translate(${f(X(.64))},${f(Y(.53))}) scale(1,1.45) translate(${f(-X(.64))},${f(-Y(.53))})"><stop offset="0" stop-color="#F7EDE4"/><stop offset=".55" stop-color="#FAF4EE"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#sm-glow)"/>`;
      break;
    case 'k-sm-profL': case 'k-sm-profR': case 'k-sm-eventL': case 'k-sm-eventR': case 'k-sm-class':
      paper = '#FDFAF5';
      break;
    case 'k-sm-kids':
      paper = '#FDFAF5';
      s += `<path d="M${f(X(.77))},0 H${W} V${f(Y(.205))} H${f(X(.975))} Q${f(X(.94))},${f(Y(.205))} ${f(X(.94))},${f(Y(.16))} V${f(Y(.125))} Q${f(X(.94))},${f(Y(.09))} ${f(X(.9))},${f(Y(.09))} H${f(X(.81))} Q${f(X(.77))},${f(Y(.09))} ${f(X(.77))},${f(Y(.05))}Z" fill="#EEF1D6"/>`;
      break;
    case 'k-sm-a1L':
      s += kSun(X(.48), Y(.058), R(.026)) + smCloud(X(.75), Y(.06), R(.05)) + cuHeart(X(.025), Y(.73), R(.03), '#F7B4BC') + smStar(X(.015), Y(.86), R(.022), '#A9CC95') + smCrayon(X(.45), Y(.955), R(.13), 28);
      break;
    case 'k-sm-a1R':
      s += smStar(X(.855), Y(.03), R(.022), '#F6CD5A') + smStar(X(.985), Y(.055), R(.02), '#A9CCEE') + cuDaisy(X(.61), Y(.955), R(.018)) + smPencil(X(.76), Y(.965), R(.11), -32) + smStar(X(.985), Y(.93), R(.02), '#F5B3BF');
      break;
    case 'k-sm-a2L':
      s += smEarth(X(.78), Y(.07), R(.05)) + smStar(X(.04), Y(.14), R(.022), '#F6CD5A') + smStar(X(.045), Y(.885), R(.022), '#9CC3EE') + smStar(X(.82), Y(.96), R(.022), '#F29A8E') + smSprout(X(.985), Y(.47), R(.075));
      break;
    case 'k-sm-a2R':
      s += smCloud(X(.665), Y(.05), R(.065)) + kSun(X(.93), Y(.08), R(.032)) + smStar(X(.97), Y(.78), R(.016), '#8CC48A') + smBrush(X(.92), Y(.93), R(.13), -55);
      break;
    case 'k-sm-a3L':
      s += smSmile(X(.865), Y(.068), R(.036)) + cuDaisy(X(.02), Y(.89), R(.02)) + smLeaf(X(.02), Y(.94), R(.025), -30) + smStar(X(.625), Y(.95), R(.016), '#F6CD5A') + smBlocks(X(.81), Y(.995), R(.05));
      break;
    case 'k-sm-a3R':
      s += smCloud(X(.975), Y(.72), R(.045)) + cuDaisy(X(.985), Y(.9), R(.02)) + smLeaf(X(.985), Y(.95), R(.025), -150);
      break;
    case 'k-sm-a4L':
      s += smSmile(X(.1), Y(.085), R(.032)) + kTulip(X(.035), Y(.85), R(.028), '#F5A3A8', .1) + smLeaf(X(.02), Y(.84), R(.03), -60);
      break;
    case 'k-sm-a4R':
      s += smCrown(X(.495), Y(.07), R(.04)) + smCloudLine(X(.89), Y(.1), R(.06)) + smStar(X(.975), Y(.255), R(.022), '#F6CD5A') + smLeaf(X(.975), Y(.77), R(.035), -60) + smLeaf(X(.0), Y(.74), R(.03), -110);
      break;
  }
  return `<svg class="bg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><rect width="${W}" height="${H}" fill="${paper}"/>${s}</svg>`;
}

/* ---------- 쪽 구성 ---------- */
const smLF = (key, box, cls, col = '') => LF(key, box, `sm-${cls}`).replace(' style="', ` style="${col ? `--sm:${col};` : ''}`);
function smTeachers(classes) {
  const list = (window.cuTeacherList ? cuTeacherList(classes) : []);
  const cols = 5, x0 = 13.5, gx = 1, cw = (100 - 2 * x0 - gx * (cols - 1)) / cols, ch = Math.min(17.4, cw * 1.39 / G.aspect), rowH = ch + 4.6, y0 = 11.5;
  let html = '';
  for (let i = 0; i < 10; i++) {
    const t = list[i] || { key: `k-tch-${i}`, name: '선생님' };
    const x = x0 + (i % cols) * (cw + gx), y = y0 + Math.floor(i / cols) * rowH;
    html += smLF(t.key, [x, y, x + cw, y + ch], 'tag') + LT([x - 1, y + ch + .6, x + cw + 1, y + ch + 4], E(`k-sm-tch-${i}`, t.name, 'sm-name'), 'lcenter');
  }
  return html;
}
/** 2쪽 원 이름: 사진틀 가운데에 맞춤. 이미 옮긴 제목(오른쪽 맞춤으로 저장됨)도 한 번 사진틀 가운데 · 가운데 맞춤으로 바꿈 → 화면 · PDF가 같음 */
function smCenterTitle() {
  const te = S.frameEdits?.text, over = S.frameEdits?.over || {};
  if (!te) return;
  for (const [id, b] of Object.entries(te)) {
    if (!id.endsWith('|k-sm-title') || b.smc || b.x == null) continue;
    const pid = id.slice(0, id.indexOf('|')), fo = Object.entries(over).find(([k, v]) => k.startsWith(`${pid}|`) && /cover/.test(k) && v?.x != null)?.[1];
    const c = fo ? fo.x + fo.w / 2 : 64.3, w = Math.min(b.w || 71.4, 2 * Math.min(c, 100 - c));
    Object.assign(b, { x: c - w / 2, w, smc: 1 });
    if (b.font) b.font.ta = 'center';
  }
}
function simplePages(classes) {
  smCenterTitle();
  const kidNames = classes.flatMap(c => c.students).map(s => s.name).filter(Boolean);
  const pk = (kind, def) => (S.kPersonal && kidNames[0] ? kpKey(kind, kidNames[0]) : def);
  const ev = key => pk(`ev-${key}`, key);
  const kp = (kind, label, html) => layPage(kind, label, [kind, ['butter', 'peach', 'sage']], html, { run: false, folio: false });
  const school = S.school || '유치원';
  let n = 0;
  const slot = () => ev(SM_ALL_SLOTS[n++]);
  const act = (boxes, col = SM.beige, cols = []) => boxes.map((b, i) => smLF(slot(), b, 'box', cols[i] || col)).join('');
  let tn = 0;
  const tint = boxes => boxes.map(b => smLF(slot(), b, 'box', SM_PAL[(tn++ * 3) % SM_PAL.length])).join('');      // 틀마다 다른 색 (3칸씩 건너뛰어 이웃한 틀끼리 색이 겹치지 않게)
  const pages = [];
  // 1쪽: 흰 백지 (1 · 2쪽이 한 펼침)
  pages.push({ ...kp('k-sm-blank', '백지', ''), pairFirst: true });
  // 2쪽 (오른쪽): 학년도 + 원 이름 · 사진 한 장
  pages.push(kp('k-sm-cover', '표지', `
    ${LT([28.6, 9, 100, 17.2], E('k-sm-title', `${S.year}${school}`, 'sm-title'), 'lcenter')}
    ${smLF(pk('cover', 'k-cover'), [39.7, 18.5, 88.9, 88], 'line')}
    ${S.kPersonal && kidNames[0] ? LT([39.7, 89.5, 88.9, 94], `<div class="sm-name sm-pname" contenteditable="false">${esc(classes[0]?.name || '')} <span class="k-cname">${esc(kidNames[0])}</span></div>`, 'lcenter') : ''}`));
  // 개인 사진 펼침
  pages.push(kp('k-sm-profL', '개인 사진 (왼쪽)', smLF(pk('cap', 'ki-0'), [10.5, 8.7, 89.3, 90.4], 'thin')));
  pages.push(kp('k-sm-profR', '개인 사진 (오른쪽)', `
    ${smLF(pk('prof', 'ki-1'), [18.3, 8.7, 89.3, 90.4], 'thin')}
    ${smLF(pk('prof2', 'ki-2'), [10.8, 22.5, 29.3, 48.8], 'thin sm-small')}
    ${smLF(pk('prof3', 'ki-3'), [6.5, 51, 29.3, 77], 'thin sm-small')}`));
  // 선생님 + 단체 / 반 원아
  classes.forEach((c, ci) => {
    if (ci === 0) pages.push(kp('k-sm-class', '선생님 · 단체', `
      ${smTeachers(classes)}
      ${smLF(`c${ci}-g1`, [5.9, 55, 94.1, 94.5], 'group')}`));
    const kids = c.students.map(s => ({ s, i: s.idx }));
    for (let p = 0; p < Math.max(1, Math.ceil(kids.length / K_PER_PAGE)); p++) {
      const chunk = kids.slice(p * K_PER_PAGE, p * K_PER_PAGE + K_PER_PAGE), g1Here = p === 0 && ci > 0;      // 둘째 반부터는 단체 사진을 명단 아래에
      let grid = '';
      kKidGrid(chunk.length, 11, g1Here ? 46 : 84).forEach(([x, y, s, ch], k) => {
        const { s: st, i } = chunk[k], nw = Math.max(s, 11);
        grid += smLF(`c${ci}-s${i}`, [x, y, x + s, y + ch], 'tag sm-kid') + LT([x + s / 2 - nw / 2, y + ch + .4, x + s / 2 + nw / 2, y + ch + K_NAME_H], `<div class="sm-name">${esc(st.name)}</div>`, 'lcenter');
      });
      pages.push(kp('k-sm-kids', `${c.name} 원아${p ? ` ${p + 1}` : ''}`, `
        ${LT([6, 3.2, 70, 10], E(`k-sm-class-${ci}`, `${S.year}${c.name}`, 'sm-title sm-title-s'), 'lleft')}
        ${grid}
        ${g1Here ? smLF(`c${ci}-g1`, [6, 60, 94, 94.5], 'group') : ''}`));
    }
  });
  // 7 · 8쪽 조 단체사진 (가로 4장). 마스터 쪽: 모든 원아 앨범에 같은 사진 (k-shared: 개인 앨범 사본에서도 사진 키를 바꾸지 않음)
  pages.push(kp('k-sm-eventL', '조 단체 (왼쪽)', act([[6.2, 8.7, 93.8, 51], [6.2, 52.7, 93.8, 95.3]], '', ['#F3CBB0', '#C6DCEC']).replace(/sm-box/g, 'sm-gold k-shared')));
  pages.push(kp('k-sm-eventR', '조 단체 (오른쪽)', act([[6.2, 8.7, 93.8, 51], [6.2, 52.7, 93.8, 95.3]], '', ['#C8E0CF', '#EFC4C8']).replace(/sm-box/g, 'sm-gold k-shared')));
  // 활동 사진 펼침 4개
  pages.push(kp('k-sm-a1L', '활동 1 (왼쪽)', tint([[6, 10.5, 53.3, 54], [54.5, 10.5, 94, 54], [6, 55.3, 40.2, 95], [41.3, 55.3, 94, 95]])));
  pages.push(kp('k-sm-a1R', '활동 1 (오른쪽)', tint([[6, 10.5, 41, 59], [6, 60, 41, 94.5], [42, 9.8, 94, 44.5], [42, 45.5, 94, 94.5]])));
  pages.push(kp('k-sm-a2L', '활동 2 (왼쪽)', tint([[6, 8.7, 94, 57.5], [6, 58.6, 34.6, 95], [35.6, 58.6, 64.3, 95], [65.3, 58.6, 94, 95]])));
  pages.push(kp('k-sm-a2R', '활동 2 (오른쪽)', tint([[6, 8.7, 34.6, 52.5], [35.6, 8.7, 64.3, 52.5], [65.3, 8.7, 94, 52.5], [6, 53.5, 49.5, 93.6], [50.5, 53.5, 94, 93.6]])));
  pages.push(kp('k-sm-a3L', '활동 3 (왼쪽)', tint([[6, 9.5, 34.6, 46], [35.6, 9.5, 64.3, 46], [65.3, 9.5, 94, 46], [6, 47, 34.6, 94.5], [35.6, 47, 94, 94.5]])));
  pages.push(kp('k-sm-a3R', '활동 3 (오른쪽)', tint([[6, 9.5, 34.6, 34.5], [35.6, 9.5, 64.3, 34.5], [65.3, 9.5, 94, 34.5], [6, 35.5, 49.5, 94.5], [50.5, 35.5, 94, 62], [50.5, 63, 94, 94.5]])));
  pages.push(kp('k-sm-a4L', '활동 4 (왼쪽)', tint([[6, 10.7, 42.2, 41.5], [43.2, 10.7, 94, 41.5], [6, 42.5, 49.5, 65.3], [6, 66.4, 49.5, 94.5], [50.5, 42.5, 94, 94.5]])));
  pages.push(kp('k-sm-a4R', '활동 4 (오른쪽)', tint([[6, 10.7, 94, 63], [6, 64, 49.5, 94.5], [50.5, 64, 94, 94.5]])));
  return pages;
}

/* ---------- 원아 사진: 얼굴 크기 · 눈높이를 모두 같게 (참고: 모전 앨범 '자코 · 구서정') ----------
   눈 사이 거리가 틀 높이의 12.5%, 눈높이가 틀 위에서 47%가 되게 확대 · 이동 → 학사모부터 가슴까지 같은 크기로 보임.
   심플 템플릿에서는 원아 사진을 넣을 때 자동으로, 이미 넣은 사진은 [원아 얼굴 크기 맞추기] 버튼으로 한 번에. */
const SM_EYE_GAP = .125, SM_EYE_Y = .47;
async function smKidFace(key) {
  const r = photos[key];
  if (!r?.blob) return false;
  const slot = document.querySelector(`.page:not([data-pid*="~"]) .photo[data-photo="${CSS.escape(key)}"]`) || document.querySelector(`.photo[data-photo="${CSS.escape(key)}"]`);
  if (!slot?.offsetHeight) return false;
  const e = await eyeLine(r.blob);
  if (!e || photos[key] !== r) return false;
  const sa = slot.offsetWidth / slot.offsetHeight, ia = r.w / r.h, b0 = Math.max(sa, ia);
  const z = Math.round(Math.min(4, Math.max(1, SM_EYE_GAP / (e.ed * b0))) * 1000) / 1000, iw = b0 * z, ih = iw / ia;
  const at = (v, I, B, t) => (I - B < 1e-6 ? 50 : Math.round(Math.min(100, Math.max(0, (v * I - t * B) / (I - B) * 100)) * 10) / 10);
  Object.assign(r, { z, x: at(e.ex, iw, sa, .5), y: at(e.ey, ih, 1, SM_EYE_Y) });
  await DB.putQuiet(key, recOf(r));
  applyKey(key);
  return true;
}
window.smKidFace = smKidFace;
{
  const prev = window.kOnPhotoSet;
  window.kOnPhotoSet = async key => {
    await prev?.(key);
    if (S.kTemplate === 'simple' && isStudentKey(key)) await smKidFace(key);
  };
}
/** 지금 앨범의 원아 사진 전부 다시 맞춤 (직접 옮긴 사진도 맞춤). 실행취소 한 번으로 되돌릴 수 있게 시작 전 상태를 남김 */
async function smFitAllKids(msg) {
  const keys = Object.keys(photos).filter(k => isStudentKey(k) && photos[k]?.blob);
  if (!keys.length) { msg.textContent = '원아 사진이 없습니다.'; return; }
  let ok = 0, miss = [];
  for (let i = 0; i < keys.length; i++) {
    msg.textContent = `얼굴 맞추는 중… ${i + 1} / ${keys.length}`;
    try { (await smKidFace(keys[i])) ? ok++ : miss.push(keys[i]); } catch (e) { console.warn('얼굴 맞춤 실패', keys[i], e); miss.push(keys[i]); }
  }
  const names = miss.map(k => { const [, ci, si] = /^c(\d+)-s(\d+)$/.exec(k); return kClasses()[+ci]?.students.find(s => s.idx === +si)?.name || k; });
  msg.textContent = `${ok}장 맞춤 완료.` + (miss.length ? ` 얼굴을 못 찾은 사진 ${miss.length}장: ${names.join(', ')} (직접 맞춰 주세요)` : '');
}
addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('l-kfaces'), msg = document.getElementById('l-kfaces-msg');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    if (btn.disabled) return;
    btn.disabled = true;
    try { await smFitAllKids(msg); } catch (e) { msg.textContent = '얼굴 인식 기능을 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.'; console.warn(e); }
    btn.disabled = false;
  });
});
