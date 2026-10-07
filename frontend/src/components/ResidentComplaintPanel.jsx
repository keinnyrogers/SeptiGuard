import { useEffect, useState } from "react";
import { X, MapPin, CalendarDays, UserRound, MessageSquareText, Clock, ImageIcon } from "lucide-react";

/* ==================================================================
   SeptiGuard — Resident Complaint Slide-in Panel (read-only)
   Mirrors the admin ComplaintPanel layout, pure Tailwind (no extra deps).
   Props:
     complaint    – selected complaint object (or null)
     open         – boolean
     onClose      – () => void
     categoryMeta – CATEGORY_META map from Complaints page
     statusMeta   – STATUS_META map from Complaints page
================================================================== */

export default function ResidentComplaintPanel({ complaint, open, onClose, categoryMeta, statusMeta }) {
  // keep last complaint rendered during the slide-out animation
  const [shown, setShown] = useState(complaint);
  useEffect(() => {
    if (complaint) setShown(complaint);
  }, [complaint]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const c = shown;
  const cat = c ? categoryMeta[c.category] ?? categoryMeta.other : null;
  const stat = c ? statusMeta[c.status] ?? statusMeta.pending : null;

  return (
    <div className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!open}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-background/70 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Complaint details"
        className={`absolute inset-y-0 right-0 flex w-full flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-out sm:max-w-md ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {c && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border p-5">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-secondary-foreground">
                    #{c.ticket_code}
                  </span>
                  <span className={`flex items-center gap-1 rounded-md px-2 py-0.5 ${cat.tone}`}>
                    <cat.icon className="h-3 w-3" />
                    {cat.label}
                  </span>
                </div>
                <h2 className="font-display text-lg font-semibold leading-snug">{c.title}</h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              <div>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${stat.chip}`}>
                  <stat.icon className="h-3.5 w-3.5" />
                  {stat.label}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-background/40 p-4 text-sm">
                <Meta icon={CalendarDays} label="Filed" value={c.filed_at} />
                <Meta icon={MapPin} label="Location" value={c.location || "—"} />
                <Meta icon={UserRound} label="Assigned to" value={c.assigned_to || "Pending assignment"} />
                <Meta icon={Clock} label="Resolved" value={c.resolved_at || "—"} />
              </dl>

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</h3>
                <p className="text-sm leading-relaxed">{c.description}</p>
              </section>

              {c.photo_url && (
                <section className="space-y-2">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <ImageIcon className="h-3.5 w-3.5" /> Attached photo
                  </h3>
                  <a href={c.photo_url} target="_blank" rel="noreferrer">
                    <img src={c.photo_url} alt="Complaint attachment" className="max-h-60 w-full rounded-lg border border-border object-cover" />
                  </a>
                </section>
              )}

              <section className="space-y-2">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <MessageSquareText className="h-3.5 w-3.5" /> HOA response
                </h3>
                {c.hoa_response ? (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm leading-relaxed">
                    {c.hoa_response}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Awaiting HOA review. You'll be notified once the HOA responds.
                  </div>
                )}
              </section>
            </div>

            {/* Footer */}
            <div className="border-t border-border p-4">
              <button
                onClick={onClose}
                className="w-full rounded-md border border-border bg-muted/40 py-2.5 text-sm font-medium transition hover:bg-muted"
              >
                Close
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function Meta({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </dt>
      <dd className="mt-0.5 truncate">{value}</dd>
    </div>
  );
}
