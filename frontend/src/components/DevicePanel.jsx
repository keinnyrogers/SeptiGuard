import { useEffect, useState } from "react";
import { X, Cpu, MapPin, User, Save } from "lucide-react";
import { LOW_BATTERY_THRESHOLD } from "@/data/devices";

const STATUS_BADGE = {
  online: "bg-success/15 text-success",
  offline: "bg-danger/15 text-danger",
};
const SIGNAL_BADGE = {
  strong: "bg-success/15 text-success",
  moderate: "bg-warning/15 text-warning",
  weak: "bg-danger/15 text-danger",
};

function batteryColor(v) {
  if (v == null) return "bg-muted";
  if (v <= LOW_BATTERY_THRESHOLD) return "bg-danger";
  if (v <= 50) return "bg-warning";
  return "bg-success";
}
function fmtDate(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

const field =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring";

export default function DevicePanel({ device, onClose, onSave }) {
  const [form, setForm] = useState(device ?? {});

  useEffect(() => {
    if (device) setForm(device);
  }, [device]);

  useEffect(() => {
    if (!device) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [device]);

  if (!device) return null;
  const offline = device.status === "offline";

  function submit(e) {
    e.preventDefault();
    // Later: PUT to Laravel — updates the septic_systems row for this device_id.
    onSave({ ...device, ...form });
  }

  return (
    <div className="panel-overlay-in fixed inset-0 z-50 flex justify-end overflow-hidden bg-black/80" onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="panel-slide-in flex h-[100svh] min-h-0 max-h-[100svh] w-full flex-col border-l border-border bg-card lg:max-w-md"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/15">
              <Cpu className="h-5 w-5 text-primary" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold leading-tight">{device.device_id}</h2>
              <p className="text-xs text-muted-foreground">Device details</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close panel" className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={submit} className="flex flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
            <section className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-md px-2 py-1 text-xs font-medium capitalize ${STATUS_BADGE[device.status]}`}>{device.status}</span>
                {offline ? (
                  <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">No signal</span>
                ) : (
                  <span className={`rounded-md px-2 py-1 text-xs font-medium capitalize ${SIGNAL_BADGE[device.signal]}`}>{device.signal} signal</span>
                )}
              </div>

              <div className="space-y-3 rounded-lg border border-border bg-background p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Battery</span>
                  {offline || device.battery == null ? (
                    <span className="text-muted-foreground">--</span>
                  ) : (
                    <span>{device.battery}%</span>
                  )}
                </div>
                {!offline && device.battery != null && (
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full ${batteryColor(device.battery)}`} style={{ width: `${device.battery}%` }} />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Firmware</span>
                  <span className="font-mono text-xs">{device.firmware}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last reading</span>
                  <span className="text-xs">{fmtDate(device.last_reading_at)}</span>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Household assignment</h3>
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><User className="h-4 w-4" />{device.resident}</p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{device.block_lot}</p>

              <label className="block text-xs text-muted-foreground">
                Resident name
                <input
                  type="text"
                  required
                  value={form.resident ?? ""}
                  onChange={(e) => setForm({ ...form, resident: e.target.value })}
                  className={`${field} mt-1`}
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                Block / Lot
                <input
                  type="text"
                  required
                  value={form.block_lot ?? ""}
                  onChange={(e) => setForm({ ...form, block_lot: e.target.value })}
                  className={`${field} mt-1`}
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                Device status
                <select value={form.status ?? "online"} onChange={(e) => setForm({ ...form, status: e.target.value })} className={`${field} mt-1`}>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </label>
            </section>
          </div>

          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-card px-5 py-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="h-10 w-full rounded-md border border-border px-4 text-sm hover:bg-muted sm:w-auto">Cancel</button>
            <button type="submit" className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 sm:w-auto">
              <Save className="h-4 w-4" /> Save changes
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}
