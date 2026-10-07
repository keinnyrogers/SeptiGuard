import { useEffect, useState } from "react";
import { CheckCircle2, Cpu, X } from "lucide-react";

export default function PairDeviceModal({ open, onClose }) {
  const [deviceId, setDeviceId] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const close = () => {
    setDeviceId("");
    setStatus("idle");
    setError("");
    onClose();
  };

  const submit = () => {
    const normalizedId = deviceId.trim();
    if (!normalizedId) {
      setError("Enter the Device ID printed on your sensor.");
      return;
    }

    setError("");
    setStatus("sending");
    setTimeout(() => setStatus("sent"), 700);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/75 p-4 backdrop-blur-sm" onMouseDown={close}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="pair-device-title"
        className="w-full max-w-md rounded-lg border border-border bg-card shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Cpu className="h-4 w-4" /> Device pairing
            </div>
            <h2 id="pair-device-title" className="mt-2 font-display text-lg font-semibold">
              {status === "sent" ? "Pairing request received" : "Pair a sensor device"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {status === "sent"
                ? "The device will appear here after pairing is connected to the backend."
                : "Enter the Device ID printed on the sensor or its packaging."}
            </p>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {status === "sent" ? (
            <div className="flex flex-col items-center gap-3 rounded-md border border-success/30 bg-success/10 p-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
              <p className="text-sm font-semibold">Device ID: {deviceId.trim()}</p>
              <p className="text-xs text-muted-foreground">Demo flow only — no device was linked yet.</p>
            </div>
          ) : (
            <>
              <label htmlFor="device-id" className="text-xs font-medium">Device ID</label>
              <input
                id="device-id"
                value={deviceId}
                onChange={(event) => setDeviceId(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && submit()}
                placeholder="e.g. TNK-001"
                autoFocus
                className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary/60"
              />
              {error && <p className="mt-2 text-xs text-danger">{error}</p>}
              <p className="mt-3 text-[11px] text-muted-foreground">
                Pairing validation will be connected when the device registry API is available.
              </p>
            </>
          )}
        </div>

        <div className="flex gap-3 border-t border-border p-4">
          {status === "sent" ? (
            <button type="button" onClick={close} className="h-10 flex-1 rounded-md bg-primary text-sm font-medium text-primary-foreground">Done</button>
          ) : (
            <>
              <button type="button" onClick={close} className="h-10 flex-1 rounded-md border border-border text-sm">Cancel</button>
              <button type="button" onClick={submit} disabled={status === "sending"} className="h-10 flex-1 rounded-md bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60">
                {status === "sending" ? "Checking..." : "Pair device"}
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
