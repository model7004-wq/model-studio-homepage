/* =========================================================
   졸업색톤 · 인쇄 프로파일(ICC) 계산
   - 출력업체 CMYK 프로파일(v2, lut8/lut16)을 직접 읽어 계산
   - 색역 밖 비율(gamt), 총 잉크량(TAC), 소프트 프루프 색차(ΔE), CMYK 변환용 3D LUT
   - sRGB 픽셀 기준 (원본 ICC가 sRGB가 아니면 근사값)
   ========================================================= */
(function (global) {
'use strict';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const dec = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
const S2L = new Float32Array(256); for (let i = 0; i < 256; i++) S2L[i] = dec(i / 255);
const fLab = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
// sRGB(선형) → Lab (D50, ICC PCS 기준. Bradford 적응 행렬)
function lin2labD50(r, g, b, o){
  const X = (0.4360747*r + 0.3850649*g + 0.1430804*b) / 0.9642;
  const Y =  0.2225045*r + 0.7168786*g + 0.0606169*b;
  const Z = (0.0139322*r + 0.0971045*g + 0.7141733*b) / 0.8249;
  const fx = fLab(X), fy = fLab(Y), fz = fLab(Z);
  o[0] = 116*fy - 16; o[1] = 500*(fx - fy); o[2] = 200*(fy - fz); return o;
}
const dE = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

function parseLut(b, dv, off){
  const type = String.fromCharCode(b[off], b[off+1], b[off+2], b[off+3]);
  if (type !== 'mft1' && type !== 'mft2') throw new Error('지원하지 않는 ICC 표 형식: ' + type);
  const inC = b[off+8], outC = b[off+9], g = b[off+10], w = type === 'mft2' ? 2 : 1, max = w === 2 ? 65535 : 255;
  let inN = 256, outN = 256, p = off + 48;
  if (w === 2){ inN = dv.getUint16(off + 48); outN = dv.getUint16(off + 50); p = off + 52; }
  const rd = n => { const a = new Float32Array(n); for (let i = 0; i < n; i++){ a[i] = (w === 2 ? dv.getUint16(p) : b[p]) / max; p += w; } return a; };
  const inT = rd(inC * inN), clut = rd(Math.pow(g, inC) * outC), outT = rd(outC * outN);
  return { type, inC, outC, g, inN, outN, inT, clut, outT };
}
const curve = (t, k, n, x) => { const f = clamp(x, 0, 1) * (n - 1), i = Math.min(n - 2, Math.floor(f)), r = f - i, o = k * n; return t[o + i] + (t[o + i + 1] - t[o + i]) * r; };
// 입력(0~1) → 출력(0~1). CLUT는 n차원 선형 보간 (첫 입력 채널이 가장 큰 자리)
function evalLut(L, vin, out){
  const { inC, outC, g } = L, idx = [], fr = [], x = [];
  for (let i = 0; i < inC; i++){ x[i] = curve(L.inT, i, L.inN, vin[i]); const f = x[i] * (g - 1), k = Math.min(g - 2, Math.floor(f)); idx[i] = k; fr[i] = f - k; }
  const acc = new Float64Array(outC), corners = 1 << inC;
  for (let c = 0; c < corners; c++){
    let w = 1, base = 0;
    for (let i = 0; i < inC; i++){ const bit = (c >> (inC - 1 - i)) & 1; w *= bit ? fr[i] : 1 - fr[i]; base = base * g + idx[i] + bit; }
    if (w === 0) continue;
    base *= outC;
    for (let o = 0; o < outC; o++) acc[o] += w * L.clut[base + o];
  }
  for (let o = 0; o < outC; o++) out[o] = curve(L.outT, o, L.outN, acc[o]);
  return out;
}
// PCS Lab 인코딩 (v2 방식: lut16은 L 0~100 → 0~0xFF00)
function labIn(L, l, a, b, o){
  if (L.type === 'mft2'){ o[0] = l / 100 * 65280 / 65535; o[1] = (a + 128) * 256 / 65535; o[2] = (b + 128) * 256 / 65535; }
  else { o[0] = l / 100; o[1] = (a + 128) / 255; o[2] = (b + 128) / 255; }
  return o;
}
function labOut(L, v, o){
  if (L.type === 'mft2'){ o[0] = v[0] * 65535 / 652.8; o[1] = v[1] * 65535 / 256 - 128; o[2] = v[2] * 65535 / 256 - 128; }
  else { o[0] = v[0] * 100; o[1] = v[1] * 255 - 128; o[2] = v[2] * 255 - 128; }
  return o;
}

function load(bytes, name = ''){
  const b = bytes, dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const s4 = o => String.fromCharCode(b[o], b[o+1], b[o+2], b[o+3]);
  if (b.length < 132 || s4(36) !== 'acsp') throw new Error('ICC 프로파일 파일이 아닙니다');
  const cls = s4(12), space = s4(16), pcs = s4(20);
  if (space !== 'CMYK' || pcs !== 'Lab ') throw new Error('CMYK 인쇄 프로파일(PCS Lab)만 지원합니다 (이 파일: ' + space.trim() + ' / ' + pcs.trim() + ')');
  const n = dv.getUint32(128), tags = {};
  for (let k = 0; k < n; k++){ const e = 132 + k * 12; tags[s4(e)] = dv.getUint32(e + 4); }
  const get = sig => tags[sig] != null ? parseLut(b, dv, tags[sig]) : null;
  const P = {
    name, bytes: b, desc: global.ToneMatch ? global.ToneMatch.iccDesc(b) : '',
    A2B0: get('A2B0'), A2B1: get('A2B1') || get('A2B0'), B2A0: get('B2A0'), B2A1: get('B2A1') || get('B2A0'), gamt: get('gamt')
  };
  if (!P.A2B1 || !P.B2A1) throw new Error('프로파일에 변환 표(A2B/B2A)가 없습니다');
  P.B2A0 = P.B2A0 || P.B2A1; P.A2B0 = P.A2B0 || P.A2B1;
  return P;
}
const tmpIn = [0, 0, 0, 0], tmpV = [0, 0, 0, 0];
function toCMYK(P, lab, intent, out){ const L = intent === 0 ? P.B2A0 : P.B2A1; labIn(L, lab[0], lab[1], lab[2], tmpIn); return evalLut(L, tmpIn, out); }
function toLab(P, cmyk, intent, out){ const L = intent === 0 ? P.A2B0 : P.A2B1; evalLut(L, cmyk, tmpV); return labOut(L, tmpV, out); }
function gamut(P, lab){ if (!P.gamt) return 0; labIn(P.gamt, lab[0], lab[1], lab[2], tmpIn); return evalLut(P.gamt, tmpIn, tmpV)[0]; }

// 인쇄 검사: RGBA 8비트 픽셀(보정 후)과 피부 마스크 → 색역 밖 비율, 총 잉크량, 소프트 프루프 색차
function check(P, d, n, skin, opt = {}){
  const tacLimit = opt.tacLimit || 350, step = Math.max(1, Math.floor(n / 60000));
  const lab = [0, 0, 0], cm = [0, 0, 0, 0], back = [0, 0, 0], cm0 = [0, 0, 0, 0];
  let N = 0, oog = 0, sN = 0, sOog = 0, dSum = 0, d10 = 0, sdSum = 0, tacMax = 0; const tacH = new Uint32Array(501);
  for (let i = 0; i < n; i += step){
    const p = i * 4; lin2labD50(S2L[d[p]], S2L[d[p+1]], S2L[d[p+2]], lab); N++;
    const isSkin = skin && skin[i];
    const g = gamut(P, lab) > 0.04; if (g) oog++;
    toCMYK(P, lab, 1, cm); toLab(P, cm, 1, back);      // 상대 색도 → 다시 Lab (인쇄 후 보이는 색)
    const e = dE(lab, back); dSum += e; if (e > 10) d10++;
    toCMYK(P, lab, 0, cm0); const tac = (cm0[0] + cm0[1] + cm0[2] + cm0[3]) * 100; tacH[Math.min(500, Math.round(tac))]++; if (tac > tacMax) tacMax = tac;
    if (isSkin){ sN++; if (g) sOog++; sdSum += e; }
  }
  let a = 0, tac995 = 0; for (let t = 0; t <= 500; t++){ a += tacH[t]; if (a >= N * 0.995){ tac995 = t; break; } }
  const r = {
    oog: oog / N, oogSkin: sN ? sOog / sN : 0, dE: dSum / N, dEskin: sN ? sdSum / sN : 0, dE10: d10 / N,
    tacMax: Math.round(tacMax), tac995, tacLimit, warn: [], fail: []
  };
  if (r.oog > 0.05) r.warn.push(`인쇄 색역 밖 ${(r.oog * 100).toFixed(1)}%`);
  if (r.oogSkin > 0.02) r.warn.push(`피부 일부 인쇄 색역 밖 ${(r.oogSkin * 100).toFixed(1)}%`);
  if (r.dEskin > 4) (r.dEskin > 8 ? r.fail : r.warn).push(`인쇄 시 피부색 변화 ΔE ${r.dEskin.toFixed(1)}`);
  if (r.dE10 > 0.1) r.warn.push(`인쇄 시 크게 바뀌는 색 ${(r.dE10 * 100).toFixed(0)}%`);
  if (r.tac995 > tacLimit + 5) r.warn.push(`총 잉크량 ${r.tac995}% (기준 ${tacLimit}%)`);
  return r;
}
// RGB(8비트 sRGB) → CMYK 변환용 33³ LUT (지각적 의도)
const CN = 33;
function cmykLut(P, intent = 0){
  const lut = new Float32Array(CN * CN * CN * 4), lab = [0, 0, 0], cm = [0, 0, 0, 0];
  let q = 0;
  for (let bi = 0; bi < CN; bi++) for (let gi = 0; gi < CN; gi++) for (let ri = 0; ri < CN; ri++){
    lin2labD50(dec(ri / (CN-1)), dec(gi / (CN-1)), dec(bi / (CN-1)), lab);
    toCMYK(P, lab, intent, cm);
    lut[q++] = clamp(cm[0], 0, 1); lut[q++] = clamp(cm[1], 0, 1); lut[q++] = clamp(cm[2], 0, 1); lut[q++] = clamp(cm[3], 0, 1);
  }
  return lut;
}
const CI = new Uint8Array(256), CF = new Float32Array(256);
for (let i = 0; i < 256; i++){ const f = i * (CN - 1) / 255, k = Math.min(CN - 2, Math.floor(f)); CI[i] = k; CF[i] = f - k; }
// RGBA → CMYK 8비트 (out stride 4)
function applyCmyk(lut, src, n, out, outOff){
  const S1 = 4, S2 = CN * 4, S3 = CN * CN * 4;
  for (let i = 0, p = 0, q = outOff; i < n; i++, p += 4, q += 4){
    const r = src[p], g = src[p+1], b = src[p+2], fr = CF[r], fg = CF[g], fb = CF[b];
    const base = CI[b] * S3 + CI[g] * S2 + CI[r] * S1;
    for (let c = 0; c < 4; c++){
      const o = base + c;
      const c00 = lut[o] + (lut[o + S1] - lut[o]) * fr, c10 = lut[o + S2] + (lut[o + S2 + S1] - lut[o + S2]) * fr;
      const c01 = lut[o + S3] + (lut[o + S3 + S1] - lut[o + S3]) * fr, c11 = lut[o + S3 + S2] + (lut[o + S3 + S2 + S1] - lut[o + S3 + S2]) * fr;
      const c0 = c00 + (c10 - c00) * fg, c1 = c01 + (c11 - c01) * fg;
      out[q + c] = Math.round((c0 + (c1 - c0) * fb) * 255);
    }
  }
}

global.TonePrint = { load, check, toCMYK, toLab, gamut, lin2labD50, S2L, cmykLut, applyCmyk, dE };
})(window);
