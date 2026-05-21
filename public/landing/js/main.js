/* ============================================
   MAIN.JS — Interacciones del sitio
   ============================================ */

(function () {
  'use strict';

  /* ------------------------------------------
     1. PARALLAX BACKGROUND — Hero section
     The background layer is 150% tall (top:-25%, bottom:-25%).
     On scroll, we shift it at 40% of scroll speed → parallax feel.
     overflow:hidden on .hero keeps it perfectly contained.
  ------------------------------------------ */
  const parallaxBg   = document.getElementById('hero-parallax-bg');
  const heroSection  = document.getElementById('hero');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let ticking = false;
  let lastScrollY = 0;

  function updateParallax() {
    if (!parallaxBg || prefersReduced) return;

    const heroRect   = heroSection.getBoundingClientRect();
    const heroTop    = heroRect.top;   // distance from viewport top to hero top
    const heroHeight = heroRect.height;

    // Only animate while the hero is at least partially visible
    if (heroTop > window.innerHeight || heroTop + heroHeight < 0) {
      ticking = false;
      return;
    }

    // How far has the hero traveled through the viewport? (0 = top of VP, 1 = bottom)
    // We use scrollY and the hero's offsetTop for a stable calculation
    const scrollIntoHero = window.scrollY - heroSection.offsetTop;

    // Parallax shift: background moves at 40% of scroll speed
    // Negative: as user scrolls DOWN, bg moves DOWN (slower = parallax)
    const shift = scrollIntoHero * 0.40;

    // Clamp so we never push past the extra 25% padding we gave the layer
    const maxShift = heroHeight * 0.25;
    const clampedShift = Math.max(-maxShift, Math.min(maxShift, shift));

    parallaxBg.style.transform = `translate3d(0, ${clampedShift}px, 0)`;
    ticking = false;
  }

  function onScroll() {
    lastScrollY = window.scrollY;
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateParallax);
    }
  }

  // Initialize position on load
  if (!prefersReduced) {
    window.addEventListener('scroll', onScroll, { passive: true });
    updateParallax();
  }


  const navbar = document.getElementById('navbar');

  function handleScroll() {
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // run on load


  /* ------------------------------------------
     2. HAMBURGER MENU — Toggle
  ------------------------------------------ */
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileMenu   = document.getElementById('mobile-menu');

  function openMobileMenu() {
    hamburgerBtn.classList.add('open');
    mobileMenu.classList.add('open');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // prevent background scroll
  }

  function closeMobileMenu() {
    hamburgerBtn.classList.remove('open');
    mobileMenu.classList.remove('open');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburgerBtn.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.contains('open');
    isOpen ? closeMobileMenu() : openMobileMenu();
  });

  // Close menu when a mobile link is clicked
  document.querySelectorAll('.mobile-nav-link, .mobile-actions .btn').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  // Close menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileMenu();
  });

  // Close menu if clicking outside (on overlay)
  document.addEventListener('click', (e) => {
    if (
      mobileMenu.classList.contains('open') &&
      !mobileMenu.contains(e.target) &&
      !hamburgerBtn.contains(e.target)
    ) {
      closeMobileMenu();
    }
  });


  /* ------------------------------------------
     3. ACTIVE NAV LINK — Highlight on scroll
  ------------------------------------------ */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  function setActiveLink() {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}` || (current === '' && link.id === 'nav-home')) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', setActiveLink, { passive: true });


  /* ------------------------------------------
     4. HERO IMAGE — Fallback copy from assets
  ------------------------------------------ */
  const heroImg = document.getElementById('hero-img');

  if (heroImg) {
    heroImg.addEventListener('error', function () {
      // Try alternative path
      if (!this.dataset.retried) {
        this.dataset.retried = '1';
        this.src = './assets/images/hero_electrical.png';
      } else {
        this.parentElement.classList.add('img-fallback');
        this.style.display = 'none';
      }
    });
  }


  /* ------------------------------------------
     5. ENTRANCE ANIMATIONS — Intersection Observer
  ------------------------------------------ */
  const animatedEls = document.querySelectorAll(
    '.hero-badge, .hero-title, .hero-subtitle, .hero-cta, .hero-stats, .hero-visual'
  );

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    animatedEls.forEach(el => {
      el.style.animationPlayState = 'paused';
      observer.observe(el);
    });
  }


  /* ------------------------------------------
     6. SMOOTH SCROLL — For anchor links
  ------------------------------------------ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      if (href === '#nosotros') { e.preventDefault(); return; } // handled by nosotros toggle
      if (href === '#servicios') { e.preventDefault(); return; } // handled by servicios toggle

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = 80; // navbar height
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });


  /* ------------------------------------------
     7. LOGO FALLBACK — Show text if image fails
  ------------------------------------------ */
  const logoImg = document.querySelector('.logo-img');
  const logoFallback = document.querySelector('.logo-fallback');

  if (logoImg && logoFallback) {
    logoImg.addEventListener('error', () => {
      logoImg.style.display = 'none';
      logoFallback.style.display = 'flex';
    });
  }


  /* ------------------------------------------
     8. NOSOTROS + SERVICIOS — Mutual-exclusive sections
     Only one can be open at a time.
     Home button closes both.
  ------------------------------------------ */
  const nosotrosSection = document.getElementById('nosotros');
  const serviciosSection = document.getElementById('servicios');
  const btnNosotros      = document.getElementById('btn-nosotros');
  // folder-tab elements removed — new nosotros uses GSAP storytelling
  let nCurrent = 0; // kept for safety (prev/next refs are null-checked below)

  function closeAll() {
    nosotrosSection && nosotrosSection.classList.remove('open');
    serviciosSection && serviciosSection.classList.remove('open');
  }

  function openSection(section) {
    // Close all other sections INSTANTLY so the layout is stable
    [nosotrosSection, serviciosSection].forEach(s => {
      if (s && s !== section && s.classList.contains('open')) {
        s.style.transition = 'none';
        s.classList.remove('open');
        void s.offsetHeight; // force synchronous reflow
        s.style.transition = '';
      }
    });

    // Open the target section (starts its CSS transition)
    section.classList.add('open');

    // ROOT CAUSE FIX: the section starts at max-height:0 so the page has no
    // scrollable room until the transition finishes. We must wait for the
    // max-height transition to complete before scrolling — only then does the
    // document have enough height to actually reach this section.
    function onTransitionEnd(e) {
      if (e.propertyName !== 'max-height') return;
      section.removeEventListener('transitionend', onTransitionEnd);
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (section === nosotrosSection && typeof window.initNosotrosAnimations === 'function') {
        window.initNosotrosAnimations();
      }
    }
    section.addEventListener('transitionend', onTransitionEnd);

    // Safety fallback: if transitionend never fires (e.g. prefers-reduced-motion
    // or the section was somehow already open), scroll after the known duration.
    setTimeout(() => {
      section.removeEventListener('transitionend', onTransitionEnd);
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (section === nosotrosSection && typeof window.initNosotrosAnimations === 'function') {
        window.initNosotrosAnimations();
      }
    }, 900);
  }

  function toggleNosotros() {
    if (!nosotrosSection) return;
    if (nosotrosSection.classList.contains('open')) {
      nosotrosSection.classList.remove('open');
    } else {
      openSection(nosotrosSection);
    }
  }

  function toggleServicios() {
    if (!serviciosSection) return;
    if (serviciosSection.classList.contains('open')) {
      serviciosSection.classList.remove('open');
    } else {
      openSection(serviciosSection);
    }
  }

  // Home links → close both and scroll to top
  document.querySelectorAll('a[href="#"], #nav-home, #mobile-home').forEach(link => {
    link.addEventListener('click', () => {
      closeAll();
    });
  });

  // Nosotros button
  if (btnNosotros) {
    btnNosotros.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      toggleNosotros();
    });
  }

  // Servicios triggers (navbar link + hero button)
  const serviciosTriggers = document.querySelectorAll('a[href="#servicios"], button[data-target="servicios"]');
  serviciosTriggers.forEach(trigger => {
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      toggleServicios();
    });
  });

  const btnServiciosHero = document.getElementById('btn-servicios-hero');
  if (btnServiciosHero) {
    btnServiciosHero.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      toggleServicios();
    });
  }

})();
