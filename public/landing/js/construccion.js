/* ============================================================
   construccion.js — LUMINOA · Grupo Rojim
   Página: Comenzar tu Construcción
   Stack: GSAP 3.12.5 + ScrollTrigger · Vanilla JS
   ============================================================ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────
     CONSTANTS
  ───────────────────────────────────────────────────────── */
  var TOTAL_STAGES = 5;
  var IS_MOBILE    = window.matchMedia('(max-width: 900px)').matches;
  var SVG_W        = 560; /* SVG viewBox width for finish rect animation */

  var STAGE_NAMES = ['Planificación', 'Estructura', 'Instalaciones', 'Terminaciones', 'Resultado'];
  var PILL_LABELS = ['Base', 'Estructura', 'Eléctr.', 'Terminac.', 'Resultado'];

  /* ─────────────────────────────────────────────────────────
     DOM REFS
  ───────────────────────────────────────────────────────── */
  var storyEl    = document.getElementById('stx-story');
  var textPanels = Array.from(document.querySelectorAll('.stx-stage-text'));
  var dots       = Array.from(document.querySelectorAll('.stx-dot'));
  var progFill   = document.getElementById('stx-prog-fill');
  var currLabel  = document.getElementById('stx-curr');
  var badgeNum   = document.getElementById('stx-badge-num');
  var badgeName  = document.getElementById('stx-badge-name');
  var badgeDot   = document.querySelector('.stx-badge-dot');
  var pills      = Array.from(document.querySelectorAll('.stx-lpill'));

  /* ─────────────────────────────────────────────────────────
     HERO REVEAL (on load)
  ───────────────────────────────────────────────────────── */
  function heroReveal() {
    var words = document.querySelectorAll('.stx-word');
    var sub   = document.querySelector('.stx-hero-sub');
    var ctas  = document.querySelector('.stx-hero-ctas');
    var stats = document.querySelector('.stx-hero-stats');

    if (!words.length) return;

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to(words, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, delay: 0.3 });
    if (sub)   tl.to(sub,   { opacity: 1, duration: 0.6 }, '-=0.3');
    if (ctas)  tl.to(ctas,  { opacity: 1, duration: 0.5 }, '-=0.3');
    if (stats) tl.to(stats, { opacity: 1, duration: 0.5 }, '-=0.2');
  }

  /* ─────────────────────────────────────────────────────────
     TEXT STAGE SWITCHER
     Uses CSS transitions for smooth in/out
  ───────────────────────────────────────────────────────── */
  var currentStage = -1;

  function activateTextStage(idx) {
    if (idx === currentStage) return;
    var prev = currentStage;
    currentStage = idx;

    /* Panels */
    textPanels.forEach(function (p, i) {
      if (i === idx) {
        p.classList.remove('is-exiting');
        p.classList.add('is-active');
      } else if (i === prev) {
        p.classList.remove('is-active');
        p.classList.add('is-exiting');
        /* Remove exiting class after transition */
        setTimeout(function () { p.classList.remove('is-exiting'); }, 550);
      } else {
        p.classList.remove('is-active', 'is-exiting');
      }
    });

    /* Badge */
    if (badgeNum)  badgeNum.textContent  = String(idx + 1).padStart(2, '0');
    if (badgeName) badgeName.textContent = STAGE_NAMES[idx];

    /* Pills */
    pills.forEach(function (p, i) {
      p.classList.toggle('is-built', i <= idx);
      if (i < PILL_LABELS.length) p.textContent = PILL_LABELS[i];
    });

    /* Dot nav */
    dots.forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });

    /* Counter */
    if (currLabel) currLabel.textContent = String(idx + 1).padStart(2, '0');

    /* Hide story scroll cue once user moves past stage 0 */
    var storyCue = document.querySelector('.stx-story-scroll-cue');
    if (storyCue) storyCue.classList.toggle('is-hidden', idx > 0);
  }

  function updateStoryUI(progress) {
    if (progFill) progFill.style.width = (progress * 100).toFixed(1) + '%';
  }

  /* ─────────────────────────────────────────────────────────
     GSAP SCRUB TIMELINE (desktop)

     Architecture:
     Each stage occupies 1 unit (0-4). Within each unit:
       - The new layer fades/slides IN
       - The previous layer dims to 28% opacity (ambient)
     This eliminates the "superposition" visual confusion
     because older layers become faint background context
     while the current layer dominates visually.

     stl-finish uses SVG-native clipPath (sc-finish-rect)
     instead of CSS clip-path for cross-browser reliability.
  ───────────────────────────────────────────────────────── */
  function initScrollStory() {
    if (!storyEl || !window.ScrollTrigger) return;

    gsap.registerPlugin(ScrollTrigger);

    /* ── GSAP initial states ─────────────────────────── */
    gsap.set('.stl-found',  { opacity: 0, y: 12 });
    gsap.set('.stl-struct', { opacity: 0, y: 24 });
    gsap.set('.stl-elec',   { opacity: 0 });
    gsap.set('.stl-finish', { opacity: 0 });
    gsap.set('.stl-final',  { opacity: 0, scale: 0.96 });
    /* SVG clipPath rect starts at 0 width */
    gsap.set('#sc-finish-rect', { attr: { width: 0 } });

    /* Show stage 0 text immediately */
    activateTextStage(0);

    /* ── SCRUB TIMELINE ──────────────────────────────── */
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#stx-story',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2,
        onUpdate: function (self) {
          var idx = Math.min(Math.floor(self.progress * TOTAL_STAGES), TOTAL_STAGES - 1);
          activateTextStage(idx);
          updateStoryUI(self.progress);
        },
        onLeaveBack: function () {
          activateTextStage(0);
          updateStoryUI(0);
        },
      },
    });

    /*
     * Timeline layout (total duration = 5 units, one per stage):
     *
     * 0.0 → 1.0 : Stage 0 — Cimiento appears
     * 1.0 → 2.0 : Stage 1 — Estructura appears, Cimiento dims
     * 2.0 → 3.0 : Stage 2 — Instalaciones appear, Estructura dims
     * 3.0 → 4.0 : Stage 3 — Terminaciones sweep left→right, Instalaciones dim
     * 4.0 → 5.0 : Stage 4 — Resultado final, Terminaciones settle
     */

    tl
      /* ── STAGE 0: Cimiento ──────────────────────── */
      .to('.stl-found', {
        opacity: 1, y: 0,
        duration: 0.85, ease: 'power2.out',
      }, 0)

      /* ── STAGE 1: Estructura ─────────────────────── */
      .to('.stl-struct', {
        opacity: 1, y: 0,
        duration: 0.85, ease: 'power2.out',
      }, 1)
      /* dim cimiento to ambient */
      .to('.stl-found', {
        opacity: 0.22,
        duration: 0.5, ease: 'power1.inOut',
      }, 1.5)

      /* ── STAGE 2: Instalaciones ──────────────────── */
      .to('.stl-elec', {
        opacity: 1,
        duration: 0.8, ease: 'power1.inOut',
      }, 2)
      /* dim estructura to ambient */
      .to('.stl-struct', {
        opacity: 0.28,
        duration: 0.5, ease: 'power1.inOut',
      }, 2.5)

      /* ── STAGE 3: Terminaciones ──────────────────── */
      /* First make the finish group visible, then sweep the clipPath rect */
      .to('.stl-finish', {
        opacity: 1,
        duration: 0.15, ease: 'none',
      }, 3)
      .to('#sc-finish-rect', {
        attr: { width: SVG_W },
        duration: 1.1, ease: 'power1.inOut',
      }, 3.05)
      /* dim elec to ambient */
      .to('.stl-elec', {
        opacity: 0.22,
        duration: 0.5, ease: 'power1.inOut',
      }, 3.5)

      /* ── STAGE 4: Resultado final ────────────────── */
      .to('.stl-final', {
        opacity: 1, scale: 1,
        duration: 0.9, ease: 'power2.out',
      }, 4)
      /* brighten finish slightly for the final reveal */
      .to('.stl-finish', {
        opacity: 0.72,
        duration: 0.4, ease: 'power1.inOut',
      }, 4.3);
  }

  /* ─────────────────────────────────────────────────────────
     DOT NAVIGATION
  ───────────────────────────────────────────────────────── */
  function initDotNav() {
    if (!storyEl) return;
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var i = parseInt(dot.dataset.goto, 10);
        if (isNaN(i)) return;
        var storyTop = storyEl.getBoundingClientRect().top + window.scrollY;
        var storyH   = storyEl.offsetHeight;
        var viewH    = window.innerHeight;
        /* Each of the 5 stages is 1/5 of scrollable distance */
        var target = storyTop + (i / TOTAL_STAGES) * (storyH - viewH) + 2;
        window.scrollTo({ top: target, behavior: 'smooth' });
      });
    });
  }

  /* ─────────────────────────────────────────────────────────
     MOBILE: reveal all layers when scene enters viewport
  ───────────────────────────────────────────────────────── */
  function initMobileScene() {
    if (!IS_MOBILE) return;

    var sceneSvg = document.querySelector('.stx-scene-svg');
    if (sceneSvg) {
      var obs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              ['.stl-found', '.stl-struct', '.stl-elec', '.stl-finish', '.stl-final'].forEach(function (sel) {
                var el = document.querySelector(sel);
                if (el) { el.style.opacity = '1'; }
              });
              /* Also open the SVG clipPath rect fully */
              var rect = document.getElementById('sc-finish-rect');
              if (rect) rect.setAttribute('width', '560');
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      obs.observe(sceneSvg);
    }
  /* Ensure stage 0 is marked active (HTML already has it but reset state) */
  activateTextStage(0);
}

