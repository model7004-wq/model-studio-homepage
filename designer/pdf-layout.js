/* ============================================================
   사진틀 배치: 산양중 2025 졸업앨범(9×12인치, 29쪽)과 같은 고정 배치 (1~4쪽 제외).
   좌표는 재단선 안쪽 쪽 기준 % [왼, 위, 오른, 아래, 기울기]. 판형이 달라도 비율대로 늘어남.
   기존 사진 키를 그대로 써서 예전 앨범 파일을 열어도 사진이 새 틀에 들어감.
   ============================================================ */
function lfStyle([x0, y0, x1, y1, tilt = 0]) {
  if (tilt) { const dx = (x1 - x0) * .035, dy = (y1 - y0) * .035; x0 += dx; x1 -= dx; y0 += dy; y1 -= dy; }   // 기울이면 커지는 만큼 줄임
  // 재단선에 닿는 틀은 도련까지 늘림
  if (x0 <= 0) x0 = -3;
  if (y0 <= 0) y0 = -3;
  if (x1 >= 100) x1 = 103;
  if (y1 >= 100) y1 = 103;
  return `left:calc(${f(x0)}cqw - 7cqw);top:calc(${f(y0)}cqh - 7cqw);width:${f(x1 - x0)}cqw;height:${f(y1 - y0)}cqh${tilt ? `;transform:rotate(${tilt}deg)` : ''}`;
}
const LF = (key, box, cls = '', pCls = '', alt = '', inner = '') => `<div class="lf ${cls}" style="${lfStyle(box)}">${P(key, pCls, alt)}${inner}</div>`;
const LT = (box, inner, cls = '') => `<div class="lt ${cls}" style="${lfStyle(box)}">${inner}</div>`;
const layPage = (kind, label, bg, html, extra = {}) => ({ kind, label, bg, html, lay: true, ...extra });

/* 앨범 설정 frontLayout: 'spread'인 학교의 2~5쪽.
   2쪽 왼쪽에 교훈 · 교화 · 교목 · 교가, 드론 사진은 2~3쪽에 걸쳐 펼침. 4쪽 교장 · 5쪽 교감, 아래에 교직원 단체사진 */
function spreadFrontPages() {
  const wide = side => `<div class="lf" style="left:calc(${side ? -56.4 : 43.6}cqw - 7cqw);top:calc(-3cqh - 7cqw);width:159.4cqw;height:106cqh">${P('campus-0')}</div>`;
  const sym = (key, label, nameKey, name, descKey, desc, y0, y1) => `
    ${LF(key, [3, y0, 23.6, y0 + 14.2], 'line')}
    ${LT([24.4, y0, 41.8, y1], `<div class="en-cap">${label}</div>${E(nameKey, name, 'lside-name')}${E(descKey, desc, 'lside-desc')}`)}`;
  // 넓은 직사각형 + 그 아래 이름, 옆에 타원 사진, 아래에 단체사진. 5쪽은 좌우를 뒤집어 펼침면이 대칭
  const leader = (key, en, role, name, msgKey, msg, mirror, group, title, bg) => {
    const rect = mirror ? [38, 20, 95, 49] : [5, 20, 62, 49], oval = mirror ? [5, 19.5, 36, 53.5] : [64, 19.5, 95, 53.5];
    return layPage('leaders', title, bg, `<div class="col">${ttl('With Gratitude', title)}</div>
      ${LF(`${key}-2`, rect, 'line r')}
      ${LF(key, oval, 'lf-oval')}
      ${LT([rect[0], 49.4, rect[2], 54.4], `<div class="l-name"><small>${role}</small>${esc(name)}</div>${E(msgKey, msg, 'l-msg')}`, 'lcenter')}
      ${LF(group, [5, 55.5, 95, 93.5], 'line')}`);
  };
  return [
    layPage('campus', '교훈 · 교화 · 교목 · 교가 · 학교 전경', ['soft', ['butter', 'sky', 'sage']], `
      ${wide(0)}
      ${LF('sym-emblem', [33.4, 2.6, 41.6, 8.8], '', 'contain', emblemAlt())}
      ${LT([3, 3.2, 33, 9], `<div class="lside-school">${esc(S.school)}</div><div class="en-cap">Graduation Anniversary Album</div>`)}
      ${LT([3, 11, 41.8, 25.6], `<div class="en-cap">School Motto · 교훈</div>${E('motto', T.motto, 'motto-text')}`, 'lcenter lmotto-box')}
      ${sym('sym-flower', '교화', 'flowerName', T.flowerName, 'flowerDesc', T.flowerDesc, 27.5, 43.5)}
      ${sym('sym-tree', '교목', 'treeName', T.treeName, 'treeDesc', T.treeDesc, 44.5, 61.5)}
      ${S.useSong !== false ? `${LT([3, 62, 30, 64.6], '<div class="en-cap">School Song · 교가</div>')}${LF('song', [3, 65, 41.8, 94], 'line', 'contain')}` : ''}
      ${texts['class-history'] != null ? LT([47, 64, 93.5, 89.5], `<div class="lhist-title">학년 반 이력</div>${E('class-history', '', 'lhist ml')}`, 'lhist-box') : ''}`, { run: false, folio: false }),
    layPage('campus', '학교 전경', ['soft', ['sage', 'butter', 'sky']], wide(1), { run: false, folio: false }),
    leader('principal', 'Principal', '교장', S.principal, 'principalMsg', T.principalMsg, false, 'leader-group', '교장 선생님', ['soft', ['peach', 'butter', 'lavender']]),
    leader('vice', 'Vice Principal', '교감', S.vice, 'viceMsg', T.viceMsg, true, 'leader-group-2', '교감 선생님', ['soft', ['lavender', 'peach', 'butter']]),
  ];
}

