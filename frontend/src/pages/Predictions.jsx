import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Activity, Bell, Bot, Box, CalendarDays, ChevronRight, CircleAlert,
  Clock, Droplets, FileWarning, Gauge, Home, LogOut, Menu,
  ShieldCheck, TrendingUp, UserRound, Wrench,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import ResidentAvatar from "../components/ResidentAvatar.jsx";
import { fetchResidentPrediction } from "../api.js";

/* ==================================================================
   SeptiGuard — Predictions (Resident)
   ------------------------------------------------------------------
   Live forecasts come from the resident prediction API and use a
   transparent 30-day daily-average linear trend, not an ML model.

   CRITICAL THRESHOLD = 80% (single source of truth):
     >= 80% critical, >= 70% warning, < 70% normal

   NOTE: Tinanggal ang Weather Impact, Household size, at ang
   accuracy/error/samples metrics kasi walang data source sa schema.
================================================================== */

function createSampleData() {
  const today = new Date();
  const daysRemaining = 10;
  const predictedDate = new Date(today);
  predictedDate.setDate(predictedDate.getDate() + daysRemaining);
  const lastPumpOut = new Date(today);
  lastPumpOut.setDate(lastPumpOut.getDate() - 59);
  const formatChartDate = (date) => new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
  const predictedFullText = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(predictedDate);
  const chartOffsets = [-7, -5, -3, -1, 0, 2, 4, 6, 8, 10, 12];
  const curveValues = [63, 65, 67, 69, 70, 72, 74, 76, 78, 80, 82];
  const curve = chartOffsets.map((offset, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    return {
      date: formatChartDate(date),
      historical: index <= 4 ? curveValues[index] : null,
      predicted: index >= 4 ? curveValues[index] : null,
    };
  });

  return {
    updated: "Demo sample",
    trendFitPercent: 94,
    predictedDate: {
      month: predictedDate.toLocaleString(undefined, { month: "short" }).toUpperCase(),
      day: predictedDate.getDate(),
      year: predictedDate.getFullYear(),
    },
    predictedFullText,
    daysRemaining,
    weeklyGrowth: 7.0,
    dataWindow: "Sample reading window",
    readingsUsed: 12,
    fillRate: 1.0,
    curve,
    recommendations: [
      {
        icon: CalendarDays,
        title: "Schedule pump-out",
        badge: "URGENT",
        tone: "urgent",
        detail: `Book service before ${predictedFullText} to avoid overflow risk`,
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
      { icon: Box, label: "Tank capacity", value: "5,000 L", note: "Concrete tank", noteTone: "text-muted-foreground" },
      { icon: Droplets, label: "Avg daily inflow", value: "50 L/day", note: "Fill rate × capacity", noteTone: "text-muted-foreground" },
      { icon: Gauge, label: "Fill rate", value: "+1.0 %/day", note: "Last 7 days", noteTone: "text-muted-foreground" },
      {
        icon: Wrench,
        label: "Last pump-out",
        value: "59 days ago",
        note: new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(lastPumpOut),
        noteTone: "text-muted-foreground",
      },
    ],
  };
}

function createForecastViewData(forecast) {
  const isReady = forecast.status === "ready";
  const predictedDate = isReady ? new Date(forecast.predicted_critical_at) : null;
  const latestHistory = forecast.history.at(-1);
  const formatChartDate = (dateKey) => {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, day)));
  };
  const addDaysToDateKey = (dateKey, days) => {
    const [year, month, day] = dateKey.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day + days));
    return date.toISOString().slice(0, 10);
  };
  const curve = forecast.history.map((point, index) => ({
    date: formatChartDate(point.reading_date ?? point.measured_at.slice(0, 10)),
    historical: point.fill_percentage,
    predicted: isReady && index === forecast.history.length - 1 ? point.fill_percentage : null,
  }));

  for (let day = 1; isReady && day <= forecast.days_to_critical; day += 1) {
    const dateKey = addDaysToDateKey(
      latestHistory.reading_date ?? latestHistory.measured_at.slice(0, 10),
      day,
    );
    curve.push({
      date: formatChartDate(dateKey),
      historical: null,
      predicted: Math.min(80, latestHistory.fill_percentage + forecast.fill_rate_per_day * day),
    });
  }

  const predictedFullText = predictedDate ? new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(predictedDate) : null;

  return {
    updated: "Based on latest readings",
    trendFitPercent: forecast.trend_fit_percent,
    predictedDate: predictedDate ? {
      month: predictedDate.toLocaleString(undefined, { month: "short" }).toUpperCase(),
      day: predictedDate.getDate(),
      year: predictedDate.getFullYear(),
    } : null,
    predictedFullText,
    daysRemaining: forecast.days_to_critical,
    weeklyGrowth: forecast.fill_rate_per_day === null ? null : forecast.fill_rate_per_day * 7,
    dataWindow: `${forecast.days_observed} days observed`,
    readingsUsed: forecast.readings_used,
    fillRate: forecast.fill_rate_per_day,
    curve,
    recommendationMessage: forecast.message,
    recommendations: isReady ? [
      {
        icon: CalendarDays,
        title: "Plan maintenance",
        badge: "ESTIMATE",
        tone: "urgent",
        detail: `The trend reaches 80% around ${predictedFullText}. This is an estimate, not a guarantee.`,
      },
    ] : [],
    insights: [
      { icon: Gauge, label: "Current fill", value: forecast.current_fill === null ? "--" : `${forecast.current_fill}%`, note: "Latest daily average", noteTone: "text-muted-foreground" },
      { icon: TrendingUp, label: "Estimated fill rate", value: forecast.fill_rate_per_day === null ? "--" : `${forecast.fill_rate_per_day.toFixed(2)} %/day`, note: "Linear trend over daily averages", noteTone: "text-muted-foreground" },
      { icon: CalendarDays, label: "Data window", value: `${forecast.daily_points} days`, note: `${forecast.readings_used} raw readings used`, noteTone: "text-muted-foreground" },
      { icon: Gauge, label: "Trend fit", value: forecast.trend_fit_percent === null ? "--" : `${forecast.trend_fit_percent}%`, note: "R² fit, not a probability", noteTone: "text-muted-foreground" },
    ],
  };
}

