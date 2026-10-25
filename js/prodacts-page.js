/* Abdullah Store — Products listing page controller
   Search, category, sort, stock, price filters driven by URL params + UI. */

import { db } from "./firebase-config.js";
import {
  collection, query, where, orderBy, getDocs, limit
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  imageUrl, escapeHtml, formatUSD, formatNGN, addToCart, toast
} from "./utilities.js";

const state = {
  search: "",
  category: "",
  sort: "newest",
  stock: "all",
  price: "all"
};

/* --- Read initial state from URL --- */
function readURLState() {
  const p = new URLSearchParams(location.search);
  if (p.get("search")) state.search = p.get("search").trim();
  if (p.get("category")) state.category = p.get("category");
  if (p.get("sort")) state.sort = p.get("sort");
  if (p.get("stock")) state.stock = p.get("stock");
  if (p.get("price")) state.price = p.get("price");

  const searchInput = document.querySelector("[data-search-input]");
  if (searchInput && state.search) searchInput.value = state.search;
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) sortSelect.value = state.sort;
  const stockSelect = document.getElementById("stockSelect");
  if (stockSelect) stockSelect.value = state.stock;
  const priceSelect = document.getElementById("priceSelect");
  if (priceSelect) priceSelect.value = state.price;
}

/* --- Category tabs --- */
async function loadCategoryTabs() {
  const el = document.getElementById("categoryTabs");
  if (!el) return;
  try {
    const snap = await getDocs(collection(db, "categories"));
    const cats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cats.sort((a, b) => (a.order || 0) - (b.order || 0));
    el.innerHTML = `
      <button class="filter-chip ${!state.category ? "active" : ""}" data-cat="">All</button>
      ${cats.map((c) => `
        <button class="filter-chip ${state.category === c.id ? "active" : ""}" data-cat="${c.id}">
          ${escapeHtml(c.name)}
        </button>`).join("")}
    `;
    el.querySelectorAll("[data-cat]").forEach((chip) => {
      chip.addEventListener("click", () => {
        state.category = chip.dataset.cat;
        el.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        updateURL();
        loadProducts();
      });
    });
  } catch (e) {
    console.warn("Category tabs failed:", e);
  }
}

/* --- Fetch + render --- */
async function loadProducts() {
  const grid = document.getElementById("productsGrid");
  const banner = document.getElementById("activeSearch");
  if (!grid) return;

  if (banner) {
    if (state.search) {
      banner.style.display = "block";
      banner.innerHTML = `Search results for "<strong>${escapeHtml(state.search)}</strong>" — 
        <a href="products.html" style="color:var(--green)">clear</a>`;
    } else {
      banner.style.display = "none";
    }
  }

  grid.innerHTML = `
    <div class="product-card"><div class="skeleton skeleton-img"></div><div style="padding:10px"><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line short"></div></div></div>
    <div class="product-card"><div class="skeleton skeleton-img"></div><div style="padding:10px"><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line short"></div></div></div>
    <div class="product-card"><div class="skeleton skeleton-img"></div><div style="padding:10px"><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line short"></div></div></div>
  `;

  try {
    const constraints = [where("enabled", "==", true)];
    if (state.category) constraints.push(where("categoryId", "==", state.category));

    // Sort order — Firestore requires orderBy fields inside composite index
    let orderField = "createdAt";
    let orderDir = "desc";
    if (state.sort === "price_asc")   { orderField = "price"; orderDir = "asc"; }
    if (state.sort === "price_desc")  { orderField = "price"; orderDir = "desc"; }
    if (state.sort === "bestselling") { orderField = "sales"; orderDir = "desc"; }

    const q = query(
      collection(db, "products"),
      ...constraints,
      orderBy(orderField, orderDir),
      limit(200)
    );

    const snap = await getDocs(q);
    let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Client-side filters (search, stock, price)
    list = applyClientFilters(list);

    if (!list.length) {
      grid.innerHTML = `
        <div class="empty" style="grid-column:1/-1;padding:60px 20px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></svg>
          <h3>No products found</h3>
          <p>Try adjusting your filters or search.</p>
          <a href="products.html" class="btn btn-primary">Clear filters</a>
        </div>`;
      return;
    }

    grid.innerHTML = list.map(productCard).join("");
    bindCart(grid, list);
  } catch (err) {
    console.error("Products fetch error:", err);
    // Common case: missing index — show helpful message
    const msg = String(err.message || "");
    grid.innerHTML = `
      <div class="empty" style="grid-column:1/-1;padding:40px 20px">
        <h3>Could not load products</h3>
        <p>${escapeHtml(msg)}</p>
        ${msg.includes("index") ? `<p style="font-size:.85rem;color:var(--muted);margin-top:8px">
          A Firestore composite index is required. Open the browser console for a link to create it.</p>` : ""}
      </div>`;
  }
}

