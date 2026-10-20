import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Boxes,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Gauge,
  MapPin,
  Menu,
} from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import TankPanel from "@/components/TankPanel";
import DispatchModal from "@/components/DispatchModal";
import AdminNotificationPopover from "@/components/AdminNotificationPopover";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "../context/AuthContext.jsx";
import { dispatchAdminDesludging, fetchAdminTanks } from "../api.js";

export default function AdminDashboard({ navigate }) {
  const { user, token, logout } = useAuth();
  const routerNavigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [selectedTank, setSelectedTank] = useState(null);
  const [dispatchTank, setDispatchTank] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const soon = (name) => window.alert(`${name} will be connected in the next step.`);
  const signOut = async () => {
    await logout();
    routerNavigate("/");
  };
  const goToTanks = navigate ?? (() => routerNavigate("/admin/tanks"));
  useEffect(() => {
    let current = true;
    fetchAdminTanks(token)
      .then((data) => {
        if (!current) return;
        setLoadError("");
        const summary = data.summary ?? {};
        const tanks = data.tanks ?? [];
        setDashboardData({
          ...summary,
          tanks: tanks
            .filter((tank) => tank.level !== null && tank.level >= 70)
            .sort((a, b) => (b.level ?? 0) - (a.level ?? 0))
            .slice(0, 5)
            .map((tank) => ({
              ...tank,
              date: tank.measured_at ? new Date(tank.measured_at).toLocaleDateString() : "No reading",
              action: tank.level >= 80 ? "Dispatch" : "Schedule",
            })),
          alerts: tanks
            .filter((tank) => tank.level !== null && tank.level >= 80)
            .sort((a, b) => (b.level ?? 0) - (a.level ?? 0))
            .map((tank) => ({ ...tank, critical: true })),
        });
      })
      .catch((error) => {
        if (current) setLoadError(error.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [token, refreshKey]);
  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <AdminSidebar open={open} setOpen={setOpen} navigate={navigate ?? routerNavigate} user={user} signOut={signOut} active="Dashboard" />
      {open && (
        <button
          className="fixed inset-0 z-30 bg-background/80 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        />
      )}
      <div className="min-w-0 flex-1 lg:ml-52">
        <header className="flex h-20 items-center justify-between border-b border-border px-4 sm:px-7">
          <div className="flex items-center gap-3">
            <button className="rounded-md border border-border p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <p className="text-[10px] text-muted-foreground">
                Admin Portal <span className="px-1">›</span> Dashboard
              </p>
              <h1 className="mt-1 font-display text-xl font-bold">Dashboard</h1>
            </div>
          </div>
          <AdminNotificationPopover token={token} navigate={routerNavigate} onViewAll={() => routerNavigate("/admin/residents")} />
        </header>

        <main className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-7">
          <section className="flex flex-col justify-between gap-4 rounded-lg border border-primary/20 bg-primary/25 p-5 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] text-primary">
                <span className="rounded border border-primary/40 px-2 py-0.5 font-semibold uppercase">Live data</span>
                <span>Community overview</span>
              </div>
              <h2 className="font-display text-lg font-bold">Broadway Hagdan Loob HOA — Admin Overview</h2>
              <p className="mt-1 text-xs text-foreground/75">Community septic monitoring at a glance.</p>
            </div>
            <div className="flex items-center gap-3 rounded-md bg-background/40 px-4 py-3">
              <MapPin className="h-4 w-4 text-primary" />
              <div>
                <p className="text-[8px] uppercase text-muted-foreground">Location</p>
                <p className="text-[10px]">Sitio Broadway, Antipolo</p>
              </div>
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {loading ? (
              <StatSkeletons />
            ) : (
              <>
                <Stat icon={Boxes} label="Total Tanks" value={dashboardData ? String(dashboardData.total_tanks) : loadError ? "—" : "0"} note="Registered tanks" tone="primary" />
                <Stat icon={CircleAlert} label="Critical Tanks" value={dashboardData ? String(dashboardData.critical_tanks) : loadError ? "—" : "0"} note="Requires attention" tone="danger" />
                <Stat icon={ClipboardList} label="Open Complaints" value={dashboardData ? String(dashboardData.open_complaints) : loadError ? "—" : "0"} note="Pending resolution" tone="warning" />
                <Stat icon={Gauge} label="Avg. Fill Level" value={dashboardData?.average_fill != null ? `${dashboardData.average_fill}%` : "—"} note="From latest readings" tone="success" />
              </>
            )}
          </div>

          {loadError && (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-danger/40 bg-danger/10 p-3 text-xs text-danger">
              <span>Could not load dashboard data: {loadError}</span>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setLoadError("");
                  setRefreshKey((key) => key + 1);
                }}
                className="rounded-md border border-danger/40 px-3 py-1.5 font-medium hover:bg-danger/10"
              >
                Retry
              </button>
            </div>
          )}
          {loading ? (
            <DashboardSectionsSkeleton />
          ) : dashboardData ? (
            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <Distribution data={dashboardData} />
              <CriticalAlerts data={dashboardData} onView={setSelectedTank} />
            </div>
          ) : null}

          <section className="rounded-lg border border-border bg-card p-5" aria-busy={loading}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-sm font-semibold">Priority Tanks</h2>
                <p className="mt-1 text-[10px] text-muted-foreground">High-priority tank monitoring</p>
              </div>
              <button onClick={goToTanks} className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-[10px]">
                View All <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="border-b border-border text-[9px] uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3">Tank ID</th>
                    <th>Resident</th>
                    <th>Address</th>
                    <th>Fill Level</th>
                    <th>Last Update</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <PriorityRowsSkeleton />
                  ) : loadError ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-xs text-muted-foreground">
                        Priority tank data is unavailable. Retry to load the dashboard.
                      </td>
                    </tr>
                  ) : dashboardData?.tanks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-xs text-muted-foreground">
                        No tanks currently require priority attention.
                      </td>
                    </tr>
                  ) : (dashboardData?.tanks ?? []).map((t) => (
                    <tr key={t.id} className="border-b border-border/70 text-[11px] last:border-0">
                      <td className="px-3 py-4 font-medium">
                        <button onClick={() => setSelectedTank(t)} className="text-primary hover:underline">
                          {t.id}
                        </button>
                      </td>
                      <td>{t.resident}</td>
                      <td className="text-muted-foreground">{t.address}</td>
                      <td>
                        <LevelBar value={t.level} />
                      </td>
                      <td>{t.date}</td>
                      <td className="text-right">
                        <button
                          onClick={() => setDispatchTank(t)}
                          className="rounded-md bg-primary px-4 py-2 text-[10px] font-medium text-primary-foreground"
                        >
                          {t.action}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
      <TankPanel tank={selectedTank} onClose={() => setSelectedTank(null)} onAction={soon} />
      <DispatchModal
        tank={dispatchTank}
        onClose={() => setDispatchTank(null)}
        onConfirm={async ({ tankId, scheduledFor }) => {
          await dispatchAdminDesludging(token, tankId, scheduledFor);
          setRefreshKey((key) => key + 1);
        }}
      />
    </div>
  );
}

