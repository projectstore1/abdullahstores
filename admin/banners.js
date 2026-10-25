/* Abdullah Store Admin — Banners CRUD */

import { renderAdminChrome, guardAdminPage, $, toast, confirmDialog } from "./admin-common.js";
import { db } from "../js/firebase-config.js";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { escapeHtml, imageUrl } from "../js/utilities.js";

renderAdminChrome("banners.html", "Banners");

let allBanners = [];

(async () => {
  await guardAdminPage();
  await loadBanners();
  bindEvents();
})();

async function loadBanners() {
  const tbody = $("#bannersBody");
  try {
    const snap = await getDocs(collection(db, "banners"));
    allBanners = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderList();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="admin-empty" style="color:#DC2626">${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderList() {
  const tbody = $("#bannersBody");
  if (!allBanners.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="admin-empty">No banners yet</td></tr>`;
    return;
  }
  tbody.innerHTML = allBanners.map((b) => `
    <tr>
      <td><img src="${imageUrl(b.image)}" style="width:80px;height:44px;border-radius:4px;object-fit:cover"></td>
      <td style="font-weight:600">${escapeHtml(b.title || "")}</td>
      <td style="font-size:.82rem;color:var(--muted)">${escapeHtml(b.link || "—")}</td>
      <td><span class="badge badge-${b.enabled ? 'Completed' : 'Cancelled'}">${b.enabled ? "Enabled" : "Disabled"}</span></td>
      <td>${b.order || 0}</td>
      <td><div class="actions">
        <button class="btn btn-ghost btn-sm" data-edit="${b.id}">Edit</button>
        <button class="btn btn-danger btn-sm" data-delete="${b.id}">Delete</button>
      </div></td>
    </tr>`).join("");

  tbody.querySelectorAll("[data-edit]").forEach((btn) => btn.onclick = () => openEdit(btn.dataset.edit));
  tbody.querySelectorAll("[data-delete]").forEach((btn) => btn.onclick = () => deleteBanner(btn.dataset.delete));
}

function openAdd() {
  $("#modalTitle").textContent = "Add Banner";
  $("#bannerForm").reset();
  $("#bannerId").value = "";
  $("#bEnabled").checked = true;
  $("#bannerModal").style.display = "grid";
  $("#bannerModal").classList.add("open");
}

function openEdit(id) {
  const b = allBanners.find((x) => x.id === id);
  if (!b) return;
  $("#modalTitle").textContent = "Edit Banner";
  $("#bannerId").value = id;
  $("#bTitle").value = b.title || "";
  $("#bSubtitle").value = b.subtitle || "";
  $("#bImage").value = b.image || "";
  $("#bLink").value = b.link || "";
  $("#bOrder").value = b.order || 0;
  $("#bEnabled").checked = !!b.enabled;
  $("#bannerModal").style.display = "grid";
  $("#bannerModal").classList.add("open");
}

function closeModal() {
  $("#bannerModal").classList.remove("open");
  setTimeout(() => $("#bannerModal").style.display = "none", 200);
}

async function saveBanner(e) {
  e.preventDefault();
  const id = $("#bannerId").value;
  const data = {
    title: $("#bTitle").value.trim(),
    subtitle: $("#bSubtitle").value.trim(),
    image: $("#bImage").value.trim(),
    link: $("#bLink").value.trim(),
    order: Number($("#bOrder").value || 0),
    enabled: $("#bEnabled").checked,
    updatedAt: serverTimestamp()
  };
  const btn = $("#saveBtn");
  btn.disabled = true; btn.textContent = "Saving...";
  try {
    if (id) {
      await updateDoc(doc(db, "banners", id), data);
      toast("Banner updated", { type: "success" });
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, "banners"), data);
      toast("Banner created", { type: "success" });
    }
    closeModal();
    await loadBanners();
  } catch (err) {
    toast("Save failed: " + err.message, { type: "error" });
  } finally {
    btn.disabled = false; btn.textContent = "Save";
  }
}

async function deleteBanner(id) {
  const ok = await confirmDialog("Delete this banner?", { okText: "Delete" });
  if (!ok) return;
  try {
    await deleteDoc(doc(db, "banners", id));
    toast("Banner deleted", { type: "success" });
    await loadBanners();
  } catch (err) {
    toast("Delete failed: " + err.message, { type: "error" });
  }
}

function bindEvents() {
  $("#addBtn").onclick = openAdd;
  $("#cancelBtn").onclick = closeModal;
  $("#modalClose").onclick = closeModal;
  $("#bannerForm").addEventListener("submit", saveBanner);
}
