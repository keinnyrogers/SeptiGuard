import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, AtSign, Bell, Bot, Camera, Copy, FileWarning, Hash, Home, KeyRound, LogOut, Mail,
  MapPin, Menu, MessageSquare, Phone, Save, ShieldCheck, ShieldQuestion, UserRound, Wrench,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

// Sample placeholder values only — replace with your Laravel API data later.
const SAMPLE = {
  phone: "+63 917 ••• 4421",
  residentId: "RES-0142",
  memberSince: "Member since 2023",
  blkLot: "Blk 12, Lot 4",
  complaints: 12,
  services: 14,
  tenure: "2y",
  tank: { id: "TNK-04A2-2023", installed: "Jan 15, 2023", capacity: "1,200 L", sensor: "IoT-04A2" },
  address: {
    street: "Blk 12, Lot 4, Broadway Hagdan St.",
    phase: "Phase 2",
    subdivision: "Gate 2",
    city: "Antipolo",
    zip: "1872",
  },
  passwordChanged: "Last changed 47 days ago",
};

const NAV = [
  { icon: Home, label: "Dashboard", to: "/dashboard" },
  { icon: Activity, label: "Monitor", to: "/monitor" },
  { icon: Bot, label: "Predict", to: "/predict" },
  { icon: FileWarning, label: "Complaints", to: "/complaints" },
  { icon: Wrench, label: "Maintain", to: "/maintain" },
  { icon: Bell, label: "Alerts", to: "/alerts" },
  { icon: UserRound, label: "Profile", to: "/profile", active: true },
];

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState(SAMPLE.address);
  const [prefs, setPrefs] = useState({ push: true, email: true, sms: false });

  const name = user?.name ?? "Resident";
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const soon = (what) => window.alert(`${what} will be connected in the next step.`);
  const signOut = async () => { await logout(); navigate("/"); };

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
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
              onClick={() => (x.active ? setOpen(false) : x.to ? navigate(x.to) : soon(x.label))}
              className={`relative flex h-14 flex-col items-center justify-center gap-1 rounded-md text-[10px] ${x.active ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <x.icon className="h-4 w-4" />
              {x.label}
            </button>
          ))}
        </nav>
        <div className="flex flex-col items-center gap-2 border-t border-border pt-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary text-[10px] font-semibold">{initials}</div>
          <button onClick={signOut} title="Sign out" className="p-2 text-muted-foreground hover:text-danger"><LogOut className="h-4 w-4" /></button>
        </div>
      </aside>
      {open && <button className="fixed inset-0 z-30 bg-background/80 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="page-transition min-w-0 flex-1 lg:ml-24">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <button className="rounded-md border border-border p-2 lg:hidden" onClick={() => setOpen(true)}><Menu className="h-4 w-4" /></button>
            <div>
              <p className="text-xs text-muted-foreground">Resident Portal › My Profile</p>
              <h1 className="mt-1 font-display text-2xl font-bold">My Profile</h1>
              <p className="mt-1 text-xs text-muted-foreground">Manage your account details and preferences</p>
            </div>
          </div>
          <button onClick={() => soon("Saving address changes")} className="flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
            <Save className="h-4 w-4" /> Save changes
          </button>
        </header>

        <main className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-7">
          <p className="w-fit rounded border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">Sample data</p>

          <div className="grid gap-5 xl:grid-cols-[0.75fr_1.6fr]">
            <div className="space-y-5">
              <section className="rounded-lg border border-border bg-card p-6 text-center">
                <div className="relative mx-auto w-fit">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 font-display text-2xl font-bold text-primary">{initials}</div>
                  <button onClick={() => soon("Photo upload")} className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground"><Camera className="h-3.5 w-3.5" /></button>
                </div>
                <h2 className="mt-4 font-display text-lg font-bold">{name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">Resident · {SAMPLE.blkLot}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-medium text-primary"><ShieldCheck className="h-3 w-3" /> Verified</span>
                  <span className="rounded-full bg-muted px-3 py-1 text-[10px] text-muted-foreground">{SAMPLE.memberSince}</span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-5">
                  <Stat value={SAMPLE.complaints} label="Complaints" />
                  <Stat value={SAMPLE.services} label="Services" />
                  <Stat value={SAMPLE.tenure} label="Tenure" />
                </div>
                <p className="mt-3 text-[9px] text-muted-foreground">Counts shown are sample placeholders.</p>
              </section>

              <section className="rounded-lg border border-border bg-card p-5">
                <h2 className="flex items-center gap-2 font-display font-semibold"><Hash className="h-4 w-4 text-primary" /> Tank Information</h2>
                <p className="mt-1 text-xs text-muted-foreground">Linked IoT device &amp; registry</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-3">
                    <div>
                      <p className="text-[9px] uppercase text-muted-foreground">Tank ID</p>
                      <p className="mt-1 text-sm font-medium">{SAMPLE.tank.id}</p>
                    </div>
                    <button onClick={() => soon("Copying the tank ID")} className="p-2 text-muted-foreground hover:text-foreground"><Copy className="h-4 w-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Tile label="Installed" value={SAMPLE.tank.installed} />
                    <Tile label="Capacity" value={SAMPLE.tank.capacity} />
                    <Tile label="Sensor" value={SAMPLE.tank.sensor} />
                    <Tile label="Status" value="Online" dot />
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 font-display font-semibold"><UserRound className="h-4 w-4 text-primary" /> Personal Information</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Contact HOA admin to request changes to these fields</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-1 text-[10px] text-muted-foreground"><ShieldCheck className="h-3 w-3" /> View only</span>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <ReadField icon={UserRound} label="Full Name" value={name} />
                  <ReadField icon={Mail} label="Email Address" value={user?.email ?? "—"} />
                  <ReadField icon={Phone} label="Phone Number" value={SAMPLE.phone} />
                  <ReadField icon={AtSign} label="Resident ID" value={SAMPLE.residentId} />
                </div>
                <button onClick={() => soon("Information change requests")} className="mt-3 flex items-center gap-2 text-xs font-medium text-primary"><Mail className="h-3.5 w-3.5" /> Request information change →</button>
              </section>

              <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
                <h2 className="flex items-center gap-2 font-display font-semibold"><MapPin className="h-4 w-4 text-primary" /> Address Information</h2>
                <p className="mt-1 text-xs text-muted-foreground">Property location within the community</p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <EditField label="Street Address" value={address.street} onChange={(v) => setAddress({ ...address, street: v })} />
                  <EditField label="Phase" value={address.phase} onChange={(v) => setAddress({ ...address, phase: v })} />
                  <EditField label="Subdivision" value={address.subdivision} onChange={(v) => setAddress({ ...address, subdivision: v })} />
                  <EditField label="City" value={address.city} onChange={(v) => setAddress({ ...address, city: v })} />
                  <EditField label="ZIP Code" value={address.zip} onChange={(v) => setAddress({ ...address, zip: v })} />
                </div>
              </section>

              <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
                <h2 className="flex items-center gap-2 font-display font-semibold"><Bell className="h-4 w-4 text-primary" /> Preferences</h2>
                <p className="mt-1 text-xs text-muted-foreground">Customize how you receive updates from the portal</p>
                <div className="mt-4 space-y-2">
                  <Toggle icon={Bell} title="Push Notifications" detail="Alerts about tank levels and complaints" checked={prefs.push} onChange={(v) => setPrefs({ ...prefs, push: v })} />
                  <Toggle icon={Mail} title="Email Digest" detail="Weekly summary every Monday" checked={prefs.email} onChange={(v) => setPrefs({ ...prefs, email: v })} />
                  <Toggle icon={MessageSquare} title="SMS Alerts" detail="Critical notifications only" checked={prefs.sms} onChange={(v) => setPrefs({ ...prefs, sms: v })} />
                </div>
              </section>

              <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
                <h2 className="flex items-center gap-2 font-display font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Security &amp; Account</h2>
                <p className="mt-1 text-xs text-muted-foreground">Protect your account and manage your session</p>
                <div className="mt-4 space-y-2">
                  <Row icon={KeyRound} title="Password" detail={SAMPLE.passwordChanged}
                    action={<button onClick={() => soon("Password change")} className="rounded-md bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground">Change Password</button>} />
                  <Row icon={ShieldQuestion} title="Two-Factor Authentication" detail="Not enabled yet"
                    action={<span className="rounded-full bg-muted px-3 py-1 text-[10px] text-muted-foreground">Not enabled yet</span>} />
                  <Row danger icon={LogOut} title="Sign out" detail="End your session on this device"
                    action={<button onClick={signOut} className="flex items-center gap-2 rounded-md bg-danger px-3 py-2 text-xs font-medium text-white"><LogOut className="h-3.5 w-3.5" /> Logout</button>} />
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return <div className="rounded-md border border-border bg-muted/40 py-3"><p className="font-display text-lg font-bold">{value}</p><p className="mt-1 text-[9px] text-muted-foreground">{label}</p></div>;
}
function Tile({ label, value, dot }) {
  return <div className="rounded-md bg-muted/50 px-3 py-3"><p className="text-[9px] uppercase text-muted-foreground">{label}</p><p className={`mt-1 flex items-center gap-1.5 text-sm font-medium ${dot ? "text-success" : ""}`}>{dot && <span className="h-1.5 w-1.5 rounded-full bg-success" />}{value}</p></div>;
}
function ReadField({ icon: Icon, label, value }) {
  return <div><label className="text-xs text-muted-foreground">{label}</label><div className="mt-1.5 flex h-11 items-center gap-2 rounded-md border border-border bg-muted/40 px-3"><Icon className="h-4 w-4 shrink-0 text-muted-foreground" /><input value={value} readOnly disabled aria-label={label} className="w-full cursor-not-allowed bg-transparent text-sm text-foreground outline-none" /></div></div>;
}
function EditField({ label, value, onChange }) {
  return <div><label className="text-xs text-muted-foreground">{label}</label><input value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="mt-1.5 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary" /></div>;
}
function Toggle({ icon: Icon, title, detail, checked, onChange }) {
  return <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{title}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p></div><button role="switch" aria-checked={checked} aria-label={title} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-all ${checked ? "left-[22px]" : "left-0.5"}`} /></button></div>;
}
function Row({ icon: Icon, title, detail, action, danger }) {
  return <div className={`flex flex-wrap items-center gap-3 rounded-md border p-3 ${danger ? "border-danger/30 bg-danger/10" : "border-border bg-muted/30"}`}><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${danger ? "bg-danger/15" : "bg-primary/10"}`}><Icon className={`h-4 w-4 ${danger ? "text-danger" : "text-primary"}`} /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{title}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p></div>{action}</div>;
}
