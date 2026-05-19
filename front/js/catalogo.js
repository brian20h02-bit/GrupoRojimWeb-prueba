/**
 * catalogo.js — LUMINOA | Grupo Rojim
 * Dynamic product catalog — fetches data from the backend API.
 * All product cards and sidebar filters are populated at runtime.
 */
"use strict";

// ─── State ────────────────────────────────────────────────────────────────────
const catalogState = {
  query: "",
  category: "all",
  brand: "",
  page: 1,
  limit: 24,
  total: 0,
  pages: 0,
  loading: false,
};

// ─── SVG Icons (keyed by category slug) ──────────────────────────────────────
const CATEGORY_ICONS = {
  conductores: `<svg class="cat-card-icon" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 48 C24 32, 36 64, 48 48 C60 32, 72 64, 84 48" stroke="currentColor" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M12 60 C24 44, 36 76, 48 60 C60 44, 72 76, 84 60" stroke="currentColor" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.4"/><circle cx="12" cy="48" r="5" fill="currentColor"/><circle cx="84" cy="48" r="5" fill="currentColor"/></svg>`,
  tableros: `<svg class="cat-card-icon" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="18" y="20" width="60" height="56" rx="4" stroke="currentColor" stroke-width="4"/><rect x="26" y="30" width="18" height="12" rx="2" stroke="currentColor" stroke-width="3"/><rect x="52" y="30" width="18" height="12" rx="2" stroke="currentColor" stroke-width="3"/><line x1="26" y1="54" x2="44" y2="54" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="26" y1="62" x2="38" y2="62" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="58" cy="58" r="8" stroke="currentColor" stroke-width="3"/><circle cx="58" cy="58" r="3" fill="currentColor"/></svg>`,
  interruptores: `<svg class="cat-card-icon" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="22" y="18" width="52" height="60" rx="6" stroke="currentColor" stroke-width="4"/><rect x="32" y="30" width="14" height="22" rx="4" stroke="currentColor" stroke-width="3"/><rect x="50" y="30" width="14" height="22" rx="4" stroke="currentColor" stroke-width="3"/><circle cx="39" cy="64" r="4" stroke="currentColor" stroke-width="2.5"/><circle cx="57" cy="64" r="4" stroke="currentColor" stroke-width="2.5"/><line x1="39" y1="36" x2="39" y2="44" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
  protecciones: `<svg class="cat-card-icon" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M48 14 L76 26 L76 48 C76 64 62 76 48 82 C34 76 20 64 20 48 L20 26 Z" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><polyline points="36 48 44 56 60 40" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  iluminacion: `<svg class="cat-card-icon" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="48" cy="40" r="16" stroke="currentColor" stroke-width="4"/><path d="M36 58 L36 66 L60 66 L60 58" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="40" y1="66" x2="40" y2="72" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="56" y1="66" x2="56" y2="72" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="48" y1="24" x2="48" y2="18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
  canalizaciones: `<svg class="cat-card-icon" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="36" width="72" height="14" rx="7" stroke="currentColor" stroke-width="4"/><rect x="12" y="56" width="72" height="14" rx="7" stroke="currentColor" stroke-width="4" opacity="0.5"/><path d="M30 36 L30 28 Q30 20 38 20 L58 20 Q66 20 66 28 L66 36" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" fill="none"/></svg>`,
  herramientas: `<svg class="cat-card-icon" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M26 70 L56 40" stroke="currentColor" stroke-width="10" stroke-linecap="round"/><path d="M60 20 L76 36 L72 40 L56 24 Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round" fill="none"/><path d="M72 20 C78 24 80 32 76 36" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" fill="none"/></svg>`,
  cintas: `<svg class="cat-card-icon" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="48" cy="48" r="28" stroke="currentColor" stroke-width="4"/><circle cx="48" cy="48" r="12" stroke="currentColor" stroke-width="3.5"/><circle cx="48" cy="48" r="4" fill="currentColor"/><path d="M36 36 Q30 28 22 26" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.5"/><path d="M60 36 Q66 28 74 26" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.5"/></svg>`,
  otros: `<svg class="cat-card-icon" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="48" cy="48" r="14" stroke="currentColor" stroke-width="4"/><path d="M48 22 L48 16 M48 80 L48 74 M22 48 L16 48 M80 48 L74 48 M32 32 L27 27 M68 68 L64 64 M64 32 L69 27 M32 64 L27 69" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>`,
};

