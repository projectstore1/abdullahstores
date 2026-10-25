/* Abdullah Store Admin — Categories CRUD */

import { renderAdminChrome, guardAdminPage, $, toast, confirmDialog } from "./admin-common.js";
import { db } from "../js/firebase-config.js";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { escapeHtml, imageUrl } from "../js/utilities.js";

renderAdminChrome("categories.html", "Categories");

let allCats = [];

(async () => {
  await guardAdminPage();
  await loadCats();
  bindEvents();
})();

async function loadCats() {
  const tbody = $("#categoriesBody");
  try {
    let snap;
    try { snap = await getDocs(query(collection(db, "categories"), orderBy("order", "asc"))); }
    catch { snap = await getDocs(collection(db, "categories")); }
    allCats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderList();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="admin-empty" style="color:#DC2626">${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderList() {
  const tbody = $("#categoriesBody");
  if (!allCats.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="admin-empty">No categories yet</td></tr>`;
    return;
  }
  tbody.innerHTML = allCats.map((c) => `
    <tr>
      <td><img src="${imageUrl(c.image)}" style="width:48px;height:48px;border-radius:6px;object-fit:cover"></td>
      <td style="font-weight:600">${escapeHtml(c.name || "")}</td>
      <td>${c.order || 0}</td>
      <td>
        <div class="actions">
          <button class="btn btn-ghost btn-sm" data-edit="${c.id}">Edit</button>
          <button class="btn btn-danger btn-sm" data-delete="${c.id}">Delete</button>
        </div>
      </td>
    </tr>`).join("");

  tbody.querySelectorAll("[data-edit]").forEach((b) => b.onclick = () => openEdit(b.dataset.edit));
  tbody.querySelectorAll("[data-delete]").forEach((b) => b.onclick = () => deleteCat(b.dataset.delete));
}

function openAdd() {
  $("#modalTitle").textContent = "Add Category";
  $("#categoryForm").reset();
  $("#categoryId").value = "";
  $("#cOrder").value = allCats.length;
  $("#categoryModal").style.display = "grid";
  $("#categoryModal").classList.add("open");
}

function openEdit(id) {
  const c = allCats.find((x) => x.id === id);
  if (!c) return;
  $("#modalTitle").textContent = "Edit Category";
  $("#categoryId").value = id;
  $("#cName").value = c.name || "";
  $("#cImage").value = c.image || "";
  $("#cOrder").value = c.order || 0;
  $("#categoryModal").style.display = "grid";
  $("#categoryModal").classList.add("open");
}

function closeModal() {
  $("#categoryModal").classList.remove("open");
  setTimeout(() => $("#categoryModal").style.display = "none", 200);
}

async function saveCat(e) {
  e.preventDefault();
  const id = $("#categoryId").value;
  const data = {
    name: $("#cName").value.trim(),
    image: $("#cImage").value.trim(),
    order: Number($("#cOrder").value || 0),
    updatedAt: serverTimestamp()
  };
  const btn = $("#saveBtn");
  btn.disabled = true; btn.textContent = "Saving...";
  try {
    if (id) {
      await updateDoc(doc(db, "categories", id), data);
      toast("Category updated", { type: "success" });
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, "categories"), data);
      toast("Category created", { type: "success" });
    }
    closeModal();
    await loadCats();
  } catch (err) {
    toast("Save failed: " + err.message, { type: "error" });
  } finally {
    btn.disabled = false; btn.textContent = "Save";
  }
}

async function deleteCat(id) {
  const ok = await confirmDialog("Delete this category?", { okText: "Delete" });
  if (!ok) return;
  try {
    await deleteDoc(doc(db, "categories", id));
    toast("Category deleted", { type: "success" });
    await loadCats();
  } catch (err) {
    toast("Delete failed: " + err.message, { type: "error" });
  }
}

function bindEvents() {
  $("#addBtn").onclick = openAdd;
  $("#cancelBtn").onclick = closeModal;
  $("#modalClose").onclick = closeModal;
  $("#categoryForm").addEventListener("submit", saveCat);
}
