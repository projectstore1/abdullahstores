/* Abdullah Store — Product details controller */

import { db } from "./firebase-config.js";
import {
  doc, getDoc, collection, query, where, orderBy, limit, getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  imageUrl, escapeHtml, formatUSD, formatNGN,
  addToCart, toast
} from "./utilities.js";

const $ = (id) => document.getElementById(id);
let currentProduct = null;
let qty = 1;

async function load() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (!id) {
    $("pdContainer").innerHTML = emptyState("Product not found", "No product ID was provided.");
    return;
  }

  let snap;
  try {
    snap = await getDoc(doc(db, "products", id));
  } catch (err) {
    $("pdContainer").innerHTML = emptyState("Could not load product", err.message);
    return;
  }
  if (!snap.exists()) {
    $("pdContainer").innerHTML = emptyState("Product not found", "This product may have been removed.");
    return;
  }
  const data = snap.data();
  if (!data.enabled) {
    $("pdContainer").innerHTML = emptyState("Product unavailable", "This product is currently disabled.");
    return;
  }

  currentProduct = { id: snap.id, ...data };
  render(currentProduct);
  document.title = `${currentProduct.name || "Product"} — Abdullah Store`;
  loadRelated(currentProduct);
}

function render(p) {
  const name = escapeHtml(p.name || "Untitled");
  const images = Array.isArray(p.images) && p.images.length ? p.images : [imageUrl(p.images)];
  const price = Number(p.price || 0);
  const disc = Number(p.discount || 0);
  const stock = Number(p.stock || 0);
  const priceNow = disc > 0 ? price - (price * disc / 100) : price;
  const outOfStock = stock <= 0;

  $("pdContainer").innerHTML = `
  <div class="pd-grid fade-in">
    <div class="pd-gallery">
      <div class="pd-main-img">
        <img id="mainImage" src="${imageUrl(images[0])}" alt="${name}">
      </div>
      ${images.length > 1 ? `
        <div class="pd-thumbs" id="thumbs">
          ${images.map((img, i) => `
            <div class="pd-thumb ${i === 0 ? 'active' : ''}" data-idx="${i}">
              <img src="${imageUrl(img)}" alt="View ${i+1}">
            </div>`).join("")}
        </div>` : ""}
    </div>

    <div class="pd-info">
      <h1>${name}</h1>
      <div class="pd-meta">Category: ${escapeHtml(p.categoryName || p.categoryId || "—")}</div>

      <div class="price-dual lg">
        <span class="price-usd">${formatUSD(priceNow)}</span>
        <span class="price-ngn">≈ ${formatNGN(priceNow)}</span>
      </div>
      ${disc > 0 ? `<div style="margin-top:6px;color:var(--muted);font-size:.9rem">
        <span style="text-decoration:line-through">${formatUSD(price)}</span>
        <span style="color:var(--orange);font-weight:700;margin-left:8px">-${Math.round(disc)}% OFF</span>
      </div>` : ""}

      <div style="margin-top:16px">
        <span class="pd-stock ${outOfStock ? 'out' : 'in'}">
          ${outOfStock ? "Out of Stock" : `In Stock (${stock} available)`}
        </span>
      </div>

      <div class="pd-desc">${escapeHtml(p.description || "No description available.")}</div>

      ${!outOfStock ? `
        <div style="display:flex;align-items:center;gap:12px;margin-top:16px">
          <span style="font-weight:600;font-size:.9rem">Quantity</span>
          <div class="qty-control">
            <button type="button" id="qtyMinus">−</button>
            <span id="qtyValue">1</span>
            <button type="button" id="qtyPlus">+</button>
          </div>
        </div>
      ` : ""}

      <div class="pd-actions">
        ${!outOfStock ? `
          <button class="btn btn-primary" id="addToCartBtn">Add to Cart</button>
          <button class="btn btn-accent" id="buyNowBtn">Buy Now</button>
        ` : `<button class="btn btn-ghost" disabled>Out of Stock</button>`}
      </div>
    </div>
  </div>`;

  // Gallery thumbs
  const thumbs = $("thumbs");
  if (thumbs) {
    thumbs.querySelectorAll("[data-idx]").forEach((t) => {
      t.addEventListener("click", () => {
        const i = Number(t.dataset.idx);
        $("mainImage").src = imageUrl(images[i]);
        thumbs.querySelectorAll(".pd-thumb").forEach((x) => x.classList.remove("active"));
        t.classList.add("active");
      });
    });
  }

  // Quantity controls
  if (!outOfStock) {
    qty = 1;
    $("qtyMinus").onclick = () => {
      qty = Math.max(1, qty - 1);
      $("qtyValue").textContent = qty;
    };
    $("qtyPlus").onclick = () => {
      qty = Math.min(stock, qty + 1);
      $("qtyValue").textContent = qty;
    };

    $("addToCartBtn").onclick = () => {
      addToCart(currentProduct, qty);
    };
    $("buyNowBtn").onclick = () => {
      addToCart(currentProduct, qty);
      setTimeout(() => location.href = "checkout.html", 350);
    };
  }
}

async function loadRelated(p) {
  if (!p.categoryId) return;
  try {
    const q = query(
      collection(db, "products"),
      where("enabled", "==", true),
      where("categoryId", "==", p.categoryId),
      orderBy("createdAt", "desc"),
      limit(6)
    );
    const snap = await getDocs(q);
    const items = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((x) => x.id !== p.id);
    if (!items.length) return;

    $("relatedSection").style.display = "block";
    $("relatedGrid").innerHTML = items.map(cardHTML).join("");
    bindRelated(items);
  } catch (err) {
    console.warn("Related load:", err);
  }
}

function cardHTML(p) {
  const price = Number(p.price || 0);
  const disc = Number(p.discount || 0);
  const final = disc > 0 ? price - (price * disc / 100) : price;
  return `
  <div class="product-card" data-id="${p.id}">
    <a href="product-details.html?id=${p.id}" class="product-card-img">
      <img src="${imageUrl(p.images)}" alt="${escapeHtml(p.name)}" loading="lazy">
      ${disc > 0 ? `<span class="product-discount">-${Math.round(disc)}%</span>` : ""}
    </a>
    <div class="product-card-body">
      <a href="product-details.html?id=${p.id}" class="product-card-title">${escapeHtml(p.name)}</a>
      <div class="price-dual">
        <span class="price-usd">${formatUSD(final)}</span>
        <span class="price-ngn">≈ ${formatNGN(final)}</span>
      </div>
    </div>
  </div>`;
}

function bindRelated(list) {
  const byId = Object.fromEntries(list.map((p) => [p.id, p]));
  document.querySelectorAll("#relatedGrid [data-add-cart]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      addToCart({ ...byId[btn.dataset.addCart] }, 1);
    });
  });
}

function emptyState(title, msg) {
  return `<div class="empty" style="padding:60px 20px">
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(msg || "")}</p>
    <a href="products.html" class="btn btn-primary">Back to Products</a>
  </div>`;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", load);
} else load();
