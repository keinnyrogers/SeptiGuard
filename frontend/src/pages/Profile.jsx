import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, AtSign, Bell, Bot, Camera, Copy, FileWarning, Hash, Home, KeyRound, LoaderCircle, LogOut, Mail,
  MapPin, Menu, Phone, Save, ShieldCheck, ShieldQuestion, UserRound, Wrench,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { BrandMark } from "@/components/BrandLogo";
import {
  fetchResidentAccount,
  fetchResidentTankLatest,
  uploadResidentProfilePhoto,
} from "../api.js";
import ResidentAvatar from "../components/ResidentAvatar.jsx";
import ChangePasswordPanel from "../components/ChangePasswordPanel.jsx";
import RequestInfoChangePanel from "../components/RequestInfoChangePanel.jsx";
import {
  fetchResidentPushStatus,
  registerResidentPushToken,
  removeResidentPushToken,
} from "../api.js";
import { isFirebaseMessagingConfigured } from "../lib/firebaseConfig.js";
import { promptAppInstall, subscribeToInstallPrompt } from "../lib/pwaInstall.js";

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
  { icon: Activity, label: "Monitoring", to: "/monitor" },
  { icon: Bot, label: "Predict", to: "/predict" },
  { icon: FileWarning, label: "Complaints", to: "/complaints" },
  { icon: Wrench, label: "Maintenance", to: "/maintain" },
  { icon: Bell, label: "Notifications", to: "/alerts" },
  { icon: UserRound, label: "Profile", to: "/profile", active: true },
];

const PUSH_TOKEN_STORAGE_KEY = "septiguard_fcm_token";

