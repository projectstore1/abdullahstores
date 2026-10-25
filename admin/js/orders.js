/* Abdullah Store Admin — Orders management */

import { renderAdminChrome, guardAdminPage, $, formatUSD, formatNGN, toast, confirmDialog } from "./admin-common.js";
import { db } from "../js/firebase-config.js";
import {
  collection, getDocs, doc, getDoc, updateDoc, serverTimestamp, addDoc, orderBy, query
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { escapeHtml } from "../js/utilities.js";

renderAdminChrome("orders.html", "Orders");

let allOrders = [];

(async () => {
  await guardAdminPage();
  await loadOrders();
  bindEvents();

  // Auto-open if ?orderId=
  const params = new URLSearchParams(location.search);
  if (params.get("orderId")) setTimeout(() => openOrder(params.get("orderId")), 300);
})();

async function loadOrders() {
  const tbody = $("#ordersBody");
  try {
    let snap;
    try { snap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc"))); }
    catch { snap = await getDocs(collection(db, "orders")); }
    allOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderList();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="admin-empty" style="color:#DC2626">${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderList() {
  const tbody = $("#ordersBody");
  const search = ($("#searchInput").value || "").toLowerCase();
  const statusFilter = $("#statusFilter").value;

  let list = allOrders.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (search) {
      const hay = ((o.orderNumber || "") + " " + (o.customerName || "") + " " + (o.phone || "")).toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="admin-empty">No orders found</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((o) => `
    <tr>
      <td><strong>${escapeHtml(o.orderNumber || "")}</strong></td>
      <td>${escapeHtml(o.customerName || "")}</td>
      <td style="font-size:.82rem">${escapeHtml(o.phone || "")}</td>
      <td>
        <div style="font-weight:700">${formatUSD(o.total)}</div>
        <div style="font-size:.72rem;color:var(--green)">${formatNGN(o.total)}</div>
      </td>
      <td><span class="badge badge-${o.status}">${o.status}</span></td>
      <td style="font-size:.8rem;color:var(--muted)">${formatDate(o.createdAt)}</td>
      <td><div class="actions"><button class="btn btn-ghost btn-sm" data-view="${o.id}">View</button></div></td>
    </tr>`).join("");

  tbody.querySelectorAll("[data-view]").forEach((b) => b.onclick = () => openOrder(b.dataset.view));
}

function formatDate(ts) {
  if (!ts) return "";
  const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
  return d.toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" });
}

async function openOrder(id) {
  const el = $("#orderDetails");
  el.innerHTML = `<p>Loading...</p>`;
  $("#orderModal").style.display = "grid";
  $("#orderModal").classList.add("open");

  try {
    const snap = await getDoc(doc(db, "orders", id));
    if (!snap.exists()) { el.innerHTML = `<p>Order not found</p>`; return; }
    const o = snap.data();

    const items = (o.items || []).map((it) => `
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:.85rem">
        <span>${escapeHtml(it.name)} × ${it.quantity}</span>
        <span>${formatUSD(Number(it.price) * Number(it.quantity))}</span>
      </div>`).join("");

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;font-size:.85rem">
        <div><strong>Customer:</strong> ${escapeHtml(o.customerName || "")}</div>
        <div><strong>Phone:</strong> ${escapeHtml(o.phone || "")}</div>
        <div><strong>Email:</strong> ${escapeHtml(o.email || "—")}</div>
        <div><strong>Date:</strong> ${formatDate(o.createdAt)}</div>
        <div style="grid-column:1/-1"><strong>Address:</strong> ${escapeHtml(o.address || "")}</div>
        ${o.notes ? `<div style="grid-column:1/-1"><strong>Notes:</strong> ${escapeHtml(o.notes)}</div>` : ""}
      </div>

      <h3 style="font-size:.9rem;font-weight:800;margin:16px 0 8px">Items</h3>
      ${items}

      <div style="margin-top:16px;padding-top:12px;border-top:2px solid var(--black);font-size:.9rem">
        <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Subtotal</span><span>${formatUSD(o.subtotal)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Delivery</span><span>${o.deliveryFee === 0 ? "FREE" : formatUSD(o.deliveryFee)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-weight:800"><span>Total</span><span style="color:var(--green)">${formatUSD(o.total)} <small>${formatNGN(o.total)}</small></span></div>
      </div>

      <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
        <label class="form-label">Update Status</label>
        <select class="form-select" id="statusSelect">
          ${["Pending","Confirmed","Processing","Shipped","Completed","Cancelled"].map((s) =>
            `<option value="${s}" ${o.status === s ? "selected" : ""}>${s}</option>`).join("")}
        </select>
        <label class="form-label" style="margin-top:12px">Payment Status</label>
        <select class="form-select" id="paymentSelect">
          ${["Unpaid","Paid","Refunded"].map((s) =>
            `<option value="${s}" ${o.paymentStatus === s ? "selected" : ""}>${s}</option>`).join("")}
        </select>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="printBtn">Print</button>
          <button type="button" class="btn btn-primary" id="updateBtn">Update Order</button>
        </div>
      </div>
    `;

    $("#updateBtn").onclick = async () => {
      const newStatus = $("#statusSelect").value;
      const newPayment = $("#paymentSelect").value;
      try {
        await updateDoc(doc(db, "orders", id), {
          status: newStatus,
          paymentStatus: newPayment,
          updatedAt: serverTimestamp()
        });
        // Notify customer
        try {
          await addDoc(collection(db, "notifications"), {
            userId: o.userId,
            title: `Order ${newStatus}`,
            body: `Your order #${o.orderNumber} is now ${newStatus}.`,
            url: `../order-details.html?id=${id}`,
            read: false,
            createdAt: serverTimestamp()
          });
        } catch (e) {
          console.warn("Notify skip:", e.message);
        }
        toast("Order updated", { type: "success" });
        closeModal();
        await loadOrders();
      } catch (err) {
        toast("Update failed: " + err.message, { type: "error" });
      }
    };

    $("#printBtn").onclick = () => {
      const w = window.open("", "_blank");
      w.document.write(`<pre style="font-family:monospace;padding:20px">${escapeHtml(JSON.stringify({ order: o.orderNumber, customer: o.customerName, total: o.total, status: o.status }, null, 2))}</pre>`);
      w.print();
    };

  } catch (err) {
    el.innerHTML = `<p style="color:#DC2626">${escapeHtml(err.message)}</p>`;
  }
}

function closeModal() {
  $("#orderModal").classList.remove("open");
  setTimeout(() => $("#orderModal").style.display = "none", 200);
}

function bindEvents() {
  $("#modalClose").onclick = closeModal;
  $("#searchInput").addEventListener("input", renderList);
  $("#statusFilter").addEventListener("change", renderList);
}
