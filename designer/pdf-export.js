/* ============================================================
   대화형 PDF로 내보내기 (InDesign 대화상자와 같은 구성)
   페이지를 이미지로 그려 PDF에 담고, 보기 · 레이아웃 · 전체 화면 · 전환 효과를 PDF 설정으로 기록.
   글자가 이미지가 되므로 태그 PDF · Acrobat 레이어 · 양식은 지원하지 않음. 암호(보안)는 라이브러리 미지원.
   ============================================================ */
const PDF_LIBS = {
  htmlToImage: 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js',
  PDFLib: 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
};
const PDF_DEFAULTS = {
  range: 'all', rangeText: '', format: 'spread', separate: false, suffix: '',
  view: 'default', layout: 'default', fullscreen: false, flip: false, flipSec: 5, openAfter: true,
  transition: 'none', thumbs: true,
  compress: 'jpeg', quality: 'high', ppi: 144,
  titleShow: 'title', title: '', lang: 'ko-KR', bleed: false,
};
const PDF_QUALITY = { min: .4, low: .6, mid: .75, high: .88, max: .97 };
const PDF_SKIP = ['guide', 'lnk-badge', 'sheet-label', 'ph-hint', 'ph-remove', 'ph-rot', 'badge', 'gal-add', 'gal-shape', 'song-hint'];

function pdfLoadLib(name) {
  if (window[name]) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = PDF_LIBS[name];
    s.onload = res;
    s.onerror = () => rej(new Error('PDF 기능을 불러오지 못했습니다. 인터넷 연결을 확인하세요.'));
    document.head.appendChild(s);
  });
}

/** '1-9, 12' → 쪽 번호 집합. 잘못된 입력이면 null */
function pdfParseRange(text, total) {
  const set = new Set();
  for (const part of String(text).split(',').map(s => s.trim()).filter(Boolean)) {
    const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) return null;
    const a = +m[1], b = m[2] ? +m[2] : a;
    if (a < 1 || b < a) return null;
    for (let i = a; i <= Math.min(b, total); i++) set.add(i);
  }
  return set.size ? set : null;
}

/* 웹폰트: 문서에 쓰인 글자가 든 조각만 골라 이미지 안에 넣음 */
const pdfFontData = new Map();
async function pdfFontCSS() {
  return [await pdfWebFontCSS(), await pdfLocalFontCSS()].filter(Boolean).join('\n');
}
/** 앨범 쪽에 실제로 쓰인 글꼴 이름들 (화면에 그려진 글자의 font-family). 이것만 넣어야 그림 안 글꼴 묶음이 작아져
    큰 앨범에서도 글꼴을 다 읽은 뒤 그려짐 (너무 크면 일부 글꼴을 못 읽고 기본 글꼴로 그리는 일이 있음) */
