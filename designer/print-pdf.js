/* 인쇄용 PDF 저장: 더블유기획 천상영 사전 설정을 고정해서 저장
   - Acrobat 5 (PDF 1.4), 쪽마다 한 장(스프레드 아님)
   - 600ppi, JPEG 최대 품질, 재단선 0.25pt · 오프셋 3mm · 페이지 정보, 도련 3mm
   - 색: sRGB → Japan Color 2001 Coated (CMYK), 프로파일 포함 안 함
   쪽을 이미지로 그려 넣으므로 글자는 벡터가 아니라 600ppi 이미지가 됨. 태그 · 웹 최적화는 하지 않음.
   파일을 조각(Blob)으로 이어 쓰기 때문에 쪽이 많아도 메모리에 전체를 올리지 않음. */
const PP_LCMS = 'https://cdn.jsdelivr.net/npm/lcms-wasm@1.0.5/dist/lcms.js';
const PP_MM = 72 / 25.4, PP_BLEED = 3 * PP_MM, PP_OFFSET = 3 * PP_MM, PP_MARK = 5 * PP_MM, PP_MARGIN = PP_OFFSET + PP_MARK + 1.5, PP_LINE = .25, PP_JPEG_Q = 98;
let ppProfile = null, ppLcms = null, ppTransform = null, ppCancel = false;

