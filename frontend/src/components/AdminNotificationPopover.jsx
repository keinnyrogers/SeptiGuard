import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bell, CircleAlert, ClipboardList, Truck, WifiOff, FileText } from "lucide-react";

// Sample data — replace with GET /api/notifications (admin feed) later.
const SAMPLE_NOTIFICATIONS = [
  { id: 1, icon: CircleAlert, tone: "text-danger", title: "TNK-042 reached 96% (Critical)", detail: "Christofe O. — desludging dispatch recommended.", time: "15m", unread: true },
  { id: 2, icon: ClipboardList, tone: "text-warning", title: "New complaint #CMP-2041", detail: "Septic tank overflow reported. Awaiting assignment.", time: "1h", unread: true },
  { id: 3, icon: WifiOff, tone: "text-danger", title: "Sensor TNK-007 offline", detail: "No reading received in the last 24 hours.", time: "3h", unread: true },
  { id: 4, icon: Truck, tone: "text-success", title: "Desludging complete — TNK-018", detail: "Tank level reset after service.", time: "1d", unread: false },
  { id: 5, icon: FileText, tone: "text-primary", title: "Monthly report generated", detail: "Complaint Summary — September 2026 is ready.", time: "2d", unread: false },
];

export default function NotificationPopover({ onViewAll }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(SAMPLE_NOTIFICATIONS);
  const ref = useRef(null);
  const unread = items.filter((n) => n.unread).length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markAllRead = () => setItems((list) => list.map((n) => ({ ...n, unread: false })));
  const markRead = (id) => setItems((list) => list.map((n) => (n.id === id ? { ...n, unread: false } : n)));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
        className={`relative rounded-full bg-muted p-2 hover:bg-muted/70 ${open ? "text-primary ring-1 ring-primary/50" : ""}`}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <b className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[8px]">
            {unread}
          </b>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-display text-xs font-bold uppercase tracking-widest">Notifications</p>
            {unread > 0 ? (
              <button type="button" onClick={markAllRead} className="text-[11px] font-semibold text-primary hover:underline">
                Mark all as read
              </button>
            ) : (
              <span className="text-[11px] text-muted-foreground">All caught up</span>
            )}
          </div>
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => markRead(n.id)}
                  className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-muted/50 ${n.unread ? "bg-primary/5" : ""}`}
                >
                  <n.icon className={`mt-0.5 h-4 w-4 shrink-0 ${n.tone}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold">{n.title}</p>
                      <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                        {n.time}
                        {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.detail}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {onViewAll && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onViewAll();
              }}
              className="flex w-full items-center justify-center gap-2 border-t border-border px-4 py-3 text-sm font-semibold hover:bg-muted"
            >
              View all notifications <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
