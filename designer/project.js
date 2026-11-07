/* ============================================================
   학교별 앨범: 목록 · 프로젝트 파일(.album) · 학교 폴더 한 번에 불러오기 · 점검표 · 판 구성 템플릿
   ============================================================ */
const ALBUM_MAGIC = 'GRADALB1';
const TEMPLATES_KEY = 'gradAlbum.templates';
const LAYOUT_KEYS = ['theme', 'size', 'bleed', 'soloShape', 'useFlower', 'useStrip', 'useScene', 'useSceneRow', 'useSong', 'useFaculty', 'useVice', 'useInstr', 'msgPages', 'outdoorPer', 'galRows', 'wrapOn', 'wrapSpine', 'wrapFold', 'wrapHinge', 'wrapBoard'];
const BUILTIN_TEMPLATES = [
  { name: '산양중 2025 배치', cfg: { useFlower: true, useStrip: true, useScene: false, useSong: true, useFaculty: false, useVice: false, useInstr: true, msgPages: 3 } },
  { name: '꽃 프로필 · 작은 사진 포함', cfg: { useFlower: true, useStrip: true, useScene: true, useSceneRow: true, useSong: true, useFaculty: true, useVice: true, outdoorPer: 7, galRows: 5 } },
  { name: '기본 (증명사진 크게 · 추가 쪽 없음)', cfg: { useFlower: false, useStrip: false, useScene: false, useSceneRow: false, useSong: false, useFaculty: true, useVice: true, outdoorPer: 7, galRows: 4 } },
];

/* ---------------- 앨범 목록 ---------------- */
function albumRegistry() {
  const r = projectList();
  r.ids = r.ids?.length ? r.ids : ['default'];
  r.current = r.ids.includes(r.current) ? r.current : r.ids[0];
  r.saved = r.saved || {};
  return r;
}
const writeRegistry = r => localStorage.setItem(PROJECTS_KEY, JSON.stringify(r));
function albumLabel(id) {
  let st = {};
  try { st = JSON.parse(localStorage.getItem(storeKeyOf(id)) || '{}').settings || {}; } catch {}
  return `${st.school || (id === 'default' ? DEFAULTS.school : '이름 없는 학교')} ${st.year || ''}`.trim();
}
function flushState() {
  clearTimeout(saveTimer);
  localStorage.setItem(STORE_KEY, JSON.stringify({ settings: S, texts }));
}
function switchAlbum(id) {
  flushState();
  const r = albumRegistry();
  r.current = id;
  writeRegistry(r);
  location.reload();
}
function createAlbum(settings, textsIn = {}) {
  const r = albumRegistry(), id = `p${Date.now().toString(36)}`;
  localStorage.setItem(storeKeyOf(id), JSON.stringify({ settings, texts: textsIn }));
  r.ids.push(id);
  writeRegistry(r);
  return id;
}
function deleteAlbum(id) {
  const r = albumRegistry();
  localStorage.removeItem(storeKeyOf(id));
  indexedDB.deleteDatabase(dbNameOf(id));
  r.ids = r.ids.filter(x => x !== id);
  delete r.saved[id];
  if (!r.ids.length) r.ids = ['default'];
  r.current = r.ids[0];
  writeRegistry(r);
  location.reload();
}

/* ---------------- 프로젝트 파일 (.album) ----------------
   'GRADALB1' + 머리글 길이(4바이트) + 머리글 JSON + 사진 원본들을 차례로 이어 붙임.
   전체를 메모리에 올리지 않으므로 사진이 많아도 저장 · 열기가 가능함. */
