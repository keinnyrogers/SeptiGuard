import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, ArrowRight, Bell, Bot, CalendarDays, FileWarning,
  Home, LogOut, Menu, ShieldCheck, UserRound, Wrench,
  CheckCircle2, Clock, Hourglass,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

/* ==================================================================
   SeptiGuard — Maintain (Resident)
   ------------------------------------------------------------------
   Sinadya kong hindi ginawang marketplace/booking page ito
   (tulad ng sa Figma na may service provider comparison).
   Bakit:

     1. Walang service_providers / reviews / bookings table
        sa ERD at data dictionary mo.
     2. Sa flowchart mo (Section 2.1), ang HOA Admin ang
        nagde-dispatch ng maintenance team — hindi si resident
        ang namimili sa marketplace ng ibang companies.
     3. Malaking additional scope na hindi mo kayang i-populate
        ng totoong provider data bago ang defense.

   Ito na lang: history ng maintenance ng SARILING tank
   (galing sa septic_systems.last_maintenance_date + isang
   simpleng maintenance log kung gagawa ka ng table para dun),
   at isang "Request Maintenance" button na nag-fa-file ng
   complaint sa ilalim ng category na "septic_tank" — reuse
   lang ng existing complaints system mo, walang bagong table
   na kailangan.

   Kung gusto mo talaga ng listahan ng nakaraang services
   (hindi lang yung pinaka-huli), kailangan mo ng bagong
   `maintenance_logs` table (tank_id, service_date, cost,
   performed_by, notes). Naka-flag na sa ibaba kung saan
   ilalagay yun.
================================================================== */

const NAV = [
  { icon: Home,        label: "Dashboard", path: "/dashboard" },
  { icon: Activity,    label: "Monitor", path: "/monitor" },
  { icon: Bot,         label: "Predict", path: "/predict" },
  { icon: FileWarning, label: "Complaints", path: "/complaints" },
  { icon: Wrench,      label: "Maintain", path: "/maintain", active: true },
  { icon: Bell,        label: "Alerts", path: "/alerts" },
  { icon: UserRound,   label: "Profile", path: "/profile" },
];

/* ======================= SAMPLE DATA (temporary) =======================
   installationDate / lastMaintenance -> septic_systems table
   nextDueEstimate                    -> derived from predictions table
                                          (predicted_full_date, o kaya
                                          simpleng "+90 days from last
                                          maintenance" bilang fallback)
   history                            -> KUNG gagawa ka ng maintenance_logs
                                          table. Kung ayaw mo munang gumawa
                                          ng bagong table, pwede mo ring
                                          tanggalin ang buong history
                                          section at last_maintenance_date
                                          na lang ang ipakita.               */
const SAMPLE_DATA = {
  installationDate: "Jan 2023",
  lastMaintenance: "Jan 8, 2026",
  daysSinceLast: 63,
  nextDueEstimate: "June 22, 2026",
  daysUntilDue: 10,
  history: [
    { date: "Jan 8, 2026",  type: "Full pump-out",     status: "completed", notes: "Routine desludging, no issues found." },
    { date: "Sep 14, 2025", type: "Inspection",         status: "completed", notes: "Annual system inspection, baffles intact." },
    { date: "Mar 2, 2025",  type: "Full pump-out",      status: "completed", notes: "Scheduled maintenance following HOA advisory." },
  ],
};

export default function Maintain() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [data] = useState(SAMPLE_DATA);
  const [requesting, setRequesting] = useState(false);

  const first = user?.name?.split(" ")[0] ?? "Resident";
  const soon = (name) => window.alert(`${name} will be connected in the next step.`);
  const signOut = async () => { await logout(); navigate("/"); };

  /* ---------- API CALL — i-uncomment kapag ready na ang backend ----------
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get("http://localhost:8000/api/septic-system/maintenance", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => setData(res.data))
    .catch(err => console.error(err));
  }, []);
  ---------------------------------------------------------------------- */

  const requestMaintenance = () => {
    setRequesting(true);
    /* ---------- Reuses the existing complaints endpoint ----------
    Ito ang pinaka-simpleng paraan: mag-file lang ng complaint
    na category = "septic_tank", priority = "medium", tapos
    ang subject/description ay auto-filled na "Maintenance /
    desludging request". Ang HOA admin ang bahalang mag-review
    at mag-dispatch — tugma sa flow ng paper mo.

    axios.post("http://localhost:8000/api/complaints", {
      category: "septic_tank",
      priority: "medium",
      title: "Maintenance / desludging request",
      description: "Resident is requesting scheduled maintenance for their septic tank.",
    }, { headers: { Authorization: `Bearer ${token}` } });
    ---------------------------------------------------------------- */
    setTimeout(() => {
      setRequesting(false);
      window.alert("Maintenance request sent to HOA! (sample — not yet connected to backend)");
    }, 700);
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
                if (x.active) setOpen(false);
                else if (x.path) navigate(x.path);
                else soon(x.label);
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
              <p className="text-xs text-muted-foreground">Resident Portal › Maintenance</p>
              <h1 className="mt-1 font-display text-xl font-bold">Maintenance History</h1>
            </div>
          </div>
          <button
            onClick={requestMaintenance}
            disabled={requesting}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            <Wrench className="h-4 w-4" />
            {requesting ? "Sending..." : "Request Maintenance"}
          </button>
        </header>

        <main className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-7">
          <p className="text-xs text-muted-foreground">
            Service log and upcoming maintenance for your septic tank
          </p>

          {/* ---------------- SUMMARY CARDS ---------------- */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard icon={Wrench}      label="Total Services" value={data.history.length}      note={`Since ${data.installationDate}`} />
            <SummaryCard icon={Clock}       label="Last Service"   value={data.lastMaintenance}      note={`${data.daysSinceLast} days ago`} />
            <SummaryCard icon={Hourglass}   label="Next Due"       value={data.nextDueEstimate}      note={`In ${data.daysUntilDue} days`} valueClass="text-primary" />
            <SummaryCard icon={CalendarDays} label="Installed"     value={data.installationDate}     note="Tank installation date" />
          </div>

          {/* ---------------- REQUEST NOTE ---------------- */}
          <section className="flex items-start gap-3 rounded-lg border border-primary/25 bg-primary/5 p-4">
            <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">
              Need a pump-out or inspection? Tapping{" "}
              <span className="font-medium text-foreground">Request Maintenance</span>{" "}
              sends a request directly to your HOA administrator, who will coordinate
              scheduling with an accredited service provider on your behalf.
            </p>
          </section>

          {/* ---------------- HISTORY LIST ---------------- */}
          <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <h2 className="font-display font-semibold">Service History</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Past maintenance and inspection records for your tank
            </p>

            <div className="mt-4 space-y-2">
              {data.history.length === 0 && (
                <p className="rounded-md border border-border bg-muted/30 p-6 text-center text-xs text-muted-foreground">
                  No maintenance records yet.
                </p>
              )}
              {data.history.map((h, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{h.type}</p>
                      <span className="text-[11px] text-muted-foreground">{h.date}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{h.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, note, valueClass = "" }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="truncate text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <p className={`mt-3 truncate font-display text-lg font-bold ${valueClass}`}>{value}</p>
      <p className="mt-2 text-[9px] text-muted-foreground">{note}</p>
    </div>
  );
}
