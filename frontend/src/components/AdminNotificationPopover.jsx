import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bell, CircleAlert, ClipboardList, UserPlus } from "lucide-react";
import { fetchAdminNotifications } from "../api.js";

const ICONS = {
  registration: UserPlus,
  complaint: ClipboardList,
  critical: CircleAlert,
};

export default function AdminNotificationPopover({ token, onViewAll, navigate }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const ref = useRef(null);
  const unread = items.filter((item) => item.unread).length;

  useEffect(() => {
    let active = true;
    const load = () => fetchAdminNotifications(token)
      .then((data) => {
        if (active) {
          setItems(data);
          setError("");
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Unable to load notifications.");
      });

    if (token) load();
    const interval = window.setInterval(load, 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [token]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label="Notifications" aria-expanded={open} className={`relative rounded-full bg-muted p-2 hover:bg-muted/70 ${open ? "text-primary ring-1 ring-primary/50" : ""}`}>
        <Bell className="h-4 w-4" />
        {unread > 0 && <b className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[8px]">{unread}</b>}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-display text-xs font-bold uppercase tracking-widest">Notifications</p>
            <span className="text-[11px] text-muted-foreground">{unread ? `${unread} open` : "All caught up"}</span>
          </div>
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {error ? <li className="px-4 py-8 text-center text-xs text-danger">{error}</li> : items.length === 0 ? <li className="px-4 py-8 text-center text-xs text-muted-foreground">No notifications yet.</li> : items.map((item) => {
              const Icon = ICONS[item.type] ?? CircleAlert;
              return (
                <li key={item.id}>
                  <button type="button" onClick={() => { setOpen(false); navigate?.(item.path); }} className="flex w-full gap-3 px-4 py-3 text-left hover:bg-muted/50">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{item.title}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{item.detail}</span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">{item.time ?? "Recently"}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {onViewAll && <button type="button" onClick={() => { setOpen(false); onViewAll(); }} className="flex w-full items-center justify-center gap-2 border-t border-border px-4 py-3 text-sm font-semibold hover:bg-muted">View residents and complaints <ArrowRight className="h-4 w-4" /></button>}
        </div>
      )}
    </div>
  );
}