/* 5쪽 — 교훈 · 교표 · 교목 · 교화 · 교가 · 사진 */
function symbolPage() {
  const song = S.useSong !== false;
  const cap = (x0, x1, html) => LT([x0, 57, x1, 60.6], html, 'lcenter lcap');
  return layPage('symbols', '교훈 · 교표 · 교목 · 교화 · 교가', ['top', ['butter', 'peach', 'sage']], `
    ${LT([21, 8.4, 79, 15.6], `<div class="en-cap">School Motto · 교훈</div>${E('motto', T.motto, 'motto-text')}`, 'lcenter')}
    ${LF('sym-motto', [21.8, 16.2, 80.2, 42.2], 'r')}
    ${LF('sym-emblem', [21.6, 44.5, 39, 56.6], 'line', 'contain', emblemAlt())}
    ${LF('sym-tree', [43, 44.5, 59, 56.6], 'line')}
    ${LF('sym-flower', [63.6, 44.8, 79.6, 56.8], 'line')}
    ${cap(19, 41, '<span>교표</span>')}
    ${cap(41, 61, `<span>교목 · </span>${E('treeName', T.treeName, '', 'span')}`)}
    ${cap(61, 82, `<span>교화 · </span>${E('flowerName', T.flowerName, '', 'span')}`)}
    ${song ? LF('song', [9, 61.6, 44.8, 91.1], 'line', 'contain') : ''}
    ${LF('sym-extra', song ? [51, 61.9, 94.4, 92.1] : [9, 61.9, 94.4, 92.1], 'r')}`);
}

/* 6–7쪽 — 담임 · 급훈 · 말씀 + 반 단체사진 4장 */
function classIntroPages(c, ci, tone) {
  return [
    layPage('teacher', `${c.name} · 담임 선생님`, ['side', tone], `
      ${LF(`c${ci}-teacher`, [10.6, 13.2, 30.6, 34.8], 'card r')}
      ${LT([6, 36, 36, 41], `<small>담임</small> <b>${esc(c.teacher || '담임 선생님')}</b> <small>선생님</small>`, 'lcenter lteacher')}
      ${LT([38.4, 10.5, 94, 18], `<div class="h-ko sm">${esc(c.name)}</div>`)}
      ${LT([38.4, 16, 94, 25], `<div class="en-cap">Class Motto · 급훈</div>${E(`c${ci}-motto`, T.classMotto, 'motto-text')}${E(`c${ci}-mottoDesc`, '', 'lmotto-desc')}`)}
      ${LT([38.4, 25.5, 94, 42.5], E(`c${ci}-teacherMsg`, T.teacherMsg, 'tmsg'), 'lletter')}
      ${LF(`c${ci}-group`, [3.2, 43.8, 100, 92.5])}`),
    layPage('class-photos', `${c.name} · 반 단체사진`, ['soft', tone], `
      ${LF(`c${ci}-group2`, [6.6, 10.5, 47, 31], 'card')}
      ${LF(`c${ci}-group3`, [50.2, 22, 90.6, 41.8], 'card')}
      ${LT([52, 10.5, 92, 20], `<div class="h-ko sm">CLASS ${esc(c.name)}</div>`, 'lright')}
      ${LF(`c${ci}-group4`, [6.2, 47.8, 89.4, 91], 'card')}`),
  ];
}

