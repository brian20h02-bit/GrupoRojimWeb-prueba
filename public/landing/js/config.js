/* ============================================
   CONFIG.JS — URLs y variables de entorno del frontend
   Para cambiar el backend (local → producción) solo
   editá BACKEND_URL aquí.
   ============================================ */

var APP_CONFIG = {
  backendUrl: 'http://localhost:3000'
};

/* Fija la navbar al viewport (evita que #__next rompa position:fixed) */
function mountFixedNavbar() {
  var navbar = document.getElementById('navbar');
  if (!navbar) return;

  if (navbar.parentElement !== document.body) {
    document.body.prepend(navbar);
  }

  navbar.style.setProperty('position', 'fixed', 'important');
  navbar.style.setProperty('top', '0', 'important');
  navbar.style.setProperty('left', '0', 'important');
  navbar.style.setProperty('right', '0', 'important');
  navbar.style.setProperty('width', '100%', 'important');
  navbar.style.setProperty('z-index', '10000', 'important');
}

/* Oculta al bajar, muestra al subir o en el tope — no sticky */
function initNavbarHideOnScroll() {
  var navbar = document.getElementById('navbar');
  if (!navbar) return;

  var lastScrollY = window.scrollY;
  var delta = 6;
  var ticking = false;

  function isMobileMenuOpen() {
    var menu = document.getElementById('mobile-menu');
    return menu && menu.classList.contains('open');
  }

  function update() {
    var currentY = window.scrollY;

    if (isMobileMenuOpen() || currentY <= 0) {
      navbar.classList.remove('nav-hidden');
    } else if (currentY > lastScrollY + delta) {
      navbar.classList.add('nav-hidden');
    } else if (currentY < lastScrollY - delta) {
      navbar.classList.remove('nav-hidden');
    }

    lastScrollY = currentY <= 0 ? 0 : currentY;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  update();
}

function initFixedNavbar() {
  mountFixedNavbar();
  initNavbarHideOnScroll();
  window.addEventListener('resize', mountFixedNavbar, { passive: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFixedNavbar);
} else {
  initFixedNavbar();
}

/* Aplica la URL de login a todos los elementos con data-auth-link */
document.addEventListener('DOMContentLoaded', function () {
  var loginUrl = APP_CONFIG.backendUrl + '/login';
  var links = document.querySelectorAll('[data-auth-link]');
  for (var i = 0; i < links.length; i++) {
    links[i].href = loginUrl;
  }
});
