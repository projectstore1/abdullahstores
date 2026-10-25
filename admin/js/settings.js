/* Abdullah Store Admin — Store settings */

import { renderAdminChrome, guardAdminPage, $, toast } from "./admin-common.js";
import { db } from "../js/firebase-config.js";
import {
  doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getUsdToNgnRate, setUsdToNgnRate } from "../js/utilities.js";

renderAdminChrome("settings.html", "Settings");

(async () => {
  await guardAdminPage();
  await loadSettings();
  bindEvents();
})();

async function loadSettings() {
  try {
    const snap = await getDoc(doc(db, "settings", "store"));
    const s = snap.exists() ? snap.data() : {};
    $("#sName").value = s.storeName || "Abdullah Store";
    $("#sLogo").value = s.logo || "";
    $("#sEmail").value = s.email || "";
    $("#sPhone").value = s.phone || "";
    $("#sAddress").value = s.address || "";
    $("#sDelivery").value = Number(s.deliveryFee ?? 5);
    $("#sCurrency").value = s.currency || "USD";
    $("#sAnnouncement").value = s.announcement || "";
    $("#sRate").value = getUsdToNgnRate();
  } catch (err) {
    toast("Could not load settings: " + err.message, { type: "error" });
  }
}

async function saveSettings(e) {
  e.preventDefault();
  const btn = $("#saveBtn");
  btn.disabled = true; btn.textContent = "Saving...";
  try {
    const data = {
      storeName: $("#sName").value.trim(),
      logo: $("#sLogo").value.trim(),
      email: $("#sEmail").value.trim(),
      phone: $("#sPhone").value.trim(),
      address: $("#sAddress").value.trim(),
      deliveryFee: Number($("#sDelivery").value || 0),
      currency: "USD",
      announcement: $("#sAnnouncement").value.trim(),
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(db, "settings", "store"), data, { merge: true });

    const rate = Number($("#sRate").value);
    if (Number.isFinite(rate) && rate > 0) setUsdToNgnRate(rate);

    toast("Settings saved", { type: "success" });
  } catch (err) {
    toast("Save failed: " + err.message, { type: "error" });
  } finally {
    btn.disabled = false; btn.textContent = "Save Settings";
  }
}

function bindEvents() {
  $("#settingsForm").addEventListener("submit", saveSettings);
  $("#resetBtn").addEventListener("click", loadSettings);
}