export default function Profile() {
  const { user, token, logout, updateUser, profilePhotoUrl } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [passwordPanelOpen, setPasswordPanelOpen] = useState(false);
  const [infoChangePanelOpen, setInfoChangePanelOpen] = useState(false);
  const demoMode = Boolean(user?.demo_mode);
  const profile = user?.resident_profile ?? user?.residentProfile ?? null;
  const tank = user?.septic_system ?? user?.septicSystem ?? null;
  const [liveTank, setLiveTank] = useState(tank);
  const [demoPhotoUrl, setDemoPhotoUrl] = useState(null);
  const photoUrl = demoMode ? demoPhotoUrl : profilePhotoUrl;
  const [photoError, setPhotoError] = useState("");
  const [accountRefreshError, setAccountRefreshError] = useState("");
  const [profileLoading, setProfileLoading] = useState(!demoMode && Boolean(token));
  const [demoAddressSaved, setDemoAddressSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInput = useRef(null);
  const [address, setAddress] = useState(SAMPLE.address);
  const [prefs, setPrefs] = useState({ push: true, email: true });
  const [pushConfigured, setPushConfigured] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushStatusLoading, setPushStatusLoading] = useState(true);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushProgress, setPushProgress] = useState("");
  const [pushError, setPushError] = useState("");
  const [canInstall, setCanInstall] = useState(false);
  const [installMessage, setInstallMessage] = useState("");
  const isApprovedResident = user?.role === "resident"
    && user?.account_status === "approved"
    && !demoMode;

  const name = user?.name ?? "Resident";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "R";
  const soon = (what) => window.alert(`${what} will be connected in the next step.`);
  const signOut = async () => { if (await logout()) navigate("/"); };
  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setPhotoError("");
    if (demoMode) {
      const temporaryUrl = URL.createObjectURL(file);
      setDemoPhotoUrl((previousUrl) => {
        if (previousUrl?.startsWith("blob:")) URL.revokeObjectURL(previousUrl);
        return temporaryUrl;
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      const result = await uploadResidentProfilePhoto(token, file);
      updateUser({
        resident_profile: {
          ...profile,
          profile_photo_path: result?.data?.profile_photo_path,
        },
      });
    } catch (error) {
      setPhotoError(error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  useEffect(() => () => {
    if (demoPhotoUrl?.startsWith("blob:")) URL.revokeObjectURL(demoPhotoUrl);
  }, [demoPhotoUrl]);

  useEffect(() => {
    if (demoMode || !token) return undefined;

    let active = true;
    fetchResidentAccount(token)
      .then((account) => {
        if (!active || !account) return;
        updateUser(account);
        setAccountRefreshError("");
      })
      .catch((error) => {
        if (active) setAccountRefreshError(error.message);
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [demoMode, token, updateUser]);

  useEffect(() => {
    if (demoMode || !token) return undefined;

    let active = true;
    fetchResidentTankLatest(token)
      .then((data) => {
        if (active) {
          setLiveTank(data?.device_id ? data : null);
        }
      })
      .catch(() => {
        if (active) setLiveTank(tank);
      });

    return () => {
      active = false;
    };
  }, [demoMode, token, tank]);

  useEffect(() => subscribeToInstallPrompt(setCanInstall), []);

  useEffect(() => {
    if (!isApprovedResident || !token) return undefined;

    let active = true;
    fetchResidentPushStatus(token, window.localStorage.getItem(PUSH_TOKEN_STORAGE_KEY))
      .then((status) => {
        if (!active) return;
        setPushConfigured(Boolean(status?.configured && isFirebaseMessagingConfigured()));
        setPushEnabled(Boolean(status?.enabled));
        setPushError("");
      })
      .catch((error) => {
        if (!active) return;
        setPushConfigured(false);
        setPushError(error.message);
      })
      .finally(() => {
        if (active) setPushStatusLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isApprovedResident, token]);

  const handlePushChange = async (enabled) => {
    let accountPushDisabled = false;
    setPushBusy(true);
    setPushProgress("");
    setPushError("");
    try {
      if (enabled) {
        if (!isApprovedResident) throw new Error("Push notifications are available only to approved resident accounts.");
        const { requestFirebasePushToken } = await import("../lib/firebase.js");
        const pushToken = await requestFirebasePushToken(setPushProgress);
        setPushProgress("Saving device registration to SeptiGuard…");
        await registerResidentPushToken(token, pushToken);
        window.localStorage.setItem(PUSH_TOKEN_STORAGE_KEY, pushToken);
        setPushEnabled(true);
      } else {
        const pushToken = window.localStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
        if (pushToken) {
          await removeResidentPushToken(token, pushToken);
          window.localStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
        }
        setPushEnabled(false);
        accountPushDisabled = true;
        setPushProgress("Removing this browser's push subscription…");
        const { deleteFirebasePushToken } = await import("../lib/firebase.js");
        await deleteFirebasePushToken();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update push notification settings.";
      const code = typeof error?.code === "string" ? ` (${error.code})` : "";
      const cleanupWarning = accountPushDisabled
        ? "Push notifications were disabled for this account, but this browser subscription could not be removed."
        : "";
      setPushError(cleanupWarning || (pushProgress ? `${pushProgress} ${message}${code}` : `${message}${code}`));
    } finally {
      setPushBusy(false);
      setPushProgress("");
    }
  };

  const handleInstall = async () => {
    setInstallMessage("");
    try {
      const accepted = await promptAppInstall();
      setInstallMessage(accepted ? "SeptiGuard was added to your device." : "Installation was cancelled.");
    } catch (error) {
      setInstallMessage(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <aside className={`${open ? "flex" : "hidden"} fixed inset-y-0 left-0 z-40 w-24 flex-col border-r border-border bg-card px-2 py-5 lg:flex`}>
        <div className="mb-5 flex justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg">
            <BrandMark className="h-8 w-8" />
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
          <ResidentAvatar />
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
          {demoMode && (
            <button
              onClick={() => setDemoAddressSaved(true)}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
            >
              <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="whitespace-nowrap">{demoAddressSaved ? "Demo changes saved" : "Save demo changes"}</span>
            </button>
          )}
        </header>

        <main className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-7">
          {profileLoading ? (
            <section
              className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 px-6 py-12 text-center"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <span className="h-10 w-10 animate-spin rounded-full border-2 border-primary/25 border-t-primary" aria-hidden="true" />
              <h2 className="mt-4 font-display text-lg font-semibold">Loading your profile…</h2>
              <p className="mt-2 text-sm text-muted-foreground">Getting your account details and preferences.</p>
            </section>
          ) : <>
          {demoMode && <p className="w-fit rounded border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">Demo data</p>}

          <div className="grid gap-5 xl:grid-cols-[0.75fr_1.6fr]">
            <div className="space-y-5">
              <section className="rounded-lg border border-border bg-card p-6 text-center">
                <div className="relative mx-auto w-fit">
                  {photoUrl
                    ? <img src={photoUrl} alt={`${name}'s profile`} className="h-24 w-24 rounded-full object-cover" />
                    : <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 font-display text-2xl font-bold text-primary">{initials}</div>}
                  <input
                    ref={photoInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                  <button
                    type="button"
                    onClick={() => photoInput.current?.click()}
                    disabled={uploadingPhoto}
                    aria-label={uploadingPhoto ? "Uploading profile photo" : "Upload profile photo"}
                    className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-60"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>
                {photoError && <p role="alert" className="mt-2 text-xs text-danger">{photoError}</p>}
                <h2 className="mt-4 font-display text-lg font-bold">{name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">Resident · {demoMode ? SAMPLE.blkLot : (profile?.address ?? "Address not set")}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-medium text-primary"><ShieldCheck className="h-3 w-3" /> {user?.account_status === "approved" ? "HOA approved" : "Pending approval"}</span>
                  {demoMode && <span className="rounded-full bg-muted px-3 py-1 text-[10px] text-muted-foreground">{SAMPLE.memberSince}</span>}
                </div>
                {demoMode ? <>
                  <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-5">
                    <Stat value={SAMPLE.complaints} label="Complaints" />
                    <Stat value={SAMPLE.services} label="Services" />
                    <Stat value={SAMPLE.tenure} label="Tenure" />
                  </div>
                  <p className="mt-3 text-[9px] text-muted-foreground">Counts shown are demo placeholders.</p>
                </> : <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">Account activity summaries will appear here when available.</p>}
              </section>

              <section className="rounded-lg border border-border bg-card p-5">
                <h2 className="flex items-center gap-2 font-display font-semibold"><Hash className="h-4 w-4 text-primary" /> Tank Information</h2>
                <p className="mt-1 text-xs text-muted-foreground">Linked IoT device &amp; registry</p>
                {demoMode ? <div className="mt-4 space-y-2">
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
                </div> : liveTank?.device_id ? <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-3">
                    <div>
                      <p className="text-[9px] uppercase text-muted-foreground">Device ID</p>
                      <p className="mt-1 text-sm font-medium">{liveTank.device_id}</p>
                    </div>
                    <span className="rounded-full bg-success/15 px-2 py-1 text-[10px] font-medium text-success">Linked</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <Tile label="Tank height" value={liveTank.tank_height_cm ? `${liveTank.tank_height_cm} cm` : "Not set"} />
                    <Tile label="Sensor" value={liveTank.has_sensor ? "Registered" : "Not linked"} dot={liveTank.has_sensor} />
                    <Tile label="Reading" value={liveTank.reading ? `${liveTank.reading.fill_level_percentage}%` : "No reading"} />
                  </div>
                </div> : <div className="mt-4 rounded-md border border-dashed border-border bg-muted/20 p-6 text-center"><p className="text-sm font-medium">No tank linked yet</p><p className="mt-1 text-xs text-muted-foreground">Tank details will appear after the HOA links a septic system.</p></div>}
              </section>
            </div>

            <div className="space-y-5">
              <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 font-display font-semibold"><UserRound className="h-4 w-4 text-primary" /> Personal Information</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Request a change for HOA review</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-1 text-[10px] text-muted-foreground"><ShieldCheck className="h-3 w-3" /> View only</span>
                </div>
                {accountRefreshError && <p role="alert" className="mt-3 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">Could not refresh your account details: {accountRefreshError}</p>}
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <ReadField icon={UserRound} label="Full Name" value={name} />
                  <ReadField icon={Mail} label="Email Address" value={user?.email ?? "—"} />
                  <ReadField icon={Phone} label="Phone Number" value={demoMode ? SAMPLE.phone : (profile?.contact_number ?? user?.contact_number ?? "—")} />
                  <ReadField icon={AtSign} label="Resident ID" value={demoMode ? SAMPLE.residentId : user?.id ? `RES-${String(user.id).padStart(4, "0")}` : "—"} />
                </div>
                <button onClick={() => setInfoChangePanelOpen(true)} className="mt-3 flex items-center gap-2 text-xs font-medium text-primary"><Mail className="h-3.5 w-3.5" /> Request information change →</button>
              </section>

              <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
                <h2 className="flex items-center gap-2 font-display font-semibold"><MapPin className="h-4 w-4 text-primary" /> Address Information</h2>
                <p className="mt-1 text-xs text-muted-foreground">Property location within the community</p>
                {demoMode ? <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <EditField label="Street Address" value={address.street} onChange={(v) => { setAddress({ ...address, street: v }); setDemoAddressSaved(false); }} />
                  <EditField label="Phase" value={address.phase} onChange={(v) => { setAddress({ ...address, phase: v }); setDemoAddressSaved(false); }} />
                  <EditField label="Subdivision" value={address.subdivision} onChange={(v) => { setAddress({ ...address, subdivision: v }); setDemoAddressSaved(false); }} />
                  <EditField label="City" value={address.city} onChange={(v) => { setAddress({ ...address, city: v }); setDemoAddressSaved(false); }} />
                  <EditField label="ZIP Code" value={address.zip} onChange={(v) => { setAddress({ ...address, zip: v }); setDemoAddressSaved(false); }} />
                </div> : <div className="mt-5 rounded-md border border-border bg-muted/30 p-4"><p className="text-xs text-muted-foreground">Registered address</p><p className="mt-1 text-sm font-medium">{profile?.address ?? user?.address ?? "No address saved"}</p><button type="button" onClick={() => setInfoChangePanelOpen(true)} className="mt-3 text-xs font-medium text-primary hover:underline">Request an address change through the HOA</button></div>}
              </section>

              <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
                <h2 className="flex items-center gap-2 font-display font-semibold"><Bell className="h-4 w-4 text-primary" /> Preferences</h2>
                <p className="mt-1 text-xs text-muted-foreground">Customize how you receive updates from the portal</p>
                <div className="mt-4 space-y-2">
                  {demoMode ? <>
                    <Toggle icon={Bell} title="Push Notifications" detail="Demo preference only; no device notifications are sent" checked={prefs.push} onChange={(v) => setPrefs({ ...prefs, push: v })} />
                    <Toggle icon={Mail} title="Email Digest" detail="Weekly summary every Monday" checked={prefs.email} onChange={(v) => setPrefs({ ...prefs, email: v })} />
                  </> : <>
                    {isApprovedResident ? pushStatusLoading ? (
                      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-4 text-xs text-muted-foreground" role="status" aria-live="polite" aria-busy="true">
                        <LoaderCircle className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                        Checking push notification setup…
                      </div>
                    ) : pushConfigured || pushEnabled ? (
                      <Toggle
                        icon={Bell}
                        title="Push Notifications"
                        detail={pushBusy
                          ? pushProgress || "Starting notification setup…"
                          : "Tank and complaint updates on this device"}
                        checked={pushEnabled}
                        disabled={pushBusy}
                        loading={pushBusy}
                        onChange={handlePushChange}
                      />
                    ) : (
                      <p className="rounded-md border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
                        Push notifications are not configured yet. Portal alerts remain available on your Alerts page.
                      </p>
                    ) : (
                      <p className="rounded-md border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
                        Push notifications are available after your resident account is approved.
                      </p>
                    )}
                    {pushError && <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">{pushError}</p>}
                    <p className="rounded-md border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
                      Portal alerts appear in your Alerts page. Email notifications are sent to {user?.email ?? "your account email"} when email delivery is configured by the HOA.
                    </p>
                  </>}
                  <div className="flex flex-col items-start gap-3 rounded-md border border-border bg-muted/30 p-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">Install SeptiGuard</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Add the portal to your home screen for an app-like experience.</p>
                    </div>
                    {canInstall
                      ? <button type="button" onClick={handleInstall} className="shrink-0 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">Install app</button>
                      : <span className="w-full text-left text-[11px] text-muted-foreground sm:w-auto sm:shrink-0 sm:text-right">Use your browser menu to install or add to home screen.</span>}
                  </div>
                  {installMessage && <p role="status" className="text-xs text-muted-foreground">{installMessage}</p>}
                </div>
              </section>

              <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
                <h2 className="flex items-center gap-2 font-display font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Security &amp; Account</h2>
                <p className="mt-1 text-xs text-muted-foreground">Protect your account and manage your session</p>
                <div className="mt-4 space-y-2">
                  <Row icon={KeyRound} title="Password" detail={demoMode ? SAMPLE.passwordChanged : "Password change history unavailable"}
                    action={<button onClick={() => setPasswordPanelOpen(true)} className="rounded-md bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground">Change Password</button>} />
                  <Row icon={ShieldQuestion} title="Two-Factor Authentication" detail="Not enabled yet"
                    action={<span className="rounded-full bg-muted px-3 py-1 text-[10px] text-muted-foreground">Not enabled yet</span>} />
                  <Row danger icon={LogOut} title="Sign out" detail="End your session on this device"
                    action={<button onClick={signOut} className="flex items-center gap-2 rounded-md bg-danger px-3 py-2 text-xs font-medium text-white"><LogOut className="h-3.5 w-3.5" /> Logout</button>} />
                </div>
              </section>
            </div>
          </div>
          </>}
        </main>
      </div>
      <ChangePasswordPanel open={passwordPanelOpen} onClose={() => setPasswordPanelOpen(false)} token={token} />
      <RequestInfoChangePanel
        open={infoChangePanelOpen}
        onClose={() => setInfoChangePanelOpen(false)}
        token={token}
        demoMode={demoMode}
        current={{
          name,
          email: user?.email ?? "",
          phone: demoMode ? SAMPLE.phone : (profile?.contact_number ?? user?.contact_number ?? ""),
          address: demoMode ? SAMPLE.blkLot : (profile?.address ?? user?.address ?? ""),
          household: profile?.household_members ?? "",
        }}
      />
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
function Toggle({ icon: Icon, title, detail, checked, onChange, disabled = false, loading = false }) {
  return <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{title}</p><p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground" aria-live={loading ? "polite" : undefined}>{loading && <LoaderCircle className="h-3 w-3 animate-spin text-primary" aria-hidden="true" />}{detail}</p></div><button type="button" role="switch" aria-checked={checked} aria-label={title} disabled={disabled} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-wait disabled:opacity-60 ${checked ? "bg-primary" : "bg-muted"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-all ${checked ? "left-[22px]" : "left-0.5"}`} /></button></div>;
}
function Row({ icon: Icon, title, detail, action, danger }) {
  return <div className={`flex flex-wrap items-center gap-3 rounded-md border p-3 ${danger ? "border-danger/30 bg-danger/10" : "border-border bg-muted/30"}`}><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${danger ? "bg-danger/15" : "bg-primary/10"}`}><Icon className={`h-4 w-4 ${danger ? "text-danger" : "text-primary"}`} /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{title}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p></div>{action}</div>;
}
