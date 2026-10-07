import { useEffect } from "react";
import { X } from "lucide-react";

/* Shared right-side slide-in shell (same look as ResidentComplaintPanel). */
export default function SlidePanel({ open, onClose, eyebrow, eyebrowIcon: Icon, title, subtitle, children, footer }) {
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

  return (
    <div className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-background/70 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute inset-y-0 right-0 flex w-full flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-out sm:max-w-md ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div className="space-y-1">
            {eyebrow && (
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                {Icon && <Icon className="h-4 w-4" />} <span>{eyebrow}</span>
              </div>
            )}
            <h2 className="font-display text-lg font-semibold">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex gap-3 border-t border-border p-4">{footer}</div>}
      </aside>
    </div>
  );
}
