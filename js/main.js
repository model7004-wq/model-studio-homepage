/* =========================================================
   ★ 사진관 정보 — 이 부분만 바꾸면 모든 페이지에 한 번에 적용됩니다 ★
   ========================================================= */
const STUDIO = {
  name: "모델스튜디오",
  nameEn: "MODEL STUDIO",
  phone: "054-554-0824",                          // 대표 전화번호
  mobile: "010-2813-9182",                        // 문자 받을 휴대폰 번호
  kakao: "https://pf.kakao.com/_xfcigxb",         // 카카오톡 채널 주소
  naverPlace: "https://map.naver.com/p/entry/place/36513112", // 네이버 지도(플레이스) 주소
  instagram: "",                                  // 인스타그램 주소 (없으면 비워두세요)
  address: "경북 문경시 상신로 36 모델스튜디오",  // 주소
  addressNote: "도로변 주차 가능",                // 주차 안내
  hours: "오전 9:30 – 오후 7:00",
  hoursNote: "주말 촬영 가능 · 예약 후 방문해 주세요",
  mapQuery: "문경 모델스튜디오 상신로 36",        // 지도 검색어
  bizInfo: "모델스튜디오 · 대표 방상은 · 사업자등록번호 511-01-06388",
};

/* 메뉴 목록 */
const MENU = [
  ["index.html", "홈"],
  ["family.html", "가족사진"],
  ["profile.html", "증명·프로필"],
  ["baby.html", "아기사진"],
  ["gallery.html", "갤러리"],
  ["price.html", "상품·가격"],
  ["location.html", "오시는 길·예약"],
];

/* ========================================================= */

const telHref = "tel:" + STUDIO.phone.replace(/[^0-9]/g, "");
const smsHref = "sms:" + STUDIO.mobile.replace(/[^0-9]/g, "");
const page = document.body.dataset.page || "index.html";

/* 머리글 */
document.body.insertAdjacentHTML("afterbegin", `
<header class="site-header">
  <div class="container">
    <a class="logo" href="index.html" aria-label="${STUDIO.name} 홈">
      <strong>${STUDIO.name}</strong><small>${STUDIO.nameEn} · MUNGYEONG</small>
    </a>
    <nav class="nav" aria-label="주 메뉴">
      ${MENU.map(([href, label]) => `<a href="${href}"${href === page ? ' class="active" aria-current="page"' : ""}>${label}</a>`).join("")}
    </nav>
    <a class="btn btn-primary header-cta" href="location.html#reserve">예약 문의</a>
    <button class="menu-btn" aria-label="메뉴 열기" aria-expanded="false"><span></span><span></span><span></span></button>
  </div>
</header>`);

/* 꼬리글 + 모바일 하단 버튼 */
document.body.insertAdjacentHTML("beforeend", `
<footer class="site-footer">
  <div class="container">
    <div>
      <a class="logo" href="index.html"><strong>${STUDIO.name}</strong><small>${STUDIO.nameEn} · MUNGYEONG</small></a>
      <p style="margin-top:16px">미국 PPA MASTER 사진명장의 문경 사진관<br>가족 · 증명·여권 · 프로필 · 베이비 · 주니어 · 웨딩</p>
    </div>
    <div>
      <h4>문의·예약</h4>
      <ul>
        <li>전화 <a href="${telHref}">${STUDIO.phone}</a></li>
        <li><a href="${STUDIO.kakao}" target="_blank" rel="noopener">카카오톡 상담</a></li>
        <li>문자 <a href="${smsHref}">${STUDIO.mobile}</a></li>
        <li><a href="${STUDIO.naverPlace}" target="_blank" rel="noopener">네이버 지도·리뷰</a></li>
        ${STUDIO.instagram ? `<li><a href="${STUDIO.instagram}" target="_blank" rel="noopener">인스타그램</a></li>` : ""}
      </ul>
    </div>
    <div>
      <h4>찾아오시는 길</h4>
      <ul>
        <li>${STUDIO.address}</li>
        <li>${STUDIO.hours}</li>
        <li>${STUDIO.hoursNote}</li>
        <li>${STUDIO.addressNote}</li>
      </ul>
    </div>
    <p class="copy">${STUDIO.bizInfo}<br>© ${new Date().getFullYear()} ${STUDIO.name}. All rights reserved.</p>
  </div>
</footer>
<div class="mobile-bar">
  <a href="${telHref}">📞 전화</a>
  <a class="kakao" href="${STUDIO.kakao}" target="_blank" rel="noopener">💬 카톡</a>
  <a class="book" href="location.html#reserve">예약 문의</a>
</div>
<div class="lightbox" role="dialog" aria-modal="true" aria-label="사진 크게 보기">
  <button class="lb-close" aria-label="닫기">×</button>
  <button class="lb-prev" aria-label="이전 사진">‹</button>
  <img alt="">
  <button class="lb-next" aria-label="다음 사진">›</button>
  <p class="lb-cap"></p>
</div>`);

