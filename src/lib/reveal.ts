"use client";

import { useEffect, type RefObject } from "react";
import { gsap, mq, ScrollTrigger, SplitText, DUR, STAGGER } from "./motion";
import { onReady } from "./app";

type Ctx = { motion: boolean; reduced: boolean; mobile: boolean };

/**
 * Scoped GSAP setup for a section. Runs after the preloader lifts, inside a
 * matchMedia context so reduced-motion gets its own (fade-only) branch and
 * everything is reverted on unmount / breakpoint change.
 */
export function useSectionMotion(scope: RefObject<HTMLElement | null>, setup: (c: Ctx, root: HTMLElement) => void | (() => void), deps: unknown[] = []) {
  useEffect(() => {
    const root = scope.current;
    if (!root) return;
    let mm: gsap.MatchMedia | null = null;
    const off = onReady(() => {
      mm = gsap.matchMedia(root);
      mm.add({ motion: mq.motion, reduced: mq.reduced, mobile: mq.mobile }, (ctx) => {
        const c = ctx.conditions as Ctx;
        return setup(c, root);
      });
    });
    return () => {
      off();
      mm?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Masked line reveal: y-translate + slight rotation, staggered. */
export function revealLines(
  targets: gsap.DOMTarget,
  c: Ctx,
  opts: { trigger?: Element; start?: string; delay?: number; stagger?: number; immediate?: boolean } = {}
) {
  const els = gsap.utils.toArray<HTMLElement>(targets);
  return els.map((el) =>
    SplitText.create(el, {
      type: "lines",
      mask: "lines",
      linesClass: "split-line",
      autoSplit: true,
      onSplit(self) {
        if (c.reduced) {
          return gsap.from(self.lines, {
            opacity: 0,
            duration: 0.6,
            ease: "power1.out",
            scrollTrigger: opts.immediate ? undefined : { trigger: opts.trigger ?? el, start: opts.start ?? "top 88%", once: true },
          });
        }
        return gsap.from(self.lines, {
          yPercent: 118,
          rotate: 3.5,
          transformOrigin: "0% 100%",
          duration: DUR.reveal,
          stagger: opts.stagger ?? STAGGER.line,
          delay: opts.delay ?? 0,
          ease: "expo.out",
          scrollTrigger: opts.immediate ? undefined : { trigger: opts.trigger ?? el, start: opts.start ?? "top 88%", once: true },
        });
      },
    })
  );
}

/** Pre-split masked elements ([data-line] inside a .mask) */
export function revealMasked(targets: gsap.TweenTarget, c: Ctx, vars: gsap.TweenVars = {}) {
  if (c.reduced) return gsap.from(targets, { opacity: 0, duration: 0.6, ease: "power1.out", ...pick(vars, ["scrollTrigger", "delay"]) });
  return gsap.from(targets, {
    yPercent: 118,
    rotate: 4,
    transformOrigin: "0% 100%",
    duration: DUR.long,
    stagger: STAGGER.line,
    ease: "expo.out",
    ...vars,
  });
}

/** Clip-path wipe + inner scale-from-1.15 for images. */
export function revealImage(frame: HTMLElement, c: Ctx, trigger?: Element) {
  const img = frame.querySelector("[data-img]");
  if (c.reduced) {
    return gsap.from(frame, { opacity: 0, duration: 0.8, ease: "power1.out", scrollTrigger: { trigger: trigger ?? frame, start: "top 90%", once: true } });
  }
  const tl = gsap.timeline({ scrollTrigger: { trigger: trigger ?? frame, start: "top 88%", once: true } });
  tl.fromTo(frame, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.out" });
  if (img) tl.fromTo(img, { scale: 1.15 }, { scale: 1, duration: 1.8, ease: "expo.out" }, 0);
  return tl;
}

/** data-speed parallax: 0.85 drifts slower than scroll, 1.15 faster. */
export function parallax(root: HTMLElement, c: Ctx) {
  if (c.reduced) return;
  root.querySelectorAll<HTMLElement>("[data-speed]").forEach((el) => {
    const speed = parseFloat(el.dataset.speed || "1");
    const amt = (1 - speed) * (c.mobile ? 0.6 : 1);
    gsap.fromTo(
      el,
      { y: () => -amt * window.innerHeight * 0.5 },
      {
        y: () => amt * window.innerHeight * 0.5,
        ease: "none",
        scrollTrigger: {
          trigger: el.closest("[data-speed-trigger]") ?? el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true,
        },
      }
    );
  });
}

function pick<T extends object>(o: T, keys: string[]) {
  const out: Record<string, unknown> = {};
  keys.forEach((k) => {
    if (k in o) out[k] = (o as Record<string, unknown>)[k];
  });
  return out as Partial<T>;
}

export { ScrollTrigger };
