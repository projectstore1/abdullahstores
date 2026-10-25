/* Abdullah Store — Homepage product loaders + shared product card renderer */

import { db } from "./firebase-config.js";
import {
  collection, query, where, orderBy, limit, getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  formatUSD, formatNGN, imageUrl, escapeHtml, addToCart, toast
} from "./utilities.js";

/* ---------- Build one product card ---------- */
export function productCardHTML(p) {
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
      <img src="${img}" alt="${name}" loading="lazy"
           onerror="this.src='data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22%3E%3Crect width=%22400%22 height=%22400%22 fill=%22%23F1F5F9%22/%3E%3Ctext x=%22200%22 y=%22210%22 text-anchor=%22middle%22 fill=%22%2394A3B8%22 font-family=%22Arial%22 font-size=%2220%22%3ENo Image%3C/text%3E%3C/svg%3E'">
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
        <button class="btn btn-primary btn-sm" data-add-cart="${id}" ${outOfStock ? "disabled" : ""}>
          Add
        </button>
        <a href="product-details.html?id=${id}" class="btn btn-ghost btn-sm">View</a>
      </div>
    </div>
  </div>`;
}

/* ---------- Attach Add-to-cart handlers to a container ---------- */
export function bindAddToCart(container, productsList) {
  const byId = Object.fromEntries(productsList.map((p) => [p.id, p]));
  container.querySelectorAll("[data-add-cart]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = btn.dataset.addCart;
      const p = byId[id];
      if (!p) return;
      if (Number(p.stock || 0) <= 0) {
        toast("Out of stock", { type: "error" });
        return;
      }
      addToCart({ ...p, id }, 1);
    });
  });
}

/* ---------- Fetch helpers ---------- */
async function fetchProducts({ sort = "newest", categoryId = null, max = 10 } = {}) {
  let q;
  if (categoryId) {
    q = query(
      collection(db, "products"),
      where("enabled", "==", true),
      where("categoryId", "==", categoryId),
      orderBy("createdAt", "desc"),
      limit(max)
    );
  } else if (sort === "best") {
    q = query(
      collection(db, "products"),
      where("enabled", "==", true),
      orderBy("sales", "desc"),
      limit(max)
    );
  } else {
    q = query(
      collection(db, "products"),
      where("enabled", "==", true),
      orderBy("createdAt", "desc"),
      limit(max)
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ---------- Render helper ---------- */
async function renderList(containerId, opts) {
  const container = document.getElementById(containerId);
  if (!container) return;
  try {
    const list = await fetchProducts(opts);
    if (!list.length) {
      container.innerHTML = `<div class="empty" style="grid-column:1/-1;padding:40px 20px">
        <h3>No products yet</h3>
        <p>Check back soon!</p>
      </div>`;
      return;
    }
    container.innerHTML = list.map(productCardHTML).join("");
    bindAddToCart(container, list);
  } catch (err) {
    console.error("Home products error:", err);
    container.innerHTML = `<div class="empty" style="grid-column:1/-1;padding:40px 20px">
      <h3>Could not load products</h3>
      <p>${escapeHtml(err.message || "Unknown error")}</p>
    </div>`;
  }
}

/* ---------- Homepage boot ---------- */
async function loadHomepage() {
  if (document.body.dataset.page !== "home") return;
  await Promise.allSettled([
    renderList("featuredProducts", { sort: "newest", max: 10 }),
    renderList("latestProducts", { sort: "newest", max: 10 }),
    renderList("bestSellers", { sort: "best", max: 10 })
  ]);
  loadFeaturedCategories();
}

/* ---------- Featured categories ---------- */
async function loadFeaturedCategories() {
  const el = document.getElementById("featuredCategories");
  if (!el) return;
  try {
    const q = query(collection(db, "categories"), orderBy("order", "asc"), limit(6));
    const snap = await getDocs(q);
    if (snap.empty) {
      el.innerHTML = `<div class="empty" style="grid-column:1/-1;padding:30px 20px">
        <h3>No categories yet</h3><p>Categories will appear here once added.</p>
      </div>`;
      return;
    }
    el.innerHTML = snap.docs.map((d) => {
      const c = d.data();
      return `
        <a href="products.html?category=${d.id}" class="category-card">
          <div class="category-card-img">
            <img src="${imageUrl(c.image)}" alt="${escapeHtml(c.name || '')}" loading="lazy">
          </div>
          <h3>${escapeHtml(c.name || "Untitled")}</h3>
        </a>`;
    }).join("");
  } catch (err) {
    console.error("Categories error:", err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadHomepage);
} else {
  loadHomepage();
}