function getCategoryIcon(slug) {
  return CATEGORY_ICONS[slug] || CATEGORY_ICONS.otros;
}

// ─── API helpers ──────────────────────────────────────────────────────────────
async function apiFetch(endpoint) {
  const res = await fetch(APP_CONFIG.backendUrl + endpoint);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

// ─── Load categories into sidebar ────────────────────────────────────────────
async function fetchCategories() {
  try {
    const { categories } = await apiFetch("/api/public/categories");
    const list = document.getElementById("cat-filter-list");
    if (!list) return;

    const total = categories.reduce((s, c) => s + (c._count ? c._count.products : 0), 0);
    const totalEl = document.getElementById("cat-total-count");
    if (totalEl) totalEl.textContent = total;

    categories.forEach((cat) => {
      const li = document.createElement("li");
      li.innerHTML =
        `<button class="filter-item" data-filter="${escHtml(cat.slug)}">` +
        `<span class="fi-indicator" aria-hidden="true"></span>` +
        escHtml(cat.name) +
        `<span class="fi-count">${cat._count ? cat._count.products : 0}</span>` +
        `</button>`;
      list.appendChild(li);
    });

    list.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-item");
      if (!btn) return;
      list.querySelectorAll(".filter-item").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      catalogState.category = btn.dataset.filter || "all";
      fetchProducts(true);
    });
  } catch (err) {
    console.warn("Categorías no disponibles:", err.message);
  }
}

// ─── Load brands into dropdown ────────────────────────────────────────────────
async function fetchBrands() {
  try {
    const { brands } = await apiFetch("/api/public/brands");
    const select = document.getElementById("filter-marca");
    if (!select) return;
    brands.forEach((brand) => {
      const opt = document.createElement("option");
      opt.value = brand.toLowerCase();
      opt.textContent = brand;
      select.appendChild(opt);
    });
  } catch (err) {
    console.warn("Marcas no disponibles:", err.message);
  }
}

// ─── Fetch and render products ────────────────────────────────────────────────
async function fetchProducts(reset) {
  if (catalogState.loading) return;
  if (reset) catalogState.page = 1;
  catalogState.loading = true;

  const params = new URLSearchParams();
  if (catalogState.query)              params.set("q",        catalogState.query);
  if (catalogState.category !== "all") params.set("category", catalogState.category);
  if (catalogState.brand)              params.set("brand",    catalogState.brand);
  params.set("page",  String(catalogState.page));
  params.set("limit", String(catalogState.limit));

  showSkeletons(reset);

  try {
    const data = await apiFetch("/api/public/products?" + params.toString());
    catalogState.total = data.pagination.total;
    catalogState.pages = data.pagination.pages;
    renderProducts(data.products, reset);
    updateUI();
  } catch (err) {
    console.error("Error al cargar productos:", err);
    showError();
  } finally {
    catalogState.loading = false;
  }
}