function applyClientFilters(list) {
  let out = list;

  // Search
  if (state.search) {
    const term = state.search.toLowerCase();
    out = out.filter((p) =>
      (p.name || "").toLowerCase().includes(term) ||
      (p.description || "").toLowerCase().includes(term)
    );
  }

  // Stock
  if (state.stock === "instock") {
    out = out.filter((p) => Number(p.stock || 0) > 0);
  }

  // Price
  if (state.price !== "all") {
    const [min, max] = state.price.split("-").map(Number);
    out = out.filter((p) => {
      const price = Number(p.price || 0);
      const disc = Number(p.discount || 0);
      const final = disc > 0 ? price - (price * disc / 100) : price;
      return final >= min && final <= max;
    });
  }

  return out;
}

function productCard(p) {
  const id = p.id;
  const name = escapeHtml(p.name || "Untitled");
  const img = imageUrl(p.images);
  const price = Number(p.price || 0);
  const disc = Number(p.discount || 0);
  const stock = Number(p.stock || 0);
  const outOfStock = stock <= 0;
  const priceNow = disc > 0 ? price - (price * disc / 100) : price;

  return `
  <div class="product-card" data-id="${id}">
    <a href="product-details.html?id=${id}" class="product-card-img">
      <img src="${img}" alt="${name}" loading="lazy">
      ${disc > 0 ? `<span class="product-discount">-${Math.round(disc)}%</span>` : ""}
      ${outOfStock ? `<span class="product-out">Out of Stock</span>` : ""}
    </a>
    <div class="product-card-body">
      <a href="product-details.html?id=${id}" class="product-card-title">${name}</a>
      <div class="price-dual">
        <span class="price-usd">${formatUSD(priceNow)}</span>
        <span class="price-ngn">≈ ${formatNGN(priceNow)}</span>
      </div>
      <div class="product-card-actions">
        <button class="btn btn-primary btn-sm" data-add-cart="${id}" ${outOfStock ? "disabled" : ""}>Add</button>
        <a href="product-details.html?id=${id}" class="btn btn-ghost btn-sm">View</a>
      </div>
    </div>
  </div>`;
}

function bindCart(container, list) {
  const byId = Object.fromEntries(list.map((p) => [p.id, p]));
  container.querySelectorAll("[data-add-cart]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = btn.dataset.addCart;
      const p = byId[id];
      if (!p) return;
      if (Number(p.stock || 0) <= 0) { toast("Out of stock", { type: "error" }); return; }
      addToCart({ ...p, id }, 1);
    });
  });
}

/* --- URL sync --- */
function updateURL() {
  const p = new URLSearchParams();
  if (state.search) p.set("search", state.search);
  if (state.category) p.set("category", state.category);
  if (state.sort && state.sort !== "newest") p.set("sort", state.sort);
  if (state.stock && state.stock !== "all") p.set("stock", state.stock);
  if (state.price && state.price !== "all") p.set("price", state.price);
  const qs = p.toString();
  history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
}

/* --- Wire UI controls --- */
function bindControls() {
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) sortSelect.addEventListener("change", () => {
    state.sort = sortSelect.value; updateURL(); loadProducts();
  });
  const stockSelect = document.getElementById("stockSelect");
  if (stockSelect) stockSelect.addEventListener("change", () => {
    state.stock = stockSelect.value; updateURL(); loadProducts();
  });
  const priceSelect = document.getElementById("priceSelect");
  if (priceSelect) priceSelect.addEventListener("change", () => {
    state.price = priceSelect.value; updateURL(); loadProducts();
  });
  const searchForm = document.querySelector("[data-search-form]");
  if (searchForm) searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = searchForm.querySelector("[data-search-input]");
    state.search = input ? input.value.trim() : "";
    updateURL(); loadProducts();
  });
}

/* --- Boot --- */
async function boot() {
  if (document.body.dataset.page !== "products") return;
  readURLState();
  bindControls();
  await loadCategoryTabs();
  loadProducts();
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
