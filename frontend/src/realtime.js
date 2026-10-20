import Echo from "laravel-echo";
import Pusher from "pusher-js";

let echo;

function getEcho() {
  if (echo) return echo;

  window.Pusher = Pusher;
  echo = new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY ?? "septiguard-local",
    wsHost: import.meta.env.VITE_REVERB_HOST ?? "localhost",
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? "http") === "https",
    enabledTransports: ["ws", "wss"],
  });

  return echo;
}

export function subscribeToTank(deviceId, onReading) {
  if (!deviceId) return () => {};

  const channel = getEcho().channel(`tank.${deviceId}`);
  channel.listen(".reading.received", onReading);

  return () => {
    channel.stopListening(".reading.received", onReading);
    getEcho().leave(`tank.${deviceId}`);
  };
}
