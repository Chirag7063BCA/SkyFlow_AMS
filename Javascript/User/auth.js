/**
 * SkyFlow Authentication & Drawer Slider Logic
 * File: Javascript/User/auth.js
 * 
 * Simple drawer toggle, tab switcher (Sign In / Sign Up), 
 * form submission, and Google OAuth placeholder.
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

function openAuthDrawer(tab) {
  openDrawer(tab || 'signin');
}

function closeAuthDrawer() {
  closeDrawer();
}

// Switch between Sign In and Sign Up tabs
function switchTab(mode) {
  const signinTab = document.getElementById('signinTab');
  const signupTab = document.getElementById('signupTab');
  const signinForm = document.getElementById('signinForm');
  const signupForm = document.getElementById('signupForm');
  const drawerTitle = document.getElementById('drawerTitle');
  const authSwitchFooter = document.getElementById('authSwitchFooter');

  if (mode === 'signin') {
    if (signinTab) signinTab.classList.add('active');
    if (signupTab) signupTab.classList.remove('active');
    if (signinForm) signinForm.style.display = 'flex';
    if (signupForm) signupForm.style.display = 'none';
    if (drawerTitle) drawerTitle.textContent = 'Welcome Back';
    if (authSwitchFooter) {
      authSwitchFooter.innerHTML = `Don't have an account? <a href="#" onclick="switchTab('signup'); return false;">Create account</a>`;
    }
  } else {
    if (signupTab) signupTab.classList.add('active');
    if (signinTab) signinTab.classList.remove('active');
    if (signupForm) signupForm.style.display = 'flex';
    if (signinForm) signinForm.style.display = 'none';
    if (drawerTitle) drawerTitle.textContent = 'Create Account';
    if (authSwitchFooter) {
      authSwitchFooter.innerHTML = `Already have an account? <a href="#" onclick="switchTab('signin'); return false;">Sign in</a>`;
    }
  }
}

// Google OAuth Handler Placeholder
function handleGoogleLogin() {
  alert("Google OAuth connection will be configured here later.");
}

// Event Listeners on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  const openBtn = document.getElementById('openSignupBtn');
  const closeBtn = document.getElementById('closeDrawerBtn');
  const overlay = document.getElementById('drawerOverlay');
  const signinForm = document.getElementById('signinForm');
  const signupForm = document.getElementById('signupForm');

  // Open drawer trigger
  const handleOpenClick = (e) => {
    e.preventDefault();
    openDrawer('signin');
  };

  if (openBtn) openBtn.addEventListener('click', handleOpenClick);

  document.addEventListener('click', (e) => {
    if (e.target.closest('.btn-signin')) {
      handleOpenClick(e);
    }
  });

  // Close triggers
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  // Sign In Submit
  if (signinForm) {
    signinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('signinEmail').value.trim();
      alert(`Welcome back! Logged in as ${email}`);
      signinForm.reset();
      closeDrawer();
    });
  }

  // Sign Up Submit
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('fullName').value.trim();
      const password = document.getElementById('signupPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }

      alert(`Account created successfully for ${name}!`);
      signupForm.reset();
      closeDrawer();
    });
  }
});
