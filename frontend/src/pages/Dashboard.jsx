import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Activity, ArrowRight, Bell, Bot, CalendarDays, CircleAlert, CircleGauge, Droplets, Eye, FileWarning, Home, LogOut, MapPin, Menu, RefreshCw, ShieldCheck, TriangleAlert, UserRound, Wrench } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { BrandMark } from "@/components/BrandLogo";
import NotificationPopover from "../components/NotificationPopover.jsx";
import PairDeviceModal from "../components/PairDeviceModal.jsx";
import ResidentEmptyPage from "../components/ResidentEmptyPage.jsx";
import ResidentAvatar from "../components/ResidentAvatar.jsx";
import { formatResidentAddress } from "@/lib/addresses";
import { fetchResidentNotifications, fetchResidentTankLatest } from "../api.js";
import { subscribeToTank } from "../realtime.js";

function createSampleData() {
  const lastPumped = new Date();
  lastPumped.setMonth(lastPumped.getMonth() - 8);

  return {
    hasSensor: true,
    online: false,
    level: 70,
    weeklyChange: "+5% this week",
    daysUntilFull: 12,
    lastPumped: new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(lastPumped),
    lastPumpedAgo: "8 months ago",
    location: "Blk 12, Lot 4 · Broadway Hagdan",
    alerts: [
      { title: "Tank fill level reached 70%", detail: "Plan maintenance based on the current sample reading.", tag: "Warning", tone: "warning", time: "Demo sample", icon: TriangleAlert },
    ],
  };
}

const SAMPLE_DATA = createSampleData();
const EMPTY_DATA = { hasSensor: false, online: false, level: null, weeklyChange: null, daysUntilFull: null, lastPumped: null, lastPumpedAgo: null, location: null, alerts: [] };

// Single source of truth for tank status thresholds.
export function statusOf(level) {
  if (level >= 80) return "critical";
  if (level >= 70) return "warning";
  return "normal";
}
const STATUS_META = {
  normal: { label: "Normal", text: "text-success", badge: "border-success/30 bg-success/10 text-success", dot: "bg-success" },
  warning: { label: "Warning", text: "text-warning", badge: "border-warning/30 bg-warning/10 text-warning", dot: "bg-warning" },
  critical: { label: "Critical", text: "text-danger", badge: "border-danger/30 bg-danger/10 text-danger", dot: "bg-danger" },
};

const NAV = [{icon:Home,label:"Dashboard",active:true},{icon:Activity,label:"Monitor",to:"/monitor"},{icon:Bot,label:"Predict",to:"/predict"},{icon:FileWarning,label:"Complaints",to:"/complaints"},{icon:Wrench,label:"Maintenance",to:"/maintain"},{icon:Bell,label:"Notifications",to:"/alerts"},{icon:UserRound,label:"Profile",to:"/profile"}];

