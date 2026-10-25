/* Abdullah Store — Auth helpers
   Wrap Firebase Auth calls with our own error messages and profile creation. */

import { auth, db, googleProvider } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

/* Map Firebase error codes to friendly strings */
export function friendlyAuthError(err) {
  const code = (err && err.code) || "";
  const map = {
    "auth/email-already-in-use": "This email is already registered.",
    "auth/invalid-email": "Invalid email address.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/user-not-found": "No account with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/popup-closed-by-user": "Sign-in cancelled.",
    "auth/popup-blocked": "Popup blocked. Allow popups and retry.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/unauthorized-domain": "This domain is not authorized in Firebase. Add it under Authentication → Settings → Authorized domains.",
    "auth/operation-not-allowed": "This sign-in method is not enabled in Firebase."
  };
  return map[code] || (err && err.message) || "Something went wrong.";
}

/* Ensure users/{uid} doc exists. Called after registration or Google login. */
export async function ensureUserProfile(user, extra = {}) {
  if (!user) return null;
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data();
  }
  const data = {
    uid: user.uid,
    email: user.email || "",
    name: extra.name || user.displayName || (user.email ? user.email.split("@")[0] : "Customer"),
    phone: extra.phone || "",
    photo: user.photoURL || null,
    address: "",
    role: "customer",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    fcmTokens: []
  };
  await setDoc(ref, data);
  return data;
}

/* ---------- Register ---------- */
export async function registerWithEmail({ name, email, password, phone }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) {
    try { await updateProfile(cred.user, { displayName: name }); } catch {}
  }
  await ensureUserProfile(cred.user, { name, phone });
  return cred.user;
}

/* ---------- Login ---------- */
export async function loginWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(cred.user);
  return cred.user;
}

/* ---------- Google login ---------- */
export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  await ensureUserProfile(cred.user);
  return cred.user;
}

/* ---------- Password reset ---------- */
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

/* ---------- Logout ---------- */
export async function logoutUser() {
  await signOut(auth);
}

/* ---------- Get current profile ---------- */
export async function getProfile(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

/* ---------- Await auth ready (for page scripts) ---------- */
export function waitForAuth() {
  return new Promise((resolve) => {
    const off = onAuthStateChanged(auth, (user) => {
      off();
      resolve(user || null);
    });
  });
}
