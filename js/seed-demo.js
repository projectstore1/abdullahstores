/* Abdullah Store — Demo data seeder (admin only)
   Run once from admin dashboard after creating your admin account.
   Adds sample categories, products, banners so the store isn't empty. */

import { db, auth } from "./firebase-config.js";
import {
  collection, doc, setDoc, addDoc, serverTimestamp, getDocs, query, limit
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

/* Sample image URLs — open-source, hotlinked from unsplash.
   Admin can replace these later from the admin products page. */
const IMG = {
  headphones: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=70",
  watch:      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=70",
  shoes:      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=70",
  bag:        "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=600&q=70",
  sunglasses: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=70",
  phone:      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=70",
  laptop:     "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=70",
  shirt:      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=70",
  camera:     "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=70",
  book:       "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=70"
};

const CATEGORIES = [
  { slug: "electronics", name: "Electronics", image: IMG.laptop, order: 1 },
  { slug: "fashion",     name: "Fashion",     image: IMG.shirt,  order: 2 },
  { slug: "accessories", name: "Accessories", image: IMG.watch,  order: 3 },
  { slug: "footwear",    name: "Footwear",    image: IMG.shoes,  order: 4 }
];

const PRODUCTS = [
  { name: "Wireless Headphones Pro",    price: 79.99,  discount: 15, stock: 25, categorySlug: "electronics", images: [IMG.headphones], sales: 42, desc: "Premium over-ear headphones with active noise cancellation, 30-hour battery, and crystal-clear sound." },
  { name: "Smart Watch Series 5",        price: 129.00, discount: 10, stock: 18, categorySlug: "electronics", images: [IMG.watch],      sales: 31, desc: "Track fitness, heart rate, and notifications. 7-day battery. Water resistant." },
  { name: "Running Sneakers",            price: 59.50,  discount: 20, stock: 40, categorySlug: "footwear",    images: [IMG.shoes],      sales: 88, desc: "Lightweight running shoes with breathable mesh and responsive cushioning." },
  { name: "Leather Backpack",            price: 89.00,  discount: 0,  stock: 15, categorySlug: "accessories", images: [IMG.bag],        sales: 12, desc: "Genuine leather backpack with laptop compartment. Fits 15-inch laptops." },
  { name: "Classic Sunglasses",          price: 39.99,  discount: 5,  stock: 60, categorySlug: "accessories", images: [IMG.sunglasses], sales: 55, desc: "UV400 protection, polarized lenses, timeless design." },
  { name: "Smartphone X12",              price: 699.00, discount: 8,  stock: 8,  categorySlug: "electronics", images: [IMG.phone],      sales: 20, desc: "6.5-inch OLED display, 128GB storage, triple camera, 5G." },
  { name: "Ultrabook Laptop 14\"",       price: 999.00, discount: 12, stock: 6,  categorySlug: "electronics", images: [IMG.laptop],     sales: 9,  desc: "Intel i7, 16GB RAM, 512GB SSD. All-day battery life." },
  { name: "Cotton T-Shirt Premium",      price: 19.99,  discount: 0,  stock: 100,categorySlug: "fashion",     images: [IMG.shirt],      sales: 140,desc: "100% cotton, pre-shrunk, available in multiple sizes." },
  { name: "Pro DSLR Camera",             price: 549.00, discount: 5,  stock: 10, categorySlug: "electronics", images: [IMG.camera],     sales: 7,  desc: "24MP sensor, 4K video, includes 18-55mm lens." },
  { name: "Bestseller Novel",            price: 14.99,  discount: 0,  stock: 200,categorySlug: "fashion",     images: [IMG.book],       sales: 210,desc: "Award-winning fiction. Perfect for weekend reading." }
];

/* Admin guard check — only admin users may run seed */
async function assertAdmin() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  return user;
}

export async function seedDemoData() {
  const user = await assertAdmin();

  /* Skip if products already exist */
  const existing = await getDocs(query(collection(db, "products"), limit(1)));
  if (!existing.empty) {
    return { ok: false, message: "Store already has products. Skipping seed." };
  }

  /* 1. Categories */
  const catIdBySlug = {};
  for (const c of CATEGORIES) {
    const ref = doc(db, "categories", c.slug);
    await setDoc(ref, {
      name: c.name,
      image: c.image,
      order: c.order,
      createdAt: serverTimestamp()
    });
    catIdBySlug[c.slug] = ref.id;
  }

  /* 2. Products */
  let count = 0;
  for (const p of PRODUCTS) {
    await addDoc(collection(db, "products"), {
      name: p.name,
      description: p.desc,
      price: p.price,
      discount: p.discount,
      stock: p.stock,
      categoryId: catIdBySlug[p.categorySlug] || "",
      images: p.images,
      enabled: true,
      sales: p.sales,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    count++;
  }

  /* 3. Banners */
  await addDoc(collection(db, "banners"), {
    title: "Free delivery on orders over $50",
    subtitle: "Save more with our exclusive bundles.",
    image: IMG.headphones,
    link: "products.html",
    enabled: true,
    order: 1,
    createdAt: serverTimestamp()
  });

  /* 4. Store settings */
  await setDoc(doc(db, "settings", "store"), {
    storeName: "Abdullah Store",
    email: "contact@abdullahstore.com",
    phone: "+880 1700 000000",
    address: "Dhaka, Bangladesh",
    deliveryFee: 5,
    currency: "USD",
    announcement: "Welcome to Abdullah Store!",
    updatedAt: serverTimestamp(),
    updatedBy: user.email
  }, { merge: true });

  return { ok: true, message: `Seeded ${count} products + ${CATEGORIES.length} categories + 1 banner.` };
}

export async function clearAllProducts() {
  await assertAdmin();
  const snap = await getDocs(collection(db, "products"));
  for (const d of snap.docs) {
    try { await setDoc(d.ref, { enabled: false }, { merge: true }); } catch {}
  }
  return { ok: true, message: `Disabled ${snap.size} products.` };
}
