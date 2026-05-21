/* ============================================
   NOSOTROS.JS — Animaciones GSAP + ScrollTrigger
   Inicializado una sola vez cuando la sección abre.
   ============================================ */

var nosotrosInitialized = false;

function initNosotrosAnimations() {
  if (nosotrosInitialized) return;
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  nosotrosInitialized = true;
  gsap.registerPlugin(ScrollTrigger);

  /* Delay para que la sección termine de expandirse (max-height transition) */
  setTimeout(function () {

    ScrollTrigger.refresh();

    /* ── BLOQUE 1: Hero ── */
    var tl1 = gsap.timeline();

    tl1
      .from('#nos-hero-eyebrow', {
        opacity: 0, y: 18, duration: 0.55, ease: 'power2.out'
      }, 0.05)
      .from('#nos-hero-title', {
        opacity: 0, y: 44, duration: 0.85, ease: 'power3.out'
      }, 0.22)
      .from('#nos-hero-sub', {
        opacity: 0, y: 28, duration: 0.65, ease: 'power2.out'
      }, 0.48)
      .from('#nos-hero-stats', {
        opacity: 0, y: 18, duration: 0.55, ease: 'power2.out'
      }, 0.66)
      .from('#nos-hero-visual', {
        opacity: 0, scale: 0.88, duration: 1, ease: 'power2.out'
      }, 0.18);

    /* ── BLOQUE 2: Timeline ── */
    ScrollTrigger.create({
      trigger: '#nos-timeline',
      start: 'top 78%',
      onEnter: function () {
        /* Reveal header */
        gsap.from('.nos-block-header', {
          opacity: 0, y: 32, duration: 0.7, ease: 'power2.out'
        });

        /* Line fill reveal */
        gsap.to('#nos-tl-fill', {
          opacity: 1, duration: 0.3, delay: 0.4
        });

        /* Timeline items staggered */
        gsap.from('.nos-tl-item', {
          opacity: 0,
          y: 55,
          stagger: 0.22,
          duration: 0.85,
          ease: 'power2.out',
          delay: 0.3
        });
      },
      once: true
    });

    /* ── BLOQUE 3: Doble unidad ── */
    ScrollTrigger.create({
      trigger: '#nos-duo',
      start: 'top 74%',
      onEnter: function () {
        gsap.from('.nos-duo-header', {
          opacity: 0, y: 30, duration: 0.65, ease: 'power2.out'
        });
        gsap.from('#nos-card-rojim', {
          opacity: 0, x: -65, duration: 0.9, ease: 'power3.out', delay: 0.15
        });
        gsap.from('#nos-card-luminoa', {
          opacity: 0, x: 65, duration: 0.9, ease: 'power3.out', delay: 0.3
        });
        gsap.from('.nos-duo-connector', {
          opacity: 0, scale: 0.75, duration: 0.6, ease: 'back.out(1.6)', delay: 0.45
        });
      },
      once: true
    });

    /* ── BLOQUE 4: Misión + Visión + Valores ── */
    ScrollTrigger.create({
      trigger: '#nos-mvv',
      start: 'top 74%',
      onEnter: function () {
        gsap.from('.nos-mvv-card', {
          opacity: 0, y: 50, stagger: 0.18, duration: 0.85, ease: 'power2.out'
        });
      },
      once: true
    });

    ScrollTrigger.create({
      trigger: '#nos-valores-grid',
      start: 'top 78%',
      onEnter: function () {
        gsap.from('.nos-valor-item', {
          opacity: 0,
          scale: 0.78,
          y: 22,
          stagger: 0.07,
          duration: 0.6,
          ease: 'back.out(1.3)'
        });
      },
      once: true
    });

    /* ── BLOQUE 5: Diferenciales ── */
    ScrollTrigger.create({
      trigger: '#nos-diff',
      start: 'top 74%',
      onEnter: function () {
        gsap.from('.nos-diff-header', {
          opacity: 0, y: 28, duration: 0.65, ease: 'power2.out'
        });
        gsap.from('.nos-diff-item', {
          opacity: 0,
          y: 42,
          stagger: 0.07,
          duration: 0.7,
          ease: 'power2.out',
          delay: 0.18
        });
      },
      once: true
    });

    /* ── BLOQUE 6: CTA ── */
    ScrollTrigger.create({
      trigger: '#nos-cta',
      start: 'top 78%',
      onEnter: function () {
        gsap.from('.nos-cta-inner', {
          opacity: 0, y: 55, duration: 0.9, ease: 'power2.out'
        });
      },
      once: true
    });

  }, 500);
}
