import { useEffect, useState } from "react";
import { X, Mail, Phone, MapPin, Gauge, Pencil } from "lucide-react";
import { SAMPLE_DATA, CATEGORY_LABELS, STATUS_LABELS } from "@/data/complaints";

const ACCOUNT_BADGE = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-danger/15 text-danger",
};
const TANK_BADGE = {
  normal: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  critical: "bg-danger/15 text-danger",
};
const COMPLAINT_BADGE = {
  pending: "bg-warning/15 text-warning",
  in_progress: "bg-primary/15 text-primary",
  resolved: "bg-success/15 text-success",
};

function fillColor(v) {
  if (v >= 80) return "bg-danger";
  if (v >= 70) return "bg-warning";
  return "bg-success";
}
function initials(name = "") {
  return name.split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}
function fmtDate(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

const field =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring";

export default function ResidentPanel({ resident, mode = "view", onClose, onSave, onModeChange }) {
  const [form, setForm] = useState(resident ?? {});

  useEffect(() => {
    if (resident) setForm(resident);
  }, [resident]);

  if (!resident) return null;

  const complaints = SAMPLE_DATA.filter(
    (c) => c.tank_id === resident.tank_id || c.location === resident.block_lot,
  ).slice(0, 4);

  function submit(e) {
    e.preventDefault();
    // Later: PUT to Laravel — updates users + resident_profiles (+ septic_systems assignment).
    onSave({
      ...resident,
      ...form,
      fill_level: form.tank_id ? resident.fill_level : null,
      tank_status: form.tank_id ? resident.tank_status : null,
    });
  }

  return (
    <div className="panel-overlay-in fixed inset-0 z-50 flex justify-end overflow-hidden bg-black/80" onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="panel-slide-in flex h-full w-full max-w-md flex-col border-l border-border bg-card"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {initials(resident.name)}
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold leading-tight">{resident.name}</h2>
              <p className="text-xs text-muted-foreground">
                {resident.role} · {mode === "edit" ? "Editing" : "Household profile"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close panel" className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </header>

        {mode === "view" ? (
          <>
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <section className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-md px-2 py-1 text-xs font-medium capitalize ${ACCOUNT_BADGE[resident.status]}`}>
                    {resident.status}
                  </span>
                  <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium capitalize">
                    {resident.is_active ? "Active account" : "Inactive account"}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" />{resident.email}</p>
                  <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" />{resident.phone}</p>
                  <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" />{resident.block_lot}</p>
                </div>
              </section>

              <section className="rounded-lg border border-border bg-background p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold"><Gauge className="h-4 w-4 text-primary" />Septic tank</h3>
                {resident.tank_id ? (
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tank ID</span>
                      <span className="font-mono text-primary">{resident.tank_id}</span>
                    </div>
                    {resident.fill_level == null ? (
                      <p className="text-xs text-muted-foreground">No sensor readings yet.</p>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Fill level</span>
                          <span>{resident.fill_level}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div className={`h-full ${fillColor(resident.fill_level)}`} style={{ width: `${resident.fill_level}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Tank status</span>
                          <span className={`rounded-md px-2 py-1 text-xs font-medium capitalize ${TANK_BADGE[resident.tank_status]}`}>
                            {resident.tank_status}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last activity</span>
                      <span className="text-xs">{fmtDate(resident.last_activity)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">No tank assigned to this household yet.</p>
                )}
              </section>

              <section>
                <h3 className="text-sm font-semibold">Recent complaints</h3>
                {complaints.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">No complaints filed by this household.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {complaints.map((c) => (
                      <li key={c.id} className="rounded-lg border border-border bg-background p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{c.title}</p>
                          <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${COMPLAINT_BADGE[c.status]}`}>
                            {STATUS_LABELS[c.status]}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          #{c.ticket_code} · {CATEGORY_LABELS[c.category]}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <footer className="flex justify-end gap-2 border-t border-border px-5 py-4">
              <button type="button" onClick={onClose} className="h-10 rounded-md border border-border px-4 text-sm hover:bg-muted">Close</button>
              <button
                type="button"
                onClick={() => onModeChange("edit")}
                className="flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Pencil className="h-4 w-4" /> Edit resident
              </button>
            </footer>
          </>
        ) : (
          <form onSubmit={submit} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {[
                ["name", "Full name", "text"],
                ["email", "Email", "email"],
                ["phone", "Phone", "tel"],
                ["block_lot", "Block / Lot", "text"],
                ["tank_id", "Tank assignment (leave blank to unassign)", "text"],
              ].map(([k, label, type]) => (
                <label key={k} className="block text-xs text-muted-foreground">
                  {label}
                  <input
                    type={type}
                    required={k !== "tank_id"}
                    value={form[k] ?? ""}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    className={`${field} mt-1`}
                  />
                </label>
              ))}

              <label className="block text-xs text-muted-foreground">
                Residency role
                <select value={form.role ?? "Homeowner"} onChange={(e) => setForm({ ...form, role: e.target.value })} className={`${field} mt-1`}>
                  <option value="Homeowner">Homeowner</option>
                  <option value="Tenant">Tenant</option>
                </select>
              </label>

              <label className="block text-xs text-muted-foreground">
                Account status
                <select value={form.status ?? "pending"} onChange={(e) => setForm({ ...form, status: e.target.value })} className={`${field} mt-1`}>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="accent-primary"
                />
                Account is active
              </label>
            </div>

            <footer className="flex justify-end gap-2 border-t border-border px-5 py-4">
              <button type="button" onClick={onClose} className="h-10 rounded-md border border-border px-4 text-sm hover:bg-muted">Cancel</button>
              <button type="submit" className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">Save changes</button>
            </footer>
          </form>
        )}
      </aside>
    </div>
  );
}
