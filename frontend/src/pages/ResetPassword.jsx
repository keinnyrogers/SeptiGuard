import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, Loader2, Lock, Mail } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { resetPassword } from "../api.js";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!token || !email) {
      setError("This password reset link is incomplete. Request a new link from the sign-in page.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setComplete(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not reset your password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <section className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl sm:p-8">
        <BrandLogo className="mb-8 h-10 w-auto" />
        {complete ? (
          <>
            <h1 className="font-display text-2xl font-bold">Password updated</h1>
            <p role="status" className="mt-3 text-sm text-muted-foreground">
              Your password has been reset. Sign in with your new password to continue.
            </p>
            <button
              type="button"
              onClick={() => navigate("/", { replace: true })}
              className="mt-6 h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground hover:bg-accent"
            >
              Back to sign in
            </button>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold">Choose a new password</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter a new password for {email || "your account"}.
            </p>

            {error && (
              <p role="alert" className="mt-5 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block space-y-2 text-sm text-muted-foreground">
                <span>New password</span>
                <span className="relative block">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 w-full rounded-lg border border-border bg-input pl-11 pr-4 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                </span>
              </label>
              <label className="block space-y-2 text-sm text-muted-foreground">
                <span>Confirm new password</span>
                <span className="relative block">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={passwordConfirmation}
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                    className="h-12 w-full rounded-lg border border-border bg-input pl-11 pr-4 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                </span>
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Updating…</> : "Reset password"}
              </button>
            </form>
            <Link to="/" className="mt-5 flex items-center justify-center gap-2 text-sm text-primary hover:underline">
              <Mail className="h-4 w-4" /> Back to sign in
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
