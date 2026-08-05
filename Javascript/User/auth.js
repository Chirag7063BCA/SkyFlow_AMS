/**
 * SkyFlow Authentication Drawer, Custom Form Logic, and Clerk Integration
 * File: Javascript/User/auth.js
 *
 * This talks to Clerk (https://clerk.com) via the headless clerk-js SDK
 * (window.Clerk, loaded via the <script data-clerk-publishable-key ...>
 * tag in signup.html). Your own HTML forms are kept — this file just
 * wires their submit handlers to Clerk's sign-up / sign-in / OAuth APIs
 * instead of faking a user in localStorage.
 *
 * Requires in signup.html <head>:
 *   <script async crossorigin="anonymous"
 *     data-clerk-publishable-key="pk_test_..."
 *     src="https://YOUR-FRONTEND-API.clerk.accounts.dev/npm/@clerk/clerk-js@latest/dist/clerk.browser.js">
 *   </script>
 */

/**
 * Global User State Object (kept for the rest of your app to read,
 * mirrors window.Clerk.user once loaded)
 */
window.SkyFlowUser = {
  isSignedIn: false,
  id: null,
  name: '',
  email: '',
  avatarUrl: null,
  initials: 'SF'
};

/**
 * Helper: Get Initials from Name
 */
function getInitials(name) {
  if (!name) return 'SF';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Helper: Split a "Full Name" input into Clerk's firstName / lastName
 */
function splitFullName(fullName) {
  const trimmed = (fullName || '').trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const parts = trimmed.split(/\s+/);
  const firstName = parts.shift();
  const lastName = parts.join(' ');
  return { firstName, lastName };
}

/**
 * Helper: Pull a friendly Clerk error message out of a thrown error
 */
function getClerkErrorMessage(err, fallback) {
  if (err && Array.isArray(err.errors) && err.errors.length > 0) {
    return err.errors[0].longMessage || err.errors[0].message || fallback;
  }
  return (err && err.message) || fallback;
}

/**
 * Helper: show/hide an inline error message under a form
 */
function showFormError(elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';
}
function clearFormError(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = '';
  el.style.display = 'none';
}

/**
 * Build a SkyFlowUser-shaped object from a Clerk User object
 */
function mapClerkUser(clerkUser) {
  if (!clerkUser) {
    return { isSignedIn: false, id: null, name: '', email: '', avatarUrl: null, initials: 'SF' };
  }
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || 'SkyFlow Member';
  const email = (clerkUser.primaryEmailAddress && clerkUser.primaryEmailAddress.emailAddress) || '';
  return {
    isSignedIn: true,
    id: clerkUser.id,
    name: name,
    email: email,
    avatarUrl: clerkUser.imageUrl || null,
    initials: getInitials(name)
  };
}

/**
 * Update Navbar Action Area (Sign In Button vs User Avatar Circle)
 * Reads the live Clerk session instead of localStorage.
 */
function updateNavbarAuthState() {
  const clerkUser = window.Clerk ? window.Clerk.user : null;
  const userData = mapClerkUser(clerkUser);
  window.SkyFlowUser = userData;

  const navActionsContainers = document.querySelectorAll('.nav-actions, #navActions');

  navActionsContainers.forEach(container => {
    if (userData.isSignedIn) {
      const avatarHTML = userData.avatarUrl
        ? `<img src="${userData.avatarUrl}" alt="${userData.name}" class="user-avatar-img">`
        : `<div class="user-avatar-circle">${userData.initials}</div>`;

      container.innerHTML = `
        <div class="user-profile-menu">
          <button type="button" class="user-avatar-btn" onclick="toggleUserDropdown(event)" title="${userData.name} (${userData.email})" aria-label="User profile">
            ${avatarHTML}
          </button>
          <div id="user-dropdown" class="user-dropdown-menu">
            <div class="user-dropdown-header">
              <div class="user-dropdown-avatar">${userData.initials}</div>
              <div class="user-dropdown-details">
                <span class="user-dropdown-name">${userData.name}</span>
                <span class="user-dropdown-email">${userData.email}</span>
              </div>
            </div>
            <div class="user-dropdown-divider"></div>
            <a href="index.html#manage" class="user-dropdown-link" onclick="closeUserDropdown()">My Bookings</a>
            <button type="button" class="user-dropdown-link logout-btn" onclick="handleUserSignOut()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <a href="javascript:void(0)" class="btn-signin" onclick="openAuthDrawer('signin')">
          <svg class="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>Sign In / Join</span>
        </a>
      `;
    }
  });
}

/**
 * Toggle / Close User Account Dropdown Menu
 */
function toggleUserDropdown(event) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown) dropdown.classList.toggle('active');
}
function closeUserDropdown() {
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown) dropdown.classList.remove('active');
}

/**
 * Open / Close Authentication Drawer
 */
