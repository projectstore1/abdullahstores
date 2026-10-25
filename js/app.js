/* Abdullah Store — App shell: header, session, cart badge, SW registration */

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { updateCartBadge, toast, refreshExchangeRate } from "./utilities.js";

/* ---------- Session state ---------- */
export let currentUser = null;
export let currentProfile = null;

/* ---------- Auth state listener ---------- */
onAuthStateChanged(auth, async (user) => {
  currentUser = user || null;

  const accountBtn = document.getElementById("accountBtn");
  if (!user) {
    currentProfile = null;
    if (accountBtn) accountBtn.href = "login.html";
    document.dispatchEvent(new CustomEvent("authready", { detail: { user: null, profile: null } }));
    return;
  }

  // fetch profile to know role
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    currentProfile = snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn("Profile fetch failed", e);
    currentProfile = null;
  }

  if (accountBtn) accountBtn.href = "account.html";
  document.dispatchEvent(new CustomEvent("authready", {
    detail: { user, profile: currentProfile }
  }));
});

/* ---------- Logout helper (used in account page) ---------- */
export async function logout() {
  try {
    await signOut(auth);
    toast("Logged out", { type: "info" });
    setTimeout(() => location.href = "index.html", 400);
  } catch (e) {
    toast("Logout failed", { type: "error" });
  }
}

/* ---------- Global search redirect ---------- */
document.querySelectorAll("[data-search-form]").forEach((form) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = form.querySelector("[data-search-input]");
    const q = input ? input.value.trim() : "";
    location.href = q
      ? `products.html?search=${encodeURIComponent(q)}`
      : "products.html";
  });
});

/* ---------- Bottom nav active state ---------- */
const page = document.body.dataset.page || "";
document.querySelectorAll("[data-nav]").forEach((link) => {
  if (link.dataset.nav === page) link.classList.add("active");
});

/* ---------- Cart badge ---------- */
updateCartBadge();
document.addEventListener("cartchanged", updateCartBadge);

/* ---------- Service worker ---------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((err) => {
      console.warn("SW registration failed:", err);
    });
  });
}

/* ---------- Live currency rate (best effort) ---------- */
refreshExchangeRate().catch(() => {});
