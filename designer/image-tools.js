/* 이미지 도구: 고해상도(AI 확대) · 벡터 변환 · 계절 색 바꾸기.
   모두 이 브라우저 안에서만 처리하며 사진을 밖으로 보내지 않음 (라이브러리와 모델 파일만 CDN에서 받음).
   처음 고치는 순간 원본을 'orig--키'로 보관하므로 언제든 되돌릴 수 있고, 앨범 파일에도 함께 저장됨. */
const IT_CDN = 'https://cdn.jsdelivr.net/npm';
const IT_MAX_SEASON = 5000;
const itOrigKey = key => `orig--${key}`;
let itState = null, itUpscalers = {};

async function itLoadUpscaler(scale) {
  await prjLoadScript('tf', `${IT_CDN}/@tensorflow/tfjs@4.22.0/dist/tf.min.js`);
  await prjLoadScript('Upscaler', `${IT_CDN}/upscaler@1.0.0/dist/browser/umd/upscaler.min.js`);
  const name = `ESRGANMedium${scale}x`;
  await prjLoadScript(name, `${IT_CDN}/@upscalerjs/esrgan-medium@1.0.0/dist/umd/models/esrgan-medium/src/x${scale}/index.min.js`);
  return (itUpscalers[scale] ||= new Upscaler({ model: window[name] }));
}
async function itToCanvas(blob, maxSide = Infinity) {
  const url = URL.createObjectURL(blob), im = new Image();
  im.src = url;
  await im.decode();
  const k = Math.min(1, maxSide / Math.max(im.naturalWidth, im.naturalHeight));
  const cv = document.createElement('canvas');
  cv.width = Math.round(im.naturalWidth * k); cv.height = Math.round(im.naturalHeight * k);
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
  g.imageSmoothingQuality = 'high';
  g.drawImage(im, 0, 0, cv.width, cv.height);
  URL.revokeObjectURL(url);
  return cv;
}
const itBlob = (cv, type = 'image/jpeg', q = .94) => new Promise(res => cv.toBlob(res, type, q));

/* ---------- 고해상도 ---------- */
async function itUpscale(blob, scale, onProgress) {
  const up = await itLoadUpscaler(scale), cv = await itToCanvas(blob);
  const limit = scale === 4 ? 1400 : 2800;
  if (Math.max(cv.width, cv.height) > limit) throw new Error(`이 사진은 이미 큽니다(긴 변 ${Math.max(cv.width, cv.height)}px). ${scale}배는 긴 변 ${limit}px 이하에서 쓸 수 있습니다.`);
  const src = await up.upscale(cv, { patchSize: 64, padding: 4, progress: onProgress });
  const im = new Image();
  im.src = src;
  await im.decode();
  const out = document.createElement('canvas');
  out.width = im.naturalWidth; out.height = im.naturalHeight;
  out.getContext('2d').drawImage(im, 0, 0);
  const png = blob.type === 'image/png';
  return { blob: await itBlob(out, png ? 'image/png' : 'image/jpeg', .95), w: out.width, h: out.height };
}

/* ---------- 벡터 ---------- */
const IT_VECTOR = {
  bw: { numberofcolors: 2, colorsampling: 0, ltres: .4, qtres: .4, pathomit: 3, strokewidth: 0, blurradius: 0, roundcoords: 1, pal: [{ r: 0, g: 0, b: 0, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }] },
  logo: { numberofcolors: 8, colorsampling: 2, colorquantcycles: 4, ltres: .5, qtres: .5, pathomit: 6, strokewidth: 1, blurradius: 1, blurdelta: 20, roundcoords: 1 },
  color: { numberofcolors: 24, colorsampling: 2, colorquantcycles: 3, ltres: .8, qtres: .8, pathomit: 10, strokewidth: 1, blurradius: 2, blurdelta: 30, roundcoords: 1 },
};
async function itVectorize(blob, mode) {
  await prjLoadScript('ImageTracer', `${IT_CDN}/imagetracerjs@1.2.6/imagetracer_v1.2.6.js`);
  const src = await itToCanvas(blob);
  // 작은 그림은 먼저 키워서 따야 윤곽이 매끄러움. 너무 크면 오래 걸려서 제한.
  const long = Math.max(src.width, src.height), k = long < 1600 ? 1600 / long : Math.min(1, 2400 / long);
  const cv = document.createElement('canvas');
  cv.width = Math.round(src.width * k); cv.height = Math.round(src.height * k);
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, cv.width, cv.height);
  const img = g.getImageData(0, 0, cv.width, cv.height);
  if (mode === 'bw') {
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) < 150 ? 0 : 255; d[i] = d[i + 1] = d[i + 2] = v; }
  }
  await new Promise(r => setTimeout(r, 30));   // 화면에 '변환 중'이 먼저 보이도록
  const svg = ImageTracer.imagedataToSVG(img, { ...IT_VECTOR[mode] });
  return { blob: new Blob([svg], { type: 'image/svg+xml' }), w: cv.width, h: cv.height, svg: true };
}

