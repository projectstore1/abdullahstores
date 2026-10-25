/* Abdullah Store — Utilities (English, USD + NGN dual currency) */

const LS_CART = "abdullah_cart_v1";
const LS_RATE = "abdullah_usd_ngn_rate";

export const DEFAULT_USD_TO_NGN = 1440;

/* ============ STRINGS ============ */
export const STRINGS = {
  siteName: "Abdullah Store",
  searchPlaceholder: "Search products...",
  emptyProducts: "No products found.",
  emptyOrders: "You have no orders yet.",
  emptyCart: "Your cart is empty.",
  emptyNotifications: "No notifications yet.",
  loading: "Loading...",
  confirmDelete: "Are you sure? This cannot be undone.",
  signInRequired: "Please sign in to continue.",
  adminRequired: "Admin access required.",
  status: {
    Pending: "Pending", Confirmed: "Confirmed", Processing: "Processing",
    Shipped: "Shipped", Completed: "Completed", Cancelled: "Cancelled"
  }
};

/* ============ EXCHANGE RATE ============ */
export function getUsdToNgnRate() {
  const n = Number(localStorage.getItem(LS_RATE));
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_USD_TO_NGN;
}
export function setUsdToNgnRate(rate) {
  const n = Number(rate);
  if (!Number.isFinite(n) || n <= 0) return;
  localStorage.setItem(LS_RATE, String(n));
  document.dispatchEvent(new CustomEvent("currencyratechanged", { detail: { rate: n } }));
}
export async function refreshExchangeRate() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
    if (!res.ok) return getUsdToNgnRate();
    const data = await res.json();
    const ngn = data?.rates?.NGN;
    if (Number.isFinite(ngn) && ngn > 0) { setUsdToNgnRate(ngn); return ngn; }
  } catch {}
  return getUsdToNgnRate();
}

/* ============ FORMATTERS ============ */
export function formatUSD(amount) {
  const n = Number(amount || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(n);
}
export function usdToNgn(usd) { return Number(usd || 0) * getUsdToNgnRate(); }
export function formatNGN(usd) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN",
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(usdToNgn(usd));
}
export function formatCurrency(amount) { return formatUSD(amount); }
export function formatDual(usd) { return `${formatUSD(usd)}  •  ${formatNGN(usd)}`; }
export function formatDualHTML(usd, opts) {
  const size = (opts && opts.size) || "md";
  return `<span class="price-dual price-dual-${size}">
    <span class="price-usd">${formatUSD(usd)}</span>
    <span class="price-ngn">≈ ${formatNGN(usd)}</span>
  </span>`;
}

