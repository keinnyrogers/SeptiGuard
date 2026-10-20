import { useState } from "react";
import { Droplets, MapPin, User, X } from "lucide-react";
import DatePicker from "@/components/DatePicker";

function today() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export default function DispatchModal({ tank, onClose, onConfirm }) {
  const [scheduledFor, setScheduledFor] = useState(today);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!tank) return null;

  const isDispatch = tank.action === "Dispatch";
  const title = isDispatch ? "Dispatch desludging" : "Schedule desludging";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispatch-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg border border-border bg-card"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/15">
              <Droplets className="h-5 w-5 text-primary" />
            </span>
            <div>
              <h2 id="dispatch-modal-title" className="font-display text-lg font-semibold leading-tight">{title}</h2>
              <p className="text-xs text-muted-foreground">{tank.id}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-4 px-5 py-5">
          <div className="space-y-2 rounded-lg border border-border bg-background p-4 text-xs">
            <p className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              {tank.resident ?? "Unassigned"}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {tank.address ?? "—"}
            </p>
            <p className="flex items-center gap-2">
              <span className="text-muted-foreground">Current fill:</span>
              <b className={tank.level >= 80 ? "text-danger" : "text-warning"}>{tank.level}%</b>
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Scheduled service date</p>
            <DatePicker
              value={scheduledFor}
              min={today()}
              onChange={(date) => {
                setScheduledFor(date);
                setError("");
              }}
              placeholder="Choose service date"
            />
          </div>
          <p className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
            This saves a service request for the resident and sends an in-app update. The HOA can track progress from Complaints. No contractor is contacted automatically.
          </p>
          {error && <p role="alert" className="text-xs text-danger">{error}</p>}
        </div>

        <footer className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" onClick={onClose} className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !scheduledFor}
            onClick={async () => {
              setSaving(true);
              setError("");
              try {
                await onConfirm({ tankId: tank.system_id, scheduledFor });
                onClose();
              } catch (submitError) {
                setError(submitError.message);
              } finally {
                setSaving(false);
              }
            }}
            className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : isDispatch ? "Create dispatch request" : "Schedule service"}
          </button>
        </footer>
      </section>
    </div>
  );
}
