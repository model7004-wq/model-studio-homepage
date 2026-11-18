/* =========================================================
   졸업색톤 · 기준 사진 매칭 엔진
   - 기준 사진(MASTER)의 피부톤·얼굴 밝기·중립색·대비·채도 통계를 뽑고
   - 사진마다 따로 분석해 기준과의 차이만큼만 보정값을 계산
   - 보정은 Lab 색공간에서 (화이트밸런스 → 노출 → 피부톤 → 명암 → 채도) 순서로 하고
     피부 보호 마스크(색 기반 가중치)를 씀. 계산은 Float32, 결과는 3D LUT로 원본 픽셀에 직접 적용
   - 픽셀 크기 변경·크롭·리샘플링·생성형 처리 없음
   ========================================================= */
(function (global) {
'use strict';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (x, a, b) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* ---------- 색공간 ---------- */
const S2L = new Float32Array(256);
for (let i = 0; i < 256; i++){ const c = i / 255; S2L[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
const dec = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
const enc = v => v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
const fLab = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
const iLab = t => { const t3 = t * t * t; return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787; };
function lin2lab(r, g, b, o){
  const X = (0.4124564*r + 0.3575761*g + 0.1804375*b) / 0.95047;
  const Y =  0.2126729*r + 0.7151522*g + 0.0721750*b;
  const Z = (0.0193339*r + 0.1191920*g + 0.9503041*b) / 1.08883;
  const fx = fLab(X), fy = fLab(Y), fz = fLab(Z);
  o[0] = 116*fy - 16; o[1] = 500*(fx - fy); o[2] = 200*(fy - fz);
  return o;
}
function lab2lin(L, a, b, o){
  const fy = (L + 16) / 116, X = 0.95047 * iLab(fy + a / 500), Y = iLab(fy), Z = 1.08883 * iLab(fy - b / 200);
  o[0] =  3.2404542*X - 1.5371385*Y - 0.4985314*Z;
  o[1] = -0.9692660*X + 1.8760108*Y + 0.0415560*Z;
  o[2] =  0.0556434*X - 0.2040259*Y + 1.0572252*Z;
  return o;
}
const hueDeg = (a, b) => { const h = Math.atan2(b, a) * 180 / Math.PI; return h < 0 ? h + 360 : h; };

/* ---------- 분석 ---------- */
// 피부 후보: Lab 범위 + YCbCr 범위 둘 다 만족 (나무 가구·주황 물체는 색상각으로 거름)
function skinLike(L, a, b, r, g, bl){
  if (L < 34 || L > 94 || a < 3 || b < 4 || a > 38 || b > 40) return false;   // L 34 미만은 머리카락·그림자로 봄
  const h = hueDeg(a, b), C = Math.hypot(a, b);
  if (h < 22 || h > 68 || C < 8 || C > 42) return false;
  const cr = 128 + 0.5*r - 0.4187*g - 0.0813*bl, cb = 128 - 0.1687*r - 0.3313*g + 0.5*bl;
  return cr >= 133 && cr <= 178 && cb >= 80 && cb <= 130;
}
// 연결된 피부 영역 중 얼굴일 가능성이 높은 것을 고름 (얼굴 인식 API가 없을 때)
function faceFromBlobs(skin, W, H){
  const N = W * H, lab = new Int32Array(N), stack = new Int32Array(N), comps = [];
  let id = 0;
  for (let s = 0; s < N; s++){
    if (!skin[s] || lab[s]) continue;
    id++; let sp = 0; stack[sp++] = s; lab[s] = id;
    let n = 0, x0 = W, x1 = 0, y0 = H, y1 = 0;
    while (sp){
      const i = stack[--sp], x = i % W, y = (i / W) | 0; n++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x > 0 && skin[i-1] && !lab[i-1]){ lab[i-1] = id; stack[sp++] = i-1; }
      if (x < W-1 && skin[i+1] && !lab[i+1]){ lab[i+1] = id; stack[sp++] = i+1; }
      if (y > 0 && skin[i-W] && !lab[i-W]){ lab[i-W] = id; stack[sp++] = i-W; }
      if (y < H-1 && skin[i+W] && !lab[i+W]){ lab[i+W] = id; stack[sp++] = i+W; }
    }
    if (n < N * 0.0006) continue;
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, asp = bh / bw, fill = n / (bw * bh), cy = (y0 + y1) / 2 / H, frac = n / N;
    let sc = n;
    sc *= fill > 0.35 ? 1 : fill > 0.2 ? 0.5 : 0.15;
    sc *= asp >= 0.75 && asp <= 2.2 ? 1 : asp >= 0.5 && asp <= 3 ? 0.45 : 0.1;
    sc *= cy < 0.6 ? 1 : cy < 0.75 ? 0.5 : 0.2;
    sc *= frac < 0.18 ? 1 : frac < 0.3 ? 0.4 : 0.05;
    comps.push({ id, n, x0, x1, y0, y1, bw, bh, sc });
  }
  if (!comps.length) return null;
  comps.sort((p, q) => q.sc - p.sc);
  const best = comps[0], pick = comps.filter(c => c.sc >= best.sc * 0.45 && c.n >= best.n * 0.35).slice(0, 40);
  const mask = new Uint8Array(N), boxes = [];
  for (const c of pick){
    const yEnd = Math.min(c.y1, c.y0 + Math.round(Math.min(c.bh, c.bw * 1.35)));   // 목·몸 쪽은 빼고 얼굴 부분만
    for (let y = c.y0; y <= yEnd; y++) for (let x = c.x0; x <= c.x1; x++){ const i = y*W + x; if (lab[i] === c.id) mask[i] = 1; }
    boxes.push({ x: c.x0, y: c.y0, w: c.bw, h: yEnd - c.y0 + 1 });
  }
  return { mask, boxes };
}

async function detectFaces(canvas){
  if (!('FaceDetector' in global)) return null;
  try {
    const fs = await new global.FaceDetector({ maxDetectedFaces: 40, fastMode: false }).detect(canvas);
    return fs.length ? fs.map(f => f.boundingBox) : null;
  } catch { return null; }
}

function pctOf(hist, total, q){ let a = 0; const t = total * q; for (let i = 0; i < hist.length; i++){ a += hist[i]; if (a >= t) return i / 10; } return 100; }

// src: 캔버스/이미지 (방향 보정된 미리보기). 통계는 최대 640px 사본으로 계산
async function analyze(src, max = 640){
  const W0 = src.width, H0 = src.height, s = Math.min(1, max / Math.max(W0, H0));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(W0 * s)); c.height = Math.max(1, Math.round(H0 * s));
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(src, 0, 0, c.width, c.height);
  const W = c.width, H = c.height, N = W * H, d = ctx.getImageData(0, 0, W, H).data;
  const Ls = new Float32Array(N), As = new Float32Array(N), Bs = new Float32Array(N), skin = new Uint8Array(N), t = [0, 0, 0];
  for (let i = 0, p = 0; i < N; i++, p += 4){
    lin2lab(S2L[d[p]], S2L[d[p+1]], S2L[d[p+2]], t);
    Ls[i] = t[0]; As[i] = t[1]; Bs[i] = t[2];
    if (skinLike(t[0], t[1], t[2], d[p], d[p+1], d[p+2])) skin[i] = 1;
  }
  // 얼굴 영역: 얼굴 인식 API → 없으면 피부 영역 분석
  let face = null, by = '';
  const boxes = await detectFaces(c);
  if (boxes){
    const mask = new Uint8Array(N); let n = 0;
    const bx = boxes.map(b => ({ x: Math.round(b.x + b.width*0.15), y: Math.round(b.y + b.height*0.1), w: Math.round(b.width*0.7), h: Math.round(b.height*0.8) }));
    for (const b of bx) for (let y = Math.max(0, b.y); y < Math.min(H, b.y + b.h); y++) for (let x = Math.max(0, b.x); x < Math.min(W, b.x + b.w); x++){
      const i = y*W + x; if (skin[i]){ mask[i] = 1; n++; }
    }
    if (n > N * 0.0004){ face = { mask, boxes: bx }; by = '얼굴 인식'; }
  }
  if (!face){ face = faceFromBlobs(skin, W, H); if (face) by = '피부 영역 분석'; }
  return { W, H, N, d, Ls, As, Bs, skin, faceMask: face ? face.mask : null, boxes: face ? face.boxes : [], by, ...stats({ W, H, N, d, Ls, As, Bs, skin, faceMask: face ? face.mask : null }) };
}

// 분석용 픽셀에서 통계 계산 (보정 후 검사에도 같은 함수 사용)
function stats({ W, H, N, d, Ls, As, Bs, skin, faceMask }){
  const hist = new Uint32Array(1001), hues = new Float32Array(12);
  let fN = 0, fa = 0, fb = 0, fL = 0, fL2 = 0, fa2 = 0, fb2 = 0, fC = 0; const fHist = new Uint32Array(1001);
  let nN = 0, na = 0, nb = 0, cN = 0, cS = 0, clip = 0, deep = 0, dN = 0, dS = 0, dS2 = 0, bgN = 0, bgS = 0, sL = 0, sL2 = 0;
  const bx = Math.round(W * 0.08), by = Math.round(H * 0.08);
  for (let i = 0, p = 0; i < N; i++, p += 4){
    const L = Ls[i], a = As[i], b = Bs[i], C = Math.hypot(a, b);
    hist[Math.round(clamp(L, 0, 100) * 10)]++; sL += L; sL2 += L*L;
    if (d[p] >= 254 || d[p+1] >= 254 || d[p+2] >= 254) clip++;
    if (L < 3) deep++;
    if (L < 25){ dN++; dS += L; dS2 += L*L; }
    const x = i % W, y = (i / W) | 0;
    if (x < bx || x >= W - bx || y < by || y >= H - by){ bgN++; bgS += L; }
    if (faceMask && faceMask[i]){
      fN++; fa += a; fb += b; fL += L; fL2 += L*L; fa2 += a*a; fb2 += b*b; fC += C;
      fHist[Math.round(clamp(L, 0, 100) * 10)]++;
    } else {
      if (!skin[i] && C < 7 && L > 25 && L < 97){ nN++; na += a; nb += b; }
      if (L > 10 && L < 97 && C > 4){ cN++; cS += C; }
    }
    if (C > 4) hues[Math.floor(hueDeg(a, b) / 30) % 12] += C;
  }
  const hs = hues.reduce((x, y) => x + y, 0) || 1;
  const Lm = sL / N;
  const face = fN > N * 0.0004 ? {
    found: true, n: fN, frac: fN / N,
    medL: pctOf(fHist, fN, 0.5), meanL: fL / fN, sL: Math.sqrt(Math.max(0, fL2/fN - (fL/fN)**2)),
    a: fa / fN, b: fb / fN, sa: Math.sqrt(Math.max(0, fa2/fN - (fa/fN)**2)), sb: Math.sqrt(Math.max(0, fb2/fN - (fb/fN)**2)),
    C: fC / fN, hue: hueDeg(fa / fN, fb / fN)
  } : { found: false };
  return {
    face,
    neu: { a: nN ? na / nN : 0, b: nN ? nb / nN : 0, frac: nN / N },
    p01: pctOf(hist, N, 0.01), p05: pctOf(hist, N, 0.05), p50: pctOf(hist, N, 0.5), p95: pctOf(hist, N, 0.95), p99: pctOf(hist, N, 0.99),
    Lstd: Math.sqrt(Math.max(0, sL2 / N - Lm * Lm)),
    C: cN ? cS / cN : 0,
    clip: clip / N, deep: deep / N,
    dark: { frac: dN / N, sd: dN ? Math.sqrt(Math.max(0, dS2/dN - (dS/dN)**2)) : 0 },
    bgL: bgN ? bgS / bgN : 0,
    hues: Array.from(hues, v => +(v / hs).toFixed(3))
  };
}
// 기준 사진으로 저장할 통계만 (픽셀 배열 제외)
function slim(st){
  const { face, neu, p01, p05, p50, p95, p99, Lstd, C, clip, deep, dark, bgL, hues, by } = st;
  return { face, neu, p01, p05, p50, p95, p99, Lstd, C, clip, deep, dark, bgL, hues, by, v: 1 };
}

/* ---------- 보정값 계산 ---------- */
const sCurve = (x, k) => x + k * 4 * x * (1 - x) * (x - 0.5);
// 노출 곡선: 감마를 중간 밝기에만 적용. 그림자(검은 정장)와 하이라이트(흰 셔츠·배경, L 80 이상)는 거의 그대로 둠
const expo = (x, g) => x <= 0 ? 0 : x + (Math.pow(x, g) - x) * smooth(x, 0.04, 0.55) * (1 - smooth(x, 0.8, 1));
function solveG(from, to){
  if (Math.abs(from - to) < 1e-4) return 1;
  let lo = 0.4, hi = 2.5;
  for (let i = 0; i < 50; i++){ const m = (lo + hi) / 2; if (expo(from, m) > to) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
function invS(y, k){ let lo = 0, hi = 1; for (let i = 0; i < 40; i++){ const m = (lo + hi) / 2; if (sCurve(m, k) < y) lo = m; else hi = m; } return (lo + hi) / 2; }
const capVec = (x, y, m) => { const n = Math.hypot(x, y); return n > m ? [x * m / n, y * m / n] : [x, y]; };

// ref: 기준 통계, st: 이 사진 통계, strength·protect: 0~1
function compute(ref, st, strength = 0.8, protect = 0.6){
  const notes = [], review = [];
  let s = strength;
  const hasFace = st.face.found, refFace = ref.face.found;
  if (!hasFace){ s *= 0.5; review.push('얼굴을 찾지 못해 보정 강도를 절반으로 제한했습니다'); }
  if (!refFace) notes.push('기준 사진에서 얼굴을 찾지 못해 피부톤 매칭을 하지 않습니다');
  // 1단계 화이트밸런스: 중립색(흰 벽·셔츠·회색) 기준. 중립색이 적으면 피부 차이의 절반으로 추정
  let wa = 0, wb = 0, wbBy = '없음';
  if (st.neu.frac > 0.015){ wa = ref.neu.a - st.neu.a; wb = ref.neu.b - st.neu.b; wbBy = '중립색'; }
  else if (hasFace && refFace){ wa = (ref.face.a - st.face.a) * 0.5; wb = (ref.face.b - st.face.b) * 0.5; wbBy = '피부톤 추정'; }
  const wbRaw = Math.hypot(wa, wb);
  // 노출 기준: 얼굴 밝기 (배경이 밝다고 전체를 낮추지 않음). 얼굴이 없으면 중간 밝기로 약하게
  let Lp, LtFull;
  if (hasFace && refFace){ Lp = st.face.medL; LtFull = ref.face.medL; }
  else { Lp = st.p50; LtFull = st.p50 + (ref.p50 - st.p50) * 0.5; }
  const dL = LtFull - Lp;
  if (Math.abs(dL) > 25 || wbRaw > 15){ s *= 0.6; review.push('기준 사진과 조명 조건 차이가 커서 보정 강도를 제한했습니다'); }
  if (st.clip > 0.03) notes.push('원본에 하얗게 날아간 부분이 ' + (st.clip * 100).toFixed(1) + '% 있습니다');
  [wa, wb] = capVec(wa * s, wb * s, 10);
  // 4단계 명암: 얼굴 안의 밝기 분포(입체감)를 기준과 비교. 부드러운 S커브, 양 끝 기울기 0.56 이상 유지
  const k = hasFace && refFace && st.face.sL > 1 ? clamp((ref.face.sL / st.face.sL - 1) * 0.6, -0.22, 0.22) * s : 0;
  // 2단계 노출: 명암 곡선을 거친 뒤 얼굴이 목표 밝기에 오도록 감마 계산
  const Lt = clamp(Lp + clamp(dL, -18, 18) * s, 8, 92);
  const pre = invS(Lt / 100, k);
  const g = Lp > 1 && Lp < 99 ? clamp(solveG(Lp / 100, pre), 0.5, 2.2) : 1;
  // 3단계 피부톤: 기준 피부색 쪽으로 일부만 이동 (사람마다 다른 피부색 보존)
  let ss = [0, 0], sk = null;
  if (hasFace && refFace){
    ss = capVec((ref.face.a - st.face.a) * 0.6 * s, (ref.face.b - st.face.b) * 0.6 * s, 7);
    sk = { ma: st.face.a, mb: st.face.b, sa: Math.max(4, st.face.sa * 1.8), sb: Math.max(5, st.face.sb * 1.8) };
  }
  // 5단계 채도: 피부 외 영역. 사진 내용에 따라 달라지므로 차이를 줄여 좁은 범위에서만
  const cs = st.C > 3 && ref.C > 3 ? 1 + (clamp(Math.sqrt(ref.C / st.C), 0.92, 1.08) - 1) * s : 1;
  return {
    wb: [wa, wb], wbBy, g, k, ss, sk, prot: protect, cs, s,
    face: { from: Lp, to: Lt }, notes, review
  };
}

/* ---------- 색 변환 (Lab) ---------- */
function xform(m, L, a, b, o){
  const C = Math.hypot(a, b);
  let w = 0;
  if (m.sk){
    const da = (a - m.sk.ma) / m.sk.sa, db = (b - m.sk.mb) / m.sk.sb;
    w = Math.exp(-0.5 * (da * da + db * db)) * smooth(L, 15, 30) * (1 - smooth(L, 92, 99));
  }
  // 1) 화이트밸런스: 무채색에 강하게, 채도 높은 옷·배경색에는 약하게
  const wn = 0.35 + 0.65 * Math.exp(-(C / 30) * (C / 30));
  let sa = m.wb[0] * wn, sb = m.wb[1] * wn;
  // 3) 피부: 피부 보호 강도만큼 전용 보정으로 대체
  if (w > 0){
    const ka = sa + (m.ss[0] - sa) * m.prot, kb = sb + (m.ss[1] - sb) * m.prot;
    sa += (ka - sa) * w; sb += (kb - sb) * w;
  }
  // 가장 밝은 흰색(L 92~100)은 색을 옮기지 않음 → 흰 옷·배경이 새로 날아가거나 물들지 않게
  const hl = 1 - smooth(L, 92, 100);
  sa *= hl; sb *= hl;
  let a2 = a + sa, b2 = b + sb;
  // 5) 채도 (피부 제외)
  const cs = 1 + (m.cs - 1) * (1 - w) * hl;
  a2 *= cs; b2 *= cs;
  // 2) 노출 + 4) 명암 (밝기 채널만, 0과 100은 고정 → 새 클리핑 없음)
  let x = clamp(L / 100, 0, 1);
  x = sCurve(expo(x, m.g), m.k);
  o[0] = x * 100; o[1] = a2; o[2] = b2;
  return o;
}
// 색 하나 보정 (선형 RGB 입력 → 0~1 sRGB 출력).
// 원래 날아가지 않았던 색이 보정 때문에 255를 넘으면, 넘지 않는 만큼만 보정을 줄임 (흰 배경·밝은 피부 디테일 보존)
const GLIM = 0.99;   // 보정 결과 상한 ≈252 (LUT 보간 여유 포함). 원래 그보다 밝던 색은 원래 밝기까지 허용 → 곡선이 끊기지 않음
function mapColor(m, lr, lg, lb, inMax, o){
  const t0 = [0, 0, 0], t1 = [0, 0, 0], c = [0, 0, 0];
  lin2lab(lr, lg, lb, t0); xform(m, t0[0], t0[1], t0[2], t1);
  const at = (k, out) => {
    lab2lin(t0[0] + (t1[0] - t0[0]) * k, t0[1] + (t1[1] - t0[1]) * k, t0[2] + (t1[2] - t0[2]) * k, c);
    out[0] = enc(Math.max(0, c[0])); out[1] = enc(Math.max(0, c[1])); out[2] = enc(Math.max(0, c[2]));
    return Math.max(out[0], out[1], out[2]);
  };
  const tmp = [0, 0, 0], full = at(1, o);   // 먼저 전체 보정 결과를 계산 (항상)
  if (full > GLIM){
    const lim = Math.max(GLIM, at(0, tmp));   // 원래 이미 아주 밝던 색은 원래 밝기까지만 허용
    let lo = 0, hi = 1;
    for (let i = 0; i < 14; i++){ const mid = (lo + hi) / 2; if (at(mid, tmp) > lim) hi = mid; else lo = mid; }
    at(lo, o);
  }
  o[0] = clamp(o[0], 0, 1); o[1] = clamp(o[1], 0, 1); o[2] = clamp(o[2], 0, 1);
  return o;
}
// 8비트 sRGB 값 → 보정된 0~1 값 (LUT 정확도 검사용)
function direct(m, r, g, b, o){
  return mapColor(m, S2L[r], S2L[g], S2L[b], Math.max(r, g, b) / 255, o);
}

/* ---------- 3D LUT (65³, Float32) ---------- */
const LN = 65, LIDX = new Uint8Array(256), LFR = new Float32Array(256);
for (let i = 0; i < 256; i++){ const f = i * (LN - 1) / 255, i0 = Math.min(LN - 2, Math.floor(f)); LIDX[i] = i0; LFR[i] = f - i0; }
function buildLut(m){
  const lut = new Float32Array(LN * LN * LN * 3), o = [0, 0, 0];
  let q = 0;
  for (let bi = 0; bi < LN; bi++) for (let gi = 0; gi < LN; gi++) for (let ri = 0; ri < LN; ri++){
    const er = ri / (LN-1), eg = gi / (LN-1), eb = bi / (LN-1);
    mapColor(m, dec(er), dec(eg), dec(eb), Math.max(er, eg, eb), o);
    lut[q++] = o[0]; lut[q++] = o[1]; lut[q++] = o[2];
  }
  return lut;
}
// RGBA 8비트 → out (scale=255: 8비트, 65535: 16비트), out은 RGB 3채널 또는 RGBA(stride 4)
function applyLut(lut, src, n, out, outOff, stride, scale){
  const S1 = 3, S2 = LN * 3, S3 = LN * LN * 3;
  for (let i = 0, p = 0, q = outOff; i < n; i++, p += 4, q += stride){
    const r = src[p], g = src[p+1], b = src[p+2];
    const fr = LFR[r], fg = LFR[g], fb = LFR[b];
    const base = LIDX[b] * S3 + LIDX[g] * S2 + LIDX[r] * S1;
    for (let c = 0; c < 3; c++){
      const o = base + c;
      const c00 = lut[o] + (lut[o + S1] - lut[o]) * fr;
      const c10 = lut[o + S2] + (lut[o + S2 + S1] - lut[o + S2]) * fr;
      const c01 = lut[o + S3] + (lut[o + S3 + S1] - lut[o + S3]) * fr;
      const c11 = lut[o + S3 + S2] + (lut[o + S3 + S2 + S1] - lut[o + S3 + S2]) * fr;
      const c0 = c00 + (c10 - c00) * fg, c1 = c01 + (c11 - c01) * fg;
      out[q + c] = Math.round((c0 + (c1 - c0) * fb) * scale);
    }
    if (stride === 4) out[q + 3] = src[p + 3];
  }
}

/* ---------- 보정 후 품질 검사 (분석용 픽셀에 같은 LUT 적용) ---------- */
// extra(d2, N, skin): 보정된 분석 픽셀로 추가 검사 (인쇄 프로파일 검사 등)
function qc(ref, st, m, lut, extra){
  const { W, H, N, d, skin, faceMask } = st;
  const d2 = new Uint8ClampedArray(N * 4);
  applyLut(lut, d, N, d2, 0, 4, 255);
  const Ls = new Float32Array(N), As = new Float32Array(N), Bs = new Float32Array(N), t = [0, 0, 0];
  for (let i = 0, p = 0; i < N; i++, p += 4){ lin2lab(S2L[d2[p]], S2L[d2[p+1]], S2L[d2[p+2]], t); Ls[i] = t[0]; As[i] = t[1]; Bs[i] = t[2]; }
  const after = stats({ W, H, N, d: d2, Ls, As, Bs, skin, faceMask });
  const fails = [];
  if (after.face.found && ref.face.found){
    if (after.face.medL > Math.max(ref.face.medL + 7, st.face.medL + 2) || after.face.medL > 91) fails.push('얼굴이 지나치게 밝아짐');
    if (after.face.medL < Math.min(ref.face.medL - 14, st.face.medL - 2)) fails.push('얼굴이 지나치게 어두움');
    const h = after.face.hue;
    if (h < 28 || h > 72 || after.face.C < 6 || after.face.C > Math.max(ref.face.C + 6, st.face.C + 2)) fails.push('피부색이 부자연스러움');
  }
  if (after.clip - st.clip > 0.005) fails.push('흰색 영역 클리핑 증가 (' + ((after.clip - st.clip) * 100).toFixed(1) + '%p)');
  // 원본에서 어두웠던 같은 픽셀들의 밝기 편차(질감)가 얼마나 남았는지
  let n = 0, s0 = 0, q0 = 0, s1 = 0, q1 = 0;
  for (let i = 0; i < N; i++){ const L0 = st.Ls[i]; if (L0 >= 25) continue; const L1 = Ls[i]; n++; s0 += L0; q0 += L0*L0; s1 += L1; q1 += L1*L1; }
  const sd0 = n ? Math.sqrt(Math.max(0, q0/n - (s0/n)**2)) : 0, sd1 = n ? Math.sqrt(Math.max(0, q1/n - (s1/n)**2)) : 0;
  after.darkKeep = sd0 > 0 ? sd1 / sd0 : 1;
  if (n > N * 0.01 && (after.darkKeep < 0.8 || after.deep - st.deep > 0.005)) fails.push('검은 의상 디테일 손실');
  let print = null;
  if (extra){ print = extra(d2, N, faceMask || skin); fails.push(...print.fail); }
  return { after, fails, print };
}

/* ---------- 메타데이터: ICC · 해상도 ---------- */
function jpegIcc(segs){
  const parts = [];
  for (const s of segs){
    if (s[1] !== 0xE2 || s.length < 18) continue;
    if (String.fromCharCode(...s.subarray(4, 15)) !== 'ICC_PROFILE') continue;
    parts.push({ seq: s[16], data: s.subarray(18) });
  }
  if (!parts.length) return null;
  parts.sort((x, y) => x.seq - y.seq);
  const out = new Uint8Array(parts.reduce((n, p) => n + p.data.length, 0));
  let o = 0; for (const p of parts){ out.set(p.data, o); o += p.data.length; }
  return out;
}
function jfifDpi(segs){
  for (const s of segs){
    if (s[1] !== 0xE0 || String.fromCharCode(...s.subarray(4, 8)) !== 'JFIF') continue;
    const u = s[11], x = (s[12] << 8) | s[13];
    if (u === 1 && x > 1) return x;
    if (u === 2 && x > 1) return Math.round(x * 2.54);
  }
  return 0;
}
async function inflate(z){
  const ab = await new Response(new Blob([z]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer();
  return new Uint8Array(ab);
}
async function pngMeta(b){
  const out = { icc: null, dpi: 0 };
  if (b[0] !== 0x89 || b[1] !== 0x50) return out;
  let i = 8;
  while (i + 8 <= b.length){
    const len = ((b[i] << 24) >>> 0) + (b[i+1] << 16) + (b[i+2] << 8) + b[i+3];
    const type = String.fromCharCode(b[i+4], b[i+5], b[i+6], b[i+7]), dat = b.subarray(i + 8, i + 8 + len);
    if (type === 'iCCP'){ const z = dat.indexOf(0); try { out.icc = await inflate(dat.subarray(z + 2)); } catch {} }
    if (type === 'pHYs' && dat[8] === 1){ out.dpi = Math.round((((dat[0] << 24) >>> 0) + (dat[1] << 16) + (dat[2] << 8) + dat[3]) * 0.0254); }
    if (type === 'IDAT' || type === 'IEND') break;
    i += 12 + len;
  }
  return out;
}
function iccDesc(icc){
  if (!icc || icc.length < 132) return '';
  const dv = new DataView(icc.buffer, icc.byteOffset, icc.byteLength), n = dv.getUint32(128);
  for (let k = 0; k < n && 132 + k*12 + 12 <= icc.length; k++){
    const sig = dv.getUint32(132 + k*12), off = dv.getUint32(136 + k*12), len = dv.getUint32(140 + k*12);
    if (sig !== 0x64657363 || off + len > icc.length) continue;   // 'desc'
    const type = String.fromCharCode(...icc.subarray(off, off + 4));
    if (type === 'desc'){ const l = dv.getUint32(off + 8); return String.fromCharCode(...icc.subarray(off + 12, off + 12 + l - 1)); }
    if (type === 'mluc'){
      const cnt = dv.getUint32(off + 8); if (!cnt) return '';
      const sl = dv.getUint32(off + 20), so = dv.getUint32(off + 24); let s = '';
      for (let j = 0; j < sl; j += 2) s += String.fromCharCode(dv.getUint16(off + so + j));
      return s;
    }
  }
  return '';
}
// JPEG 머리말 사본에서 해상도(JFIF·EXIF)를 지정 ppi로 바꿈
function setJpegDpi(segs, dpi){
  let hasJfif = false;
  const out = segs.map(s0 => {
    const s = s0.slice();
    if (s[1] === 0xE0 && String.fromCharCode(...s.subarray(4, 8)) === 'JFIF'){ hasJfif = true; s[11] = 1; s[12] = dpi >> 8; s[13] = dpi & 255; s[14] = dpi >> 8; s[15] = dpi & 255; }
    if (s[1] === 0xE1 && String.fromCharCode(...s.subarray(4, 8)) === 'Exif'){
      const t = 10, le = s[t] === 0x49;
      const dv = new DataView(s.buffer, s.byteOffset, s.byteLength);
      const u16 = o => dv.getUint16(o, le), u32 = o => dv.getUint32(o, le);
      try {
        const ifd = t + u32(t + 4), n = u16(ifd);
        for (let k = 0; k < n; k++){
          const e = ifd + 2 + k * 12, tag = u16(e);
          if ((tag === 0x011A || tag === 0x011B) && u16(e + 2) === 5){ const vo = t + u32(e + 8); dv.setUint32(vo, dpi, le); dv.setUint32(vo + 4, 1, le); }
          if (tag === 0x0128 && u16(e + 2) === 3) dv.setUint16(e + 8, 2, le);
        }
      } catch {}
    }
    return s;
  });
  if (!hasJfif){
    const j = new Uint8Array([0xFF,0xE0,0,16,0x4A,0x46,0x49,0x46,0,1,1,1,dpi>>8,dpi&255,dpi>>8,dpi&255,0,0]);
    out.unshift(j);
  }
  return out;
}
function iccSegs(icc){
  const max = 65519, n = Math.ceil(icc.length / max), segs = [];
  for (let k = 0; k < n; k++){
    const part = icc.subarray(k * max, (k + 1) * max), len = part.length + 16, s = new Uint8Array(len + 2);
    s[0] = 0xFF; s[1] = 0xE2; s[2] = len >> 8; s[3] = len & 255;
    s.set([73,67,67,95,80,82,79,70,73,76,69,0], 4); s[16] = k + 1; s[17] = n; s.set(part, 18);
    segs.push(s);
  }
  return segs;
}

/* ---------- 무손실 TIFF (비압축, 8/16비트 RGB, ICC·ppi·방향 태그) ---------- */
// spp 3 = RGB, spp 4 = CMYK (Photometric 5, InkSet 1)
function tiffLayout(W, H, bits, { icc = null, dpi = 300, orientation = 1, software = '졸업색톤', spp = 3 } = {}){
  const bps = bits / 8, rowBytes = W * spp * bps;
  const rps = Math.max(1, Math.min(H, Math.floor(1048576 / rowBytes))), ns = Math.ceil(H / rps);
  const sw = new TextEncoder().encode(software + '\0');
  const tags = [
    [256, 4, 1, W], [257, 4, 1, H], [258, 3, spp, 'bps'], [259, 3, 1, 1], [262, 3, 1, spp === 4 ? 5 : 2],
    [273, 4, ns, 'so'], [274, 3, 1, orientation], [277, 3, 1, spp], [278, 4, 1, rps], [279, 4, ns, 'sbc'],
    [282, 5, 1, 'xr'], [283, 5, 1, 'yr'], [284, 3, 1, 1], [296, 3, 1, 2], [305, 2, sw.length, 'sw']
  ];
  if (spp === 4) tags.push([332, 3, 1, 1]);   // InkSet = CMYK
  if (icc) tags.push([34675, 7, icc.length, 'icc']);
  const ifdSize = 2 + tags.length * 12 + 4;
  let off = 8 + ifdSize;
  const place = {};
  const alloc = (k, n) => { if (off & 1) off++; place[k] = off; off += n; };
  alloc('bps', spp * 2); alloc('xr', 8); alloc('yr', 8); alloc('sw', sw.length);
  if (ns > 1){ alloc('so', ns * 4); alloc('sbc', ns * 4); }
  if (icc) alloc('icc', icc.length);
  if (off & 1) off++;
  const img = off, total = img + rowBytes * H;
  const buf = new ArrayBuffer(total), u8 = new Uint8Array(buf), dv = new DataView(buf);
  u8[0] = 0x49; u8[1] = 0x49; dv.setUint16(2, 42, true); dv.setUint32(4, 8, true);
  dv.setUint16(8, tags.length, true);
  const so = [], sbc = [];
  for (let k = 0; k < ns; k++){ so.push(img + k * rps * rowBytes); sbc.push(Math.min(rps, H - k * rps) * rowBytes); }
  tags.forEach(([tag, type, count, val], j) => {
    const e = 10 + j * 12;
    dv.setUint16(e, tag, true); dv.setUint16(e + 2, type, true); dv.setUint32(e + 4, count, true);
    if (typeof val === 'number'){ if (type === 3) dv.setUint16(e + 8, val, true); else dv.setUint32(e + 8, val, true); return; }
    if (val === 'so' && ns === 1){ dv.setUint32(e + 8, so[0], true); return; }
    if (val === 'sbc' && ns === 1){ dv.setUint32(e + 8, sbc[0], true); return; }
    dv.setUint32(e + 8, place[val], true);
  });
  dv.setUint32(8 + ifdSize - 4, 0, true);
  for (let k = 0; k < spp; k++) dv.setUint16(place.bps + k * 2, bits, true);
  dv.setUint32(place.xr, dpi, true); dv.setUint32(place.xr + 4, 1, true);
  dv.setUint32(place.yr, dpi, true); dv.setUint32(place.yr + 4, 1, true);
  u8.set(sw, place.sw);
  if (ns > 1) for (let k = 0; k < ns; k++){ dv.setUint32(place.so + k * 4, so[k], true); dv.setUint32(place.sbc + k * 4, sbc[k], true); }
  if (icc) u8.set(icc, place.icc);
  const pix = bits === 16 ? new Uint16Array(buf, img, W * H * spp) : new Uint8Array(buf, img, W * H * spp);
  return { buf, pix, headLen: img };
}
// 저장한 TIFF를 처음부터 다시 읽어 확인 (partial: 앞부분만 받은 경우 머리말만 확인)
function readTiff(u8, partial = false){
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  if (u8[0] !== 0x49 || u8[1] !== 0x49 || dv.getUint16(2, true) !== 42) throw new Error('TIFF 머리말이 올바르지 않습니다');
  const ifd = dv.getUint32(4, true), n = dv.getUint16(ifd, true), T = {};
  const size = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1 };
  for (let j = 0; j < n; j++){
    const e = ifd + 2 + j * 12, tag = dv.getUint16(e, true), type = dv.getUint16(e + 2, true), count = dv.getUint32(e + 4, true);
    const bytes = (size[type] || 1) * count, at = bytes <= 4 ? e + 8 : dv.getUint32(e + 8, true);
    const rd = k => type === 3 ? dv.getUint16(at + k * 2, true) : type === 4 ? dv.getUint32(at + k * 4, true) : type === 5 ? dv.getUint32(at + k * 8, true) / dv.getUint32(at + k * 8 + 4, true) : u8[at + k];
    T[tag] = { type, count, at, val: type === 7 || type === 2 ? null : Array.from({ length: Math.min(count, 100000) }, (_, k) => rd(k)) };
  }
  const need = t => { if (!T[t]) throw new Error('TIFF 태그 ' + t + '가 없습니다'); return T[t]; };
  const W = need(256).val[0], H = need(257).val[0], bits = need(258).val[0], spp = need(277).val[0];
  const so = need(273).val, sbc = need(279).val, rps = need(278).val[0];
  const icc = T[34675] ? u8.slice(T[34675].at, T[34675].at + T[34675].count) : null;
  const total = so.reduce((m, o, k) => Math.max(m, o + sbc[k]), 0);
  if (!partial && total > u8.length) throw new Error('TIFF 사진 데이터가 잘렸습니다');
  if (need(259).val[0] !== 1) throw new Error('예상하지 못한 압축 방식');
  const px = (x, y) => {
    const s = Math.floor(y / rps), bp = bits / 8, o = so[s] + (((y % rps) * W + x) * spp) * bp, v = [];
    for (let c = 0; c < spp; c++) v.push(bits === 16 ? dv.getUint16(o + c * 2, true) : u8[o + c]);
    return v;
  };
  return { W, H, bits, spp, total, photometric: T[262] ? T[262].val[0] : 0, dpi: T[282] ? T[282].val[0] : 0, unit: T[296] ? T[296].val[0] : 0, orientation: T[274] ? T[274].val[0] : 1, icc, px };
}
/* ---------- MD5 (Drive 업로드 내용 확인용: Drive가 계산한 md5Checksum과 비교) ---------- */
const MD5K = new Int32Array(64), MD5S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
for (let i = 0; i < 64; i++) MD5K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0;
async function md5(blob){
  let a0 = 0x67452301, b0 = 0xefcdab89 | 0, c0 = 0x98badcfe | 0, d0 = 0x10325476;
  const total = blob.size, CH = 8 << 20, M = new Int32Array(16);
  const block = (u8, o) => {
    for (let i = 0; i < 16; i++) M[i] = u8[o + i*4] | (u8[o + i*4 + 1] << 8) | (u8[o + i*4 + 2] << 16) | (u8[o + i*4 + 3] << 24);
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++){
      let F, g;
      if (i < 16){ F = (B & C) | (~B & D); g = i; }
      else if (i < 32){ F = (D & B) | (~D & C); g = (5 * i + 1) & 15; }
      else if (i < 48){ F = B ^ C ^ D; g = (3 * i + 5) & 15; }
      else { F = C ^ (B | ~D); g = (7 * i) & 15; }
      const t = (A + F + MD5K[i] + M[g]) | 0;
      A = D; D = C; C = B; B = (B + ((t << MD5S[i]) | (t >>> (32 - MD5S[i])))) | 0;
    }
    a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
  };
  let rest = new Uint8Array(0);
  for (let pos = 0; pos < total; pos += CH){
    const part = new Uint8Array(await blob.slice(pos, Math.min(total, pos + CH)).arrayBuffer());
    const u8 = rest.length ? (() => { const x = new Uint8Array(rest.length + part.length); x.set(rest); x.set(part, rest.length); return x; })() : part;
    const full = u8.length - (u8.length % 64);
    for (let o = 0; o < full; o += 64) block(u8, o);
    rest = u8.slice(full);
  }
  const padLen = rest.length < 56 ? 64 : 128, pad = new Uint8Array(padLen);
  pad.set(rest); pad[rest.length] = 0x80;
  const bitsLo = (total * 8) >>> 0, bitsHi = Math.floor(total / 536870912);
  const dvp = new DataView(pad.buffer); dvp.setUint32(padLen - 8, bitsLo, true); dvp.setUint32(padLen - 4, bitsHi, true);
  for (let o = 0; o < padLen; o += 64) block(pad, o);
  const hex = v => Array.from({ length: 4 }, (_, i) => ((v >>> (i * 8)) & 255).toString(16).padStart(2, '0')).join('');
  return hex(a0) + hex(b0) + hex(c0) + hex(d0);
}
const sameBytes = (a, b) => { if (!a || !b) return a === b; if (a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; };

global.ToneMatch = {
  analyze, stats, slim, compute, xform, direct, buildLut, applyLut, qc,
  jpegIcc, jfifDpi, pngMeta, iccDesc, setJpegDpi, iccSegs,
  tiffLayout, readTiff, sameBytes, md5, LN
};
})(window);