/* ─────────────────────────────────────────────────────
     MOBILE: tap + swipe stage navigation
  ───────────────────────────────────────────────────── */
  function initMobileTabs() {
    if (!IS_MOBILE) return;

    /* Label dots with stage numbers and wire click → activateTextStage */
    dots.forEach(function (dot, i) {
      dot.innerHTML = '<span aria-hidden="true">' + String(i + 1).padStart(2, '0') + '</span>';
      dot.addEventListener('click', function () { activateTextStage(i); });
    });

    /* Swipe left/right on the text panel to move between stages */
    var textsWrap = document.getElementById('stx-texts-wrap');
    if (!textsWrap) return;
    var startX = 0;
    textsWrap.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
    }, { passive: true });
    textsWrap.addEventListener('touchend', function (e) {
      var diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) < 48) return; /* ignore micro-swipes */
      if (diff > 0 && currentStage < TOTAL_STAGES - 1) activateTextStage(currentStage + 1);
      else if (diff < 0 && currentStage > 0) activateTextStage(currentStage - 1);
    }, { passive: true });
  }
     REVEAL ELEMENTS (form / cta sections)
  ───────────────────────────────────────────────────────── */
  function initRevealEls() {
    var revealEls = document.querySelectorAll('.stx-reveal-el');
    if (!revealEls.length) return;
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach(function (el) { obs.observe(el); });
  }

  /* ─────────────────────────────────────────────────────────
     FORM: submit handler
  ───────────────────────────────────────────────────────── */
  function initForm() {
    var form       = document.getElementById('stx-form');
    var successEl  = document.getElementById('stx-form-success');
    var submitBtn  = document.getElementById('stx-submit-btn');
    var submitText = document.getElementById('stx-submit-text');

    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (submitBtn)  submitBtn.disabled = true;
      if (submitText) submitText.textContent = 'Enviando…';
      setTimeout(function () {
        form.style.display = 'none';
        if (successEl) successEl.hidden = false;
      }, 1200);
    });
  }

  /* ─────────────────────────────────────────────────────────
     FILE DROP
  ───────────────────────────────────────────────────────── */
  function initFileDrop() {
    var dropZone  = document.getElementById('stx-file-drop');
    var fileInput = document.getElementById('stx-file-input');
    var selected  = document.getElementById('stx-file-selected');

    if (!dropZone || !fileInput) return;

    function showFile(file) {
      if (!selected || !file) return;
      selected.hidden = false;
      var dropUI = dropZone.querySelector('.file-drop-ui');
      if (dropUI) dropUI.style.display = 'none';
      selected.textContent = file.name + ' — ' + (file.size / 1024).toFixed(0) + ' KB';
    }

    fileInput.addEventListener('change', function () {
      if (fileInput.files[0]) showFile(fileInput.files[0]);
    });

    dropZone.addEventListener('dragover', function (e) {
      e.preventDefault(); dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', function () {
      dropZone.classList.remove('drag-over');
    });
    dropZone.addEventListener('drop', function (e) {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      var file = e.dataTransfer.files[0];
      if (!file) return;
      var allowed = ['pdf', 'dwg', 'png', 'jpg', 'jpeg'];
      if (!allowed.includes(file.name.split('.').pop().toLowerCase())) return;
      var dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      showFile(file);
    });
  }

  /* ─────────────────────────────────────────────────────────
     NAVBAR: ensure z-index above sticky section
  ───────────────────────────────────────────────────────── */
  function ensureNavbar() {
    var navbar = document.querySelector('.navbar');
    if (navbar) navbar.style.zIndex = '1000';
  }

  /* ─────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────── */
  function init() {
    ensureNavbar();
    heroReveal();

    if (IS_MOBILE) {
      initMobileScene();
      initMobileTabs();
    } else {
      initScrollStory();
      initDotNav();
    }

    initRevealEls();
    initForm();
    initFileDrop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
