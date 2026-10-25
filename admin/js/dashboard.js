/* Abdullah Store Admin — Dashboard */

import { renderAdminChrome, guardAdminPage, $, $$, formatUSD, formatNGN, toast } from "./admin-common.js";
import { db } from "../js/firebase-config.js";
import {
  collection, getDocs, query, orderBy, limit, where
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { escapeHtml } from "../js/utilities.js";
import { seedDemoData } from "../js/seed-demo.js";

renderAdminChrome("dashboard.html", "Dashboard");

(async () => {
  await guardAdminPage();
  await loadStats();
  await loadRecentOrders();
  bindSeed();
})();

async function loadStats() {
  try {
    const [ordersSnap, productsSnap, usersSnap] = await Promise.all([
      getDocs(collection(db, "orders")),
      getDocs(collection(db, "products")),
      getDocs(query(collection(db, "users"), where("role", "==", "customer")))
    ]);

    let totalOrders = ordersSnap.size;
    let pending = 0;
    let completed = 0;
    let totalSales = 0;

    ordersSnap.forEach((d) => {
      const o = d.data();
      if (o.status === "Pending") pending++;
      if (o.status === "Completed") completed++;
      if (o.status !== "Cancelled") totalSales += Number(o.total || 0);
    });

    const cards = $$("#statGrid .stat-card");
    if (cards[0]) cards[0].querySelector(".stat-card-value").outerHTML = `<div class="stat-card-value">${totalOrders}</div>`;
    if (cards[1]) cards[1].querySelector(".stat-card-value").outerHTML = `<div class="stat-card-value">${pending}</div>`;
    if (cards[2]) cards[2].querySelector(".stat-card-value").outerHTML = `<div class="stat-card-value">${completed}</div>`;
    if (cards[3]) cards[3].querySelector(".stat-card-value").outerHTML = `<div class="stat-card-value">${productsSnap.size}</div>`;

    $("#totalSales").innerHTML = `${formatUSD(totalSales)}<small>${formatNGN(totalSales)}</small>`;
    $("#customerCount").textContent = usersSnap.size;
  } catch (err) {
    console.error("Stats load:", err);
    toast("Could not load stats: " + err.message, { type: "error" });
  }
}

async function loadRecentOrders() {
  const tbody = $("#recentOrdersBody");
  try {
    let snap;
    try {
      snap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(10)));
    } catch {
      snap = await getDocs(query(collection(db, "orders"), limit(10)));
    }
    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="6" class="admin-empty">No orders yet</td></tr>`;
      return;
    }
    tbody.innerHTML = snap.docs.map((d) => {
      const o = d.data();
      return `
        <tr>
          <td><a href="orders.html?orderId=${d.id}" style="color:var(--green);font-weight:600">${escapeHtml(o.orderNumber || "")}</a></td>
          <td>${escapeHtml(o.customerName || "")}</td>
          <td>${formatUSD(o.total)}</td>
          <td><span class="badge badge-${o.status}">${o.status}</span></td>
          <td style="font-size:.8rem;color:var(--muted)">${formatDateTime(o.createdAt)}</td>
          <td><a href="orders.html?orderId=${d.id}" class="btn btn-ghost btn-sm">View</a></td>
        </tr>`;
    }).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="admin-empty" style="color:#DC2626">${escapeHtml(err.message)}</td></tr>`;
  }
}

function formatDateTime(ts) {
  if (!ts) return "";
  const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
  return d.toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" });
}

function bindSeed() {
  $("#seedBtn")?.addEventListener("click", async () => {
    if (!confirm("Seed demo products/categories/banners? Only works if store is empty.")) return;
    const btn = $("#seedBtn");
    btn.disabled = true; btn.textContent = "Seeding...";
    try {
      const result = await seedDemoData();
      toast(result.message, { type: result.ok ? "success" : "error" });
      if (result.ok) setTimeout(() => location.reload(), 1200);
    } catch (err) {
      toast("Seed failed: " + err.message, { type: "error" });
    } finally {
      btn.disabled = false; btn.textContent = "Seed Demo Data";
    }
  });
}
