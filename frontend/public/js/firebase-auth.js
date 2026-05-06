import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

function hasValidFirebaseConfig(config) {
  if (!config) return false;
  const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"];
  return requiredKeys.every((key) => {
    const value = config[key];
    return typeof value === "string" && value.trim() && !value.includes("YOUR_");
  });
}

function setAlert(message, kind = "error") {
  const alert = document.getElementById("auth-alert");
  if (!alert) return;
  if (!message) {
    alert.hidden = true;
    alert.textContent = "";
    alert.className = "auth-alert";
    return;
  }
  alert.hidden = false;
  alert.textContent = message;
  alert.className = `auth-alert ${kind}`;
}

function setLoading(loading) {
  const submit = document.getElementById("auth-submit");
  const toggle = document.getElementById("auth-toggle");
  const reset = document.getElementById("auth-reset");
  const google = document.getElementById("auth-google");
  if (submit) submit.disabled = loading;
  if (toggle) toggle.disabled = loading;
  if (reset) reset.disabled = loading;
  if (google) google.disabled = loading;
}

window.initAuthUI = function initAuthUI(onReady) {
  const authShell = document.getElementById("auth-shell");
  const appShell = document.getElementById("app-shell");
  const form = document.getElementById("auth-form");
  const emailInput = document.getElementById("auth-email");
  const passInput = document.getElementById("auth-password");
  const confirmInput = document.getElementById("auth-confirm-password");
  const confirmGroup = document.getElementById("confirm-group");
  const toggleBtn = document.getElementById("auth-toggle");
  const resetBtn = document.getElementById("auth-reset");
  const googleBtn = document.getElementById("auth-google");
  const title = document.getElementById("auth-title");
  const subtitle = document.getElementById("auth-subtitle");
  const submitBtn = document.getElementById("auth-submit");
  const userEmailTag = document.getElementById("auth-user-email");
  const logoutBtn = document.getElementById("logout-btn");

  if (!authShell || !appShell || !form || !emailInput || !passInput || !confirmGroup || !toggleBtn || !resetBtn || !googleBtn || !title || !subtitle || !submitBtn || !userEmailTag || !logoutBtn) {
    return;
  }

  const config = window.FIREBASE_CONFIG;
  if (!hasValidFirebaseConfig(config)) {
    setAlert("Firebase is not configured. Update /js/firebase-config.js with your project keys.", "error");
    setLoading(true);
    return;
  }

  const app = initializeApp(config);
  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: "select_account" });
  let isRegisterMode = false;

  function syncModeUI() {
    if (isRegisterMode) {
      title.textContent = "Create Account";
      subtitle.textContent = "Register with email and password to use SB-DSS.";
      submitBtn.textContent = "Create Account";
      toggleBtn.textContent = "Already Have an Account";
      confirmGroup.hidden = false;
      confirmInput.required = true;
      passInput.autocomplete = "new-password";
    } else {
      title.textContent = "Sign In";
      subtitle.textContent = "Use your Firebase account to access the dashboard.";
      submitBtn.textContent = "Sign In";
      toggleBtn.textContent = "Create New Account";
      confirmGroup.hidden = true;
      confirmInput.required = false;
      confirmInput.value = "";
      passInput.autocomplete = "current-password";
    }
  }

  function openApp(user) {
    authShell.classList.add("hidden");
    appShell.classList.remove("hidden");
    userEmailTag.textContent = user?.email || "Signed In";
    if (typeof onReady === "function") onReady();
  }

  function openAuth() {
    appShell.classList.add("hidden");
    authShell.classList.remove("hidden");
    form.reset();
    syncModeUI();
  }

  onAuthStateChanged(auth, (user) => {
    setAlert("");
    if (user) {
      openApp(user);
      return;
    }
    openAuth();
  });

  toggleBtn.addEventListener("click", () => {
    isRegisterMode = !isRegisterMode;
    setAlert("");
    syncModeUI();
  });

  resetBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    if (!email) {
      setAlert("Enter your email first, then click Forgot Password.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setAlert("Password reset email sent.", "success");
    } catch (error) {
      setAlert(error?.message || "Unable to send password reset email.");
    } finally {
      setLoading(false);
    }
  });

  googleBtn.addEventListener("click", async () => {
    setAlert("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      if (error?.code !== "auth/popup-closed-by-user") {
        setAlert(error?.message || "Google sign-in failed.");
      }
    } finally {
      setLoading(false);
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setAlert("");

    const email = emailInput.value.trim();
    const password = passInput.value;
    const confirmPassword = confirmInput.value;

    if (!email || !password) {
      setAlert("Email and password are required.");
      return;
    }

    if (isRegisterMode && password !== confirmPassword) {
      setAlert("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (isRegisterMode) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      setAlert(error?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
    } catch (error) {
      setAlert(error?.message || "Unable to logout.");
    }
  });

  syncModeUI();
};