function statusTitle(status) {
  return ({
    no_sensor: "No tank device linked",
    no_readings: "No readings to forecast yet",
    insufficient_data: "Collect readings over more days",
    stale_readings: "Waiting for a recent reading",
    no_increasing_trend: "No increasing fill trend",
    beyond_forecast_horizon: "No near-term date estimate",
    threshold_reached: "Critical level already reached",
  })[status] ?? "Forecast not available";
}

const NAV = [
  { icon: Home,        label: "Dashboard", path: "/dashboard" },
  { icon: Activity,    label: "Monitoring", path: "/monitor" },
  { icon: Bot,         label: "Predict", path: "/predict", active: true },
  { icon: FileWarning, label: "Complaints", path: "/complaints" },
  { icon: Wrench,      label: "Maintenance", path: "/maintain" },
  { icon: Bell,        label: "Alerts", path: "/alerts" },
  { icon: UserRound,   label: "Profile", path: "/profile" },
];

const TONES = {
  urgent:  { badge: "text-danger",  wrap: "border-primary/35 bg-primary/10", icon: "bg-primary/15 text-primary" },
  advised: { badge: "text-warning", wrap: "border-border bg-muted/40",       icon: "bg-warning/15 text-warning" },
  routine: { badge: "text-success", wrap: "border-border bg-muted/40",       icon: "bg-success/15 text-success" },
};

