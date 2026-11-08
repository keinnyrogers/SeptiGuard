import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, CircleHelp } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const GUIDE_STEPS = [
  {
    title: "Tank status",
    description: "See your latest tank level and its Normal, Warning, or Critical range here. If no sensor is linked or readings are unavailable, the page explains why.",
    path: "/dashboard",
    target: "dashboard-tank",
  },
  {
    title: "Dashboard overview",
    description: "These summaries show the current fill level and estimated days to critical when data is available. The quick actions open monitoring, complaint submission, and maintenance.",
    path: "/dashboard",
    target: "dashboard-summary",
  },
  {
    title: "Quick actions",
    description: "Use these shortcuts to open detailed monitoring, file a complaint, or request maintenance.",
    path: "/dashboard",
    target: "dashboard-actions",
  },
  {
    title: "Recent alerts",
    description: "This section summarizes the latest updates. Choose View all to search and manage your full notification list.",
    path: "/dashboard",
    target: "dashboard-alerts",
  },
  {
    title: "Live tank readings",
    description: "Review the latest fill level and its status thresholds. Use Refresh when you want to request the latest reading.",
    path: "/monitor",
    target: "monitoring-level",
  },
  {
    title: "Sensor connection",
    description: "Check whether the device is online, when it last synced, and any reported signal details. An offline sensor may not have a new reading.",
    path: "/monitor",
    target: "monitoring-status",
  },
  {
    title: "Reading history",
    description: "Choose 7, 30, or 90 days to inspect past fill readings. The chart can be empty until your linked sensor has sent data.",
    path: "/monitor",
    target: "monitoring-history",
  },
  {
    title: "Forecast",
    description: "This estimate uses recent tank readings to project when the tank may reach the 80% critical level. Forecasts need enough recent data and are not guarantees.",
    path: "/predict",
    target: "prediction-date",
  },
  {
    title: "Trend fit and recommendations",
    description: "Trend fit describes how closely readings match the forecast trend; it is not a probability. Recommended actions can take you to maintenance.",
    path: "/predict",
    target: "prediction-insights",
  },
  {
    title: "Find a complaint",
    description: "Use status tabs, search, and category filters to narrow your complaint list. The counts summarize your submitted reports.",
    path: "/complaints",
    target: "complaint-filters",
  },
  {
    title: "Submit and follow up",
    description: "Use New Complaint in the page header to report an issue. Select a complaint in the list to see its details and status updates.",
    path: "/complaints",
    target: "complaint-list",
  },
  {
    title: "Maintenance overview",
    description: "Review your request count, open requests, and recorded service information. Select Request Maintenance in the page header to ask the HOA to coordinate service.",
    path: "/maintain",
    target: "maintenance-summary",
  },
  {
    title: "Maintenance requests",
    description: "Your requests and their latest statuses appear here. New requests are sent to the HOA for coordination; demo accounts show clearly labeled sample history.",
    path: "/maintain",
    target: "maintenance-requests",
  },
  {
    title: "Find notifications",
    description: "Use the tabs, search, and filters to find critical alerts, warnings, complaint updates, and other notifications. Summary cards show unread and recent counts.",
    path: "/alerts",
    target: "alert-filters",
  },
  {
    title: "Notification actions",
    description: "Open an alert's related page, mark notifications as read, or dismiss one from this browser's list with the X. Dismissing does not delete it.",
    path: "/alerts",
    target: "alert-list",
  },
  {
    title: "Your account and tank",
    description: "Review your profile, approval status, and linked tank details here. The page shows a clear empty state if no tank has been linked.",
    path: "/profile",
    target: "profile-account",
  },
  {
    title: "Personal information and address",
    description: "Check your saved contact and address details. Use Request information change to ask the HOA to update them.",
    path: "/profile",
    target: "profile-information",
  },
  {
    title: "Preferences and security",
    description: "Manage available notification preferences, install the portal, change your password, or sign out. Push notifications require an approved account and browser permission.",
    path: "/profile",
    target: "profile-preferences",
  },
];

const GUIDE_SEEN_KEY = "septiguard_resident_guide_v2_seen";
const RESIDENT_PATHS = ["/dashboard", "/monitor", "/predict", "/complaints", "/maintain", "/alerts", "/profile"];

function guideStorageKey(user) {
  const identifier = user?.id ?? user?.email;
  return identifier ? `${GUIDE_SEEN_KEY}:${identifier}` : null;
}

function stepForPath(pathname) {
  const index = GUIDE_STEPS.findIndex(({ path }) => pathname === path);
  return Math.max(index, 0);
}

