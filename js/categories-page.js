/* Abdullah Store — Categories page */
import { db } from "./firebase-config.js";
import {
  collection, getDocs, query, orderBy
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { imageUrl, escapeHtml } from "./utilities.js";

async function load() {
  const el = document.getElementById("categoryList");
  if (!el) return;
  try {
    let snap;
    try {
      snap = await getDocs(query(collection(db, "categories"), orderBy("order", "asc")));
    } catch {
      snap = await getDocs(collection(db, "categories"));
    }
    if (snap.empty) {
      el.innerHTML = `<div class="empty" style="grid-column:1/-1">
        <h3>No categories yet</h3><p>Admin can add categories from the dashboard.</p>
      </div>`;
      return;
    }
    el.innerHTML = snap.docs.map((d) => {
      const c = d.data();
      return `
        <a href="products.html?category=${d.id}" class="category-card">
          <div class="category-card-img">
            <img src="${imageUrl(c.image)}" alt="${escapeHtml(c.name || '')}" loading="lazy">
          </div>
          <h3>${escapeHtml(c.name || "Untitled")}</h3>
        </a>`;
    }).join("");
  } catch (err) {
    console.error(err);
    el.innerHTML = `<div class="empty" style="grid-column:1/-1">
      <h3>Could not load categories</h3><p>${escapeHtml(err.message)}</p>
    </div>`;
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", load);
} else load();
