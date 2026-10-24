importScripts("https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js");

const serializedConfig = new URL(self.location.href).searchParams.get("config");

if (serializedConfig) {
  firebase.initializeApp(JSON.parse(serializedConfig));
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title ?? payload.data?.title ?? "SeptiGuard update";
    const body = payload.notification?.body ?? payload.data?.body ?? "";
    self.registration.showNotification(title, {
      body,
      icon: "/brand-mark.png",
      data: { url: payload.data?.url ?? "/alerts" },
    });
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destination = new URL(event.notification.data?.url ?? "/alerts", self.location.origin).href;
  event.waitUntil(self.clients.openWindow(destination));
});
