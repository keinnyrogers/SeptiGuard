import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Bell, Bot, Check, CircleAlert, FileWarning, Info, MessageSquare, TriangleAlert, Zap } from "lucide-react";
import { fetchResidentNotifications, markResidentNotificationsRead } from "../api.js";

const SAMPLE_NOTIFICATIONS = [
  { icon: FileWarning, tone: "text-warning", title: "Tank level reached 70%", detail: "Consider scheduling maintenance soon.", time: "2h", unread: true },
  { icon: Bot, tone: "text-primary", title: "AI prediction updated", detail: "Estimated 12 days until critical level.", time: "6h", unread: true },
  { icon: Check, tone: "text-success", title: "Sensor calibration complete", detail: "All sensors operating within normal range.", time: "1d", unread: true },
  { icon: Zap, tone: "text-muted-foreground", title: "Firmware updated to v2.1.4", detail: "Improved accuracy and battery efficiency.", time: "2d", unread: false },
];

const ICONS = {
  critical_alert: { icon: CircleAlert, tone: "text-danger" },
  warning_alert: { icon: TriangleAlert, tone: "text-warning" },
  predictive_alert: { icon: Bot, tone: "text-primary" },
  ticket_update: { icon: MessageSquare, tone: "text-success" },
  announcement: { icon: Info, tone: "text-primary" },
};

export default function NotificationPopover({ token, onViewAll, demoMode = false }) {
  const [open, setOpen] = useState(false);
  const [sampleNotifications, setSampleNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const [realNotifications, setRealNotifications] = useState([]);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [markingRead, setMarkingRead] = useState(false);
  const notifications = demoMode ? sampleNotifications : realNotifications;
  const ref = useRef(null);
  const unread = notifications.filter((n) => demoMode ? n.unread : !n.is_read).length;

  useEffect(() => {
    if (demoMode || !token) return undefined;
    let active = true;
    const load = () => fetchResidentNotifications(token)
      .then((items) => {
        if (active) {
          setRealNotifications(items.map((item) => {
            const createdAt = new Date(item.created_at);
            return {
              ...item,
              detail: item.message,
              time: Number.isNaN(createdAt.getTime())
                ? "Recently"
                : formatDistanceToNow(createdAt, { addSuffix: true }),
            };
          }));
          setError("");
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      });

    load();
    const interval = window.setInterval(load, 30000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [demoMode, token]);

  const markAllRead = async () => {
    setActionError("");
    setMarkingRead(true);
    if (demoMode) {
      setSampleNotifications((previous) => previous.map((item) => ({ ...item, unread: false })));
    } else {
      try {
        await markResidentNotificationsRead(token);
        setRealNotifications((previous) => previous.map((item) => ({ ...item, is_read: true })));
      } catch (markError) {
        setActionError(markError.message);
      }
    }
    setMarkingRead(false);
  };

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
            {notifications.some((item) => demoMode ? item.unread : !item.is_read) && <button
              type="button"
              onClick={markAllRead}
              disabled={markingRead}
              className="text-[10px] font-semibold text-primary hover:text-primary/80"
            >{markingRead ? "Marking read..." : "Mark all as read"}</button>}
          </div>
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {error ? <li className="px-4 py-8 text-center text-xs text-danger">{error}</li> : actionError ? <li role="alert" className="px-4 py-2 text-xs text-danger">{actionError}</li> : null}
            {notifications.length === 0 && !error ? <li className="px-4 py-8 text-center text-xs text-muted-foreground">No notifications yet.</li> : notifications.map((n) => {
              const meta = demoMode ? { icon: n.icon, tone: n.tone } : ICONS[n.type] ?? { icon: Bell, tone: "text-muted-foreground" };
              const Icon = meta.icon;
              const isUnread = demoMode ? n.unread : !n.is_read;
              return (
              <li key={n.id ?? n.title} className={`flex gap-3 px-4 py-3 ${isUnread ? "bg-primary/5" : ""}`}>
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.tone}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                      {n.time}
                      {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.detail}</p>
                </div>
              </li>
              );
            })}
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
