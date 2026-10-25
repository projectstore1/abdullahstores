importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBpEnmamrWAeAbnsUDDgUzVcaqB0q2Sl_M",
  authDomain: "ecommerceproject-ca840.firebaseapp.com",
  projectId: "ecommerceproject-ca840",
  storageBucket: "ecommerceproject-ca840.firebasestorage.app",
  messagingSenderId: "1010677219657",
  appId: "1:1010677219657:web:b757e0dc8d6cca2ebd9a98"
});

let messaging = null;
try { messaging = firebase.messaging(); }
catch (err) { console.warn("[FCM-SW] init failed:", err); }

if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    const title = payload?.notification?.title || "Abdullah Store";
    self.registration.showNotification(title, {
      body: payload?.notification?.body || "You have a new update.",
      data: payload?.data || {}
    });
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "./notifications.html";
  event.waitUntil(clients.openWindow(url));
});
