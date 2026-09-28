import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Activity, ArrowUpRight, Bell, Bot, Box, CalendarDays, ChevronRight,
  Clock, Droplets, FileWarning, Gauge, Home, LogOut, Menu,
  ShieldCheck, TrendingUp, UserRound, Wrench,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

/* ==================================================================
   SeptiGuard — Predictions (Resident)
   ------------------------------------------------------------------
   REQUIRES:  npm install recharts
   ------------------------------------------------------------------
   Lahat ng nasa SAMPLE_DATA ay galing sa mga bagay na kaya talaga
   ng backend mo i-compute:

     predictedDate / daysRemaining  -> FastAPI Linear Regression
     confidence                     -> predictions.confidence (R²)
     readingsUsed                   -> count ng tank_readings na ginamit
     weeklyGrowth / fillRate        -> daily_fill_rate sa predictions table
     avgDailyInflow                 -> daily_fill_rate% x capacity_liters
     capacity / tankType            -> septic_systems
     lastPumpOut                    -> septic_systems.last_maintenance_date

   CRITICAL THRESHOLD = 80% (single source of truth):
     >= 80% critical, >= 70% warning, < 70% normal

   NOTE: Tinanggal ang Weather Impact, Household size, at ang
   accuracy/error/samples metrics kasi walang data source sa schema.
================================================================== */

const SAMPLE_DATA = {
  updated: "2h ago",
  confidence: 94,

  predictedDate: { month: "MAR", day: "18", year: "2026" },
  predictedFullText: "Wednesday, March 18, 2026",
  daysRemaining: 10,
  weeklyGrowth: 7.0,
  dataWindow: "Last 30 days of readings",

  readingsUsed: 412,
  fillRate: 1.0,

  /* historical = solid cyan, predicted = dashed amber.
     Magkasabay sila sa junction point (Mar 8) para dikit ang linya. */
  curve: [
    { date: "Mar 1",  historical: 63, predicted: null },
    { date: "Mar 3",  historical: 65, predicted: null },
    { date: "Mar 5",  historical: 67, predicted: null },
    { date: "Mar 7",  historical: 69, predicted: null },
    { date: "Mar 8",  historical: 70, predicted: 70   },
    { date: "Mar 10", historical: null, predicted: 72 },
    { date: "Mar 12", historical: null, predicted: 74 },
    { date: "Mar 14", historical: null, predicted: 76 },
    { date: "Mar 16", historical: null, predicted: 78 },
    { date: "Mar 18", historical: null, predicted: 80 },
    { date: "Mar 20", historical: null, predicted: 82 },
  ],

  recommendations: [
    {
      icon: CalendarDays,
      title: "Schedule pump-out",
      badge: "URGENT",
      tone: "urgent",
      detail: "Book service before March 18 to avoid overflow risk",
    },
    {
      icon: Droplets,
      title: "Reduce water usage",
      badge: "ADVISED",
      tone: "advised",
      detail: "Spread out laundry and heavy water use to slow the fill rate",
    },
    {
      icon: Wrench,
      title: "Maintenance check",
      badge: "ROUTINE",
      tone: "routine",
      detail: "Last pump-out was 59 days ago — consider an inspection",
    },
  ],

  insights: [
    { icon: Box,      label: "Tank capacity",    value: "5,000 L",     note: "Concrete tank",       noteTone: "text-muted-foreground" },
    { icon: Droplets, label: "Avg daily inflow", value: "50 L/day",    note: "Fill rate × capacity", noteTone: "text-muted-foreground" },
    { icon: Gauge,    label: "Fill rate",        value: "+1.0 %/day",  note: "Last 7 days",         noteTone: "text-muted-foreground" },
    { icon: Wrench,   label: "Last pump-out",    value: "59 days ago", note: "Jan 8, 2026",         noteTone: "text-muted-foreground" },
  ],
};

const NAV = [
  { icon: Home,        label: "Dashboard", path: "/dashboard" },
  { icon: Activity,    label: "Monitoring", path: "/monitor" },
  { icon: Bot,         label: "Predict", path: "/predict", active: true },
  { icon: FileWarning, label: "Complaints", path: "/complaints" },
  { icon: Wrench,      label: "Maintain", path: "/maintain" },
  { icon: Bell,        label: "Alerts", path: "/alerts" },
  { icon: UserRound,   label: "Profile", path: "/profile" },
];

const TONES = {
  urgent:  { badge: "text-danger",  wrap: "border-primary/35 bg-primary/10", icon: "bg-primary/15 text-primary" },
  advised: { badge: "text-warning", wrap: "border-border bg-muted/40",       icon: "bg-warning/15 text-warning" },
  routine: { badge: "text-success", wrap: "border-border bg-muted/40",       icon: "bg-success/15 text-success" },
};

