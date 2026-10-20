import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Activity, Battery, Bell, Bot, CalendarDays, FileWarning, Home,
  LogOut, Menu, RefreshCw, ShieldCheck, TriangleAlert,
  UserRound, Wifi, Wrench,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchResidentTankLatest } from "../api.js";
import { subscribeToTank } from "../realtime.js";
import ResidentEmptyPage from "../components/ResidentEmptyPage.jsx";
import ResidentAvatar from "../components/ResidentAvatar.jsx";
import NotificationPopover from "../components/NotificationPopover.jsx";

function formatHistoryDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function dateKeyFor(date) {
  return date.toISOString().slice(0, 10);
}

function createSampleData() {
  const today = new Date();
  const formatDate = (date) => new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
  const formatRangeDate = (date) => new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
  const historyFor = (span, values) => values.map((value, index) => {
    const offset = Math.round(-span + (span * index) / (values.length - 1));
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    return { date: formatDate(date), value };
  });
  const rangeFor = (span) => {
    const start = new Date(today);
    start.setDate(today.getDate() - span);
    return `${formatRangeDate(start)} – ${formatRangeDate(today)}`;
  };

  return {
    fillLevel: 70,
    sensorId: "TNK-001",
    online: true,
    signal: 94,
    battery: 87,
    lastSync: "Demo sample",
    history: {
      "7": historyFor(6, [55, 58, 61, 64, 66, 68, 70]),
      "30": historyFor(29, [22, 31, 39, 47, 54, 62, 70]),
      "90": historyFor(89, [8, 18, 27, 36, 46, 58, 70]),
    },
    rangeLabel: {
      "7": rangeFor(6),
      "30": rangeFor(29),
      "90": rangeFor(89),
    },
  };
}

const SAMPLE_DATA = createSampleData();

const NAV = [
  { icon: Home,        label: "Dashboard", path: "/dashboard" },
  { icon: Activity,    label: "Monitoring", path: "/monitor", active: true },
  { icon: Bot,         label: "Predict", path: "/predict" },
  { icon: FileWarning, label: "Complaints", path: "/complaints" },
  { icon: Wrench,      label: "Maintenance", path: "/maintain" },
  { icon: Bell,        label: "Alerts", path: "/alerts" },
  { icon: UserRound,   label: "Profile", path: "/profile" },
];

/* Status thresholds — same as the paper */
const THRESHOLDS = [
  { key: "normal",   label: "Normal",   range: "0–69%",   dot: "bg-success", ring: "text-success", chip: "border-success/30 bg-success/10 text-success" },
  { key: "warning",  label: "Warning",  range: "70–79%",  dot: "bg-warning", ring: "text-warning", chip: "border-warning/30 bg-warning/10 text-warning" },
  { key: "critical", label: "Critical", range: "80–100%", dot: "bg-danger",  ring: "text-danger",  chip: "border-danger/30 bg-danger/10 text-danger" },
];

const getStatusKey = (fill) =>
  fill >= 80 ? "critical" : fill >= 70 ? "warning" : "normal";

