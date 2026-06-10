/* ================================================================
   PREMIUM MOTION SYSTEM — Grupo Rojim / Luminoa
   GSAP 3 + ScrollTrigger + Canvas Particles + Micro-interactions
   ================================================================ */

(function () {
  'use strict';

  /* --- Safety guard ----------------------------------------- */
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('[PremiumMotion] GSAP / ScrollTrigger not loaded. Skipping.');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ──────────────────────────────────────────────────────────────
     1. HERO ENTRANCE SEQUENCE
     Staggered cinematic reveal: badge → title → subtitle → CTA → stats → visual
  ────────────────────────────────────────────────────────────── */
  function initHeroEntrance() {
    if (prefersReduced) return;

    /* Reset initial states — avoids flash before GSAP takes over */
    gsap.set([
      '.hero-badge', '.hero-title', '.hero-subtitle',
      '.hero-cta > *', '.hero-stats', '.hero-visual'
    ], { opacity: 0 });

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      delay: 0.1
    });

    tl.to('.hero-badge', { opacity: 1, y: 0, duration: 0.7 })
      .fromTo('.hero-title',
        { y: 44, opacity: 0 },
        { y: 0,  opacity: 1, duration: 1.05, clearProps: 'all' }, '-=0.38')
      .fromTo('.hero-subtitle',
        { y: 26, opacity: 0 },
        { y: 0,  opacity: 1, duration: 0.85 }, '-=0.55')
      .fromTo('.hero-cta > *',
        { y: 20, opacity: 0 },
        { y: 0,  opacity: 1, duration: 0.65, stagger: 0.13 }, '-=0.50')
      .fromTo('.hero-stats',
        { y: 16, opacity: 0 },
        { y: 0,  opacity: 1, duration: 0.60 }, '-=0.38')
      .fromTo('.hero-visual',
        { x: 40, opacity: 0 },
        { x: 0,  opacity: 1, duration: 1.15, ease: 'power2.out' }, '-=1.05');
  }


  /* ──────────────────────────────────────────────────────────────
     2. HERO IMAGE — Continuous float + glow breathe
  ────────────────────────────────────────────────────────────── */
  function initHeroFloat() {
    if (prefersReduced) return;

    const wrapper  = document.querySelector('.hero-image-wrapper');
    const floatCard = document.querySelector('.hero-float-card');
    const glow     = document.querySelector('.hero-image-glow');

    if (wrapper) {
      /* Vertical float */
      gsap.to(wrapper, {
        y: -16, duration: 3.8, ease: 'sine.inOut', repeat: -1, yoyo: true
      });
      /* Very subtle roll */
      gsap.to(wrapper, {
        rotation: 0.65, duration: 5.2, ease: 'sine.inOut',
        repeat: -1, yoyo: true, transformOrigin: '50% 50%'
      });
    }

    /* Float card counter-drift for visual depth */
    if (floatCard) {
      gsap.to(floatCard, {
        y: 8, rotation: -0.5, duration: 4.4,
        ease: 'sine.inOut', repeat: -1, yoyo: true
      });
    }

    /* Glow breathe */
    if (glow) {
      gsap.to(glow, {
        opacity: 0.9, scale: 1.08, duration: 3.2,
        ease: 'sine.inOut', repeat: -1, yoyo: true
      });
    }
  }


  /* ──────────────────────────────────────────────────────────────
     3. CANVAS PARTICLES — Industrial amber dust / embers
     Lightweight: ~50 particles max, hardware-accelerated
  ────────────────────────────────────────────────────────────── */
  function initParticles() {
    if (prefersReduced) return;

    const canvas = document.getElementById('hero-particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let rafId = null;
    let alive = true;

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function makeParticle(startRandom) {
      return {
        x:      Math.random() * canvas.width,
        y:      startRandom ? Math.random() * canvas.height : canvas.height + 8,
        r:      Math.random() * 1.7 + 0.3,
        vx:     (Math.random() - 0.5) * 0.32,
        vy:     -(Math.random() * 0.42 + 0.14),
        alpha:  Math.random() * 0.32 + 0.07,
        hue:    Math.random() * 38 + 16,       /* amber 16°–54° */
        sat:    Math.random() * 28 + 60,       /* 60%–88% */
        life:   1.0,
        decay:  Math.random() * 0.0014 + 0.0006
      };
    }

    function boot(randomY) {
      const count = Math.min(52, Math.floor(canvas.width / 22));
      particles = Array.from({ length: count }, () => makeParticle(randomY));
    }

    function tick() {
      if (!alive) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0, n = particles.length; i < n; i++) {
        const p = particles[i];
        p.x    += p.vx;
        p.y    += p.vy;
        p.life -= p.decay;

        const a = p.alpha * p.life;
        if (a <= 0.005) { particles[i] = makeParticle(false); continue; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.283185);
        ctx.fillStyle = `hsla(${p.hue},${p.sat}%,70%,${a.toFixed(3)})`;
        ctx.fill();
      }
      rafId = requestAnimationFrame(tick);
    }

    resize();
    boot(true);
    tick();

    window.addEventListener('resize', () => { resize(); boot(false); }, { passive: true });

    /* Pause when hero scrolled out of view */
    const hero = document.getElementById('hero');
    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          alive = true;
          if (!rafId) tick();
        } else {
          alive = false;
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }, { threshold: 0 }).observe(hero);
    }
  }


  /* ──────────────────────────────────────────────────────────────
     4. SCROLL REVEALS — data-reveal + data-stagger system
  ────────────────────────────────────────────────────────────── */
  function initScrollReveals() {
    if (prefersReduced) return;

    /* Single-element reveals: data-reveal="up|left|right|fade" */
    gsap.utils.toArray('[data-reveal]').forEach(el => {
      const dir   = el.dataset.reveal || 'up';
      const delay = parseFloat(el.dataset.delay || 0);
      const from  = dir === 'up'    ? { y: 42, opacity: 0 }
                  : dir === 'left'  ? { x: -42, opacity: 0 }
                  : dir === 'right' ? { x: 42, opacity: 0 }
                  :                   { opacity: 0 };

      gsap.from(el, {
        ...from, duration: 0.95, delay, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 87%', toggleActions: 'play none none none' }
      });
    });

    /* Stagger containers: data-stagger */
    gsap.utils.toArray('[data-stagger]').forEach(wrap => {
      const children = Array.from(wrap.children);
      if (!children.length) return;
      gsap.from(children, {
        y: 34, opacity: 0, duration: 0.78, stagger: 0.10, ease: 'power3.out',
        scrollTrigger: { trigger: wrap, start: 'top 84%', toggleActions: 'play none none none' }
      });
    });
  }


  /* ──────────────────────────────────────────────────────────────
     5. STATS COUNTER — Numbers count up on scroll-enter
  ────────────────────────────────────────────────────────────── */
  function initStatsCounter() {
    document.querySelectorAll('.stat-number, .nos-stat-num').forEach(el => {
      const raw     = el.textContent.trim();
      const hasPlus = raw.startsWith('+');
      const num     = parseInt(raw.replace(/\D/g, ''), 10);
      if (isNaN(num) || num < 2) return;

      el.textContent = hasPlus ? '+0' : '0';
      const obj = { v: 0 };

      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter() {
          gsap.to(obj, {
            v: num, duration: 1.7, ease: 'power2.out',
            onUpdate() { el.textContent = (hasPlus ? '+' : '') + Math.round(obj.v); }
          });
        }
      });
    });
  }


  /* ──────────────────────────────────────────────────────────────
     6. NAVBAR COMPACT — Height-compresses after 80 px scroll
  ────────────────────────────────────────────────────────────── */
  function initNavbarCompact() {
    /* Deshabilitado: la navbar permanece fija sin compactar al hacer scroll */
  }


  /* ──────────────────────────────────────────────────────────────
     7. SERVICIOS — Scroll reveal (Framer Motion–style)
  ────────────────────────────────────────────────────────────── */
  function initServiciosReveal() {
    if (prefersReduced) return;
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    const header = document.querySelector('.srv-header');
    if (header) {
      gsap.from(header.children, {
        opacity: 0,
        y: 40,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: header,
          start: 'top 82%',
          once: true
        }
      });
    }

    document.querySelectorAll('.srv-block').forEach(block => {
      const content = block.querySelector('.srv-block-content');
      const visual = block.querySelector('.srv-block-visual');

      if (content) {
        gsap.from(content.children, {
          opacity: 0,
          y: 40,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: block,
            start: 'top 78%',
            once: true
          }
        });
      }

      if (visual) {
        gsap.from(visual, {
          opacity: 0,
          y: 40,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: block,
            start: 'top 78%',
            once: true
          }
        });
      }
    });

    const valores = document.getElementById('srv-valores');
    if (valores) {
      gsap.from('.srv-valor-card', {
        opacity: 0,
        y: 40,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: valores,
          start: 'top 82%',
          once: true
        }
      });
    }
  }


  /* ──────────────────────────────────────────────────────────────
     8. MAGNETIC BUTTONS — CTA + primary hover magnetic pull
  ────────────────────────────────────────────────────────────── */
  function initButtonMagnetic() {
    if (prefersReduced) return;
    /* Only on non-touch devices */
    if (window.matchMedia('(hover: none)').matches) return;

    document.querySelectorAll('.btn-cta.btn-lg, .btn-primary').forEach(btn => {
      btn.addEventListener('mousemove', function (e) {
        const r = this.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width  / 2) * 0.15;
        const y = (e.clientY - r.top  - r.height / 2) * 0.15;
        gsap.to(this, { x, y, duration: 0.35, ease: 'power2.out', overwrite: true });
      });

      btn.addEventListener('mouseleave', function () {
        gsap.to(this, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1,0.5)', overwrite: true });
      });
    });
  }


  /* ──────────────────────────────────────────────────────────────
     9. PARALLAX HERO AMBIENT GLOW — Moves opposite to scroll
  ────────────────────────────────────────────────────────────── */
  function initAmbientGlowParallax() {
    if (prefersReduced) return;
    const glow = document.querySelector('.hero-ambient-glow');
    if (!glow) return;

    gsap.to(glow, {
      y: '-25%',
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.2
      }
    });
  }


  /* ──────────────────────────────────────────────────────────────
     INIT
  ────────────────────────────────────────────────────────────── */
  function init() {
    initHeroEntrance();
    initHeroFloat();
    initParticles();
    initScrollReveals();
    initStatsCounter();
    initNavbarCompact();
    initServiciosReveal();
    initButtonMagnetic();
    initAmbientGlowParallax();
    /* initNosotrosReveal removed — nosotros.js handles all nosotros animations */
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
