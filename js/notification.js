/* Abdullah Store — Notifications page + push permission helper */

import { auth, db, getMessagingSafe } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  collection, query, where, orderBy, getDocs,
  doc, updateDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getToken } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging.js";
import { formatDate, escapeHtml, toast } from "./utilities.js";

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "login.html?next=notifications.html";
    return;
  }
  currentUser = user;
  await loadNotifications(user.uid);
  await maybeShowPushButton();
});

async function loadNotifications(uid) {
  const el = document.getElementById("notifList");
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      el.innerHTML = `
        <div class="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9"/>
            <path d="M10 21a2 2 0 004 0"/>
          </svg>
          <h3>No notifications yet</h3>
          <p>You'll see order updates and announcements here.</p>
          <a href="products.html" class="btn btn-primary">Browse Products</a>
        </div>`;
      return;
    }
    el.innerHTML = snap.docs.map((d) => {
      const n = d.data();
      return `
        <div class="order-card" data-id="${d.id}" data-url="${escapeHtml(n.url || '')}" data-read="${n.read ? '1' : '0'}"
             style="cursor:pointer;${!n.read ? "border-left:4px solid var(--green)" : ""}">
          <div class="order-head">
            <div>
              <div style="font-weight:700;font-size:.95rem">${escapeHtml(n.title || "Notification")}</div>
              <div class="order-date">${formatDate(n.createdAt)}</div>
            </div>
            ${!n.read ? `<span class="order-status Pending" style="font-size:.7rem">New</span>` : ""}
          </div>
          <p style="font-size:.9rem;color:var(--text);margin-top:4px">${escapeHtml(n.body || "")}</p>
        </div>`;
    }).join("");

    el.querySelectorAll(".order-card[data-id]").forEach((card) => {
      card.addEventListener("click", async () => {
        const id = card.dataset.id;
        const url = card.dataset.url;
        const read = card.dataset.read === "1";
        if (!read) {
          try { await updateDoc(doc(db, "notifications", id), { read: true }); } catch {}
        }
        if (url) location.href = url;
      });
    });
  } catch (err) {
    console.error("Notifications load:", err);
    el.innerHTML = `<div class="empty"><h3>Could not load</h3><p>${escapeHtml(err.message)}</p></div>`;
  }
}

/* ---------- Optional: FCM push permission ---------- */
async function maybeShowPushButton() {
  const container = document.getElementById("notifList");
  if (!container || document.getElementById("pushBtnWrap")) return;

  const messaging = await getMessagingSafe();
  if (!messaging) return;

  const wrap = document.createElement("div");
  wrap.id = "pushBtnWrap";
  wrap.style.cssText = "background:var(--white);border-radius:12px;padding:14px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;gap:12px;box-shadow:var(--shadow)";
  wrap.innerHTML = `
    <div>
      <div style="font-weight:700;font-size:.92rem">Enable push notifications</div>
      <div style="font-size:.8rem;color:var(--muted)">Get instant order updates (requires HTTPS)</div>
    </div>
    <button class="btn btn-primary btn-sm" id="pushBtn">Enable</button>
  `;
  container.parentNode.insertBefore(wrap, container);

  const btn = document.getElementById("pushBtn");
  if (Notification.permission === "granted") btn.textContent = "Enabled";
  btn.addEventListener("click", async () => {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { toast("Permission denied", { type: "error" }); return; }

      // VAPID key must be set in Firebase Console → Cloud Messaging → Web Push certificates
      const VAPID_KEY = "REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY";
      if (VAPID_KEY.startsWith("REPLACE_")) {
        toast("Set VAPID key in js/notifications.js to enable push", { type: "error" });
        return;
      }
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) {
        // Save to user profile fcmTokens
        const { arrayUnion } = await import("https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js");
        await updateDoc(doc(db, "users", currentUser.uid), { fcmTokens: arrayUnion(token) });
        toast("Push notifications enabled", { type: "success" });
        btn.textContent = "Enabled"; btn.disabled = true;
      }
    } catch (err) {
      toast("Push error: " + err.message, { type: "error" });
    }
  });
}
