// ── KaamConnect Theme Switcher ──

(function() {
  const savedTheme = localStorage.getItem('kc_theme');
  const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  
  if (savedTheme === 'light' || (!savedTheme && systemPrefersLight)) {
    document.documentElement.classList.add('light-mode');
  }
})();

function toggleTheme() {
  const isLight = document.documentElement.classList.toggle('light-mode');
  localStorage.setItem('kc_theme', isLight ? 'light' : 'dark');
  updateThemeIcon();
  updateLogos();
}

function updateThemeIcon() {
  const icon = document.getElementById('theme-toggle-icon');
  if (!icon) return;
  const isLight = document.documentElement.classList.contains('light-mode');
  icon.innerHTML = isLight ? '🌙' : '☀️';
}

function updateLogos() {
  const isLight = document.documentElement.classList.contains('light-mode');
  const logos = document.querySelectorAll('img[src*="logo.svg"], img[src*="logo-light.svg"]');
  logos.forEach(img => {
    img.src = isLight ? '/img/logo-light.svg' : '/img/logo.svg';
  });
}

// Ensure icon and logos are correct when page loads
window.addEventListener('DOMContentLoaded', () => {
  updateThemeIcon();
  updateLogos();
});

// Since auth.js might inject the navbar after DOMContentLoaded, we should also observe for dynamic logo changes or just call updateLogos globally if needed.
window.updateLogos = updateLogos;