export default function Dashboard() {
  const { user, token, logout } = useAuth(); const navigate = useNavigate(); const [open,setOpen]=useState(false); const [pairModalOpen, setPairModalOpen] = useState(false); const [liveData, setLiveData] = useState(null); const [refreshKey, setRefreshKey] = useState(0); const [alertsRefreshKey, setAlertsRefreshKey] = useState(0); const [recentAlerts, setRecentAlerts] = useState([]); const [alertsLoading, setAlertsLoading] = useState(!user?.demo_mode && Boolean(token)); const [alertsError, setAlertsError] = useState(""); const [isRefreshing, setIsRefreshing] = useState(false); const [loading, setLoading] = useState(!user?.demo_mode); const [loadError, setLoadError] = useState(""); const first=user?.name?.split(" ")[0] ?? "Resident";
  useEffect(() => {
    if (!user || user.demo_mode || !token) return undefined;
    let active = true;
    const load = () => {
      setIsRefreshing(true);
      return fetchResidentTankLatest(token).then((result) => {
      if (!active) return;
      const reading = result?.reading;
      setLiveData({
        deviceId: result?.device_id ?? null,
        hasSensor: result?.has_sensor === true,
        online: Boolean(
          reading?.measured_at
          && new Date(reading.measured_at).getTime() >= Date.now() - 15 * 60 * 1000,
        ),
        level: reading?.fill_level_percentage == null ? null : Number(reading.fill_level_percentage),
        weeklyChange: null,
        daysUntilFull: null,
        lastPumped: null,
        lastPumpedAgo: null,
        location: result?.location ?? null,
        alerts: [],
      });
      setLoadError("");
      }).catch(() => {
        if (active) {
          setLiveData(EMPTY_DATA);
          setLoadError("Could not load tank data. Please try refreshing.");
        }
      }).finally(() => {
        if (active) {
          setIsRefreshing(false);
          setLoading(false);
        }
      });
    };
    load();
    const interval = window.setInterval(load, 15000);
    return () => { active = false; window.clearInterval(interval); };
  }, [token, user, refreshKey]);

  useEffect(() => {
    if (user?.demo_mode || !liveData?.deviceId) return undefined;

    return subscribeToTank(liveData.deviceId, (reading) => {
      const level = Number(reading.fill_level_percentage);
      setLiveData((current) => ({
        ...current,
        hasSensor: true,
        online: true,
        level,
      }));
    });
  }, [liveData?.deviceId, user?.demo_mode]);
  useEffect(() => {
    if (user?.demo_mode || !token) return undefined;
    let active = true;
    const load = () => fetchResidentNotifications(token).then((items) => {
      if (!active) return;
      setRecentAlerts(items.slice(0, 5).map((item) => {
        const meta = item.type === "critical_alert"
          ? { tag: "Alert", tone: "danger", icon: CircleAlert }
          : item.type === "warning_alert"
            ? { tag: "Warning", tone: "warning", icon: TriangleAlert }
            : item.type === "ticket_update"
              ? { tag: "Update", tone: "success", icon: Bell }
              : { tag: "Info", tone: "primary", icon: Bell };
        const createdAt = new Date(item.created_at);
        return {
          id: item.id,
          title: item.title,
          detail: item.message,
          ...meta,
          time: Number.isNaN(createdAt.getTime())
            ? "Recently"
            : formatDistanceToNow(createdAt, { addSuffix: true }),
        };
      }));
      setAlertsError("");
    }).catch((error) => {
      if (active) setAlertsError(error.message);
    }).finally(() => {
      if (active) setAlertsLoading(false);
    });
    load();
    const interval = window.setInterval(load, 30000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [token, user?.demo_mode, alertsRefreshKey]);
  const data = user?.demo_mode ? SAMPLE_DATA : (liveData ?? EMPTY_DATA);
  const alerts = user?.demo_mode ? SAMPLE_DATA.alerts : recentAlerts;
  const level = data?.hasSensor && typeof data.level === "number" ? Math.max(0, Math.min(100, data.level)) : null;
  const status = level === null ? null : statusOf(level);
  const meta = status ? STATUS_META[status] : null;
  const days = typeof data?.daysUntilFull === "number" ? data.daysUntilFull : null;
  const hasLastPumped = Boolean(data?.lastPumped);
  const signOut=async()=>{if(await logout()) navigate("/");};
  const retryTankLoad = () => {
    setLoadError("");
    setLoading(true);
    setRefreshKey((key) => key + 1);
  };
  if (loadError && !user?.demo_mode) {
    return (
      <ResidentEmptyPage
        active="Dashboard"
        title="Dashboard"
        emptyTitle="Could not load tank data"
        description={loadError}
        actionLabel="Retry"
        onAction={retryTankLoad}
      />
    );
  }

  return <div className="min-h-screen bg-background text-foreground lg:flex">
    <aside className={`${open?"flex":"hidden"} fixed inset-y-0 left-0 z-40 w-24 flex-col border-r border-border bg-card px-2 py-5 lg:flex`}>
      <div className="mb-5 flex justify-center"><div className="flex h-11 w-11 items-center justify-center rounded-lg"><BrandMark className="h-8 w-8"/></div></div>
      <nav className="flex flex-1 flex-col gap-1">{NAV.map(x=><button key={x.label} onClick={()=>x.active?setOpen(false):navigate(x.to)} className={`relative flex h-14 flex-col items-center justify-center gap-1 rounded-md text-[10px] ${x.active?"bg-primary font-medium text-primary-foreground":"text-muted-foreground hover:bg-muted hover:text-foreground"}`}><x.icon className="h-4 w-4"/>{x.label}</button>)}</nav>
      <div className="flex flex-col items-center gap-2 border-t border-border pt-4"><ResidentAvatar /><button onClick={signOut} title="Sign out" className="p-2 text-muted-foreground hover:text-danger"><LogOut className="h-4 w-4"/></button></div>
    </aside>{open&&<button className="fixed inset-0 z-30 bg-background/80 lg:hidden" onClick={()=>setOpen(false)}/>}
    <div className="min-w-0 flex-1 lg:ml-24"><header className="flex h-20 items-center justify-between border-b border-border px-4 sm:px-7"><div className="flex items-center gap-3"><button className="rounded-md border border-border p-2 lg:hidden" onClick={()=>setOpen(true)}><Menu className="h-4 w-4"/></button><div><p className="text-xs text-muted-foreground">Resident Portal › Dashboard</p><h1 className="mt-1 font-display text-xl font-bold">Dashboard</h1></div></div><div className="flex items-center gap-2"><div className="hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground sm:flex"><span className={`h-2 w-2 ${user?.demo_mode ? "bg-primary" : data?.online ? "bg-success" : "bg-danger"} rounded-full`}/>{user?.demo_mode ? "Demo Data" : data?.online ? "Sensor Online" : data?.hasSensor ? "Sensor Offline" : "No Sensor"}</div>{!user?.demo_mode&&<button type="button" onClick={()=>setRefreshKey((key)=>key+1)} disabled={isRefreshing} aria-label="Refresh tank data" title="Refresh tank data" className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-wait disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${isRefreshing?"animate-spin":""}`}/></button>}<NotificationPopover token={token} demoMode={user?.demo_mode} onViewAll={()=>navigate("/alerts")}/></div></header>
    <main className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-7">
      <section className="flex flex-col justify-between gap-5 rounded-lg border border-primary/20 bg-primary/15 p-5 sm:flex-row sm:items-center"><div><div className="mb-2 flex items-center gap-2 text-xs text-primary">{user?.demo_mode&&<span className="rounded border border-primary/30 px-2 py-0.5 font-semibold uppercase">Demo data</span>}<span>{user?.demo_mode ? new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date()) : "Account overview"}</span></div><h2 className="font-display text-xl font-bold">Welcome back, {first}!</h2><p className="mt-1 text-sm text-muted-foreground">{data.hasSensor?"Your septic tank is being monitored. Here’s a quick overview.":"Your resident account is approved. Tank monitoring will appear after a system is linked to your household."}</p></div><div className="flex min-w-60 items-center gap-3 rounded-md border border-primary/15 bg-background/45 px-4 py-3"><MapPin className="h-5 w-5 text-primary"/><div><p className="text-[9px] uppercase text-muted-foreground">Location</p><p className="text-xs font-medium">{user?.demo_mode ? data?.location : (formatResidentAddress(data?.location ?? user?.resident_profile?.address) ?? "Not set yet")}</p></div></div></section>
      <div className="grid gap-5 xl:grid-cols-[1.55fr_0.9fr]"><section className="rounded-lg border border-border bg-card p-5 sm:p-6">
        <div className="flex justify-between gap-3"><div><h2 className="font-display font-semibold">Tank Status</h2><p className="mt-1 text-xs text-muted-foreground">Real-time fill level from IoT sensor</p></div>{meta?<span className={`h-fit rounded-full border px-3 py-1 text-xs font-semibold ${meta.badge}`}>{meta.label}</span>:<span className="h-fit rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold text-muted-foreground">{data?.hasSensor?"Awaiting reading":"No sensor"}</span>}</div>
        {loading ? <LoadingState label="Loading tank data..." /> : !data?.hasSensor ? <EmptyState icon={CircleGauge} title="No sensor linked yet" text="Your household account is awaiting sensor installation and activation by the HOA admin." actionLabel={!user?.demo_mode ? "Pair device" : undefined} onAction={!user?.demo_mode ? () => setPairModalOpen(true) : undefined}/> :
        <div className="mt-5 grid items-center gap-7 md:grid-cols-[190px_1fr]"><div className="relative mx-auto h-44 w-44"><svg viewBox="0 0 120 120" className="h-full w-full -rotate-90"><circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="9" className="text-muted"/>{meta&&<circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${level*3.14} 314`} className={`${meta.text} transition-[stroke-dasharray,stroke] duration-700 ease-out`}/>}</svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-[9px] uppercase text-muted-foreground">Fill level</span><strong className="font-display text-4xl tabular-nums">{level===null?"--":`${level}%`}</strong><span className="text-[10px] text-muted-foreground">{level===null?"awaiting first reading":"of capacity"}</span></div>
        </div>
        <div className="space-y-2"><Level status="normal" label="0–69% Normal" note="Safe" current={status}/><Level status="warning" label="70–79% Warning" note="Plan maintenance" current={status}/><Level status="critical" label="80–100% Critical" note="Action needed" current={status}/></div></div>}
      </section>
      <div className="space-y-5"><div className={`grid grid-cols-1 gap-3 ${hasLastPumped ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}><Metric icon={Droplets} label="Current level" value={level===null?"--":`${level}%`} note={data?.weeklyChange ?? "No readings yet"}/><Metric icon={CalendarDays} label="Days to critical" value={days===null?"--":String(days)} note={days===null?"Forecast unavailable":"days remaining"}/>{hasLastPumped&&<Metric icon={Wrench} label="Last pumped" value={data.lastPumped} note={data.lastPumpedAgo ?? "Maintenance record"}/>}</div><section className="rounded-lg border border-border bg-card p-5"><h2 className="font-display font-semibold">Quick Actions</h2><p className="mt-1 text-xs text-muted-foreground">Common tasks for your tank</p><div className="mt-4 space-y-2"><Action icon={Eye} label="View Detailed Report" primary onClick={()=>navigate("/monitor")}/><Action icon={FileWarning} label="File a Complaint" onClick={()=>navigate("/complaints/new")}/><Action icon={CalendarDays} label="Schedule Maintenance" onClick={()=>navigate("/maintain")}/></div></section></div></div>
      <section className="rounded-lg border border-border bg-card p-5 sm:p-6"><div className="flex items-end justify-between gap-3"><div><h2 className="font-display font-semibold">Recent Alerts</h2><p className="mt-1 text-xs text-muted-foreground">Latest notifications from your sensor network</p></div>{alerts.length>0&&<button onClick={()=>navigate("/alerts")} className="flex items-center gap-1 text-xs text-primary">View all <ArrowRight className="h-3 w-3"/></button>}</div><div className="mt-5 space-y-2">{loading || alertsLoading?<LoadingState label="Loading alerts..." />:alertsError && alerts.length===0?<EmptyState icon={Bell} title="Could not load alerts" text={alertsError} actionLabel="Retry" onAction={()=>{setAlertsLoading(true);setAlertsError("");setAlertsRefreshKey((key)=>key+1);}}/>:alerts.length===0?<EmptyState icon={data.hasSensor?Activity:ShieldCheck} title={!data.hasSensor?"No sensor linked yet":level===null?"Waiting for first reading":"All clear"} text={!data.hasSensor?"Alerts will appear after a tank sensor is linked and starts reporting.":level===null?"Alerts will appear once your sensor starts reporting.":"No recent alerts. Your tank and sensor are operating normally."} tone={level===null?"text-primary":"text-success"}/>:<>{alertsError&&<p role="alert" className="text-xs text-danger">Could not refresh alerts: {alertsError}</p>}{alerts.map(a=><Alert key={a.id ?? a.title} {...a}/>)}</>}</div></section>
    </main></div><PairDeviceModal open={pairModalOpen} onClose={() => setPairModalOpen(false)} token={token} onPaired={() => window.setTimeout(() => window.location.reload(), 500)} /></div>;
}
function Level({status,label,note,current}){const m=STATUS_META[status];const active=status===current;return <div className={`flex justify-between rounded-md border px-3 py-3 text-xs ${active?m.badge:"border-transparent bg-muted/50"}`}><span className="flex items-center gap-2 text-foreground"><span className={`h-2 w-2 rounded-full ${m.dot}`}/>{label}</span><span className={active?`font-medium ${m.text}`:"text-muted-foreground"}>{active?"Current":note}</span></div>}
function LoadingState({label}){return <div className="mt-5 flex min-h-48 flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/30 px-4 py-8 text-center"><span className="h-8 w-8 animate-spin rounded-full border-2 border-primary/25 border-t-primary" aria-hidden="true"/><p className="mt-3 text-sm text-muted-foreground">{label}</p></div>}
function EmptyState({icon:Icon,title,text,tone="text-primary",actionLabel,onAction}){return <div className="mt-5 flex flex-col items-center rounded-md border border-dashed border-border bg-muted/30 px-4 py-8 text-center"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-background/60"><Icon className={`h-5 w-5 ${tone}`}/></div><p className="mt-3 text-sm font-semibold">{title}</p><p className="mt-1 max-w-sm text-xs text-muted-foreground">{text}</p>{actionLabel&&onAction&&<button type="button" onClick={onAction} className="mt-4 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">{actionLabel}</button>}</div>}
function Metric({icon:Icon,label,value,note}){return <div className="min-w-0 rounded-lg border border-border bg-card p-4"><Icon className="h-4 w-4 text-primary"/><p className="mt-4 truncate text-[9px] uppercase text-muted-foreground">{label}</p><p className="mt-2 break-words font-display text-xl font-bold">{value}</p><p className="mt-3 break-words text-[9px] text-muted-foreground">{note}</p></div>}
function Action({icon:Icon,label,primary,onClick}){return <button onClick={onClick} className={`flex h-10 w-full items-center justify-between gap-2 rounded-md px-3 text-sm font-medium ${primary?"bg-primary text-primary-foreground":"bg-secondary text-secondary-foreground"}`}><span className="flex min-w-0 items-center gap-2 text-left"><Icon className="h-4 w-4 shrink-0"/><span className="truncate">{label}</span></span><ArrowRight className="h-4 w-4 shrink-0"/></button>}
function Alert({icon:Icon,title,detail,tag,tone,time}){const colors={warning:"border-warning/30 bg-warning/10 text-warning",danger:"border-danger/30 bg-danger/10 text-danger",primary:"border-transparent bg-muted/55 text-primary",success:"border-transparent bg-muted/55 text-success",muted:"border-transparent bg-muted/55 text-muted-foreground"};return <div className={`flex items-start gap-3 rounded-md border p-3 ${colors[tone] ?? colors.muted}`}><div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background/40">{Icon?<Icon className="h-4 w-4"/>:<Bell className="h-4 w-4"/>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold text-foreground">{title}</p><span className="text-[9px]">{tag}</span></div><p className="mt-1 text-[10px] text-muted-foreground">{detail}</p></div><span className="ml-1 shrink-0 pt-0.5 text-[10px] text-muted-foreground">{time}</span></div>}
