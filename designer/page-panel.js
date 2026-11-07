/* 페이지 패널 (인디자인의 페이지 패널처럼): 스프레드 썸네일을 보며 쪽을 고르고 추가 · 삭제.
   썸네일은 페이지를 그대로 복사하지 않고 사진틀 위치와 사진만 작게 그려서 가벼움. */
let pgSel = null, pgTimer = null;
const pgData = () => (S.pageEdits ||= { extra: [], hidden: [], next: 1 });
const pgPages = () => [...document.querySelectorAll('#pages .page')];
const pgNote = t => { const n = document.getElementById('pg-note'); if (n) n.textContent = t || ''; };

function pgThumb(page, no) {
  const tr = page.querySelector('.trim');
  if (!tr) return '';
  const t = tr.getBoundingClientRect(), W = t.width || 1, H = t.height || 1, pct = (v, b) => `${(v / b * 100).toFixed(1)}%`;
  const boxes = [...page.querySelectorAll('.photo')].filter(el => !el.closest('.fr-hidden,.fr-ghost')).map(el => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return '';
    const bg = el.classList.contains('has-img') ? `background-image:${el.style.backgroundImage.replace(/"/g, "'")};background-size:${el.style.backgroundSize};background-position:${el.style.backgroundPosition}` : '';
    return `<i class="pg-ph${bg ? '' : ' none'}" style="left:${pct(r.left - t.left, W)};top:${pct(r.top - t.top, H)};width:${pct(r.width, W)};height:${pct(r.height, H)};${bg}"></i>`;
  }).join('');
  const heads = [...page.querySelectorAll('.h-ko,.gal-title')].filter(el => !el.closest('.fr-hidden') && el.textContent.trim()).slice(0, 1).map(el => {
    const r = el.getBoundingClientRect();
    return `<i class="pg-tx" style="left:25%;top:${pct(r.top - t.top, H)};width:50%;height:${Math.max(2, r.height / H * 60).toFixed(1)}%"></i>`;
  }).join('');
  const pid = page.dataset.pid;
  return `<button type="button" class="pg-page${pgSel === pid ? ' on' : ''}" data-pid="${esc(pid)}" title="${no}쪽 · ${esc(page.closest('.sheet')?.querySelector('.sheet-label')?.textContent || '')}" style="aspect-ratio:${(W / H).toFixed(3)}">${boxes}${heads}</button>`;
}
function pgBuild() {
  const box = document.getElementById('pg-list');
  if (!box) return;
  const pages = pgPages(), keep = box.scrollTop;
  if (pgSel && !pages.some(p => p.dataset.pid === pgSel)) pgSel = null;
  let html = '', spreads = 0;
  const row = (idx, single) => {
    spreads++;
    const label = idx.length > 1 ? `${idx[0] + 1}-${idx[1] + 1}` : `${idx[0] + 1}`;
    html += `<div class="pg-spread${single ? ' single' : ''}"><div class="pg-pair">${idx.map(i => pgThumb(pages[i], i + 1)).join('')}</div><span>${label}</span></div>`;
  };
  if (pages.length) row([0], true);
  for (let i = 1; i < pages.length; i += 2) row(i + 1 < pages.length ? [i, i + 1] : [i], false);
  box.innerHTML = html;
  box.scrollTop = keep;
  document.getElementById('pg-count').textContent = `${spreads} 스프레드의 ${pages.length} 페이지`;
  const hid = S.pageEdits?.hidden?.length || 0, rb = document.getElementById('pg-restore');
  rb.hidden = !hid;
  rb.textContent = `삭제한 쪽 되돌리기 (${hid})`;
  document.getElementById('pg-del').disabled = !pgSel;
  document.getElementById('pg-del2').disabled = !pgSel;
}
function pagePanelSoon() {
  clearTimeout(pgTimer);
  pgTimer = setTimeout(pgBuild, 350);
}
function pgSelect(pid, scroll) {
  pgSel = pid;
  framePage = pid;
  document.querySelectorAll('#pg-list .pg-page').forEach(b => b.classList.toggle('on', b.dataset.pid === pid));
  document.getElementById('pg-del').disabled = !pid;
  document.getElementById('pg-del2').disabled = !pid;
  if (!scroll) return;
  // 누른 쪽이 든 펼침면을 화면 위쪽에 맞추고, 어느 쪽인지 잠깐 테두리로 표시
  const page = document.querySelector(`#pages .page[data-pid="${CSS.escape(pid)}"]`);
  if (!page) return;
  page.closest('.spread')?.scrollIntoView({ block: 'start', inline: 'center' });
  page.classList.remove('pg-flash');
  void page.offsetWidth;
  page.classList.add('pg-flash');
  setTimeout(() => page.classList.remove('pg-flash'), 1300);
}
const pgCurrent = () => pgSel || framePage;
function pgAdd() {
  const d = pgData(), id = d.next++, after = pgCurrent() || pgPages().at(-1)?.dataset.pid;
  d.extra.push({ id, after });
  saveState();
  render();
  pgSelect(`free-${id}`, true);
  pagePanelSoon();
  pgNote('쪽이 하나 늘면 뒤쪽 페이지의 좌우가 바뀝니다. 짝수 쪽으로 맞춰 주세요.');
}
function pgDelete() {
  const pid = pgSel;
  if (!pid) return;
  if (pid.startsWith('memo-')) { pgNote('메모 쪽은 [4의 배수 쪽수로 맞추기]를 끄면 없어집니다.'); return; }
  const pages = pgPages(), at = pages.findIndex(p => p.dataset.pid === pid), next = pages[at + 1] || pages[at - 1];
  const d = pgData();
  d.hidden = [...new Set([...(d.hidden || []), pid])];
  if (frameSel?.pid === pid) frameSel = null;
  saveState();
  render();
  pgSel = next?.dataset.pid || null;
  pagePanelSoon();
  pgNote(/^gallery-/.test(pid) ? '이 쪽의 행사 사진도 함께 안 보입니다. [삭제한 쪽 되돌리기]로 살릴 수 있습니다.' : '쪽을 삭제했습니다. 사진은 보관되어 있어 [삭제한 쪽 되돌리기]로 살릴 수 있습니다.');
}
function pgRestore() {
  pgData().hidden = [];
  pgNote('');
  saveState();
  render();
  pagePanelSoon();
}
function pgNeedPage() {
  const pid = pgCurrent();
  if (!pid || !document.querySelector(`#pages .page[data-pid="${CSS.escape(pid)}"]`)) { pgNote('틀을 넣을 쪽을 먼저 누르세요.'); return null; }
  return pid;
}
function pgAddPhotoFrame() {
  const pid = pgNeedPage();
  if (!pid) return;
  const d = frameData(), id = d.next++;
  d.extra.push({ id, pid, cls: 'sy-ph', x: 25, y: 35, w: 50, h: 40 });
  saveState();
  applyFrames();
  frameSel = { key: `fx-${id}`, pid };
  syncFrameSel();
  pagePanelSoon();
  document.querySelector(`#pages .page[data-pid="${CSS.escape(pid)}"]`)?.closest('.sheet')?.scrollIntoView({ block: 'center', inline: 'center' });
  pgNote('사진틀을 넣었습니다. 두 번 눌러 사진을 넣으세요.');
}
function pgAddTextFrame() {
  const pid = pgNeedPage();
  if (!pid) return;
  const d = frameData(), id = d.next++, key = `xt-${id}`;
  (d.xtext ||= []).push({ id, pid });
  texts[key] = '글자를 입력하세요';
  textOver()[`${pid}|${key}`] = { x: 20, y: 25, w: 60, h: 6, font: { fs: 2.6, ff: "'Gowun Batang', serif", fw: '400', fst: 'normal', color: 'rgb(89, 69, 55)', ls: null, lh: 1.7, ta: 'center', tt: 'none', ws: 'pre-line' } };
  saveState();
  applyFrames();
  applyTextFrames();
  frameSel = { kind: 'text', key, pid };
  syncFrameSel();
  pagePanelSoon();
  const el = textElOf(pid, key);
  el?.closest('.sheet')?.scrollIntoView({ block: 'center', inline: 'center' });
  el?.focus();
  pgNote('글자틀을 넣었습니다. 바로 입력하세요.');
}
function bindPagePanel() {
  document.body.insertAdjacentHTML('beforeend', `<aside id="pg-panel" aria-label="페이지">
    <div class="pg-head"><b>페이지</b><button type="button" id="pg-hide" title="패널 접기">»</button></div>
    <div id="pg-list"></div>
    <p id="pg-note" role="status"></p>
    <div class="pg-tools"><button type="button" id="pg-ph">+ 사진틀</button><button type="button" id="pg-tx">+ 글자틀</button></div>
    <div class="pg-tools"><button type="button" id="pg-add2" title="고른 쪽 뒤에 새 쪽 추가">+ 페이지 추가</button><button type="button" id="pg-del2" class="pg-danger" title="고른 쪽 삭제 (Delete 키)" disabled>− 페이지 삭제</button></div>
    <button type="button" id="pg-restore" hidden></button>
    <div class="pg-foot"><span id="pg-count"></span><button type="button" id="pg-add" title="고른 쪽 뒤에 새 쪽 추가">＋</button><button type="button" id="pg-del" title="고른 쪽 삭제" disabled>🗑</button></div>
  </aside><button type="button" id="pg-show" hidden title="페이지 패널 열기">« 페이지</button>`);
  const panel = document.getElementById('pg-panel'), show = document.getElementById('pg-show');
  const setOpen = open => {
    panel.hidden = !open; show.hidden = open;
    document.body.classList.toggle('pg-open', open);
    try { localStorage.setItem('gradAlbum.pagePanel', open ? '1' : '0'); } catch { /* 저장 못 해도 동작 */ }
    if (open) pgBuild();
  };
  document.getElementById('pg-hide').addEventListener('click', () => setOpen(false));
  show.addEventListener('click', () => setOpen(true));
  document.getElementById('pg-list').addEventListener('click', e => { const b = e.target.closest('.pg-page'); if (b) pgSelect(b.dataset.pid, true); });
  document.getElementById('pg-add').addEventListener('click', pgAdd);
  document.getElementById('pg-del').addEventListener('click', pgDelete);
  document.getElementById('pg-add2').addEventListener('click', pgAdd);
  document.getElementById('pg-del2').addEventListener('click', pgDelete);
  // 썸네일 오른쪽 클릭 메뉴: 이 페이지 삭제 · 뒤에 새 페이지 추가
  document.body.insertAdjacentHTML('beforeend', '<div id="pg-menu" role="menu" hidden><button type="button" data-act="del">이 페이지 삭제</button><button type="button" data-act="add">뒤에 새 페이지 추가</button></div>');
  const menu = document.getElementById('pg-menu');
  document.getElementById('pg-list').addEventListener('contextmenu', e => {
    const b = e.target.closest('.pg-page');
    if (!b) return;
    e.preventDefault();
    pgSelect(b.dataset.pid, true);
    menu.hidden = false;
    menu.style.left = `${Math.min(e.clientX, innerWidth - menu.offsetWidth - 6)}px`;
    menu.style.top = `${Math.min(e.clientY, innerHeight - menu.offsetHeight - 6)}px`;
  });
  menu.addEventListener('click', e => { const a = e.target.closest('button')?.dataset.act; menu.hidden = true; if (a === 'del') pgDelete(); else if (a === 'add') pgAdd(); });
  // 페이지 패널에서 쪽을 고른 뒤 Delete(또는 Backspace) 키로 삭제
  let panelFocus = false;
  addEventListener('pointerdown', e => {
    panelFocus = !!e.target.closest?.('#pg-list');
    if (!e.target.closest?.('#pg-menu')) menu.hidden = true;
  }, true);
  addEventListener('keydown', e => {
    if (e.key === 'Escape') menu.hidden = true;
    if (!panelFocus || !pgSel || !(e.key === 'Delete' || e.key === 'Backspace')) return;
    if (e.target.closest?.('input,textarea,select,[contenteditable]') || document.querySelector('dialog[open]')) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    pgDelete();
  }, true);
  document.getElementById('pg-restore').addEventListener('click', pgRestore);
  document.getElementById('pg-ph').addEventListener('click', pgAddPhotoFrame);
  document.getElementById('pg-tx').addEventListener('click', pgAddTextFrame);
  let open = true;
  try { open = localStorage.getItem('gradAlbum.pagePanel') !== '0'; } catch { /* 기본값 */ }
  setOpen(open);
}
bindPagePanel();