/* 5명씩 2줄 틀. names가 켜지면 틀 아래에 이름 */
function studentGrid(cols, rows, chunk, code, ci, { names = false, cls = '', ratio = 0, span = 94 } = {}) {
  if (ratio) {     // 앨범 설정 rectFrames: 세로가 긴 직사각형 틀 (높이 ÷ 폭 = ratio), 줄마다 가운데 정렬
    const per = Math.max(3, Math.ceil(chunk.length / 2)), gap = .9;
    const w = Math.min((rows[0][1] - rows[0][0]) * G.aspect / ratio, (span - gap * (per - 1)) / per);
    return chunk.map(({ s, i }, n) => {
      const r = Math.floor(n / per), inRow = r ? chunk.length - per : Math.min(per, chunk.length), [y0, y1] = rows[r];
      const x0 = 50 - (inRow * w + gap * (inRow - 1)) / 2 + (n % per) * (w + gap), x1 = x0 + w;
      return LF(`c${ci}-${code}${i}`, [x0, y0, x1, y1], cls) + (names ? LT([x0, y1 + .3, x1, y1 + 3.2], `<div class="lname">${esc(s.name)}</div>`, 'lcenter') : '');
    }).join('');
  }
  // 9~10명은 PDF와 같은 5칸, 그 외에는 두 줄로 고르게 나눔. 칸이 남는 둘째 줄은 가운데로
  const per = Math.max(3, Math.ceil(chunk.length / 2)), col = per === 5 ? cols : evenCols(5.6, 94.2, per, .8);
  const shift = (col[1][0] - col[0][0]) * (2 * per - chunk.length) / 2;
  return chunk.map(({ s, i }, n) => {
    const r = Math.floor(n / per), [y0, y1] = rows[r], [a, b] = col[n % per], x0 = a + (r ? shift : 0), x1 = b + (r ? shift : 0);
    return LF(`c${ci}-${code}${i}`, [x0, y0, x1, y1], cls) + (names ? LT([x0, y1 + .3, x1, y1 + 3.2], `<div class="lname">${esc(s.name)}</div>`, 'lcenter') : '');
  }).join('');
}
const evenCols = (a, b, n, gap) => Array.from({ length: n }, (_, k) => { const w = (b - a - gap * (n - 1)) / n, x = a + k * (w + gap); return [x, x + w]; });
const COL_L = [[5.6, 22.6], [23.4, 40.4], [41.4, 58.2], [59.2, 76.2], [77, 94]];
const COL_R = [[5.6, 22.6], [23.6, 40.6], [41.4, 58.6], [59.4, 76.4], [77.2, 94.2]];
/** 꽃 프로필 두 줄: 안전선은 쪽 가장자리에서 폭의 7% 안쪽 */
const flowerRows = () => { const top = 46.2, bottom = 100 - 7 / G.aspect, h = (bottom - top - .8) / 2; return [[top, top + h], [top + h + .8, bottom]]; };
const schoolLabel = () => LT([5.6, 7.2, 60, 10.6], `<div class="lschool">${esc(S.school)}</div>`);

