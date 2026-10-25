/* Abdullah Store Admin — Products CRUD */

import { renderAdminChrome, guardAdminPage, $, $$, formatUSD, formatNGN, toast, confirmDialog } from "./admin-common.js";
import { db, storage } from "../js/firebase-config.js";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  ref as storageRef, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";
import { escapeHtml, imageUrl } from "../js/utilities.js";

renderAdminChrome("products.html", "Products");

let allProducts = [];
let allCategories = [];

(async () => {
  await guardAdminPage();
  await loadCategories();
  await loadProducts();
  bindEvents();
})();

async function loadCategories() {
  try {
    const snap = await getDocs(collection(db, "categories"));
    allCategories = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const filterSel = $("#categoryFilter");
    const formSel = $("#pCategory");
    const opts = allCategories.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
    filterSel.innerHTML = `<option value="">All categories</option>` + opts;
    formSel.innerHTML = `<option value="">— None —</option>` + opts;
  } catch (err) {
    console.warn("Categories load:", err);
  }
}

async function loadProducts() {
  const tbody = $("#productsBody");
  try {
    const snap = await getDocs(collection(db, "products"));
    allProducts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderList();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="admin-empty" style="color:#DC2626">${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderList() {
  const tbody = $("#productsBody");
  const search = ($("#searchInput").value || "").toLowerCase();
  const catFilter = $("#categoryFilter").value;

  let list = allProducts.filter((p) => {
    if (search && !(p.name || "").toLowerCase().includes(search)) return false;
    if (catFilter && p.categoryId !== catFilter) return false;
    return true;
  });

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="admin-empty">No products found</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((p) => {
    const price = Number(p.price || 0);
    const disc = Number(p.discount || 0);
    const final = disc > 0 ? price - (price * disc / 100) : price;
    const stock = Number(p.stock || 0);
    return `
      <tr>
        <td><img src="${imageUrl(p.images)}" style="width:48px;height:48px;border-radius:6px;object-fit:cover" onerror="this.src='data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 48 48%22%3E%3Crect width=%2248%22 height=%2248%22 fill=%22%23F1F5F9%22/%3E%3C/svg%3E'"></td>
        <td><div style="font-weight:600">${escapeHtml(p.name || "")}</div><div style="font-size:.75rem;color:var(--muted)">${escapeHtml(p.categoryId || "")}</div></td>
        <td>
          <div style="font-weight:700">${formatUSD(final)}</div>
          <div style="font-size:.72rem;color:var(--green)">${formatNGN(final)}</div>
          ${disc > 0 ? `<div style="font-size:.7rem;color:var(--orange)">-${disc}%</div>` : ""}
        </td>
        <td>${stock}</td>
        <td><span class="badge badge-${p.enabled ? 'Completed' : 'Cancelled'}">${p.enabled ? "Enabled" : "Disabled"}</span></td>
        <td>
          <div class="actions">
            <button class="btn btn-ghost btn-sm" data-edit="${p.id}">Edit</button>
            <button class="btn btn-danger btn-sm" data-delete="${p.id}">Delete</button>
          </div>
        </td>
      </tr>`;
  }).join("");

  tbody.querySelectorAll("[data-edit]").forEach((b) => b.onclick = () => openEdit(b.dataset.edit));
  tbody.querySelectorAll("[data-delete]").forEach((b) => b.onclick = () => deleteProduct(b.dataset.delete));
}

function openAdd() {
  $("#modalTitle").textContent = "Add Product";
  $("#productForm").reset();
  $("#productId").value = "";
  $("#pEnabled").checked = true;
  $("#productModal").style.display = "grid";
  $("#productModal").classList.add("open");
  $("#uploadStatus").textContent = "";
}

function openEdit(id) {
  const p = allProducts.find((x) => x.id === id);
  if (!p) return;
  $("#modalTitle").textContent = "Edit Product";
  $("#productId").value = id;
  $("#pName").value = p.name || "";
  $("#pDesc").value = p.description || "";
  $("#pPrice").value = Number(p.price || 0);
  $("#pDiscount").value = Number(p.discount || 0);
  $("#pStock").value = Number(p.stock || 0);
  $("#pCategory").value = p.categoryId || "";
  $("#pImages").value = Array.isArray(p.images) ? p.images.join(", ") : (p.images || "");
  $("#pEnabled").checked = !!p.enabled;
  $("#uploadStatus").textContent = "";
  $("#productModal").style.display = "grid";
  $("#productModal").classList.add("open");
}

function closeModal() {
  $("#productModal").classList.remove("open");
  setTimeout(() => $("#productModal").style.display = "none", 200);
}

async function saveProduct(e) {
  e.preventDefault();
  const id = $("#productId").value;
  const images = ($("#pImages").value || "").split(",").map((s) => s.trim()).filter(Boolean);
  const data = {
    name: $("#pName").value.trim(),
    description: $("#pDesc").value.trim(),
    price: Number($("#pPrice").value),
    discount: Number($("#pDiscount").value || 0),
    stock: Number($("#pStock").value || 0),
    categoryId: $("#pCategory").value || "",
    images,
    enabled: $("#pEnabled").checked,
    updatedAt: serverTimestamp()
  };

  const btn = $("#saveBtn");
  btn.disabled = true; btn.textContent = "Saving...";

  try {
    if (id) {
      await updateDoc(doc(db, "products", id), data);
      toast("Product updated", { type: "success" });
    } else {
      data.createdAt = serverTimestamp();
      data.sales = 0;
      await addDoc(collection(db, "products"), data);
      toast("Product created", { type: "success" });
    }
    closeModal();
    await loadProducts();
  } catch (err) {
    toast("Save failed: " + err.message, { type: "error" });
  } finally {
    btn.disabled = false; btn.textContent = "Save";
  }
}

async function deleteProduct(id) {
  const ok = await confirmDialog("Delete this product? This cannot be undone.", {
    title: "Delete Product", okText: "Delete"
  });
  if (!ok) return;
  try {
    await deleteDoc(doc(db, "products", id));
    toast("Product deleted", { type: "success" });
    await loadProducts();
  } catch (err) {
    toast("Delete failed: " + err.message, { type: "error" });
  }
}

async function uploadImage(file) {
  const status = $("#uploadStatus");
  if (!file) return null;
  if (file.size > 5 * 1024 * 1024) {
    status.textContent = "File too large (max 5MB)";
    status.style.color = "#DC2626";
    return null;
  }
  if (!file.type.startsWith("image/")) {
    status.textContent = "Not an image file";
    status.style.color = "#DC2626";
    return null;
  }
  try {
    status.textContent = "Uploading...";
    status.style.color = "var(--muted)";
    const path = `products/${Date.now()}_${file.name}`;
    const ref = storageRef(storage, path);
    await uploadBytes(ref, file);
    const url = await getDownloadURL(ref);
    status.textContent = "✓ Uploaded";
    status.style.color = "var(--green)";
    return url;
  } catch (err) {
    status.textContent = "Upload failed: " + err.message;
    status.style.color = "#DC2626";
    return null;
  }
}

function bindEvents() {
  $("#addBtn").onclick = openAdd;
  $("#cancelBtn").onclick = closeModal;
  $("#modalClose").onclick = closeModal;
  $("#productForm").addEventListener("submit", saveProduct);
  $("#searchInput").addEventListener("input", renderList);
  $("#categoryFilter").addEventListener("change", renderList);

  $("#pImageFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    const url = await uploadImage(file);
    if (url) {
      const input = $("#pImages");
      input.value = input.value ? input.value + ", " + url : url;
    }
  });
}
