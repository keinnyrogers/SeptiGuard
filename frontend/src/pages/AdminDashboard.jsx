import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, Boxes, ChevronRight, CircleAlert, ClipboardList, Cpu,
  FileText, Gauge, LogOut, MapPin, Menu, MessageSquare, Settings, ShieldCheck,
  Users, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const SAMPLE_ADMIN_DATA = {
  totalTanks: 48,
  averageFill: 54,
  criticalTanks: 3,
  openComplaints: 7,
  distribution: [
    { label: "Normal", value: 34, percent: 71, color: "text-success" },
    { label: "Warning", value: 11, percent: 23, color: "text-warning" },
    { label: "Critical", value: 3, percent: 6, color: "text-danger" },
  ],
  alerts: [
    { id: "TNK-042", address: "Blk 12 Lot 4, Broadway", level: 96, critical: true },
    { id: "TNK-018", address: "Blk 7 Lot 22, Broadway", level: 92, critical: true },
    { id: "TNK-031", address: "Blk 4 Lot 9, Broadway", level: 87, critical: true },
  ],
  tanks: [
    { id: "TNK-042", resident: "Christofe O.", address: "Blk 12 Lot 4, Broadway", level: 96, date: "Mar 14, 2026", action: "Dispatch" },
    { id: "TNK-018", resident: "Kein T.", address: "Blk 7 Lot 22, Broadway", level: 92, date: "Mar 17, 2026", action: "Dispatch" },
    { id: "TNK-031", resident: "Niel P.", address: "Blk 4 Lot 9, Broadway", level: 87, date: "Mar 21, 2026", action: "Schedule" },
    { id: "TNK-024", resident: "Jessa A.", address: "Blk 9 Lot 12, Broadway", level: 78, date: "Mar 26, 2026", action: "Schedule" },
    { id: "TNK-007", resident: "Jhanna P.", address: "Blk 2 Lot 5, Broadway", level: 72, date: "Apr 02, 2026", action: "Schedule" },
  ],
};