function StatSkeletons() {
  return Array.from({ length: 4 }, (_, index) => (
    <div key={index} className="rounded-lg border border-border bg-card p-4" aria-hidden="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
      <Skeleton className="mt-3 h-8 w-16" />
      <Skeleton className="mt-4 h-3 w-28" />
    </div>
  ));
}

function DashboardSectionsSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]" aria-label="Loading dashboard sections" aria-busy="true">
      <div className="rounded-lg border border-border bg-card p-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-2 h-3 w-52" />
        <div className="mt-5 flex items-center gap-6">
          <Skeleton className="h-36 w-36 rounded-full" />
          <div className="flex-1 space-y-2">
            {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-3 w-48" />
        <div className="mt-5 space-y-2">
          {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-14 w-full" />)}
        </div>
      </div>
    </div>
  );
}

function PriorityRowsSkeleton() {
  return Array.from({ length: 4 }, (_, index) => (
    <tr key={index} aria-hidden="true" className="border-b border-border/70">
      {Array.from({ length: 6 }, (_, cellIndex) => (
        <td key={cellIndex} className="px-3 py-4">
          <Skeleton className={cellIndex === 5 ? "ml-auto h-8 w-20" : "h-3 w-24"} />
        </td>
      ))}
    </tr>
  ));
}

