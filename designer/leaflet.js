/* 졸업식 리플렛 · 팜플렛 만들기
   - 형식: 3단 접지 리플렛(A4 가로, 앞뒤 6면) · 2단 접지 팜플렛(A4 가로, 앞뒤 4면)
   - 앨범의 학교 이름 · 회차 · 학년도 · 교장 · 교가 · 학생 명단 · 사진을 자동으로 채움. 모든 글자는 눌러서 고침
   - 작년 시안(JPG · PNG · PDF)을 올리면 색 · 접지 형식 · 식순(PDF 글자)을 읽어 올해 추천 시안 3가지를 보여 줌
   - 인쇄 · PDF: 바깥면 · 안쪽면 두 장 (A4 가로, 여백 없음)
   저장: S.leaflet (앨범과 함께 저장 · .album 파일에 들어감), 사진은 lf-… 키로 앨범 사진 저장소에 */
(() => {
  const L = () => (S.leaflet ||= { fmt: 'tri', design: 'classic', pal: null, f: {} });
  const DESIGNS = {
    classic: { n: '클래식', pal: { bg: '#FBF6EC', ink: '#4A3B2E', ac: '#B08D57', soft: '#EFE3CC' } },
    water: { n: '수채화', pal: { bg: '#FCFAF6', ink: '#4F4A45', ac: '#8FAE8B', soft: '#F3D9D2' } },
    modern: { n: '모던', pal: { bg: '#FFFFFF', ink: '#222831', ac: '#2F6FDB', soft: '#E7EEF9' } },
    navy: { n: '네이비', pal: { bg: '#1F2A44', ink: '#F4EFE6', ac: '#D4B26A', soft: '#2C3A5C' } },
  };
  const FMT = { tri: '3단 접지 리플렛 (6면)', bi: '2단 접지 팜플렛 (4면)' };
  const ORDER_DEF = ['개식사', '국민의례', '학사 보고', '졸업장 수여', '상장 수여', '학교장 회고사', '축사', '송사 · 답사', '교가 제창', '폐식사'];
  const escH = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const palNow = () => ({ ...DESIGNS[L().design]?.pal, ...(L().pal || {}) });
  const yearNow = () => String(S.year || new Date().getFullYear()).replace(/[^\d]/g, '').slice(0, 4) || String(new Date().getFullYear());

  /* ---------- 글자 기본값 (앨범 정보에서) ---------- */
  function defs() {
    const school = S.school || '○○학교', nth = String(S.nth || '').replace(/[^\d]/g, '');
    return {
      school, title: `${nth ? `제${nth}회 ` : ''}졸업식`, year: `${yearNow()}학년도`,
      when: `${yearNow().replace(/\d\d$/, m => String(+m + 1).padStart(2, '0'))}. 2. 00.(○) 10:00`, where: `${school} 강당`,
      motto: (typeof texts !== 'undefined' && texts.motto) || '',
      greetT: '인사말',
      greet: `졸업생 여러분, 졸업을 진심으로 축하합니다.\n${school}에서 함께한 시간이 앞으로 걸어갈 길에 든든한 힘이 되기를 바랍니다.\n늘 건강하고, 꿈을 향해 당당하게 나아가십시오.\n\n함께해 주신 학부모님과 내빈 여러분께 깊이 감사드립니다.`,
      sign: `${school}장 ${S.principal || '○○○'}`,
      orderT: '식순', order: ORDER_DEF.map((t, i) => `${i + 1}. ${t}`).join('\n'),
      rosterT: '졸업생 명단', songT: '교가',
      song: (typeof texts !== 'undefined' && texts.songLyrics) || '교가 가사를 입력하세요',
      infoT: '축 졸업', info: `${school}\n주소를 입력하세요\n전화 000-000-0000`,
      msgT: '졸업을 축하합니다', msg: '빛나는 내일을 응원합니다',
    };
  }
  const val = k => { const f = L().f; return f[k] != null ? f[k] : defs()[k]; };
  const T = (k, cls = '', tag = 'div') => `<${tag} class="lf-t ${cls}" contenteditable="plaintext-only" spellcheck="false" data-f="${k}">${escH(val(k))}</${tag}>`;

  /* ---------- 사진 자리 ---------- */
  const PH = (slot, cls = '') => {
    const p = photos[`lf-${slot}`];
    return `<div class="lf-ph ${cls}${p ? ' has' : ''}" data-slot="${slot}" style="${p ? `background-image:url('${p.url}');background-position:${p.x ?? 50}% ${p.y ?? 50}%` : ''}">${p ? '' : '<span>사진 넣기</span>'}</div>`;
  };

  /* ---------- 면(패널) ---------- */
  function rosterHtml() {
    const classes = (typeof parseRoster === 'function' ? parseRoster(S.roster || '') : []).filter(c => c.students.length);
    const n = classes.reduce((s, c) => s + c.students.length, 0);
    if (!n) return '<div class="lf-note">앨범의 학생 명단이 비어 있습니다. 왼쪽 설정에서 명단을 넣으면 여기에 자동으로 들어갑니다.</div>';
    const fs = Math.max(.95, Math.min(1.7, 15 / Math.sqrt(n + classes.length * 3)));      // 인원이 많을수록 작게
    return `<div class="lf-roster" style="--rfs:${fs.toFixed(2)}cqw">${classes.map(c => `<div class="lf-cls"><b>${escH(c.name)}${c.teacher ? ` <small>담임 ${escH(c.teacher)}</small>` : ''}</b><p>${c.students.map(s => `<span>${escH(s.name)}</span>`).join('')}</p></div>`).join('')}</div>`;
  }
  const P = {
    cover: () => `<div class="lf-pn lf-cover">${PH('cover', 'big')}<div class="lf-cv-txt">${T('year', 'lf-yr')}${T('school', 'lf-sc')}${T('title', 'lf-tt')}<i class="lf-bar"></i>${T('when', 'lf-wh')}${T('where', 'lf-wh')}</div></div>`,
    greet: () => `<div class="lf-pn">${T('greetT', 'lf-h')}<i class="lf-bar"></i>${T('greet', 'lf-body')}${T('sign', 'lf-sign')}${PH('greet', 'mid')}</div>`,
    order: () => `<div class="lf-pn">${T('orderT', 'lf-h')}<i class="lf-bar"></i>${T('order', 'lf-order')}${PH('order', 'mid')}</div>`,
    greetOrder: () => `<div class="lf-pn">${T('greetT', 'lf-h sm')}${T('greet', 'lf-body sm')}${T('sign', 'lf-sign')}<i class="lf-bar"></i>${T('orderT', 'lf-h sm')}${T('order', 'lf-order sm')}</div>`,
    roster: () => `<div class="lf-pn">${T('rosterT', 'lf-h')}<i class="lf-bar"></i>${rosterHtml()}</div>`,
    photos: () => `<div class="lf-pn lf-photos">${T('msgT', 'lf-h')}<i class="lf-bar"></i><div class="lf-grid">${PH('p1')}${PH('p2')}${PH('p3')}</div>${T('msg', 'lf-msg')}</div>`,
    back: () => `<div class="lf-pn lf-back">${PH('emblem', 'emb')}${T('songT', 'lf-h sm')}${T('song', 'lf-song')}<div class="lf-info">${T('infoT', 'lf-h xs')}${T('info', 'lf-info-t')}</div></div>`,
  };
  const SHEETS = {
    tri: [['바깥면 (접었을 때: 오른쪽이 앞표지, 가운데가 뒷표지)', ['greet', 'back', 'cover']], ['안쪽면 (펼쳤을 때)', ['order', 'roster', 'photos']]],
    bi: [['바깥면 (오른쪽이 앞표지, 왼쪽이 뒷표지)', ['back', 'cover']], ['안쪽면 (펼쳤을 때)', ['greetOrder', 'roster']]],
  };
  const palStyle = (pal = palNow()) => `--bg:${pal.bg};--ink:${pal.ink};--ac:${pal.ac};--soft:${pal.soft}`;
  const sheetHtml = (fmt, d, names, pal) => `<div class="lf-sheet lf-${fmt} lf-d-${d}" style="${palStyle(pal)}">${names.map(n => P[n]()).join('')}</div>`;

  /* ---------- 편집 화면 ---------- */
  let room = null;
  function open() {
    if (!room) build();
    room.hidden = false;
    draw();
  }
  function build() {
    document.body.insertAdjacentHTML('beforeend', `<div id="lf-room" hidden>
      <header class="lf-top">
        <b>📰 리플렛 · 팜플렛</b>
        <select id="lf-fmt">${Object.entries(FMT).map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select>
        <span class="lf-ds">${Object.entries(DESIGNS).map(([k, d]) => `<button type="button" data-d="${k}" style="--c1:${d.pal.bg};--c2:${d.pal.ac}">${d.n}</button>`).join('')}</span>
        <label class="lf-btn lf-ref">작년 시안 올리기 → 올해 추천<input type="file" id="lf-file" accept="image/*,.pdf" hidden></label>
        <button type="button" class="lf-btn lf-cva" data-a="canva" title="Canva로 보내 꾸미고, 완성본을 다시 가져옵니다">🎨 Canva로 꾸미기</button>
        <button type="button" class="lf-btn" data-a="reset" title="고친 글자를 앨범 정보로 다시 채움">글자 처음대로</button>
        <button type="button" class="lf-btn pri" data-a="print">인쇄 · PDF 저장</button>
        <button type="button" class="lf-btn" data-a="close">닫기 ✕</button>
      </header>
      <div class="lf-main"><aside class="lf-side" id="lf-side"></aside><div class="lf-stage" id="lf-stage"></div></div>
      <input type="file" id="lf-phfile" accept="image/*" hidden>
      <input type="file" id="lf-cvfile" accept="image/*,.pdf" multiple hidden>
    </div>`);
    room = document.getElementById('lf-room');
    room.querySelector('#lf-fmt').addEventListener('change', e => { L().fmt = e.target.value; saveState(); draw(); });
    room.querySelector('.lf-ds').addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (!b) return; L().design = b.dataset.d; L().pal = null; saveState(); draw(); });
    room.querySelector('#lf-file').addEventListener('change', async e => { const f = e.target.files[0]; e.target.value = ''; if (f) await analyze(f); });
    room.querySelector('.lf-top').addEventListener('click', e => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'close') room.hidden = true;
      else if (a === 'print') printSheets();
      else if (a === 'canva') { const c = room.querySelector('#lf-canva'); c?.scrollIntoView({ behavior: 'smooth', block: 'start' }); c?.classList.remove('flash'); void c?.offsetWidth; c?.classList.add('flash'); }
      else if (a === 'reset' && confirm('리플렛에서 고친 글자를 모두 앨범 정보(학교 · 명단 · 교가 …)로 다시 채울까요?')) { L().f = {}; saveState(); draw(); }
    });
    const stage = room.querySelector('#lf-stage');
    stage.addEventListener('input', e => { const t = e.target.closest('[data-f]'); if (!t) return; L().f[t.dataset.f] = t.innerText.replace(/\n$/, ''); saveState(); });
    stage.addEventListener('click', e => { const ph = e.target.closest('.lf-ph'); if (ph) photoMenu(ph.dataset.slot, e); });
    room.querySelector('#lf-side').addEventListener('click', e => {
      const cv = e.target.closest('[data-cv]');
      if (cv) { canvaAct(cv.dataset.cv, cv); return; }
      const r = e.target.closest('[data-rec]');
      if (r) { applyRec(recs[+r.dataset.rec]); return; }
      const sw = e.target.closest('[data-pal]');
      if (sw) { L().pal = JSON.parse(sw.dataset.pal); saveState(); draw(); }
    });
    room.querySelector('#lf-side').addEventListener('change', e => {
      if (e.target.id === 'lf-cvurl') { CV().url = e.target.value.trim(); saveState(); drawSide(); }
      else if (e.target.id === 'lf-cvuse') { CV().use = e.target.checked; saveState(); draw(); }
    });
    room.querySelector('#lf-cvfile').addEventListener('change', async e => {
      const fs = [...e.target.files]; e.target.value = '';
      if (fs.length) await importCanva(fs);
    });
    room.querySelector('#lf-phfile').addEventListener('change', async e => {
      const f = e.target.files[0]; e.target.value = '';
      if (f && pickSlot) { await setPhoto(`lf-${pickSlot}`, f); draw(); }
    });
    addEventListener('keydown', e => { if (e.key === 'Escape' && room && !room.hidden && !document.getElementById('lf-pick')) room.hidden = true; });
  }
  function draw() {
    const l = L();
    room.querySelector('#lf-fmt').value = l.fmt;
    room.querySelectorAll('.lf-ds [data-d]').forEach(b => b.classList.toggle('on', b.dataset.d === l.design));
    const cvk = canvaKeys();
    room.querySelector('#lf-stage').innerHTML = CV().use && cvk.length
      ? cvk.map((k, i) => `<section class="lf-wrap"><h3>Canva 완성본 ${i + 1}쪽</h3><img class="lf-cvsheet" src="${photos[k].url}" alt=""></section>`).join('')
        + '<p class="lf-tip">Canva에서 가져온 완성본을 보고 있습니다. 인쇄 · PDF도 이 완성본으로 나갑니다. 왼쪽 Canva 칸에서 [완성본으로 보기 · 인쇄]를 끄면 여기서 만든 시안으로 돌아갑니다.</p>'
      : SHEETS[l.fmt].map(([label, names]) => `<section class="lf-wrap"><h3>${label}</h3>${sheetHtml(l.fmt, l.design, names)}</section>`).join('')
        + '<p class="lf-tip">글자는 눌러서 바로 고칩니다. 사진 자리를 누르면 앨범 사진이나 파일에서 넣을 수 있습니다. 명단은 앨범의 학생 명단에서 자동으로 들어갑니다.</p>';
    drawSide();
  }

  /* ---------- 옆 칸: 작년 시안 · 추천 시안 · 색 ---------- */
  let recs = [];
  function drawSide() {
    recs = L().recs || [];      // 추천 시안은 앨범에 함께 저장 (다시 열어도 보임)
    const l = L(), ref = l.ref, side = room.querySelector('#lf-side');
    const pals = [...Object.values(DESIGNS).map(d => d.pal), ...(ref?.pal ? [ref.pal, freshen(ref.pal)] : [])];
    side.innerHTML = `${canvaHtml()}${ref ? `<h4>작년 시안</h4><img class="lf-refimg" src="${ref.thumb}" alt="">
      <p class="lf-small">${escH(ref.summary)}</p>` : '<h4>작년 시안으로 추천 받기</h4><p class="lf-small">위의 <b>[작년 시안 올리기]</b>로 작년 리플렛(JPG · PNG · PDF)을 올리면 색 · 접지 형식 · 식순을 읽어 올해 시안 3가지를 추천합니다. PDF면 글자(회차 · 식순)까지 읽습니다.</p>'}
      ${recs.length ? `<h4>올해 추천 시안</h4>${recs.map((r, i) => `<button type="button" class="lf-rec" data-rec="${i}"><div class="lf-mini lf-mini-${r.fmt}">${sheetHtml(r.fmt, r.design, SHEETS[r.fmt][0][1], r.pal)}</div><b>${i + 1}. ${escH(r.title)}</b><small>${escH(r.why)}</small></button>`).join('')}` : ''}
      <h4>색</h4><div class="lf-pals">${pals.map(p => `<button type="button" data-pal='${JSON.stringify(p)}' title="이 색으로" style="background:linear-gradient(135deg,${p.bg} 0 50%,${p.ac} 50% 75%,${p.ink} 75%)"></button>`).join('')}</div>`;
  }
  function applyRec(r) {
    if (!r) return;
    const l = L();
    Object.assign(l, { fmt: r.fmt, design: r.design, pal: r.pal });
    Object.assign(l.f, r.f || {});
    saveState(); draw();
    frameNote?.(`추천 시안 "${r.title}"을 넣었습니다. 글자 · 사진은 눌러서 고치세요.`);
  }

  /* ---------- 사진 고르기 ---------- */
  let pickSlot = null;
  function photoMenu(slot, e) {
    pickSlot = slot;
    document.getElementById('lf-pick')?.remove();
    const keys = Object.keys(photos).filter(k => photos[k]?.url && !/^(orig--|rot0--|lf-)/.test(k)).slice(0, 600);
    document.body.insertAdjacentHTML('beforeend', `<div id="lf-pick"><div class="lf-pk-box">
      <header><b>사진 넣기</b><button type="button" data-k="__file" class="lf-btn">📁 파일에서 고르기</button>${photos[`lf-${slot}`] ? '<button type="button" data-k="__del" class="lf-btn">사진 빼기</button>' : ''}<button type="button" data-k="__x" class="lf-btn">닫기 ✕</button></header>
      <p class="lf-small">앨범에 넣은 사진 ${keys.length}장 중에서 고르세요.</p>
      <div class="lf-pk-grid">${keys.map(k => `<button type="button" data-k="${escH(k)}" style="background-image:url('${photos[k].url}')" title="${escH(k)}"></button>`).join('')}</div></div></div>`);
    const pk = document.getElementById('lf-pick');
    pk.addEventListener('click', async ev => {
      const k = ev.target.closest('[data-k]')?.dataset.k;
      if (!k && ev.target !== pk) return;
      pk.remove();
      if (!k || k === '__x') return;
      if (k === '__file') { room.querySelector('#lf-phfile').click(); return; }
      const key = `lf-${slot}`;
      if (k === '__del') { if (photos[key]) { URL.revokeObjectURL(photos[key].url); delete photos[key]; await DB.drop(key); } draw(); return; }
      const p = photos[k];
      if (photos[key]) URL.revokeObjectURL(photos[key].url);
      photos[key] = { ...p, url: URL.createObjectURL(p.blob) };
      await DB.put(key, recOf(photos[key]));
      draw();
    });
  }

  /* ---------- 인쇄 · PDF ---------- */
  async function printSheets() {
    const l = L(), css = await (await fetch('leaflet.css', { cache: 'no-store' })).text();
    const links = [...document.querySelectorAll('link[rel="stylesheet"]')].filter(x => /fonts\.googleapis/.test(x.href)).map(x => `<link rel="stylesheet" href="${x.href}">`).join('');
    const cvk = canvaKeys();
    const body = CV().use && cvk.length
      ? cvk.map(k => `<div class="lf-sheet"><img src="${photos[k].url}" style="width:100%;height:100%;object-fit:cover;display:block" alt=""></div>`).join('')      // Canva 완성본
      : SHEETS[l.fmt].map(([, names]) => sheetHtml(l.fmt, l.design, names)).join('').replace(/ contenteditable="plaintext-only"/g, '').replace(/<span>사진 넣기<\/span>/g, '');
    const w = window.open('', '_blank');
    if (!w) { alert('팝업이 막혀 인쇄 창을 열지 못했습니다. 주소창 오른쪽에서 팝업을 허용해 주세요.'); return; }
    const root = getComputedStyle(document.documentElement), fonts = ['--f-title', '--f-body', '--f-en', '--f-script', '--f-cap'].map(v => `${v}:${root.getPropertyValue(v)}`).join(';');
    w.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${escH(val('school'))} ${escH(val('title'))} 리플렛</title>${links}
      <style>${css}
      :root{${fonts}} @page{size:297mm 210mm;margin:0} html,body{margin:0;background:#fff}
      .lf-sheet{width:297mm;height:210mm;box-shadow:none!important;page-break-after:always;break-after:page}
      .lf-ph:not(.has){background:none!important;border:0!important}</style></head><body>${body}
      <script>document.fonts.ready.then(()=>setTimeout(()=>print(),400))<\/script></body></html>`);
    w.document.close();
  }

  /* ---------- Canva 연동 (서버 없이: 보내기 → Canva에서 꾸미기 → 완성본 가져오기) ----------
     보내기: 면마다 A4 가로 300dpi PNG(그대로 배경으로) · PDF(Canva가 글자를 고칠 수 있게 읽음) · 글자 복사
     가져오기: Canva에서 내려받은 PNG · JPG · PDF → lf-cv0, lf-cv1 … 사진 키로 저장, 켜 두면 화면 · 인쇄가 완성본으로 */
  const CV = () => (L().canva ||= { url: '', use: false });
  const canvaKeys = () => Object.keys(photos).filter(k => /^lf-cv\d+$/.test(k) && photos[k]?.url).sort((a, b) => +a.slice(5) - +b.slice(5));
  const CANVA_HOME = 'https://www.canva.com/';
  const canvaUrlOk = u => /^https:\/\/(www\.)?canva\.(com|cn)\/design\//.test(u || '');
  const fileBase = () => `${val('school')}_${val('title')}`.replace(/[\\/:*?"<>|\s]+/g, '_');
  function canvaHtml() {
    const c = CV(), keys = canvaKeys(), names = SHEETS[L().fmt].map(s => s[0].split(' (')[0]);
    return `<section class="lf-canva" id="lf-canva">
      <h4>🎨 Canva로 꾸미기</h4>
      <p class="lf-step"><i>1</i> Canva로 보낼 파일 받기</p>
      <div class="lf-cvrow"><button type="button" class="lf-btn" data-cv="png" title="${names.join(' · ')} 두 장, A4 가로 300dpi">그림(PNG) 받기</button><button type="button" class="lf-btn" data-cv="pdf" title="인쇄 창에서 대상을 [PDF로 저장]으로">PDF 받기</button></div>
      <button type="button" class="lf-btn lf-wide" data-cv="copy">글자 모두 복사 (식순 · 명단 · 교가 …)</button>
      <p class="lf-small">PNG는 지금 모습 그대로 배경으로 쓰기 좋고, PDF는 Canva가 글자를 읽어 고칠 수 있게 가져옵니다.</p>
      <p class="lf-step"><i>2</i> Canva에서 꾸미기</p>
      <button type="button" class="lf-btn lf-wide lf-cvgo" data-cv="open">${canvaUrlOk(c.url) ? 'Canva에서 이어서 고치기 ↗' : 'Canva 열기 ↗'}</button>
      <p class="lf-small">${canvaUrlOk(c.url) ? '저장해 둔 디자인을 엽니다.' : 'Canva 첫 화면에 받은 파일을 끌어다 놓으면 새 디자인으로 열립니다.'}</p>
      <input type="url" id="lf-cvurl" class="lf-cvurl" placeholder="Canva 디자인 주소 붙여넣기 (다음에 바로 열기)" value="${escH(c.url)}">
      ${c.url && !canvaUrlOk(c.url) ? '<p class="lf-small lf-warn">canva.com/design/… 으로 시작하는 주소를 넣어 주세요.</p>' : ''}
      <p class="lf-step"><i>3</i> 완성본 가져오기</p>
      <button type="button" class="lf-btn lf-wide" data-cv="import">Canva 완성본 올리기 (PNG · JPG · PDF)</button>
      ${keys.length ? `<div class="lf-cvthumbs">${keys.map((k, i) => `<figure><img src="${photos[k].url}" alt=""><figcaption>${i + 1}쪽</figcaption></figure>`).join('')}</div>
        <label class="lf-cvuse"><input type="checkbox" id="lf-cvuse"${c.use ? ' checked' : ''}> 완성본으로 보기 · 인쇄</label>
        <button type="button" class="lf-btn lf-wide" data-cv="clear">완성본 빼기</button>` : '<p class="lf-small">Canva에서 [공유 → 다운로드]로 PDF(인쇄용) 또는 PNG를 받아 올리면, 인쇄 · PDF가 그 완성본으로 나갑니다.</p>'}
    </section>`;
  }
  async function canvaAct(a, btn) {
    if (a === 'pdf') return printSheets();
    if (a === 'open') { window.open(canvaUrlOk(CV().url) ? CV().url : CANVA_HOME, '_blank', 'noopener'); return; }
    if (a === 'import') { room.querySelector('#lf-cvfile').click(); return; }
    if (a === 'copy') {
      const txt = allText();
      try { await navigator.clipboard.writeText(txt); frameNote?.('리플렛 글자를 모두 복사했습니다. Canva의 글상자에 붙여 넣으세요.'); }
      catch { prompt('아래 글자를 복사하세요 (Ctrl+C)', txt); }
      return;
    }
    if (a === 'clear') {
      if (!confirm('가져온 Canva 완성본을 뺄까요? (Canva에 있는 디자인은 그대로입니다)')) return;
      for (const k of canvaKeys()) { URL.revokeObjectURL(photos[k].url); delete photos[k]; await DB.drop(k); }
      CV().use = false; saveState(); draw(); return;
    }
    if (a === 'png') {
      const t0 = btn.textContent; btn.disabled = true;
      try {
        const sheets = SHEETS[L().fmt];
        for (let i = 0; i < sheets.length; i++) {
          btn.textContent = `그리는 중 ${i + 1}/${sheets.length}…`;
          const blob = await sheetPng(sheets[i][1]);
          download(blob, `${fileBase()}_${sheets[i][0].split(' (')[0]}.png`);
        }
        frameNote?.('PNG를 받았습니다. Canva 첫 화면에 끌어다 놓거나, 디자인의 [업로드]에 넣으세요.');
      } catch (e) { alert(`그림을 만들지 못했습니다: ${e.message || e}`); }
      finally { btn.disabled = false; btn.textContent = t0; }
    }
  }
  function download(blob, name) {
    const a = document.createElement('a'), u = URL.createObjectURL(blob);
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 4000);
  }
  /** 한 면을 A4 가로 300dpi(3508×2480) PNG로. 화면 밖에 그대로 그려 html-to-image로 찍음 (글꼴 · 사진 포함) */
  async function sheetPng(names) {
    await prjLoadScript('htmlToImage', 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js');
    const W = 1123, H = 794, l = L();
    const host = document.createElement('div');
    host.className = 'lf-export';
    host.style.cssText = `position:fixed;left:-20000px;top:0;width:${W}px;pointer-events:none`;
    host.innerHTML = sheetHtml(l.fmt, l.design, names).replace(/ contenteditable="plaintext-only"/g, '').replace(/<span>사진 넣기<\/span>/g, '');
    document.body.appendChild(host);
    try {
      const el = host.firstElementChild;
      el.style.width = `${W}px`; el.style.height = `${H}px`; el.style.boxShadow = 'none';
      await document.fonts.ready;
      // 그림으로 찍을 때 글자 폭이 화면보다 조금 넓게 재져 한 줄 글자가 두 줄로 넘어가는 것을 막음: 글상자마다 폭을 몇 px 넉넉히 고정
      const ts = [...el.querySelectorAll('.lf-t')], ws = ts.map(t => t.getBoundingClientRect().width);
      ts.forEach((t, i) => { t.style.maxWidth = 'none'; t.style.width = `${Math.ceil(ws[i]) + 6}px`; t.style.marginLeft = t.style.marginRight = '-3px'; });
      return await htmlToImage.toBlob(el, { width: W, height: H, pixelRatio: 3508 / W, backgroundColor: palNow().bg });
    } finally { host.remove(); }
  }
  function allText() {
    const g = k => val(k).trim();
    const classes = (typeof parseRoster === 'function' ? parseRoster(S.roster || '') : []).filter(c => c.students.length);
    const roster = classes.map(c => `${c.name}${c.teacher ? ` (담임 ${c.teacher})` : ''}\n${c.students.map(s => s.name).join('  ')}`).join('\n\n');
    return [
      `${g('year')}\n${g('school')}\n${g('title')}\n${g('when')}\n${g('where')}`,
      `[${g('greetT')}]\n${g('greet')}\n${g('sign')}`,
      `[${g('orderT')}]\n${g('order')}`,
      roster && `[${g('rosterT')}]\n${roster}`,
      `[${g('songT')}]\n${g('song')}`,
      `[${g('msgT')}]\n${g('msg')}`,
      `[${g('infoT')}]\n${g('info')}`,
    ].filter(Boolean).join('\n\n');
  }
  /** Canva 완성본: 그림은 그대로, PDF는 쪽마다 A4 300dpi JPG로 그려 저장 */
  async function importCanva(files) {
    const side = room.querySelector('#lf-canva');
    side?.insertAdjacentHTML('beforeend', '<p class="lf-small lf-busy">완성본 읽는 중…</p>');
    try {
      const out = [];
      for (const f of files) {
        if (/pdf$/i.test(f.type) || /\.pdf$/i.test(f.name)) {
          await prjLoadScript('pdfjsLib', 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          const doc = await pdfjsLib.getDocument({ data: await f.arrayBuffer(), cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/', cMapPacked: true }).promise;
          for (let p = 1; p <= Math.min(doc.numPages, 8); p++) {
            const pg = await doc.getPage(p), v0 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: Math.min(6, 3508 / Math.max(v0.width, v0.height)) });
            const cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
            const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
            await pg.render({ canvasContext: ctx, viewport: vp }).promise;
            const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', .95));
            out.push(new File([blob], `canva-${p}.jpg`, { type: 'image/jpeg' }));
          }
        } else if (f.type.startsWith('image/')) out.push(f);
      }
      if (!out.length) { alert('그림(PNG · JPG)이나 PDF 파일을 올려 주세요.'); return; }
      for (const k of canvaKeys()) { URL.revokeObjectURL(photos[k].url); delete photos[k]; await DB.drop(k); }      // 새로 올리면 통째로 바꿈
      out.sort((a, b) => a.name.localeCompare(b.name, 'ko', { numeric: true }));
      for (let i = 0; i < out.length; i++) await setPhoto(`lf-cv${i}`, out[i]);
      CV().use = true; saveState(); draw();
      frameNote?.(`Canva 완성본 ${out.length}쪽을 가져왔습니다. 인쇄 · PDF가 이 완성본으로 나갑니다.`);
    } catch (e) { alert(`완성본을 읽지 못했습니다: ${e.message || e}`); }
    finally { room.querySelector('.lf-busy')?.remove(); }
  }

  /* ---------- 작년 시안 분석 → 올해 추천 ---------- */
  async function loadRef(file) {
    const cv = document.createElement('canvas'), ctx = cv.getContext('2d', { willReadFrequently: true });
    let lines = [];
    if (/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)) {
      await prjLoadScript('pdfjsLib', 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const doc = await pdfjsLib.getDocument({ data: await file.arrayBuffer(), cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/', cMapPacked: true }).promise;
      const pg = await doc.getPage(1), v0 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: Math.min(3, 1400 / v0.width) });
      cv.width = vp.width; cv.height = vp.height;
      await pg.render({ canvasContext: ctx, viewport: vp }).promise;
      try { lines = (await pdfRows(file)).map(r => r.join(' ')); } catch { lines = []; }
    } else {
      const bmp = await createImageBitmap(file), k = Math.min(1, 1400 / bmp.width);
      cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
      ctx.drawImage(bmp, 0, 0, cv.width, cv.height);
    }
    return { cv, ctx, lines };
  }
  const lum = ([r, g, b]) => (.2126 * r + .7152 * g + .0722 * b) / 255;
  const sat = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx ? (mx - mn) / mx : 0; };
  const hex = c => `#${c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  /** 작은 그림으로 줄여 k-평균으로 대표 색 6개 → 바탕 · 글자 · 강조 · 연한 색 */
  function palette(ctx, w, h) {
    const sw = 90, sh = Math.max(1, Math.round(90 * h / w)), c = document.createElement('canvas');
    c.width = sw; c.height = sh;
    const cx = c.getContext('2d', { willReadFrequently: true });
    cx.drawImage(ctx.canvas, 0, 0, sw, sh);
    const d = cx.getImageData(0, 0, sw, sh).data, px = [];
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) px.push([d[i], d[i + 1], d[i + 2]]);
    let cen = Array.from({ length: 6 }, (_, i) => px[Math.floor((i + .5) * px.length / 6)] || [255, 255, 255]);
    let cnt = [];
    for (let it = 0; it < 8; it++) {
      const sum = cen.map(() => [0, 0, 0]); cnt = cen.map(() => 0);
      for (const p of px) { let b = 0, bd = 1e9; cen.forEach((q, j) => { const dd = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2; if (dd < bd) { bd = dd; b = j; } }); cnt[b]++; sum[b][0] += p[0]; sum[b][1] += p[1]; sum[b][2] += p[2]; }
      cen = cen.map((q, j) => (cnt[j] ? sum[j].map(v => v / cnt[j]) : q));
    }
    const cl = cen.map((c2, j) => ({ c: c2, n: cnt[j] / px.length })).filter(x => x.n > .01).sort((a, b) => b.n - a.n);
    const bg = cl[0].c, dark = lum(bg) < .4;
    const others = cl.slice(1);
    const ink = (dark ? others.slice().sort((a, b) => lum(b.c) - lum(a.c))[0] : others.slice().sort((a, b) => lum(a.c) - lum(b.c))[0])?.c || (dark ? [245, 240, 230] : [40, 40, 40]);
    // 강조색: 선명한 점(채도 높고 너무 밝거나 어둡지 않음)만 모아 가장 많은 색 계열의 평균. 작은 금색 띠도 잡히고, 섞여 생긴 회색은 빠짐
    const vivid = px.filter(p => sat(p) > .35 && lum(p) > .15 && lum(p) < .9 && Math.abs(lum(p) - lum(bg)) > .08);
    let acc = null;
    if (vivid.length > px.length * .003) {
      const hueOf = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn || 1; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return Math.floor(((h * 60 + 360) % 360) / 30); };
      const bins = Array.from({ length: 12 }, () => []);
      vivid.forEach(p => bins[hueOf(p)].push(p));
      const top = bins.sort((a, b) => b.length - a.length)[0];
      acc = [0, 1, 2].map(i => top.reduce((s, p) => s + p[i], 0) / top.length);
    }
    const score = x => sat(x.c) ** 2 * Math.sqrt(x.n);
    acc ||= others.filter(x => x.c !== ink).sort((a, b) => score(b) - score(a))[0]?.c || mix(bg, ink, .5);
    const fixInk = Math.abs(lum(ink) - lum(bg)) < .45 ? (dark ? [244, 239, 230] : [45, 40, 36]) : ink;      // 글자가 바탕과 너무 비슷하면 읽히게
    return { bg: hex(bg), ink: hex(fixInk), ac: hex(acc), soft: hex(mix(bg, acc, dark ? .3 : .22)) };
  }
  /** 접는 선 자리(1/3 · 2/3 또는 1/2)에 글자 · 그림이 적으면 그 형식으로 */
  function guessFmt(ctx, w, h, bgHex) {
    if (w < h) return 'bi';
    // 세로줄마다 바탕색과 다른 점(글자 · 그림)의 수를 셈
    const d = ctx.getImageData(0, 0, w, h).data, col = new Float64Array(w), step = Math.max(1, Math.floor(h / 300)), [br, bgc, bb] = rgb(bgHex);
    for (let y = 0; y < h; y += step) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (Math.abs(d[i] - br) + Math.abs(d[i + 1] - bgc) + Math.abs(d[i + 2] - bb) > 70) col[x]++; }
    const band = c => { const a = Math.floor(w * (c - .025)), b = Math.ceil(w * (c + .025)); let m = 1e18; for (let x = a; x <= b; x++) { let s = 0; for (let k = -3; k <= 3; k++) s += col[x + k] || 0; m = Math.min(m, s); } return m; };
    const tri = (band(1 / 3) + band(2 / 3)) / 2, bi = band(.5);
    return tri < bi * .85 ? 'tri' : 'bi';
  }
  function readText(lines) {
    const all = lines.join('\n'), r = {};
    const nth = all.match(/제\s*(\d{1,3})\s*회/); if (nth) r.nth = +nth[1];
    const yr = all.match(/(20\d\d)\s*학년도/) || all.match(/(20\d\d)\s*[.년]/); if (yr) r.year = +yr[1];
    const KW = /(개식|국민의례|애국가|묵념|학사\s*보고|졸업장|수여|시상|상장|회고사|식사|축사|격려사|송사|답사|교가|폐식|영상|축가|꽃다발|기념\s*촬영)/;
    const seen = new Set(), order = [];
    for (const ln of lines) {
      const t = ln.replace(/^\s*[\d①-⑳]+[.)]?\s*/, '').replace(/\s*[.·…]{2,}.*$/, '').trim();
      if (t.length > 1 && t.length < 24 && KW.test(t) && !seen.has(t)) { seen.add(t); order.push(t); }
    }
    if (order.length >= 4) r.order = order;
    const pl = all.match(/(?:장소|곳)\s*[:：]?\s*([^\n]{2,30})/); if (pl) r.where = pl[1].trim();
    return r;
  }
  function freshen(p) {      // 올해 느낌: 같은 색 계열로 밝기를 뒤집음 (어두운 시안 → 밝은 판, 밝은 시안 → 깊은 색 판)
    const bg0 = rgb(p.bg), ac0 = rgb(p.ac), ink0 = rgb(p.ink);
    if (lum(bg0) < .4) {
      const bg = mix([252, 249, 242], ac0, .06), ac = lum(ac0) > .55 ? mix(ac0, [0, 0, 0], .25) : ac0;
      return { bg: hex(bg), ink: hex(lum(bg0) < .25 ? bg0 : mix(bg0, [0, 0, 0], .4)), ac: hex(ac), soft: hex(mix(bg, ac0, .18)) };
    }
    const deep = mix(lum(ink0) < .3 ? ink0 : ac0, [12, 14, 24], .55), ac = lum(ac0) < .5 ? mix(ac0, [255, 255, 255], .35) : ac0;
    return { bg: hex(deep), ink: hex(mix(bg0, [255, 255, 255], .4)), ac: hex(ac), soft: hex(mix(deep, ac, .22)) };
  }
  const designFor = p => { const b = rgb(p.bg); return lum(b) < .4 ? 'navy' : sat(rgb(p.ac)) > .55 && lum(b) > .92 ? 'modern' : sat(b) > .06 ? 'classic' : 'water'; };

  async function analyze(file) {
    const side = room.querySelector('#lf-side');
    side.innerHTML = '<h4>작년 시안 읽는 중…</h4><p class="lf-small">색 · 접지 형식 · 글자를 살펴보고 있습니다.</p>';
    let ref;
    try { ref = await loadRef(file); } catch (e) { side.innerHTML = `<h4>읽지 못했습니다</h4><p class="lf-small">${escH(e.message || e)}</p>`; return; }
    const { cv, ctx, lines } = ref, pal = palette(ctx, cv.width, cv.height), fmt = guessFmt(ctx, cv.width, cv.height, pal.bg), tx = readText(lines);
    const t = document.createElement('canvas'), k = 360 / cv.width;
    t.width = 360; t.height = Math.round(cv.height * k);
    t.getContext('2d').drawImage(cv, 0, 0, t.width, t.height);
    // 올해 글자: 작년 회차 + 1, 작년 식순 순서 유지. 앨범에 회차 · 학년도가 있으면 그쪽이 먼저
    const f = {}, nth = S.nth ? String(S.nth).replace(/[^\d]/g, '') : tx.nth ? String(tx.nth + 1) : '';
    if (nth) f.title = `제${nth}회 졸업식`;
    if (tx.order) f.order = tx.order.map((s, i) => `${i + 1}. ${s}`).join('\n');
    if (tx.where) f.where = tx.where;
    const lastYr = tx.year ? `${tx.year}학년도` : '', found = [lastYr && `작년 ${lastYr}`, tx.nth && `제${tx.nth}회`, tx.order && `식순 ${tx.order.length}개`].filter(Boolean).join(' · ');
    L().ref = { pal, fmt, thumb: t.toDataURL('image/jpeg', .8), summary: `${FMT[fmt]}으로 보입니다. 색: 바탕 ${pal.bg} · 강조 ${pal.ac}.${found ? ` 읽은 글자: ${found}.` : lines.length ? '' : ' (그림 파일이라 글자는 읽지 않았습니다. PDF를 올리면 회차 · 식순도 읽습니다.)'}` };
    const d1 = designFor(pal), rest = Object.keys(DESIGNS).filter(d => d !== d1);
    const fresh = freshen(pal), d3 = designFor(fresh) !== d1 ? designFor(fresh) : rest[1];
    recs = [
      { title: '작년 느낌 그대로', why: `작년 색과 ${FMT[fmt].split(' (')[0]} 형식을 그대로, 회차 · 학년도 · 명단만 올해로`, fmt, design: d1, pal, f },
      { title: '작년 색 + 새 디자인', why: `익숙한 색은 지키고 짜임은 ${DESIGNS[rest[0]].n} 스타일로 새롭게`, fmt, design: rest[0], pal, f },
      { title: '올해 새 느낌', why: `작년 색 계열로 ${lum(rgb(pal.bg)) < .4 ? '밝고 화사하게' : '깊고 차분하게'} 뒤집은 판 · ${DESIGNS[d3].n} 스타일`, fmt, design: d3, pal: fresh, f },
    ];
    L().recs = recs;
    saveState();
    drawSide();
  }

  window.openLeaflet = open;
  const bind = () => { const b = document.getElementById('p-leaflet'); if (b && !b.dataset.lf) { b.dataset.lf = '1'; b.addEventListener('click', open); } };
  bind(); addEventListener('DOMContentLoaded', bind);
})();
