import { useEffect, useState } from "react";
import { CalendarDays, Droplets, MapPin, User, X } from "lucide-react";

const CONTRACTORS = [
  "Broadway Desludging Services",
  "Antipolo Septic Solutions",
  "Malinis na Tubig Co.",
  "HOA In-house Crew",
];

/**
 * Desludging dispatch / schedule modal.
 * Props:
 * - tank: the tank row being dispatched ({ id, resident, address, level, action })
 * - onClose: close without saving
 * - onConfirm: called with { tankId, contractor, date, notes }
 */
export default function DispatchModal({ tank, onClose, onConfirm = () => {} }) {
  const [contractor, setContractor] = useState(CONTRACTORS[0]);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (tank) {
      setContractor(CONTRACTORS[0]);
      setDate("");
      setNotes("");
    }
  }, [tank]);

  if (!tank) return null;

  const isDispatch = tank.action === "Dispatch";
  const title = isDispatch ? "Dispatch desludging" : "Schedule desludging";

  const submit = (e) => {
    e.preventDefault();
    onConfirm({ tankId: tank.id, contractor, date, notes });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-lg border border-border bg-card"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/15">
              <Droplets className="h-5 w-5 text-primary" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold leading-tight">{title}</h2>
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

          <label className="block space-y-1.5">
            <span className="text-xs font-medium">Contractor</span>
            <select
              value={contractor}
              onChange={(e) => setContractor(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            >
              {CONTRACTORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium">Target date</span>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium">Notes (optional)</span>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Access instructions, resident availability, etc."
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>

        <footer className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" onClick={onClose} className="h-10 rounded-md border border-border px-4 text-sm hover:bg-muted">
            Cancel
          </button>
          <button type="submit" className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">
            {isDispatch ? "Confirm dispatch" : "Confirm schedule"}
          </button>
        </footer>
      </form>
    </div>
  );
}
