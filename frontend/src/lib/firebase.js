import { getApp, getApps, initializeApp } from "@firebase/app";
import { deleteToken, getMessaging, getToken, isSupported, onMessage } from "@firebase/messaging";
import { firebaseConfig, isFirebaseMessagingConfigured, vapidKey } from "./firebaseConfig.js";

let foregroundListenerCount = 0;
let unsubscribeForegroundListener;

export async function listenForFirebaseForegroundMessages() {
  if (
    !isFirebaseMessagingConfigured()
    || !("Notification" in window)
    || !("serviceWorker" in navigator)
    || Notification.permission !== "granted"
    || !(await isSupported())
  ) {
    return () => {};
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  if (!unsubscribeForegroundListener) {
    unsubscribeForegroundListener = onMessage(messaging, (payload) => {
      const title = payload.data?.title ?? payload.notification?.title;
      const body = payload.data?.body ?? payload.notification?.body ?? "";
      if (!title || Notification.permission !== "granted") return;

      const options = {
        body,
        icon: "/brand-mark.png",
        data: { url: payload.data?.url ?? "/alerts" },
      };
      navigator.serviceWorker.getRegistration("/fcm/")
        .then((registration) => {
          if (registration) return registration.showNotification(title, options);
          new Notification(title, options);
        })
        .catch((error) => {
          console.error("Could not display the foreground push notification.", error);
        });
    });
  }
  foregroundListenerCount += 1;

  let active = true;
  return () => {
    if (!active) return;
    active = false;
    foregroundListenerCount -= 1;
    if (foregroundListenerCount === 0) {
      unsubscribeForegroundListener?.();
      unsubscribeForegroundListener = undefined;
    }
  };
}

function withTimeout(promise, timeoutMs, message) {
  let timeoutId;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]).finally(() => window.clearTimeout(timeoutId));
}

function waitForServiceWorkerActivation(registration) {
  const worker = registration.active ?? registration.installing ?? registration.waiting;

  if (worker?.state === "activated") return Promise.resolve();
  if (!worker || worker.state === "redundant") {
    return Promise.reject(new Error("The push notification service worker could not be activated."));
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("The push notification service worker is taking too long to start. Reload the page and try again."));
    }, 15000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      worker.removeEventListener("statechange", onStateChange);
    };

    const onStateChange = () => {
      if (worker.state === "activated") {
        cleanup();
        resolve();
      } else if (worker.state === "redundant") {
        cleanup();
        reject(new Error("The push notification service worker failed to activate. Reload the page and try again."));
      }
    };

    worker.addEventListener("statechange", onStateChange);
    onStateChange();
  });
}

async function getTokenWithTimeout(messaging, options) {
  return withTimeout(
    getToken(messaging, options),
    30000,
    "The browser push service did not respond within 30 seconds. Check your connection and try again.",
  );
}

export async function requestFirebasePushToken(onProgress = () => {}) {
  if (!isFirebaseMessagingConfigured()) {
    throw new Error("Push notifications are not configured for this portal.");
  }

  onProgress("Checking browser push support…");
  const supported = await withTimeout(
    isSupported(),
    10000,
    "Checking browser push support timed out. Reload the page and try again.",
  );
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !supported) {
    throw new Error("This browser does not support push notifications.");
  }

  onProgress("Waiting for notification permission…");
  const permission = await withTimeout(
    Notification.requestPermission(),
    60000,
    "The browser did not finish the notification permission request. Check the site notification setting and try again.",
  );
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const messaging = getMessaging(app);
  const workerConfig = encodeURIComponent(JSON.stringify(firebaseConfig));
  onProgress("Starting the push notification service worker…");
  const registration = await withTimeout(
    navigator.serviceWorker.register(
      `/fcm/firebase-messaging-sw.js?config=${workerConfig}`,
      { scope: "/fcm/" },
    ),
    15000,
    "The push notification service worker did not register in time. Reload the page and try again.",
  );
  onProgress("Waiting for the push notification service worker to activate…");
  await waitForServiceWorkerActivation(registration);
  onProgress("Requesting a subscription from the browser push service…");
  const token = await getTokenWithTimeout(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error("Firebase did not provide a push token for this device.");
  }

  return token;
}

export async function deleteFirebasePushToken() {
  if (!isFirebaseMessagingConfigured() || !(await isSupported())) return false;

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const messaging = getMessaging(app);
  const workerConfig = encodeURIComponent(JSON.stringify(firebaseConfig));
  const registration = await withTimeout(
    navigator.serviceWorker.getRegistration("/fcm/").then((existingRegistration) => {
      if (existingRegistration) return existingRegistration;
      return navigator.serviceWorker.register(
        `/fcm/firebase-messaging-sw.js?config=${workerConfig}`,
        { scope: "/fcm/" },
      );
    }),
    15000,
    "The push notification service worker did not register in time. Reload the page and try again.",
  );
  await waitForServiceWorkerActivation(registration);
  await getTokenWithTimeout(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  return deleteToken(messaging);
}
