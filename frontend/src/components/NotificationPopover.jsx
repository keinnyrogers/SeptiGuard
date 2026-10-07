import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bell, Bot, Check, FileWarning, Zap } from "lucide-react";

// Sample data — replace with GET /api/notifications (septi_notifications) later.
const SAMPLE_NOTIFICATIONS = [
  { icon: FileWarning, tone: "text-warning", title: "Tank level reached 70%", detail: "Consider scheduling maintenance soon.", time: "2h", unread: true },
  { icon: Bot, tone: "text-primary", title: "AI prediction updated", detail: "Estimated 12 days until critical level.", time: "6h", unread: true },
  { icon: Check, tone: "text-success", title: "Sensor calibration complete", detail: "All sensors operating within normal range.", time: "1d", unread: true },
  { icon: Zap, tone: "text-muted-foreground", title: "Firmware updated to v2.1.4", detail: "Improved accuracy and battery efficiency.", time: "2d", unread: false },
];

export default function NotificationPopover({ onViewAll, demoMode = false }) {
  const [open, setOpen] = useState(false);
  const [sampleNotifications, setSampleNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const notifications = demoMode ? sampleNotifications : [];
  const ref = useRef(null);
  const unread = notifications.filter((n) => n.unread).length;

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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
        className={`relative flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background hover:bg-muted ${open ? "border-primary/50 text-primary" : ""}`}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] text-danger-foreground">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <p className="font-display text-xs font-bold uppercase tracking-widest">Notifications</p>
            {notifications.length > 0 && <button
              type="button"
              onClick={() => setSampleNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))}
              className="text-[10px] font-semibold text-primary hover:text-primary/80"
            >Mark all as read</button>}
          </div>
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {notifications.length === 0 ? <li className="px-4 py-8 text-center text-xs text-muted-foreground">No notifications yet.</li> : notifications.map((n) => (
              <li key={n.title} className={`flex gap-3 px-4 py-3 ${n.unread ? "bg-primary/5" : ""}`}>
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
              </li>
            ))}
          </ul>
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
        </div>
      )}
    </div>
  );
}