/* ---------- 계절 (색 바꾸기): 초록 잎 · 풀과 하늘의 색만 바꾸고 건물과 사람의 피부는 그대로 ---------- */
function itNoise(W, H, cells, seed) {
  let s = seed;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const nx = Math.max(2, cells), ny = Math.max(2, Math.round(cells * H / W));
  const c = document.createElement('canvas');
  c.width = nx; c.height = ny;
  const g = c.getContext('2d'), id = g.createImageData(nx, ny);
  for (let i = 0; i < id.data.length; i += 4) { id.data[i] = id.data[i + 1] = id.data[i + 2] = rnd() * 255; id.data[i + 3] = 255; }
  g.putImageData(id, 0, 0);
  const o = document.createElement('canvas');
  o.width = W; o.height = H;
  const og = o.getContext('2d', { willReadFrequently: true });
  og.imageSmoothingEnabled = true; og.imageSmoothingQuality = 'high';
  og.drawImage(c, 0, 0, W, H);
  return og.getImageData(0, 0, W, H).data;
}
const itSmooth = (v, a, b) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
function itSeason(cv, season, amt) {
  const W = cv.width, H = cv.height, g = cv.getContext('2d', { willReadFrequently: true });
  const id = g.getImageData(0, 0, W, H), d = id.data;
  const n1 = itNoise(W, H, 22, 11), n2 = itNoise(W, H, 90, 29), n3 = itNoise(W, H, 260, 53);
  const out = [0, 0, 0];
  const hsv2rgb = (h, s, v) => {
    const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
    const [r, gg, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    out[0] = (r + m) * 255; out[1] = (gg + m) * 255; out[2] = (b + m) * 255;
  };
  for (let y = 0, i = 0; y < H; y++) {
    const fy = y / H;
    for (let x = 0; x < W; x++, i += 4) {
      const R = d[i], G = d[i + 1], B = d[i + 2], r = R / 255, gr = G / 255, b = B / 255;
      const mx = Math.max(r, gr, b), mn = Math.min(r, gr, b), dl = mx - mn, v = mx, s = mx ? dl / mx : 0;
      let h = 0;
      if (dl) { h = mx === r ? ((gr - b) / dl) % 6 : mx === gr ? (b - r) / dl + 2 : (r - gr) / dl + 4; h *= 60; if (h < 0) h += 360; }
      const leaf = itSmooth(h, 48, 72) * (1 - itSmooth(h, 160, 185)) * itSmooth(s, .1, .28) * itSmooth(v, .06, .2);
      const skyB = itSmooth(h, 185, 200) * (1 - itSmooth(h, 245, 265)) * itSmooth(s, .05, .2) * itSmooth(v, .4, .65);
      const skyW = itSmooth(v, .82, .95) * (1 - itSmooth(s, .08, .2));
      const sky = Math.max(skyB, skyW) * (1 - itSmooth(fy, .42, .68));
      const grass = leaf * itSmooth(fy, .5, .78);
      const a = n1[i] / 255, c = n2[i] / 255, e = n3[i] / 255;
      let tr = R, tg = G, tb = B, w = Math.max(leaf, sky);
      if (season === 'autumn') {
        if (leaf > 0) {
          const hh = grass > .5 ? 38 + 10 * c : 4 + 44 * (a * .7 + c * .3);
          hsv2rgb(hh, Math.min(1, (grass > .5 ? s * .75 : s * 1.15 + .12)), Math.min(1, v * (.9 + .25 * c)));
          tr = out[0]; tg = out[1]; tb = out[2];
        } else if (sky > 0) { tr = R * 1.02; tg = G * .99; tb = B * .95; }
      } else if (season === 'winter') {
        if (leaf > 0) {
          const snow = .55 + .45 * Math.min(1, c * .6 + e * .6);
          const nv = Math.min(1, v * .5 + .5 * snow);
          hsv2rgb(210, s * .1, nv);
          tr = out[0]; tg = out[1]; tb = out[2];
        } else if (sky > 0) {
          hsv2rgb(212, s * .4, Math.min(1, v * .9 + .1));
          tr = out[0]; tg = out[1]; tb = out[2];
        } else {             // 그 밖은 차갑고 차분하게
          const gray = R * .3 + G * .59 + B * .11;
          tr = gray + (R - gray) * .72; tg = gray + (G - gray) * .72; tb = (gray + (B - gray) * .72) * 1.05 + 4;
          w = .75;
        }
      } else if (season === 'spring') {
        if (leaf > 0) {
          const hh = 76 + 26 * a;
          const bloom = grass < .4 ? itSmooth(c * .55 + e * .45, .58, .68) : 0;
          hsv2rgb(hh, s * .82, Math.min(1, v * 1.12 + .04));
          tr = out[0]; tg = out[1]; tb = out[2];
          if (bloom > 0) { hsv2rgb(342, .3 + .12 * e, Math.min(1, .78 + v * .28)); tr += (out[0] - tr) * bloom; tg += (out[1] - tg) * bloom; tb += (out[2] - tb) * bloom; }
        } else if (sky > 0) { tr = Math.min(255, R * 1.03 + 3); tg = Math.min(255, G * 1.03 + 3); tb = Math.min(255, B * 1.03 + 3); }
      } else if (season === 'summer') {
        if (leaf > 0) {
          hsv2rgb(104 + 26 * a, Math.min(1, s * 1.3 + .05), v * .97);
          tr = out[0]; tg = out[1]; tb = out[2];
        } else if (sky > 0) {
          hsv2rgb(208, Math.max(s * 1.35, skyB > .3 ? .42 : s + .22), Math.min(1, v));
          tr = out[0]; tg = out[1]; tb = out[2];
        }
      }
      const k = w * amt;
      d[i] = R + (tr - R) * k; d[i + 1] = G + (tg - G) * k; d[i + 2] = B + (tb - B) * k;
    }
  }
  g.putImageData(id, 0, 0);
  if (season === 'winter' && amt > .4) {        // 내리는 눈
    let s = 77;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const n = Math.round(W * H / 5500 * amt), base = Math.max(1, W / 900);
    g.fillStyle = '#fff';
    for (let k = 0; k < n; k++) {
      g.globalAlpha = .35 + rnd() * .55;
      g.beginPath();
      g.arc(rnd() * W, rnd() * H, base * (.5 + rnd() * rnd() * 2.2), 0, 7);
      g.fill();
    }
    g.globalAlpha = 1;
  }
  return cv;
}

/* ---------- 앨범에 반영 ---------- */
async function itReplace(key, res) {
  const p = photos[key];
  if (!p) return;
  const ok = itOrigKey(key);
  if (!photos[ok]) {
    photos[ok] = { blob: p.blob, w: p.w, h: p.h, x: p.x, y: p.y, z: p.z, url: p.url };
    await DB.put(ok, { blob: p.blob, w: p.w, h: p.h, x: p.x, y: p.y, z: p.z });
  } else URL.revokeObjectURL(p.url);
  Object.assign(p, { blob: res.blob, w: res.w, h: res.h, url: URL.createObjectURL(res.blob) });
  if (res.svg) p.solo = false;     // 벡터는 인물 확인 대상이 아님
  await DB.put(key, recOf(p));
  applyKey(key);
}
async function itRestore(key) {
  const ok = itOrigKey(key), o = photos[ok], p = photos[key];
  if (!o || !p) return;
  URL.revokeObjectURL(p.url);
  Object.assign(p, { blob: o.blob, w: o.w, h: o.h, x: o.x ?? p.x, y: o.y ?? p.y, z: o.z ?? p.z, url: o.url || URL.createObjectURL(o.blob) });
  delete photos[ok];
  await DB.drop(ok);
  await DB.put(key, recOf(p));
  applyKey(key);
}

/* ---------- 사진 편집실: 업무노트의 편집 화면을 그대로 씀 ----------
   photo-editor.html은 worknote/index.html의 복사본(build-web.sh가 만듦). 직원 기록 저장소에 연결되지 않아 사진만 오감.
   같은 사이트라서 열린 틀 안에 연결 코드를 넣어 편집 결과를 받음. 결과는 원본 크기(긴 변 5000px까지)로 다시 계산 */
const ROOM_BRIDGE = `document.head.insertAdjacentHTML('beforeend','<style>#edTabs [data-v=save]{display:none}</style>');
window.__albumRoom=async function(blob,name,onApply,onClose){
  await openEditor(new Blob([blob],{type:blob.type}),name,null);
  if(!E.bm){onClose();return false}
  const top=document.querySelector('#ed .ed-top');
  const btn=document.createElement('button');btn.textContent='앨범에 적용';btn.id='edAlbumApply';
  btn.style.cssText='background:#8faae8;color:#14213d;font-weight:700;border:0;border-radius:6px;padding:6px 14px;margin-left:8px;cursor:pointer';
  btn.onclick=async ev=>{ev.stopPropagation();btn.disabled=true;btn.textContent='적용하는 중…';await new Promise(r=>setTimeout(r,30));
    try{const c=edRender(scaleTo(E.bm,${5000}),E.st),b=await toBlob(c,'image/jpeg',.95);await onApply(b,c.width,c.height);E.armClose=false;edClose()}
    catch(e){console.warn(e);btn.disabled=false;btn.textContent='앨범에 적용';toast('적용하지 못했어요')}};
  top.appendChild(btn);
  const mo=new MutationObserver(()=>{if(!document.querySelector('#ed')){mo.disconnect();onClose()}});
  mo.observe(document.body,{childList:true});
  return true;
};`;
let roomFrame = null;
function roomLoad() {
  if (roomFrame) return roomFrame;
  const f = document.createElement('iframe');
  f.id = 'photo-room';
  f.title = '사진 편집실';
  f.hidden = true;
  f.src = 'photo-editor.html';
  roomFrame = new Promise((res, rej) => {
    f.onload = () => {
      try { f.contentWindow.eval(ROOM_BRIDGE); res(f); } catch (e) { roomFrame = null; f.remove(); rej(e); }
    };
    f.onerror = () => { roomFrame = null; f.remove(); rej(new Error('사진 편집실을 열지 못했습니다.')); };
  });
  document.body.appendChild(f);
  return roomFrame;
}
async function openPhotoRoom(key) {
  const p = photos[key];
  if (!p) return;
  if (p.blob.type.includes('svg')) { frameNote('벡터 사진은 사진 편집실에서 열 수 없습니다. 이미지 도구에서 처음 사진으로 되돌린 뒤 편집하세요.'); return; }
  frameNote('사진 편집실을 여는 중입니다…');
  let f;
  try { f = await roomLoad(); } catch (e) { console.warn(e); frameNote('사진 편집실을 열지 못했습니다. 인터넷 연결을 확인하세요.'); return; }
  f.hidden = false;
  frameNote('');
  const opened = await f.contentWindow.__albumRoom(p.blob, key,
    async (blob, w, h) => { await itReplace(key, { blob, w, h }); },
    () => { f.hidden = true; syncFrameSel(); });
  if (!opened) { f.hidden = true; frameNote('이 사진은 사진 편집실에서 열 수 없습니다.'); }
}

/* ---------- 대화상자 ---------- */
function itDialog() {
  let d = document.getElementById('it-dlg');
  if (d) return d;
  document.body.insertAdjacentHTML('beforeend', `<dialog id="it-dlg" class="it">
    <h3>이미지 도구 <small id="it-info"></small></h3>
    <div class="it-view"><figure><figcaption>지금</figcaption><img id="it-a" alt=""></figure><figure><figcaption id="it-bcap">결과</figcaption><img id="it-b" alt=""></figure></div>
    <div class="it-rows">
      <div><b>고해상도</b><button data-up="2">2배</button><button data-up="4">4배</button><span>AI가 윤곽을 다듬어 키웁니다. 없던 부분을 추정하므로 <b>얼굴·글자는 꼭 확인</b>하세요.</span></div>
      <div><b>벡터</b><button data-vec="bw">흑백 (악보·글자)</button><button data-vec="logo">로고 (8색)</button><button data-vec="color">색 많게</button><span>확대해도 깨지지 않습니다. 사진에는 맞지 않습니다.</span></div>
      <div><b>계절</b><button data-sea="spring">봄</button><button data-sea="summer">여름</button><button data-sea="autumn">가을</button><button data-sea="winter">겨울</button><label>강도 <input id="it-amt" type="range" min="20" max="100" value="85"></label><span>풀과 잎, 하늘의 색만 바꿉니다. 나무 모양은 그대로이고 초록 옷도 함께 바뀝니다.</span></div>
    </div>
    <p id="it-status" role="status"></p>
    <div class="it-foot"><button id="it-restore" class="ghost">처음 사진으로 되돌리기</button><button id="it-svg" class="ghost" hidden>SVG 파일로 받기</button><span></span><button id="it-close" class="ghost">닫기</button><button id="it-apply" class="pri" disabled>적용</button></div>
  </dialog>`);
  d = document.getElementById('it-dlg');
  const status = t => { d.querySelector('#it-status').textContent = t; };
  const busy = on => d.querySelectorAll('button,input').forEach(b => { b.disabled = on; if (!on) { d.querySelector('#it-apply').disabled = !itState?.result; d.querySelector('#it-restore').disabled = !photos[itOrigKey(itState?.key)]; } });
  const show = (res, cap) => {
    const b = d.querySelector('#it-b');
    if (b.src.startsWith('blob:')) URL.revokeObjectURL(b.src);
    b.src = URL.createObjectURL(res.blob);
    d.querySelector('#it-bcap').textContent = cap;
    itState.result = res;
    d.querySelector('#it-svg').hidden = !res.svg;
  };
  const kb = n => (n > 1048576 ? `${(n / 1048576).toFixed(1)}MB` : `${Math.round(n / 1024)}KB`);
  const run = async (label, job) => {
    busy(true);
    status(`${label} 중… 사진 크기에 따라 시간이 걸릴 수 있습니다.`);
    try { await job(); status(''); } catch (e) { console.warn(e); status(e.message || '처리하지 못했습니다.'); }
    busy(false);
  };
  let seasonNow = null;
  const previewSeason = sea => run('계절 미리보기', async () => {
    const base = photos[itOrigKey(itState.key)]?.blob || photos[itState.key].blob, amt = d.querySelector('#it-amt').value / 100;
    const cv = itSeason(await itToCanvas(base, 1100), sea, amt);
    seasonNow = sea;
    show({ blob: await itBlob(cv), season: sea, amt }, `결과: ${{ spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' }[sea]} (미리보기)`);
  });
  d.addEventListener('click', e => {
    const t = e.target;
    if (t.dataset.up) run(`${t.dataset.up}배 확대`, async () => {
      seasonNow = null;
      const res = await itUpscale(photos[itState.key].blob, +t.dataset.up, p => status(`${t.dataset.up}배 확대 중… ${Math.round(p * 100)}%`));
      show(res, `결과: ${res.w}×${res.h}px (${kb(res.blob.size)})`);
    });
    if (t.dataset.vec) run('벡터 변환', async () => {
      seasonNow = null;
      const res = await itVectorize(photos[itState.key].blob, t.dataset.vec);
      show(res, `결과: 벡터 SVG (${kb(res.blob.size)})`);
    });
    if (t.dataset.sea) previewSeason(t.dataset.sea);
  });
  d.querySelector('#it-amt').addEventListener('change', () => { if (seasonNow) previewSeason(seasonNow); });
  d.querySelector('#it-svg').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(itState.result.blob);
    a.download = `${itState.key}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  d.querySelector('#it-apply').addEventListener('click', () => run('적용', async () => {
    let res = itState.result;
    if (res.season) {        // 미리보기는 작게 만들었으므로 적용할 때 큰 크기로 다시 만듦
      const base = photos[itOrigKey(itState.key)]?.blob || photos[itState.key].blob;
      const cv = itSeason(await itToCanvas(base, IT_MAX_SEASON), res.season, res.amt);
      res = { blob: await itBlob(cv, 'image/jpeg', .93), w: cv.width, h: cv.height };
    }
    await itReplace(itState.key, res);
    itState.result = null;
    d.close();
  }));
  d.querySelector('#it-restore').addEventListener('click', () => run('되돌리기', async () => { await itRestore(itState.key); itState.result = null; d.close(); }));
  d.querySelector('#it-close').addEventListener('click', () => d.close());
  return d;
}
function openImageTools(key) {
  const p = photos[key];
  if (!p) return;
  const d = itDialog();
  itState = { key, result: null };
  d.querySelector('#it-a').src = p.url;
  d.querySelector('#it-b').removeAttribute('src');
  d.querySelector('#it-bcap').textContent = '결과';
  d.querySelector('#it-svg').hidden = true;
  d.querySelector('#it-status').textContent = '';
  d.querySelector('#it-apply').disabled = true;
  d.querySelector('#it-restore').disabled = !photos[itOrigKey(key)];
  const el = document.querySelector(`.photo[data-photo="${CSS.escape(key)}"]`), badge = el?.querySelector('.badge')?.textContent;
  d.querySelector('#it-info').textContent = p.blob.type.includes('svg') ? '벡터 사진' : `${p.w}×${p.h}px${badge ? ` · ${badge}` : ''}`;
  d.showModal();
}