export default function RealTimeMonitoring() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState("7");
  const [liveData, setLiveData] = useState(null);
  const data = user?.demo_mode ? SAMPLE_DATA : liveData;
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(!user?.demo_mode);
  const [loadError, setLoadError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (user?.demo_mode || !token) return undefined;
    let active = true;
    fetchResidentTankLatest(token).then((result) => {
      if (!active) return;
      const reading = result?.reading;
      const fillLevel = reading?.fill_level_percentage == null ? null : Number(reading.fill_level_percentage);
      const measuredAt = reading?.measured_at ? new Date(reading.measured_at) : null;
      const history = (result?.history ?? []).map((point) => ({
        ...point,
        date: formatHistoryDate(point.date_key),
      }));
      setLiveData({
        deviceId: result?.device_id ?? null,
        fillLevel,
        sensorId: result?.device_id ?? "No device linked",
        online: Boolean(measuredAt && measuredAt.getTime() >= Date.now() - 15 * 60 * 1000),
        signal: null,
        battery: null,
        lastSync: measuredAt ? measuredAt.toLocaleString() : "No readings yet",
        history,
        rangeLabel: {
          "7": "Recent readings",
          "30": "Recent readings",
          "90": "Recent readings",
        },
      });
    }).catch(() => {
      if (active) {
        setLiveData(null);
        setLoadError("Could not load your tank readings. Please try refreshing.");
      }
    }).finally(() => {
      if (active) {
        setLoading(false);
        setRefreshing(false);
      }
    });
    return () => { active = false; };
  }, [token, user?.demo_mode, refreshKey]);

  useEffect(() => {
    if (user?.demo_mode || !liveData?.deviceId) return undefined;

    return subscribeToTank(liveData.deviceId, (reading) => {
      const measuredAt = reading.measured_at ? new Date(reading.measured_at) : null;
      const fillLevel = Number(reading.fill_level_percentage);
      setLiveData((current) => ({
        ...current,
        fillLevel,
        online: true,
        lastSync: measuredAt ? measuredAt.toLocaleString() : "Just now",
        history: (() => {
          const dateKey = measuredAt ? dateKeyFor(measuredAt) : dateKeyFor(new Date());
          const points = current?.history ?? [];
          const existing = points.find((point) => point.date_key === dateKey);
          if (existing) {
            return points.map((point) => point.date_key === dateKey
              ? {
                  ...point,
                  value: Number((((point.value * point.readings_count) + fillLevel) / (point.readings_count + 1)).toFixed(2)),
                  readings_count: point.readings_count + 1,
                }
              : point);
          }
          return [...points, {
            date_key: dateKey,
            date: formatHistoryDate(dateKey),
            value: fillLevel,
            readings_count: 1,
          }];
        })(),
      }));
    });
  }, [liveData?.deviceId, user?.demo_mode]);

  const soon = (name) => window.alert(`${name} will be connected in the next step.`);
  const signOut = async () => { await logout(); navigate("/"); };

  if (loading) {
    return <ResidentEmptyPage active="Monitoring" title="Real-Time Monitoring" description="" loading />;
  }

  if (!data) {
    return (
      <ResidentEmptyPage
        active="Monitoring"
        title="Real-Time Monitoring"
        emptyTitle={loadError ? "Could not load tank readings" : undefined}
        description={loadError || "Live readings and sensor status will appear here after the HOA links a sensor to your household."}
        actionLabel={loadError ? "Retry" : undefined}
        onAction={loadError ? () => {
          setLoadError("");
          setLoading(true);
          setRefreshKey((key) => key + 1);
        } : undefined}
      />
    );
  }

  const statusKey = getStatusKey(data.fillLevel ?? 0);
  const statusMeta = THRESHOLDS.find((t) => t.key === statusKey);
  const selectedHistory = Array.isArray(data.history)
    ? (() => {
        const cutoff = new Date();
        cutoff.setUTCHours(0, 0, 0, 0);
        cutoff.setUTCDate(cutoff.getUTCDate() - Number(range) + 1);
        const cutoffKey = dateKeyFor(cutoff);
        return data.history.filter((point) => point.date_key >= cutoffKey);
      })()
    : data.history[range];

  /* ---------- API CALL — i-uncomment kapag ready na ang backend ----------
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get("http://localhost:8000/api/tank/latest", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => setData(res.data))
    .catch(err => console.error(err));
  }, []);
  ---------------------------------------------------------------------- */

  const handleRefresh = () => {
    setRefreshing(true);
    if (user?.demo_mode) {
      window.setTimeout(() => setRefreshing(false), 500);
      return;
    }
    setRefreshKey((key) => key + 1);
  };

  /* circular gauge math — same as Dashboard's ring (r=50) */
  const CIRC = 314;
  const dash = (data.fillLevel / 100) * CIRC;
  const strokeClass =
    statusKey === "critical" ? "text-danger"
    : statusKey === "warning" ? "text-warning"
    : "text-success";

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
              onClick={() => (x.path ? (setOpen(false), navigate(x.path)) : soon(x.label))}
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
        <header className="flex items-start justify-between gap-2 border-b border-border px-4 py-4 sm:px-7 sm:py-0 sm:h-20 sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button className="shrink-0 rounded-md border border-border p-2 lg:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">Resident Portal › Real-Time Monitoring</p>
              <h1 className="mt-1 truncate font-display text-lg font-bold sm:text-xl">Real-Time Monitoring</h1>
            </div>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground sm:px-4 sm:py-2 sm:text-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="whitespace-nowrap">Refresh</span>
            </button>
            <NotificationPopover
              token={token}
              demoMode={Boolean(user?.demo_mode)}
              onViewAll={() => navigate("/alerts")}
            />
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-7">
          <p className="text-xs text-muted-foreground">
            Live sensor data streaming from your septic tank IoT device
          </p>

          {/* ---------------- TOP ROW ---------------- */}
          <div className="grid gap-5 xl:grid-cols-[1.55fr_0.9fr]">
            {/* Current Fill Level */}
            <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-display font-semibold">Current Fill Level</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Live reading · {data.sensorId}</p>
                </div>
                <span className={`flex h-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.chip}`}>
                  <TriangleAlert className="h-3 w-3" />
                  {statusMeta.label} · {statusMeta.range}
                </span>
              </div>

              <div className="mt-5 flex justify-center">
                <div className="relative h-44 w-44">
                  <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="9" className="text-muted" />
                    <circle
                      cx="60" cy="60" r="50" fill="none" stroke="currentColor"
                      strokeWidth="9" strokeLinecap="round"
                      strokeDasharray={`${dash} ${CIRC}`}
                      className={strokeClass}
                      style={{ transition: "stroke-dasharray .8s ease" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[9px] uppercase text-muted-foreground">Fill level</span>
                    <strong className="font-display text-4xl">{data.fillLevel}%</strong>
                    <span className={`text-[10px] font-medium ${statusMeta.ring}`}>{statusMeta.label}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {THRESHOLDS.map((t) => (
                  <div
                    key={t.key}
                    className={`rounded-md border px-3 py-3 text-xs ${
                      t.key === statusKey ? t.chip : "border-transparent bg-muted/50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${t.dot}`} />
                      {t.label}
                    </span>
                    <p className="mt-1 text-[10px] text-muted-foreground">{t.range}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Sensor Status */}
            <section className="rounded-lg border border-border bg-card p-5">
              <div className="flex justify-between gap-3">
                <div>
                  <h2 className="font-display font-semibold">Sensor Status</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Device connectivity &amp; last sync</p>
                </div>
                <span className={`flex h-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                  data.online ? "border-success/30 bg-success/10 text-success" : "border-danger/30 bg-danger/10 text-danger"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${data.online ? "bg-success" : "bg-danger"}`} />
                  {data.online ? "Online" : "Offline"}
                </span>
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-md border border-border bg-muted/40 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success/10">
                  <Wifi className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-[9px] uppercase text-muted-foreground">Connection</p>
                  <p className="font-display text-lg font-semibold">
                    {data.online ? "Connected" : "Disconnected"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {data.sensorId} · Signal {data.signal == null ? "Not reported" : `${data.signal}%`}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-md border border-border bg-muted/40 px-4 py-3">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Battery className="h-4 w-4" />
                  Battery
                </span>
                <span className="text-xs font-semibold">{data.battery == null ? "Not reported" : `${data.battery}%`}</span>
              </div>

              <p className="mt-3 text-[10px] text-muted-foreground">Last sync {data.lastSync}</p>
            </section>
          </div>

          {/* ---------------- FILL LEVEL HISTORY ---------------- */}
          <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display font-semibold">Fill Level History</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Trend analysis over the selected time period
                </p>
              </div>
              <div className="flex gap-1 rounded-md border border-border bg-muted/40 p-1">
                {[{ v: "7", l: "7 Days" }, { v: "30", l: "30 Days" }, { v: "90", l: "90 Days" }].map((r) => (
                  <button
                    key={r.v}
                    onClick={() => setRange(r.v)}
                    className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                      range === r.v
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 h-[240px] w-full">
              {selectedHistory.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
                  No readings have been collected for this period yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedHistory} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#00E5FF" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="oklch(0.30 0.025 275)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} dy={8} />
                  <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.20 0.018 270)",
                      border: "1px solid oklch(0.30 0.025 275)",
                      borderRadius: 10,
                      fontSize: 12,
                      color: "#fff",
                    }}
                    labelStyle={{ color: "#94a3b8" }}
                    formatter={(v) => [`${v}%`, "Fill level"]}
                  />
                  <Area type="monotone" dataKey="value" stroke="#00E5FF" strokeWidth={2}
                        fill="url(#fillGrad)" dot={false} activeDot={{ r: 4, fill: "#00E5FF" }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Fill level (%)
                </span>
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {data.rangeLabel[range]}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">Updated {data.lastSync}</span>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
