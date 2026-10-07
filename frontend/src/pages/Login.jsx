import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Activity,
  BellRing,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const FEATURES = [
  {
    icon: Activity,
    title: "Live tank monitoring",
    desc: "24/7 sensor data, right from your dashboard.",
  },
  {
    icon: BellRing,
    title: "Maintenance reminders",
    desc: "Never miss a desludging schedule again.",
  },
  {
    icon: ShieldCheck,
    title: "HOA-verified access",
    desc: "Approved residents only — secure by design.",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isReady } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // If already authenticated, bounce to the right dashboard.
  useEffect(() => {
    if (isReady && isAuthenticated) {
      const stored = window.localStorage.getItem("septiguard_user");
      const role = stored ? JSON.parse(stored).role : "resident";
      navigate(role === "admin" ? "/admin/dashboard" : "/dashboard");
    }
  }, [isReady, isAuthenticated, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      // Keep-me-signed-in: if false, clear session on tab close only — we keep
      // token in localStorage either way; a future hardening pass can use
      // sessionStorage when unchecked. For now we respect the toggle visually.
      void keepSignedIn;
      navigate(user.role === "admin" ? "/admin/dashboard" : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-background text-foreground">
      {/* ===================== LEFT PANEL ===================== */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-10 lg:flex xl:p-14">
        {/* ambient glow + grid */}
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
        <div className="pointer-events-none absolute -left-24 top-1/4 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-[120px]" />
        <div className="pointer-events-none absolute -left-10 top-1/3 h-[20rem] w-[20rem] rounded-full bg-accent/15 blur-[100px]" />

        {/* Branding */}
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

        {/* Hero content */}
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Broadway Hagdan Loob HOA
          </span>

          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.1] tracking-tight xl:text-5xl">
            Welcome back to your{" "}
            <span className="text-primary">smart septic network.</span>
          </h1>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground xl:text-base">
            Sign in to monitor your tank, review maintenance alerts, and stay
            connected with your HOA administrators.
          </p>

          <ul className="mt-10 space-y-5">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                  <f.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {f.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
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
      <main className="relative flex w-full flex-col justify-between bg-background px-6 py-8 sm:px-10 lg:w-1/2 lg:px-14 lg:py-12">
        {/* mobile glow */}
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-[90px] lg:hidden" />

        {/* Top-right sign-up link */}
        <div className="relative z-10 hidden justify-end lg:flex">
          <p className="text-sm text-muted-foreground">
            New resident?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        {/* Form */}
        <div className="relative z-10 mx-auto flex w-full max-w-md flex-col justify-center py-10">
          {/* mobile brand */}
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
            Sign in
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your credentials to access your SeptiGuard dashboard.
          </p>

          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              <span className="mt-0.5 text-danger">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-muted-foreground"
              >
                Email Address (Registered in HOA)
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-lg border border-border bg-input pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-lg border border-border bg-input pl-11 pr-11 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Keep me signed in */}
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
              <button
                type="button"
                role="checkbox"
                aria-checked={keepSignedIn}
                onClick={() => setKeepSignedIn((s) => !s)}
                className={`flex h-4.5 w-4.5 items-center justify-center rounded-full border transition-colors ${
                  keepSignedIn
                    ? "border-primary bg-primary"
                    : "border-border bg-transparent"
                }`}
              >
                {keepSignedIn && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                )}
              </button>
              Keep me signed in on this device
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground transition-all hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-70 septiglow-strong"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Register prompt */}
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-border bg-card/60 px-4 py-3.5 lg:flex">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
              <UserPlus className="h-4.5 w-4.5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Register
              </Link>{" "}
              and wait for admin approval.
            </p>
          </div>

          <div className="mt-4 flex justify-center text-sm text-muted-foreground lg:hidden">
            New resident?{" "}
            <Link to="/register" className="ml-1 font-medium text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </div>

        {/* Right footer */}
        <div className="relative z-10">
          <div className="h-px w-full bg-border" />
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success" />
              SeptiGuard v1.0 · Operational
            </span>
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