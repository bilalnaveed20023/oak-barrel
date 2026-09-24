"use client";

import { gsap, ScrollTrigger } from "./motion";

/**
 * The master motion timeline for the barrel.
 *
 * A paused GSAP timeline whose time axis is *scroll pixels*. Keyframes are
 * anchored to real DOM / ScrollTrigger positions and rebuilt on every
 * ScrollTrigger refresh, so resizes, pin spacers and font swaps can never
 * desync the object from the page. Each frame the Stage calls `sample()`
 * with the (Lenis-smoothed) scroll position and damps toward the result.
 *
 * x / y are fractions of the half-viewport (so poses survive any aspect),
 * s multiplies the fitted base scale, mood indexes the lighting palette,
 * f is idle float amount, sh is contact-shadow opacity.
 */
export type Pose = {
  x: number;
  y: number;
  z: number;
  s: number;
  rx: number;
  ry: number;
  rz: number;
  mood: number;
  f: number;
  sh: number;
};

const P = (p: Partial<Pose>): Pose => ({
  x: 0,
  y: 0,
  z: 0,
  s: 1,
  rx: 0,
  ry: 0,
  rz: 0,
  mood: 0,
  f: 0,
  sh: 0,
  ...p,
});

const TAU = Math.PI * 2;

/** Moods: 0 warm hero · 1 ember · 2 emerald · 3 ivory daylight · 4 gold beauty */
function poses(mobile: boolean) {
  const m = mobile;
  return {
    hero: P({ x: m ? 0.08 : 0.3, y: m ? -0.36 : -0.04, s: m ? 0.8 : 1, rx: 0.16, ry: -0.55, rz: 0.04, mood: 0, f: 1, sh: 0.75 }),
    heroOut: P({ x: m ? 0.35 : 0.42, y: m ? -0.1 : 0.02, s: m ? 0.78 : 0.86, rx: -0.2, ry: 0.9, rz: -0.28, mood: 0.7, f: 0.3 }),
    manifestoIn: P({ x: m ? 0.55 : 0.58, y: m ? 0.2 : 0.1, s: m ? 0.62 : 0.78, rx: -0.35, ry: 1.9, rz: -0.42, mood: 1, f: 0.2 }),
    manifestoOut: P({ x: m ? 0.5 : 0.56, y: m ? -0.3 : -0.2, s: m ? 0.6 : 0.8, rx: 0.3, ry: 3.3, rz: 0.52, mood: 1.6 }),
    // stacked layouts only: step off-canvas right while the feature copy scrolls in
    featuresEntry: P({ x: 1.45, y: -0.55, s: 0.62, rx: 0.2, ry: TAU - 0.4, rz: 0.3, mood: 1.9 }),
    features: [
      // 01 cocktails — upright three-quarter, hoops catching the rim light
      P({ x: m ? 0 : 0.46, y: m ? -0.42 : -0.02, s: m ? 0.7 : 1.02, rx: 0.14, ry: TAU + 0.35, rz: -0.05, mood: 2 }),
      // 02 distillates — tipped toward camera, the burned head reads
      P({ x: m ? 0 : 0.48, y: m ? -0.4 : 0.02, s: m ? 0.72 : 1.02, rx: 1.18, ry: TAU + 0.1, rz: 0.12, mood: 2 }),
      // 03 live nights — laid on its side, rolling
      P({ x: m ? 0 : 0.44, y: m ? -0.42 : -0.04, s: m ? 0.66 : 0.95, rx: 0.2, ry: TAU + 1.2, rz: Math.PI / 2, mood: 2.4 }),
      // 04 private — tight crop on hoop + staves, bleeding off the edge
      P({ x: m ? 0.38 : 0.7, y: m ? -0.6 : 0.12, s: m ? 0.9 : 1.75, rx: -0.28, ry: TAU + 2.2, rz: -0.3, mood: 2.8 }),
    ],
    featuresOut: P({ x: m ? 0 : 0.3, y: m ? -0.9 : -0.7, s: m ? 0.6 : 0.8, rx: 0.4, ry: TAU + 3, rz: 0.2, mood: 3 }),
    stats: P({ x: m ? 0.42 : 0.7, y: m ? -0.46 : -0.08, s: m ? 0.62 : 0.74, rx: 0.08, ry: TAU * 1.5 + 0.4, rz: Math.PI / 2, mood: 3, sh: 0.5 }),
    closing: P({ x: 0, y: m ? 0.02 : -0.1, s: m ? 0.76 : 0.98, rx: 0.2, ry: TAU * 2 - 0.62, rz: 0.03, mood: 4, f: 1, sh: 0.85 }),
  };
}

