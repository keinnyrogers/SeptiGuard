import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, ArrowLeft, Bell, Bot, ChevronDown, FileWarning,
  Home, LogOut, Menu, Phone, Save, ShieldCheck, Send,
  Upload, User, UserRound, Wrench, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

/* ==================================================================
   SeptiGuard — File New Complaint (Resident)
   ------------------------------------------------------------------
   Fields dito ay tugma sa `complaints` table mo:

     category      -> Complaint Type (matches the 7-value enum)
     priority      -> Priority Level (low / medium / high)
     title         -> Subject
     description   -> Description
     location      -> Location / Address
     photo_path    -> ONE photo lang ang kaya ng column mo ngayon.
                      Kung gusto mo ng multiple photos, kailangan mo
                      ng bagong `complaint_photos` table + migration.

   Tinanggal ko: Incident Date, Phase dropdown, at "Submit
   anonymously" toggle — wala silang column sa schema mo ngayon,
   at yung anonymous option ay hindi naman kailangan dahil private
   na talaga ang complaints per resident (scoped sa user_id).

   "Save Draft" ay client-side lang muna (localStorage) hangga't
   walang "draft" status sa enum mo.
================================================================== */

const CATEGORY_OPTIONS = [
  { value: "septic_tank",   label: "Septic Tank" },
  { value: "garbage",       label: "Garbage Collection" },
  { value: "street_lights", label: "Street Lights" },
  { value: "road_damage",   label: "Road Damage" },
  { value: "noise",         label: "Noise" },
  { value: "water_supply",  label: "Water Supply" },
  { value: "other",         label: "Other" },
];