/* 8쪽~ 증명·꽃 / 악기·학사모 / 작은 사진·포즈 / 야외 큰 사진 (펼침면 4개). 16명까지는 한 묶음, 더 많으면 10명마다 묶음이 반복됨 */
function studentPages(c, ci, tone) {
  const list = c.students.map((s, i) => ({ s, i })), PER = list.length <= 16 ? Math.max(10, list.length) : 10, sets = Math.max(1, Math.ceil(list.length / PER));
  const name = (b, j) => `c${ci}-${b}${j ? `-${j + 1}` : ''}`, pages = [];
  for (let j = 0; j < sets; j++) {
    const chunk = list.slice(j * PER, (j + 1) * PER), tag = sets > 1 ? ` ${j + 1}/${sets}` : '';
    const flower = S.useFlower !== false, rect = !!S.rectFrames;
    // rectFrames 앨범은 틀을 세로로 길게 하고 큰 사진을 조금 낮춤 (윗줄 쪽 / 아랫줄 쪽 공통 자리)
    const up = rect ? { rows: [[10.5, 30.5], [34, 54]], big: [8.4, 58, 91.6, 92.5], ratio: 1.25 } : null, low = rect ? { rows: [[47, 68], [69, 90]], big: [8.4, 11.2, 91.6, 45.5], ratio: 1.25 } : null;
    pages.push(
      layPage('students', `${c.name} · 증명사진${tag}`, ['top', tone], `${schoolLabel()}
        ${studentGrid(COL_L, up?.rows || [[11.5, 28], [31.6, 48.1]], chunk, 's', ci, { names: true, cls: 'line', ratio: up?.ratio })}
        ${LF(name('team1', j), up?.big || [8.4, 52.6, 94, 92.1], 'r')}`),
      layPage('students', `${c.name} · 꽃 프로필${tag}`, ['top', tone], `
        ${LF(name('team2', j), flower ? low?.big || [8.2, 11.1, 91.6, 49.6] : [8.2, 11.1, 91.6, 90.6], 'line')}
        ${flower ? (rect   // 단체사진 바로 아래부터 파란 안전선까지 (폭도 안전선 안)
    ? studentGrid(COL_R, flowerRows(), chunk, 'fl', ci, { cls: 'r', ratio: 1, span: 86 })
    : studentGrid(COL_R, [[52.7, 71.2], [72, 90.6]], chunk, 'fl', ci, { cls: 'r' })) : ''}`),
    );
    if (S.useInstr) pages.push(
      layPage('instr', `${c.name} · 악기 프로필${tag}`, ['soft', [tone[2], tone[0], tone[1]]], `${schoolLabel()}
        ${studentGrid(COL_L, up?.rows || [[11.5, 28], [32.1, 48.6]], chunk, 'in', ci, { names: true, cls: 'line', ratio: up?.ratio })}
        ${LF(name('big1', j), up?.big || [8.4, 53.4, 94, 92.1], 'r')}`),
      layPage('instr', `${c.name} · 학사모${tag}`, ['side', [tone[2], tone[0], tone[1]]], `
        ${LF(name('big2', j), low?.big || [6.6, 11.1, 90, 49.6], 'line')}
        ${studentGrid(COL_R, low?.rows || [[52.6, 72], [72.7, 92.1]], chunk, 'ca', ci, { cls: 'r', ratio: low?.ratio })}`),
    );
    if (S.useStrip !== false) pages.push(
      layPage('strip', `${c.name} · 작은 프로필${tag}`, ['side', [tone[1], tone[2], tone[0]]], `${schoolLabel()}
        ${studentGrid(COL_L, rect ? [[10.5, 33], [34, 56.5]] : [[12.3, 28.8], [32.4, 48.9]], chunk, S.outdoorTwo ? 'ex' : 'ox', ci, { cls: 'line', ratio: rect ? 1.45 : 0 })}
        ${LF(name('big3', j), rect ? [8.4, 58, 91.6, 93] : [8.8, 53.4, 94.4, 92.9], 'r')}`),
      layPage('strip', `${c.name} · 포즈 프로필${tag}`, ['soft', [tone[1], tone[2], tone[0]]], `
        ${LF(name('big4', j), low?.big || [8.4, 11.9, 91.8, 50.4], 'line')}
        ${studentGrid(COL_R, low?.rows || [[51.8, 68.3], [72.4, 88.9]], chunk, 'po', ci, { cls: 'line', ratio: low?.ratio })}`),
    );
    // 펼침면을 같은 크기 칸으로 나눔 (쪽마다 2줄). 사진이 들어가고 남는 칸은 가운데부터 글자 칸으로
    if (S.outdoorTwo && S.outdoorDiamond) {     // 앨범 설정 outdoorDiamond: 위에서부터 1 · 1 · 2 · 3 · 2칸. 맨 위는 단체사진, 3칸 줄 가운데는 학교와 졸업생 이름
      // 쪽 가득: 3칸 줄이 쪽 폭을, 다섯 줄이 쪽 높이를 꽉 채움 (모든 칸 같은 폭, 맨 위 단체사진만 두 칸 폭)
      // 위아래 여백도 좌우 여백(2.2cqw)과 같게: 세로로도 안내선까지 가득
      const counts = [1, 1, 2, 3, 2], nameRow = 3, top = 2.2 / G.aspect, bottom = 100 - top, gap = 1 / G.aspect, gx = 1, h = (bottom - top - gap * 4) / 5, w = (95.6 - gx * 2) / 3;
      const names = chunk.map(x => esc(x.s.name)).join(' · ');
      const diamond = (code, topKey) => {
        let n = 0, html = '';
        counts.forEach((cnt, r) => {
          const y0 = top + r * (h + gap), cw = r ? w : 2 * w + gx, rowW = cnt * cw + (cnt - 1) * gx;
          for (let i = 0; i < cnt; i++) {
            const x0 = 50 - rowW / 2 + i * (cw + gx), box = [x0, y0, x0 + cw, y0 + h];
            if (!r) html += LF(topKey, box, 'line');
            else if (r === nameRow && i === 1) html += LT(box, `<div class="lpanel-school">${esc(S.school)}</div><div class="lpanel-names">${names}</div>`, 'lpanel lpanel-sm');
            else if (chunk[n]) html += LF(`c${ci}-${code}${chunk[n++].i}`, box, 'line');
          }
        });
        return html;
      };
      pages.push(
        layPage('outdoor', `${c.name} · 야외 프로필${tag}`, ['soft', tone], diamond('o', name('otop', j)), { run: false }),
        layPage('outdoor', `${c.name} · 야외 프로필${tag}`, ['soft', tone], diamond('ox', name('xtop', j)), { run: false }),
      );
      continue;
    }
    if (S.outdoorTwo) {     // 앨범 설정 outdoorTwo: 쪽마다 반 전체 (왼쪽 야외 프로필, 오른쪽 작은 프로필 사진), 세로 틀 아래 이름
      const per = Math.max(3, Math.ceil(chunk.length / 2)), w = (94 - .9 * (per - 1)) / per, h = Math.min(w * 1.6 / G.aspect, 36), y0 = (100 - (2 * h + 8)) / 2 + 2;
      const rows = [[y0, y0 + h], [y0 + h + 4.5, y0 + 2 * h + 4.5]], grid = code => studentGrid(COL_L, rows, chunk, code, ci, { names: true, cls: 'line', ratio: 1.6 });
      pages.push(
        layPage('outdoor', `${c.name} · 야외 프로필${tag}`, ['soft', tone], `${schoolLabel()}${grid('o')}`),
        layPage('outdoor', `${c.name} · 야외 프로필${tag}`, ['soft', tone], `${schoolLabel()}${grid('ox')}`),
      );
      continue;
    }
    const cols = Math.max(2, Math.ceil((chunk.length + 1) / 4));
    let X = [evenCols(1.6, 98.4, cols, 1.4), evenCols(1.6, 98.4, cols, 1.4)], Y = [[14.7, 50.3], [51.3, 87]];
    if (rect) {      // 세로 직사각형 칸 (높이 ÷ 폭 = 1.4), 쪽 가운데 정렬
      const w = Math.min(41 * G.aspect / 1.4, (96.8 - 1.4 * (cols - 1)) / cols), h = w * 1.4 / G.aspect, x0 = 50 - (cols * w + 1.4 * (cols - 1)) / 2, y0 = 52 - (2 * h + 1) / 2;
      const col = Array.from({ length: cols }, (_, k) => [x0 + k * (w + 1.4), x0 + k * (w + 1.4) + w]);
      X = [col, col]; Y = [[y0, y0 + h], [y0 + h + 1, y0 + 2 * h + 1]];
    }
    const order = []; for (let r = 0; r < 2; r++) for (let k = 0; k < cols; k++) order.push([1, r, k], [0, r, cols - 1 - k]);
    const panelSlots = order.slice(0, cols * 4 - chunk.length), isPanel = (side, r, k) => panelSlots.findIndex(a => a[0] === side && a[1] === r && a[2] === k);
    const html = [[], []], sideNames = [[], []]; let at = 0;
    for (const side of [0, 1]) for (let r = 0; r < 2; r++) for (let k = 0; k < cols; k++) {
      if (isPanel(side, r, k) >= 0) continue;
      const x = chunk[at++]; sideNames[side].push(esc(x.s.name));
      html[side].push(LF(`c${ci}-o${x.i}`, [X[side][k][0], Y[r][0], X[side][k][1], Y[r][1]]));
    }
    const namesFor = (n, side) => (panelSlots.length === 1 ? [...sideNames[0], ...sideNames[1]] : n < 2 ? sideNames[side] : []).join(' · ');
    panelSlots.forEach(([side, r, k], n) => html[side].push(LT([X[side][k][0], Y[r][0], X[side][k][1], Y[r][1]], `<div class="lpanel-school">${esc(S.school)}</div><div class="en-cap">The ${esc(ordinal(parseInt(S.nth, 10) || 1))} Graduation Album</div><div class="lpanel-names">${namesFor(n, side)}</div>`, 'lpanel')));
    pages.push(
      layPage('outdoor', `${c.name} · 야외 프로필${tag}`, ['soft', tone], html[0].join('')),
      layPage('outdoor', `${c.name} · 야외 프로필${tag}`, ['soft', tone], html[1].join('')),
    );
  }
  return pages;
}

