/* Abdullah Store — Register page */
import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { registerWithEmail, loginWithGoogle, friendlyAuthError } from "./auth.js";
import { toast } from "./utilities.js";

onAuthStateChanged(auth, (u) => {
  if (u) location.href = "account.html";
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

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  let ok = true;
  if (!name) { showError("name", "Name is required"); ok = false; }
  if (!email) { showError("email", "Email is required"); ok = false; }
  if (!password) { showError("password", "Password is required"); ok = false; }
  else if (password.length < 6) { showError("password", "Minimum 6 characters"); ok = false; }
  if (password !== confirmPassword) { showError("confirmPassword", "Passwords do not match"); ok = false; }
  if (!ok) return;

  const btn = document.getElementById("submitBtn");
  btn.disabled = true; btn.textContent = "Creating...";
  try {
    await registerWithEmail({ name, email, password, phone });
    toast("Account created!", { type: "success" });
    location.href = "account.html";
  } catch (err) {
    toast(friendlyAuthError(err), { type: "error" });
    btn.disabled = false; btn.textContent = "Create Account";
  }
});

document.getElementById("googleBtn").addEventListener("click", async () => {
  const btn = document.getElementById("googleBtn");
  btn.disabled = true;
  try {
    await loginWithGoogle();
    toast("Signed in with Google", { type: "success" });
    location.href = "account.html";
  } catch (err) {
    toast(friendlyAuthError(err), { type: "error" });
    btn.disabled = false;
  }
});
