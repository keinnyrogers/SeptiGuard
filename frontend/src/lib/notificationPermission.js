function withTimeout(promise, timeoutMs, message) {
  let timeoutId;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]).finally(() => window.clearTimeout(timeoutId));
}

function blockedPermissionMessage() {
  return "Notifications are blocked for SeptiGuard. On Android, long-press the app icon, open App info > Notifications, and allow them. In a browser, allow notifications in the site's settings. Then reload and try again.";
}

export function requestNotificationPermission(onProgress = () => {}) {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    throw new Error("This browser does not support push notifications.");
  }

  if (Notification.permission === "denied") {
    throw new Error(blockedPermissionMessage());
  }

  onProgress("Waiting for notification permission…");
  const permissionRequest = Notification.permission === "granted"
    ? Promise.resolve("granted")
    : Notification.requestPermission();

  return withTimeout(
    permissionRequest,
    60000,
    "The browser did not finish the notification permission request. Check the site notification setting and try again.",
  ).then((permission) => {
    if (permission !== "granted") {
      throw new Error(blockedPermissionMessage());
    }

    return permission;
  });
}