export default function Predictions() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(SAMPLE_DATA);

  const first = user?.name?.split(" ")[0] ?? "Resident";
  const soon = (name) => window.alert(`${name} will be connected in the next step.`);
  const signOut = async () => { await logout(); navigate("/"); };

  /* ---------- API CALL — i-uncomment kapag ready na ang backend ----------
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get("http://localhost:8000/api/predictions/latest", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => setData(res.data))
    .catch(err => console.error(err));
  }, []);
  ---------------------------------------------------------------------- */

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
      <div className="page-transition min-w-0 flex-1 lg:ml-24">
        <header className="flex h-20 items-center justify-between border-b border-border px-4 sm:px-7">
          <div className="flex items-center gap-3">
            <button className="rounded-md border border-border p-2 lg:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs text-muted-foreground">Resident Portal › Predictions</p>
              <h1 className="mt-1 font-display text-xl font-bold">Predictions</h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary sm:flex">
            <Clock className="h-3.5 w-3.5" />
            Updated {data.updated}
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-7">
          <p className="text-xs text-muted-foreground">
            Forecasts based on your tank&apos;s usage patterns
          </p>

          <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
            {/* ============ LEFT: Predicted date + curve ============ */}
            <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-display font-semibold">Predicted Critical Fill Date</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    When your tank is expected to reach 80% capacity
                  </p>
                </div>
                <span className="flex h-fit items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Gauge className="h-3 w-3" />
                  {data.confidence}% Confidence
                </span>
              </div>

              {/* prediction block */}
              <div className="mt-5 flex flex-wrap items-center gap-5 rounded-md border border-primary/20 bg-primary/5 p-4">
                <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {data.predictedDate.month}
                  </span>
                  <span className="font-display text-3xl font-bold leading-none">
                    {data.predictedDate.day}
                  </span>
                  <span className="mt-0.5 text-[10px] text-muted-foreground">
                    {data.predictedDate.year}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline gap-2">
                    <strong className="font-display text-4xl font-bold">{data.daysRemaining}</strong>
                    <span className="text-sm text-muted-foreground">days remaining</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tank will reach critical fill level on{" "}
                    <span className="font-medium text-primary">{data.predictedFullText}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-warning" />
                      +{data.weeklyGrowth}% weekly growth
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {data.dataWindow}
                    </span>
                  </div>
                </div>
              </div>

              {/* projected fill curve */}
              <div className="mt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-display text-sm font-semibold">Projected Fill Curve</h3>
                  <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-primary" /> Historical
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-warning" /> Predicted
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-danger" /> Critical 80%
                    </span>
                  </div>
                </div>

                <div className="mt-4 h-[230px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.curve} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#00E5FF" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="4 4" stroke="oklch(0.30 0.025 275)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }}
                             axisLine={false} tickLine={false} dy={8} />
                      <YAxis domain={[40, 100]} ticks={[40, 55, 70, 80, 100]}
                             tick={{ fill: "#94a3b8", fontSize: 11 }}
                             axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: "oklch(0.20 0.018 270)",
                          border: "1px solid oklch(0.30 0.025 275)",
                          borderRadius: 10,
                          fontSize: 12,
                          color: "#fff",
                        }}
                        labelStyle={{ color: "#94a3b8" }}
                        formatter={(v, n) => [`${v}%`, n === "historical" ? "Historical" : "Predicted"]}
                      />

                      {/* critical threshold line — 80% */}
                      <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={1} />

                      <Area type="monotone" dataKey="historical" stroke="#00E5FF" strokeWidth={2}
                            fill="url(#histGrad)" dot={false} connectNulls={false} />
                      <Area type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={2}
                            strokeDasharray="6 4" fill="url(#predGrad)" dot={false} connectNulls={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* ============ RIGHT: confidence + recommendations ============ */}
            <div className="space-y-5">
              {/* Prediction Confidence */}
              <section className="rounded-lg border border-border bg-card p-5">
                <div className="flex justify-between gap-3">
                  <div>
                    <h2 className="font-display font-semibold">Prediction Confidence</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      How closely your readings follow a steady trend
                    </p>
                  </div>
                  <Gauge className="h-5 w-5 text-primary" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Metric label="Readings used" value={data.readingsUsed}
                          note="Last 30 days" />
                  <Metric label="Fill rate" value={`+${data.fillRate} %/day`}
                          note="From your readings" />
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-semibold text-primary">{data.confidence}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${data.confidence}%` }}
                    />
                  </div>
                </div>
              </section>

              {/* Recommended Actions */}
              <section className="rounded-lg border border-border bg-card p-5">
                <h2 className="font-display font-semibold">Recommended Actions</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Suggested steps based on your predicted fill date
                </p>

                <div className="mt-4 space-y-2">
                  {data.recommendations.map((r) => {
                    const tone = TONES[r.tone];
                    return (
                      <button
                        key={r.title}
                        onClick={() => soon(r.title)}
                        className={`flex w-full items-center gap-3 rounded-md border p-3 text-left transition hover:brightness-110 ${tone.wrap}`}
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${tone.icon}`}>
                          <r.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold">{r.title}</span>
                            <span className={`text-[9px] font-bold tracking-wide ${tone.badge}`}>
                              {r.badge}
                            </span>
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">{r.detail}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>

          {/* ============ BOTTOM: Prediction Insights ============ */}
          <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display font-semibold">Prediction Insights</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Key factors behind the forecast
                </p>
              </div>
              <button
                onClick={() => soon("Full report")}
                className="flex items-center gap-1 text-xs text-primary"
              >
                View full report <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {data.insights.map((i) => (
                <div key={i.label} className="min-w-0 rounded-lg border border-border bg-muted/40 p-4">
                  <p className="flex items-center gap-2 text-[9px] uppercase tracking-wide text-muted-foreground">
                    <i.icon className="h-3.5 w-3.5" />
                    {i.label}
                  </p>
                  <p className="mt-3 truncate font-display text-xl font-bold">{i.value}</p>
                  <p className={`mt-2 text-[10px] ${i.noteTone}`}>{i.note}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function Metric({ label, value, note, valueClass = "" }) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-muted/40 p-3">
      <p className="truncate text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-lg font-bold ${valueClass}`}>{value}</p>
      <p className="mt-2 text-[9px] text-muted-foreground">{note}</p>
    </div>
  );
}