const NAV = [
  { icon: Gauge, label: "Dashboard", active: true }, { icon: Boxes, label: "Tanks", to: "/admin/tanks" },
  { icon: MessageSquare, label: "Complaints", to: "/admin/complaints" }, { icon: Users, label: "Residents" },
  { icon: FileText, label: "Reports" }, { icon: Cpu, label: "Devices" }, { icon: Settings, label: "Settings" },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "SeptiGuard — Admin Portal";

    return () => {
      document.title = previousTitle;
    };
  }, []);
  const soon = (name) => window.alert(`${name} will be connected in the next step.`);
  const signOut = async () => { await logout(); navigate("/"); };

  return <div className="min-h-screen bg-background text-foreground lg:flex">
    <aside className={`${open ? "flex" : "hidden"} fixed inset-y-0 left-0 z-40 w-52 flex-col border-r border-border bg-card px-3 py-5 lg:flex`}>
      <div className="mb-5 flex items-center justify-between px-1"><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15"><ShieldCheck className="h-5 w-5 text-primary"/></span><strong className="font-display text-sm">SeptiGuard</strong></div><button className="lg:hidden" onClick={()=>setOpen(false)} aria-label="Close menu"><X className="h-4 w-4"/></button></div>
      <nav className="flex flex-1 flex-col gap-1">{NAV.map(item=><button key={item.label} onClick={()=>item.to?navigate(item.to):item.active?setOpen(false):soon(item.label)} className={`flex h-10 items-center gap-3 rounded-md px-3 text-xs font-medium ${item.active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><item.icon className="h-4 w-4"/>{item.label}</button>)}</nav>
      <div className="flex items-center gap-2 border-t border-border pt-4"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">AU</span><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-medium">{user?.name || "Admin User"}</p><p className="text-[9px] text-muted-foreground">HOA Officer</p></div><button onClick={signOut} title="Sign out" className="p-2 text-muted-foreground hover:text-danger"><LogOut className="h-4 w-4"/></button></div>
    </aside>
    {open&&<button className="fixed inset-0 z-30 bg-background/80 lg:hidden" onClick={()=>setOpen(false)} aria-label="Close menu"/>}
    <div className="page-transition min-w-0 flex-1 lg:ml-52">
      <header className="flex h-20 items-center justify-between border-b border-border px-4 sm:px-7"><div className="flex items-center gap-3"><button className="rounded-md border border-border p-2 lg:hidden" onClick={()=>setOpen(true)} aria-label="Open menu"><Menu className="h-4 w-4"/></button><div><p className="text-[10px] text-muted-foreground">Admin Portal <span className="px-1">›</span> Dashboard</p><h1 className="mt-1 font-display text-xl font-bold">Dashboard</h1></div></div><div className="flex items-center gap-2"><span className="hidden items-center gap-2 rounded-full bg-muted px-3 py-2 text-[10px] sm:flex"><i className="h-2 w-2 rounded-full bg-success"/>All Systems Online</span><button onClick={()=>soon("Notifications")} className="relative rounded-full bg-muted p-2" aria-label="Notifications"><Bell className="h-4 w-4"/><b className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[8px]">5</b></button><button onClick={()=>soon("Settings")} className="rounded-full bg-muted p-2" aria-label="Settings"><Settings className="h-4 w-4"/></button></div></header>
      <main className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-7">
        <section className="flex flex-col justify-between gap-4 rounded-lg border border-primary/20 bg-primary/25 p-5 sm:flex-row sm:items-center"><div><div className="mb-2 flex items-center gap-2 text-[10px] text-primary"><span className="rounded border border-primary/40 px-2 py-0.5 font-semibold uppercase">Sample data</span><span>Wednesday, March 12</span></div><h2 className="font-display text-lg font-bold">Broadway Hagdan Loob HOA — Admin Overview</h2><p className="mt-1 text-xs text-foreground/75">Community septic monitoring at a glance.</p></div><div className="flex items-center gap-3 rounded-md bg-background/40 px-4 py-3"><MapPin className="h-4 w-4 text-primary"/><div><p className="text-[8px] uppercase text-muted-foreground">Location</p><p className="text-[10px]">Sitio Broadway, Antipolo</p></div></div></section>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat icon={Boxes} label="Total Tanks" value="48" note="Active sensors deployed" tone="primary"/><Stat icon={CircleAlert} label="Critical Tanks" value="3" note="Requires attention" tone="danger"/><Stat icon={ClipboardList} label="Open Complaints" value="7" note="Pending resolution" tone="warning"/><Stat icon={Gauge} label="Avg. Fill Level" value="54%" note="Community average" tone="success"/></div>
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]"><Distribution/><CriticalAlerts onAction={soon}/></div>
        <section className="rounded-lg border border-border bg-card p-5"><div className="flex items-start justify-between"><div><h2 className="font-display text-sm font-semibold">Priority Tanks</h2><p className="mt-1 text-[10px] text-muted-foreground">High-priority tank monitoring</p></div><button onClick={()=>soon("All tanks")} className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-[10px]">View All <ChevronRight className="h-3 w-3"/></button></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead className="border-b border-border text-[9px] uppercase text-muted-foreground"><tr><th className="px-3 py-3">Tank ID</th><th>Resident</th><th>Address</th><th>Fill Level</th><th>Last Update</th><th className="text-right">Action</th></tr></thead><tbody>{SAMPLE_ADMIN_DATA.tanks.map(t=><tr key={t.id} className="border-b border-border/70 text-[11px] last:border-0"><td className="px-3 py-4 font-medium">{t.id}</td><td>{t.resident}</td><td className="text-muted-foreground">{t.address}</td><td><LevelBar value={t.level}/></td><td>{t.date}</td><td className="text-right"><button onClick={()=>soon(`${t.action} ${t.id}`)} className="rounded-md bg-primary px-4 py-2 text-[10px] font-medium text-primary-foreground">{t.action}</button></td></tr>)}</tbody></table></div></section>
      </main>
    </div>
  </div>;
}

function Stat({icon:Icon,label,value,note,tone}) { const colors={primary:"text-primary bg-primary/15",success:"text-success bg-success/15",danger:"text-danger bg-danger/15",warning:"text-warning bg-warning/15"}; return <div className="rounded-lg border border-border bg-card p-4"><div className="flex items-center justify-between"><span className="text-[10px] text-muted-foreground">{label}</span><span className={`rounded-md p-2 ${colors[tone]}`}><Icon className="h-4 w-4"/></span></div><strong className="mt-2 block font-display text-2xl">{value}</strong><p className={`mt-3 text-[9px] ${tone==="danger"?"text-danger":"text-muted-foreground"}`}>{note}</p></div> }
function Distribution(){return <section className="rounded-lg border border-border bg-card p-5"><h2 className="font-display text-sm font-semibold">Community Tank Status</h2><p className="mt-1 text-[10px] text-muted-foreground">Distribution by current fill status</p><div className="mt-5 grid items-center gap-6 sm:grid-cols-[150px_1fr]"><div className="relative mx-auto h-36 w-36"><svg viewBox="0 0 120 120" className="h-full w-full -rotate-90"><circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" strokeWidth="16" className="text-muted"/><circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" strokeWidth="16" strokeDasharray="187 264" className="text-success"/><circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" strokeWidth="16" strokeDasharray="61 264" strokeDashoffset="-187" className="text-warning"/><circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" strokeWidth="16" strokeDasharray="16 264" strokeDashoffset="-248" className="text-danger"/></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><b className="font-display text-2xl">48</b><span className="text-[8px] text-muted-foreground">TOTAL TANKS</span></div></div><div className="space-y-2">{SAMPLE_ADMIN_DATA.distribution.map(x=><div key={x.label} className="flex items-center rounded-md bg-muted/60 px-3 py-3 text-[11px]"><i className={`mr-2 h-2.5 w-2.5 rounded-full bg-current ${x.color}`}/><span className="flex-1">{x.label}</span><b>{x.value}</b><span className="ml-2 text-muted-foreground">{x.percent}%</span></div>)}</div></div></section>}
function CriticalAlerts({onAction}){return <section className="rounded-lg border border-border bg-card p-5"><div className="flex items-center justify-between"><div><h2 className="font-display text-sm font-semibold">Critical Alerts</h2><p className="mt-1 text-[10px] text-muted-foreground">Tanks requiring immediate action</p></div><span className="rounded-full bg-danger/15 px-2 py-1 text-[8px] text-danger">3 ACTIVE</span></div><div className="mt-4 space-y-2">{SAMPLE_ADMIN_DATA.alerts.map(a=><div key={a.id} className={`flex items-center border-l-2 ${a.critical?"border-danger":"border-warning"} rounded-md bg-muted/50 p-3`}><div className="flex-1"><b className="text-xs">{a.id}</b><p className="mt-1 text-[9px] text-muted-foreground">{a.address}</p></div><strong className={`mr-4 text-sm ${a.critical?"text-danger":"text-warning"}`}>{a.level}%</strong><button onClick={()=>onAction(`Tank ${a.id}`)} className="rounded-md bg-primary px-3 py-2 text-[10px] text-primary-foreground">View</button></div>)}</div></section>}
function LevelBar({value}){return <div className="flex items-center gap-2"><span className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"><i className={`block h-full ${value>=80?"bg-danger":"bg-warning"}`} style={{width:`${value}%`}}/></span><b className={value>=80?"text-danger":"text-warning"}>{value}%</b></div>}