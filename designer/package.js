/* 패키지 (인디자인의 '패키지'처럼)
   앨범을 다른 컴퓨터 · 인쇄소로 넘길 때 필요한 것을 폴더 하나에 모음:
     학교_년도 패키지/
       학교_년도.album      ← 앨범 전체 (설정 · 글자 · 사진 원본 모두). 디자이너5에서 '파일 열기'로 그대로 엶
       Links/               ← 앨범에 실제로 쓰인 사진 원본 (원래 파일 이름)
       Fonts/               ← 앨범 폴더 안 글꼴 파일 (템플릿 제목 글꼴 등)
       패키지 보고서.txt    ← 쪽수 · 사진 · 저해상도 · 빈 사진틀 · 글꼴 목록
   폴더 고르기가 되면 그 안에 바로 쓰고(용량 제한 없음), 안 되면 ZIP 하나로 내려받음 */
(() => {
  const PK_LOW = 200;      // 이 dpi 아래는 저해상도로 보고
  const GENERIC = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-sans-serif', 'ui-serif', 'emoji', 'math', 'inherit', 'initial']);
  const safe = s => String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').trim() || '이름없음';
  const extOf = t => ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/svg+xml': '.svg', 'image/tiff': '.tif' }[t] || '.jpg');

  /** 앨범 점검: 쓰인 사진 · 쪽 · dpi, 빈 사진틀, 글꼴 */
  async function pkgScan() {
    flushState();
    const recs = await DB.all();
    const pages = [...document.querySelectorAll('#pages .page')];
    const used = new Map(), empty = [];
    pages.forEach((pg, i) => {
      const no = i + 1, pw = pg.offsetWidth;
      pg.querySelectorAll('.photo[data-photo]').forEach(el => {
        const key = el.dataset.photo, rw = el.offsetWidth, rh = el.offsetHeight;
        if (!rw || !rh) return;      // 숨은 틀
        const rec = photos[key];
        if (!rec || !recs[key]?.blob) { empty.push(no); return; }
        const s = (el.classList.contains('contain') ? Math.min : Math.max)(rw / rec.w, rh / rec.h) * (rec.z || 1);
        const dpi = pw ? Math.round(pw * 25.4 / (s * G.pageMm)) : 300;
        const u = used.get(key) || { pages: new Set(), dpi: Infinity };
        u.pages.add(no); u.dpi = Math.min(u.dpi, dpi);
        used.set(key, u);
      });
    });
    // 파일 이름 (같은 이름이 있으면 _2, _3 …)
    const names = new Set();
    for (const [key, u] of used) {
      const b = recs[key].blob;
      let base = safe(recs[key].nm || b.name || key), ext = (base.match(/\.[a-z0-9]{2,5}$/i) || [''])[0];
      if (!ext) { ext = extOf(b.type); } else base = base.slice(0, -ext.length);
      let name = base + ext, k = 2;
      while (names.has(name.toLowerCase())) name = `${base}_${k++}${ext}`;
      names.add(name.toLowerCase());
      Object.assign(u, { name, blob: b, w: recs[key].w, h: recs[key].h });
    }
    const unused = Object.keys(recs).filter(k => recs[k]?.blob && !used.has(k)).length;
    return { pages: pages.length, used, empty, unused, total: Object.values(recs).filter(r => r?.blob).length, fonts: await pkgFonts() };
  }

  /** 글꼴: 앨범 폴더 안 글꼴(파일로 모음) · 구글 웹 글꼴 · 컴퓨터에 설치된 글꼴 */
  async function pkgFonts() {
    // 글자에 실제로 쓰인 글꼴 = 글꼴 목록의 첫 번째 이름 (뒤의 Arial 등은 대신 쓰는 글꼴이라 빼고)
    const fams = new Set(), seen = new Set();
    for (const el of document.querySelectorAll('#pages *')) {
      if (![...el.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim())) continue;
      if (el.closest('button,.badge,.ph-rot,.ph-remove')) continue;      // 화면 조작 단추(↻ ×)는 인쇄되지 않음
      const ff = getComputedStyle(el).fontFamily;
      if (seen.has(ff)) continue;
      seen.add(ff);
      const first = ff.split(',').map(n => n.replace(/["']/g, '').trim()).find(n => n && !GENERIC.has(n.toLowerCase()));
      if (first) fams.add(first);
    }
    const local = new Map();      // 이름 → [{url, file}]
    for (const sh of document.styleSheets) {
      let rules;
      try { rules = sh.cssRules; } catch { continue; }
      for (const r of rules || []) {
        if (!(r instanceof CSSFontFaceRule)) continue;
        const fam = r.style.getPropertyValue('font-family').replace(/["']/g, '').trim();
        const m = r.cssText.match(/url\(["']?([^"')]+)["']?\)/);
        if (!fams.has(fam) || !m || /^data:/.test(m[1])) continue;
        const url = new URL(m[1], sh.href || location.href).href;
        const list = local.get(fam) || [];
        if (!list.some(x => x.url === url)) list.push({ url, file: decodeURIComponent(url.split('/').pop().split('?')[0]) });
        local.set(fam, list);
      }
    }
    let webCss = '';
    const link = document.querySelector('link[href*="fonts.googleapis.com/css2"]');
    if (link) webCss = decodeURIComponent(link.href).replace(/\+/g, ' ');
    const web = [], system = [];
    for (const f of fams) {
      if (!f || GENERIC.has(f.toLowerCase()) || local.has(f)) continue;
      (webCss.includes(`family=${f}`) ? web : system).push(f);
    }
    return { local, web, system };
  }

  function pkgReport(r, when) {
    const L = [], sz = (SIZES[S.size] || SIZES.a4);
    const low = [...r.used.values()].filter(u => u.dpi < PK_LOW).sort((a, b) => a.dpi - b.dpi);
    const pg = set => [...set].sort((a, b) => a - b).join(', ');
    L.push('졸업앨범 디자이너5 · 패키지 보고서', '='.repeat(36), '');
    L.push(`앨범: ${S.school || ''} ${S.year || ''}`.trim(), `만든 때: ${when.toLocaleString('ko-KR')}`, `판형: ${sz.w}×${sz.h}mm${S.bleed ? ` (도련 ${BLEED}mm)` : ''} · ${r.pages}쪽`, '');
    L.push('[들어 있는 것]',
      `  ${albumFileName()}  앨범 전체. 디자이너5의 '파일 → 파일 열기'로 열면 그대로 이어서 작업`,
      `  Links\\  앨범에 쓰인 사진 원본 ${r.used.size}장`,
      `  Fonts\\  앨범 폴더 안 글꼴 ${[...r.fonts.local.values()].flat().length}개`, '');
    L.push('[사진]', `  쓰인 사진 ${r.used.size}장 · 안 쓴 사진 ${r.unused}장 (안 쓴 사진은 .album 파일 안에만 있음)`);
    L.push(`  저해상도(${PK_LOW}dpi 미만): ${low.length ? `${low.length}장` : '없음'}`);
    low.forEach(u => L.push(`    - ${u.dpi}dpi  ${pg(u.pages)}쪽  ${u.name} (${u.w}×${u.h}px)`));
    const emp = [...new Set(r.empty)];
    L.push(`  빈 사진틀: ${r.empty.length ? `${r.empty.length}개 · ${emp.join(', ')}쪽` : '없음'}`, '');
    L.push('[글꼴]');
    for (const [f, list] of r.fonts.local) L.push(`  ${f}  → Fonts\\${list.map(x => x.file).join(', ')}`);
    r.fonts.web.forEach(f => L.push(`  ${f}  (구글 무료 웹 글꼴 · fonts.google.com 에서 받을 수 있음)`));
    r.fonts.system.forEach(f => L.push(`  ${f}  (이 컴퓨터에 설치된 글꼴 · 받는 컴퓨터에도 설치 필요)`));
    if (!r.fonts.local.size && !r.fonts.web.length && !r.fonts.system.length) L.push('  (없음)');
    L.push('', '[사진 목록]  파일 이름 · 쓰인 쪽 · 실제 해상도');
    [...r.used.values()].sort((a, b) => Math.min(...a.pages) - Math.min(...b.pages)).forEach(u => L.push(`  ${u.name}\t${pg(u.pages)}쪽\t${u.dpi}dpi`));
    L.push('', '※ 인쇄소 납품용 PDF는 디자이너5의 [내보내기 → 인쇄용 PDF]로 따로 만드세요.');
    return '﻿' + L.join('\r\n');
  }

  /** 파일 쓰기: 폴더(가능하면) 또는 ZIP */
  async function pkgWrite(r, say, withPdf) {
    const when = new Date(), base = albumFileName().replace(/\.album$/, ''), folder = `${base} 패키지`;
    const files = [];      // [경로, Blob 또는 () => Promise<Blob>]
    files.push([`패키지 보고서.txt`, new Blob([pkgReport(r, when)], { type: 'text/plain' })]);
    files.push([albumFileName(), async () => (await buildAlbumBlob()).blob]);
    for (const [key, u] of r.used) files.push([`Links/${u.name}`, u.blob, key]);
    for (const list of r.fonts.local.values()) for (const x of list) files.push([`Fonts/${safe(x.file)}`, async () => { const res = await fetch(x.url); if (!res.ok) throw new Error(x.file); return res.blob(); }]);

    // 1) 앨범 서버(serve.ps1)가 있으면: 서버의 폴더 고르기 창 → 실제 경로에 씀 → Links 사진을 경로로 연결 (인디자인처럼, 권한 묻기 없음)
    const SH = { 'X-Album': '1' };
    const srvUp = await fetch('/__lk/ping', { headers: SH }).then(x => x.ok).catch(() => false);
    if (srvUp) {
      say('폴더 고르기 창을 띄웠습니다 (안 보이면 작업 표시줄을 확인하세요)', 0);
      const pk = await (await fetch(`/__lk/pick?${new URLSearchParams({ title: '패키지를 저장할 곳을 고르세요 (그 안에 패키지 폴더가 생깁니다)' })}`, { headers: SH })).json();
      if (!pk.ok) return null;
      const out = `${pk.path.replace(/\\+$/, '')}\\${folder}`, fails = [], linked = [];
      for (const [i, [path, src, key]] of files.entries()) {
        say(`${i + 1} / ${files.length} 저장 중 · ${path}`, i / files.length);
        try {
          const blob = typeof src === 'function' ? await src() : src;
          const full = `${out}\\${path.replace(/\//g, '\\')}`;
          const res = await fetch(`/__lk/write?${new URLSearchParams({ path: full })}`, { method: 'POST', headers: SH, body: blob });
          const j = await res.json();
          if (!res.ok || !j.ok) throw new Error(j.error || res.status);
          if (j.s !== blob.size) throw new Error(`크기가 다름 ${j.s}/${blob.size}`);
          if (key) linked.push({ key, path: j.p, n: path.split('/').pop(), s: j.s, m: j.m });
        } catch (e) { console.warn('패키지: 저장 실패', path, e); fails.push(path); }
      }
      say('원본 연결 중…', 1);
      try { await window.lkRegister?.(null, linked); } catch (e) { console.warn('패키지: 원본 연결 실패', e); }
      fetch(`/__lk/show?${new URLSearchParams({ path: `${out}\\패키지 보고서.txt` })}`, { headers: SH }).catch(() => {});      // 탐색기로 패키지 폴더를 보여 줌
      return { where: out, count: files.length, fails, linked: linked.length };
    }

    // 2) 서버가 없으면 브라우저 폴더 고르기 (핸들로 연결), 3) 그것도 안 되면 ZIP
    let dir = null;
    if (window.showDirectoryPicker) {
      const t0 = performance.now();
      try { dir = await showDirectoryPicker({ id: 'gradalbum-pack', mode: 'readwrite', startIn: 'documents' }); }
      catch (e) { if (e.name === 'AbortError' && performance.now() - t0 > 800) return null; }
    }
    const fails = [];
    if (dir) {
      const root = await dir.getDirectoryHandle(folder, { create: true });
      const sub = {};
      const linked = [];      // 링크 창: Links 파일과 원본 연결
      for (const [i, [path, src, key]] of files.entries()) {
        say(`${i + 1} / ${files.length} 저장 중 · ${path}`, i / files.length);
        try {
          const parts = path.split('/'), name = parts.pop();
          let d = root;
          if (parts.length) d = sub[parts[0]] ||= await root.getDirectoryHandle(parts[0], { create: true });
          const blob = typeof src === 'function' ? await src() : src;
          const fh = await d.getFileHandle(name, { create: true }), w = await fh.createWritable();
          await w.write(blob); await w.close();
          if (key) linked.push({ key, fh });
        } catch (e) { console.warn('패키지: 저장 실패', path, e); fails.push(path); }
      }
      say('원본 연결 중…', 1);
      try { await window.lkRegister?.(root, linked); } catch (e) { console.warn('패키지: 원본 연결 실패', e); }
      return { where: `${dir.name}\\${folder}`, count: files.length, fails, linked: linked.length };
    }
    // ZIP (폴더를 고를 수 없는 브라우저)
    await prjLoadScript('JSZip', 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
    const zip = new JSZip(), z = zip.folder(folder);
    for (const [i, [path, src]] of files.entries()) {
      say(`${i + 1} / ${files.length} 모으는 중 · ${path}`, i / files.length * .5);
      try { z.file(path, typeof src === 'function' ? await src() : src, { binary: true }); } catch (e) { fails.push(path); }
    }
    const zb = await zip.generateAsync({ type: 'blob', compression: 'STORE' }, m => say(`ZIP 묶는 중 ${m.percent.toFixed(0)}%`, .5 + m.percent / 200));
    const url = URL.createObjectURL(zb), a = document.createElement('a');
    a.href = url; a.download = `${folder}.zip`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 300000);
    return { where: `내려받기 폴더\\${folder}.zip`, count: files.length, fails };
  }

  async function openPackage() {
    if (typeof galBulk !== 'undefined' && galBulk) { alert('사진을 넣는 중입니다. 다 들어간 뒤에 다시 눌러 주세요.'); return; }
    document.getElementById('pk-dlg')?.remove();
    const dlg = document.createElement('div');
    dlg.id = 'pk-dlg';
    dlg.innerHTML = `<div class="pk-box"><h3>패키지</h3><div class="pk-body">앨범을 살펴보는 중…</div>
      <div class="pk-bar" hidden><progress max="1" value="0"></progress><div class="pk-st"></div></div>
      <div class="pk-btns"><button type="button" class="btn ghost" data-pk="close">닫기</button><button type="button" class="btn primary-soft" data-pk="go" disabled>패키지 만들기</button></div></div>`;
    document.body.appendChild(dlg);
    const $p = s => dlg.querySelector(s), close = () => dlg.remove();
    $p('[data-pk="close"]').onclick = close;
    let r;
    try { r = await pkgScan(); } catch (e) { $p('.pk-body').textContent = `살펴보지 못했습니다: ${e.message}`; return; }
    const low = [...r.used.values()].filter(u => u.dpi < PK_LOW).length, emp = r.empty.length;
    const fontN = r.fonts.local.size + r.fonts.web.length + r.fonts.system.length;
    const mb = ([...r.used.values()].reduce((a, u) => a + u.blob.size, 0) / 1048576).toFixed(0);
    const li = (ok, t) => `<li class="${ok ? 'ok' : 'warn'}">${ok ? '✔' : '⚠'} ${t}</li>`;
    $p('.pk-body').innerHTML = `<ul>
      ${li(true, `${r.pages}쪽 · 앨범 파일(.album) 1개`)}
      ${li(true, `쓰인 사진 원본 ${r.used.size}장 (${mb}MB) → Links 폴더${r.unused ? ` · 안 쓴 사진 ${r.unused}장은 .album 안에만` : ''}`)}
      ${li(!low, low ? `저해상도(${PK_LOW}dpi 미만) 사진 ${low}장 — 보고서에 쪽 번호가 적힘` : '저해상도 사진 없음')}
      ${li(!emp, emp ? `빈 사진틀 ${emp}개 (${[...new Set(r.empty)].slice(0, 12).join(', ')}${new Set(r.empty).size > 12 ? ' …' : ''}쪽)` : '빈 사진틀 없음')}
      ${li(true, `글꼴 ${fontN}개 · 파일로 모으는 글꼴 ${[...r.fonts.local.values()].flat().length}개${r.fonts.system.length ? ` · 설치 글꼴: ${r.fonts.system.join(', ')}` : ''}`)}
      ${li(true, '패키지 보고서.txt')}
    </ul><p class="pk-note">'패키지 만들기'를 누르고 저장할 곳(예: 바탕화면, USB)을 고르면 그 안에 <b>${esc(albumFileName().replace(/\.album$/, ''))} 패키지</b> 폴더가 생깁니다.</p>`;
    const go = $p('[data-pk="go"]');
    go.disabled = false;
    go.onclick = async () => {
      go.disabled = true; $p('[data-pk="close"]').disabled = true; $p('.pk-bar').hidden = false;
      const say = (t, v) => { $p('.pk-st').textContent = t; $p('progress').value = v; };
      try {
        const res = await pkgWrite(r, say);
        if (!res) { say('취소했습니다.', 0); go.disabled = false; $p('[data-pk="close"]').disabled = false; return; }
        say(`완료: ${res.where} · 파일 ${res.count - res.fails.length}개${res.fails.length ? ` · 실패 ${res.fails.length}개 (${res.fails.slice(0, 3).join(', ')})` : ''}${res.linked ? ` · 사진 ${res.linked}장을 Links 폴더와 연결 (옮기거나 지우면 링크 창에 표시)` : ''}`, 1);
        go.textContent = '완료';
        $p('[data-pk="close"]').disabled = false;
        window.proNote?.('📦 패키지를 만들었습니다.');
      } catch (e) {
        say(`실패: ${e.message}`, 0); go.disabled = false; $p('[data-pk="close"]').disabled = false;
      }
    };
  }
  window.openPackage = openPackage;

  document.head.insertAdjacentHTML('beforeend', `<style>
    #pk-dlg{position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center}
    #pk-dlg .pk-box{background:#fff;color:#222;border-radius:10px;padding:20px 22px;width:min(560px,92vw);box-shadow:0 10px 40px rgba(0,0,0,.35);font-size:14px}
    #pk-dlg h3{margin:0 0 12px;font-size:17px}
    #pk-dlg ul{list-style:none;margin:0 0 10px;padding:0;line-height:1.9}
    #pk-dlg li.warn{color:#b45309}
    #pk-dlg .pk-note{color:#555;font-size:13px;margin:6px 0 0}
    #pk-dlg .pk-bar{margin:12px 0 0}
    #pk-dlg progress{width:100%}
    #pk-dlg .pk-st{font-size:12px;color:#444;margin-top:4px;word-break:break-all}
    #pk-dlg .pk-btns{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
  </style>`);
  document.getElementById('p-pack')?.addEventListener('click', openPackage);
})();
