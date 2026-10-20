import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Activity, Bell, BellOff, Bot, CheckCheck, CircleAlert, CircleCheck,
  FileWarning, Home, Info, LogOut, Menu, Search, ShieldCheck,
  SlidersHorizontal, TriangleAlert, UserRound, Wrench, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import ResidentAvatar from "../components/ResidentAvatar.jsx";
import {
  fetchResidentNotifications,
  markResidentNotificationRead,
  markResidentNotificationsRead,
} from "../api.js";

/* ==================================================================
   SeptiGuard — Alerts / Notifications (Resident)
   ------------------------------------------------------------------
   Mapped directly sa `septi_notifications` enum mo:

     type:    critical_alert | warning_alert | predictive_alert |
              ticket_update | announcement
     channel: in_app (external delivery rows are filtered out)
     is_read: boolean

   Tabs:
     Alerts   -> critical_alert
     Warnings -> warning_alert
     Info     -> predictive_alert + announcement
     Updates  -> ticket_update (complaint status changes)

   Status rule (single source of truth):
     >= 80% critical, >= 70% warning, < 70% normal

   NOTE: Yung "X" (dismiss) button dito ay client-side lang muna
   (nagtatago sa list, hindi nagde-delete sa DB) dahil walang
   `dismissed_at` column sa septi_notifications table mo.
================================================================== */

const TYPE_META = {
  critical_alert:   { tone: "critical", icon: CircleAlert,   badge: "Alert",   chip: "bg-danger/15 text-danger border-danger/30" },
  warning_alert:    { tone: "warning",  icon: TriangleAlert, badge: "Warning", chip: "bg-warning/15 text-warning border-warning/30" },
  predictive_alert: { tone: "info",     icon: Bot,           badge: "Info",    chip: "bg-primary/15 text-primary border-primary/30" },
  announcement:     { tone: "info",     icon: Info,          badge: "Info",    chip: "bg-primary/15 text-primary border-primary/30" },
  ticket_update:    { tone: "success",  icon: CircleCheck,   badge: "Update",  chip: "bg-success/15 text-success border-success/30" },
};

const TONE_CARD = {
  critical: "border-danger/30 bg-danger/5",
  warning:  "border-warning/30 bg-warning/5",
  info:     "border-border bg-muted/30",
  success:  "border-border bg-muted/30",
};

const TONE_ICON_WRAP = {
  critical: "bg-danger/15 text-danger",
  warning:  "bg-warning/15 text-warning",
  info:     "bg-primary/15 text-primary",
  success:  "bg-success/15 text-success",
};

const NAV = [
  { icon: Home,        label: "Dashboard", path: "/dashboard" },
  { icon: Activity,    label: "Monitoring", path: "/monitor" },
  { icon: Bot,         label: "Predict", path: "/predict" },
  { icon: FileWarning, label: "Complaints", path: "/complaints" },
  { icon: Wrench,      label: "Maintenance", path: "/maintain" },
  { icon: Bell,        label: "Alerts", path: "/alerts", active: true },
  { icon: UserRound,   label: "Profile", path: "/profile" },
];

const sampleTimestamp = (minutesAgo) => {
  const createdAt = new Date(Date.now() - minutesAgo * 60 * 1000);
  return {
    created_at: createdAt.toISOString(),
    time: formatDistanceToNow(createdAt, { addSuffix: true }),
  };
};
const sampleDesludgingDate = new Date();
sampleDesludgingDate.setDate(sampleDesludgingDate.getDate() + 10);
const formattedDesludgingDate = new Intl.DateTimeFormat(undefined, {
  month: "long",
  day: "numeric",
}).format(sampleDesludgingDate);

/* ======================= SAMPLE DATA (temporary) =======================
   Palitan ng axios.get("/api/notifications") kapag ready na. Ang
   response shape ay dapat kapareho ng structure sa baba.            */