export default function Predictions() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [sampleData] = useState(createSampleData);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(!user?.demo_mode && Boolean(token));
  const [loadError, setLoadError] = useState(!user?.demo_mode && !token ? "Your session is unavailable. Please sign in again." : "");
  const [refreshKey, setRefreshKey] = useState(0);
  const data = user?.demo_mode
    ? sampleData
    : forecast
      ? createForecastViewData(forecast)
      : null;
  const viewData = data ?? {
    updated: loading ? "Loading..." : "Unavailable",
    trendFitPercent: null,
    predictedDate: null,
    predictedFullText: null,
    daysRemaining: null,
    weeklyGrowth: null,
    dataWindow: "No data window",
    readingsUsed: 0,
    fillRate: null,
    curve: [],
    recommendationMessage: loadError || "A forecast will appear when enough recent readings are available.",
    recommendations: [],
    insights: [
      { icon: Gauge, label: "Current fill", value: "--", note: "Awaiting readings", noteTone: "text-muted-foreground" },
      { icon: TrendingUp, label: "Estimated fill rate", value: "--", note: "Awaiting a trend", noteTone: "text-muted-foreground" },
      { icon: CalendarDays, label: "Data window", value: "--", note: "No readings used", noteTone: "text-muted-foreground" },
      { icon: Gauge, label: "Trend fit", value: "--", note: "Not available", noteTone: "text-muted-foreground" },
    ],
  };

  const signOut = async () => { await logout(); navigate("/"); };

  useEffect(() => {
    if (user?.demo_mode || !token) return undefined;
    let active = true;
    const load = () => fetchResidentPrediction(token)
      .then((result) => {
        if (active) {
          setForecast(result);
          setLoadError("");
        }
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    load();
    const interval = window.setInterval(load, 60000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [token, user?.demo_mode, refreshKey]);

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
              onClick={() => { setOpen(false); navigate(x.path); }}
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
              <p className="text-xs text-muted-foreground">Resident Portal › Predictions</p>
              <h1 className="mt-1 font-display text-xl font-bold">Predictions</h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary sm:flex">
            <Clock className="h-3.5 w-3.5" />
            Updated {viewData.updated}
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-7">
          <p className="text-xs text-muted-foreground">
            {user?.demo_mode
              ? "Simulated demo projection — not a real forecast"
              : "A linear-regression estimate from recent readings — not a guarantee"}
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
                  {viewData.trendFitPercent === null ? "Trend Fit unavailable" : `${viewData.trendFitPercent}% Trend Fit`}
                </span>
              </div>

              {/* prediction block */}
              <div className="mt-5 flex flex-wrap items-center gap-5 rounded-md border border-primary/20 bg-primary/5 p-4">
                {viewData.predictedDate ? (
                  <>
                    <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">{viewData.predictedDate.month}</span>
                      <span className="font-display text-3xl font-bold leading-none">{viewData.predictedDate.day}</span>
                      <span className="mt-0.5 text-[10px] text-muted-foreground">{viewData.predictedDate.year}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-baseline gap-2">
                        <strong className="font-display text-4xl font-bold">{viewData.daysRemaining}</strong>
                        <span className="text-sm text-muted-foreground">days remaining</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Tank will reach critical fill level on{" "}
                        <span className="font-medium text-primary">{viewData.predictedFullText}</span>
                      </p>
                      <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5 text-warning" />
                          +{viewData.weeklyGrowth.toFixed(1)}% weekly growth
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {viewData.dataWindow}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-24 flex-1 items-center gap-3">
                    <CircleAlert className="h-6 w-6 shrink-0 text-primary" />
                    <div>
                      <p className="font-semibold">
                        {loading ? "Calculating forecast..." : loadError ? "Could not load forecast" : statusTitle(forecast?.status)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {loading ? "Checking recent readings for a usable trend." : loadError || viewData.recommendationMessage}
                      </p>
                      {loadError && !loading && (
                        <button
                          type="button"
                          className="mt-2 text-xs font-medium text-primary"
                          onClick={() => { setLoading(true); setLoadError(""); setRefreshKey((key) => key + 1); }}
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                )}
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
                    <AreaChart data={viewData.curve} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
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
                      <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]}
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
                {!loading && viewData.curve.length === 0 && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    {loadError ? "Reading history is temporarily unavailable." : "Historical readings will appear here."}
                  </p>
                )}
              </div>
            </section>

            {/* ============ RIGHT: confidence + recommendations ============ */}
            <div className="space-y-5">
              {/* Prediction Confidence */}
              <section className="rounded-lg border border-border bg-card p-5">
                <div className="flex justify-between gap-3">
                  <div>
                    <h2 className="font-display font-semibold">Trend Fit</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      How closely readings follow the linear trend; not a probability
                    </p>
                  </div>
                  <Gauge className="h-5 w-5 text-primary" />
                </div>

                <div className="mt-4">
                  <Metric label="Readings used" value={viewData.readingsUsed}
                          note="Last 30 days" />
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Trend fit (R²)</span>
                    <span className="font-semibold text-primary">
                      {viewData.trendFitPercent === null ? "--" : `${viewData.trendFitPercent}%`}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${viewData.trendFitPercent ?? 0}%` }}
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
                  {viewData.recommendations.length === 0 && (
                    <p className="rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
                      {loading ? "Recommendations will appear when a forecast is ready." : viewData.recommendationMessage}
                    </p>
                  )}
                  {viewData.recommendations.map((r) => {
                    const tone = TONES[r.tone];
                    return (
                      <button
                        key={r.title}
                        onClick={() => navigate("/maintain")}
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
              {user?.demo_mode && <span className="text-xs text-primary">Simulated sample</span>}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {viewData.insights.map((i) => (
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
