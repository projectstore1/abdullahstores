/* Abdullah Store — Shared utilities
   Non-module script so it can be used from plain <script> tags too.
   Exposes everything under window.AS (Abduallah Store). */
(function (global) {
  "use strict";

  const LS_LANG = "abdullah_lang";
  const LS_CART = "abdullah_cart_v1";
  const LS_THEME = "abdullah_theme";

  /* ---------- i18n ---------- */
  const I18N = {
    bn: {
      "nav.home": "হোম",
      "nav.products": "পণ্যসমূহ",
      "nav.categories": "ক্যাটাগরি",
      "nav.cart": "কার্ট",
      "nav.account": "অ্যাকাউন্ট",
      "nav.orders": "আমার অর্ডার",
      "nav.notifications": "নোটিফিকেশন",
      "nav.login": "লগইন",
      "nav.register": "রেজিস্টার",
      "nav.logout": "লগআউট",
      "nav.admin": "অ্যাডমিন",
      "nav.contact": "যোগাযোগ",
      "nav.privacy": "প্রাইভেসি",
      "nav.terms": "শর্তাবলী",
      "search.placeholder": "পণ্য খুঁজুন...",
      "btn.add_to_cart": "কার্টে যোগ করুন",
      "btn.buy_now": "এখনই কিনুন",
      "btn.view_details": "বিস্তারিত দেখুন",
      "btn.checkout": "চেকআউট",
      "btn.continue_shopping": "শপিং চালিয়ে যান",
      "btn.save": "সেভ করুন",
      "btn.cancel": "বাতিল",
      "btn.delete": "মুছুন",
      "btn.confirm": "নিশ্চিত করুন",
      "btn.login": "লগইন",
      "btn.register": "রেজিস্টার",
      "btn.logout": "লগআউট",
      "btn.search": "খুঁজুন",
      "btn.place_order": "অর্ডার করুন",
      "cart.title": "আপনার কার্ট",
      "cart.empty": "আপনার কার্ট খালি",
      "cart.subtotal": "সাবটোটাল",
      "cart.delivery": "ডেলিভারি ফি",
      "cart.discount": "ছাড়",
      "cart.total": "মোট",
      "checkout.title": "চেকআউট",
      "checkout.name": "নাম",
      "checkout.phone": "ফোন নম্বর",
      "checkout.email": "ইমেইল",
      "checkout.address": "ডেলিভারি ঠিকানা",
      "checkout.notes": "অর্ডার নোট (ঐচ্ছিক)",
      "checkout.payment": "পেমেন্ট",
      "checkout.cod": "ক্যাশ অন ডেলিভারি",
      "order.status.pending": "পেন্ডিং",
      "order.status.confirmed": "নিশ্চিত",
      "order.status.processing": "প্রসেসিং",
      "order.status.shipped": "শিপড",
      "order.status.completed": "সম্পন্ন",
      "order.status.cancelled": "বাতিল",
      "toast.cart_added": "কার্টে যোগ হয়েছে",
      "toast.cart_removed": "কার্ট থেকে সরানো হয়েছে",
      "toast.error": "কিছু একটা ভুল হয়েছে",
      "toast.login_required": "অনুগ্রহ করে লগইন করুন",
      "auth.email": "ইমেইল",
      "auth.password": "পাসওয়ার্ড",
      "auth.name": "পূর্ণ নাম",
      "auth.phone": "ফোন নম্বর",
      "auth.forgot": "পাসওয়ার্ড ভুলে গেছেন?",
      "auth.no_account": "অ্যাকাউন্ট নেই?",
      "auth.have_account": "অ্যাকাউন্ট আছে?",
      "empty.products": "কোনো পণ্য পাওয়া যায়নি",
      "empty.orders": "কোনো অর্ডার নেই",
      "loading": "লোড হচ্ছে...",
      "confirm.delete": "আপনি কি নিশ্চিত? এই কাজটি ফিরিয়ে আনা যাবে না।",
      "footer.rights": "সর্বস্বত্ব সংরক্ষিত",
      "lang.bn": "বাংলা",
      "lang.en": "English"
    },
    en: {
      "nav.home": "Home",
      "nav.products": "Products",
      "nav.categories": "Categories",
      "nav.cart": "Cart",
      "nav.account": "Account",
      "nav.orders": "My Orders",
      "nav.notifications": "Notifications",
      "nav.login": "Login",
      "nav.register": "Register",
      "nav.logout": "Logout",
      "nav.admin": "Admin",
      "nav.contact": "Contact",
      "nav.privacy": "Privacy",
      "nav.terms": "Terms",
      "search.placeholder": "Search products...",
      "btn.add_to_cart": "Add to Cart",
      "btn.buy_now": "Buy Now",
      "btn.view_details": "View Details",
      "btn.checkout": "Checkout",
      "btn.continue_shopping": "Continue Shopping",
      "btn.save": "Save",
      "btn.cancel": "Cancel",
      "btn.delete": "Delete",
      "btn.confirm": "Confirm",
      "btn.login": "Login",
      "btn.register": "Register",
      "btn.logout": "Logout",
      "btn.search": "Search",
      "btn.place_order": "Place Order",
      "cart.title": "Your Cart",
      "cart.empty": "Your cart is empty",
      "cart.subtotal": "Subtotal",
      "cart.delivery": "Delivery Fee",
      "cart.discount": "Discount",
      "cart.total": "Total",
      "checkout.title": "Checkout",
      "checkout.name": "Name",
      "checkout.phone": "Phone",
      "checkout.email": "Email",
      "checkout.address": "Delivery Address",
      "checkout.notes": "Order Notes (optional)",
      "checkout.payment": "Payment",
      "checkout.cod": "Cash on Delivery",
      "order.status.pending": "Pending",
      "order.status.confirmed": "Confirmed",
      "order.status.processing": "Processing",
      "order.status.shipped": "Shipped",
      "order.status.completed": "Completed",
      "order.status.cancelled": "Cancelled",
      "toast.cart_added": "Added to cart",
      "toast.cart_removed": "Removed from cart",
      "toast.error": "Something went wrong",
      "toast.login_required": "Please log in first",
      "auth.email": "Email",
      "auth.password": "Password",
      "auth.name": "Full Name",
      "auth.phone": "Phone Number",
      "auth.forgot": "Forgot password?",
      "auth.no_account": "No account?",
      "auth.have_account": "Already have an account?",
      "empty.products": "No products found",
      "empty.orders": "No orders yet",
      "loading": "Loading...",
      "confirm.delete": "Are you sure? This cannot be undone.",
      "footer.rights": "All rights reserved",
      "lang.bn": "বাংলা",
      "lang.en": "English"
    }
  };

  function getLang() {
    return localStorage.getItem(LS_LANG) || "bn";
  }
  function setLang(lang) {
    if (!I18N[lang]) lang = "bn";
    localStorage.setItem(LS_LANG, lang);
    document.documentElement.setAttribute("lang", lang === "bn" ? "bn" : "en");
    applyI18n();
    document.dispatchEvent(new CustomEvent("langchanged", { detail: { lang } }));
  }
  function t(key, fallback) {
    const lang = getLang();
    return (I18N[lang] && I18N[lang][key]) || (I18N.en && I18N.en[key]) || fallback || key;
  }
  function applyI18n(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      el.textContent = t(key);
    });
    scope.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      el.setAttribute("placeholder", t(key));
    });
    scope.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria");
      el.setAttribute("aria-label", t(key));
    });
    scope.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      el.setAttribute("title", t(key));
    });
  }

  /* ---------- Formatting ---------- */
  function formatCurrency(amount, currency) {
    const n = Number(amount || 0);
    const cur = currency || (localStorage.getItem("abdullah_currency") || "BDT");
    const locale = getLang() === "bn" ? "bn-BD" : "en-US";
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: cur,
        maximumFractionDigits: 0
      }).format(n);
    } catch {
      return "৳" + n.toLocaleString(locale);
    }
  }

  function formatDate(ts) {
    if (!ts) return "";
    let d;
    if (typeof ts.toDate === "function") d = ts.toDate();
    else if (typeof ts === "number") d = new Date(ts);
    else if (typeof ts === "string") d = new Date(ts);
    else d = new Date(ts);
    if (isNaN(d.getTime())) return "";
    const locale = getLang() === "bn" ? "bn-BD" : "en-US";
    return d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
  }

  /* ---------- Toast ---------- */
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
  function toast(message, opts) {
    const { type = "info", duration = 3200 } = opts || {};
    const container = ensureToastContainer();
    const el = document.createElement("div");
    el.className = "toast toast-" + type;
    el.innerHTML = `<span class="toast-msg"></span><button class="toast-close" aria-label="Close">✕</button>`;
    el.querySelector(".toast-msg").textContent = message;
    el.querySelector(".toast-close").onclick = () => el.remove();
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add("toast-show"));
    setTimeout(() => {
      el.classList.remove("toast-show");
      setTimeout(() => el.remove(), 250);
    }, duration);
    return el;
  }

  /* ---------- Confirm dialog (Promise) ---------- */
  function confirmDialog(message, opts) {
    const { title = "Confirm", okText, cancelText } = opts || {};
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
      wrap.querySelector('[data-act="cancel"]').textContent = cancelText || t("btn.cancel");
      wrap.querySelector('[data-act="ok"]').textContent = okText || t("btn.confirm");
      document.body.appendChild(wrap);
      requestAnimationFrame(() => wrap.classList.add("open"));
      function close(result) {
        wrap.classList.remove("open");
        setTimeout(() => wrap.remove(), 200);
        resolve(result);
      }
      wrap.querySelector('[data-act="cancel"]').onclick = () => close(false);
      wrap.querySelector('[data-act="ok"]').onclick = () => close(true);
      wrap.addEventListener("click", (e) => { if (e.target === wrap) close(false); });
    });
  }

  /* ---------- Loading overlay ---------- */
  function showLoading(message) {
    hideLoading();
    const el = document.createElement("div");
    el.id = "as-loading-overlay";
    el.className = "loading-overlay";
    el.innerHTML = `<div class="spinner"></div><p>${message || t("loading")}</p>`;
    document.body.appendChild(el);
  }
  function hideLoading() {
    const el = document.getElementById("as-loading-overlay");
    if (el) el.remove();
  }

  /* ---------- Debounce ---------- */
  function debounce(fn, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /* ---------- Cart (localStorage, single source of truth on client) ---------- */
  function getCart() {
    try {
      const raw = localStorage.getItem(LS_CART);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }
  function setCart(items) {
    localStorage.setItem(LS_CART, JSON.stringify(items || []));
    document.dispatchEvent(new CustomEvent("cartchanged", { detail: { cart: getCart() } }));
    updateCartBadge();
  }
  function addToCart(product, qty) {
    const quantity = Math.max(1, parseInt(qty || 1, 10));
    const items = getCart();
    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({
        productId: product.id,
        name: product.name,
        image: product.image || (product.images && product.images[0]) || "",
        price: Number(product.price) || 0,
        discount: Number(product.discount) || 0,
        quantity
      });
    }
    setCart(items);
    toast(t("toast.cart_added"), { type: "success" });
  }
  function removeFromCart(productId) {
    setCart(getCart().filter((i) => i.productId !== productId));
    toast(t("toast.cart_removed"), { type: "info" });
  }
  function updateCartQuantity(productId, quantity) {
    const q = Math.max(1, parseInt(quantity, 10));
    setCart(getCart().map((i) => i.productId === productId ? { ...i, quantity: q } : i));
  }
  function clearCart() { setCart([]); }
  function getCartSubtotal() {
    return getCart().reduce((sum, i) => {
      const unit = i.discount > 0 ? i.price - (i.price * i.discount / 100) : i.price;
      return sum + unit * i.quantity;
    }, 0);
  }
  function updateCartBadge() {
    const count = getCart().reduce((n, i) => n + (i.quantity || 0), 0);
    document.querySelectorAll("[data-cart-badge]").forEach((el) => {
      el.textContent = count > 99 ? "99+" : String(count);
      el.style.display = count > 0 ? "inline-flex" : "none";
    });
  }

  /* ---------- API helper ---------- */
  async function api(path, opts) {
    const base = (window.ABDULLAH && window.ABDULLAH.API_BASE) || "";
    const { method = "GET", body, token, headers = {} } = opts || {};
    const h = { "Content-Type": "application/json", ...headers };
    if (token) h.Authorization = "Bearer " + token;
    const res = await fetch(base.replace(/\/$/, "") + path, {
      method, headers: h, body: body ? JSON.stringify(body) : undefined
    });
    let json = null;
    try { json = await res.json(); } catch {}
    if (!res.ok) {
      const err = new Error((json && (json.message || json.error)) || ("HTTP " + res.status));
      err.status = res.status;
      err.payload = json;
      throw err;
    }
    return json;
  }

  /* ---------- Admin-only helper: role check via current user doc ---------- */
  async function isAdminUser(db, doc, getDoc, uid) {
    if (!uid) return false;
    try {
      const snap = await getDoc(doc(db, "users", uid));
      return snap.exists() && snap.data().role === "admin";
    } catch { return false; }
  }

  /* ---------- Init on DOM ready ---------- */
  function bootstrap() {
    if (!document.documentElement.getAttribute("lang")) {
      document.documentElement.setAttribute("lang", getLang());
    }
    applyI18n();
    updateCartBadge();
    document.addEventListener("cartchanged", updateCartBadge);
    // Wire up language switchers, if present
    document.querySelectorAll("[data-lang-switch]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        setLang(el.getAttribute("data-lang-switch"));
      });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }

  global.AS = {
    I18N, getLang, setLang, t, applyI18n,
    formatCurrency, formatDate,
    toast, confirmDialog, showLoading, hideLoading, debounce,
    getCart, setCart, addToCart, removeFromCart, updateCartQuantity,
    clearCart, getCartSubtotal, updateCartBadge,
    api, isAdminUser
  };
})(window);
