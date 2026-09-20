import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Activity, Battery, Bell, Bot, CalendarDays, FileWarning, Home,
  LogOut, Menu, RefreshCw, Settings, ShieldCheck, TriangleAlert,
  UserRound, Wifi, Wrench,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

/* ==================================================================
   SeptiGuard — Real-Time Monitoring (Resident)
   ------------------------------------------------------------------
   REQUIRES:  npm install recharts
   ------------------------------------------------------------------
   Sample data lang muna ang laman (SAMPLE_DATA sa baba).
   Kapag ready na ang Laravel API, may naka-comment na axios block
   sa loob ng component — i-uncomment mo na lang.
================================================================== */

const SAMPLE_DATA = {
  fillLevel: 70,
  sensorId: "IoT-Sensor-04A2",
  online: true,
  signal: 94,
  battery: 87,
  lastSync: "2s ago",
  history: {
    "7": [
      { date: "May 6",  value: 55 }, { date: "May 7",  value: 58 },
      { date: "May 8",  value: 61 }, { date: "May 9",  value: 64 },
      { date: "May 10", value: 66 }, { date: "May 11", value: 68 },
      { date: "May 12", value: 70 },
    ],
    "30": [
      { date: "Apr 13", value: 22 }, { date: "Apr 18", value: 31 },
      { date: "Apr 23", value: 39 }, { date: "Apr 28", value: 47 },
      { date: "May 3",  value: 54 }, { date: "May 8",  value: 62 },
      { date: "May 12", value: 70 },
    ],
    "90": [
      { date: "Feb 12", value: 8  }, { date: "Feb 27", value: 18 },
      { date: "Mar 14", value: 27 }, { date: "Mar 29", value: 36 },
      { date: "Apr 13", value: 46 }, { date: "Apr 28", value: 58 },
      { date: "May 12", value: 70 },
    ],
  },
  rangeLabel: {
    "7":  "May 6 – May 12, 2026",
    "30": "Apr 13 – May 12, 2026",
    "90": "Feb 12 – May 12, 2026",
  },
};

const NAV = [
  { icon: Home,        label: "Dashboard", path: "/dashboard" },
  { icon: Activity,    label: "Monitor", path: "/monitor", active: true },
  { icon: Bot,         label: "Predict", path: "/predict" },
  { icon: FileWarning, label: "Complaints", path: "/complaints" },
  { icon: Wrench,      label: "Maintain", path: "/maintain" },
  { icon: Bell,        label: "Alerts", path: "/alerts" },
  { icon: UserRound,   label: "Profile" },
];

/* Status thresholds — same as the paper */
const THRESHOLDS = [
  { key: "normal",   label: "Normal",   range: "0–60%",   dot: "bg-success", ring: "text-success", chip: "border-success/30 bg-success/10 text-success" },
  { key: "warning",  label: "Warning",  range: "61–80%",  dot: "bg-warning", ring: "text-warning", chip: "border-warning/30 bg-warning/10 text-warning" },
  { key: "critical", label: "Critical", range: "81–100%", dot: "bg-danger",  ring: "text-danger",  chip: "border-danger/30 bg-danger/10 text-danger" },
];

const getStatusKey = (fill) =>
  fill >= 81 ? "critical" : fill >= 61 ? "warning" : "normal";

export default function RealTimeMonitoring() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState("7");
  const data = SAMPLE_DATA;
  const [refreshing, setRefreshing] = useState(false);

  const first = user?.name?.split(" ")[0] ?? "Resident";
  const soon = (name) => window.alert(`${name} will be connected in the next step.`);
  const signOut = async () => { await logout(); navigate("/"); };

  const statusKey = getStatusKey(data.fillLevel);
  const statusMeta = THRESHOLDS.find((t) => t.key === statusKey);

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
    setTimeout(() => setRefreshing(false), 800);
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
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary text-[10px] font-semibold">
            {first.slice(0, 2).toUpperCase()}
          </div>
          <button onClick={signOut} title="Sign out" className="p-2 text-muted-foreground hover:text-danger">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>
      {open && <button className="fixed inset-0 z-30 bg-background/80 lg:hidden" onClick={() => setOpen(false)} />}

      {/* ======================= MAIN ======================= */}
      <div className="min-w-0 flex-1 lg:ml-24">
        <header className="flex h-20 items-center justify-between border-b border-border px-4 sm:px-7">
          <div className="flex items-center gap-3">
            <button className="rounded-md border border-border p-2 lg:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs text-muted-foreground">Resident Portal › Real-Time Monitoring</p>
              <h1 className="mt-1 font-display text-xl font-bold">Real-Time Monitoring</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button onClick={() => soon("Settings")} className="rounded-md border border-border p-2">
              <Settings className="h-4 w-4" />
            </button>
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
                    {data.sensorId} · Signal {data.signal}%
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-md border border-border bg-muted/40 px-4 py-3">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Battery className="h-4 w-4" />
                  Battery
                </span>
                <span className="text-xs font-semibold">{data.battery}%</span>
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
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.history[range]} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
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
