/**
 * SkyFlow Authentication & Drawer Slider Logic
 * File: Javascript/User/auth.js
 */

// Open Drawer
function openDrawer(defaultTab = 'signin') {
  const drawer = document.getElementById('signupDrawer');
  if (drawer) {
    drawer.classList.add('active');
    switchTab(defaultTab);
  }
}

// Close Drawer
function closeDrawer() {
  const drawer = document.getElementById('signupDrawer');
  if (drawer) {
    drawer.classList.remove('active');
  }
}

function openAuthDrawer(tab) { openDrawer(tab || 'signin'); }
function closeAuthDrawer() { closeDrawer(); }

// Switch between Sign In and Sign Up tabs
function switchTab(mode) {
  const signinTab = document.getElementById('signinTab');
  const signupTab = document.getElementById('signupTab');
  const signinForm = document.getElementById('signinForm');
  const signupForm = document.getElementById('signupForm');
  const drawerTitle = document.getElementById('drawerTitle');

  if (mode === 'signin') {
    if (signinTab) signinTab.classList.add('active');
    if (signupTab) signupTab.classList.remove('active');
    if (signinForm) signinForm.style.display = 'flex';
    if (signupForm) signupForm.style.display = 'none';
    if (drawerTitle) drawerTitle.textContent = 'Welcome Back';
  } else {
    if (signupTab) signupTab.classList.add('active');
    if (signinTab) signinTab.classList.remove('active');
    if (signupForm) signupForm.style.display = 'flex';
    if (signinForm) signinForm.style.display = 'none';
    if (drawerTitle) drawerTitle.textContent = 'Create Account';
  }
}

// Global Navbar Scroll Handler for white background contrast
function handleGlobalNavbarScroll() {
  const header = document.querySelector('.site-header');
  if (header) {
    const threshold = window.innerHeight ? window.innerHeight - 80 : 100;
    header.classList.toggle('scrolled', window.scrollY > threshold);
  }
}

window.addEventListener('scroll', handleGlobalNavbarScroll);

// Document-level Event Delegation for Open/Close Drawer Controls
document.addEventListener('click', (e) => {
  // Open Drawer trigger
  if (e.target.closest('.btn-signin') || e.target.closest('#openSignupBtn')) {
    e.preventDefault();
    openDrawer('signin');
  }

  // Close Drawer triggers (Cross button or dark background overlay)
  if (e.target.closest('#closeDrawerBtn') || e.target.closest('.close-btn') || e.target.closest('#drawerOverlay') || e.target.id === 'closeDrawerBtn') {
    e.preventDefault();
    closeDrawer();
  }
});

// ESC Key Close Trigger
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDrawer();
});

// Event Listeners on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  const openBtn = document.getElementById('openSignupBtn');
  const closeBtn = document.getElementById('closeDrawerBtn');
  const overlay = document.getElementById('drawerOverlay');
  const signinForm = document.getElementById('signinForm');
  const signupForm = document.getElementById('signupForm');

  if (signinForm) {
    signinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('signinEmail').value.trim();
      alert(`Welcome back! Logged in as ${email}`);
      signinForm.reset();
      closeDrawer();
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('fullName')?.value.trim() || '';
      alert(`Account created successfully for ${name}!`);
      signupForm.reset();
      closeDrawer();
    });
  }
});
