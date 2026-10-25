/* Abdullah Store — Order details page */
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  formatUSD, formatNGN, formatDate, imageUrl, escapeHtml
} from "./utilities.js";

const params = new URLSearchParams(location.search);
const orderId = params.get("id");
const el = document.getElementById("orderContainer");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "login.html?next=order-details.html%3Fid%3D" + encodeURIComponent(orderId || "");
    return;
  }
  if (!orderId) {
    el.innerHTML = empty("No order specified", "Order ID is missing.");
    return;
  }
  try {
    const snap = await getDoc(doc(db, "orders", orderId));
    if (!snap.exists()) return el.innerHTML = empty("Order not found", "This order does not exist.");
    const o = snap.data();

    // Admin can view anyone's; customer only own
    let isAdmin = false;
    try {
      const prof = await getDoc(doc(db, "users", user.uid));
      isAdmin = prof.exists() && prof.data().role === "admin";
    } catch {}
    if (o.userId !== user.uid && !isAdmin) {
      return el.innerHTML = empty("Access denied", "You do not have access to this order.");
    }

    render(o);
  } catch (err) {
    el.innerHTML = empty("Could not load order", err.message);
  }
});

function render(o) {
  const items = Array.isArray(o.items) ? o.items : [];
  const itemsHTML = items.map((it) => {
    const base = Number(it.price || 0);
    const disc = Number(it.discount || 0);
    const unit = disc > 0 ? base - (base * disc / 100) : base;
    return `
      <div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)">
        <div style="width:64px;height:64px;border-radius:8px;overflow:hidden;background:#F1F5F9;flex-shrink:0">
          <img src="${imageUrl(it.image)}" alt="${escapeHtml(it.name || '')}" style="width:100%;height:100%;object-fit:cover">
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:.9rem">${escapeHtml(it.name || "Item")}</div>
          <div style="color:var(--muted);font-size:.82rem">${formatUSD(unit)} × ${it.quantity}</div>
        </div>
        <div style="text-align:right;font-weight:700;white-space:nowrap">${formatUSD(unit * it.quantity)}</div>
      </div>`;
  }).join("");

  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <div>
        <a href="my-orders.html" style="color:var(--muted);font-size:.85rem">← My Orders</a>
        <h1 class="section-title" style="margin-top:4px">Order #${escapeHtml(o.orderNumber || "")}</h1>
        <div style="color:var(--muted);font-size:.85rem;margin-top:4px">Placed on ${formatDate(o.createdAt)}</div>
      </div>
      <span class="order-status ${o.status}" style="font-size:.85rem;padding:6px 14px">${escapeHtml(o.status)}</span>
    </div>

    <div class="checkout-grid">
      <div>
        <div style="background:var(--white);padding:20px;border-radius:12px;box-shadow:var(--shadow);margin-bottom:16px">
          <h2 style="font-size:1rem;font-weight:800;margin-bottom:12px">Items (${items.length})</h2>
          ${itemsHTML}
        </div>

        <div style="background:var(--white);padding:20px;border-radius:12px;box-shadow:var(--shadow)">
          <h2 style="font-size:1rem;font-weight:800;margin-bottom:12px">Delivery Information</h2>
          <div style="font-size:.9rem;line-height:1.8">
            <div><strong>Name:</strong> ${escapeHtml(o.customerName || "")}</div>
            <div><strong>Phone:</strong> ${escapeHtml(o.phone || "")}</div>
            ${o.email ? `<div><strong>Email:</strong> ${escapeHtml(o.email)}</div>` : ""}
            <div><strong>Address:</strong> ${escapeHtml(o.address || "")}</div>
            ${o.notes ? `<div><strong>Notes:</strong> ${escapeHtml(o.notes)}</div>` : ""}
          </div>
        </div>
      </div>

      <aside style="background:var(--white);padding:20px;border-radius:12px;box-shadow:var(--shadow);height:fit-content">
        <h2 style="font-size:1rem;font-weight:800;margin-bottom:12px">Summary</h2>
        <div class="summary-row"><span>Subtotal</span><span>${formatUSD(o.subtotal)}<small class="ngn">${formatNGN(o.subtotal)}</small></span></div>
        <div class="summary-row"><span>Delivery</span><span>${o.deliveryFee === 0 ? "FREE" : formatUSD(o.deliveryFee)}<small class="ngn">${formatNGN(o.deliveryFee)}</small></span></div>
        ${o.discount > 0 ? `<div class="summary-row"><span>Discount</span><span>−${formatUSD(o.discount)}</span></div>` : ""}
        <div class="summary-row total"><span>Total</span><span>${formatUSD(o.total)}<small class="ngn">${formatNGN(o.total)}</small></span></div>

        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);font-size:.85rem;color:var(--muted)">
          <div><strong>Payment:</strong> ${escapeHtml(o.paymentStatus || "Unpaid")}</div>
          <div><strong>Method:</strong> ${escapeHtml(o.paymentMethod || "cod")}</div>
        </div>

        <a href="invoice.html?id=${orderId}" class="btn btn-primary btn-block" style="margin-top:16px">View Invoice</a>
      </aside>
    </div>
  `;
}

function empty(title, msg) {
  return `<div class="empty">
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(msg || "")}</p>
    <a href="my-orders.html" class="btn btn-primary">My Orders</a>
  </div>`;
}
