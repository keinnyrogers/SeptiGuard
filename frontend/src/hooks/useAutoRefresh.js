import { useEffect, useRef } from "react";

const DEFAULT_REFRESH_INTERVAL = 15000;

export function useAutoRefresh(refresh, dependency, interval = DEFAULT_REFRESH_INTERVAL) {
  const refreshRef = useRef(refresh);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    let active = true;
    let pending = false;

    const run = async () => {
      if (!active || pending || document.visibilityState === "hidden") return;
      pending = true;
      try {
        await refreshRef.current();
      } finally {
        pending = false;
      }
    };

    void run();
    const timer = window.setInterval(() => { void run(); }, interval);
    document.addEventListener("visibilitychange", run);

    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", run);
    };
  }, [dependency, interval]);
}