function Stat({ icon: Icon, label, value, note, tone }) {
  const colors = {
    primary: "text-primary bg-primary/15",
    success: "text-success bg-success/15",
    danger: "text-danger bg-danger/15",
    warning: "text-warning bg-warning/15",
  };
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className={`rounded-md p-2 ${colors[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <strong className="mt-2 block font-display text-2xl">{value}</strong>
      <p className={`mt-3 text-[9px] ${tone === "danger" ? "text-danger" : "text-muted-foreground"}`}>{note}</p>
    </div>
  );
}

function Distribution({ data }) {
  const summary = data ?? { total_tanks: 0, distribution: [] };
  const distribution = Array.isArray(summary.distribution) ? summary.distribution : [];
  const circumference = 264;
  const segments = distribution.map((item, index) => {
    const length = summary.total_tanks
      ? (item.value / summary.total_tanks) * circumference
      : 0;
    const offset = distribution.slice(0, index).reduce((sum, previous) => (
      summary.total_tanks
        ? sum + (previous.value / summary.total_tanks) * circumference
        : sum
    ), 0);
    const segment = (
      <circle
        key={item.label}
        cx="60"
        cy="60"
        r="42"
        fill="none"
        stroke="currentColor"
        strokeWidth="16"
        strokeDasharray={`${length} ${circumference - length}`}
        strokeDashoffset={-offset}
        className={item.color}
      />
    );
    return segment;
  });

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="font-display text-sm font-semibold">Community Tank Status</h2>
      <p className="mt-1 text-[10px] text-muted-foreground">Distribution by current fill status</p>
      <div className="mt-5 grid items-center gap-6 sm:grid-cols-[150px_1fr]">
        <div className="relative mx-auto h-36 w-36">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" strokeWidth="16" className="text-muted" />
            {segments}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <b className="font-display text-2xl">{summary.total_tanks}</b>
            <span className="text-[8px] text-muted-foreground">TOTAL TANKS</span>
          </div>
        </div>
        <div className="space-y-2">
          {distribution.map((x) => (
            <div key={x.label} className="flex items-center rounded-md bg-muted/60 px-3 py-3 text-[11px]">
              <i className={`mr-2 h-2.5 w-2.5 rounded-full bg-current ${x.color}`} />
              <span className="flex-1">{x.label}</span>
              <b>{x.value}</b>
              <span className="ml-2 text-muted-foreground">{x.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CriticalAlerts({ data, onView }) {
  const alerts = data?.alerts ?? [];
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-sm font-semibold">Critical Alerts</h2>
          <p className="mt-1 text-[10px] text-muted-foreground">Tanks requiring immediate action</p>
        </div>
        <span className="rounded-full bg-danger/15 px-2 py-1 text-[8px] text-danger">
          {alerts.length} ACTIVE
        </span>
      </div>
      <div className="mt-4 space-y-2">
        {alerts.length === 0 ? (
          <p className="rounded-md bg-muted/50 p-4 text-xs text-muted-foreground">No critical tanks with recent readings.</p>
        ) : alerts.map((a) => (
          <div
            key={a.id}
            className={`flex items-center border-l-2 ${a.critical ? "border-danger" : "border-warning"} rounded-md bg-muted/50 p-3`}
          >
            <div className="flex-1">
              <b className="text-xs">{a.id}</b>
              <p className="mt-1 text-[9px] text-muted-foreground">{a.address}</p>
            </div>
            <strong className={`mr-4 text-sm ${a.critical ? "text-danger" : "text-warning"}`}>{a.level}%</strong>
            <button onClick={() => onView(a)} className="rounded-md bg-primary px-3 py-2 text-[10px] text-primary-foreground">
              View
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function LevelBar({ value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <i className={`block h-full ${value >= 80 ? "bg-danger" : "bg-warning"}`} style={{ width: `${value}%` }} />
      </span>
      <b className={value >= 80 ? "text-danger" : "text-warning"}>{value}%</b>
    </div>
  );
}
