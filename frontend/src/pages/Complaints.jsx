import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, Bell, Bot, Copy, FileWarning, Filter, Home, Lightbulb,
  LogOut, Menu, Plus, Search, Settings, ShieldCheck, TriangleAlert,
  Trash2, UserRound, Volume2, Waves, Wrench, ChevronLeft, ChevronRight,
  Clock, Sparkles, CircleCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

/* ==================================================================
   SeptiGuard — My Complaints (Resident)
   ------------------------------------------------------------------
   IMPORTANT — aligned to the actual `complaints` table enum:

     category:  septic_tank | garbage | street_lights |
                road_damage | noise | water_supply | other
     status:    pending | in_progress | resolved

   Tinanggal ko yung "replies" thread UI kasi wala pang
   complaint_replies table sa DB — hoa_response mo ngayon
   ay iisang text field lang. Kung gusto mong may threaded
   replies talaga, sabihin mo lang, gagawa tayo ng migration
   para dun.
================================================================== */

const CATEGORY_META = {
  septic_tank:   { label: "Septic Tank",   icon: Waves,        tone: "bg-primary/15 text-primary" },
  garbage:       { label: "Garbage",       icon: Trash2,       tone: "bg-success/15 text-success" },
  street_lights: { label: "Street Lights", icon: Lightbulb,    tone: "bg-warning/15 text-warning" },
  road_damage:   { label: "Road Damage",   icon: TriangleAlert,tone: "bg-danger/15 text-danger" },
  noise:         { label: "Noise",         icon: Volume2,      tone: "bg-danger/15 text-danger" },
  water_supply:  { label: "Water Supply",  icon: Waves,        tone: "bg-primary/15 text-primary" },
  other:         { label: "Other",         icon: FileWarning,  tone: "bg-muted text-muted-foreground" },
};

const STATUS_META = {
  pending:     { label: "Pending",     chip: "border-warning/30 bg-warning/10 text-warning", icon: Clock },
  in_progress: { label: "In Progress", chip: "border-primary/30 bg-primary/10 text-primary", icon: Sparkles },
  resolved:    { label: "Resolved",    chip: "border-success/30 bg-success/10 text-success", icon: CircleCheck },
};

/* ======================= SAMPLE DATA (temporary) =======================
   Palitan mo na lang ng axios.get("/api/complaints") kapag ready na
   ang endpoint — same shape ng response ang inaasahan dito.          */
const SAMPLE_COMPLAINTS = [
  {
    ticket_code: "CMP-0142",
    category: "noise",
    title: "Loud music from neighbor past midnight",
    description: "Repeated late-night parties with amplified music disturbing the surrounding units. Issue persists on weekends.",
    status: "pending",
    filed_at: "May 11, 2026",
    location: "Blk 12, Lot 4",
    assigned_to: null,
  },
  {
    ticket_code: "CMP-0138",
    category: "road_damage",
    title: "Pothole near clubhouse entrance",
    description: "Deep pothole forming near the clubhouse gate, becoming a hazard for vehicles and pedestrians at night.",
    status: "in_progress",
    filed_at: "May 9, 2026",
    location: "Near clubhouse",
    assigned_to: "Officer Mark R.",
  },
  {
    ticket_code: "CMP-0131",
    category: "garbage",
    title: "Missed garbage collection on Tuesday route",
    description: "Trash bins not picked up along Phase 2 streets. Service team rescheduled collection and resumed normal route.",
    status: "resolved",
    filed_at: "Mar 2, 2026",
    resolved_at: "Mar 5, 2026",
    location: "Phase 2",
    assigned_to: null,
  },
  {
    ticket_code: "CMP-0127",
    category: "septic_tank",
    title: "Foul odor near tank — urgent",
    description: "Strong sewage smell coming from the back of the property since yesterday evening. Tank reading shows elevated fill level.",
    status: "pending",
    filed_at: "Apr 28, 2026",
    location: "Blk 12, Lot 4",
    assigned_to: null,
  },
  {
    ticket_code: "CMP-0119",
    category: "street_lights",
    title: "Broken street light on Maple Ln",
    description: "Street light has been flickering and finally went out. Area is very dark at night, safety concern for residents.",
    status: "resolved",
    filed_at: "Feb 18, 2026",
    resolved_at: "Feb 22, 2026",
    location: "Maple Ln",
    assigned_to: null,
  },
];

const NAV = [
  { icon: Home,        label: "Dashboard", path: "/dashboard" },
  { icon: Activity,    label: "Monitor", path: "/monitor" },
  { icon: Bot,         label: "Predict", path: "/predict" },
  { icon: FileWarning, label: "Complaints", path: "/complaints", active: true },
  { icon: Wrench,      label: "Maintain", path: "/maintain" },
  { icon: Bell,        label: "Alerts", path: "/alerts" },
  { icon: UserRound,   label: "Profile" },
];