// ─── Render product cards ──────────────────────────────────────────────────────
function renderProducts(products, reset) {
  const grid    = document.getElementById("cat-grid");
  const emptyEl = document.getElementById("cat-empty");

  grid.querySelectorAll(".cat-skeleton").forEach((s) => s.remove());

  if (products.length === 0 && reset) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  if (reset) {
    grid.querySelectorAll(".cat-card").forEach((c) => c.remove());
  }

  const frag = document.createDocumentFragment();

  products.forEach((product) => {
    const el = document.createElement("article");
    el.className = "cat-card";
    el.dataset.category = product.category ? product.category.slug : "";
    el.dataset.brand     = (product.brand || "").toLowerCase();
    el.dataset.stock     = "true";
    if (product.featured) el.dataset.featured = "true";

    const iconSlug  = (product.category && (product.category.iconSlug || product.category.slug)) || "otros";
    const desc      = product.description || "Consultá disponibilidad y especificaciones técnicas.";
    const priceHtml = product.price && parseFloat(product.price) > 0
      ? `<p class="cat-card-price">$${formatPrice(product.price)}</p>`
      : "";

    const resolvedImageUrl = product.imageUrl
      ? product.imageUrl.startsWith("/")
        ? APP_CONFIG.backendUrl + product.imageUrl
        : product.imageUrl
      : null;

    const visualHtml = resolvedImageUrl
      ? `<div class="cat-card-visual cat-card-visual--img" aria-hidden="true">` +
          `<img src="${escHtml(resolvedImageUrl)}" alt="${escHtml(product.name)}" class="cat-card-img" loading="lazy" />` +
          `<div class="card-visual-footer">` +
            `<span class="cat-card-badge">${escHtml(product.code)}</span>` +
            `<span class="cat-card-stock in-stock">En stock</span>` +
          `</div>` +
        `</div>`
      : `<div class="cat-card-visual cat-img-${iconSlug}" aria-hidden="true">` +
          getCategoryIcon(iconSlug) +
          `<div class="card-visual-footer">` +
            `<span class="cat-card-badge">${escHtml(product.code)}</span>` +
            `<span class="cat-card-stock in-stock">En stock</span>` +
          `</div>` +
        `</div>`;

    el.innerHTML =
      visualHtml +
      `<div class="cat-card-body">` +
        `<span class="cat-card-num" aria-hidden="true">${escHtml(product.brand)}</span>` +
        `<h3 class="cat-card-title">${escHtml(product.name)}</h3>` +
        `<p class="cat-card-desc">${escHtml(desc)}</p>` +
        priceHtml +
        `<button class="cat-card-cta" data-code="${escHtml(product.code)}" data-name="${escHtml(product.name)}">` +
          `Solicitar cotización` +
          `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>` +
        `</button>` +
      `</div>`;

    el.querySelector(".cat-card-cta").addEventListener("click", function () {
      const code = this.dataset.code;
      const name = this.dataset.name;
      window.location.href =
        `mailto:ventas@luminoa.com.ar?subject=${encodeURIComponent("Consulta: " + name + " (" + code + ")")}`;
    });

    frag.appendChild(el);
  });

  grid.appendChild(frag);
  observeNewCards();
}

// ─── Skeleton loaders ─────────────────────────────────────────────────────────
function showSkeletons(reset) {
  const grid    = document.getElementById("cat-grid");
  const emptyEl = document.getElementById("cat-empty");
  emptyEl.hidden = true;

  if (reset) {
    grid.querySelectorAll(".cat-card, .cat-skeleton, .cat-error").forEach((el) => el.remove());
  }

  for (let i = 0; i < 6; i++) {
    const s = document.createElement("div");
    s.className = "cat-skeleton";
    s.setAttribute("aria-hidden", "true");
    s.innerHTML =
      `<div class="skel-visual"></div>` +
      `<div class="skel-body">` +
        `<div class="skel-line skel-brand"></div>` +
        `<div class="skel-line skel-title"></div>` +
        `<div class="skel-line skel-desc"></div>` +
        `<div class="skel-line skel-cta"></div>` +
      `</div>`;
    grid.appendChild(s);
  }
}

function showError() {
  const grid = document.getElementById("cat-grid");
  grid.querySelectorAll(".cat-skeleton").forEach((s) => s.remove());
  if (!grid.querySelector(".cat-error")) {
    const err = document.createElement("div");
    err.className = "cat-empty cat-error";
    err.innerHTML =
      `<div class="cat-empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>` +
      `<p class="cat-empty-title">Error al cargar productos</p>` +
      `<p class="cat-empty-sub">Verificá que el servidor esté corriendo en <strong>localhost:3000</strong>.</p>` +
      `<button class="cat-btn-outline" id="btn-retry">Reintentar</button>`;
    grid.appendChild(err);
    document.getElementById("btn-retry").addEventListener("click", () => {
      err.remove();
      fetchProducts(true);
    });
  }
}

// ─── Update counters and load-more ────────────────────────────────────────────
function updateUI() {
  const countEl = document.querySelector(".cat-results-count");
  if (countEl) {
    countEl.innerHTML =
      `<span id="results-count">${catalogState.total}</span> producto${catalogState.total !== 1 ? "s" : ""}`;
  }

  const wrap = document.getElementById("cat-load-more-wrap");
  if (!wrap) return;
  const showing = Math.min(catalogState.page * catalogState.limit, catalogState.total);
  const showEl  = document.getElementById("load-more-showing");
  const totalEl = document.getElementById("load-more-total");
  if (showEl)  showEl.textContent  = showing;
  if (totalEl) totalEl.textContent = catalogState.total;
  wrap.hidden = catalogState.page >= catalogState.pages;
}

// ─── Search ───────────────────────────────────────────────────────────────────
function initSearch() {
  const input = document.getElementById("filter-search");
  if (!input) return;
  let timer = null;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      catalogState.query = input.value.trim();
      fetchProducts(true);
    }, 380);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      clearTimeout(timer);
      catalogState.query = input.value.trim();
      fetchProducts(true);
    }
  });
}

