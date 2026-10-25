/* Abdullah Store — Login page */
import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { loginWithEmail, loginWithGoogle, friendlyAuthError } from "./auth.js";
import { toast } from "./utilities.js";

const next = new URLSearchParams(location.search).get("next") || "account.html";

/* Redirect if already signed in */
onAuthStateChanged(auth, (u) => {
  if (u) location.href = next;
});

function showError(name, msg) {
  const el = document.querySelector(`[data-error="${name}"]`);
  if (el) { el.textContent = msg; el.classList.add("show"); }
}
function clearErrors() {
  document.querySelectorAll(".form-error").forEach((e) => {
    e.textContent = ""; e.classList.remove("show");
  });
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email) return showError("email", "Email is required");
  if (!password) return showError("password", "Password is required");

  const btn = document.getElementById("submitBtn");
  btn.disabled = true; btn.textContent = "Signing in...";
  try {
    await loginWithEmail(email, password);
    toast("Welcome back!", { type: "success" });
    location.href = next;
  } catch (err) {
    toast(friendlyAuthError(err), { type: "error" });
    btn.disabled = false; btn.textContent = "Login";
  }
});

document.getElementById("googleBtn").addEventListener("click", async () => {
  const btn = document.getElementById("googleBtn");
  btn.disabled = true;
  try {
    await loginWithGoogle();
    toast("Signed in with Google", { type: "success" });
    location.href = next;
  } catch (err) {
    toast(friendlyAuthError(err), { type: "error" });
    btn.disabled = false;
  }
});
