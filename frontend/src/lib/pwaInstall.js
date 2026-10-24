let installPrompt = null;
const listeners = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener(Boolean(installPrompt)));
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    notifyListeners();
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    notifyListeners();
  });
}

export function subscribeToInstallPrompt(listener) {
  listeners.add(listener);
  listener(Boolean(installPrompt));
  return () => listeners.delete(listener);
}

export async function promptAppInstall() {
  if (!installPrompt) return false;

  const prompt = installPrompt;
  installPrompt = null;
  notifyListeners();
  await prompt.prompt();
  const choice = await prompt.userChoice;
  return choice.outcome === "accepted";
}
