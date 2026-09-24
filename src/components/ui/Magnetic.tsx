"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, mq } from "@/lib/motion";

/**
 * Pulls its child toward the cursor inside a radius. The inner label moves
 * a little further than the shell, which gives the button weight.
 */
export default function Magnetic({
  children,
  strength = 0.35,
  radius = 90,
  className,
}: {
  children: ReactNode;
  strength?: number;
  radius?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia(mq.fine).matches || window.matchMedia(mq.reduced).matches) return;
    const inner = el.querySelector<HTMLElement>("[data-magnetic-inner]");
    const xTo = gsap.quickTo(el, "x", { duration: 0.9, ease: "expo.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.9, ease: "expo.out" });
    const ixTo = inner ? gsap.quickTo(inner, "x", { duration: 0.9, ease: "expo.out" }) : null;
    const iyTo = inner ? gsap.quickTo(inner, "y", { duration: 0.9, ease: "expo.out" }) : null;
    let active = false;

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2 - (gsap.getProperty(el, "x") as number);
      const cy = r.top + r.height / 2 - (gsap.getProperty(el, "y") as number);
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const reach = Math.max(r.width, r.height) / 2 + radius;
      if (Math.hypot(dx, dy) < reach) {
        active = true;
        xTo(dx * strength);
        yTo(dy * strength);
        ixTo?.(dx * strength * 0.35);
        iyTo?.(dy * strength * 0.35);
      } else if (active) {
        active = false;
        xTo(0);
        yTo(0);
        ixTo?.(0);
        iyTo?.(0);
      }
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [strength, radius]);

  return (
    <span ref={ref} className={`magnetic ${className ?? ""}`}>
      {children}
    </span>
  );
}