/* 행사 사진 콜라주: PDF 16~26쪽. 쪽이 더 필요하면 뒤 10쪽을 되풀이함 (좌우 쪽이 맞도록) */
const GAL_LAYOUTS = [
  [[5.6, 11.4, 52, 40.1], [53, 11.4, 94.4, 40.1], [5.6, 41, 39.6, 64.8], [40.8, 41, 61, 64.8], [62, 41, 94.4, 64.8], [5.6, 65.8, 30.8, 92.6], [32, 65.8, 94.4, 92.6]],
  [[5.6, 12.3, 39.6, 29], [41, 12.3, 94.4, 29], [5.6, 29.8, 55, 45.7], [55.8, 29.8, 94.4, 45.7], [5.6, 46.6, 55, 65], [55.8, 46.6, 94.4, 65], [5.6, 65.8, 38.4, 92.6], [40.4, 65.8, 94.4, 92.6]],
  [[8.4, 12.2, 48, 30.9], [49.2, 12.2, 94, 34.6], [8.4, 31.8, 52.6, 56.9], [53.6, 35.6, 94, 56.9], [8.4, 57.9, 27.2, 91.4], [29.8, 57.9, 94.4, 91.4]],
  [[5.6, 12.2, 60.6, 34.1], [61.4, 12.2, 91.6, 38.4], [5.6, 35.3, 60.6, 57.3], [61.4, 39.6, 91.6, 57.3], [5.6, 57.9, 91.6, 91.4]],
  [[8.8, 10.9, 52.8, 42.1], [54.2, 10.9, 94.4, 31.9], [8.4, 42.8, 52.8, 63.8], [56, 50, 74, 63.8], [74.2, 50, 94.4, 64.4], [8.4, 65, 94.4, 92.2], [57.8, 30.3, 90.4, 48.4, 1]],
  [[6, 10.4, 43, 35.6], [44.2, 10.4, 91, 40.2], [6, 36.6, 47.2, 61.8], [48.6, 41.4, 91.6, 61.8], [6, 63.1, 91.6, 92.2]],
  [[8.4, 11.7, 51.2, 37.3, -4], [51.4, 11.9, 97.6, 39.6, 5], [8.4, 38.8, 48.4, 58.1], [50.2, 38.8, 94.4, 58.1], [8.4, 59.2, 94.4, 92.2]],
  [[5.8, 40.2, 91.8, 92.2], [5.6, 10.4, 44.2, 33.7], [46.2, 10.4, 91, 32.8], [5.8, 35.3, 40.6, 50], [49.2, 33.7, 91, 49.2]],
  [[6.8, 12.1, 50.2, 36.8, -3], [51.8, 10.7, 96, 36.5, 4], [8.4, 38, 50.2, 64.1], [51.8, 38, 94.4, 64.1], [8.4, 65, 94.4, 92.2]],
  [[6, 10.4, 94.4, 43], [6, 44.3, 35.2, 57.8], [36.8, 44.3, 63.6, 57.8], [65.2, 44.3, 94.4, 57.8], [5.6, 58.8, 94.4, 92.7]],
  [[5.6, 11.4, 53.4, 33.1], [55.2, 11.4, 94.4, 53.4], [5.6, 34.4, 53.4, 53.4], [5.6, 55.3, 94.4, 92.2]],
];
const galLayoutOf = p => GAL_LAYOUTS[p < GAL_LAYOUTS.length ? p : p % (GAL_LAYOUTS.length - 1)];
let galSig = '';
const galKeySig = () => galleryEvents().flatMap(ev => ev.keys).join();
const galDefaultTitle = p => (p < 2 ? `${p + 1}학년 추억` : '3학년 추억');
/* 앨범 설정 galleryLayout: 'rows'인 학교의 행사 사진: 행사(폴더) 순서대로 쪽을 나누고, 사진을 자르지 않고 줄마다 폭을 맞춤 */
const GAL_ROW_PER = 7;   // 한 쪽 사진 수 (쪽마다 6~7장)
/** 줄 나누기: 줄마다 폭을 사진 비율대로 나누고, 쪽 높이에 꼭 맞게 늘렸을 때 사진이 가장 적게 잘리는 조합을 고름 */
function rowPlan(asps, W, H, gap, limit = 3) {
  const n = asps.length; let best = null;
  const tryRows = rows => {
    const hs = rows.map(r => (W - gap * (r.length - 1)) / r.reduce((s, i) => s + asps[i], 0));
    const sum = hs.reduce((s, h) => s + h, 0), free = H - gap * (rows.length - 1), k = free / sum;
    const score = Math.abs(Math.log(k)) * 100 + hs.reduce((s, h) => s + Math.abs(h - sum / hs.length), 0) * .4;
    if (!best || score < best.score) best = { rows, hs: hs.map(h => h * k), score };
  };
  if (n > 12) {     // 사진이 많으면 줄 수만 바꿔 가며 고르게 나눔
    for (let r = 2; r <= n; r++) tryRows(Array.from({ length: r }, (_, q) => { const a = Math.round(q * n / r), b = Math.round((q + 1) * n / r); return Array.from({ length: b - a }, (_, j) => a + j); }));
    return best;
  }
  for (let mask = 0; mask < 2 ** (n - 1); mask++) {
    const rows = [[0]];
    for (let i = 1; i < n; i++) { if (mask >> (i - 1) & 1) rows.push([i]); else rows[rows.length - 1].push(i); }
    if (rows.every(r => r.length <= limit)) tryRows(rows);
  }
  return best || rowPlan(asps, W, H, gap, limit + 1);
}
/** 줄 나눈 사진 틀: y0~y1(쪽 높이 %) 영역을 꽉 채움 */
function galleryBlock(keys, y0, y1, limit) {
  const left = 3.4, W = 93.2, gap = .9, H = (y1 - y0) / 100 * G.aspect * 100, toY = v => v / G.aspect;
  const asps = keys.map(k => Math.min(2.4, Math.max(.45, photos[k].w / photos[k].h))), plan = rowPlan(asps, W, H, gap, limit);
  let y = y0, boxes = '';
  plan.rows.forEach((r, ri) => {
    const free = W - gap * (r.length - 1), sum = r.reduce((s, i) => s + asps[i], 0), h = plan.hs[ri]; let x = left;
    for (const i of r) { const pw = free * asps[i] / sum; boxes += LF(keys[i], [x, y, x + pw, y + toY(h)], 'r'); x += pw + gap; }
    y += toY(h + gap);
  });
  return boxes;
}
/** 앨범 설정 galleryTall { 폴더 제목: 사진 키 }: 3장 폴더를 왼쪽 가로 틀 2개 + 오른쪽 세로 틀 1개로 */
function galleryTallBlock(keys, tall, y0, y1) {
  const left = 3.4, W = 93.2, gap = .9, tw = 36, ww = W - tw - gap, mid = (y0 + y1) / 2, wide = keys.filter(k => k !== tall), g = gap / G.aspect / 2;
  return LF(wide[0], [left, y0, left + ww, mid - g], 'r') + LF(wide[1], [left, mid + g, left + ww, y1], 'r') + LF(tall, [left + ww + gap, y0, left + W, y1], 'r');
}
/* 앨범 설정 galleryPlan: 쪽마다 넣을 폴더 번호 목록 (예: [[0],[1],[2],[3,4]]). 한 쪽에 폴더 둘이면 위아래 반씩. 계획에 없는 폴더는 둘씩 이어짐 */
function galleryPlanPages() {
  const evs = galleryEvents().map(ev => ({ title: String(texts[ev.titleKey] ?? ev.def).replace(/\s*\(\d+\)$/, ''), keys: ev.keys }));
  const plan = S.galleryPlan.map(g => g.filter(i => evs[i])).filter(g => g.length), used = new Set(plan.flat());
  const rest = evs.map((_, i) => i).filter(i => !used.has(i));
  while (rest.length) plan.push(rest.splice(0, 2));
  return plan.map((g, n) => {
    const add = n === plan.length - 1 ? '<button class="gal-add lgal-add">＋ 사진 추가</button>' : '';
    const label = `행사 사진 ${n + 1}/${plan.length} · ${g.map(i => evs[i].title).join(' · ')}`, bg = [n % 2 ? 'soft' : 'top', TONES[n % TONES.length]];
    const block = (ev, y0, y1, limit) => {
      const tall = S.galleryTall?.[ev.title];
      return tall && ev.keys.length === 3 && ev.keys.includes(tall) ? galleryTallBlock(ev.keys, tall, y0, y1) : galleryBlock(ev.keys, y0, y1, limit);
    };
    if (g.length === 1) return layPage('gallery', label, bg, `
      ${LT([3.4, 4.6, 96.6, 10], E(`gal-head-${n}-0`, evs[g[0]].title, 'lhead'))}${block(evs[g[0]], 10.5, 95, 3)}${add}`);
    return layPage('gallery', label, bg, `
      ${LT([3.4, 4.6, 96.6, 9.6], E(`gal-head-${n}-0`, evs[g[0]].title, 'lhead'))}${block(evs[g[0]], 10, 50, 4)}
      ${LT([3.4, 50.6, 96.6, 55.2], E(`gal-head-${n}-1`, evs[g[1]].title, 'lhead'))}${block(evs[g[1]], 55.6, 95, 4)}${add}`);
  });
}
function galleryRowPages() {
  // 폴더 순서 그대로 이어 붙여 쪽마다 6~7장씩 나눔. 한 쪽에 행사가 둘 이상이면 제목을 함께 적음
  const flat = galleryEvents().flatMap(ev => ev.keys.map(key => ({ key, title: String(texts[ev.titleKey] ?? ev.def).replace(/\s*\(\d+\)$/, '') })));
  const count = Math.ceil(flat.length / GAL_ROW_PER), per = flat.length / count;
  const list = Array.from({ length: count }, (_, q) => {
    const part = flat.slice(Math.round(q * per), Math.round((q + 1) * per));
    return { title: [...new Set(part.map(x => x.title))].join(' · '), keys: part.map(x => x.key) };
  });
  const top = 10.5, bottom = 95, left = 3.4, W = 93.2, H = (bottom - top) / 100 * G.aspect * 100, gap = .9, toY = v => v / G.aspect;
  return list.map(({ title, keys }, n) => {
    const asps = keys.map(k => Math.min(2.4, Math.max(.45, photos[k].w / photos[k].h))), plan = rowPlan(asps, W, H, gap);
    let y = top, boxes = '';
    plan.rows.forEach((r, ri) => {
      // 줄 폭과 쪽 높이를 꽉 채움 (틀 비율이 사진과 다르면 사진이 조금 잘림)
      const free = W - gap * (r.length - 1), sum = r.reduce((s, i) => s + asps[i], 0), h = plan.hs[ri]; let x = left;
      for (const i of r) { const pw = free * asps[i] / sum; boxes += LF(keys[i], [x, y, x + pw, y + toY(h)], 'r'); x += pw + gap; }
      y += toY(h + gap);
    });
    return layPage('gallery', `행사 사진 ${n + 1}/${list.length} · ${title}`, [n % 2 ? 'soft' : 'top', TONES[n % TONES.length]], `
      ${LT([5.6, 4.6, 94.4, 10], E(`gal-head-${n}`, title, 'lhead'))}${boxes}
      ${n === list.length - 1 ? '<button class="gal-add lgal-add">＋ 사진 추가</button>' : ''}`);
  });
}
function galleryPages() {
  const used = galleryEvents().flatMap(ev => ev.keys), want = galleryCount(), pages = [];
  galSig = used.join();
  if (S.galleryPlan && used.length) return galleryPlanPages();
  if (S.galleryLayout === 'rows' && used.length) return galleryRowPages();
  // 빈 틀에 줄 키: 아직 사진이 없는 자리를 앞에서부터 씀
  let fp = 0, fk = -1;
  const freeKey = () => {
    do { fk++; if (fk === GALLERY_PER) { fk = 0; fp++; } } while (photos[`g${fp}-${fk}`] && fp < GALLERY_MAX);
    return `g${fp}-${fk}`;
  };
  let at = 0;
  // 사진이 있으면 사진 수만큼만 틀을 만들고, 아직 없으면 빈 쪽을 정해진 수만큼 보여 줌
  for (let p = 0; used.length ? at < used.length : p < want; p++) {
    const boxes = galLayoutOf(p).slice(0, used.length ? used.length - at : undefined), keys = boxes.map(() => (at < used.length ? used[at++] : freeKey()));
    const src = /^g(\d+)-/.exec(keys[0]), event = src ? texts[`gal-title-${src[1]}`] : null;
    pages.push({ p, boxes, keys, title: event ? String(event).replace(/\s*\(\d+\)$/, '') : galDefaultTitle(p) });
  }
  return pages.map(({ p, boxes, keys, title }, n) => layPage('gallery', `행사 사진 ${n + 1}/${pages.length}`, [p % 2 ? 'soft' : 'top', TONES[p % TONES.length]], `
    ${LT([5.6, 4.6, 70, 9.8], E(`gal-head-${p}`, title, 'lhead'))}
    ${boxes.map((b, i) => LF(keys[i], b, b[4] ? 'card' : 'r')).join('')}
    ${n === pages.length - 1 ? `<button class="gal-add lgal-add">＋ 사진 추가</button>` : ''}`));
}

