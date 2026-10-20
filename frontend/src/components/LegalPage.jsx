import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

// Shared shell for the public legal pages (/terms and /privacy).
// Dark theme, existing design tokens only. No login required.
export default function LegalPage({ title, updated, intro, sections }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/40 bg-card septiglow">
              <ShieldCheck className="h-5 w-5 text-primary" strokeWidth={2.4} />
            </div>
            <p className="font-display text-base font-bold tracking-tight">SeptiGuard</p>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Legal</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">Last updated: {updated}</p>
        {intro}

        <div className="mt-8 lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
          {/* Table of contents — sticky on desktop, hidden on mobile */}
          <nav className="mb-8 hidden lg:mb-0 lg:block" aria-label="Table of contents">
            <div className="sticky top-24">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">On this page</p>
              <ul className="mt-3 space-y-1">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="block rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-card hover:text-primary"
                    >
                      {s.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="min-w-0 space-y-4">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24 rounded-lg border border-border bg-card p-5 sm:p-6">
                <h2 className="font-display text-lg font-bold">{s.heading}</h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{s.body}</div>
              </section>
            ))}
          </div>
        </div>

        <p className="mt-10 text-center text-[11px] text-muted-foreground">
          SeptiGuard · Broadway Hagdan Loob Homeowners Association Inc. · Sitio Broadway, Barangay Dela Paz, Antipolo City
        </p>
      </main>
    </div>
  );
}