const PAGE_SIZE = 5;

export default function Complaints() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [complaints] = useState(SAMPLE_COMPLAINTS);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const first = user?.name?.split(" ")[0] ?? "Resident";
  const soon = (name) => window.alert(`${name} will be connected in the next step.`);
  const signOut = async () => { await logout(); navigate("/"); };

  /* ---------- API CALL — i-uncomment kapag ready na ang backend ----------
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get("http://localhost:8000/api/complaints", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => setComplaints(res.data))
    .catch(err => console.error(err));
  }, []);
  ---------------------------------------------------------------------- */

  const counts = useMemo(() => ({
    all: complaints.length,
    pending: complaints.filter((c) => c.status === "pending").length,
    in_progress: complaints.filter((c) => c.status === "in_progress").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
  }), [complaints]);

  const filtered = useMemo(() => {
    return complaints
      .filter((c) => tab === "all" || c.status === tab)
      .filter((c) =>
        query.trim() === "" ||
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.ticket_code.toLowerCase().includes(query.toLowerCase())
      );
  }, [complaints, tab, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const changeTab = (key) => { setTab(key); setPage(1); };

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
              <p className="text-xs text-muted-foreground">Resident Portal › My Complaints</p>
              <h1 className="mt-1 font-display text-xl font-bold">My Complaints</h1>
            </div>
          </div>
          <button
            onClick={() => navigate("/complaints/new")}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            New Complaint
          </button>
        </header>

        <main className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-7">
          <p className="text-xs text-muted-foreground">
            Track and manage your submitted concerns to the HOA
          </p>

          {/* ---------------- KPI CARDS ---------------- */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard icon={Copy}         label="Total"       value={counts.all}         valueClass="" />
            <KpiCard icon={Clock}        label="Pending"     value={counts.pending}     valueClass="text-warning" />
            <KpiCard icon={Sparkles}     label="In Progress" value={counts.in_progress} valueClass="text-primary" />
            <KpiCard icon={CircleCheck}  label="Resolved"    value={counts.resolved}    valueClass="text-success" />
          </div>

          {/* ---------------- FILTER BAR ---------------- */}
          <section className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <TabButton active={tab === "all"} onClick={() => changeTab("all")}>
                  All <Badge>{counts.all}</Badge>
                </TabButton>
                <TabButton active={tab === "pending"} onClick={() => changeTab("pending")}>
                  Pending <Badge>{counts.pending}</Badge>
                </TabButton>
                <TabButton active={tab === "in_progress"} onClick={() => changeTab("in_progress")}>
                  In Progress <Badge>{counts.in_progress}</Badge>
                </TabButton>
                <TabButton active={tab === "resolved"} onClick={() => changeTab("resolved")}>
                  Resolved <Badge>{counts.resolved}</Badge>
                </TabButton>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                    placeholder="Search complaints..."
                    className="w-40 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground sm:w-52"
                  />
                </div>
                <button
                  onClick={() => soon("Filter")}
                  className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
                >
                  <Filter className="h-3.5 w-3.5" />
                  Filter
                </button>
              </div>
            </div>
          </section>

          {/* ---------------- COMPLAINT LIST ---------------- */}
          <div className="space-y-3">
            {paged.length === 0 && (
              <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                No complaints found.
              </div>
            )}

            {paged.map((c) => {
              const cat = CATEGORY_META[c.category] ?? CATEGORY_META.other;
              const stat = STATUS_META[c.status];
              return (
                <button
                  key={c.ticket_code}
                  onClick={() => soon(`Complaint ${c.ticket_code} detail`)}
                  className="flex w-full items-start gap-4 rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary/30 sm:p-5"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${cat.tone}`}>
                    <cat.icon className="h-4.5 w-4.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-mono">#{c.ticket_code}</span>
                      <span>·</span>
                      <span>{cat.label}</span>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold">{c.title}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{c.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                      <span>{c.filed_at}</span>
                      {c.location && <span>· {c.location}</span>}
                      {c.assigned_to && <span>· {c.assigned_to}</span>}
                      {c.resolved_at && <span>· Closed {c.resolved_at}</span>}
                    </div>
                  </div>

                  <span className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${stat.chip}`}>
                    <stat.icon className="h-3 w-3" />
                    {stat.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ---------------- PAGINATION ---------------- */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              Showing {paged.length} of {filtered.length} complaint{filtered.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-md border border-border bg-muted/40 px-3 py-1.5 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 rounded-md border border-border bg-muted/40 px-3 py-1.5 disabled:opacity-40"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, valueClass }) {
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
