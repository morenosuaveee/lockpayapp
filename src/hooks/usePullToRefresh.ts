import { useEffect, useRef, useState } from "react";
import { haptic } from "@/lib/native";

/**
 * Native iOS-style pull-to-refresh.
 * Attach the returned ref to the scroll container (or window if undefined).
 */
export function usePullToRefresh(onRefresh: () => Promise<void> | void, threshold = 72) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const triggered = useRef(false);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (window.scrollY > 0) { startY.current = null; return; }
      startY.current = e.touches[0].clientY;
      triggered.current = false;
    }
    function onTouchMove(e: TouchEvent) {
      if (startY.current == null || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) { setPull(0); return; }
      // Rubber-band damping
      const damped = Math.min(120, Math.pow(dy, 0.85));
      setPull(damped);
      if (!triggered.current && damped >= threshold) {
        triggered.current = true;
        haptic("medium");
      }
    }
    async function onTouchEnd() {
      if (startY.current == null) return;
      const shouldFire = triggered.current;
      startY.current = null;
      if (shouldFire && !refreshing) {
        setRefreshing(true);
        try { await onRefresh(); } finally {
          setRefreshing(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
    }
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh, threshold, refreshing]);

  return { pull, refreshing };
}