function openAuthDrawer(defaultTab = 'signin') {
  const drawer = document.getElementById('auth-drawer');
  if (drawer) {
    drawer.classList.add('active');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    switchAuthTab(defaultTab);
  } else {
    console.warn('Auth drawer element #auth-drawer not found in DOM.');
  }
}
function closeAuthDrawer() {
  const drawer = document.getElementById('auth-drawer');
  if (drawer) {
    drawer.classList.remove('active');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

/**
 * Switch Tabs inside Drawer
 */
function switchAuthTab(tabName) {
  const tabSignin = document.getElementById('tab-signin');
  const tabSignup = document.getElementById('tab-signup');
  const sectionSignin = document.getElementById('section-signin');
  const sectionSignup = document.getElementById('section-signup');

  if (tabSignin && tabSignup && sectionSignin && sectionSignup) {
    if (tabName === 'signin') {
      tabSignin.classList.add('active');
      tabSignup.classList.remove('active');
      sectionSignin.classList.add('active');
      sectionSignup.classList.remove('active');
    } else {
      tabSignup.classList.add('active');
      tabSignin.classList.remove('active');
      sectionSignup.classList.add('active');
      sectionSignin.classList.remove('active');
      showSignUpFormStep('drawer'); // always land back on step 1 when opening sign up
    }

    const authBody = document.querySelector('.auth-body');
    if (authBody) authBody.scrollTop = 0;
  }
}

/**
 * Switch Tabs on standalone signup.html page
 */
function switchAuthTabPage(tabName) {
  const tabSignin = document.getElementById('tab-signin-page');
  const tabSignup = document.getElementById('tab-signup-page');
  const sectionSignin = document.getElementById('section-signin-page');
  const sectionSignup = document.getElementById('section-signup-page');

  if (tabSignin && tabSignup && sectionSignin && sectionSignup) {
    if (tabName === 'signin') {
      tabSignin.classList.add('active');
      tabSignup.classList.remove('active');
      sectionSignin.classList.add('active');
      sectionSignup.classList.remove('active');
    } else {
      tabSignup.classList.add('active');
      tabSignin.classList.remove('active');
      sectionSignup.classList.add('active');
      sectionSignin.classList.remove('active');
      showSignUpFormStep('page');
    }
  }
}

/**
 * Toggle between "enter your details" and "enter verification code"
 * within the Sign Up section (both drawer and standalone page).
 */
function showSignUpFormStep(context) {
  const formStepId = context === 'page' ? 'page-signup-form-step' : 'drawer-signup-form-step';
  const verifyStepId = context === 'page' ? 'page-signup-verify-step' : 'drawer-signup-verify-step';
  const formStep = document.getElementById(formStepId);
  const verifyStep = document.getElementById(verifyStepId);
  if (formStep) formStep.style.display = '';
  if (verifyStep) verifyStep.style.display = 'none';
}
function showVerifyStep(context) {
  const formStepId = context === 'page' ? 'page-signup-form-step' : 'drawer-signup-form-step';
  const verifyStepId = context === 'page' ? 'page-signup-verify-step' : 'drawer-signup-verify-step';
  const formStep = document.getElementById(formStepId);
  const verifyStep = document.getElementById(verifyStepId);
  if (formStep) formStep.style.display = 'none';
  if (verifyStep) verifyStep.style.display = '';
}

/**
 * After a successful sign-in/sign-up, close whatever UI is open and
 * land the user back on the right page.
 */
function finishAuthSuccess() {
  updateNavbarAuthState();
  closeAuthDrawer();
  if (window.location.pathname.endsWith('signup.html')) {
    window.location.href = 'index.html';
  }
}

/**
 * SIGN IN — email + password, via Clerk
 */
async function handleSignInSubmit(event, context) {
  event.preventDefault();
  if (!window.Clerk) {
    console.error('Clerk has not loaded yet.');
    return;
  }

  const isPage = context === 'page';
  const emailInput = document.getElementById(isPage ? 'page-signin-email' : 'signin-email');
  const passwordInput = document.getElementById(isPage ? 'page-signin-password' : 'signin-password');
  const errorId = isPage ? 'page-signin-error' : 'signin-error';
  clearFormError(errorId);

  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  try {
    const signInAttempt = await window.Clerk.client.signIn.create({
      identifier: email,
      password: password
    });

    if (signInAttempt.status === 'complete') {
      await window.Clerk.setActive({ session: signInAttempt.createdSessionId });
      finishAuthSuccess();
    } else {
      // e.g. needs_second_factor for MFA-enabled accounts — extend here if you use MFA
      console.warn('Sign in requires further steps:', signInAttempt.status);
      showFormError(errorId, 'Additional verification is required for this account.');
    }
  } catch (err) {
    showFormError(errorId, getClerkErrorMessage(err, 'Could not sign in. Check your email and password.'));
  }
}

/**
 * SIGN UP — step 1: create the account & send the email verification code
 */
async function handleSignUpSubmit(event, context) {
  event.preventDefault();
  if (!window.Clerk) {
    console.error('Clerk has not loaded yet.');
    return;
  }

  const isPage = context === 'page';
  const nameInput = document.getElementById(isPage ? 'page-signup-name' : 'signup-name');
  const emailInput = document.getElementById(isPage ? 'page-signup-email' : 'signup-email');
  const passwordInput = document.getElementById(isPage ? 'page-signup-password' : 'signup-password');
  const confirmInput = document.getElementById(isPage ? 'page-signup-confirm-password' : 'signup-confirm-password');
  const errorId = isPage ? 'page-signup-error' : 'signup-error';
  clearFormError(errorId);

  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';
  const confirmPassword = confirmInput ? confirmInput.value : '';

  if (password !== confirmPassword) {
    showFormError(errorId, 'Passwords do not match. Please re-enter passwords.');
    return;
  }

  const { firstName, lastName } = splitFullName(name);

  try {
    await window.Clerk.client.signUp.create({
      emailAddress: email,
      password: password,
      firstName: firstName,
      lastName: lastName
    });

    await window.Clerk.client.signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

    showVerifyStep(context);
  } catch (err) {
    showFormError(errorId, getClerkErrorMessage(err, 'Could not create your account.'));
  }
}

/**
 * SIGN UP — step 2: confirm the emailed code, then activate the session
 */
async function handleVerifySubmit(event, context) {
  event.preventDefault();
  if (!window.Clerk) {
    console.error('Clerk has not loaded yet.');
    return;
  }

  const isPage = context === 'page';
  const codeInput = document.getElementById(isPage ? 'page-verify-code' : 'verify-code');
  const errorId = isPage ? 'page-verify-error' : 'verify-error';
  clearFormError(errorId);

  const code = codeInput ? codeInput.value.trim() : '';

  try {
    const result = await window.Clerk.client.signUp.attemptEmailAddressVerification({ code });

    if (result.status === 'complete') {
      await window.Clerk.setActive({ session: result.createdSessionId });
      finishAuthSuccess();
    } else {
      showFormError(errorId, 'That code didn\u2019t complete sign up. Double check it and try again.');
    }
  } catch (err) {
    showFormError(errorId, getClerkErrorMessage(err, 'Invalid or expired code. Please try again.'));
  }
}

/**
 * SOCIAL AUTH — Google / Apple / Facebook via Clerk OAuth redirect flow.
 *
 * This redirects the browser away to the provider and back. On return,
 * window.Clerk.handleRedirectCallback() (called on page load below)
 * finishes the sign-in and creates the session.
 *
 * NOTE: for a production app, point redirectUrl at a dedicated
 * /sso-callback route rather than this same page.
 */
async function handleSocialAuth(provider, mode) {
  if (!window.Clerk) {
    console.error('Clerk has not loaded yet.');
    return;
  }

  const strategyMap = {
    google: 'oauth_google',
    apple: 'oauth_apple',
    facebook: 'oauth_facebook'
  };
  const strategy = strategyMap[provider];
  if (!strategy) {
    console.error('Unknown social provider:', provider);
    return;
  }

  const redirectUrl = window.location.href.split('#')[0];
  const redirectUrlComplete = window.location.pathname.endsWith('signup.html')
    ? 'index.html'
    : redirectUrl;

  try {
    const target = mode === 'signup' ? window.Clerk.client.signUp : window.Clerk.client.signIn;
    await target.authenticateWithRedirect({
      strategy: strategy,
      redirectUrl: redirectUrl,
      redirectUrlComplete: redirectUrlComplete
    });
    // Browser navigates away here; nothing else runs after this resolves.
  } catch (err) {
    console.error('Social auth error:', err);
    alert(getClerkErrorMessage(err, 'Could not start ' + provider + ' sign in.'));
  }
}

/**
 * SIGN OUT
 */
async function handleUserSignOut() {
  if (!window.Clerk) return;

  try {
    await window.Clerk.signOut();
  } catch (err) {
    console.error('Sign out error:', err);
  }

  closeUserDropdown();
  updateNavbarAuthState();

  if (window.location.pathname.endsWith('signup.html')) {
    window.location.href = 'index.html';
  }
}

// Global Event Delegation for Sign In / Join buttons
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-signin');
  if (btn) {
    e.preventDefault();
    openAuthDrawer('signin');
  }

  if (!e.target.closest('.user-profile-menu')) {
    closeUserDropdown();
  }
});

// Close drawer on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAuthDrawer();
    closeUserDropdown();
  }
});

/**
 * Boot Clerk once the page + the clerk-js script have both loaded,
 * then keep the navbar in sync with the live session.
 */
window.addEventListener('load', async () => {
  if (!window.Clerk) {
    console.error(
      'window.Clerk is undefined. Check that the Clerk <script data-clerk-publishable-key ...> ' +
      'tag is present in <head> and that your publishable key / Frontend API domain are correct.'
    );
    return;
  }

  await window.Clerk.load();

  // Completes any pending OAuth redirect (Google/Apple/Facebook) sign-in.
  try {
    await window.Clerk.handleRedirectCallback();
  } catch (err) {
    // No redirect in progress — this is expected on a normal page load.
  }

  updateNavbarAuthState();

  // Keep the navbar in sync if the session changes (sign in/out in another tab, etc.)
  window.Clerk.addListener(() => {
    updateNavbarAuthState();
  });
});