/* ---------- CMYK JPEG 인코더 (작업자 스레드, Adobe 방식: 잉크 값을 뒤집어 저장) ---------- */
const PP_WORKER = `
const ZZ=[0,1,8,16,9,2,3,10,17,24,32,25,18,11,4,5,12,19,26,33,40,48,41,34,27,20,13,6,7,14,21,28,35,42,49,56,57,50,43,36,29,22,15,23,30,37,44,51,58,59,52,45,38,31,39,46,53,60,61,54,47,55,62,63];
const QB=[16,11,10,16,24,40,51,61,12,12,14,19,26,58,60,55,14,13,16,24,40,57,69,56,14,17,22,29,51,87,80,62,18,22,37,56,68,109,103,77,24,35,55,64,81,104,113,92,49,64,78,87,103,121,120,101,72,92,95,98,112,100,103,99];
const DCB=[0,0,1,5,1,1,1,1,1,1,0,0,0,0,0,0,0],DCV=[0,1,2,3,4,5,6,7,8,9,10,11];
const ACB=[0,2,1,3,3,2,4,3,5,5,4,4,0,0,1,0x7d];
const ACV=[1,2,3,0,4,17,5,18,33,49,65,6,19,81,97,7,34,113,20,50,129,145,161,8,35,66,177,193,21,82,209,240,36,51,98,114,130,9,10,22,23,24,25,26,37,38,39,40,41,42,52,53,54,55,56,57,58,67,68,69,70,71,72,73,74,83,84,85,86,87,88,89,90,99,100,101,102,103,104,105,106,115,116,117,118,119,120,121,122,131,132,133,134,135,136,137,138,146,147,148,149,150,151,152,153,154,162,163,164,165,166,167,168,169,170,178,179,180,181,182,183,184,185,186,194,195,196,197,198,199,200,201,202,210,211,212,213,214,215,216,217,218,225,226,227,228,229,230,231,232,233,234,241,242,243,244,245,246,247,248,249,250];
function huff(b,v){const c={},s={};let code=0,k=0;for(let i=1;i<=16;i++){for(let j=0;j<b[i];j++){c[v[k]]=code;s[v[k]]=i;code++;k++}code<<=1}return{c,s}}
const HDC=huff(DCB,DCV),HAC=huff([0].concat(ACB.slice(0,16)),ACV);
self.onmessage=e=>{const{w,h,cmyk,q}=e.data;
 const scale=q<50?5000/q:200-2*q,Q=QB.map(v=>Math.max(1,Math.min(255,Math.floor((v*scale+50)/100))));
 const fdq=new Float64Array(64),A=[1,1.387039845,1.306562965,1.175875602,1,.785694958,.541196100,.275899379];
 for(let r=0,i=0;r<8;r++)for(let c=0;c<8;c++,i++)fdq[i]=1/(Q[i]*A[r]*A[c]*8);
 let cap=Math.max(1<<20,Math.round(w*h*.9)),out=new Uint8Array(cap),p=0;
 const need=n=>{if(p+n>cap){cap=Math.ceil(cap*1.6)+n;const o=new Uint8Array(cap);o.set(out.subarray(0,p));out=o}};
 const w8=b=>{need(1);out[p++]=b},w16=v=>{need(2);out[p++]=v>>8;out[p++]=v&255};
 w16(0xFFD8);w16(0xFFEE);w16(14);for(const c of 'Adobe')w8(c.charCodeAt(0));w16(100);w16(0);w16(0);w8(0);
 w16(0xFFDB);w16(67);w8(0);for(let i=0;i<64;i++)w8(Q[ZZ[i]]);
 w16(0xFFC0);w16(20);w8(8);w16(h);w16(w);w8(4);for(let i=1;i<=4;i++){w8(i);w8(0x11);w8(0)}
 w16(0xFFC4);w16(19+DCV.length);w8(0);for(let i=1;i<=16;i++)w8(DCB[i]);for(const v of DCV)w8(v);
 w16(0xFFC4);w16(19+ACV.length);w8(0x10);for(const v of ACB)w8(v);for(const v of ACV)w8(v);
 w16(0xFFDA);w16(14);w8(4);for(let i=1;i<=4;i++){w8(i);w8(0)}w8(0);w8(63);w8(0);
 let acc=0,nb=0;const put=(code,len)=>{acc=(acc<<len)|code;nb+=len;while(nb>=8){const b=(acc>>(nb-8))&255;need(2);out[p++]=b;if(b===255)out[p++]=0;nb-=8}acc&=(1<<nb)-1};
 const cat=v=>{v=v<0?-v:v;let n=0;while(v){n++;v>>=1}return n};
 const B=new Float64Array(64),pred=[0,0,0,0];
 for(let my=0;my<h;my+=8){for(let mx=0;mx<w;mx+=8){for(let ch=0;ch<4;ch++){
   for(let y=0;y<8;y++){const yy=Math.min(h-1,my+y);for(let x=0;x<8;x++){const xx=Math.min(w-1,mx+x);B[y*8+x]=(255-cmyk[(yy*w+xx)*4+ch])-128}}
   for(let i=0;i<8;i++){const o=i*8,a0=B[o]+B[o+7],a7=B[o]-B[o+7],a1=B[o+1]+B[o+6],a6=B[o+1]-B[o+6],a2=B[o+2]+B[o+5],a5=B[o+2]-B[o+5],a3=B[o+3]+B[o+4],a4=B[o+3]-B[o+4];let t0=a0+a3,t3=a0-a3,t1=a1+a2,t2=a1-a2;B[o]=t0+t1;B[o+4]=t0-t1;const z1=(t2+t3)*.707106781;B[o+2]=t3+z1;B[o+6]=t3-z1;t0=a4+a5;t1=a5+a6;t2=a6+a7;const z5=(t0-t2)*.382683433,z2=.541196100*t0+z5,z4=1.306562965*t2+z5,z3=t1*.707106781,z11=a7+z3,z13=a7-z3;B[o+5]=z13+z2;B[o+3]=z13-z2;B[o+1]=z11+z4;B[o+7]=z11-z4}
   for(let i=0;i<8;i++){const a0=B[i]+B[56+i],a7=B[i]-B[56+i],a1=B[8+i]+B[48+i],a6=B[8+i]-B[48+i],a2=B[16+i]+B[40+i],a5=B[16+i]-B[40+i],a3=B[24+i]+B[32+i],a4=B[24+i]-B[32+i];let t0=a0+a3,t3=a0-a3,t1=a1+a2,t2=a1-a2;B[i]=t0+t1;B[32+i]=t0-t1;const z1=(t2+t3)*.707106781;B[16+i]=t3+z1;B[48+i]=t3-z1;t0=a4+a5;t1=a5+a6;t2=a6+a7;const z5=(t0-t2)*.382683433,z2=.541196100*t0+z5,z4=1.306562965*t2+z5,z3=t1*.707106781,z11=a7+z3,z13=a7-z3;B[40+i]=z13+z2;B[24+i]=z13-z2;B[8+i]=z11+z4;B[56+i]=z11-z4}
   const dc=Math.round(B[0]*fdq[0]),d=dc-pred[ch];pred[ch]=dc;const dcCat=cat(d);put(HDC.c[dcCat],HDC.s[dcCat]);if(dcCat)put(d<0?d+(1<<dcCat)-1:d,dcCat);
   let run=0;for(let k=1;k<64;k++){const z=ZZ[k],v=Math.round(B[z]*fdq[z]);if(!v){run++;continue}while(run>15){put(HAC.c[0xF0],HAC.s[0xF0]);run-=16}const c=cat(v),sym=(run<<4)|c;put(HAC.c[sym],HAC.s[sym]);put(v<0?v+(1<<c)-1:v,c);run=0}
   if(run)put(HAC.c[0],HAC.s[0]);
 }}self.postMessage({progress:Math.min(1,(my+8)/h)})}
 if(nb)put((1<<(8-nb))-1,8-nb);need(2);out[p++]=0xFF;out[p++]=0xD9;
 const res=out.slice(0,p);self.postMessage({done:true,jpeg:res},[res.buffer]);
};`;
let ppWorkerUrl = null;
function ppEncode(w, h, cmyk, onProgress) {
  ppWorkerUrl ||= URL.createObjectURL(new Blob([PP_WORKER], { type: 'text/javascript' }));
  const wk = new Worker(ppWorkerUrl);
  return new Promise((res, rej) => {
    wk.onmessage = e => { if (e.data.done) { wk.terminate(); res(e.data.jpeg); } else onProgress?.(e.data.progress); };
    wk.onerror = e => { wk.terminate(); rej(new Error(e.message || 'JPEG 변환 실패')); };
    wk.postMessage({ w, h, cmyk, q: PP_JPEG_Q }, [cmyk.buffer]);
  });
}

