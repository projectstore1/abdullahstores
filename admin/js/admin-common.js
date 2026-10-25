/* Abdullah Store Admin — Shared helpers, sidebar, auth guard */

import { auth, db } from "../js/firebase-config.js";
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { doc, getDoc }
  from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { toast, confirmDialog, escapeHtml, formatDate }
  from "../js/utilities.js";

export { auth, db, toast, confirmDialog, escapeHtml, formatDate };

/* ---------- Toast fallback if utilities.js missing ---------- */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- Sidebar nav items ---------- */
export const NAV_ITEMS = [
  { href: "dashboard.html", label: "Dashboard", icon: `<path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z"/>` },
  { href: "products.html",  label: "Products",  icon: `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>` },
  { href: "categories.html",label: "Categories",icon: `<path d="M4 4h16v4H4zM4 10h16v4H4zM4 16h16v4H4z"/>` },
  { href: "orders.html",    label: "Orders",    icon: `<path d="M3 7h18M3 12h18M3 17h18"/>` },
  { href: "customers.html", label: "Customers", icon: `<circle cx="12" cy="8" r="4"/><path d="M4 22c0-4 4-7 8-7s8 3 8 7"/>` },
  { href: "banners.html",   label: "Banners",   icon: `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/>` },
  { href: "reports.html",   label: "Reports",   icon: `<path d="M4 20h16M4 4v16M8 16l4-6 4 3 4-7"/>` },
  { href: "settings.html",  label: "Settings",  icon: `<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 00-.1-1.2l2-1.6-2-3.5-2.4 1a7 7 0 00-2-1.2L14 3h-4l-.5 2.5a7 7 0 00-2 1.2l-2.4-1-2 3.5 2 1.6a7 7 0 000 2.4l-2 1.6 2 3.5 2.4-1a7 7 0 002 1.2L10 21h4l.5-2.5a7 7 0 002-1.2l2.4 1 2-3.5-2-1.6c.1-.4.1-.8.1-1.2z"/>` }
];

/* ---------- Render sidebar + topbar ---------- */
export function renderAdminChrome(currentPage = "", pageTitle = "Admin") {
  const layout = document.getElementById("adminLayout");
  if (!layout) return;

  const sidebarHTML = `
    <aside class="admin-sidebar" id="adminSidebar">
      <div class="admin-sidebar-head">
        <h1>Abdullah<span>Store</span></h1>
        <p>Admin Panel</p>
      </div>
      <nav class="admin-nav">
        ${NAV_ITEMS.map((it) => `
          <a href="${it.href}" class="${it.href === currentPage ? "active" : ""}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${it.icon}</svg>
            <span>${it.label}</span>
          </a>`).join("")}
      </nav>
      <div class="admin-sidebar-foot">
        <button id="adminLogoutBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px">
            <path d="M9 4H5v16h4"/><path d="M15 8l4 4-4 4"/><path d="M19 12H9"/>
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  `;

  const topbarHTML = `
    <header class="admin-topbar">
      <button class="menu-btn" id="menuToggle" aria-label="Toggle menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px">
          <path d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      <h2>${escapeHtml(pageTitle)}</h2>
      <div class="admin-user" id="adminUserInfo"></div>
      <a href="../index.html" target="_blank">View Store ↗</a>
    </header>
  `;

  layout.insertAdjacentHTML("afterbegin", sidebarHTML);
  document.querySelector(".admin-main")?.insertAdjacentHTML("afterbegin", topbarHTML);

  // Toggle sidebar on mobile
  const sidebar = document.getElementById("adminSidebar");
  document.getElementById("menuToggle")?.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 900 && sidebar.classList.contains("open")) {
      if (!sidebar.contains(e.target) && !e.target.closest("#menuToggle")) {
        sidebar.classList.remove("open");
      }
    }
  });

  // Logout
  document.getElementById("adminLogoutBtn")?.addEventListener("click", async () => {
    const ok = await confirmDialog("Sign out of the admin panel?", { okText: "Sign out" });
    if (!ok) return;
    await signOut(auth);
    location.href = "index.html";
  });
}

/* ---------- Auth guard: redirect non-admins ---------- */
export function guardAdminPage() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        location.href = "index.html";
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const profile = snap.exists() ? snap.data() : null;
        if (!profile || profile.role !== "admin") {
          location.href = "../index.html";
          return;
        }
        // Fill user info
        const info = document.getElementById("adminUserInfo");
        if (info) {
          info.innerHTML = `<strong>${escapeHtml(profile.name || user.email)}</strong>`;
        }
        resolve({ user, profile });
      } catch (err) {
        console.error("Admin check failed:", err);
        location.href = "../index.html";
      }
    });
  });
}

/* ---------- Common format helpers ---------- */
export function formatUSD(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(Number(n || 0));
}
export function formatNGN(n) {
  const rate = Number(localStorage.getItem("abdullah_usd_ngn_rate")) || 1440;
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN",
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(Number(n || 0) * rate);
}
