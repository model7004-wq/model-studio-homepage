/* 홈페이지(GitHub Pages)에서 디자이너를 열 때 비밀번호 확인. 내 컴퓨터(localhost)에서는 묻지 않음.
   - 비밀번호는 auth.json 에 '암호화된 값(PBKDF2-SHA256)'으로만 들어 있음. 접속자(user) · 관리자(admin) 둘 다 들어갈 수 있음
   - 한 번 맞히면 브라우저 창을 닫을 때까지 다시 묻지 않음 (sessionStorage)
   - 비밀번호 바꾸기: 관리자 비밀번호 확인 → 새 값을 GitHub 저장소의 designer/auth.json 에 씀 (GitHub 토큰 필요, 관리자 컴퓨터에만 기억)
     토큰이 없으면 auth.json 파일을 내려받아 직접 올릴 수 있음
   주의: 홈페이지는 누구나 파일을 받을 수 있는 정적 사이트라, 이 창은 '아무나 못 들어오게 막는 가림막'이고 은행 수준의 보안은 아님 */
(() => {
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:') return;
  const REPO = { owner: 'model7004-wq', repo: 'model-studio-homepage', path: 'designer/auth.json', branch: 'main' };
  const SS = 'gradAlbum.gate', TK = 'gradAlbum.gateToken';
  const store = (s, k, v) => { try { return v === undefined ? s.getItem(k) : (v === null ? s.removeItem(k) : s.setItem(k, v)); } catch { return null; } };
  let auth = null;
  const loadAuth = async () => (auth ||= await (await fetch(`auth.json?t=${Date.now()}`, { cache: 'no-store' })).json());
  async function hashOf(pw, a = auth) {
    const enc = new TextEncoder(), key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(a.salt), iterations: a.iter }, key, 256);
    return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  async function roleOf(pw) { await loadAuth(); const h = await hashOf(pw); return h === auth.admin ? 'admin' : h === auth.user ? 'user' : null; }

  // 맞히기 전에는 앱 화면을 감춤
  if (store(sessionStorage, SS)) return;      // 이 창에서 이미 맞힘
  document.documentElement.classList.add('gate-lock');
  document.head.insertAdjacentHTML('beforeend', `<style>
    html.gate-lock body>*:not(#gate){display:none!important}
    #gate{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:#E7E1D8;font:15px/1.5 'Noto Sans KR','Malgun Gothic',system-ui,sans-serif;color:#3d342c}
    #gate .g-box{width:min(360px,calc(100vw - 32px));background:#fff;border-radius:14px;box-shadow:0 12px 40px rgba(60,40,20,.18);padding:28px 26px 22px;text-align:center}
    #gate h1{margin:0 0 4px;font:800 20px 'Nanum Myeongjo',serif;letter-spacing:.08em}
    #gate p{margin:4px 0 14px;color:#8a7d70;font-size:13px}
    #gate input{width:100%;box-sizing:border-box;margin:6px 0;padding:11px 12px;border:1px solid #d8cfc4;border-radius:8px;font-size:16px;text-align:center;letter-spacing:.3em}
    #gate input.wide{letter-spacing:normal;text-align:left;font-size:13px}
    #gate button{width:100%;margin-top:8px;padding:11px;border:0;border-radius:8px;background:#b08d57;color:#fff;font:600 15px inherit;cursor:pointer}
    #gate button.sub{background:none;color:#8a7d70;font-size:13px;padding:6px;text-decoration:underline}
    #gate .g-msg{min-height:20px;margin-top:8px;font-size:13px;color:#c0392b}
    #gate .g-msg.okm{color:#2e7d32}
    #gate label{display:block;text-align:left;font-size:12px;color:#8a7d70;margin-top:8px}
    #gate .shake{animation:gsh .35s}
    @keyframes gsh{25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
  </style>`);

  function view(html) { const g = document.getElementById('gate'); g.innerHTML = `<div class="g-box">${html}</div>`; g.querySelector('input')?.focus(); return g; }
  function login() {
    const g = view(`<h1>졸업앨범 디자이너</h1><p>직원 전용입니다. 비밀번호를 넣어 주세요.</p>
      <form id="g-f"><input id="g-pw" type="password" inputmode="numeric" autocomplete="current-password" placeholder="비밀번호"><button type="submit">들어가기</button></form>
      <div class="g-msg" id="g-msg"></div><button type="button" class="sub" id="g-chg">비밀번호 바꾸기 (관리자)</button>`);
    g.querySelector('#g-f').addEventListener('submit', async e => {
      e.preventDefault();
      const pw = g.querySelector('#g-pw').value, msg = g.querySelector('#g-msg');
      if (!pw) return;
      msg.className = 'g-msg'; msg.textContent = '확인 중…';
      let role = null;
      try { role = await roleOf(pw); } catch { msg.textContent = '비밀번호 정보를 불러오지 못했습니다. 인터넷 연결을 확인하세요.'; return; }
      if (!role) { msg.textContent = '비밀번호가 맞지 않습니다.'; const b = g.querySelector('.g-box'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); g.querySelector('#g-pw').select(); return; }
      store(sessionStorage, SS, `${role}:${auth.v}`);
      document.documentElement.classList.remove('gate-lock');
      g.remove();
      dispatchEvent(new Event('resize'));      // 감춰져 있던 동안의 화면 크기 계산을 다시
    });
    g.querySelector('#g-chg').addEventListener('click', change);
  }
  function change() {
    const hasTk = !!store(localStorage, TK);
    const g = view(`<h1>비밀번호 바꾸기</h1><p>관리자 비밀번호를 확인한 뒤 바꿉니다. 바꾸지 않을 칸은 비워 두세요.</p>
      <form id="g-f">
        <label>지금 관리자 비밀번호</label><input id="g-cur" type="password" autocomplete="current-password">
        <label>새 접속자 비밀번호 (직원용)</label><input id="g-u" type="password" autocomplete="new-password">
        <label>새 관리자 비밀번호</label><input id="g-a" type="password" autocomplete="new-password">
        <label>GitHub 토큰 ${hasTk ? '(이 컴퓨터에 기억됨 · 바꿀 때만 넣기)' : '(처음 한 번만 · 이 컴퓨터에만 기억)'}</label><input id="g-tk" class="wide" type="password" autocomplete="off" placeholder="${hasTk ? '••••••••' : 'github_pat_…'}">
        <button type="submit">바꾸기</button></form>
      <div class="g-msg" id="g-msg"></div><button type="button" class="sub" id="g-back">← 돌아가기</button>`);
    g.querySelector('#g-back').addEventListener('click', login);
    g.querySelector('#g-f').addEventListener('submit', async e => {
      e.preventDefault();
      const $ = s => g.querySelector(s).value.trim(), msg = g.querySelector('#g-msg'), say = (t, good) => { msg.className = `g-msg${good ? ' okm' : ''}`; msg.textContent = t; };
      const cur = $('#g-cur'), nu = $('#g-u'), na = $('#g-a'), tk = $('#g-tk');
      if (!nu && !na) { say('새 비밀번호를 하나 이상 넣으세요.'); return; }
      if ((nu && nu.length < 4) || (na && na.length < 4)) { say('비밀번호는 4자 이상으로 해 주세요.'); return; }
      if (nu && na && nu === na) { say('접속자와 관리자 비밀번호는 서로 다르게 해 주세요.'); return; }
      say('확인 중…');
      if ((await roleOf(cur).catch(() => null)) !== 'admin') { say('관리자 비밀번호가 맞지 않습니다.'); return; }
      const salt = [...crypto.getRandomValues(new Uint8Array(12))].map(b => b.toString(16).padStart(2, '0')).join('');
      const next = { v: (auth.v || 1) + 1, salt, iter: auth.iter || 150000 };
      // 바꾸지 않는 비밀번호는 지금 값을 모르므로(암호화돼 있음) 새 소금으로 다시 만들 수 없음 → 소금을 바꾸지 않고 그대로 둠
      if (!nu || !na) { next.salt = auth.salt; next.iter = auth.iter; }
      next.user = nu ? await hashOf(nu, next) : auth.user;
      next.admin = na ? await hashOf(na, next) : auth.admin;
      const json = `${JSON.stringify(next, null, 1)}\n`;
      if (tk) store(localStorage, TK, tk);
      const token = tk || store(localStorage, TK);
      if (!token) { download(json); say('GitHub 토큰이 없어 auth.json 파일을 내려받았습니다. 홈페이지 저장소의 designer 폴더에 올리면 적용됩니다.', true); return; }
      try {
        const api = `https://api.github.com/repos/${REPO.owner}/${REPO.repo}/contents/${REPO.path}`, H = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };
        const cur0 = await fetch(`${api}?ref=${REPO.branch}`, { headers: H, cache: 'no-store' });
        if (cur0.status === 401 || cur0.status === 403) throw new Error('토큰이 맞지 않거나 권한이 없습니다');
        const sha = cur0.ok ? (await cur0.json()).sha : undefined;
        const r = await fetch(api, { method: 'PUT', headers: H, body: JSON.stringify({ message: '디자이너 비밀번호 변경', content: btoa(json), sha, branch: REPO.branch }) });
        if (!r.ok) throw new Error(`GitHub 저장 실패 (${r.status})`);
        auth = next;
        say('바꿨습니다. 1~2분 뒤 모든 컴퓨터 · 휴대폰에 적용됩니다.', true);
      } catch (err) {
        if (/토큰/.test(err.message)) store(localStorage, TK, null);
        download(json);
        say(`${err.message}. 대신 auth.json 파일을 내려받았습니다.`);
      }
    });
  }
  function download(text) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = 'auth.json';
    document.body.appendChild(a); a.click(); a.remove();
  }
  const start = () => { if (document.getElementById('gate')) return; document.body.insertAdjacentHTML('afterbegin', '<div id="gate"></div>'); login(); };
  if (document.body) start(); else addEventListener('DOMContentLoaded', start);
})();
