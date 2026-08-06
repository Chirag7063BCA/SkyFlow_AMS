/* SkyFlow AMS - Help Center Script */
async function loadComponent(url, id) {
  try {
    const res = await fetch(url);
    if (res.ok) document.getElementById(id).innerHTML = await res.text();
  } catch (e) { console.error(e); }
}

async function initHelpPage() {
  await loadComponent('../globalcomp/navbar.html', 'navbar-container');
  await loadComponent('../globalcomp/footer.html', 'footer-container');

  const logo = document.querySelector('.navbar-logo');
  if (logo) logo.href = '../index.html';
  const logoImg = document.getElementById('navbarLogoImg');
  if (logoImg) logoImg.src = '../../../images/navbar logo.gif';

  const links = { '#hero': '../index.html#hero', '#flights': '../index.html#flights', 'mybookings/bookings.html': '../mybookings/bookings.html', 'help/help.html': '#' };
  Object.entries(links).forEach(([sel, href]) => {
    const el = document.querySelector(`.nav-link[href="${sel}"]`);
    if (el) { el.href = href; el.classList.toggle('active', href === '#'); }
  });

  ensureAuthDrawer();
  handleScrollState();
}

function handleScrollState() {
  const header = document.querySelector('.site-header');
  if (header) {
    header.classList.toggle('scrolled', window.scrollY > window.innerHeight - 80);
  }
}

function ensureAuthDrawer() {
  if (document.getElementById('signupDrawer')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div id="signupDrawer" class="signup-drawer">
      <div id="drawerOverlay" class="drawer-overlay"></div>
      <div class="drawer-panel">
        <div class="drawer-header">
          <div class="drawer-brand"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 15.5L11.5 3l-1.8 8.2L21 9.5 8.5 21l2.3-8.5L3 15.5Z" fill="#2563eb"/></svg><h2 id="drawerTitle">Welcome Back</h2></div>
          <button type="button" id="closeDrawerBtn" class="close-btn">&times;</button>
        </div>
        <div class="auth-tabs">
          <button type="button" id="signinTab" class="tab-btn active" onclick="switchTab('signin')">Sign In</button>
          <button type="button" id="signupTab" class="tab-btn" onclick="switchTab('signup')">Sign Up</button>
        </div>
        <form id="signinForm" class="auth-form">
          <div class="form-group"><label>Email Address</label><input type="email" id="signinEmail" placeholder="name@example.com" required></div>
          <div class="form-group"><label>Password</label><input type="password" id="signinPassword" placeholder="••••••••" required></div>
          <button type="submit" class="submit-btn">Sign In</button>
        </form>
        <form id="signupForm" class="auth-form" style="display: none;">
          <div class="form-group"><label>Full Name</label><input type="text" id="fullName" placeholder="John Doe" required></div>
          <div class="form-group"><label>Email Address</label><input type="email" id="signupEmail" placeholder="name@example.com" required></div>
          <div class="form-group"><label>Password</label><input type="password" id="signupPassword" placeholder="At least 6 characters" required minlength="6"></div>
          <button type="submit" class="submit-btn">Create Account</button>
        </form>
      </div>
    </div>`);
}

document.addEventListener('DOMContentLoaded', () => {
  initHelpPage();
  window.addEventListener('scroll', handleScrollState);

  const form = document.getElementById('helpForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const btn = document.getElementById('submitBtn');
      btn.disabled = true; btn.textContent = 'Sending...';
      try {
        await fetch('https://formsubmit.co/ajax/contact.webdevit@gmail.com', { method: 'POST', body: new FormData(this), headers: { 'Accept': 'application/json' } });
      } catch (err) {}
      btn.textContent = 'Form Submitted ✓';
      btn.style.backgroundColor = '#10b981';
      this.reset();
    });
  }
});
