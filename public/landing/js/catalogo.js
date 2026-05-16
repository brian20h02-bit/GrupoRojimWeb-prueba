/* ============================================
   CATALOGO.JS — Interactions for catalogo.html
   ============================================ */

(function () {
  'use strict';

  /* ------------------------------------------
     1. NAVBAR — Hamburger + scrolled state
  ------------------------------------------ */
  const navbar       = document.getElementById('navbar');
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileMenu   = document.getElementById('mobile-menu');

  // Navbar is always "scrolled" on this page (fixed dark bg),
  // but we still add the class on scroll for box-shadow
  navbar && navbar.classList.add('scrolled');

  if (hamburgerBtn && mobileMenu) {
    hamburgerBtn.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.contains('open');
      mobileMenu.classList.toggle('open', !isOpen);
      hamburgerBtn.setAttribute('aria-expanded', String(!isOpen));
      document.body.style.overflow = isOpen ? '' : 'hidden';
    });

    document.querySelectorAll('.mobile-nav-link, .mobile-actions .btn').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        mobileMenu.classList.remove('open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* ------------------------------------------
     2. SMOOTH SCROLL — "Explorar productos" CTA
  ------------------------------------------ */
  const btnScrollCat = document.getElementById('btn-scroll-cat');
  if (btnScrollCat) {
    btnScrollCat.addEventListener('click', e => {
      e.preventDefault();
      const target = document.getElementById('cat-main');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  /* ------------------------------------------
     3. SIDEBAR DRAWER — Mobile slide-in panel
  ------------------------------------------ */
  const sidebarToggle  = document.getElementById('sidebar-toggle');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const sidebarClose   = document.getElementById('sidebar-close');
  const catSidebar     = document.querySelector('.cat-sidebar');

  function openSidebar() {
    if (!catSidebar) return;
    catSidebar.classList.add('sidebar-open');
    if (sidebarOverlay) {
      sidebarOverlay.style.display = 'block';
      // Force reflow so transition fires
      void sidebarOverlay.offsetWidth;
      sidebarOverlay.classList.add('active');
    }
    document.body.style.overflow = 'hidden';
    if (sidebarToggle) sidebarToggle.setAttribute('aria-expanded', 'true');
  }

  function closeSidebar() {
    if (!catSidebar) return;
    catSidebar.classList.remove('sidebar-open');
    if (sidebarOverlay) {
      sidebarOverlay.classList.remove('active');
      sidebarOverlay.addEventListener('transitionend', function hide() {
        sidebarOverlay.style.display = 'none';
        sidebarOverlay.removeEventListener('transitionend', hide);
      }, { once: true });
    }
    document.body.style.overflow = '';
    if (sidebarToggle) sidebarToggle.setAttribute('aria-expanded', 'false');
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', openSidebar);
  }
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
  }
  if (sidebarClose) {
    sidebarClose.addEventListener('click', closeSidebar);
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && catSidebar && catSidebar.classList.contains('sidebar-open')) {
      closeSidebar();
    }
  });

  /* ------------------------------------------
     4. FILTERING SYSTEM
     Filters work together:
     - Category buttons (sidebar list)
     - Brand dropdown
     - Stock checkboxes
     All filters are ANDed together.
  ------------------------------------------ */
  const cards         = document.querySelectorAll('.cat-card');
  const filterBtns    = document.querySelectorAll('.filter-item');
  const marcaSelect   = document.getElementById('filter-marca');
  const checkStock    = document.getElementById('check-stock');
  const checkConsult  = document.getElementById('check-consultar');
  const resultsCount  = document.getElementById('results-count');
  const catEmpty      = document.getElementById('cat-empty');
  const btnClear      = document.getElementById('btn-clear-filters');
  const btnResetEmpty = document.getElementById('btn-reset-empty');

  let activeCategory = 'all';

  function applyFilters() {
    const showStock   = checkStock   ? checkStock.checked   : true;
    const showConsult = checkConsult ? checkConsult.checked : true;

    let visible = 0;

    cards.forEach((card, i) => {
      const category = card.dataset.category || '';
      const inStock  = card.dataset.stock === 'true';

      const catMatch   = activeCategory === 'all' || category === activeCategory;
      const stockMatch = (inStock && showStock) || (!inStock && showConsult);

      const show = catMatch && stockMatch;

      card.classList.toggle('hidden', !show);

      if (show) {
        visible++;
        // Staggered re-entrance animation
        card.style.animationDelay = `${(visible - 1) * 0.04}s`;
        card.style.animation = 'none';
        void card.offsetHeight; // force reflow
        card.style.animation = '';
      }
    });

    if (resultsCount) resultsCount.textContent = visible;
    if (catEmpty) catEmpty.hidden = visible > 0;
  }

  // Category filter buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.filter || 'all';
      applyFilters();
    });
  });

  // Brand dropdown — currently visual only (no brand data on cards),
  // triggers re-filter for future implementation
  marcaSelect && marcaSelect.addEventListener('change', applyFilters);

  // Stock checkboxes
  checkStock   && checkStock.addEventListener('change', applyFilters);
  checkConsult && checkConsult.addEventListener('change', applyFilters);

  // Clear filters
  function clearFilters() {
    activeCategory = 'all';
    filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === 'all'));
    if (marcaSelect)   marcaSelect.value   = '';
    if (checkStock)    checkStock.checked  = true;
    if (checkConsult)  checkConsult.checked = false;
    applyFilters();
  }

  btnClear      && btnClear.addEventListener('click', clearFilters);
  btnResetEmpty && btnResetEmpty.addEventListener('click', clearFilters);

  /* ------------------------------------------
     5. VIEW TOGGLE — Grid / List
  ------------------------------------------ */
  const catGrid  = document.getElementById('cat-grid');
  const btnGrid  = document.getElementById('view-grid');
  const btnList  = document.getElementById('view-list');

  if (btnGrid && btnList && catGrid) {
    btnGrid.addEventListener('click', () => {
      catGrid.classList.remove('list-view');
      btnGrid.classList.add('active');
      btnList.classList.remove('active');
    });

    btnList.addEventListener('click', () => {
      catGrid.classList.add('list-view');
      btnList.classList.add('active');
      btnGrid.classList.remove('active');
    });
  }

  /* ------------------------------------------
     6. CARD CTA — Placeholder interaction
     When real product pages exist, replace
     with router navigation.
  ------------------------------------------ */
  document.querySelectorAll('.cat-card-cta').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      // Placeholder: subtle visual feedback
      btn.textContent = '¡Próximamente!';
      btn.style.pointerEvents = 'none';
      setTimeout(() => {
        btn.innerHTML = `Ver productos
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
          </svg>`;
        btn.style.pointerEvents = '';
      }, 1800);
    });
  });

  /* ------------------------------------------
     7. INTERSECTION OBSERVER — Animate on scroll
  ------------------------------------------ */
  if ('IntersectionObserver' in window) {
    const observeEls = document.querySelectorAll(
      '.cat-feat-card, .cat-card, .cat-benefit-item, .cat-cta-card'
    );

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    observeEls.forEach(el => io.observe(el));
  }

})();