/* 친구들에게 보내는 글: 명단에 '이름 | 꿈 | 글'로 적은 글이 있으면 반마다 한 쪽 (행사 사진 뒤) */
function wordsPages(classes) {
  return classes.filter(c => c.students.some(s => s.msg)).map((c, ci) => {
    const hist = texts['class-history'] != null && S.frontLayout !== 'spread';     // 펼침 배치는 이력을 2쪽 사진 위에 둠
    const list = c.students.filter(s => s.msg), rows = Math.ceil(list.length / 2), top = hist ? 15.5 : 11.5, h = (93 - top) / rows;
    return layPage('words', `${c.name} · 친구들에게 보내는 글`, ['soft', TONES[ci % TONES.length]], `
      ${LT([5.6, 4.6, 94.4, 10], E(`words-title-${ci}`, '친구들에게 보내는 글', 'lhead'))}
      ${hist ? LT([5.6, 10.5, 94.4, 14.8], E('class-history', '', 'lhistory')) : ''}
      ${list.map((s, i) => { const x = i % 2 ? [50.6, 94.4] : [5.6, 49.4], y = top + Math.floor(i / 2) * h;
        return LT([x[0], y, x[1], y + h - 1], `<div class="lword-name">${esc(s.name)}</div><div class="lword-msg">${esc(s.msg)}</div>`, 'lword'); }).join('')}`);
  });
}

/* 마지막 — 동생들 · 선생님이 졸업생에게: 쪽 가득 롤링페이퍼 틀 */
const ROLLING_TITLES = ['1학년 동생들이 졸업생에게', '2학년 동생들이 졸업생에게', '선생님께서 졸업생에게'];
function messagesPage(i = 0) {
  const titleKey = `rolling-title-${i}`, def = ROLLING_TITLES[i] || '서로에게 남기는 말', title = texts[titleKey] ?? def;
  return layPage('messages', title, ['center', [['lavender', 'peach', 'mint'], ['peach', 'butter', 'sky'], ['mint', 'lavender', 'butter']][i % 3]], `
    ${LF(rollingKey(i), [2, 1.5, 98, 98.5], '', 'contain')}
    ${LT([10, 4.4, 90, 9.2], E(titleKey, def, 'lroll-title'), 'lcenter')}`);
}
