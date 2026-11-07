/* JPG로 내보내기: 72 · 100 · 200 · 300dpi. 쪽마다 또는 펼침면(두 쪽을 한 장)으로.
   픽셀 수 = 판형(mm) ÷ 25.4 × dpi, JPG 파일 안의 해상도 정보(JFIF)도 그 dpi로 적음 → 포토샵에서 열면 같은 dpi.
   폴더를 고를 수 있는 브라우저는 그 폴더에 한꺼번에 저장, 아니면 한 장씩 내려받기. */
const JE_DPI = [72, 100, 200, 300];
let jeCancel = false;

/** canvas JPG의 JFIF 머리에 dpi를 적음 (APP0이 없으면 그대로) */
async function jeJpegWithDpi(cv, q, dpi) {
  const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', q));
  const b = new Uint8Array(await blob.arrayBuffer());
  if (b[2] === 0xFF && b[3] === 0xE0 && String.fromCharCode(...b.slice(6, 10)) === 'JFIF') {
    b[13] = 1;                         // 단위: 인치당 점
    b[14] = dpi >> 8; b[15] = dpi & 255;
    b[16] = dpi >> 8; b[17] = dpi & 255;
  }
  return new Blob([b], { type: 'image/jpeg' });
}
/** 범위 글자 '1-3, 8' → 쪽 번호 집합 (비우면 null = 전체) */
function jeRange(text, max) {
  const t = String(text || '').trim();
  if (!t) return null;
  const set = new Set();
  for (const part of t.split(/[,\s]+/).filter(Boolean)) {
    const m = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (!m) throw new Error(`쪽 범위를 알 수 없습니다: ${part}`);
    const a = +m[1], z = +(m[2] || m[1]);
    for (let i = Math.min(a, z); i <= Math.max(a, z) && i <= max; i++) set.add(i);
  }
  return set;
}
/** 쪽 하나를 dpi에 맞는 크기로 그리고, 도련을 뺄 쪽은 잘라 냄. cut = { l, r, t, b } (도련을 자를지) */
async function jeRenderPage(page, dpi, fontCSS, cut) {
  const sz = SIZES[S.size] || SIZES.a4, bleedMm = S.bleed ? BLEED : 0, pageMm = sz.w + 2 * bleedMm;
  const targetW = Math.round(pageMm / 25.4 * dpi), pr = targetW / page.offsetWidth;
  const cv = await pdfRenderPage(page, pr, fontCSS, false, .95);
  const px = cv.width / pageMm * bleedMm;
  const x0 = cut.l ? px : 0, x1 = cv.width - (cut.r ? px : 0), y0 = cut.t ? px : 0, y1 = cv.height - (cut.b ? px : 0);
  if (!x0 && !y0 && x1 === cv.width && y1 === cv.height) return cv;
  const out = document.createElement('canvas');
  out.width = Math.round(x1 - x0); out.height = Math.round(y1 - y0);
  out.getContext('2d').drawImage(cv, -x0, -y0);
  cv.width = cv.height = 1;
  return out;
}
async function jeExport(o, say) {
  jeCancel = false;
  await pdfLoadLib('htmlToImage');
  await document.fonts.ready;
  const all = [...document.querySelectorAll('#pages .page')], want = jeRange(o.range, all.length);
  const fontCSS = await pdfFontCSS(), base = `${S.school || '앨범'}_${S.year || ''}`.replace(/[\\/:*?"<>|]/g, '_');
  const keep = !o.bleed;       // 도련을 뺄지
  // 묶음: 쪽마다 [i], 펼침면은 1쪽 단독 + (2,3) (4,5) …
  let groups = [];
  if (o.spread) { groups.push([0]); for (let i = 1; i < all.length; i += 2) groups.push(i + 1 < all.length ? [i, i + 1] : [i]); }
  else groups = all.map((_, i) => [i]);
  groups = groups.filter(g => !want || g.some(i => want.has(i + 1)));
  if (!groups.length) throw new Error('내보낼 쪽이 없습니다.');
  let dir = null;
  if (window.showDirectoryPicker) {
    try { dir = await showDirectoryPicker({ id: 'gradalbum-jpg', mode: 'readwrite', startIn: 'pictures' }); }
    catch (e) { if (e.name === 'AbortError') return 0; }
  }
  let n = 0;
  for (const g of groups) {
    if (jeCancel) throw new Error('취소했습니다.');
    const label = g.map(i => String(i + 1).padStart(2, '0')).join('-');
    say(`${label}쪽 그리는 중 (${n + 1}/${groups.length})`, n / groups.length);
    const cvs = [];
    for (const [k, i] of g.entries()) {
      const two = g.length === 2;
      cvs.push(await jeRenderPage(all[i], o.dpi, fontCSS, { t: keep, b: keep, l: keep || (two && k === 1), r: keep || (two && k === 0) }));     // 펼침면 가운데는 항상 붙임
    }
    let cv = cvs[0];
    if (cvs.length === 2) {
      cv = document.createElement('canvas');
      cv.width = cvs[0].width + cvs[1].width; cv.height = Math.max(cvs[0].height, cvs[1].height);
      const c = cv.getContext('2d');
      c.drawImage(cvs[0], 0, 0); c.drawImage(cvs[1], cvs[0].width, 0);
    }
    const blob = await jeJpegWithDpi(cv, o.quality, o.dpi), name = `${base}_${label}쪽_${o.dpi}dpi.jpg`;
    if (dir) {
      const fh = await dir.getFileHandle(name, { create: true }), w = await fh.createWritable();
      await w.write(blob); await w.close();
    } else {
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = name; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      await new Promise(r => setTimeout(r, 400));      // 여러 장 내려받기가 막히지 않게 조금씩
    }
    cvs.forEach(c => { c.width = c.height = 1; });
    n++;
    await new Promise(r => setTimeout(r));
  }
  return n;
}

function bindJpgExport() {
  const anchor = document.getElementById('b-pdf');
  if (!anchor) return;
  anchor.insertAdjacentHTML('afterend', '<button class="btn primary-soft" id="b-jpg">JPG로 내보내기 (72~300dpi)</button>');
  document.body.insertAdjacentHTML('beforeend', `<dialog id="je-dlg" class="it pp">
    <h3>JPG로 내보내기</h3>
    <div class="pp-row">
      <label>해상도 <select id="je-dpi">${JE_DPI.map(d => `<option value="${d}"${d === 300 ? ' selected' : ''}>${d} dpi</option>`).join('')}</select></label>
      <label>화질 <select id="je-q"><option value=".97">최고</option><option value=".92" selected>높음</option><option value=".8">보통</option></select></label>
    </div>
    <div class="pp-row">
      <label>쪽 범위 <input id="je-range" placeholder="비워 두면 전체 (예: 1-3, 8)"></label>
      <label>나누기 <select id="je-spread"><option value="0">쪽마다 한 장</option><option value="1">펼침면 (두 쪽을 한 장)</option></select></label>
    </div>
    <label class="chk"><input type="checkbox" id="je-bleed"> 도련(재단 여백 3mm) 포함</label>
    <p class="pp-note" id="je-size"></p>
    <p class="pp-note">저장할 폴더를 고르면 그 폴더에 한꺼번에 저장합니다. 파일 안의 해상도 정보도 고른 dpi로 들어가서 포토샵에서 열면 같은 크기로 보입니다.</p>
    <progress id="je-bar" max="1" value="0" hidden></progress>
    <p id="je-status" role="status"></p>
    <div class="it-foot"><span></span><button id="je-cancel">닫기</button><button id="je-go" class="pri">내보내기</button></div>
  </dialog>`);
  const d = document.getElementById('je-dlg'), $$ = s => d.querySelector(s), status = $$('#je-status'), bar = $$('#je-bar'), go = $$('#je-go');
  let busy = false;
  const showSize = () => {
    const sz = SIZES[S.size] || SIZES.a4, dpi = +$$('#je-dpi').value, b = $$('#je-bleed').checked && S.bleed ? BLEED * 2 : 0, sp = $$('#je-spread').value === '1';
    const w = Math.round((sz.w * (sp ? 2 : 1) + b) / 25.4 * dpi), h = Math.round((sz.h + b) / 25.4 * dpi);
    $$('#je-size').textContent = `한 장 크기: ${w.toLocaleString()} × ${h.toLocaleString()} 픽셀 (${sp ? '펼침면' : '한 쪽'} ${sz.name.split(' (')[0]}${b ? ', 도련 포함' : ''})` + (!S.bleed && $$('#je-bleed').checked ? ' · 왼쪽 패널에서 도련이 꺼져 있어 도련 없이 저장됩니다.' : '');
  };
  ['#je-dpi', '#je-spread', '#je-bleed'].forEach(s => $$(s).addEventListener('change', showSize));
  document.getElementById('b-jpg').addEventListener('click', () => { status.textContent = ''; bar.hidden = true; showSize(); d.showModal(); });
  $$('#je-cancel').addEventListener('click', () => { if (busy) { jeCancel = true; status.textContent = '멈추는 중…'; } else d.close(); });
  go.addEventListener('click', async () => {
    if (busy) return;
    busy = true; go.disabled = true; bar.hidden = false; bar.value = 0;
    try {
      const n = await jeExport({ dpi: +$$('#je-dpi').value, quality: +$$('#je-q').value, range: $$('#je-range').value, spread: $$('#je-spread').value === '1', bleed: $$('#je-bleed').checked }, (t, p) => { status.textContent = t; bar.value = p; });
      bar.value = 1;
      status.textContent = n ? `JPG ${n}장을 저장했습니다.` : '취소했습니다.';
    } catch (e) {
      status.textContent = e.message || '내보내기에 실패했습니다.';
    }
    busy = false; go.disabled = false;
  });
}
bindJpgExport();