export default function ResidentGuide() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState(null);
  const [targetMissing, setTargetMissing] = useState(false);
  const storageKey = guideStorageKey(user);
  const isResidentPage = RESIDENT_PATHS.includes(pathname);
  const isResident = isAuthenticated && user?.role === "resident" && isResidentPage;
  const step = GUIDE_STEPS[stepIndex];

  useEffect(() => {
    if (!isResident || !storageKey) return;

    let completed = false;
    try {
      completed = window.localStorage.getItem(storageKey) === "completed";
    } catch (error) {
      console.error("Could not check the resident guide preference.", error);
    }

    if (!completed) {
      if (!open || GUIDE_STEPS[stepIndex]?.path !== pathname) {
        setStepIndex(stepForPath(pathname));
      }
      setOpen(true);
    }
  }, [isResident, open, pathname, stepIndex, storageKey]);

  useEffect(() => {
    if (!isResident || !open) return undefined;

    let active = true;
    let attempts = 0;
    let target = null;
    let retryTimer;

    const measureTarget = () => {
      if (!active || !target) return;
      const rect = target.getBoundingClientRect();
      setSpotlightRect({
        top: rect.top - 6,
        left: rect.left - 6,
        width: rect.width + 12,
        height: rect.height + 12,
      });
    };

    const findTarget = () => {
      if (!active) return;
      target = document.querySelector(`[data-guide-target="${step.target}"]`);

      if (!target && attempts < 30) {
        attempts += 1;
        retryTimer = window.setTimeout(findTarget, 100);
        return;
      }

      if (!target) {
        setTargetMissing(true);
        setSpotlightRect(null);
        console.error(`Could not find resident guide target "${step.target}".`);
        return;
      }

      setTargetMissing(false);
      target.scrollIntoView({ block: "center", behavior: "smooth" });
      measureTarget();
      window.addEventListener("scroll", measureTarget, true);
      window.addEventListener("resize", measureTarget);
    };

    setSpotlightRect(null);
    setTargetMissing(false);
    findTarget();

    return () => {
      active = false;
      window.clearTimeout(retryTimer);
      window.removeEventListener("scroll", measureTarget, true);
      window.removeEventListener("resize", measureTarget);
    };
  }, [isResident, open, pathname, step.target]);

  const closeGuide = () => {
    setOpen(false);
    setSpotlightRect(null);
    if (!storageKey) return;

    try {
      window.localStorage.setItem(storageKey, "completed");
    } catch (error) {
      console.error("Could not save the resident guide preference.", error);
    }
  };

  const openGuide = () => {
    setStepIndex(stepForPath(pathname));
    setOpen(true);
  };

  const goToStep = (nextIndex) => {
    const nextStep = GUIDE_STEPS[nextIndex];
    setStepIndex(nextIndex);
    if (pathname !== nextStep.path) navigate(nextStep.path);
  };

  if (!isResident) return null;

  const labelTop = spotlightRect
    ? Math.max(8, spotlightRect.top - 38)
    : 0;
  const nextStep = GUIDE_STEPS[stepIndex + 1];
  const nextLabel = nextStep?.path === step.path ? "Next tip" : "Next page";

  return (
    <>
      <button
        type="button"
        onClick={openGuide}
        aria-label="Open resident feature guide"
        title="Resident guide"
        className="fixed bottom-4 right-4 z-40 flex h-11 items-center gap-2 rounded-full border border-primary/30 bg-card px-4 text-sm font-medium text-foreground shadow-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CircleHelp className="h-4 w-4 text-primary" />
        <span>Guide</span>
      </button>

      {open && (
        <>
          {spotlightRect && (
            <>
              <div
                aria-hidden="true"
                className="pointer-events-none fixed z-[55] rounded-xl border-2 border-primary transition-all duration-300"
                style={{
                  top: spotlightRect.top,
                  left: spotlightRect.left,
                  width: spotlightRect.width,
                  height: spotlightRect.height,
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, .72), 0 0 24px rgba(0, 229, 255, .45)",
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none fixed z-[56] flex items-center gap-1 rounded-full border border-primary/50 bg-card px-3 py-1 text-xs font-semibold text-primary shadow-lg"
                style={{
                  top: labelTop,
                  left: Math.min(
                    Math.max(8, spotlightRect.left),
                    Math.max(8, window.innerWidth - 180),
                  ),
                }}
              >
                <ChevronDown className="h-3.5 w-3.5" />
                {step.title} is here
              </div>
            </>
          )}

          <section
            role="dialog"
            aria-label="Resident feature guide"
            aria-live="polite"
            className="fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-primary/30 bg-card p-4 text-foreground shadow-2xl sm:p-5"
          >
            <div className="flex items-start gap-3">
              <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display font-semibold">{step.title}</h2>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {stepIndex + 1} of {GUIDE_STEPS.length}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">{step.description}</p>
                {targetMissing && (
                  <p role="status" className="mt-2 text-xs text-warning">
                    The feature highlight could not be located. You can still continue the guide.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
              <button
                type="button"
                onClick={closeGuide}
                className="h-9 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Skip guide
              </button>
              <div className="flex gap-2">
                {stepIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => goToStep(stepIndex - 1)}
                    className="flex h-9 items-center gap-1 rounded-md border border-border px-3 text-sm hover:bg-muted"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>
                )}
                {stepIndex < GUIDE_STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => goToStep(stepIndex + 1)}
                    className="flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    {nextLabel}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={closeGuide}
                    className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    Finish
                  </button>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
