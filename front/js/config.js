/* ============================================
   CONFIG.JS — URLs y variables de entorno del frontend
   Para cambiar el backend (local → producción) solo
   editá BACKEND_URL aquí.
   ============================================ */

var APP_CONFIG = {
  backendUrl: 'http://localhost:3000'
};

/* Aplica la URL de login a todos los elementos con data-auth-link */
document.addEventListener('DOMContentLoaded', function () {
  var loginUrl = APP_CONFIG.backendUrl + '/login';
  var links = document.querySelectorAll('[data-auth-link]');
  for (var i = 0; i < links.length; i++) {
    links[i].href = loginUrl;
  }
});
