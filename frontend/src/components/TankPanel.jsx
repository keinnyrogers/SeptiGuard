import { useEffect, useState } from "react";
import { Clock, Droplets, MapPin, User, X } from "lucide-react";

// Shared status thresholds: >=80 critical, >=70 warning, else normal.
function statusOf(level) {
  if (level >= 80) return "critical";
  if (level >= 70) return "warning";
  return "normal";
}

const STATUS_META = {
  critical: { label: "Critical", text: "text-danger", bg: "bg-danger/15", ring: "text-danger", bar: "bg-danger" },
  warning: { label: "Warning", text: "text-warning", bg: "bg-warning/15", ring: "text-warning", bar: "bg-warning" },
  normal: { label: "Normal", text: "text-success", bg: "bg-success/15", ring: "text-success", bar: "bg-success" },
};

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

/**
 * Reusable tank details drawer. Used by the Dashboard and the Tanks page.
 * Expects a tank object shaped like the septic_systems row:
 * { id, resident, block, lot, address, level, status, daysUntilFull, installed, lastDesludged, capacity }
 */
export default function TankPanel({ tank, onClose, onAction = () => {} }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!tank) {
      setIsVisible(false);
      return;
    }

    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [tank]);

  useEffect(() => {
    if (!tank) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [tank]);

  if (!tank) return null;

  const status = tank.status ?? statusOf(tank.level);
  const meta = STATUS_META[status] ?? STATUS_META.normal;
  const address = tank.address ?? (tank.block != null ? `Blk ${tank.block} Lot ${tank.lot}, Broadway` : "—");
  const daysUntilFull = tank.daysUntilFull ?? Math.max(1, Math.round((100 - tank.level) * 0.6));
  const actionLabel = status === "critical" ? "Dispatch desludging" : "Schedule desludging";

  const circ = 2 * Math.PI * 42;
  const dash = (tank.level / 100) * circ;

  return (
    <div className={`fixed inset-0 z-50 flex justify-end bg-background/80 transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`} onClick={onClose}>
      <aside onClick={(e) => e.stopPropagation()} className={`flex h-[100svh] min-h-0 max-h-[100svh] w-full flex-col border-l border-border bg-card transition-transform duration-300 ease-out will-change-transform lg:max-w-md ${isVisible ? "translate-x-0" : "translate-x-full"}`}>
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/15">
              <Droplets className="h-5 w-5 text-primary" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold leading-tight">{tank.id}</h2>
              <p className="text-xs text-muted-foreground">Tank details</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close panel" className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section className="space-y-4">
            <span className={`inline-block rounded-md px-2 py-1 text-xs font-medium ${meta.bg} ${meta.text}`}>{meta.label}</span>

            <div className="relative mx-auto h-32 w-32">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" strokeWidth="12" className="text-muted" />
                <circle
                  cx="60"
                  cy="60"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circ}`}
                  className={meta.ring}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <b className="font-display text-2xl">{tank.level}%</b>
                <span className="text-[9px] text-muted-foreground">FILL LEVEL</span>
              </div>
            </div>

            <div className={`flex items-center justify-center gap-1.5 rounded-md bg-muted/60 px-2 py-2 text-xs ${meta.text}`}>
              <Clock className="h-3.5 w-3.5" />
              <span className="text-muted-foreground">Estimated until full:</span>
              <b>{daysUntilFull} days</b>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Household</h3>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              {tank.resident ?? "Unassigned"}
            </p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {address}
            </p>
          </section>

          <section className="space-y-3 rounded-lg border border-border bg-background p-4">
            <h3 className="text-sm font-semibold">System details</h3>
            <Row label="Device / Tank ID" value={tank.id} />
            <Row label="Capacity" value={tank.capacity ?? "1,500 L"} />
            <Row label="Installed" value={tank.installed ?? "Jan 15, 2023"} />
            <Row label="Last desludged" value={tank.lastDesludged ?? "Not recorded"} />
            {tank.date && <Row label="Last update" value={tank.date} />}
          </section>
        </div>

        <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-card px-5 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="h-10 w-full rounded-md border border-border px-4 text-sm hover:bg-muted sm:w-auto">
            Close
          </button>
          <button
            type="button"
            onClick={() => onAction(`${actionLabel} for ${tank.id}`)}
            className="h-10 w-full rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 sm:w-auto"
          >
            {actionLabel}
          </button>
        </footer>
      </aside>
    </div>
  );
}
