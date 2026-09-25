import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Droplet,
  Eye,
  EyeOff,
  Home,
  Info,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";
import { registerRequest } from "../api.js";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [blockLot, setBlockLot] = useState("");
  const [tankId, setTankId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Please enter your full name.");
    if (!email.trim()) return setError("Please enter your email address.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setError("Please enter a valid email address.");
    if (!blockLot.trim()) return setError("Please enter your block and lot.");
    if (password.length < 8)
      return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    if (!agreed)
      return setError("Please accept the Terms and Conditions to continue.");

    setSubmitting(true);
    try {
      await registerRequest({
        name: name.trim(),
        email: email.trim(),
        block_lot: blockLot.trim(),
        tank_id: tankId.trim() || null,
        password,
        password_confirmation: confirm,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    "h-12 w-full rounded-lg border border-border bg-input pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-background text-foreground">
      {/* ===================== LEFT PANEL ===================== */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-10 lg:flex xl:p-14">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
        <div className="pointer-events-none absolute -left-24 top-1/4 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-[120px]" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-[22rem] w-[22rem] rounded-full bg-success/10 blur-[110px]" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/40 bg-card septiglow">
            <ShieldCheck className="h-6 w-6 text-primary" strokeWidth={2.4} />
          </div>
          <div className="leading-tight">
            <p className="font-display text-lg font-bold tracking-tight text-foreground">
              SeptiGuard
            </p>
            <p className="text-xs text-muted-foreground">SeptiGuard Portal · v1.0</p>
          </div>
        </div>

        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Broadway Hagdan Loob HOA
          </span>

          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.1] tracking-tight xl:text-5xl">
            Join your community's
            <br />
            <span className="text-primary">smart septic network.</span>
          </h1>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground xl:text-base">
            Register once to monitor your tank, receive maintenance alerts, and
            stay connected with your HOA administrators in real time.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 Broadway Hagdan Loob HOA</span>
          <div className="flex gap-4">
            <a href="#" className="transition-colors hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Support
            </a>
          </div>
        </div>
      </aside>

      {/* ===================== RIGHT PANEL ===================== */}
      <main className="relative flex w-full flex-col bg-background px-6 py-8 sm:px-10 lg:w-1/2 lg:px-14 lg:py-12">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-[90px] lg:hidden" />

        <div className="relative z-10 flex justify-end">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/" className="font-medium text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-8">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/40 bg-card septiglow">
              <ShieldCheck className="h-5 w-5 text-primary" strokeWidth={2.4} />
            </div>
            <div className="leading-tight">
              <p className="font-display text-base font-bold text-foreground">
                SeptiGuard
              </p>
              <p className="text-xs text-muted-foreground">SeptiGuard Portal · v1.0</p>
            </div>
          </div>

          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Create an Account
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Fill in your details to request access. Your account will be reviewed
            by the HOA admin.
          </p>

          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="mt-6 rounded-xl border border-success/30 bg-success/10 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-success/40 bg-card">
                  <ShieldCheck className="h-5 w-5 text-success" />
                </div>
                <p className="font-display text-lg font-semibold text-foreground">
                  Registration submitted
                </p>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Thanks, {name.split(" ")[0]}. Your account is pending approval by
                the HOA administrator. You'll be able to sign in once it is
                approved.
              </p>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="mt-5 flex h-11 w-full items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground transition-colors hover:bg-accent"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
              {/* Full name */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-muted-foreground">
                  Full Name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="name"
                    autoComplete="name"
                    maxLength={100}
                    placeholder="Juan dela Cruz"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    maxLength={255}
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>

              {/* Block & Lot + Tank ID */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="blockLot" className="block text-sm font-medium text-muted-foreground">
                    Block & Lot
                  </label>
                  <div className="relative">
                    <Home className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="blockLot"
                      maxLength={60}
                      placeholder="Block 3 Lot 12"
                      value={blockLot}
                      onChange={(e) => setBlockLot(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="tankId" className="block text-sm font-medium text-muted-foreground">
                    Tank ID
                  </label>
                  <div className="relative">
                    <Droplet className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="tankId"
                      maxLength={30}
                      placeholder="TK-0042"
                      value={tankId}
                      onChange={(e) => setTankId(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                </div>
              </div>

              {/* Passwords */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${fieldClass} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirm" className="block text-sm font-medium text-muted-foreground">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className={`${fieldClass} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={agreed}
                  onClick={() => setAgreed((s) => !s)}
                  className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors ${
                    agreed ? "border-primary bg-primary" : "border-border bg-transparent"
                  }`}
                >
                  {agreed && <span className="h-1.5 w-1.5 rounded-sm bg-primary-foreground" />}
                </button>
                <span>
                  I agree to the{" "}
                  <a href="#" className="font-medium text-primary hover:underline">
                    Terms and Conditions
                  </a>{" "}
                  and acknowledge the{" "}
                  <a href="#" className="font-medium text-primary hover:underline">
                    Privacy Policy
                  </a>
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground transition-all hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-70 septiglow-strong"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Submit Registration
                  </>
                )}
              </button>

              <div className="flex items-center gap-3 rounded-lg border border-border bg-card/60 px-4 py-3.5">
                <Info className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Your registration will be pending until approved by the HOA
                  administrator.
                </p>
              </div>
            </form>
          )}
        </div>

        <div className="relative z-10">
          <div className="h-px w-full bg-border" />
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>SeptiGuard v1.0</span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Secured connection
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}