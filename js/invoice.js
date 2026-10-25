/* Abdullah Store — Invoice renderer */
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  formatUSD, formatNGN, formatDate, escapeHtml
} from "./utilities.js";

const params = new URLSearchParams(location.search);
const orderId = params.get("id");
const container = document.getElementById("invoiceContainer");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    container.innerHTML = `<div class="invoice-wrap"><div class="empty">
      <h3>Sign in required</h3>
      <p>Please sign in to view this invoice.</p>
      <a href="login.html?next=invoice.html%3Fid%3D${encodeURIComponent(orderId || "")}" class="btn btn-primary">Sign In</a>
    </div></div>`;
    return;
  }
  if (!orderId) {
    container.innerHTML = `<div class="invoice-wrap"><div class="empty"><h3>No order specified</h3></div></div>`;
    return;
  }
  try {
    const [orderSnap, storeSnap] = await Promise.all([
      getDoc(doc(db, "orders", orderId)),
      getDoc(doc(db, "settings", "store")).catch(() => null)
    ]);
    if (!orderSnap.exists()) {
      container.innerHTML = `<div class="invoice-wrap"><div class="empty"><h3>Order not found</h3></div></div>`;
      return;
    }
    const o = orderSnap.data();

    // Auth check
    let isAdmin = false;
    try {
      const p = await getDoc(doc(db, "users", user.uid));
      isAdmin = p.exists() && p.data().role === "admin";
    } catch {}
    if (o.userId !== user.uid && !isAdmin) {
      container.innerHTML = `<div class="invoice-wrap"><div class="empty"><h3>Access denied</h3></div></div>`;
      return;
    }

    const store = storeSnap && storeSnap.exists() ? storeSnap.data() : {};
    renderInvoice(o, store);
  } catch (err) {
    container.innerHTML = `<div class="invoice-wrap"><div class="empty"><h3>Error</h3><p>${escapeHtml(err.message)}</p></div></div>`;
  }
});

function renderInvoice(o, store) {
  const storeName = store.storeName || "Abdullah Store";
  const storeEmail = store.email || "contact@abdullahstore.com";
  const storePhone = store.phone || "";
  const storeAddress = store.address || "";

  const items = Array.isArray(o.items) ? o.items : [];
  const itemsRows = items.map((it, idx) => {
    const base = Number(it.price || 0);
    const disc = Number(it.discount || 0);
    const unit = disc > 0 ? base - (base * disc / 100) : base;
    return `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #E5E7EB">${idx + 1}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #E5E7EB">${escapeHtml(it.name || "")}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #E5E7EB;text-align:center">${it.quantity}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #E5E7EB;text-align:right">${formatUSD(unit)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #E5E7EB;text-align:right"><strong>${formatUSD(unit * it.quantity)}</strong></td>
      </tr>`;
  }).join("");

  const invoiceNumber = "INV-" + (o.orderNumber || "").replace(/^AS-/, "");
  const invoiceDate = formatDate(o.createdAt);
  const status = o.status || "Pending";
  const payment = o.paymentStatus || "Unpaid";

  container.innerHTML = `
    <div class="invoice-wrap fade-in">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;padding-bottom:20px;border-bottom:2px solid var(--black);margin-bottom:24px">
        <div>
          <div style="font-size:1.5rem;font-weight:900;color:var(--black);letter-spacing:-.02em">
            ${escapeHtml(storeName)}
          </div>
          <div style="font-size:.82rem;color:var(--muted);margin-top:4px;line-height:1.6">
            ${storeAddress ? escapeHtml(storeAddress) + "<br>" : ""}
            ${storePhone ? escapeHtml(storePhone) + "<br>" : ""}
            ${escapeHtml(storeEmail)}
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:1.4rem;font-weight:800;color:var(--green)">INVOICE</div>
          <div style="font-size:.82rem;color:var(--muted);margin-top:4px">
            <strong style="color:var(--black)">${escapeHtml(invoiceNumber)}</strong><br>
            ${escapeHtml(invoiceDate)}
          </div>
        </div>
      </div>

      <!-- Meta row -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
        <div>
          <div style="font-size:.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;font-weight:700;margin-bottom:6px">Bill To</div>
          <div style="font-size:.9rem;line-height:1.7">
            <strong>${escapeHtml(o.customerName || "")}</strong><br>
            ${o.phone ? escapeHtml(o.phone) + "<br>" : ""}
            ${o.email ? escapeHtml(o.email) + "<br>" : ""}
            ${escapeHtml(o.address || "")}
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;font-weight:700;margin-bottom:6px">Details</div>
          <div style="font-size:.9rem;line-height:1.7">
            <strong>Order Number:</strong> ${escapeHtml(o.orderNumber || "")}<br>
            <strong>Payment:</strong> ${escapeHtml(payment)}<br>
            <strong>Status:</strong> ${escapeHtml(status)}<br>
            <strong>Method:</strong> ${escapeHtml(o.paymentMethod || "COD")}
          </div>
        </div>
      </div>

      <!-- Items table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:.88rem">
        <thead>
          <tr style="background:#F8FAFC">
            <th style="padding:10px 8px;text-align:left;font-weight:700;border-bottom:2px solid var(--border)">#</th>
            <th style="padding:10px 8px;text-align:left;font-weight:700;border-bottom:2px solid var(--border)">Item</th>
            <th style="padding:10px 8px;text-align:center;font-weight:700;border-bottom:2px solid var(--border)">Qty</th>
            <th style="padding:10px 8px;text-align:right;font-weight:700;border-bottom:2px solid var(--border)">Unit Price</th>
            <th style="padding:10px 8px;text-align:right;font-weight:700;border-bottom:2px solid var(--border)">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="margin-left:auto;max-width:320px;font-size:.92rem">
        <div style="display:flex;justify-content:space-between;padding:6px 0">
          <span style="color:var(--muted)">Subtotal</span>
          <span><strong>${formatUSD(o.subtotal)}</strong> <small style="color:var(--green)">${formatNGN(o.subtotal)}</small></span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0">
          <span style="color:var(--muted)">Delivery Fee</span>
          <span>${o.deliveryFee === 0 ? "FREE" : `${formatUSD(o.deliveryFee)} <small style="color:var(--green)">${formatNGN(o.deliveryFee)}</small>`}</span>
        </div>
        ${Number(o.discount) > 0 ? `
        <div style="display:flex;justify-content:space-between;padding:6px 0">
          <span style="color:var(--muted)">Discount</span>
          <span style="color:#DC2626">−${formatUSD(o.discount)}</span>
        </div>` : ""}
        <div style="display:flex;justify-content:space-between;padding:12px 0;border-top:2px solid var(--black);margin-top:8px;font-size:1.1rem;font-weight:900">
          <span>Total</span>
          <span style="color:var(--green)">
            ${formatUSD(o.total)}
            <small style="display:block;font-size:.72rem;text-align:right;font-weight:600">≈ ${formatNGN(o.total)}</small>
          </span>
        </div>
      </div>

      <!-- Footer -->
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid var(--border);text-align:center;font-size:.78rem;color:var(--muted)">
        Thank you for shopping with ${escapeHtml(storeName)}!<br>
        For any questions, contact ${escapeHtml(storeEmail)}.
      </div>
    </div>
  `;
}