/* ---------- 색 변환 ---------- */
async function ppLoadProfile() {
  if (ppProfile) return ppProfile;
  try {
    const r = await fetch('JapanColor2001Coated.icc');
    if (r.ok) { const b = new Uint8Array(await r.arrayBuffer()); if (b.length > 100000) ppProfile = b; }
  } catch { /* 없으면 사용자가 고름 */ }
  return ppProfile;
}
async function ppInitColor() {
  if (ppTransform) return;
  if (!ppProfile) throw new Error('색상 프로파일이 없습니다.');
  const m = await import(PP_LCMS);
  ppLcms = await m.instantiate();
  const src = ppLcms.cmsCreate_sRGBProfile(), dst = ppLcms.cmsOpenProfileFromMem(ppProfile, ppProfile.length);
  if (!dst) throw new Error('색상 프로파일을 읽지 못했습니다.');
  ppTransform = ppLcms.cmsCreateTransform(src, m.TYPE_RGB_8, dst, m.TYPE_CMYK_8, m.INTENT_RELATIVE_COLORIMETRIC, m.cmsFLAGS_BLACKPOINTCOMPENSATION ?? 0x2000);
  if (!ppTransform) throw new Error('색 변환을 준비하지 못했습니다.');
}
async function ppToCmyk(cv, onProgress) {
  const w = cv.width, h = cv.height, g = cv.getContext('2d', { willReadFrequently: true }), out = new Uint8Array(w * h * 4), band = 256;
  for (let y = 0; y < h; y += band) {
    const n = Math.min(band, h - y), rgba = g.getImageData(0, y, w, n).data, count = w * n, rgb = new Uint8Array(count * 3);
    for (let i = 0, a = 0, b = 0; i < count; i++, a += 4, b += 3) { rgb[b] = rgba[a]; rgb[b + 1] = rgba[a + 1]; rgb[b + 2] = rgba[a + 2]; }
    out.set(ppLcms.cmsDoTransform(ppTransform, rgb, count), y * w * 4);
    onProgress?.((y + n) / h);
    if (y % (band * 8) === 0) await new Promise(r => setTimeout(r));
    if (ppCancel) throw new Error('취소했습니다.');
  }
  return out;
}

