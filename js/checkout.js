/* Abdullah Store — Checkout page controller */

import { auth, db } from "./firebase-config.js";
import {
  collection, addDoc, serverTimestamp, doc, getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  getCart, clearCart, getCartSubtotal, getUsdToNgnRate,
  formatUSD, formatNGN, imageUrl, escapeHtml,
  toast, showLoading, hideLoading, confirmDialog
} from "./utilities.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const DELIVERY_FEE_USD = 5.00;
const FREE_DELIVERY_OVER_USD = 50.00;

let currentUser = null;
let currentProfile = null;
let isSubmitting = false;

/* --- Auth state --- */
onAuthStateChanged(auth, async (user) => {
  currentUser = user || null;
  if (user) {
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        currentProfile = snap.data();
        prefillForm(currentProfile);
      }
    } catch {}
  }
});

function prefillForm(p) {
  if (!p) return;
  const nameEl = document.getElementById("customerName");
  const phoneEl = document.getElementById("phone");
  const emailEl = document.getElementById("email");
  const addrEl = document.getElementById("address");
  if (nameEl && !nameEl.value) nameEl.value = p.name || "";
  if (phoneEl && !phoneEl.value) phoneEl.value = p.phone || "";
  if (emailEl && !emailEl.value) emailEl.value = p.email || "";
  if (addrEl && !addrEl.value) addrEl.value = p.address || "";
}

/* --- Delivery fee --- */
async function getDeliveryFee() {
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

/* --- Summary render --- */
async function renderSummary() {
  const items = getCart();
  const itemsEl = document.getElementById("checkoutItems");

  if (!items.length) {
    itemsEl.innerHTML = `<div class="empty" style="padding:20px">
      <p style="margin-bottom:12px">Your cart is empty.</p>
      <a href="products.html" class="btn btn-primary btn-sm">Browse</a>
    </div>`;
    document.getElementById("placeOrderBtn").disabled = true;
    return;
  }

  itemsEl.innerHTML = items.map((it) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:.9rem">
      <div style="flex:1;min-width:0;padding-right:10px">
        <div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(it.name)}</div>
        <div style="color:var(--muted);font-size:.8rem">×${it.quantity} × ${formatUSD(unitPrice(it))}</div>
      </div>
      <div style="font-weight:700;white-space:nowrap">${formatUSD(unitPrice(it) * it.quantity)}</div>
    </div>`).join("");

  const subtotal = getCartSubtotal();
  const deliveryFeeUsd = await getDeliveryFee();
  const delivery = subtotal >= FREE_DELIVERY_OVER_USD ? 0 : deliveryFeeUsd;
  const total = subtotal + delivery;

  document.getElementById("subtotal").innerHTML = `${formatUSD(subtotal)}<small class="ngn">${formatNGN(subtotal)}</small>`;
  document.getElementById("delivery").innerHTML = delivery === 0
    ? `FREE<small class="ngn">Free</small>`
    : `${formatUSD(delivery)}<small class="ngn">${formatNGN(delivery)}</small>`;
  document.getElementById("total").innerHTML = `${formatUSD(total)}<small class="ngn">${formatNGN(total)}</small>`;

  document.getElementById("placeOrderBtn").disabled = false;
}

/* --- Validation --- */
function validate() {
  const fields = {
    customerName: document.getElementById("customerName").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    address: document.getElementById("address").value.trim()
  };
  let ok = true;

  document.querySelectorAll(".form-error").forEach((el) => {
    el.textContent = ""; el.classList.remove("show");
  });

  if (!fields.customerName) showError("customerName", "Please enter your name.");
  if (!fields.phone || fields.phone.replace(/\D/g, "").length < 7)
    showError("phone", "Please enter a valid phone number.");
  if (!fields.address || fields.address.length < 10)
    showError("address", "Please enter your full delivery address.");

  if (document.querySelector(".form-error.show")) ok = false;
  return ok ? fields : null;

  function showError(name, msg) {
    const el = document.querySelector(`[data-error="${name}"]`);
    if (el) { el.textContent = msg; el.classList.add("show"); }
  }
}

/* --- Place order --- */
async function placeOrder() {
  if (isSubmitting) return;

  if (!currentUser) {
    const go = await confirmDialog(
      "You must be signed in to place an order. Sign in now?",
      { title: "Sign in required", okText: "Sign in", cancelText: "Cancel" }
    );
    if (go) location.href = "login.html?next=checkout.html";
    return;
  }

  const fields = validate();
  if (!fields) {
    toast("Please fix the highlighted fields", { type: "error" });
    return;
  }

  const items = getCart();
  if (!items.length) {
    toast("Your cart is empty", { type: "error" });
    return;
  }

  isSubmitting = true;
  const btn = document.getElementById("placeOrderBtn");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Placing order...";

  try {
    // Re-fetch settings for delivery fee
    const feeUsd = await getDeliveryFee();
    const subtotal = getCartSubtotal();
    const deliveryFee = subtotal >= FREE_DELIVERY_OVER_USD ? 0 : feeUsd;
    const discount = 0;
    const total = subtotal + deliveryFee - discount;

    // Build order items
    const orderItems = items.map((it) => ({
      productId: it.productId,
      name: it.name,
      image: it.image,
      price: Number(it.price || 0),
      discount: Number(it.discount || 0),
      quantity: Number(it.quantity || 1)
    }));

    const orderNumber = "AS-" + Math.random().toString(36).slice(2, 10).toUpperCase();

    const payload = {
      orderNumber,
      userId: currentUser.uid,
      customerName: fields.customerName,
      phone: fields.phone,
      email: document.getElementById("email").value.trim(),
      address: fields.address,
      notes: document.getElementById("notes").value.trim(),
      items: orderItems,
      subtotal,
      deliveryFee,
      discount,
      total,
      currency: "USD",
      usdToNgnAtOrderTime: getUsdToNgnRate(),
      status: "Pending",
      paymentStatus: "Unpaid",
      paymentMethod: "cod",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const ref = await addDoc(collection(db, "orders"), payload);

    // Notify customer (best effort)
    try {
      await addDoc(collection(db, "notifications"), {
        userId: currentUser.uid,
        title: "Order placed",
        body: `Your order #${orderNumber} has been received.`,
        url: `order-details.html?id=${ref.id}`,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      // Rules may block non-admin notification creation — ignore silently
      console.warn("Notification write skipped:", err.message);
    }

    clearCart();
    location.href = `thank-you.html?orderId=${ref.id}`;
  } catch (err) {
    console.error("Place order failed:", err);
    const code = err?.code || "";
    let msg = err.message || "Could not place order.";
    if (code === "permission-denied") {
      msg = "Permission denied. Please make sure the Firestore rules are deployed and you are signed in.";
    }
    toast(msg, { type: "error" });
    btn.disabled = false;
    btn.textContent = originalText;
  } finally {
    isSubmitting = false;
  }
}

/* --- Wire up --- */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("placeOrderBtn").addEventListener("click", placeOrder);
  renderSummary();
});
document.addEventListener("cartchanged", renderSummary);
