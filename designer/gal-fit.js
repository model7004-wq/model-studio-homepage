/* 행사 갤러리: 머리 제목(Gallery · 행사 이름)을 지워서 위가 비면 사진 줄을 그만큼 키워 쪽을 채움.
   줄 높이는 쪽을 그릴 때 정해지므로(layout-v2.js), 갤러리 칸이 실제로 커지면 줄마다 같은 비율로 늘림 (최대 1.4배).
   제목을 되살리면 원래 높이로 돌아감 */
(() => {
  const MAX = 1.4;
  function fit(g) {
    const rows = [...g.querySelectorAll(':scope > .gal-row')], trim = g.closest('.trim');
    if (!rows.length || !trim || !trim.clientWidth) return;
    for (const r of rows) if (!r.dataset.h0) r.dataset.h0 = parseFloat(r.style.height) || 0;
    const cq = trim.clientWidth / 100, gap = parseFloat(getComputedStyle(g).rowGap) || 0;
    const sum0 = rows.reduce((s, r) => s + +r.dataset.h0, 0) * cq;
    if (!sum0) return;
    let k = (g.clientHeight - gap * (rows.length - 1)) / sum0;
    k = k > 1.01 ? Math.min(MAX, k) : 1;
    if (Math.abs(k - (+g.dataset.k || 1)) < .002) return;
    g.dataset.k = k;
    for (const r of rows) r.style.height = `${(+r.dataset.h0 * k).toFixed(2)}cqw`;
    g.querySelectorAll('.photo').forEach(p => { try { applyPhoto(p); } catch { /* 빈 칸 */ } });
  }
  const ro = new ResizeObserver(es => es.forEach(e => fit(e.target)));
  let t = null;
  // 쪽을 새로 그리거나 글자를 지우면(class 바뀜) 모든 갤러리를 다시 맞춤. 창 크기가 바뀌면 ResizeObserver가 맞춤
  const watch = () => { clearTimeout(t); t = setTimeout(() => document.querySelectorAll('#pages .gallery.flow').forEach(g => { if (!g.dataset.gf) { g.dataset.gf = '1'; ro.observe(g); } fit(g); }), 80); };
  const pages = document.getElementById('pages');
  if (pages) new MutationObserver(watch).observe(pages, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  watch();
})();