// ─── Filters ──────────────────────────────────────────────────────────────────
function initFilters() {
  const brandSelect = document.getElementById("filter-marca");
  if (brandSelect) {
    brandSelect.addEventListener("change", () => {
      catalogState.brand = brandSelect.value;
      fetchProducts(true);
    });
  }
  document.getElementById("btn-clear-filters")?.addEventListener("click", clearFilters);
  document.getElementById("btn-reset-empty")?.addEventListener("click", clearFilters);
}

function clearFilters() {
  catalogState.query    = "";
  catalogState.category = "all";
  catalogState.brand    = "";

  const searchInput = document.getElementById("filter-search");
  if (searchInput) searchInput.value = "";

  document.querySelectorAll("#cat-filter-list .filter-item").forEach((b) => b.classList.remove("active"));
  document.querySelector('#cat-filter-list [data-filter="all"]')?.classList.add("active");

  const brandSelect = document.getElementById("filter-marca");
  if (brandSelect) brandSelect.value = "";

  fetchProducts(true);
}

// ─── Load more ────────────────────────────────────────────────────────────────
function initLoadMore() {
  document.getElementById("btn-load-more")?.addEventListener("click", () => {
    catalogState.page++;
    fetchProducts(false);
  });
}

// ─── IntersectionObserver animations ─────────────────────────────────────────
let cardObserver = null;

function initCardObserver() {
  if (!("IntersectionObserver" in window)) return;
  cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
}

function observeNewCards() {
  if (!cardObserver) return;
  document.querySelectorAll(".cat-card:not(.is-visible)").forEach((el) => cardObserver.observe(el));
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function initNavbar() {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        navbar.classList.toggle("scrolled", window.scrollY > 40);
        ticking = false;
      });
      ticking = true;
    }
  });
  document.querySelectorAll("[data-auth-link]").forEach((el) => {
    el.href = APP_CONFIG.backendUrl + "/dashboard";
  });
}

// ─── Hero scroll ──────────────────────────────────────────────────────────────
function initHero() {
  document.getElementById("btn-scroll-cat")?.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("cat-main")?.scrollIntoView({ behavior: "smooth" });
  });
}

// ─── Sidebar drawer (mobile) ──────────────────────────────────────────────────
function initSidebar() {
  const sidebar  = document.getElementById("cat-sidebar");
  const overlay  = document.getElementById("sidebar-overlay");
  const openBtn  = document.getElementById("sidebar-toggle");
  const closeBtn = document.getElementById("sidebar-close");

  function openSidebar() {
    sidebar?.classList.add("open");
    overlay?.classList.add("active");
    document.body.style.overflow = "hidden";
    openBtn?.setAttribute("aria-expanded", "true");
  }
  function closeSidebar() {
    sidebar?.classList.remove("open");
    overlay?.classList.remove("active");
    document.body.style.overflow = "";
    openBtn?.setAttribute("aria-expanded", "false");
  }
  openBtn?.addEventListener("click",  openSidebar);
  closeBtn?.addEventListener("click", closeSidebar);
  overlay?.addEventListener("click",  closeSidebar);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSidebar(); });
}

// ─── View toggle (grid / list) ────────────────────────────────────────────────
function initViewToggle() {
  const grid    = document.getElementById("cat-grid");
  const btnGrid = document.getElementById("view-grid");
  const btnList = document.getElementById("view-list");

  btnGrid?.addEventListener("click", () => {
    grid?.classList.remove("list-view");
    btnGrid.classList.add("active");
    btnList?.classList.remove("active");
    localStorage.setItem("cat-view", "grid");
  });
  btnList?.addEventListener("click", () => {
    grid?.classList.add("list-view");
    btnList.classList.add("active");
    btnGrid?.classList.remove("active");
    localStorage.setItem("cat-view", "list");
  });
  if (localStorage.getItem("cat-view") === "list") btnList?.click();
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPrice(price) {
  const num = parseFloat(price);
  if (isNaN(num)) return price;
  return num.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  initNavbar();
  initHero();
  initSidebar();
  initViewToggle();
  initCardObserver();
  initFilters();
  initSearch();
  initLoadMore();

  await Promise.all([fetchCategories(), fetchBrands()]);
  await fetchProducts(true);
});
