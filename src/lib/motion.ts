"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  gsap.defaults({ ease: "expo.out", duration: 1.2 });
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (process.env.NODE_ENV !== "production") (window as unknown as { __ST: typeof ScrollTrigger }).__ST = ScrollTrigger;
}

export { gsap, ScrollTrigger, SplitText };

/** Motion constants. Everything is a touch slower and heavier than feels natural. */
export const EASE = "expo.out";
export const DUR = { reveal: 1.25, long: 1.4, hover: 0.45 };
export const STAGGER = { line: 0.085, word: 0.06 };

export const mq = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduced: "(prefers-reduced-motion: reduce)",
  fine: "(hover: hover) and (pointer: fine)",
  mobile: "(max-width: 767px)",
};

export const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia(mq.reduced).matches;

export const hasFinePointer = () =>
  typeof window !== "undefined" && window.matchMedia(mq.fine).matches;

export const isMobileViewport = () =>
  typeof window !== "undefined" && window.innerWidth < 768;
