/* Abdullah Store — My Orders list page */
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  collection, query, where, orderBy, getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { formatUSD, formatNGN, formatDate, escapeHtml } from "./utilities.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "login.html?next=my-orders.html";
    return;
  }
  await loadOrders(user.uid);
});

async function loadOrders(uid) {
  const el = document.getElementById("ordersList");
  try {
    const q = query(
      collection(db, "orders"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      el.innerHTML = `
        <div class="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 7h18M3 12h18M3 17h18"/>
          </svg>
          <h3>No orders yet</h3>
          <p>Start shopping to place your first order.</p>
          <a href="products.html" class="btn btn-primary">Browse Products</a>
        </div>`;
      return;
    }
    el.innerHTML = snap.docs.map((d) => {
      const o = d.data();
      const itemCount = Array.isArray(o.items) ? o.items.reduce((n, i) => n + (i.quantity || 0), 0) : 0;
      return `
        <a href="order-details.html?id=${d.id}" class="order-card" style="display:block;text-decoration:none;color:inherit">
          <div class="order-head">
            <div>
              <div class="order-number">#${escapeHtml(o.orderNumber || d.id.slice(0, 8))}</div>
              <div class="order-date">${formatDate(o.createdAt)}</div>
            </div>
            <span class="order-status ${o.status}">${escapeHtml(o.status)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid var(--border)">
            <span style="color:var(--muted);font-size:.85rem">${itemCount} item${itemCount !== 1 ? "s" : ""}</span>
            <span>
              <strong style="color:var(--green)">${formatUSD(o.total)}</strong>
              <small style="display:block;color:var(--green);font-size:.72rem;text-align:right">≈ ${formatNGN(o.total)}</small>
            </span>
          </div>
        </a>`;
    }).join("");
  } catch (err) {
    console.error("Orders load:", err);
    const msg = String(err.message || "");
    el.innerHTML = `<div class="empty">
      <h3>Could not load orders</h3>
      <p>${escapeHtml(msg)}</p>
      ${msg.includes("index") ? `<p style="font-size:.85rem;color:var(--muted);margin-top:8px">A composite index is required — check the browser console for the creation link.</p>` : ""}
    </div>`;
  }
}