const SAMPLE_NOTIFICATIONS = [
  {
    id: 1,
    type: "critical_alert",
    title: "Critical: Tank approaching overflow",
    message: "Your septic tank has reached 82% capacity. Schedule a pump-out service within the next 5 days to avoid overflow.",
    action: { label: "Schedule now", to: "/maintain" },
    ...sampleTimestamp(12),
    group: "Today",
    is_read: false,
  },
  {
    id: 2,
    type: "warning_alert",
    title: "Rising fill rate detected",
    message: "Your tank's fill rate increased 18% compared to last week's average, based on recent sensor readings. Consider checking for unusual usage.",
    action: { label: "View report", to: "/monitor" },
    ...sampleTimestamp(60),
    group: "Today",
    is_read: false,
  },
  {
    id: 3,
    type: "predictive_alert",
    title: "Prediction updated",
    message: "Based on your recent readings, your tank is expected to reach the critical level (80%) in about 14 days.",
    action: { label: "See prediction", to: "/predict" },
    ...sampleTimestamp(180),
    group: "Today",
    is_read: false,
  },
  {
    id: 4,
    type: "ticket_update",
    title: "Complaint #CMP-0131 resolved",
    message: "Your complaint about missed garbage collection has been marked as resolved by the HOA.",
    action: { label: "View complaint", to: "/complaints" },
    ...sampleTimestamp(360),
    group: "Today",
    is_read: true,
  },
  {
    id: 5,
    type: "ticket_update",
    title: "Complaint #CMP-0138 in progress",
    message: "Officer Mark R. has been assigned to your pothole complaint near the clubhouse entrance.",
    action: { label: "View complaint", to: "/complaints" },
    ...sampleTimestamp(24 * 60),
    group: "Earlier",
    is_read: true,
  },
  {
    id: 6,
    type: "announcement",
    title: "Scheduled desludging — Blk 12 area",
    message: `The HOA has scheduled a community desludging drive for Blk 12 residents on ${formattedDesludgingDate}. No action needed unless notified individually.`,
    action: null,
    ...sampleTimestamp(2 * 24 * 60),
    group: "Earlier",
    is_read: true,
  },
];
export default function Alerts() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [sampleNotifications, setSampleNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const [realNotifications, setRealNotifications] = useState([]);
  const [loading, setLoading] = useState(!user?.demo_mode && Boolean(token));
  const [loadError, setLoadError] = useState(
    !user?.demo_mode && !token ? "Your session is unavailable. Please sign in again." : "",
  );
  const [actionError, setActionError] = useState("");
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(() => new Set());
  const [now] = useState(() => Date.now());
  const notifications = user?.demo_mode ? sampleNotifications : realNotifications;
  const visibleNotifications = useMemo(
    () => notifications.filter((item) => !dismissedIds.has(item.id)),
    [notifications, dismissedIds],
  );
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  const soon = (name) => window.alert(`${name} will be connected in the next step.`);
  const signOut = async () => { await logout(); navigate("/"); };

  useEffect(() => {
    if (user?.demo_mode || !token) return undefined;
    let active = true;
    const load = () => fetchResidentNotifications(token).then((items) => {
      if (active) {
        setRealNotifications(items.map((item) => ({
          ...item,
          action: item.type === "ticket_update"
            ? { label: "View complaint", to: "/complaints" }
            : ["critical_alert", "warning_alert"].includes(item.type)
              ? { label: "View tank", to: "/monitor" }
              : item.type === "predictive_alert"
                ? { label: "View prediction", to: "/predict" }
                : null,
          time: item.created_at && !Number.isNaN(new Date(item.created_at).getTime())
            ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true })
            : "Recently",
          group: "Recent",
        })));
        setLoadError("");
      }
    }).catch((error) => {
      if (active) setLoadError(error.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    load();
    const interval = window.setInterval(load, 30000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [token, user?.demo_mode]);

  /* ---------- API CALL — i-uncomment kapag ready na ang backend ----------
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get("http://localhost:8000/api/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => setNotifications(res.data))
    .catch(err => console.error(err));
  }, []);
  ---------------------------------------------------------------------- */

  const counts = useMemo(() => {
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    return {
      unread: visibleNotifications.filter((n) => !n.is_read).length,
      critical: visibleNotifications.filter((n) => n.type === "critical_alert").length,
      warning: visibleNotifications.filter((n) => n.type === "warning_alert").length,
      thisWeek: visibleNotifications.filter((n) => {
        const createdAt = new Date(n.created_at).getTime();
        return Number.isFinite(createdAt) && createdAt >= weekAgo && createdAt <= now;
      }).length,
    };
  }, [visibleNotifications, now]);

  const tabCounts = useMemo(() => ({
    all:      visibleNotifications.length,
    critical: visibleNotifications.filter((n) => n.type === "critical_alert").length,
    warning:  visibleNotifications.filter((n) => n.type === "warning_alert").length,
    info:     visibleNotifications.filter((n) => n.type === "predictive_alert" || n.type === "announcement").length,
    updates:  visibleNotifications.filter((n) => n.type === "ticket_update").length,
  }), [visibleNotifications]);

  const filtered = useMemo(() => {
    return visibleNotifications
      .filter((n) => {
        if (tab === "all") return true;
        if (tab === "critical") return n.type === "critical_alert";
        if (tab === "warning") return n.type === "warning_alert";
        if (tab === "info") return n.type === "predictive_alert" || n.type === "announcement";
        if (tab === "updates") return n.type === "ticket_update";
        return true;
      })
      .filter((n) =>
        query.trim() === "" ||
        n.title.toLowerCase().includes(query.toLowerCase()) ||
        n.message.toLowerCase().includes(query.toLowerCase())
      );
  }, [visibleNotifications, tab, query]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((n) => {
      groups[n.group] = groups[n.group] ? [...groups[n.group], n] : [n];
    });
    return groups;
  }, [filtered]);

  const markAllRead = async () => {
    setActionError("");
    setIsMarkingRead(true);
    if (user?.demo_mode) {
      setSampleNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } else {
      try {
        await markResidentNotificationsRead(token);
        setRealNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      } catch (error) {
        setActionError(error.message);
      }
    }
    setIsMarkingRead(false);
  };

  const dismiss = (id) => {
    setDismissedIds((previous) => new Set(previous).add(id));
  };

  const openAction = async (n) => {
    if (!n.is_read) {
      if (user?.demo_mode) {
        setSampleNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x));
      } else {
        try {
          await markResidentNotificationRead(token, n.id);
          setRealNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x));
        } catch (error) {
          setActionError(error.message);
          return;
        }
      }
    }
    if (n.action?.to) navigate(n.action.to);
  };

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      {/* ======================= SIDEBAR ======================= */}
      <aside className={`${open ? "flex" : "hidden"} fixed inset-y-0 left-0 z-40 w-24 flex-col border-r border-border bg-card px-2 py-5 lg:flex`}>
        <div className="mb-5 flex justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((x) => (
            <button
              key={x.label}
              onClick={() => {
                if (x.path) {
                  setOpen(false);
                  navigate(x.path);
                  return;
                }
                if (x.active) {
                  setOpen(false);
                  return;
                }
                soon(x.label);
              }}
              className={`relative flex h-14 flex-col items-center justify-center gap-1 rounded-md text-[10px] ${
                x.active
                  ? "bg-primary font-medium text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <x.icon className="h-4 w-4" />
              {x.label}
            </button>
          ))}
        </nav>
        <div className="flex flex-col items-center gap-2 border-t border-border pt-4">
          <ResidentAvatar />
          <button onClick={signOut} title="Sign out" className="p-2 text-muted-foreground hover:text-danger">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>
      {open && <button className="fixed inset-0 z-30 bg-background/80 lg:hidden" onClick={() => setOpen(false)} />}

      {/* ======================= MAIN ======================= */}
      <div className="page-transition min-w-0 flex-1 lg:ml-24">
        <header className="flex h-20 items-center justify-between border-b border-border px-4 sm:px-7">
          <div className="flex items-center gap-3">
            <button className="rounded-md border border-border p-2 lg:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs text-muted-foreground">Resident Portal › Notifications</p>
              <h1 className="mt-1 font-display text-xl font-bold">Notifications</h1>
            </div>
          </div>
          <button
            onClick={markAllRead}
            disabled={isMarkingRead}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {isMarkingRead ? "Marking read..." : "Mark all as read"}
          </button>
        </header>

        <main className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-7">
          <p className="text-xs text-muted-foreground">
            Stay updated on your tank, complaints, and HOA announcements
          </p>
          {(loadError || actionError) && (
            <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
              {loadError || actionError}
            </p>
          )}

          {/* ---------------- SUMMARY CARDS ---------------- */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard icon={Bell}          label="Unread"    value={counts.unread}   valueClass="text-primary" />
            <SummaryCard icon={CircleAlert}   label="Critical"  value={counts.critical} valueClass="text-danger" />
            <SummaryCard icon={TriangleAlert} label="Warnings"  value={counts.warning}  valueClass="text-warning" />
            <SummaryCard icon={Bell}          label="This Week" value={counts.thisWeek} />
          </div>

          {/* ---------------- FILTER BAR ---------------- */}
          <section className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <TabButton active={tab === "all"} onClick={() => setTab("all")}>
                  All <Badge>{tabCounts.all}</Badge>
                </TabButton>
                <TabButton active={tab === "critical"} onClick={() => setTab("critical")}>
                  Alerts <Badge>{tabCounts.critical}</Badge>
                </TabButton>
                <TabButton active={tab === "warning"} onClick={() => setTab("warning")}>
                  Warnings <Badge>{tabCounts.warning}</Badge>
                </TabButton>
                <TabButton active={tab === "info"} onClick={() => setTab("info")}>
                  Info <Badge>{tabCounts.info}</Badge>
                </TabButton>
                <TabButton active={tab === "updates"} onClick={() => setTab("updates")}>
                  Updates <Badge>{tabCounts.updates}</Badge>
                </TabButton>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search notifications..."
                    className="w-36 bg-transparent text-xs outline-none placeholder:text-muted-foreground sm:w-48"
                  />
                </div>
                <button
                  onClick={() => soon("Filter")}
                  className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </section>

          {/* ---------------- NOTIFICATION LIST ---------------- */}
          {loading ? (
            <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-border bg-card p-10 text-center">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary/25 border-t-primary" aria-hidden="true" />
              <p className="mt-3 text-sm text-muted-foreground">Loading your alerts...</p>
            </div>
          ) : loadError ? null : Object.keys(grouped).length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-10 text-center">
              <BellOff className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No notifications found.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group}
                </p>
                {items.map((n) => {
                  const meta = TYPE_META[n.type] ?? TYPE_META.announcement;
                  return (
                    <div
                      key={n.id}
                      className={`relative flex items-start gap-3 rounded-lg border p-4 transition ${TONE_CARD[meta.tone]}`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${TONE_ICON_WRAP[meta.tone]}`}>
                        <meta.icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">{n.title}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${meta.chip}`}>
                            {meta.badge}
                          </span>
                          {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{n.message}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                          <span>{n.time}</span>
                          {n.action && (
                            <button
                              onClick={() => openAction(n)}
                              className="font-medium text-primary hover:underline"
                            >
                              {n.action.label} →
                            </button>
                          )}
                          {!n.action && !n.is_read && (
                            <button
                              onClick={() => openAction(n)}
                              className="font-medium text-primary hover:underline"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => dismiss(n.id)}
                        aria-label="Hide notification"
                        title="Hide from this list until you reload"
                        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, valueClass = "" }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="truncate text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <p className={`mt-3 font-display text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-secondary text-secondary-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Badge({ children }) {
  return (
    <span className="rounded bg-background/60 px-1.5 py-0.5 text-[10px] font-semibold">
      {children}
    </span>
  );
}
