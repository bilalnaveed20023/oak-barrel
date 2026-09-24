"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { app } from "@/lib/app";
import { gsap, ScrollTrigger, prefersReduced } from "@/lib/motion";

/**
 * Lenis drives the wheel; GSAP's ticker drives Lenis so ScrollTrigger,
 * Lenis and the WebGL frame all advance on the same clock.
 * Touch keeps native momentum (syncTouch off) — it is what phones do best.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    if (prefersReduced()) return;

    const lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 0.9,
      smoothWheel: true,
      syncTouch: false,
      anchors: false,
    });
    app.lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      app.lenis = null;
    };
  }, []);

  return null;
}