export function formatDate(ts) {
  if (!ts) return "";
  const d = typeof ts.toDate === "function" ? ts.toDate()
          : typeof ts === "number" ? new Date(ts) : new Date(ts);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

/* ============ TOAST ============ */
function ensureToastContainer() {
  let el = document.getElementById("as-toast-container");
  if (!el) {
    el = document.createElement("div");
    el.id = "as-toast-container";
    el.className = "toast-container";
    el.setAttribute("role", "region");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  return el;
}
export function toast(message, opts) {
  const { type = "info", duration = 3200 } = opts || {};
  const c = ensureToastContainer();
  const el = document.createElement("div");
  el.className = "toast toast-" + type;
  el.innerHTML = `<span class="toast-msg"></span><button class="toast-close" aria-label="Close">✕</button>`;
  el.querySelector(".toast-msg").textContent = message;
  el.querySelector(".toast-close").onclick = () => el.remove();
  c.appendChild(el);
  requestAnimationFrame(() => el.classList.add("toast-show"));
  setTimeout(() => { el.classList.remove("toast-show"); setTimeout(() => el.remove(), 250); }, duration);
  return el;
}

/* ============ CONFIRM DIALOG ============ */
export function confirmDialog(message, opts) {
  const { title = "Confirm", okText = "Confirm", cancelText = "Cancel" } = opts || {};
  return new Promise((resolve) => {
    const wrap = document.createElement("div");
    wrap.className = "modal-backdrop";
    wrap.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <h3 class="modal-title"></h3>
        <p class="modal-body"></p>
        <div class="modal-actions">
          <button class="btn btn-ghost" data-act="cancel"></button>
          <button class="btn btn-primary" data-act="ok"></button>
        </div>
      </div>`;
    wrap.querySelector(".modal-title").textContent = title;
    wrap.querySelector(".modal-body").textContent = message;
    wrap.querySelector('[data-act="cancel"]').textContent = cancelText;
    wrap.querySelector('[data-act="ok"]').textContent = okText;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add("open"));
    const close = (r) => { wrap.classList.remove("open"); setTimeout(() => wrap.remove(), 200); resolve(r); };
    wrap.querySelector('[data-act="cancel"]').onclick = () => close(false);
    wrap.querySelector('[data-act="ok"]').onclick = () => close(true);
    wrap.addEventListener("click", (e) => { if (e.target === wrap) close(false); });
  });
}

/* ============ LOADING ============ */
export function showLoading(msg) {
  hideLoading();
  const el = document.createElement("div");
  el.id = "as-loading-overlay";
  el.className = "loading-overlay";
  el.innerHTML = `<div class="spinner"></div><p>${msg || STRINGS.loading}</p>`;
  document.body.appendChild(el);
}
export function hideLoading() {
  const el = document.getElementById("as-loading-overlay");
  if (el) el.remove();
}

/* ============ HELPERS ============ */
export function debounce(fn, wait = 300) {
  let to;
  return function (...args) {
    clearTimeout(to);
    to = setTimeout(() => fn.apply(this, args), wait);
  };
}
export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* ============ PLACEHOLDER IMAGE (inline SVG) ============ */
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="#F1F5F9"/>
      <path d="M120 260 L200 140 L280 260 Z" fill="#E2E8F0"/>
      <circle cx="150" cy="180" r="20" fill="#CBD5E1"/>
      <text x="200" y="330" font-family="Arial,sans-serif" font-size="20"
            text-anchor="middle" fill="#94A3B8">No Image</text>
    </svg>`
  );

export function imageUrl(value) {
  if (!value) return PLACEHOLDER_IMAGE;
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value) && value.length && value[0]) return value[0];
  return PLACEHOLDER_IMAGE;
}

/* ============ CART (stored in USD) ============ */
export function getCart() {
  try {
    const raw = localStorage.getItem(LS_CART);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
export function setCart(items) {
  localStorage.setItem(LS_CART, JSON.stringify(items || []));
  updateCartBadge();
  document.dispatchEvent(new CustomEvent("cartchanged", { detail: { cart: getCart() } }));
}
export function addToCart(product, qty = 1) {
  const quantity = Math.max(1, parseInt(qty, 10) || 1);
  const items = getCart();
  const existing = items.find((i) => i.productId === product.id);
  if (existing) existing.quantity += quantity;
  else items.push({
    productId: product.id,
    name: product.name,
    image: imageUrl(product.image || product.images),
    price: Number(product.price) || 0,
    discount: Number(product.discount) || 0,
    quantity
  });
  setCart(items);
  toast("Added to cart", { type: "success" });
}
export function removeFromCart(productId) {
  setCart(getCart().filter((i) => i.productId !== productId));
  toast("Removed from cart", { type: "info" });
}
export function updateCartQuantity(productId, quantity) {
  const q = Math.max(1, parseInt(quantity, 10) || 1);
  setCart(getCart().map((i) => i.productId === productId ? { ...i, quantity: q } : i));
}
export function clearCart() { setCart([]); }
export function getCartSubtotal() {
  return getCart().reduce((sum, i) => {
    const unit = i.discount > 0 ? i.price - (i.price * i.discount / 100) : i.price;
    return sum + unit * i.quantity;
  }, 0);
}
export function updateCartBadge() {
  const count = getCart().reduce((n, i) => n + (i.quantity || 0), 0);
  document.querySelectorAll("[data-cart-badge]").forEach((el) => {
    el.textContent = count > 99 ? "99+" : String(count);
    el.style.display = count > 0 ? "inline-flex" : "none";
  });
}

/* ============ ICON SVG ============ */
export const iconSVG = (name) => {
  const icons = {
    home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/></svg>`,
    grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
    cart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2l2.5 12h11L21 8H6"/></svg>`,
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 22c0-4 4-7 8-7s8 3 8 7"/></svg>`,
    search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></svg>`,
    menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
    logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 4H5v16h4"/><path d="M15 8l4 4-4 4"/><path d="M19 12H9"/></svg>`
  };
  return icons[name] || "";
};

/* ============ BOOTSTRAP ============ */
export function bootstrapUtilities() {
  document.documentElement.setAttribute("lang", "en");
  updateCartBadge();
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrapUtilities);
} else {
  bootstrapUtilities();
}
