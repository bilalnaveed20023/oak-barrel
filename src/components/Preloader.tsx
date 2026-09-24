"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReduced } from "@/lib/motion";
import { lockScroll, markReady, onSceneReady } from "@/lib/app";

const MAX_MS = 2000;

/**
 * Counts 0 → 100 against real readiness (fonts + first WebGL frame), never
 * longer than 2s. If everything is ready early the count simply finishes
 * fast, then the curtain lifts into the hero.
 */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current!;
    lockScroll(true);
    const start = performance.now();
    const state = { v: 0 };
    let fontsDone = false;
    let sceneDone = false;
    let finished = false;

    document.fonts.ready.then(() => (fontsDone = true));
    const offScene = onSceneReady(() => (sceneDone = true));

    const render = () => {
      const v = Math.round(state.v);
      if (num.current) num.current.textContent = String(v).padStart(3, "0");
      if (bar.current) bar.current.style.transform = `scaleX(${state.v / 100})`;
    };

    const reduced = prefersReduced();

    const finish = () => {
      if (finished) return;
      finished = true;
      gsap.ticker.remove(tick);
      const tl = gsap.timeline({
        onComplete: () => {
          el.style.display = "none";
        },
      });
      tl.to(state, { v: 100, duration: 0.35, ease: "power2.out", onUpdate: render });
      if (reduced) {
        tl.to(el, { autoAlpha: 0, duration: 0.5, ease: "power1.out", onStart: () => { lockScroll(false); markReady(); } });
        return;
      }
      tl.to(el.querySelectorAll("[data-pl-line]"), { yPercent: -110, rotate: -3, duration: 0.9, stagger: 0.06, ease: "expo.in" }, "+=0.1")
        .to(el.querySelector("[data-pl-panel='a']"), { yPercent: -100, duration: 1.2, ease: "expo.inOut" }, "-=0.35")
        .to(el.querySelector("[data-pl-panel='b']"), { yPercent: -100, duration: 1.2, ease: "expo.inOut" }, "<0.08")
        .add(() => {
          lockScroll(false);
          markReady();
        }, "<0.45");
    };

    const tick = () => {
      const elapsed = performance.now() - start;
      const ready = fontsDone && sceneDone;
      // time-based floor so the count always moves, readiness-based ceiling
      const byTime = Math.min(92, (elapsed / MAX_MS) * 100 * 1.05);
      const target = ready ? 100 : byTime;
      state.v += (target - state.v) * (ready ? 0.16 : 0.08);
      render();
      if ((ready && state.v > 99.2) || elapsed > MAX_MS) finish();
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      offScene();
    };
  }, []);

  return (
    <div ref={root} className="preloader" role="status" aria-label="Loading The Oak Barrel">
      <div className="preloader__panel preloader__panel--b" data-pl-panel="b" />
      <div className="preloader__panel" data-pl-panel="a">
        <div className="preloader__top">
          <span className="mask"><span className="eyebrow" data-pl-line>The Oak Barrel</span></span>
          <span className="mask"><span className="eyebrow" data-pl-line>Wyandotte, Michigan</span></span>
        </div>
        <div className="preloader__bottom">
          <span className="mask">
            <span className="preloader__num display" data-pl-line>
              <span ref={num}>000</span>
            </span>
          </span>
          <span className="preloader__bar">
            <span ref={bar} />
          </span>
          <span className="mask preloader__note"><span className="eyebrow" data-pl-line>Pouring the first round</span></span>
        </div>
      </div>
    </div>
  );
}
