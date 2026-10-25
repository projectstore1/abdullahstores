/* =========================================================================
   Abdullah Store — Firebase Config (Web SDK v11.10.0 via CDN ES modules)
   ========================================================================= */

import { initializeApp, getApps, getApp }
  from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import { getAuth, GoogleAuthProvider }
  from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import { getFirestore }
  from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import { getStorage }
  from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

import { getMessaging, isSupported }
  from "https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging.js";

import { getAnalytics, isSupported as isAnalyticsSupported }
  from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBpEnmamrWAeAbnsUDDgUzVcaqB0q2Sl_M",
  authDomain: "ecommerceproject-ca840.firebaseapp.com",
  projectId: "ecommerceproject-ca840",
  storageBucket: "ecommerceproject-ca840.firebasestorage.app",
  messagingSenderId: "1010677219657",
  appId: "1:1010677219657:web:b757e0dc8d6cca2ebd9a98",
  measurementId: "G-TKMZSPC2CL"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export const getMessagingSafe = async () => {
  try {
    return (await isSupported()) ? getMessaging(app) : null;
  } catch (error) {
    console.warn("Firebase Messaging unavailable:", error);
    return null;
  }
};

export const getAnalyticsSafe = async () => {
  try {
    return (await isAnalyticsSupported()) ? getAnalytics(app) : null;
  } catch (error) {
    console.warn("Firebase Analytics unavailable:", error);
    return null;
  }
};

export { app };