/* 본문 안의 연락처 자리 채우기: data-studio="phone" 처럼 표시된 곳 */
document.querySelectorAll("[data-studio]").forEach((el) => {
  const key = el.dataset.studio;
  if (STUDIO[key]) el.textContent = STUDIO[key];
});
document.querySelectorAll('[data-link="tel"]').forEach((a) => (a.href = telHref));
document.querySelectorAll('[data-link="sms"]').forEach((a) => (a.href = smsHref));
document.querySelectorAll('[data-link="kakao"]').forEach((a) => { a.href = STUDIO.kakao; a.target = "_blank"; a.rel = "noopener"; });
document.querySelectorAll('[data-link="naver"]').forEach((a) => { a.href = STUDIO.naverPlace; a.target = "_blank"; a.rel = "noopener"; });
document.querySelectorAll('[data-link="naver-map"]').forEach((a) => { a.href = STUDIO.naverPlace; a.target = "_blank"; a.rel = "noopener"; });
document.querySelectorAll('[data-link="kakao-map"]').forEach((a) => { a.href = "https://map.kakao.com/?q=" + encodeURIComponent(STUDIO.mapQuery); a.target = "_blank"; a.rel = "noopener"; });

/* 샘플 사진이 아직 없는 자리 표시 */
document.querySelectorAll(".ph[data-ph]").forEach((el) => {
  el.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="4"/></svg>
    <strong>${el.dataset.ph}</strong><small>샘플 사진 준비 중</small>`;
});

/* 휴대폰 메뉴 열기/닫기 */
const menuBtn = document.querySelector(".menu-btn");
menuBtn.addEventListener("click", () => {
  const open = document.body.classList.toggle("menu-open");
  menuBtn.setAttribute("aria-expanded", open);
});
document.querySelectorAll(".nav a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("menu-open")));

/* 갤러리 분류 버튼 */
document.querySelectorAll(".filter").forEach((bar) => {
  const target = document.querySelector(bar.dataset.target);
  bar.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    bar.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b === btn));
    const cat = btn.dataset.cat;
    target.querySelectorAll(".g-item").forEach((item) => {
      item.classList.toggle("hidden", cat !== "all" && item.dataset.cat !== cat);
    });
  });
});

/* 사진 크게 보기 */
const lb = document.querySelector(".lightbox");
const lbImg = lb.querySelector("img");
const lbCap = lb.querySelector(".lb-cap");
let lbList = [];
let lbIndex = 0;
function showLb(i) {
  lbIndex = (i + lbList.length) % lbList.length;
  const img = lbList[lbIndex];
  lbImg.src = img.currentSrc || img.src;
  lbImg.alt = img.alt;
  lbCap.textContent = img.closest("figure")?.querySelector("figcaption")?.textContent || "";
}
document.addEventListener("click", (e) => {
  const img = e.target.closest(".zoom img, .g-item img");
  if (!img) return;
  const scope = img.closest(".gallery") || document;
  lbList = [...scope.querySelectorAll(".zoom img, .g-item:not(.hidden) img")];
  showLb(lbList.indexOf(img));
  lb.classList.add("open");
});
lb.querySelector(".lb-close").onclick = () => lb.classList.remove("open");
lb.querySelector(".lb-prev").onclick = () => showLb(lbIndex - 1);
lb.querySelector(".lb-next").onclick = () => showLb(lbIndex + 1);
lb.addEventListener("click", (e) => { if (e.target === lb) lb.classList.remove("open"); });
document.addEventListener("keydown", (e) => {
  if (!lb.classList.contains("open")) return;
  if (e.key === "Escape") lb.classList.remove("open");
  if (e.key === "ArrowLeft") showLb(lbIndex - 1);
  if (e.key === "ArrowRight") showLb(lbIndex + 1);
});
let touchX = null;
lb.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
lb.addEventListener("touchend", (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) showLb(lbIndex + (dx < 0 ? 1 : -1));
  touchX = null;
});

/* 예약 문의 양식 → 문자 메시지로 보내기 */
const form = document.querySelector("#reserve-form");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const body = `[${STUDIO.name} 예약 문의]
이름: ${d.get("name")}
연락처: ${d.get("phone")}
촬영 종류: ${d.get("type")}
희망 날짜: ${d.get("date") || "미정"}
인원: ${d.get("people") || "-"}
문의 내용: ${d.get("memo") || "-"}`;
    const num = STUDIO.mobile.replace(/[^0-9]/g, "");
    const sep = /iPhone|iPad|iPod/.test(navigator.userAgent) ? "&" : "?";
    if (/Android|iPhone|iPad|iPod/.test(navigator.userAgent)) {
      location.href = `sms:${num}${sep}body=${encodeURIComponent(body)}`;
    } else {
      navigator.clipboard?.writeText(body);
      alert(`문의 내용이 복사되었습니다.\n카카오톡 상담 또는 문자(${STUDIO.mobile})로 붙여넣어 보내주세요.\n\n전화 문의: ${STUDIO.phone}`);
    }
  });
}

/* 스크롤하면 부드럽게 나타나기 */
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
