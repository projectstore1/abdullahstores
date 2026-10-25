/* Abdullah Store — Account page */
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  doc, getDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  toast, confirmDialog, escapeHtml, formatDate
} from "./utilities.js";
import { logoutUser } from "./auth.js";

let currentUser = null;
let currentProfile = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "login.html?next=account.html";
    return;
  }
  currentUser = user;
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    currentProfile = snap.exists() ? snap.data() : null;
    render();
  } catch (err) {
    document.getElementById("accountContent").innerHTML =
      `<div class="empty"><h3>Could not load account</h3><p>${escapeHtml(err.message)}</p></div>`;
  }
});

function render() {
  const p = currentProfile || {};
  const el = document.getElementById("accountContent");

  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px">
      <div>
        <h1 class="section-title">My Account</h1>
        <p style="color:var(--muted);font-size:.9rem;margin-top:4px">${escapeHtml(p.email || currentUser.email)}</p>
      </div>
      ${p.role === "admin" ? `<a href="admin/dashboard.html" class="btn btn-dark btn-sm">Admin Dashboard →</a>` : ""}
    </div>

    <!-- Quick links -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:24px">
      <a href="my-orders.html" class="category-card" style="text-decoration:none">
        <div class="category-card-img" style="background:#DBEAFE;color:#1D4ED8">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:30px;height:30px"><path d="M3 7h18M3 12h18M3 17h18"/></svg>
        </div>
        <h3>My Orders</h3>
      </a>
      <a href="notifications.html" class="category-card" style="text-decoration:none">
        <div class="category-card-img" style="background:#FEF3C7;color:#B45309">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:30px;height:30px"><path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 004 0"/></svg>
        </div>
        <h3>Notifications</h3>
      </a>
      <a href="cart.html" class="category-card" style="text-decoration:none">
        <div class="category-card-img" style="background:#D1FAE5;color:#047857">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:30px;height:30px"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2l2.5 12h11L21 8H6"/></svg>
        </div>
        <h3>Cart</h3>
      </a>
    </div>

    <!-- Profile form -->
    <div style="background:var(--white);border-radius:12px;padding:24px;box-shadow:var(--shadow);max-width:560px">
      <h2 style="font-size:1.1rem;font-weight:800;margin-bottom:16px">Profile Information</h2>
      <form id="profileForm">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input class="form-input" id="name" value="${escapeHtml(p.name || "")}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Phone</label>
          <input class="form-input" id="phone" type="tel" value="${escapeHtml(p.phone || "")}">
        </div>
        <div class="form-group">
          <label class="form-label">Address</label>
          <textarea class="form-textarea" id="address">${escapeHtml(p.address || "")}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-input" value="${escapeHtml(p.email || "")}" disabled>
          <div class="form-hint">Email cannot be changed here.</div>
        </div>
        <button type="submit" class="btn btn-primary">Save Changes</button>
      </form>

      <hr style="margin:24px 0;border:none;border-top:1px solid var(--border)">

      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-size:.85rem;color:var(--muted)">Account created</div>
          <div style="font-weight:600">${formatDate(p.createdAt) || "—"}</div>
        </div>
        <button class="btn btn-ghost" id="logoutBtn">Logout</button>
      </div>
    </div>
  `;

  document.getElementById("profileForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();
    if (!name) { toast("Name is required", { type: "error" }); return; }
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        name, phone, address, updatedAt: serverTimestamp()
      });
      try { await updateProfile(currentUser, { displayName: name }); } catch {}
      toast("Profile updated", { type: "success" });
      currentProfile = { ...currentProfile, name, phone, address };
    } catch (err) {
      toast("Could not save: " + err.message, { type: "error" });
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    const ok = await confirmDialog("Sign out of your account?", { okText: "Logout", cancelText: "Cancel" });
    if (!ok) return;
    await logoutUser();
    location.href = "index.html";
  });
}