/* ---------- PDF 조립 ---------- */
class PPWriter {
  constructor() { this.parts = []; this.pos = 0; this.xref = [0]; this.enc = new TextEncoder(); this.add('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', true); }
  add(x, latin) {
    let b = x;
    if (typeof x === 'string') b = latin ? Uint8Array.from(x, c => c.charCodeAt(0)) : this.enc.encode(x);
    this.parts.push(b instanceof Blob ? b : new Blob([b]));
    this.pos += b.size ?? b.length;
  }
  reserve() { this.xref.push(null); return this.xref.length - 1; }
  obj(id, body) { this.xref[id] = this.pos; this.add(`${id} 0 obj\n${body}\nendobj\n`); }
  stream(id, dict, data) {
    const len = data.size ?? data.length;
    this.xref[id] = this.pos;
    this.add(`${id} 0 obj\n<< ${dict} /Length ${len} >>\nstream\n`);
    this.add(data);
    this.add('\nendstream\nendobj\n');
  }
  finish(rootId, infoId) {
    const start = this.pos, n = this.xref.length;
    let t = `xref\n0 ${n}\n0000000000 65535 f \n`;
    for (let i = 1; i < n; i++) t += `${String(this.xref[i]).padStart(10, '0')} 00000 n \n`;
    t += `trailer\n<< /Size ${n} /Root ${rootId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${start}\n%%EOF\n`;
    this.add(t);
    return new Blob(this.parts, { type: 'application/pdf' });
  }
}
const ppN = v => (+v.toFixed(3)).toString();
const ppHexStr = s => { let h = 'FEFF'; for (const c of s) { const u = c.codePointAt(0); if (u < 0x10000) h += u.toString(16).padStart(4, '0').toUpperCase(); } return `<${h}>`; };
function ppMarks(W, H) {          // W, H: 재단 크기(pt)
  const M = PP_MARGIN, L = M, R = M + W, B = M, T = M + H, a = PP_OFFSET, b = PP_OFFSET + PP_MARK, n = ppN;
  const seg = (x1, y1, x2, y2) => `${n(x1)} ${n(y1)} m ${n(x2)} ${n(y2)} l S\n`;
  return `q ${PP_LINE} w 1 1 1 1 K\n` +
    seg(L - b, B, L - a, B) + seg(L, B - b, L, B - a) + seg(R + a, B, R + b, B) + seg(R, B - b, R, B - a) +
    seg(L - b, T, L - a, T) + seg(L, T + a, L, T + b) + seg(R + a, T, R + b, T) + seg(R, T + a, R, T + b) + 'Q\n';
}
async function ppInfoImage(text) {     // 페이지 정보: 한글이 있어 작은 흑백 이미지로 넣음
  const k = 6, fs = 6 * k, c = document.createElement('canvas'), g = c.getContext('2d');
  g.font = `${fs}px 'Noto Sans KR',sans-serif`;
  c.width = Math.ceil(g.measureText(text).width) + k * 2; c.height = Math.ceil(fs * 1.4);
  const g2 = c.getContext('2d', { willReadFrequently: true });
  g2.fillStyle = '#fff'; g2.fillRect(0, 0, c.width, c.height);
  g2.fillStyle = '#000'; g2.font = `${fs}px 'Noto Sans KR',sans-serif`; g2.textBaseline = 'middle';
  g2.fillText(text, k, c.height / 2);
  const d = g2.getImageData(0, 0, c.width, c.height).data, gray = new Uint8Array(c.width * c.height);
  for (let i = 0; i < gray.length; i++) gray[i] = d[i * 4];
  const z = new Blob([gray]).stream().pipeThrough(new CompressionStream('deflate'));
  return { w: c.width, h: c.height, data: new Uint8Array(await new Response(z).arrayBuffer()), pw: c.width / k, ph: c.height / k };
}
async function buildPrintPdf(o, onProgress) {
  ppCancel = false;
  await ppInitColor();
  await pdfLoadLib('htmlToImage');
  await document.fonts.ready;
  const keepBleed = S.bleed, sz = SIZES[S.size] || SIZES.a4;
  if (!keepBleed) { S.bleed = true; render(); await new Promise(r => setTimeout(r, 300)); }
  try {
    const all = [...document.querySelectorAll('#pages .page')];
    const list = o.range ? all.filter((_, i) => o.range.has(i + 1)) : all;
    const fontCSS = await pdfFontCSS();
    const w = new PPWriter(), rootId = w.reserve(), pagesId = w.reserve(), infoId = w.reserve(), kids = [];
    const W = sz.w * PP_MM, H = sz.h * PP_MM, M = PP_MARGIN, mb = `[0 0 ${ppN(W + 2 * M)} ${ppN(H + 2 * M)}]`;
    const stamp = new Date().toLocaleString('ko-KR');
    for (let i = 0; i < list.length; i++) {
      const page = list[i], no = all.indexOf(page) + 1, say = (t, p = 0) => onProgress?.(`${no}쪽 (${i + 1}/${list.length}): ${t}`, (i + p) / list.length);
      if (ppCancel) throw new Error('취소했습니다.');
      say('그리는 중');
      const cv = await pdfRenderPage(page, o.ppi / 96, fontCSS, false, .97);
      if (ppCancel) throw new Error('취소했습니다.');
      say('CMYK로 바꾸는 중', .4);
      const iw = cv.width, ih = cv.height, cmyk = await ppToCmyk(cv, p => say('CMYK로 바꾸는 중', .4 + p * .2));
      cv.width = cv.height = 1;
      say('압축하는 중', .6);
      const jpeg = await ppEncode(iw, ih, cmyk, p => say('압축하는 중', .6 + p * .39));
      if (ppCancel) throw new Error('취소했습니다.');
      const imgId = w.reserve(), infoImg = w.reserve(), cId = w.reserve(), pId = w.reserve();
      w.stream(imgId, `/Type /XObject /Subtype /Image /Width ${iw} /Height ${ih} /ColorSpace /DeviceCMYK /BitsPerComponent 8 /Decode [1 0 1 0 1 0 1 0] /Filter /DCTDecode`, jpeg);
      const info = await ppInfoImage(`${o.title}  ${no}쪽  ${stamp}`);
      w.stream(infoImg, `/Type /XObject /Subtype /Image /Width ${info.w} /Height ${info.h} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode`, info.data);
      const bx = M - PP_BLEED, by = M - PP_BLEED, bw = W + 2 * PP_BLEED, bh = H + 2 * PP_BLEED;
      const c = `q ${ppN(bw)} 0 0 ${ppN(bh)} ${ppN(bx)} ${ppN(by)} cm /Im0 Do Q\n${ppMarks(W, H)}q ${ppN(info.pw)} 0 0 ${ppN(info.ph)} ${ppN(M + 12)} ${ppN(Math.max(1, M - PP_OFFSET - info.ph - 1))} cm /Im1 Do Q\n`;
      w.stream(cId, '', new TextEncoder().encode(c));
      w.obj(pId, `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox ${mb} /CropBox ${mb} /BleedBox [${ppN(bx)} ${ppN(by)} ${ppN(bx + bw)} ${ppN(by + bh)}] /TrimBox [${ppN(M)} ${ppN(M)} ${ppN(M + W)} ${ppN(M + H)}] /Resources << /XObject << /Im0 ${imgId} 0 R /Im1 ${infoImg} 0 R >> >> /Contents ${cId} 0 R >>`);
      kids.push(pId);
      await new Promise(r => setTimeout(r));
    }
    w.obj(pagesId, `<< /Type /Pages /Count ${kids.length} /Kids [${kids.map(k => `${k} 0 R`).join(' ')}] >>`);
    w.obj(rootId, `<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
    w.obj(infoId, `<< /Title ${ppHexStr(o.title)} /Producer (Graduation Album Designer 5) >>`);
    return w.finish(rootId, infoId);
  } finally {
    if (!keepBleed) { S.bleed = keepBleed; render(); }
  }
}
async function ppSave(blob, name) {
  if (window.showSaveFilePicker) {
    try {
      const h = await showSaveFilePicker({ suggestedName: name, types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }] });
      const s = await h.createWritable();
      await s.write(blob);
      await s.close();
      return true;
    } catch (e) { if (e.name === 'AbortError') return false; }
  }
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return true;
}

/* ---------- 대화상자 ---------- */
function bindPrintPdf() {
  const btn = document.getElementById('b-print-pdf');
  if (!btn) return;
  document.body.insertAdjacentHTML('beforeend', `<dialog id="pp-dlg" class="it pp">
    <h3>인쇄용 PDF 저장 <small>더블유기획 천상영 설정</small></h3>
    <table class="pp-tb">
      <tr><th>호환성</th><td>Acrobat 5 (PDF 1.4)</td><th>내보내기</th><td>쪽마다 한 장</td></tr>
      <tr><th>해상도</th><td id="pp-res">600ppi · JPEG 최대</td><th>재단선</th><td>0.25pt · 오프셋 3mm</td></tr>
      <tr><th>색상</th><td>Japan Color 2001 Coated (CMYK)</td><th>도련</th><td>3mm</td></tr>
      <tr><th>프로파일</th><td>포함 안 함</td><th>페이지 정보</th><td>포함</td></tr>
    </table>
    <div class="pp-row"><label>쪽 범위 <input id="pp-range" placeholder="비워 두면 전체 (예: 1-3, 8)"></label>
      <label>해상도 <select id="pp-ppi"><option value="600">600ppi (인쇄소 납품)</option><option value="300">300ppi (빠른 확인용)</option></select></label></div>
    <p class="pp-note" id="pp-prof"></p>
    <label class="btn ghost" id="pp-pick" hidden>색상 프로파일 파일 고르기 (JapanColor2001Coated.icc)<input type="file" id="pp-file" accept=".icc,.icm" hidden></label>
    <p class="pp-note">글자도 600ppi 이미지로 들어갑니다. 600ppi는 쪽당 수십 초가 걸리고 파일이 큽니다. 처음에는 한 쪽만 저장해 인쇄소에 확인받으세요.</p>
    <progress id="pp-bar" max="1" value="0" hidden></progress>
    <p id="pp-status" role="status"></p>
    <div class="it-foot"><span></span><button id="pp-cancel">닫기</button><button id="pp-go" class="pri">저장 시작</button></div>
  </dialog>`);
  const d = document.getElementById('pp-dlg'), go = d.querySelector('#pp-go'), cancel = d.querySelector('#pp-cancel'), status = d.querySelector('#pp-status'), bar = d.querySelector('#pp-bar');
  let busy = false;
  const showProf = () => {
    d.querySelector('#pp-prof').textContent = ppProfile ? '색상 프로파일: JapanColor2001Coated.icc 준비됨' : '색상 프로파일이 없습니다. C:\\Windows\\System32\\spool\\drivers\\color 에서 JapanColor2001Coated.icc 를 골라 주세요.';
    d.querySelector('#pp-pick').hidden = !!ppProfile;
    go.disabled = !ppProfile;
  };
  btn.addEventListener('click', async () => { d.showModal(); status.textContent = ''; bar.hidden = true; await ppLoadProfile(); showProf(); });
  d.querySelector('#pp-file').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (f) { ppProfile = new Uint8Array(await f.arrayBuffer()); ppTransform = null; showProf(); }
  });
  d.addEventListener('cancel', e => { if (busy) e.preventDefault(); });
  cancel.addEventListener('click', () => { if (busy) { ppCancel = true; status.textContent = '취소하는 중…'; } else d.close(); });
  go.addEventListener('click', async () => {
    const total = document.querySelectorAll('#pages .page').length, txt = d.querySelector('#pp-range').value.trim();
    const range = txt ? pdfParseRange(txt, total) : null;
    if (txt && !range) { status.textContent = '쪽 범위를 확인해 주세요. 예: 1-3, 8'; return; }
    busy = true; go.disabled = true; bar.hidden = false; bar.value = 0; cancel.textContent = '취소';
    const t0 = Date.now();
    try {
      const title = `${S.school || '졸업앨범'}_${S.year || ''}`.replace(/[\\/:*?"<>|]/g, '_');
      const blob = await buildPrintPdf({ range, ppi: +d.querySelector('#pp-ppi').value, title }, (t, p) => { status.textContent = t; bar.value = p; });
      bar.value = 1;
      status.textContent = `완성: ${(blob.size / 1048576).toFixed(0)}MB · ${Math.round((Date.now() - t0) / 1000)}초. 저장할 곳을 고르세요.`;
      const ok = await ppSave(blob, `${title}_인쇄용${txt ? `_${txt.replace(/\s/g, '')}쪽` : ''}.pdf`);
      status.textContent = ok ? `저장했습니다: ${(blob.size / 1048576).toFixed(0)}MB` : '저장을 취소했습니다.';
    } catch (e) { console.warn(e); status.textContent = e.message || '저장하지 못했습니다.'; }
    busy = false; go.disabled = !ppProfile; cancel.textContent = '닫기';
  });
}
bindPrintPdf();