export const rig: Pose = P({});

let tl: gsap.core.Timeline | null = null;
let hiddenRanges: [number, number][] = [];
let floatRanges: [number, number][] = [];

const docTop = (sel: string) => {
  const el = document.querySelector<HTMLElement>(sel);
  if (!el) return null;
  return el.getBoundingClientRect().top + window.scrollY;
};

export function buildChoreo() {
  const vh = window.innerHeight;
  // phones and portrait-ish windows (tablets, half-width browser) get the stacked composition
  const mobile = window.innerWidth < 768 || window.innerWidth / vh < 1.2;
  const p = poses(mobile);
  const feat = ScrollTrigger.getById("features");
  const gal = ScrollTrigger.getById("gallery");
  const manifesto = docTop("#manifesto");
  const manifestoEnd = (() => {
    const el = document.querySelector<HTMLElement>("#manifesto");
    return el ? el.getBoundingClientRect().bottom + window.scrollY : null;
  })();
  const stats = docTop("#stats");
  const closing = docTop("#closing");
  const max = ScrollTrigger.maxScroll(window);

  if (!feat || !gal || manifesto == null || manifestoEnd == null || stats == null || closing == null) {
    return false;
  }

  // [scrollPx, pose]
  const keys: [number, Pose][] = [];
  keys.push([0, p.hero]);
  keys.push([Math.min(vh * 0.55, manifesto * 0.6), p.heroOut]);
  keys.push([manifesto, p.manifestoIn]);
  keys.push([Math.max(manifesto + 1, manifestoEnd - vh), p.manifestoOut]);

  if (mobile) {
    const exit = feat.start - vh * 0.35;
    if (exit > manifestoEnd - vh + vh * 0.2) {
      keys.push([exit - vh * 0.25, p.featuresEntry]);
      keys.push([exit, p.featuresEntry]);
    }
  }

  const seg = (feat.end - feat.start) / p.features.length;
  p.features.forEach((pose, i) => {
    const a = feat.start + seg * i;
    // arrive early in the segment, hold, then travel into the next
    keys.push([i === 0 ? feat.start : a + seg * 0.18, pose]);
    keys.push([a + seg * 0.72, pose]);
  });
  keys.push([gal.start, p.featuresOut]);
  keys.push([gal.end, p.featuresOut]);
  keys.push([Math.min(stats + vh * 0.35, closing - vh * 0.5), p.stats]);
  keys.push([Math.min(closing + vh * 0.1, max), p.closing]);
  keys.push([max + 1, p.closing]);

  // strictly increasing
  for (let i = 1; i < keys.length; i++) {
    if (keys[i][0] <= keys[i - 1][0]) keys[i][0] = keys[i - 1][0] + 1;
  }

  tl?.kill();
  tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
  tl.set(rig, { ...keys[0][1] }, 0);
  for (let i = 1; i < keys.length; i++) {
    const [t0, from] = keys[i - 1];
    const [t1, to] = keys[i];
    tl.fromTo(rig, { ...from }, { ...to, duration: t1 - t0, immediateRender: false }, t0);
  }
  // a fresh timeline already sits at time 0, so tl.time(0) would render nothing:
  // park the playhead at the end so the first sample() always renders.
  tl.time(tl.duration(), true);

  // The gallery is an opaque layer above the canvas: while it fully covers
  // the viewport there is nothing to draw, so the render loop sleeps.
  hiddenRanges = [[gal.start + 2, gal.end - 2]];
  floatRanges = [
    [-Infinity, vh * 0.9],
    [closing - vh * 0.4, Infinity],
  ];
  return true;
}

export function sample(scrollY: number) {
  if (!tl) return rig;
  tl.time(Math.max(0, Math.min(scrollY, tl.duration())), false);
  return rig;
}

export function isHidden(scrollY: number) {
  return hiddenRanges.some(([a, b]) => scrollY > a && scrollY < b);
}

export function wantsFloat(scrollY: number) {
  return floatRanges.some(([a, b]) => scrollY > a && scrollY < b);
}

export function choreoReady() {
  return tl !== null;
}