const PRIORITY_OPTIONS = [
  { value: "low",    label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high",   label: "High" },
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

const DRAFT_KEY = "septiguard_complaint_draft";

export default function NewComplaint() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState(null);

  const first = user?.name?.split(" ")[0] ?? "Resident";
  const soon = (name) => window.alert(`${name} will be connected in the next step.`);
  const signOut = async () => { await logout(); navigate("/"); };

  /* ----- load a saved draft, if may naiwan galing sa localStorage ----- */
  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const draft = JSON.parse(raw);
      setCategory(draft.category ?? "");
      setPriority(draft.priority ?? "");
      setTitle(draft.title ?? "");
      setDescription(draft.description ?? "");
      setLocation(draft.location ?? "");
      setDraftSavedAt(draft.savedAt ?? null);
    }
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrors((p) => ({ ...p, photo: "File must be under 10MB." }));
      return;
    }
    setErrors((p) => ({ ...p, photo: undefined }));
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      category, priority, title, description, location,
      savedAt: new Date().toLocaleTimeString(),
    }));
    setDraftSavedAt(new Date().toLocaleTimeString());
  };

  const validate = () => {
    const e = {};
    if (!category) e.category = "Please select a complaint type.";
    if (!title.trim()) e.title = "Subject is required.";
    if (!description.trim()) e.description = "Description is required.";
    if (description.length > 1000) e.description = "Description must be under 1000 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    /* ---------- API CALL — i-uncomment kapag ready na ang backend ----------
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("category", category);
    formData.append("priority", priority || "medium");
    formData.append("title", title);
    formData.append("description", description);
    formData.append("location", location);
    if (photo) formData.append("photo", photo);

    try {
      await axios.post("http://localhost:8000/api/complaints", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      localStorage.removeItem(DRAFT_KEY);
      navigate("/complaints");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
    ------------------------------------------------------------------------ */

    // fake delay lang muna habang wala pang backend endpoint
    setTimeout(() => {
      setSubmitting(false);
      window.alert("Complaint submitted! (sample — not yet connected to backend)");
      localStorage.removeItem(DRAFT_KEY);
      navigate("/complaints");
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
            <p className="hidden text-xs text-muted-foreground sm:block">
              Resident Portal › Complaints › New Complaint
            </p>
          </div>
          {draftSavedAt && (
            <span className="flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground">
              <Save className="h-3 w-3" />
              Draft autosaved · {draftSavedAt}
            </span>
          )}
        </header>

        <main className="mx-auto max-w-[1200px] space-y-5 p-4 sm:p-7">
          <button
            onClick={() => navigate("/complaints")}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>

          <div>
            <h1 className="font-display text-2xl font-bold">File New Complaint</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Submit a concern to the HOA management team
            </p>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
            {/* ============ LEFT: form ============ */}
            <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
              <h2 className="font-display font-semibold">Complaint Details</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Provide as much information as possible to help us resolve your concern faster.
              </p>

              <div className="mt-5 space-y-5">
                {/* Complaint Type */}
                <Field label="Complaint Type" required error={errors.category}>
                  <SelectBox
                    value={category}
                    onChange={setCategory}
                    placeholder="Select complaint category"
                    options={CATEGORY_OPTIONS}
                  />
                </Field>

                {/* Priority */}
                <Field label="Priority Level">
                  <SelectBox
                    value={priority}
                    onChange={setPriority}
                    placeholder="Choose priority"
                    options={PRIORITY_OPTIONS}
                  />
                </Field>

                {/* Subject */}
                <Field label="Subject" required error={errors.title}>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Briefly summarize your complaint"
                    className="w-full rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50"
                  />
                </Field>

                {/* Description */}
                <Field
                  label="Description"
                  required
                  error={errors.description}
                  rightLabel={`${description.length} / 1000 characters`}
                >
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                    rows={4}
                    placeholder="Describe the issue in detail. Include dates, times, locations, people involved, and any relevant context that will help the HOA understand and address your concern."
                    className="w-full resize-none rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50"
                  />
                </Field>

                {/* Location */}
                <Field label="Location / Address">
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Blk 12, Lot 4 — Broadway Hagdan"
                    className="w-full rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50"
                  />
                </Field>

                {/* Photo */}
                <Field
                  label="Photo Attachment"
                  optional
                  rightLabel="Max 10MB · PNG or JPG"
                  error={errors.photo}
                >
                  {!photoPreview ? (
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/30 py-8 text-center hover:border-primary/40">
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={handlePhotoChange}
                      />
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <Upload className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-medium">Drop file or click to upload</p>
                      <p className="text-[10px] text-muted-foreground">PNG, JPG up to 10MB</p>
                    </label>
                  ) : (
                    <div className="relative inline-block">
                      <img
                        src={photoPreview}
                        alt="attachment preview"
                        className="h-28 w-28 rounded-md border border-border object-cover"
                      />
                      <button
                        onClick={removePhoto}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <p className="mt-1 max-w-[7rem] truncate text-[10px] text-muted-foreground">
                        {photo?.name}
                      </p>
                    </div>
                  )}
                </Field>
              </div>

              {/* actions */}
              <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-5">
                <button
                  onClick={() => navigate("/complaints")}
                  className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={saveDraft}
                  className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground"
                >
                  <Save className="h-4 w-4" />
                  Save Draft
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Submitting..." : "Submit Complaint"}
                </button>
              </div>
            </section>

            {/* ============ RIGHT: sidebar info ============ */}
            <div className="space-y-5">
              {/* Submitter Info */}
              <section className="rounded-lg border border-border bg-card p-5">
                <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
                  <User className="h-4 w-4 text-primary" />
                  Submitter Info
                </h2>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Auto-filled from your account profile
                </p>

                <div className="mt-4 flex items-center gap-3 rounded-md border border-border bg-muted/40 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary text-[10px] font-semibold">
                    {first.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{user?.name ?? "Resident"}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {user?.location ?? "Blk —, Lot — · Resident"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-[11px]">
                  <InfoRow label="Email" value={user?.email ?? "—"} />
                  <InfoRow label="Phone" value={user?.phone ?? "—"} />
                  <InfoRow label="ID" value={user?.resident_code ?? "—"} />
                </div>
              </section>

              {/* Filing Guidelines */}
              <section className="rounded-lg border border-border bg-card p-5">
                <h2 className="font-display text-sm font-semibold">Filing Guidelines</h2>
                <ul className="mt-3 space-y-2 text-[11px] text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-success">✓</span>
                    Be respectful and factual in your description
                  </li>
                  <li className="flex gap-2">
                    <span className="text-success">✓</span>
                    Include photo evidence when possible
                  </li>
                  <li className="flex gap-2">
                    <span className="text-success">✓</span>
                    Response within 48 hours during weekdays
                  </li>
                  <li className="flex gap-2">
                    <span className="text-success">✓</span>
                    Emergencies? Call the hotline directly
                  </li>
                </ul>
                <button onClick={() => soon("Full policy page")} className="mt-3 text-[11px] font-medium text-primary">
                  Read full policy →
                </button>
              </section>

              {/* Emergency Hotline */}
              <section className="rounded-lg border border-danger/30 bg-danger/5 p-5">
                <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-danger">
                  <Phone className="h-4 w-4" />
                  Emergency Hotline
                </h2>
                <p className="mt-2 font-display text-lg font-bold">+63 2 8888 4321</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Available 24/7 for urgent issues
                </p>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Field({ label, required, optional, error, rightLabel, children }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold">
          {label} {required && <span className="text-danger">*</span>}
          {optional && <span className="ml-1 text-[10px] font-normal text-muted-foreground">(optional)</span>}
        </label>
        {rightLabel && <span className="text-[10px] text-muted-foreground">{rightLabel}</span>}
      </div>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-[10px] text-danger">{error}</p>}
    </div>
  );
}

function SelectBox({ value, onChange, placeholder, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 [&>option]:bg-[#12121a] [&>option]:text-foreground"
      >
        <option value="" disabled className="bg-[#12121a] text-muted-foreground">
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#12121a] text-foreground">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
