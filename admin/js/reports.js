/* Abdullah Store Admin — Reports */

import { renderAdminChrome, guardAdminPage, $, formatUSD, formatNGN, toast } from "./admin-common.js";
import { db } from "../js/firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { escapeHtml } from "../js/utilities.js";

renderAdminChrome("reports.html", "Reports");

let allOrders = [];

(async () => {
  await guardAdminPage();
  await loadOrders();
  bindEvents();
  renderReport();
})();

async function loadOrders() {
  try {
    const snap = await getDocs(collection(db, "orders"));
    allOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    toast("Load failed: " + err.message, { type: "error" });
  }
}

function filterByDays(days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return allOrders.filter((o) => {
    const ts = o.createdAt && typeof o.createdAt.toDate === "function"
      ? o.createdAt.toDate().getTime() : new Date(o.createdAt).getTime();
    return ts >= cutoff;
  });
}

function renderReport() {
  const days = Number($("#rangeSelect").value || 30);
  const filtered = filterByDays(days).filter((o) => o.status !== "Cancelled");

  const revenue = filtered.reduce((s, o) => s + Number(o.total || 0), 0);
  $("#revenueVal").innerHTML = `${formatUSD(revenue)}<small>${formatNGN(revenue)}</small>`;
  $("#ordersVal").textContent = filtered.length;

  // Best sellers
  const productMap = {};
  filtered.forEach((o) => {
    (o.items || []).forEach((it) => {
      const key = it.productId || it.name;
      if (!productMap[key]) productMap[key] = { name: it.name, qty: 0, revenue: 0 };
      productMap[key].qty += Number(it.quantity || 0);
      productMap[key].revenue += Number(it.price || 0) * Number(it.quantity || 0);
    });
  });
  const topProducts = Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 10);
  $("#bestSellersBody").innerHTML = topProducts.length
    ? topProducts.map((p) => `
      <tr>
        <td>${escapeHtml(p.name)}</td>
        <td>${p.qty}</td>
        <td>${formatUSD(p.revenue)} <small style="color:var(--green)">${formatNGN(p.revenue)}</small></td>
      </tr>`).join("")
    : `<tr><td colspan="3" class="admin-empty">No sales in this period</td></tr>`;

  // Daily sales
  const dailyMap = {};
  filtered.forEach((o) => {
    const ts = o.createdAt && typeof o.createdAt.toDate === "function"
      ? o.createdAt.toDate() : new Date(o.createdAt);
    const key = ts.toISOString().split("T")[0];
    if (!dailyMap[key]) dailyMap[key] = { orders: 0, revenue: 0 };
    dailyMap[key].orders += 1;
    dailyMap[key].revenue += Number(o.total || 0);
  });
  const daysArr = Object.entries(dailyMap).sort((a, b) => b[0].localeCompare(a[0]));
  $("#dailyBody").innerHTML = daysArr.length
    ? daysArr.map(([date, v]) => `
      <tr>
        <td>${date}</td>
        <td>${v.orders}</td>
        <td>${formatUSD(v.revenue)}</td>
      </tr>`).join("")
    : `<tr><td colspan="3" class="admin-empty">No data</td></tr>`;
}

function exportCSV() {
  const days = Number($("#rangeSelect").value || 30);
  const filtered = filterByDays(days);

  const rows = [["Order Number", "Customer", "Date", "Status", "Total (USD)", "Total (NGN)"]];
  filtered.forEach((o) => {
    const date = o.createdAt && typeof o.createdAt.toDate === "function"
      ? o.createdAt.toDate().toISOString() : new Date(o.createdAt).toISOString();
    const rate = Number(o.usdToNgnAtOrderTime) || 1440;
    rows.push([
      o.orderNumber || "",
      o.customerName || "",
      date,
      o.status || "",
      Number(o.total || 0).toFixed(2),
      (Number(o.total || 0) * rate).toFixed(0)
    ]);
  });

  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast("CSV exported", { type: "success" });
}

function bindEvents() {
  $("#rangeSelect").addEventListener("change", renderReport);
  $("#exportBtn").addEventListener("click", exportCSV);
}
