/* Abdullah Store — Cart page controller */

import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  getCart, setCart, updateCartQuantity, removeFromCart,
  getCartSubtotal, formatUSD, formatNGN, imageUrl, escapeHtml, toast
} from "./utilities.js";

const DELIVERY_FEE_USD = 5.00;   // fallback; overridden by settings/store if available
const FREE_DELIVERY_OVER_USD = 50.00;

async function loadDeliveryFee() {
  try {
    const snap = await getDoc(doc(db, "settings", "store"));
    if (snap.exists()) {
      const v = snap.data();
      if (typeof v.deliveryFee === "number" && v.deliveryFee >= 0) return v.deliveryFee;
    }
  } catch {}
  return DELIVERY_FEE_USD;
}

function unitPrice(item) {
  const base = Number(item.price || 0);
  const disc = Number(item.discount || 0);
  return disc > 0 ? base - (base * disc / 100) : base;
}

async function render() {
  const itemsEl = document.getElementById("cartItems");
  const summaryEl = document.getElementById("cartSummary");
  const items = getCart();

  if (!items.length) {
    summaryEl.style.display = "none";
    itemsEl.innerHTML = `
      <div class="empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/>
          <path d="M3 4h2l2.5 12h11L21 8H6"/>
        </svg>
        <h3>Your cart is empty</h3>
        <p>Start shopping and add items to your cart.</p>
        <a href="products.html" class="btn btn-primary">Browse Products</a>
      </div>`;
    return;
  }

  itemsEl.innerHTML = items.map((it) => `
    <div class="cart-item" data-id="${it.productId}">
      <a href="product-details.html?id=${it.productId}" class="cart-item-img">
        <img src="${imageUrl(it.image)}" alt="${escapeHtml(it.name)}">
      </a>
      <div class="cart-item-info">
        <a href="product-details.html?id=${it.productId}" class="cart-item-name">${escapeHtml(it.name)}</a>
        <div class="cart-item-price">${formatUSD(unitPrice(it))} <small style="color:var(--green);font-weight:600">≈ ${formatNGN(unitPrice(it))}</small></div>
        <div class="qty-control">
          <button type="button" data-minus="${it.productId}">−</button>
          <span>${it.quantity}</span>
          <button type="button" data-plus="${it.productId}">+</button>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
        <button class="cart-item-remove" data-remove="${it.productId}" aria-label="Remove">✕</button>
        <strong style="font-size:.95rem">${formatUSD(unitPrice(it) * it.quantity)}</strong>
      </div>
    </div>`).join("");

  // Bind buttons
  itemsEl.querySelectorAll("[data-plus]").forEach((b) => {
    b.onclick = () => {
      const id = b.dataset.plus;
      const item = getCart().find((x) => x.productId === id);
      if (item) updateCartQuantity(id, item.quantity + 1);
      render();
    };
  });
  itemsEl.querySelectorAll("[data-minus]").forEach((b) => {
    b.onclick = () => {
      const id = b.dataset.minus;
      const item = getCart().find((x) => x.productId === id);
      if (item) {
        if (item.quantity <= 1) return;
        updateCartQuantity(id, item.quantity - 1);
      }
      render();
    };
  });
  itemsEl.querySelectorAll("[data-remove]").forEach((b) => {
    b.onclick = () => { removeFromCart(b.dataset.remove); render(); };
  });

  // Summary
  summaryEl.style.display = "block";
  const subtotal = getCartSubtotal();
  const deliveryFeeUsd = await loadDeliveryFee();
  const delivery = subtotal >= FREE_DELIVERY_OVER_USD ? 0 : deliveryFeeUsd;
  const total = subtotal + delivery;

  document.getElementById("subtotal").innerHTML = `${formatUSD(subtotal)}<small class="ngn">${formatNGN(subtotal)}</small>`;
  document.getElementById("delivery").innerHTML = delivery === 0
    ? `FREE<small class="ngn">Free</small>`
    : `${formatUSD(delivery)}<small class="ngn">${formatNGN(delivery)}</small>`;
  document.getElementById("discount").innerHTML = `−${formatUSD(0)}<small class="ngn">${formatNGN(0)}</small>`;
  document.getElementById("total").innerHTML = `${formatUSD(total)}<small class="ngn">${formatNGN(total)}</small>`;
}

document.addEventListener("cartchanged", render);
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", render);
} else render();
