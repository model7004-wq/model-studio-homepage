/* ============================================================
   디자이너2 초안 배치 (산양중 2026 초안.pdf와 같은 사진틀 구조)
   앨범 설정 layoutV2 를 켜면 5쪽부터 디자이너2(11월 5일 판)의 배치로 그림.
   글자 내용 · 테마(글꼴)는 지금 앨범 것을 그대로 쓰고, 사진 키도 같아 사진이 그대로 들어감.
   아래 함수들은 디자이너2 album.js 에서 그대로 옮겨 왔고, 이 묶음 안에서만 쓰여 디자이너5 함수와 섞이지 않음.
   ============================================================ */
(() => {
const songBody = () => `
      <div class="song-sheet">${P('song', 'contain')}</div>
      ${E('songLyrics', T.songLyrics, 'song-lyrics')}
      <div class="song-hint">가사는 위 칸을 눌러 입력하세요. 악보에 가사가 있으면 비워 두면 됩니다.</div>`;

/* 선생님 명렬을 안 넣는 학교: 그 자리에 교훈 · 교표 · 교목 · 교화 · 교가 (쪽수가 같아 뒤쪽 좌우가 안 바뀜) */
function symbolPage() {
  return {
    kind: 'symbols', label: '교훈 · 교표 · 교목 · 교화 · 교가', bg: ['top', ['butter', 'peach', 'sage']],
    html: `<div class="col sym-col">
      ${ttl('Our School', '우리 학교의 상징')}
      <div class="sy-top">
        <div class="sym-mini emblem-mini sy-emblem">${P('sym-emblem', 'contain', emblemAlt())}</div>
        <div class="sym-text">
          <div class="en-cap">School Motto · 교훈</div>
          ${E('motto', T.motto, 'motto-text')}
          ${E('emblemDesc', T.emblemDesc, 'sym-desc')}
        </div>
        <div class="sy-ph sy-motto">${P('sym-motto')}</div>
      </div>
      <div class="sy-low${S.useSong === false ? ' no-song' : ''}">
        <div class="sy-cards">${[['tree', 'School Tree · 교목', T.treeName, T.treeDesc], ['flower', 'School Flower · 교화', T.flowerName, T.flowerDesc]].map(([k, cap, nm, ds]) => `
          <div class="sy-card">
            <div class="sy-ph">${P(`sym-${k}`)}</div>
            <div class="sym-text"><div class="en-cap">${cap}</div>${E(`${k}Name`, nm, 'sym-name')}${E(`${k}Desc`, ds, 'sym-desc')}</div>
          </div>`).join('')}
        </div>
        ${S.useSong === false ? '' : `<div class="sym-song"><div class="en-cap">School Song · 교가</div>${songBody()}</div>`}
      </div>
    </div>`,
  };
}

function classIntroPages(c, ci, tone) {
  const n = String(ci + 1).padStart(2, '0');
  return [{
    kind: 'teacher', label: `${c.name} · 담임 선생님`, bg: ['side', tone],
    html: `<div class="col">
      ${ttl(`Class ${n}`, esc(c.name))}
      <div class="t-profile">
        <div class="arch-frame">${P(`c${ci}-teacher`, 'arch')}</div>
        <div class="tinfo">
          <div class="en-cap">Homeroom Teacher · 담임 선생님</div>
          <div class="tname">${esc(c.teacher || '담임 선생님')}</div>
          ${E(`c${ci}-profile`, T.teacherProfile, 'tprofile')}
        </div>
      </div>
      <div class="motto-box class-motto"><div class="en-cap">Class Motto · 급훈</div>${E(`c${ci}-motto`, T.classMotto, 'motto-text')}</div>
      <div class="note t-letter">${noteWash(PAL[tone[0]], 500 + ci)}
        <div class="en-cap">선생님이 남기는 말씀</div>
        ${E(`c${ci}-teacherMsg`, T.teacherMsg, 'tmsg')}
        <div class="sign">${esc(c.teacher || '')} 드림</div>
      </div>
    </div>`,
  }, {
    kind: 'class-photos', label: `${c.name} · 반 단체사진`, bg: ['soft', tone],
    html: `<div class="col">
      ${ttl('Together', '우리 반 단체사진')}
      <div class="class-photos">${[0, 1, 2].map(k => `
        <div class="cp cp${k}"><div class="gframe">${P(k ? `c${ci}-group${k + 1}` : `c${ci}-group`)}</div>${E(`c${ci}-groupCap${k ? k + 1 : ''}`, T.classCaps[k], 'cap')}</div>`).join('')}
      </div>
    </div>`,
  }];
}

function stuCard(s, key, col, seed) {
  return `<figure class="stu">
    <div class="arch-frame">${P(key, 'arch')}</div>
    <figcaption>
      <div class="stu-name">${brushStroke(col, seed)}${esc(s.name)}</div>
      ${s.dream ? `<div class="stu-dream">꿈 · ${esc(s.dream)}</div>` : ''}
      ${s.msg ? `<div class="stu-msg">${esc(s.msg)}</div>` : ''}
    </figcaption>
  </figure>`;
}

/*
 * 8–9쪽 — 학생 프로필: 왼쪽 쪽은 1조, 오른쪽 쪽은 2조.
 * 명단에 '## 1조' 표시가 있으면 그대로 나누고, 없으면 명렬 앞쪽 절반이 1조, 뒤쪽 절반이 2조.
 * 위에 꽃 프로필(세로로 길게, 쪽 높이의 62%) → 증명사진 한 줄(작게) → 조 단체사진.
 * '꽃 프로필 쓰기'를 끄면 증명사진을 위 칸에 크게 넣음.
 */
function profilePages(c, ci, tone) {
  const flower = S.useFlower !== false, cols = 4, cg = flower ? 1.8 : 2.4, rg = flower ? 1.4 : 2, A = SAFE_H() - HEAD_H, colW = (86 - (cols - 1) * cg) / cols;
  const list = c.students.map((s, i) => ({ s, i }));
  const tags = [...new Set(c.students.map(s => s.team).filter(Boolean))];
  const half = Math.ceil(list.length / 2);
  const parts = tags.length >= 2
    ? [list.filter(x => x.s.team === tags[0]), list.filter(x => x.s.team !== tags[0])]
    : [list.slice(0, half), list.slice(half)];
  const most = Math.max(1, parts[0].length, parts[1].length);
  // 꽃 프로필: 이름만 있으면 이름 칸 · 줄 간격 · 칸 사이를 줄이고, 제목과 사진 사이 간격(1.8cqw)을 사진 높이로 돌림. 폭은 칸 폭의 96%까지 넓힘
  // (아래 증명사진 줄 · 조 단체사진 자리는 그대로 → 직접 옮겨 둔 단체사진과 겹치지 않음)
  const cap = c.students.some(s => s.dream || s.msg) ? 9.6 : flower ? 3.6 : 5.6, ratio = flower ? 2 / 3 : .8;
  const phOf = per => { const rows = Math.ceil(per / cols); return (A * .62 + (flower ? 1.8 : 0) - rg * (rows - 1)) / rows - cap; };
  let k = 2;   // 틀이 너무 작아지면 2쪽씩 늘림 (좌우 쪽 크기는 항상 같음)
  while (phOf(Math.ceil(most / (k / 2))) < 14 && k < 8) k += 2;
  const per = Math.ceil(most / (k / 2)), ph = Math.min(phOf(per), colW * (flower ? 1.5 : 1.25)), sz = { pw: flower ? Math.min(colW * .96, ph * .8) : ph * ratio, ph };
  // 조 단체사진은 2.2:1, 증명사진 줄은 단체사진과 같은 폭으로 맞춤 (남는 38% 높이를 나눔)
  const gap = 1.2, room = A * .38 - 5.8;
  const teamH = flower ? Math.max(12, (room + 1.25 * (per - 1) * gap / per) / (1 + 1.25 * 2.2 / per)) : Math.max(12, room);
  const teamW = Math.min(86, teamH * 2.2), mw = (teamW - (per - 1) * gap) / per;
  return Array.from({ length: k }, (_, p) => {
    const part = p < k / 2 ? 0 : 1, j = p - part * (k / 2), chunk = parts[part].slice(j * per, (j + 1) * per), r = Math.ceil(chunk.length / cols);
    const team = part + 1, teamName = tags.length >= 2 ? (part ? tags.slice(1).join('·') : tags[0]) : `${team}조`, teamPage = p === k / 2 - 1 || p === k - 1;
    const cards = chunk.map(({ s, i }) => (flower ? `
      <figure class="stu flower"><div class="fl-frame">${P(`c${ci}-fl${i}`)}</div>
        <figcaption><div class="stu-name">${brushStroke(PAL[tone[i % 3]], ci * 1000 + i)}${esc(s.name)}</div>
        ${s.dream ? `<div class="stu-dream">꿈 · ${esc(s.dream)}</div>` : ''}${s.msg ? `<div class="stu-msg">${esc(s.msg)}</div>` : ''}</figcaption></figure>`
      : stuCard(s, `c${ci}-s${i}`, PAL[tone[i % 3]], ci * 1000 + i))).join('');
    const minis = flower ? chunk.map(({ i }) => `<div class="out-mini">${P(`c${ci}-s${i}`)}</div>`).join('') : '';
    const teams = teamPage ? `<div class="teams one" style="width:${f(teamW)}cqw;height:${f(teamH + 3)}cqw">
      <div class="cp"><div class="gframe">${P(`c${ci}-team${team}`)}</div>${E(`c${ci}-teamCap${team}`, `${teamName} 단체사진`, 'cap')}</div>
    </div>` : '';
    return {
      kind: 'students', label: `${c.name} · 학생 프로필 ${p + 1}/${k}`, bg: ['top', tone],
      html: `<div class="col${flower ? ' prof-fl' : ''}">${head('Our Friends', `${esc(c.name)} · ${teamName}`)}
        ${r ? `<div class="stu-grid team-grid c5" style="${gridStyle(r, cols, cg, sz)}">${cards}</div>` : '<div class="grow"></div>'}
        ${minis ? `<div class="out-strip id-strip" style="--mw:${f(mw)}cqw;--mh:${f(mw * 1.25)}cqw">${minis}</div>` : ''}
        ${teams}</div>`,
    };
  });
}

/* 10–11쪽 — 학생 야외 프로필 */
function outdoorPages(c, ci, tone) {
  // 쪽마다 정해진 인원(기본 7명 = 4+3): 남는 높이를 채우도록 틀을 세로로 길게
  const cols = 4, cg = 3, rg = 2.2, cap = 5.5, n = c.students.length, most = Math.max(1, parseInt(S.outdoorPer, 10) || 7);
  const k = Math.max(2, Math.ceil(n / most / 2) * 2), per = Math.max(1, Math.ceil(n / k));
  // 쪽 아래 작은 사진 띠: 쪽마다 학생 수를 나눠 한 줄로
  const useStrip = S.useStrip !== false, stripN = Math.max(4, per), stripW = (86 - (stripN - 1) * 1.4) / stripN;
  const strip = { per: stripN, w: stripW, h: stripW * 1.25 };
  const avail = SAFE_H() - HEAD_H - (useStrip ? strip.h + 2.6 : 0);
  const rowN = Math.ceil(per / cols), colW = (86 - (cols - 1) * cg) / cols;
  const ph = Math.min((avail - rg * (rowN - 1)) / rowN - cap, colW * 1.9);
  const sz = { pw: Math.min(colW, ph * .667), ph };
  return Array.from({ length: k }, (_, p) => {
    const stripCells = !useStrip ? '' : c.students.map((_, i) => i).slice(p * strip.per, (p + 1) * strip.per)
      .map(i => `<div class="out-mini">${P(`c${ci}-ox${i}`)}</div>`).join('');
    const start = p * per, chunk = c.students.slice(start, start + per), r = Math.ceil(chunk.length / cols);
    const cards = chunk.map((s, i) => `
      <figure class="out"><div class="out-frame">${P(`c${ci}-o${start + i}`)}</div><figcaption>${esc(s.name)}</figcaption></figure>`).join('');
    return {
      kind: 'outdoor', label: `${c.name} · 야외 프로필 ${p + 1}/${k}`, bg: [p % 2 ? 'soft' : 'side', [tone[1], tone[2], tone[0]]],
      html: `<div class="col">${head('Outdoor Portraits', `${esc(c.name)} · 야외 프로필`)}
        ${r ? `<div class="stu-grid out-grid" style="${gridStyle(r, cols, cg, sz)}">${cards}</div>` : ''}
        ${stripCells ? `<div class="out-strip" style="--mw:${f(strip.w)}cqw;--mh:${f(strip.h)}cqw">${stripCells}</div>` : ''}</div>`,
    };
  });
}

/* 악기 프로필 (판 구성에서 켬): 야외 프로필과 같은 틀 · 쪽당 인원, 아래 작은 사진 줄 없이 틀을 크게. 항상 짝수 쪽 */
function instrPages(c, ci, tone) {
  if (!S.useInstr) return [];
  const n = c.students.length, most = Math.max(1, parseInt(S.outdoorPer, 10) || 7);
  const k = Math.max(2, Math.ceil(n / most / 2) * 2), per = Math.max(1, Math.ceil(n / k));
  return Array.from({ length: k }, (_, p) => {
    const start = p * per, chunk = c.students.slice(start, start + per).map((s, i) => [s, start + i]);
    const top = Math.ceil(chunk.length / 2);         // 두 줄로 나누어 틀이 쪽을 꽉 채움 (7명 = 4+3, 6명 = 3+3)
    const row = list => `<div class="in-row">${list.map(([s, i]) => `
      <figure class="out"><div class="out-frame">${P(`c${ci}-in${i}`)}</div><figcaption>${esc(s.name)}</figcaption></figure>`).join('')}</div>`;
    return {
      kind: 'instr', label: `${c.name} · 악기 프로필 ${p + 1}/${k}`, bg: [p % 2 ? 'side' : 'soft', [tone[2], tone[0], tone[1]]],
      html: `<div class="col">${head('With Music', `${esc(c.name)} · 악기 프로필`)}
        ${chunk.length ? `<div class="in-grid">${row(chunk.slice(0, top))}${chunk.length > top ? row(chunk.slice(top)) : ''}</div>` : ''}</div>`,
    };
  });
}

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
const floor2 = n => Math.floor(n * 100) / 100;

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
const galleryPhotoCell = key => `<div class="gcell"><div class="gslot sh-${galShape(photos[key])}">${P(key)}</div>
      <button class="gal-shape" data-key="${key}" title="틀 모양 바꾸기">${SHAPE_LABEL[photos[key].shape || 'auto']}</button></div>`;
const galleryTitleCell = ev => `<div class="gcell gtitle"><div class="en-cap">Event</div>${E(ev.titleKey, ev.def, 'gal-title')}<div class="rule"></div></div>`;

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

const galleryPageOf = (p, n, heading, inner, extra = '', cls = '') => ({
  kind: 'gallery', label: `행사 갤러리 ${p + 1}/${n}`, bg: [p % 2 ? 'soft' : 'top', TONES[p % TONES.length]],
  html: `<div class="col gal-col">
      ${head('Gallery', heading)}${extra}
      <div class="gallery ${cls}">${inner}</div>
    </div>`,
});
/** 칸의 가로세로 비율: 가로 사진은 가로로, 세로 사진은 세로로 (원형·육각형과 행사 제목은 정사각에 가깝게) */
const galleryAsp = r => (galShape(r) !== 'rect' ? 1 : Math.min(1.8, Math.max(.6, r.w / r.h)));
/**
 * 한 쪽 칸들을 줄로 나눔: 줄마다 폭 86cqw를 사진 비율대로 나눠 좌우 끝선이 항상 맞음.
 * 순서를 지키며 정해진 줄 수(기본 5줄, 줄당 2~5칸) 중 쪽 높이에 가장 잘 맞는 나눔을 고르고, 남거나 넘치는 높이는 줄 높이로 조절.
 * 칸이 모자란 마지막 쪽만 줄이 적을 수 있음.
 */
// 한 쪽 줄 수, 칸 수(행사 제목 칸 포함). S.galCells가 있으면 쪽당 칸 수를 그 값으로 (전체 쪽수에 맞춰 사진 크기를 세밀하게 조절할 때)
const galleryCellCount = () => (S.galCells ? Math.min(18, Math.max(6, parseInt(S.galCells, 10))) : galleryRowCount() * 3);
const galleryRowCount = () => (S.galCells ? Math.min(6, Math.max(3, Math.round(galleryCellCount() / 3))) : Math.min(6, Math.max(3, parseInt(S.galRows, 10) || 5)));
/* 쪽수 맞춤(S.galCells) 갤러리: 모든 쪽에 사진 수를 고르게 나누고, 쪽마다 3줄 또는 4줄로 빈 곳 없이 채움.
   사진 크기가 쪽 안에서 비슷하도록: 줄 높이는 모두 같게, 칸 폭은 사진 비율의 제곱근만큼만 차이 (나머지는 틀 안에서 잘림).
   줄 나눔은 사진 면적이 가장 고르고 잘림이 적은 것으로 고름 (행사 제목 칸은 면적 비교에서 뺌) */
const galleryEven = () => !!S.galCells;
const GAL_EVEN_B = .5;
function galleryRowsEven(asps, H, isTitle = [], W = 86, gap = 1.6) {
  const n = asps.length, wt = asps.map(a => Math.pow(a, GAL_EVEN_B));
  const opts = n >= 9 ? [3, 4] : n >= 6 ? [2, 3] : [Math.max(1, Math.ceil(n / 3))];
  let best = null;
  const walk = (from, lens) => {
    if (from === n) {
      if (!opts.includes(lens.length)) return;
      const h = (H - gap * (lens.length - 1)) / lens.length, areas = [], crops = [];
      let i = 0;
      for (const len of lens) {
        const wa = W - gap * (len - 1), sw = wt.slice(i, i + len).reduce((s, v) => s + v, 0);
        for (let j = i; j < i + len; j++) { if (isTitle[j]) continue; const w = wa * wt[j] / sw; areas.push(w * h); crops.push(Math.abs(Math.log(w / h / asps[j]))); }
        i += len;
      }
      const score = areas.length ? Math.log(Math.max(...areas) / Math.min(...areas)) * 40 + Math.max(...crops) * 60 : 0;
      if (!best || score < best.score) best = { lens, h, score };
      return;
    }
    if (lens.length === Math.max(...opts)) return;
    for (let len = n < 2 ? 1 : 2; len <= 5 && from + len <= n; len++) if (n - from - len !== 1) walk(from + len, [...lens, len]);
  };
  walk(0, []);
  if (!best) return galleryRows(asps, H, false, W, gap);
  let i = 0;
  return best.lens.map(len => { const items = Array.from({ length: len }, (_, j) => i + j); i += len; return { items, h: best.h, flex: items.map(j => wt[j]) }; });
}
function galleryRows(asps, H, last, W = 86, gap = 1.6) {
  const fill = last && asps.length >= galleryCellCount() * .6;      // 마지막 쪽이라도 칸이 60% 넘게 차면 다른 쪽처럼 쪽 높이를 채움 (사진을 키움)
  if (fill) last = false;
  const n = asps.length, heightOf = (from, len) =>
    (W - gap * (len - 1)) / asps.slice(from, from + len).reduce((s, a) => s + a, 0);
  let best = null;
  const walk = (from, lens) => {
    if (from === n) {
      if ((n === galleryCellCount() || fill) && lens.length !== galleryRowCount()) return;      // 꽉 찬 쪽 · 거의 찬 마지막 쪽은 다른 쪽과 같은 줄 수
      const hs = []; lens.reduce((i, len) => { hs.push(heightOf(i, len)); return i + len; }, 0);
      const total = hs.reduce((s, h) => s + h, 0) + gap * (lens.length - 1);
      const mean = (total - gap * (lens.length - 1)) / lens.length;
      const score = (total > H ? (total - H) * 2 : H - total) + hs.reduce((s, h) => s + Math.abs(h - mean), 0) * .9
        + lens.reduce((s, len) => s + Math.abs(len - 3), 0) * (fill ? 2 : 5);              // 줄마다 3장 안팎, 높이도 고르게 (거의 찬 마지막 쪽은 쪽을 채우는 쪽을 더 중시)
      if (!best || score < best.score) best = { lens, hs, score };
      return;
    }
    if (lens.length === galleryRowCount()) return;
    for (let len = n < 2 ? 1 : 2; len <= 5 && from + len <= n; len++) if (n - from - len !== 1) walk(from + len, [...lens, len]);
  };
  walk(0, []);
  const free = H - gap * (best.lens.length - 1), sum = best.hs.reduce((s, h) => s + h, 0);
  const k = sum > free ? free / sum : last ? 1 : Math.min(S.galCells ? 1.4 : 1.15, free / sum);      // 조금 남으면 칸을 늘리고 나머지는 줄 간격으로 (쪽수 맞춤 갤러리는 쪽 높이를 끝까지 채움)
  let i = 0;
  return best.lens.map((len, ri) => { const items = Array.from({ length: len }, (_, j) => i + j); i += len; return { items, h: best.hs[ri] * k }; });
}
/**
 * 쪽마다 줄 수 × 3칸(기본 15칸). 행사 제목도 한 칸을 차지하고, 행사가 끝나면 그 자리에 다음 행사를 바로 이어
 * 빈 칸을 남기지 않음(전체의 마지막 쪽만 남을 수 있음). 사진이 하나도 없으면 빈 틀 쪽을 보여 줌.
 */
function galleryPages() {
  const events = galleryEvents();
  if (!events.length) {
    const n = galleryCount();
    return Array.from({ length: n }, (_, p) => galleryPageOf(p, n, E(`gal-title-${p}`, galleryTitleDef(p), 'gal-title', 'span'),
      Array.from({ length: GALLERY_PER }, (_, k) => `<div class="gcell"><div class="gslot sh-rect">${P(`g${p}-${k}`)}</div></div>`).join('')));
  }
  const cells = events.flatMap(ev => [{ asp: 1, title: true, html: galleryTitleCell(ev) },...ev.keys.map(k => ({ asp: galleryAsp(photos[k]), html: galleryPhotoCell(k) }))]);
  const CELLS = galleryCellCount(), n = Math.ceil(cells.length / CELLS), H = SAFE_H() - HEAD_H - .5, even = galleryEven();
  const base = Math.floor(cells.length / n), extra = cells.length % n, startOf = p => (even ? p * base + Math.min(p, extra) : p * CELLS);
  return Array.from({ length: n }, (_, p) => {
    const page = cells.slice(startOf(p), even ? startOf(p + 1) : (p + 1) * CELLS);
    const rows = even ? galleryRowsEven(page.map(c => c.asp), H, page.map(c => !!c.title)) : galleryRows(page.map(c => c.asp), H, p === n - 1 && page.length < CELLS);
    const inner = rows.map(row => `<div class="gal-row" style="height:${floor2(row.h)}cqw">${row.items.map((i, j) =>
      `<div class="gal-slot" data-asp="${page[i].asp}" style="flex:${row.flex ? +row.flex[j].toFixed(4) : page[i].asp} 1 0">${page[i].html}</div>`).join('')}</div>`).join('');
    return galleryPageOf(p, n, E('gal-heading', '행사 갤러리', 'gal-title', 'span'), inner,
      p === n - 1 ? '<button class="gal-add">＋ 사진 추가</button>' : '', 'flow');
  });
}

/* 마지막 — 서로에게 남기는 말: 롤링페이퍼 이미지 1장을 꾸며 넣음 (이미지 비율대로 틀 조정) */
const rollingKey = i => (i ? `rolling-${i + 1}` : 'rolling'), isRollingKey = k => /^rolling(-\d+)?$/.test(k);
const rollingCount = () => Math.min(6, Math.max(1, parseInt(S.msgPages, 10) || 1));
function rollingFrame(key = 'rolling') {
  const r = photos[key], maxW = 77, maxH = SAFE_H() - 31;
  const a = r ? Math.min(3, Math.max(.35, r.w / r.h)) : maxW / maxH;
  const iw = Math.min(maxW, maxH * a);
  return { w: floor2(iw + 2.8), h: floor2(iw / a + 2.8) };   // 2.8 = 흰 여백(1.4cqw) 양쪽
}
/* 교가 — 악보 이미지 · 가사 글자 (둘 중 하나만 있어도 됨)
   앞쪽에 끼우면 뒤 쪽들의 좌우가 바뀌므로(1조 왼쪽 · 2조 오른쪽) 롤링페이퍼 앞에 둠 */
function songPages() {
  if (S.useSong === false || S.useFaculty === false) return [];    // 명렬을 안 넣으면 교가는 상징 쪽에 들어감
  return [{
    kind: 'song', label: '교가', bg: ['soft', ['butter', 'sky', 'sage']],
    html: `<div class="col song-col">
      ${ttl('School Song', '교가')}
      ${songBody()}
    </div>`,
  }];
}

/* 서로에게 남기는 말: 쪽마다 제목 · 이미지 따로 (쪽수는 판 구성에서 정함, 맨 뒤라 앞쪽 좌우에 영향 없음) */
function messagesPage(i = 0) {
  const key = rollingKey(i), fr = rollingFrame(key), many = rollingCount() > 1;
  const titleKey = `rolling-title-${i}`, title = texts[titleKey] ?? '서로에게 남기는 말';
  return {
    kind: 'messages', label: many ? `${title} ${i + 1}/${rollingCount()}` : title, bg: ['center', [['lavender', 'peach', 'mint'], ['peach', 'butter', 'sky'], ['mint', 'lavender', 'butter']][i % 3]],
    html: `<div class="col rolling-col" data-roll="${i}">
      <div class="ttl"><div class="script">Dear Friends</div>${E(titleKey, '서로에게 남기는 말', 'h-ko roll-title', 'h2')}<div class="rule"></div></div>
      <div class="rolling-area">
        <div class="rolling" style="width:${fr.w}cqw;height:${fr.h}cqw">
          <span class="tape" style="background:${PAL.blush};left:7%;transform:translateX(-50%) rotate(-32deg)"></span>
          <span class="tape" style="background:${PAL.sky};left:93%;transform:translateX(-50%) rotate(32deg)"></span>
          <span class="tape tape-b" style="background:${PAL.butter};left:50%;transform:translateX(-50%) rotate(-2deg)"></span>
          ${P(key)}
        </div>
      </div>
      ${E(i ? `rolling-cap-${i + 1}` : 'rolling-cap', many ? '' : T.rollingCap, 'cap')}
    </div>`,
  };
}



/* 디자이너2와 같은 쪽 순서: 표지 · 학교 2쪽 · 교장 · 상징(또는 명렬) · 반마다 담임/단체/프로필/야외/악기 · 교정 · 갤러리 · 교가 · 롤링페이퍼 */
window.v2Pages = function (classes, teachers) {
  const pages = [coverPage(), ...campusPages(), leadersPage(), ...(S.useFaculty === false ? [symbolPage()] : facultyPages(teachers))];
  classes.forEach((c, ci) => {
    const tone = TONES[ci % TONES.length];
    pages.push(...classIntroPages(c, ci, tone), ...profilePages(c, ci, tone), ...outdoorPages(c, ci, tone), ...instrPages(c, ci, tone));
  });
  pages.push(...scenePages(), ...galleryPages(), ...songPages(), ...Array.from({ length: rollingCount() }, (_, i) => messagesPage(i)));
  return pages;
};
window.v2MessagesHtml = i => messagesPage(i).html;
})();