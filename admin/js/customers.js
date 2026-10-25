/* Abdullah Store Admin — Customers */

import { renderAdminChrome, guardAdminPage, $, formatUSD, formatNGN } from "./admin-common.js";
import { db } from "../js/firebase-config.js";
import {
  collection, getDocs, query, where, orderBy
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { escapeHtml } from "../js/utilities.js";

renderAdminChrome("customers.html", "Customers");

let allCustomers = [];

(async () => {
  await guardAdminPage();
  await loadCustomers();
  bindEvents();
})();

async function loadCustomers() {
  const tbody = $("#customersBody");
  try {
    const snap = await getDocs(collection(db, "users"));
    allCustomers = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderList();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="admin-empty" style="color:#DC2626">${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderList() {
  const tbody = $("#customersBody");
  const search = ($("#searchInput").value || "").toLowerCase();

  let list = allCustomers;
  if (search) {
    list = list.filter((u) =>
      ((u.name || "") + " " + (u.email || "")).toLowerCase().includes(search)
    );
  }

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="admin-empty">No customers found</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((u) => `
    <tr>
      <td style="font-weight:600">${escapeHtml(u.name || "—")}</td>
      <td style="font-size:.85rem">${escapeHtml(u.email || "")}</td>
      <td style="font-size:.82rem">${escapeHtml(u.phone || "—")}</td>
      <td><span class="badge ${u.role === "admin" ? "badge-Completed" : "badge-Pending"}">${u.role || "customer"}</span></td>
      <td style="font-size:.8rem;color:var(--muted)">${formatDate(u.createdAt)}</td>
      <td><div class="actions"><button class="btn btn-ghost btn-sm" data-view="${u.id}">View</button></div></td>
    </tr>`).join("");

  tbody.querySelectorAll("[data-view]").forEach((b) => b.onclick = () => viewCustomer(b.dataset.view));
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-US", { dateStyle: "medium" });
}

async function viewCustomer(uid) {
  const u = allCustomers.find((x) => x.id === uid);
  if (!u) return;
  const el = $("#customerDetails");
  el.innerHTML = `<p>Loading orders...</p>`;
  $("#customerModal").style.display = "grid";
  $("#customerModal").classList.add("open");

  let orders = [];
  try {
    let snap;
    try { snap = await getDocs(query(collection(db, "orders"), where("userId", "==", uid), orderBy("createdAt", "desc"))); }
    catch { snap = await getDocs(query(collection(db, "orders"), where("userId", "==", uid))); }
    orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("Orders load:", err.message);
  }

  const totalSpent = orders.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + Number(o.total || 0), 0);

  el.innerHTML = `
    <div style="margin-bottom:16px">
      <div style="font-size:1.1rem;font-weight:800">${escapeHtml(u.name || "")}</div>
      <div style="color:var(--muted);font-size:.85rem">${escapeHtml(u.email || "")}</div>
      <div style="color:var(--muted);font-size:.85rem">${escapeHtml(u.phone || "")}</div>
      <div style="color:var(--muted);font-size:.85rem">${escapeHtml(u.address || "")}</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div style="background:var(--bg);padding:12px;border-radius:8px">
        <div style="font-size:.72rem;color:var(--muted);text-transform:uppercase;font-weight:700">Total Orders</div>
        <div style="font-size:1.3rem;font-weight:800">${orders.length}</div>
      </div>
      <div style="background:var(--bg);padding:12px;border-radius:8px">
        <div style="font-size:.72rem;color:var(--muted);text-transform:uppercase;font-weight:700">Total Spent</div>
        <div style="font-size:1.3rem;font-weight:800;color:var(--green)">${formatUSD(totalSpent)}</div>
        <div style="font-size:.72rem;color:var(--green)">${formatNGN(totalSpent)}</div>
      </div>
    </div>

    <h3 style="font-size:.9rem;font-weight:800;margin-bottom:8px">Recent Orders</h3>
    ${orders.length ? orders.slice(0, 10).map((o) => `
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:.85rem">
        <div>
          <div style="font-weight:600">${escapeHtml(o.orderNumber)}</div>
          <div style="color:var(--muted);font-size:.75rem">${formatDate(o.createdAt)}</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700">${formatUSD(o.total)}</div>
          <span class="badge badge-${o.status}">${o.status}</span>
        </div>
      </div>`).join("") : `<p style="color:var(--muted);font-size:.85rem">No orders yet.</p>`}
  `;
}

function bindEvents() {
  $("#modalClose").onclick = () => {
    $("#customerModal").classList.remove("open");
    setTimeout(() => $("#customerModal").style.display = "none", 200);
  };
  $("#searchInput").addEventListener("input", renderList);
}