function pdfUsedFamilies() {
  const fams = new Set(), seen = new Set();
  for (const el of document.querySelectorAll('#pages *')) {
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim())) continue;
    const ff = getComputedStyle(el).fontFamily;
    if (seen.has(ff)) continue;
    seen.add(ff);
    ff.split(',').forEach(n => fams.add(n.replace(/["']/g, '').trim()));
  }
  return fams;
}
/** 앨범 폴더 안의 글꼴(@font-face, 예: 모전 템플릿 제목의 TmonDS · 도산 NanumSquareDS)도 이미지 안에 넣음.
    빠뜨리면 PDF · JPG에서 다른 글꼴로 바뀌어 글자 폭과 자리가 달라짐. 화면에서 실제로 쓰인(불러온) 글꼴만 넣음 */
async function pdfLocalFontCSS() {
  const fams = pdfUsedFamilies(), loaded = new Set([...document.fonts].filter(ff => ff.status === 'loaded').map(ff => ff.family.replace(/["']/g, '')).filter(n => fams.has(n)));
  const out = [];
  for (const sh of document.styleSheets) {
    let rules;
    try { rules = sh.cssRules; } catch { continue; }      // 다른 사이트 CSS(구글 글꼴)는 읽을 수 없음 → 위에서 따로 처리
    for (const r of rules || []) {
      if (!(r instanceof CSSFontFaceRule)) continue;
      const fam = r.style.getPropertyValue('font-family').replace(/["']/g, '').trim();
      if (!loaded.has(fam)) continue;
      const m = r.cssText.match(/url\(["']?([^"')]+)["']?\)/);
      if (!m) continue;
      const url = new URL(m[1], sh.href || location.href).href;
      if (!pdfFontData.has(url)) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const bytes = new Uint8Array(await res.arrayBuffer());
          let bin = '';
          for (let i = 0; i < bytes.length; i += 32768) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
          const fmt = /\.otf$/i.test(url) ? 'opentype' : /\.woff2$/i.test(url) ? 'woff2' : /\.woff$/i.test(url) ? 'woff' : 'truetype';
          pdfFontData.set(url, { data: `data:font/${fmt === 'opentype' ? 'otf' : fmt === 'truetype' ? 'ttf' : fmt};base64,${btoa(bin)}`, fmt });
        } catch (e) { console.warn('글꼴을 넣지 못했습니다', url, e); continue; }
      }
      const { data, fmt } = pdfFontData.get(url);
      out.push(`@font-face{font-family:'${fam}';src:url(${data}) format('${fmt}');font-weight:${r.style.getPropertyValue('font-weight') || 'normal'};font-style:${r.style.getPropertyValue('font-style') || 'normal'}}`);
    }
  }
  return out.join('\n');
}
async function pdfWebFontCSS() {
  const link = document.querySelector('link[href*="fonts.googleapis.com/css2"]');
  if (!link) return '';
  const css = await (await fetch(link.href)).text();
  const used = new Set();
  for (const ch of $('#pages').textContent) used.add(ch.codePointAt(0));
  for (let c = 32; c < 127; c++) used.add(c);
  const hits = range => range.split(',').some(r => {
    const [a, b] = r.trim().replace(/^U\+/i, '').split('-');
    const lo = parseInt(a.replace(/\?/g, '0'), 16), hi = parseInt((b || a).replace(/\?/g, 'F'), 16);
    for (const c of used) if (c >= lo && c <= hi) return true;
    return false;
  });
  const fams = pdfUsedFamilies();
  const faces = (css.match(/@font-face\s*{[^}]*}/g) || []).filter(f => {
    const fm = f.match(/font-family:\s*['"]?([^;'"]+)/);
    if (fm && !fams.has(fm[1].trim())) return false;      // 앨범에 안 쓰인 글꼴은 넣지 않음
    const m = f.match(/unicode-range:\s*([^;]+);/);
    return !m || hits(m[1]);
  });
  const out = await Promise.all(faces.map(async f => {
    const url = (f.match(/url\(([^)]+)\)/) || [])[1];
    if (!url) return f;
    if (!pdfFontData.has(url)) {
      // 브라우저 창에서는 fonts.gstatic.com 직접 요청이 막히는 일이 있어(Failed to fetch) 우리 서버(/__font)가 대신 받게 하고, 안 되면 직접 받음
      // Blob은 쓰지 않음: 브라우저 창의 Blob 저장 공간이 사진으로 차 있으면 Blob 읽기가 "Failed to fetch"로 실패함
      const get = async u => { const r = await fetch(u); if (!r.ok) throw new Error(`글꼴을 받지 못했습니다 (${r.status})`); return new Uint8Array(await r.arrayBuffer()); };
      const bytes = await get(url).catch(() => get(`/__font?u=${encodeURIComponent(url)}`));
      let bin = '';
      for (let i = 0; i < bytes.length; i += 32768) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
      pdfFontData.set(url, `data:font/woff2;base64,${btoa(bin)}`);
    }
    return f.replace(url, pdfFontData.get(url));
  }));
  return out.join('\n');
}

/** 쪽 하나를 canvas로: 사진은 필요한 해상도로 줄여 잠시 바꿔 넣고, 끝나면 되돌림 */
async function pdfRenderPage(page, pr, fontCSS, lossless, jpegQ = .92) {
  const restore = [];
  for (const el of page.querySelectorAll('.photo.has-img')) {
    const rec = photos[el.dataset.photo];
    if (!rec) continue;
    const rw = el.offsetWidth || 1, rh = el.offsetHeight || 1;
    const s = (el.classList.contains('contain') ? Math.min : Math.max)(rw / rec.w, rh / rec.h) * rec.z * pr;
    const w = Math.max(1, Math.min(rec.w, Math.ceil(rec.w * s))), h = Math.max(1, Math.round(w * rec.h / rec.w));
    const isSvg = rec.blob.type.includes('svg');
    const cv = document.createElement('canvas');
    if (isSvg) {          // 벡터는 필요한 해상도로 새로 그림 (ImageBitmap으로는 못 읽음)
      const im = new Image();
      im.src = rec.url;
      await im.decode();
      const sw = Math.max(1, Math.ceil(rec.w * s));
      cv.width = sw; cv.height = Math.max(1, Math.round(sw * rec.h / rec.w));
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
    } else {
      const bm = await createImageBitmap(rec.blob, { resizeWidth: w, resizeHeight: h, resizeQuality: 'high' });
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(bm, 0, 0);
      bm.close();
    }
    restore.push([el, el.style.backgroundImage]);
    el.style.backgroundImage = `url("${lossless || isSvg || rec.blob.type === 'image/png' ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', jpegQ)}")`;
  }
  // 수채화 필터 정의를 쪽 안에 잠시 넣음 (이미지로 그릴 때 문서 밖 정의는 못 찾음)
  const defs = document.getElementById('paper')?.closest('svg')?.cloneNode(true);
  if (defs) page.appendChild(defs);
  try {
    return await htmlToImage.toCanvas(page, {
      pixelRatio: pr, backgroundColor: '#ffffff', fontEmbedCSS: fontCSS, cacheBust: false,
      width: page.offsetWidth, height: page.offsetHeight, style: { boxShadow: 'none', margin: '0', contentVisibility: 'visible' },
      filter: n => !(n.classList && (PDF_SKIP.some(c => n.classList.contains(c)) || (n.classList.contains('song-sheet') && !n.querySelector('.has-img')))),
    });
  } finally {
    defs?.remove();
    for (const [el, bg] of restore) el.style.backgroundImage = bg;
  }
}

/* canvas → 바이트. Blob을 쓰지 않음: 브라우저 창의 Blob 저장 공간이 사진으로 차 있으면 Blob 읽기가 실패함 */
function pdfCanvasBytes(cv, type, q) {
  const s = atob(cv.toDataURL(type, q).split(',')[1]), b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
  return b;
}
const pdfBlob = (cv, q) => Promise.resolve({ arrayBuffer: async () => pdfCanvasBytes(cv, 'image/jpeg', q) });
/** 저장한 PDF가 든 폴더를 윈도우 탐색기 새 창으로 열고 그 파일을 골라 둠 */
function pdfShowInFolder(path) {
  fetch(`/__pdf?op=show&name=${encodeURIComponent(path.split('\\').pop())}`, { method: 'POST' }).catch(() => {});
}
/** 완료 글자를 누르면 폴더가 열리게 함. path 없이 부르면 원래대로 */
function pdfLinkify(el, path) {
  el.classList.toggle('pdf-done-link', !!path);
  el.title = path ? '누르면 저장 폴더가 열립니다' : '';
  el.onclick = path ? () => pdfShowInFolder(path) : null;
}
/** 우리 서버가 있으면 M:\Model ppa\인쇄용PDF 에 저장하고 경로를 돌려줌. 없으면 null */
async function pdfSaveToServer(name, bytes) {
  const srv = await fetch('/__pdf/ping', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null);
  if (!srv?.ok) return null;
  const call = async (op, body) => {
    const r = await fetch(`/__pdf?op=${op}&name=${encodeURIComponent(name)}`, { method: 'POST', body });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw new Error(`PDF 파일을 쓰지 못했습니다 (${j.error || r.status})`);
    return j;
  };
  await call('start');
  for (let i = 0; i < bytes.length; i += 64 << 20) await call('append', bytes.subarray(i, i + (64 << 20)));
  return (await call('done')).path;
}

/** 옵션대로 PDF를 만들어 [{ name, bytes }]로 돌려줌 (저장은 하지 않음) */
async function buildInteractivePdf(o, onProgress = () => {}, stopped = () => false) {
  await Promise.all([pdfLoadLib('htmlToImage'), pdfLoadLib('PDFLib')]);
  await document.fonts.ready;
  const { PDFDocument, PDFName, PDFNumber } = PDFLib;
  const zoomBefore = getComputedStyle(document.documentElement).getPropertyValue('--zoom');
  document.documentElement.style.setProperty('--zoom', '1');
  try {
    await new Promise(r => setTimeout(r, 50));
    document.querySelectorAll('.photo').forEach(applyPhoto);
    const all = [...document.querySelectorAll('.page')], total = all.length;
    const wanted = o.range === 'all' ? new Set(all.map((_, i) => i + 1)) : pdfParseRange(o.rangeText, total);
    if (!wanted) throw new Error(`쪽 범위를 확인하세요. 예: 1-${total} 또는 1-9, 12`);

    const groups = o.format === 'spread'
      ? [...document.querySelectorAll('.spread')].map(sp => [...sp.querySelectorAll('.page')]).filter(g => g.some(p => wanted.has(all.indexOf(p) + 1)))
      : all.filter((_, i) => wanted.has(i + 1)).map(p => [p]);
    if (!groups.length) throw new Error('내보낼 쪽이 없습니다.');

    const pr = o.ppi / 96, q = PDF_QUALITY[o.quality] || .88, lossless = o.compress === 'lossless';
    const mmPerPx = G.pageMm / all[0].offsetWidth;
    onProgress(0, groups.length, '글꼴 준비 중…');
    const fontCSS = await pdfFontCSS();

    const newDoc = async () => {
      const doc = await PDFDocument.create();
      const title = o.title || `${S.school} 졸업앨범`;
      doc.setTitle(title, { showInWindowTitleBar: o.titleShow === 'title' });
      doc.setLanguage(o.lang || 'ko-KR');
      doc.setCreator('졸업앨범 디자이너');
      return doc;
    };
    const baseName = (o.title || `${S.school}_졸업앨범`).replace(/[\\/:*?"<>|]+/g, '_');
    const finish = async (doc, name) => {
      const cat = doc.catalog, ctx = doc.context;
      const LAYOUT = { single: 'SinglePage', column: 'OneColumn', two: 'TwoPageLeft', twoCol: 'TwoColumnLeft', cover: 'TwoPageRight', coverCol: 'TwoColumnRight' };
      if (LAYOUT[o.layout]) cat.set(PDFName.of('PageLayout'), PDFName.of(LAYOUT[o.layout]));
      if (o.fullscreen) cat.set(PDFName.of('PageMode'), PDFName.of('FullScreen'));
      const first = doc.getPages()[0].ref;
      const VIEW = {
        actual: ['XYZ', null, null, 1], fit: ['Fit'], fitW: ['FitH', null], fitH: ['FitV', null],
        z25: ['XYZ', null, null, .25], z50: ['XYZ', null, null, .5], z75: ['XYZ', null, null, .75], z100: ['XYZ', null, null, 1],
      };
      if (VIEW[o.view]) cat.set(PDFName.of('OpenAction'), ctx.obj([first, ...VIEW[o.view]]));
      return { name, bytes: await doc.save() };
    };

    const files = [];
    let doc = await newDoc();
    for (let gi = 0; gi < groups.length; gi++) {
      if (stopped()) throw new Error('취소했습니다.');
      const group = groups[gi];
      onProgress(gi, groups.length, `${gi + 1} / ${groups.length} 그리는 중…`);
      await new Promise(r => setTimeout(r));
      const canvases = [];
      for (const p of group) canvases.push(await pdfRenderPage(p, pr, fontCSS, lossless));

      // 재단 여백: 제외하거나, 포함해도 펼침면 안쪽은 잘라 붙임
      const b = Math.round(group[0].querySelector('.trim').offsetLeft * pr);
      const parts = canvases.map((c, i) => {
        const l = !o.bleed || i > 0 ? b : 0, r = !o.bleed || i < canvases.length - 1 ? b : 0, tb = o.bleed ? 0 : b;
        return { c, sx: l, sy: tb, sw: c.width - l - r, sh: c.height - 2 * tb };
      });
      const out = document.createElement('canvas');
      out.width = parts.reduce((s, p) => s + p.sw, 0);
      out.height = parts[0].sh;
      const g = out.getContext('2d');
      let x = 0;
      for (const p of parts) { g.drawImage(p.c, p.sx, p.sy, p.sw, p.sh, x, 0, p.sw, p.sh); x += p.sw; p.c.width = 0; }

      const img = lossless
        ? await doc.embedPng(pdfCanvasBytes(out, 'image/png'))
        : await doc.embedJpg(await (await pdfBlob(out, q)).arrayBuffer());
      const pt = px => px / pr * mmPerPx * 72 / 25.4;
      const page = doc.addPage([pt(out.width), pt(out.height)]);
      page.drawImage(img, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });

      if (o.transition !== 'none') page.node.set(PDFName.of('Trans'), doc.context.obj({ Type: 'Trans', S: o.transition, D: 1 }));
      if (o.fullscreen && o.flip) page.node.set(PDFName.of('Dur'), PDFNumber.of(Math.max(1, +o.flipSec || 5)));
      if (o.thumbs) {
        const t = document.createElement('canvas'), k = 106 / Math.max(out.width, out.height);
        t.width = Math.max(1, Math.round(out.width * k)); t.height = Math.max(1, Math.round(out.height * k));
        t.getContext('2d').drawImage(out, 0, 0, t.width, t.height);
        const thumb = await doc.embedJpg(await (await pdfBlob(t, .7)).arrayBuffer());
        await thumb.embed();
        page.node.set(PDFName.of('Thumb'), thumb.ref);
      }
      out.width = 0;

      if (o.separate) {
        const nos = group.map(p => all.indexOf(p) + 1).join('-');
        files.push(await finish(doc, `${baseName}${o.suffix ? `_${o.suffix}` : ''}_${nos}.pdf`));
        if (gi < groups.length - 1) doc = await newDoc();
      }
    }
    if (!o.separate) files.push(await finish(doc, `${baseName}.pdf`));
    onProgress(groups.length, groups.length, '저장 중…');
    return files;
  } finally {
    document.documentElement.style.setProperty('--zoom', zoomBefore);
    document.querySelectorAll('.photo').forEach(applyPhoto);
  }
}

/* ---------------- 대화상자 ---------------- */
function bindPdfDialog() {
  const dlg = $('#pdf-dlg');
  const q = s => dlg.querySelector(s);
  const FIELDS = { rangeText: '#pd-range', suffix: '#pd-suffix', view: '#pd-view', layout: '#pd-layout', flipSec: '#pd-flipsec', transition: '#pd-trans', compress: '#pd-compress', quality: '#pd-quality', ppi: '#pd-ppi', title: '#pd-title', lang: '#pd-lang' };
  const CHECKS = { separate: '#pd-separate', fullscreen: '#pd-full', flip: '#pd-flip', openAfter: '#pd-open', thumbs: '#pd-thumbs', bleed: '#pd-bleed' };
  let stop = false, busy = false;

  const sync = () => {
    q('#pd-range').disabled = !q('#pd-range-part').checked;
    q('#pd-suffix').disabled = !q('#pd-separate').checked;
    q('#pd-flip').disabled = !q('#pd-full').checked;
    q('#pd-flipsec').disabled = !q('#pd-full').checked || !q('#pd-flip').checked;
    q('#pd-open').disabled = q('#pd-separate').checked;
    q('#pd-quality').disabled = q('#pd-compress').value === 'lossless';
  };
  const read = () => {
    const o = { ...PDF_DEFAULTS };
    for (const [k, id] of Object.entries(FIELDS)) o[k] = q(id).value;
    for (const [k, id] of Object.entries(CHECKS)) o[k] = q(id).checked;
    o.range = q('#pd-range-part').checked ? 'part' : 'all';
    o.format = q('#pd-fmt-page').checked ? 'page' : 'spread';
    o.titleShow = q('#pd-show-file').checked ? 'file' : 'title';
    o.ppi = +o.ppi || 144;
    return o;
  };

  $('#b-pdf').addEventListener('click', () => {
    const o = { ...PDF_DEFAULTS, ...(S.pdf || {}) };
    const total = document.querySelectorAll('.page').length;
    for (const [k, id] of Object.entries(FIELDS)) q(id).value = o[k];
    for (const [k, id] of Object.entries(CHECKS)) q(id).checked = !!o[k];
    q('#pd-range-all').checked = o.range === 'all'; q('#pd-range-part').checked = o.range !== 'all';
    q('#pd-fmt-page').checked = o.format === 'page'; q('#pd-fmt-spread').checked = o.format !== 'page';
    q('#pd-show-title').checked = o.titleShow !== 'file'; q('#pd-show-file').checked = o.titleShow === 'file';
    if (!q('#pd-ppi').value) q('#pd-ppi').value = '144';
    if (!q('#pd-range').value) q('#pd-range').value = `1-${total}`;
    if (!q('#pd-title').value || (S.school && !q('#pd-title').value.includes(S.school))) q('#pd-title').value = `${S.school} 졸업앨범`;     // 다른 학교 앨범을 복사해 만든 앨범이면 예전 학교 이름이 남아 있으므로 지금 이름으로
    q('#pd-msg').textContent = '';
    q('#pd-progress').hidden = true;
    sync();
    dlg.showModal();
  });
  dlg.addEventListener('change', sync);
  dlg.addEventListener('cancel', e => { if (busy) e.preventDefault(); });
  dlg.querySelectorAll('.pd-tabs button').forEach(b => b.addEventListener('click', () => {
    dlg.querySelectorAll('.pd-tabs button').forEach(x => x.classList.toggle('on', x === b));
    dlg.querySelectorAll('.pd-tab').forEach(t => { t.hidden = t.dataset.tab !== b.dataset.tab; });
  }));
  q('#pd-cancel').addEventListener('click', () => { if (busy) stop = true; else dlg.close(); });
  q('#pd-export').addEventListener('click', async () => {
    const o = read();
    const msg = q('#pd-msg'), bar = q('#pd-bar'), go = q('#pd-export');
    busy = true; stop = false; go.disabled = true; msg.textContent = ''; pdfLinkify(q('#pd-state'));
    q('#pd-progress').hidden = false; bar.value = 0;
    S.pdf = o; saveState();
    try {
      const files = await buildInteractivePdf(o, (i, n, text) => { bar.max = n; bar.value = i; q('#pd-state').textContent = text; }, () => stop);
      const saved = [];
      for (const file of files) {
        const path = await pdfSaveToServer(file.name, file.bytes);
        if (path) { saved.push(path); continue; }
        const url = URL.createObjectURL(new Blob([file.bytes], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url; a.download = file.name;
        document.body.appendChild(a); a.click(); a.remove();
        if (o.openAfter && !o.separate) window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 120000);
        await new Promise(r => setTimeout(r, 300));
      }
      if (saved.length) pdfShowInFolder(saved[saved.length - 1]);     // 탐색기 새 창으로 저장 폴더 열기
      const mb = files.reduce((s, x) => s + x.bytes.length, 0) / 1048576;
      q('#pd-state').textContent = `완료: 파일 ${files.length}개 · ${mb.toFixed(1)}MB` + (saved.length ? ` → ${saved.length > 1 ? saved[0].replace(/[^\\]+$/, '') : saved[0]}` : '');
      if (saved.length) pdfLinkify(q('#pd-state'), saved[saved.length - 1]);
    } catch (e) {
      q('#pd-progress').hidden = true;
      msg.textContent = e.message || '내보내기에 실패했습니다.';
    }
    busy = false; go.disabled = false;
  });
}
bindPdfDialog();