async function buildAlbumBlob() {
  flushState();
  const recs = await DB.all(), parts = [], list = [];
  let offset = 0;
  for (const [key, r] of Object.entries(recs)) {
    if (!r?.blob) continue;
    const { blob, ...meta } = r;
    list.push({ key, meta, offset, size: blob.size, type: blob.type, name: blob.name || '' });
    parts.push(blob);
    offset += blob.size;
  }
  const head = new TextEncoder().encode(JSON.stringify({ format: 'gradAlbum', version: 1, savedAt: new Date().toISOString(), settings: S, texts, photos: list }));
  const len = new Uint8Array(4);
  new DataView(len.buffer).setUint32(0, head.length, true);
  return { blob: new Blob([ALBUM_MAGIC, len, head, ...parts], { type: 'application/octet-stream' }), count: list.length };
}
async function readAlbumHeader(file) {
  const first = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (new TextDecoder().decode(first.slice(0, 8)) !== ALBUM_MAGIC) throw new Error('졸업앨범 프로젝트 파일(.album)이 아닙니다.');
  const n = new DataView(first.buffer).getUint32(8, true);
  const head = JSON.parse(await file.slice(12, 12 + n).text());
  return { head, dataStart: 12 + n };
}
const albumFileName = () => `${(`${S.school}_${S.year}`).replace(/[\\/:*?"<>|\s]+/g, '_')}.album`;
async function saveAlbumFile(info) {
  info.textContent = '프로젝트 파일 만드는 중…';
  const { blob, count } = await buildAlbumBlob();
  const name = albumFileName();
  let saved = false;
  if (window.showSaveFilePicker) {
    try {
      const h = await showSaveFilePicker({ suggestedName: name, types: [{ description: '졸업앨범 프로젝트', accept: { 'application/octet-stream': ['.album'] } }] });
      info.textContent = '파일에 쓰는 중…';
      const w = await h.createWritable();
      await w.write(blob);
      await w.close();
      saved = true;
    } catch (e) {
      if (e.name === 'AbortError') { info.textContent = '저장을 취소했습니다.'; return; }
    }
  }
  if (!saved) {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 300000);
  }
  const r = albumRegistry();
  r.saved[PROJECT_ID] = new Date().toISOString();
  writeRegistry(r);
  info.textContent = `저장했습니다: ${name} · 사진 ${count}장 · ${(blob.size / 1048576).toFixed(0)}MB`;
  showLastSaved();
}
function openDbOf(id) {
  return new Promise((res, rej) => {
    const r = indexedDB.open(dbNameOf(id), 1);
    r.onupgradeneeded = () => r.result.createObjectStore('photos');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
const dbPut = (db, k, v) => new Promise((res, rej) => {
  const tx = db.transaction('photos', 'readwrite');
  tx.objectStore('photos').put(v, k);
  tx.oncomplete = res;
  tx.onerror = tx.onabort = () => rej(tx.error || new Error('저장 공간이 부족합니다.'));
});
/** 파일을 항상 새 앨범으로 열어 지금 앨범을 덮어쓰지 않음. 새 앨범 번호를 돌려줌 */
async function loadAlbumFile(file, progress = () => {}) {
  const { head, dataStart } = await readAlbumHeader(file);
  const est = await navigator.storage?.estimate?.();
  if (est && est.quota - est.usage < file.size * 1.1) throw new Error('저장 공간이 부족합니다. 사용하지 않는 앨범을 지운 뒤 다시 시도하세요.');
  const r = albumRegistry(), id = `p${Date.now().toString(36)}`;
  const db = await openDbOf(id);
  try {
    let i = 0;
    for (const ph of head.photos) {
      progress(++i, head.photos.length);
      const part = file.slice(dataStart + ph.offset, dataStart + ph.offset + ph.size, ph.type);
      await dbPut(db, ph.key, { ...ph.meta, blob: ph.name ? new File([part], ph.name, { type: ph.type }) : part });
    }
  } catch (e) {
    db.close();
    indexedDB.deleteDatabase(dbNameOf(id));
    throw e;
  }
  db.close();
  localStorage.setItem(storeKeyOf(id), JSON.stringify({ settings: head.settings, texts: head.texts }));
  r.ids.push(id);
  r.saved[id] = head.savedAt;
  writeRegistry(r);
  return { id, count: head.photos.length };
}

/* ---------------- 대화상자 공통 ---------------- */
function showPrj(title, body, buttons) {
  const d = $('#prj-dlg');
  d.querySelector('.pd-title').textContent = title;
  d.querySelector('.prj-body').innerHTML = body;
  const foot = d.querySelector('.pd-btns');
  foot.innerHTML = '';
  for (const b of buttons) {
    const el = document.createElement('button');
    el.type = 'button'; el.className = `pd-btn${b.main ? ' main' : ''}`; el.textContent = b.text;
    el.addEventListener('click', b.on);
    foot.appendChild(el);
  }
  if (!d.open) d.showModal();
  return d;
}
const closePrj = () => { const d = $('#prj-dlg'); if (d.open) d.close(); };

function loadTemplates() {
  let mine = [];
  try { mine = JSON.parse(localStorage.getItem(TEMPLATES_KEY)) || []; } catch {}
  return [...BUILTIN_TEMPLATES, ...mine];
}
const templateOptions = () => loadTemplates().map((t, i) => `<option value="${i}">${esc(t.name)}</option>`).join('');

function newAlbumDialog() {
  showPrj('새 앨범 만들기', `
    <div class="pd-grid prj-grid">
      <span>학교 이름:</span><input type="text" id="na-school" placeholder="예: ○○초등학교">
      <span>졸업 연도:</span><input type="text" id="na-year" value="${esc(S.year)}">
      <span>졸업 회차:</span><input type="text" id="na-nth">
      <span>판 구성:</span><select id="na-tpl">${templateOptions()}</select>
      <span>판형:</span><select id="na-size">${Object.entries(SIZES).map(([k, v]) => `<option value="${k}"${k === S.size ? ' selected' : ''}>${esc(v.name)}</option>`).join('')}</select>
    </div>
    <p class="pd-note">지금 앨범은 그대로 남습니다. 위쪽 앨범 목록에서 언제든 돌아올 수 있습니다.</p>
    <div id="na-msg" class="prj-msg"></div>`, [
    { text: '만들기', main: true, on: () => {
      const school = $('#na-school').value.trim();
      if (!school) { $('#na-msg').textContent = '학교 이름을 입력하세요.'; return; }
      const tpl = loadTemplates()[+$('#na-tpl').value];
      flushState();
      const id = createAlbum({ ...DEFAULTS, ...tpl.cfg, size: $('#na-size').value, school, year: $('#na-year').value.trim(), nth: $('#na-nth').value.trim(), principal: '', vice: '', teachers: '', roster: '# 6학년 1반', galleryPages: 11, zoom: S.zoom });
      switchAlbum(id);
    } },
    { text: '취소', on: closePrj },
  ]);
}

/* ---------------- 학교 폴더 불러오기 ---------------- */
function prjLoadScript(global, src) {
  if (window[global]) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res;
    s.onerror = () => rej(new Error('필요한 기능을 불러오지 못했습니다. 인터넷 연결을 확인하세요.'));
    document.head.appendChild(s);
  });
}
/** PDF의 글자를 줄 단위 칸 목록으로 */
async function pdfRows(file) {
  await prjLoadScript('pdfjsLib', 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const doc = await pdfjsLib.getDocument({ data: await file.arrayBuffer(), cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/', cMapPacked: true }).promise;
  const out = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const rows = new Map();
    for (const it of (await (await doc.getPage(n)).getTextContent()).items) {
      if (!it.str.trim()) continue;
      const y = Math.round(it.transform[5] / 3) * 3;
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push([it.transform[4], it.str.trim()]);
    }
    [...rows.keys()].sort((a, b) => b - a).forEach(y => out.push(rows.get(y).sort((a, b) => a[0] - b[0]).map(c => c[1])));
  }
  return out;
}
const HANGUL_NAME = /^[가-힣]{2,5}$/;
function studentNamesFromPdf(rows) {
  return rows.filter(r => /^\d+$/.test(r[0]) && HANGUL_NAME.test(r[1] || '')).map(r => r[1]);
}
/** 번호 · 직위 · 성명 표: 줄 앞이 번호이고 마지막 한글 칸이 성명 */
function teachersFromPdf(rows) {
  const list = [];
  for (const r of rows) {
    if (!/^\d{1,3}$/.test(r[0])) continue;     // '2026 학년도 …' 제목 줄 제외
    let at = -1;
    for (let i = r.length - 1; i > 0; i--) if (HANGUL_NAME.test(r[i])) { at = i; break; }
    if (at < 2) continue;
    list.push(`${r.slice(1, at).join('')} | ${r[at]}`);
  }
  return list.join('\n');
}
async function hwpxParagraphs(file) {
  await prjLoadScript('JSZip', 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const out = [];
  for (const name of Object.keys(zip.files).filter(n => /Contents\/section\d+\.xml$/.test(n)).sort()) {
    const xml = await zip.files[name].async('string');
    for (const p of xml.split(/<\/hp:p>/)) {
      const t = [...p.matchAll(/<hp:t[^>]*>([^<]*)<\/hp:t>/g)].map(m => m[1]).join('');
      if (t.trim()) out.push(t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim());
    }
  }
  return out;
}
function slotCatalog(classes, teachers) {
  const cat = { id: [], flower: [], outdoor: [], strip: [], teacher: [], group: [{ key: 'cover-group', label: '1쪽 대표 단체사진' }], land: [], scene: [], sym: [], leader: [] };
  classes.forEach((c, ci) => {
    const n = classes.length > 1 ? `${c.name} ` : '';
    c.students.forEach((s, i) => {
      cat.id.push({ key: `c${ci}-s${i}`, label: `${n}${s.name} 증명사진` });
      cat.flower.push({ key: `c${ci}-fl${i}`, label: `${n}${s.name} 꽃 프로필` });
      cat.outdoor.push({ key: `c${ci}-o${i}`, label: `${n}${s.name} 야외 프로필` });
      if (S.useInstr) cat.outdoor.push({ key: `c${ci}-in${i}`, label: `${n}${s.name} 악기 프로필` });
      cat.strip.push({ key: `c${ci}-ox${i}`, label: `${n}${s.name} 야외 작은 사진` });
      cat.outdoor.push({ key: `c${ci}-ca${i}`, label: `${n}${s.name} 학사모` }, { key: `c${ci}-po${i}`, label: `${n}${s.name} 포즈` });
    });
    cat.teacher.push({ key: `c${ci}-teacher`, label: `${n}담임 선생님` });
    cat.group.push({ key: `c${ci}-group`, label: `${n}반 단체사진 1` }, { key: `c${ci}-group2`, label: `${n}반 단체사진 2` }, { key: `c${ci}-group3`, label: `${n}반 단체사진 3` },
      { key: `c${ci}-group4`, label: `${n}반 단체사진 4` }, { key: `c${ci}-team1`, label: `${n}1조 단체사진` }, { key: `c${ci}-team2`, label: `${n}2조 단체사진` },
      ...[1, 2, 3, 4].map(k => ({ key: `c${ci}-big${k}`, label: `${n}큰 단체사진 ${k}` })));
  });
  teachers.forEach(t => cat.teacher.push({ key: `t-${t.name}`, label: `${t.name} 선생님` }));
  cat.leader.push({ key: 'principal', label: '교장 선생님 (큰 사진)' }, { key: 'principal-2', label: '교장 선생님 (작은 사진)' });
  if (S.useVice === false) cat.group.push({ key: 'leader-group', label: '4쪽 단체사진' });
  else cat.leader.push({ key: 'vice', label: '교감 선생님 (큰 사진)' }, { key: 'vice-2', label: '교감 선생님 (작은 사진)' });
  cat.land.push({ key: 'campus-0', label: '2쪽 큰 사진' }, { key: 'campus-1', label: '3쪽 큰 사진' });
  for (let i = 0; i < 5; i++) cat.land.push({ key: `campus-x${i}`, label: `2–3쪽 작은 풍경 ${i + 1}` });
  for (let i = 0; i < 10; i++) cat.scene.push({ key: `scene-${i}`, label: `교정 곳곳 ${i + 1}` });
  cat.sym.push({ key: 'sym-emblem', label: '교표' }, { key: 'sym-motto', label: '교훈 사진' }, { key: 'sym-tree', label: '교목' }, { key: 'sym-flower', label: '교화' }, { key: 'song', label: '교가 악보' }, { key: 'sym-extra', label: '5쪽 사진' });
  for (let i = 0; i < rollingCount(); i++) cat.sym.push({ key: rollingKey(i), label: rollingCount() > 1 ? `롤링페이퍼 ${i + 1}쪽` : '롤링페이퍼' });
  return cat;
}
const IMG_EXT = /\.(jpe?g|png|webp)$/i, RAW_EXT = /\.(cr2|cr3|nef|arw|dng|raf)$/i;
const OPTIONS_OF = { id: ['id'], flower: ['flower'], outdoor: ['outdoor', 'strip'], teacher: ['teacher', 'leader'], group: ['group', 'scene', 'land'], scene: ['scene', 'group'], land: ['land', 'scene'], other: ['group', 'scene', 'land', 'sym', 'leader', 'teacher'] };

/**
 * 폴더 안 파일을 자리별로 나눔. 지금 앨범은 바꾸지 않고 계획만 돌려줌.
 * 명단은 비어 있거나 예시일 때만 파일에서 가져오고, 이미 넣은 명단은 그대로 둠.
 */
async function planFolderImport(entries, progress = () => {}) {
  const items = entries.map(e => {
    const path = e.path.normalize('NFC'), parts = path.split('/');
    return { file: e.file, path, parts, name: parts[parts.length - 1], dir: parts.slice(0, -1).join('/') };
  }).filter(x => !x.parts.some(p => /원본|삭제|document fonts|^links$|^\./i.test(p)) && !x.name.startsWith('~$'));
  const hasClean = items.some(x => x.parts.includes('정리본'));
  const plan = { jobs: [], loose: [], notes: [], titles: {}, raw: [], roster: null, teachers: null, principal: '', vice: '', galleryPages: 0, skippedEvents: [] };

  const sheetName = /\.(xlsx|xls|csv)$/i, pdfName = /\.pdf$/i;
  const docs = items.filter(x => (sheetName.test(x.name) || pdfName.test(x.name)) && !/양식|template/i.test(x.name));
  const isTeacherDoc = x => /교직원|교원/.test(x.name) || (/선생|교사/.test(x.name) && /명부|명단/.test(x.name));
  const stuDocs = docs.filter(x => !isTeacherDoc(x) && !/선생|교사|명렬/.test(x.name) && /학생|student|명부|명단/i.test(x.name)).sort((a, b) => sheetName.test(b.name) - sheetName.test(a.name));
  const teaDocs = docs.filter(isTeacherDoc).sort((a, b) => sheetName.test(b.name) - sheetName.test(a.name));

  const hasStudents = parseRoster(S.roster).some(c => c.students.length) && S.roster !== DEFAULT_ROSTER;
  if (!hasStudents && stuDocs[0]) {
    const doc = stuDocs[0];
    progress('학생 명단 읽는 중…');
    try {
      if (sheetName.test(doc.name)) {
        const wb = await readWorkbook(doc.file);
        const res = studentsFromRows(sheetRows(wb.Sheets[wb.SheetNames.find(n => !TEACHER_SHEET.test(n)) || wb.SheetNames[0]]));
        if (res?.count) { plan.roster = res.text; plan.notes.push(`학생 ${res.count}명: ${doc.name}`); }
      } else {
        const names = studentNamesFromPdf(await pdfRows(doc.file));
        if (names.length) { plan.roster = `# ${parseRoster(S.roster)[0].name}\n${names.join('\n')}`; plan.notes.push(`학생 ${names.length}명: ${doc.name}`); }
      }
    } catch (e) { plan.notes.push(`학생 명단을 읽지 못했습니다: ${doc.name}`); }
  } else if (hasStudents) plan.notes.push('학생 명단: 이미 있어서 그대로 둡니다.');
  else plan.notes.push('학생 명단 파일을 찾지 못했습니다.');

  if ((!S.teachers.trim() || S.teachers === DEFAULT_TEACHERS) && teaDocs[0]) {
    const doc = teaDocs[0];
    progress('교직원 명단 읽는 중…');
    try {
      let text = '';
      if (sheetName.test(doc.name)) {
        const wb = await readWorkbook(doc.file);
        text = teachersFromRows(sheetRows(wb.Sheets[wb.SheetNames.find(n => TEACHER_SHEET.test(n)) || wb.SheetNames[0]]))?.text || '';
      } else text = teachersFromPdf(await pdfRows(doc.file));
      // 교장 · 교감은 4쪽 자리로, 5쪽 명단에서는 뺌
      const rows = parseTeachers(text);
      plan.principal = rows.find(t => /^교장/.test(t.role))?.name || '';
      plan.vice = rows.find(t => /^교감/.test(t.role))?.name || '';
      plan.teachers = text.split('\n').filter(l => !/^(교장|교감)\s*\|/.test(l.trim())).join('\n');
      if (rows.length) plan.notes.push(`교직원 ${rows.length}명: ${doc.name}`);
    } catch (e) { plan.notes.push(`교직원 명단을 읽지 못했습니다: ${doc.name}`); }
  } else if (S.teachers.trim() && S.teachers !== DEFAULT_TEACHERS) plan.notes.push('교직원 명단: 이미 있어서 그대로 둡니다.');
  else plan.notes.push('교직원 명단 파일을 찾지 못했습니다.');

  const speech = items.find(x => /\.hwpx$/i.test(x.name) && /담임|급훈/.test(x.name));
  if (speech) {
    try {
      const ps = await hwpxParagraphs(speech.file);
      const a = ps.findIndex(p => /담임\s*말씀/.test(p)), b = ps.findIndex(p => /급훈/.test(p));
      if (a >= 0 && b > a) plan.titles['c0-teacherMsg'] = ps.slice(a + 1, b).join('\n');
      if (b >= 0 && ps[b + 1]) plan.titles['c0-motto'] = ps[b + 1];
      if (a >= 0 || b >= 0) plan.notes.push(`담임 말씀 · 급훈: ${speech.name}`);
    } catch { plan.notes.push(`담임 말씀 파일을 읽지 못했습니다: ${speech.name}`); }
  }
  // '학교가을', '학교화단'처럼 '학교' 뒤에 이어진 글자는 교가 · 교화로 보지 않음
  const symWord = word => new RegExp(`(?<!학)${word}`);
  const songDoc = items.find(x => /\.hwpx$/i.test(x.name) && symWord('교가').test(x.name));
  if (songDoc) {
    try {
      const ps = (await hwpxParagraphs(songDoc.file)).map(p => p.trim()).filter(p => p && !/^교가$/.test(p));
      if (ps.length) { plan.titles.songLyrics = ps.join('\n'); plan.notes.push(`교가 가사: ${songDoc.name}`); }
    } catch { plan.notes.push(`교가 파일을 읽지 못했습니다: ${songDoc.name}`); }
  }
  const songPdf = items.find(x => pdfName.test(x.name) && symWord('교가').test(x.name));
  if (songPdf) plan.notes.push(`교가 PDF는 읽지 못합니다. JPG나 PNG로 바꿔 넣어 주세요: ${songPdf.name}`);

  const rosterNow = plan.roster || S.roster;
  const classes = parseRoster(rosterNow === DEFAULT_ROSTER ? '' : rosterNow), teachers = parseTeachers(plan.teachers ?? S.teachers);
  const people = classes.flatMap((c, ci) => c.students.map((s, i) => ({ name: s.name, ci, i }))).filter(p => p.name).sort((a, b) => b.name.length - a.name.length);
  const teacherNames = teachers.map(t => t.name).filter(Boolean).sort((a, b) => b.length - a.length);
  const principal = plan.principal || S.principal, vice = plan.vice || S.vice;
  plan.catalog = slotCatalog(classes, teachers);

  const sorted = (a, b) => a.name.localeCompare(b.name, 'ko', { numeric: true });
  const images = items.filter(x => IMG_EXT.test(x.name) && !(hasClean && x.parts.includes('선택본'))).sort(sorted);
  plan.raw = items.filter(x => RAW_EXT.test(x.name));
  const groups = { event: [], sym: [], instr: [], flower: [], outdoor: [], id: [], teacher: [], land: [], scene: [], group: [], other: [] };
  for (const x of images) {
    const d = x.dir;
    if (/행사/.test(d)) groups.event.push(x);
    else if (symWord('(교표|교목|교화|교훈|교가)').test(x.name) || /롤링/.test(x.name)) groups.sym.push(x);
    else if (/악기/.test(d)) groups.instr.push(x);
    else if (/꽃/.test(d)) groups.flower.push(x);
    else if (/야외/.test(d)) groups.outdoor.push(x);
    else if (/증명|개인/.test(d)) groups.id.push(x);
    else if (/선생|교직원|교사|명렬/.test(d)) groups.teacher.push(x);
    else if (/풍경|전경/.test(d)) groups.land.push(x);
    else if (x.parts[x.parts.length - 2] === '단체사진') groups.scene.push(x);
    else if (/단체/.test(d)) groups.group.push(x);
    else groups.other.push(x);
  }

  const used = new Set();
  const add = (key, x) => { used.add(key); plan.jobs.push({ key, file: x.file, name: x.name }); };
  const loose = (x, cat) => plan.loose.push({ file: x.file, name: x.name, path: x.path, cat });
  const personOf = name => {
    const hit = people.find(p => name.includes(p.name));
    if (hit) return hit;
    const m = name.match(/^(\d{1,2})(?=[\s_\-.가-힣])/);     // '02 2K6A0003.jpg' → 명렬 2번
    return m && classes[0]?.students[+m[1] - 1] ? { ci: 0, i: +m[1] - 1, name: classes[0].students[+m[1] - 1].name } : null;
  };
  const byPerson = (list, cat, keysOf) => {
    const seen = {};
    for (const x of list) {
      const p = personOf(x.name);
      if (!p) { loose(x, cat); continue; }
      const id = `${p.ci}-${p.i}`, n = seen[id] = (seen[id] || 0) + 1, keys = keysOf(p);
      if (keys[n - 1]) add(keys[n - 1], x); else loose(x, cat);
    }
  };
  byPerson(groups.id, 'id', p => [`c${p.ci}-s${p.i}`]);
  byPerson(groups.flower, 'flower', p => [`c${p.ci}-fl${p.i}`]);
  byPerson(groups.outdoor, 'outdoor', p => [`c${p.ci}-o${p.i}`, `c${p.ci}-ox${p.i}`]);
  if (S.useInstr) byPerson(groups.instr, 'outdoor', p => [`c${p.ci}-in${p.i}`]);

  for (const x of groups.sym) {
    const k = symWord('교표').test(x.name) ? 'sym-emblem' : symWord('교목').test(x.name) ? 'sym-tree' : symWord('교화').test(x.name) ? 'sym-flower' : symWord('교훈').test(x.name) ? 'sym-motto' : symWord('교가').test(x.name) ? 'song' : Array.from({ length: rollingCount() }, (_, i) => rollingKey(i)).find(r => !used.has(r)) || 'rolling';
    if (used.has(k)) { loose(x, 'other'); continue; }
    add(k, x);
    // '교목 물박달나무', '물박달나무 교목' 모두 이름을 찾되 '우리학교 교목'의 학교 이름은 쓰지 않음
    const [before = '', after = ''] = x.name.replace(/\.[^.]+$/, '').split(/교목|교화/);
    const word = after.match(/[가-힣]{2,}/)?.[0] || before.match(/[가-힣]{2,}/g)?.filter(w => !/학교$/.test(w)).pop();
    if (k === 'sym-tree' && word) plan.titles.treeName = word;
    if (k === 'sym-flower' && word) plan.titles.flowerName = word;
  }

  const leaderCount = {};
  for (const x of groups.teacher) {
    if (/단체/.test(x.name)) {
      if (S.useVice === false && !used.has('leader-group')) add('leader-group', x); else loose(x, 'group');
      continue;
    }
    const isP = /교장/.test(x.name) || (principal && x.name.includes(principal));
    const isV = /교감/.test(x.name) || (vice && x.name.includes(vice));
    if (isP || isV) {
      const base = isP ? 'principal' : 'vice', n = leaderCount[base] = (leaderCount[base] || 0) + 1;
      if (n <= 2) add(n === 1 ? base : `${base}-2`, x); else loose(x, 'teacher');
      continue;
    }
    const nm = teacherNames.find(t => x.name.includes(t));
    if (/담임/.test(x.name) && !used.has('c0-teacher')) {
      add('c0-teacher', x);
      if (nm && !used.has(`t-${nm}`)) add(`t-${nm}`, x);     // 담임 선생님은 5쪽 명단에도 같은 사진
      if (nm && plan.roster && !classes[0]?.teacher) plan.homeroom = nm;
      continue;
    }
    if (nm && !used.has(`t-${nm}`)) add(`t-${nm}`, x); else loose(x, 'teacher');
  }

  const orient = async list => {
    const out = [];
    for (const x of list) {
      let wide = true;
      try { const s = await imageSize(x.file); wide = s.w >= s.h; } catch {}
      out.push({ ...x, wide });
    }
    return out;
  };
  progress('풍경 · 단체사진 확인 중…');
  const fill = (list, wideKeys, tallKeys, cat) => {
    const w = [...wideKeys], t = [...tallKeys];
    for (const x of list) {
      const k = (x.wide ? w : t).shift() || (x.wide ? t : w).shift();
      if (k) add(k, x); else loose(x, cat);
    }
  };
  fill(await orient(groups.land), ['campus-0', 'campus-1', 'campus-x1', 'campus-x3'], ['campus-x0', 'campus-x2', 'campus-x4'], 'land');
  fill(await orient(groups.scene), [0, 1, 2, 3, 5, 6, 7, 8].map(i => `scene-${i}`), ['scene-4', 'scene-9'], 'scene');
  for (const x of groups.group) {
    const m = x.name.match(/([12])\s*조/);
    if (S.useVice === false && /교장|교직원|선생|교사/.test(x.name) && !used.has('leader-group')) add('leader-group', x);
    else if (m && !used.has(`c0-team${m[1]}`)) add(`c0-team${m[1]}`, x);
    else if (/대표|표지/.test(x.name) && !used.has('cover-group')) add('cover-group', x);
    else loose(x, 'group');
  }
  groups.other.forEach(x => loose(x, 'other'));

  // 행사: 사진이 든 폴더 이름이 제목. 이미 있는 행사는 건너뜀
  const byEvent = new Map();
  for (const x of groups.event) {
    const folder = x.parts[x.parts.length - 2];
    if (!byEvent.has(folder)) byEvent.set(folder, []);
    byEvent.get(folder).push(x);
  }
  const have = new Set(galleryEvents().map(ev => String(texts[ev.titleKey] ?? ev.def)));
  let page = Object.keys(photos).filter(isGalKey).reduce((m, k) => Math.max(m, parseInt(k.slice(1), 10) + 1), 0);
  for (const folder of [...byEvent.keys()].sort((a, b) => a.localeCompare(b, 'ko', { numeric: true }))) {
    const title = eventTitle(folder), list = byEvent.get(folder);
    if (have.has(title)) { plan.skippedEvents.push(title); continue; }
    const n = Math.ceil(list.length / GALLERY_PER);
    if (page + n > GALLERY_MAX) { plan.notes.push(`행사 사진이 너무 많아 '${title}'부터 넣지 못합니다.`); break; }
    for (let q = 0; q < n; q++) {
      plan.titles[`gal-title-${page + q}`] = q ? `${title} (${q + 1})` : title;
      list.slice(q * GALLERY_PER, (q + 1) * GALLERY_PER).forEach((x, k) => add(`g${page + q}-${k}`, x));
    }
    page += n;
  }
  plan.galleryPages = page;
  plan.eventCount = byEvent.size - plan.skippedEvents.length;
  plan.counts = { id: groups.id.length, flower: groups.flower.length, outdoor: groups.outdoor.length, teacher: groups.teacher.length, land: groups.land.length, scene: groups.scene.length, group: groups.group.length, event: groups.event.length, sym: groups.sym.length };
  return plan;
}

/** 계획대로 넣기. 이미 사진이 있는 자리는 덮어쓰기를 고른 경우에만 바꿈 */
async function applyFolderPlan(plan, { overwrite = false, extra = [] } = {}, progress = () => {}, stopped = () => false) {
  if (plan.roster) {
    S.roster = plan.homeroom ? plan.roster.replace(/^(#[^\n|]*)$/m, `$1 | ${plan.homeroom}`) : plan.roster;
    $('#f-roster').value = S.roster;
  }
  if (plan.teachers != null) { S.teachers = plan.teachers; $('#f-teachers').value = plan.teachers; }
  if (plan.principal && !S.principal) { S.principal = plan.principal; $('#f-principal').value = plan.principal; }
  if (plan.vice && !S.vice) { S.vice = plan.vice; $('#f-vice').value = plan.vice; }
  for (const [k, v] of Object.entries(plan.titles)) if (texts[k] == null) texts[k] = v;
  if (plan.galleryPages) { S.galleryPages = Math.max(plan.galleryPages, 1); $('#f-gallery').value = S.galleryPages; }
  flushState();
  render();
  const jobs = [...plan.jobs, ...extra];
  let done = 0, skipped = 0, failed = 0;
  galBulk = true;
  try {
    for (const job of jobs) {
      if (stopped()) break;
      progress(++done, jobs.length);
      if (photos[job.key] && !overwrite) { skipped++; continue; }
      try { await setPhoto(job.key, job.file); } catch { failed++; }
    }
  } finally {
    galBulk = false;
  }
  flushState();
  render();
  return { done: done - skipped - failed, skipped, failed };
}

const CAT_NAMES = { id: '증명사진', flower: '꽃 프로필', outdoor: '야외 프로필', teacher: '선생님', land: '풍경', scene: '교정 단체사진', group: '단체사진', event: '행사 사진', sym: '교표 · 교목 · 교화 · 교훈 · 교가' };
function folderPlanDialog(plan) {
  const usedKeys = new Set(plan.jobs.map(j => j.key));
  const urls = [];
  const looseRows = plan.loose.map((x, i) => {
    const opts = (OPTIONS_OF[x.cat] || OPTIONS_OF.other).flatMap(c => plan.catalog[c] || []).filter(s => !usedKeys.has(s.key));
    const url = URL.createObjectURL(x.file);
    urls.push(url);
    return `<div class="prj-loose"><img loading="lazy" src="${url}" alt=""><div class="prj-loose-name" title="${esc(x.path)}">${esc(x.name)}</div>
      <select data-loose="${i}"><option value="">넣지 않음</option>${opts.map(s => `<option value="${esc(s.key)}">${esc(s.label)}${photos[s.key] ? ' (사진 있음)' : ''}</option>`).join('')}</select></div>`;
  }).join('');
  const counts = Object.entries(plan.counts).filter(([, n]) => n).map(([k, n]) => `<li>${CAT_NAMES[k]} ${n}장</li>`).join('');
  const rawInfo = plan.raw.length ? `<p class="pd-note">카메라 원본(CR2 등) ${plan.raw.length}개는 앨범에 넣을 수 없어 건너뜁니다. 필요한 사진은 JPG로 변환해 주세요.</p>` : '';
  const skipped = plan.skippedEvents.length ? `<p class="pd-note">이미 있는 행사 ${plan.skippedEvents.length}개는 건너뜁니다.</p>` : '';
  let stop = false, busy = false;
  const body = `
    <h4>찾은 자료</h4>
    <ul class="prj-list">${plan.notes.map(n => `<li>${esc(n)}</li>`).join('')}${counts}</ul>
    <p>자리가 정해진 사진 <b>${plan.jobs.length}장</b>${plan.loose.length ? ` · 자리를 못 찾은 사진 <b>${plan.loose.length}장</b>` : ''}</p>
    ${rawInfo}${skipped}
    <label class="pd-line"><input type="checkbox" id="fp-over"> 이미 사진이 있는 자리도 바꾸기</label>
    ${plan.loose.length ? `<details class="prj-details"${plan.loose.length <= 20 ? ' open' : ''}><summary>자리를 못 찾은 사진: 직접 고르기 (얼굴로 맞추지 않습니다)</summary><div class="prj-loose-list">${looseRows}</div></details>` : ''}
    <div id="fp-state" class="prj-msg"></div>`;
  const cleanup = () => urls.forEach(u => URL.revokeObjectURL(u));
  showPrj('학교 폴더 불러오기', body, [
    { text: '넣기', main: true, on: async e => {
      if (busy) return;
      busy = true; e.target.disabled = true;
      const extra = [...document.querySelectorAll('#prj-dlg [data-loose]')].filter(s => s.value).map(s => ({ key: s.value, file: plan.loose[+s.dataset.loose].file, name: plan.loose[+s.dataset.loose].name }));
      const res = await applyFolderPlan(plan, { overwrite: $('#fp-over').checked, extra }, (i, n) => { $('#fp-state').textContent = `넣는 중… ${i} / ${n}`; }, () => stop);
      cleanup();
      busy = false;
      showChecklist(`사진 ${res.done}장을 넣었습니다.${res.skipped ? ` 이미 사진이 있어 건너뜀 ${res.skipped}장.` : ''}${res.failed ? ` 실패 ${res.failed}장.` : ''}`);
    } },
    { text: '취소', on: () => { if (busy) stop = true; else { cleanup(); closePrj(); } } },
  ]);
}

/* ---------------- 점검표 ---------------- */
function photoSlotName(el) {
  const fig = el.closest('figure');
  const cap = fig?.querySelector('.fac-name, .stu-name, figcaption')?.textContent.trim();
  if (cap) return cap;
  const k = el.dataset.photo;
  if (isRollingKey(k)) return '롤링페이퍼';
  if (/^fx-/.test(k)) return '복사한 틀';
  const stu = /^c(\d+)-(s|fl|in|ca|po|ox|ex|o)(\d+)$/.exec(k);
  if (stu) {
    const nm = parseRoster(S.roster)[+stu[1]]?.students[+stu[3]]?.name || '';
    return `${nm} ${{ s: '증명사진', fl: '꽃 프로필', in: '악기 프로필', ca: '학사모', po: '포즈', ox: '작은 프로필', ex: '프로필', o: '야외 프로필' }[stu[2]]}`.trim();
  }
  if (/-(team\d|big\d)(-\d+)?$/.test(k)) return '단체사진';
  const fixed = { song: '교가 악보', 'leader-group': '단체사진', 'cover-group': '대표 단체사진', 'sym-extra': '5쪽 사진', 'sym-emblem': '교표', 'sym-motto': '교훈 사진', 'sym-tree': '교목', 'sym-flower': '교화', principal: '교장 큰 사진', 'principal-2': '교장 작은 사진', vice: '교감 큰 사진', 'vice-2': '교감 작은 사진', rolling: '롤링페이퍼', 'campus-0': '큰 풍경', 'campus-1': '큰 풍경' };
  if (fixed[k]) return fixed[k];
  if (/-teacher$/.test(k)) return '담임 선생님';
  if (/-team\d$/.test(k)) return `${k.slice(-1)}조 단체사진`;
  if (/-group\d?$/.test(k)) return '반 단체사진';
  if (/^c\d+-s\d+$/.test(k)) return '증명사진';
  if (/^c\d+-ox\d+$/.test(k)) return '작은 사진';
  if (/^campus-x/.test(k)) return '작은 풍경';
  if (/^scene-/.test(k)) return '단체사진';
  return '사진';
}
/** 지금 페이지 기준 빠진 자리 · 예시 문구 · 저해상도를 모음 (앨범은 바꾸지 않음) */
function collectChecklist() {
  const sheets = [...document.querySelectorAll('.sheet')];
  const empty = [], lowres = [], sample = [];
  sheets.forEach((sh, i) => {
    const label = sh.querySelector('.sheet-label')?.textContent || `P.${i + 1}`;
    // 교가는 가사만 있어도 완성이므로 악보 칸을 빈 자리로 세지 않음
    const songDone = sh.querySelector('.song-lyrics')?.textContent.trim();
    const blanks = [...sh.querySelectorAll('.photo:not(.has-img)')].filter(el => !el.closest('.fr-hidden') && !(songDone && el.dataset.photo === 'song')).map(photoSlotName);
    if (blanks.length) empty.push({ i, label, blanks });
    const low = [...sh.querySelectorAll('.photo .badge')].map(b => photoSlotName(b.closest('.photo')));
    if (low.length) lowres.push({ i, label, blanks: low });
    const txt = [...sh.querySelectorAll('[contenteditable][data-key]')]
      .filter(e => texts[e.dataset.key] == null && !/teamCap|^gal-|^scene-title|^rolling-title|^tx\|/.test(e.dataset.key))
      .map(e => e.textContent.trim().slice(0, 18)).filter(Boolean);
    if (txt.length) sample.push({ i, label, blanks: txt });
  });
  const info = [];
  const classes = parseRoster(S.roster);
  if (S.roster === DEFAULT_ROSTER || !classes.some(c => c.students.length)) info.push('학생 명단이 비어 있거나 예시입니다.');
  if (S.useFaculty !== false && (!S.teachers.trim() || S.teachers === DEFAULT_TEACHERS)) info.push('교직원 명단이 비어 있거나 예시입니다.');
  classes.forEach(c => { if (!c.teacher) info.push(`${c.name}: 담임 선생님 이름이 없습니다. 명단 첫 줄을 '# ${c.name} | 이름'으로 적어 주세요.`); });
  if (!S.principal) info.push('교장 선생님 이름이 없습니다.');
  if (S.useVice !== false && !S.vice) info.push('교감 선생님 이름이 없습니다.');
  if (!S.nth) info.push('졸업 회차가 없습니다.');
  if (!/^\d{4}$/.test(String(S.year).trim())) info.push(`졸업 연도가 '${S.year}'입니다. 숫자 4자리면 표지 글자가 겹치지 않습니다.`);
  if (!Object.keys(photos).length) info.push('사진이 한 장도 없습니다.');
  const saved = albumRegistry().saved[PROJECT_ID];
  if (!saved) info.push('아직 프로젝트 파일로 저장한 적이 없습니다.');
  return { empty, lowres, sample, info, emptyCount: empty.reduce((s, x) => s + x.blanks.length, 0) };
}
function showChecklist(headline = '') {
  const c = collectChecklist();
  const block = (title, rows) => (rows.length ? `<h4>${title}</h4><ul class="prj-list prj-check">${rows.map(r => `<li><button type="button" class="prj-go" data-go="${r.i}">${esc(r.label)}</button> <span>${esc(r.blanks.slice(0, 12).join(', '))}${r.blanks.length > 12 ? ` 외 ${r.blanks.length - 12}개` : ''}</span></li>`).join('')}</ul>` : '');
  const clear = !c.info.length && !c.emptyCount && !c.lowres.length && !c.sample.length;
  const body = `${headline ? `<p><b>${esc(headline)}</b></p>` : ''}
    ${clear ? '<p>빠진 항목이 없습니다.</p>' : ''}
    ${c.info.length ? `<h4>기본 정보</h4><ul class="prj-list">${c.info.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    ${block(`비어 있는 사진 자리 (${c.emptyCount}칸)`, c.empty)}
    ${block('저해상도 사진', c.lowres)}
    ${block('아직 예시 문구인 곳', c.sample)}`;
  showPrj('점검표', body, [{ text: '닫기', main: true, on: closePrj }]);
  $('#prj-dlg').querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => {
    closePrj();
    document.querySelectorAll('.sheet')[+b.dataset.go]?.scrollIntoView({ block: 'start' });
  }));
}

/* ---------------- 패널 연결 ---------------- */
function showLastSaved() {
  const at = albumRegistry().saved[PROJECT_ID];
  $('#p-saved').textContent = at ? `마지막 파일 저장: ${new Date(at).toLocaleString('ko-KR')}` : '아직 파일로 저장하지 않았습니다.';
}
function fillAlbumList() {
  const r = albumRegistry(), sel = $('#p-list');
  sel.innerHTML = r.ids.map(id => `<option value="${id}">${esc(id === PROJECT_ID ? `${S.school} ${S.year}`.trim() : albumLabel(id))}</option>`).join('');
  sel.value = PROJECT_ID;
  $('#p-del').disabled = r.ids.length < 2;
}
function bindProjectPanel() {
  const info = $('#p-info');
  navigator.storage?.persist?.();     // 브라우저가 저장소를 임의로 비우지 않도록 요청
  fillAlbumList();
  showLastSaved();
  $('#f-school').addEventListener('input', () => setTimeout(fillAlbumList));
  $('#f-year').addEventListener('input', () => setTimeout(fillAlbumList));
  $('#p-list').addEventListener('change', e => switchAlbum(e.target.value));
  $('#p-new').addEventListener('click', newAlbumDialog);
  $('#p-del').addEventListener('click', () => {
    const name = `${S.school} ${S.year}`.trim();
    if (!confirm(`'${name}' 앨범과 사진을 이 브라우저에서 지울까요?\n되돌릴 수 없습니다. 먼저 '파일로 저장'을 해 두세요.`)) return;
    if (!confirm(`정말 '${name}' 앨범을 지울까요?`)) return;
    deleteAlbum(PROJECT_ID);
  });
  $('#p-save').addEventListener('click', () => saveAlbumFile(info).catch(e => { info.textContent = e.message; }));
  $('#p-open').addEventListener('change', async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      flushState();
      const { id, count } = await loadAlbumFile(file, (i, n) => { info.textContent = `여는 중… ${i} / ${n}`; });
      info.textContent = `사진 ${count}장을 새 앨범으로 열었습니다.`;
      switchAlbum(id);
    } catch (err) { info.textContent = err.message; }
  });
  $('#p-dir').addEventListener('change', async e => {
    const entries = [...e.target.files].map(file => ({ file, path: file.webkitRelativePath || file.name }));
    e.target.value = '';
    if (!entries.length) return;
    try {
      info.textContent = '폴더 살펴보는 중…';
      const plan = await planFolderImport(entries, t => { info.textContent = t; });
      info.textContent = '';
      folderPlanDialog(plan);
    } catch (err) { info.textContent = err.message; }
  });
  $('#p-check').addEventListener('click', () => showChecklist());

  // 싸바리 표지
  $('#w-on').checked = S.wrapOn !== false;
  $('#w-on').addEventListener('change', e => { S.wrapOn = e.target.checked; saveState(); render(); });
  for (const [k, id] of Object.entries({ wrapSpine: '#w-spine', wrapFold: '#w-fold', wrapHinge: '#w-hinge', wrapBoard: '#w-board' })) {
    $(id).value = S[k];
    $(id).addEventListener('change', e => { S[k] = e.target.value; saveState(); render(); });
  }
  $('#b-print-wrap').addEventListener('click', async () => {
    if (S.wrapOn === false) { S.wrapOn = true; $('#w-on').checked = true; saveState(); render(); }
    await document.fonts.ready;
    const z = wrapSize(), style = $('#pagesize'), before = style.textContent;
    style.textContent = `@page{size:${z.W}mm ${z.H}mm;margin:0}`;
    document.body.classList.add('print-wrap');
    window.addEventListener('afterprint', () => { document.body.classList.remove('print-wrap'); style.textContent = before; }, { once: true });
    window.print();
  });

  // 판 구성
  const checks = { useFlower: '#l-flower', useStrip: '#l-strip', useScene: '#l-scene', useSceneRow: '#l-scenerow', useSong: '#l-song', useFaculty: '#l-faculty', useVice: '#l-vice', useInstr: '#l-instr' };
  const nums = { outdoorPer: '#l-outdoor', galRows: '#l-galrows', msgPages: '#l-msgpages' };
  const fillLayout = () => {
    for (const [k, id] of Object.entries(checks)) $(id).checked = S[k] !== false;
    for (const [k, id] of Object.entries(nums)) $(id).value = S[k];
  };
  fillLayout();
  window.undoFillLayout = fillLayout;
  for (const [k, id] of Object.entries(checks)) $(id).addEventListener('change', e => { S[k] = e.target.checked; saveState(); render(); });
  for (const [k, id] of Object.entries(nums)) $(id).addEventListener('change', e => { S[k] = e.target.value; saveState(); render(); });
  const fillTemplates = () => { $('#l-tpl').innerHTML = templateOptions(); };
  fillTemplates();
  $('#l-apply').addEventListener('click', () => {
    const t = loadTemplates()[+$('#l-tpl').value];
    if (!t) return;
    Object.assign(S, t.cfg);
    flushState();
    location.reload();
  });
  $('#l-save').addEventListener('click', () => {
    const name = $('#l-name').value.trim();
    if (!name) { $('#l-info').textContent = '템플릿 이름을 입력하세요.'; return; }
    const cfg = Object.fromEntries(LAYOUT_KEYS.map(k => [k, S[k]]));
    let mine = [];
    try { mine = JSON.parse(localStorage.getItem(TEMPLATES_KEY)) || []; } catch {}
    mine = mine.filter(t => t.name !== name);
    mine.push({ name, cfg });
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(mine));
    fillTemplates();
    $('#l-name').value = '';
    $('#l-info').textContent = `'${name}' 템플릿을 저장했습니다. 새 앨범을 만들 때 고를 수 있습니다.`;
  });
}
bindProjectPanel();
