/* ============================================
   CONFIG.JS — Producción (Vercel)
   backendUrl vacío = rutas relativas al mismo dominio
   ============================================ */

var APP_CONFIG = {
  backendUrl: ''
};

/* Aplica la URL de login a todos los elementos con data-auth-link */
document.addEventListener('DOMContentLoaded', function () {
  var loginUrl = APP_CONFIG.backendUrl + '/login';
  var links = document.querySelectorAll('[data-auth-link]');
  for (var i = 0; i < links.length; i++) {
    links[i].href = loginUrl;
  }
});
