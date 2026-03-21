// ── KaamConnect Auth Utilities ──

function saveUser(user) {
  localStorage.setItem('kc_token', user.token);
  localStorage.setItem('kc_user', JSON.stringify({ ...user, token: undefined }));
}

function getUser() {
  try {
    const u = localStorage.getItem('kc_user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
}

function getToken() {
  return localStorage.getItem('kc_token');
}

function logout() {
  localStorage.removeItem('kc_token');
  localStorage.removeItem('kc_user');
  window.location.href = '/login.html';
}

function requireAuth(role) {
  const user = getUser();
  const token = getToken();
  if (!user || !token) {
    window.location.href = '/login.html';
    return null;
  }
  if (role && user.role !== role) {
    window.location.href = user.role === 'worker' ? '/dashboard-worker.html' : '/dashboard-employer.html';
    return null;
  }
  return user;
}

function redirectIfLoggedIn() {
  const user = getUser();
  const token = getToken();
  if (user && token) {
    window.location.href = user.role === 'worker' ? '/dashboard-worker.html' : '/dashboard-employer.html';
  }
}

// Show toast notifications
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

// Render star rating
function renderStars(rating, max = 5) {
  let html = '<div class="stars">';
  for (let i = 1; i <= max; i++) {
    html += `<span class="star${i > rating ? ' empty' : ''}">★</span>`;
  }
  html += `</div>`;
  return html;
}

// Generate avatar initials
function avatarInitials(name) {
  return name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';
}

// Format currency
function formatAmount(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

// Format date
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Inject navbar for authenticated pages
function injectNavbar(page) {
  const user = getUser();
  const dashboardLink = user?.role === 'worker' ? '/dashboard-worker.html' : '/dashboard-employer.html';
  const navEl = document.getElementById('main-navbar');
  if (!navEl) return;
  navEl.innerHTML = `
    <div class="navbar-inner">
      <a href="/" class="navbar-brand">
        <img src="/img/logo.svg" alt="KaamConnect" style="height: 44px; width: auto;">
        <div class="brand-text">
          <div class="brand-main">KAAM</div>
          <div class="brand-sub">CONNECT</div>
        </div>
      </a>
      <div class="hamburger" onclick="document.querySelector('.navbar-links').classList.toggle('open')">
        <span></span><span></span><span></span>
      </div>
      <div class="navbar-links" id="nav-links">
        <a href="/browse-jobs.html" class="${page==='browse'?'active':''}">Browse Jobs</a>
        <a href="/browse-workers.html" class="${page==='workers'?'active':''}">Find Workers</a>
        ${user ? `
          <a href="${dashboardLink}" class="${page==='dashboard'?'active':''}">Dashboard</a>
          ${user.role==='employer' ? `<a href="/post-job.html" class="${page==='post'?'active':''}">Post Job</a>` : ''}
          <a href="/my-bookings.html" class="${page==='bookings'?'active':''}">My Bookings</a>
          <div class="nav-user-menu">
            <div class="nav-avatar" onclick="window.location.href='${dashboardLink}'" title="${user.name}">
              ${user.profilePhoto ? `<img src="${user.profilePhoto}" alt="${user.name}">` : avatarInitials(user.name)}
            </div>
            <button class="btn btn-secondary btn-sm" onclick="logout()">Logout</button>
          </div>
        ` : `
          <a href="/login.html" class="btn-nav-login ${page==='login'?'active':''}">Login</a>
          <a href="/signup.html" class="btn-nav-signup btn">Sign Up</a>
        `}
      </div>
    </div>
  `;
}

window.saveUser = saveUser;
window.getUser = getUser;
window.getToken = getToken;
window.logout = logout;
window.requireAuth = requireAuth;
window.redirectIfLoggedIn = redirectIfLoggedIn;
window.showToast = showToast;
window.renderStars = renderStars;
window.avatarInitials = avatarInitials;
window.formatAmount = formatAmount;
window.formatDate = formatDate;
window.injectNavbar = injectNavbar;
