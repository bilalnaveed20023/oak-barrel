"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/motion";
import { revealLines, revealMasked, useSectionMotion } from "@/lib/reveal";
import { SITE, openStatus } from "@/lib/content";

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const [status, setStatus] = useState<{ open: boolean; text: string } | null>(null);

  useEffect(() => {
    const update = () => setStatus(openStatus());
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, []);

  useSectionMotion(ref, (c, root) => {
    const lines = root.querySelectorAll("[data-hero-line]");
    revealMasked(lines, c, { delay: 0.15, stagger: 0.1, duration: 1.4 });
    revealMasked(root.querySelectorAll("[data-hero-meta]"), c, { delay: 0.55, stagger: 0.06, duration: 1.2 });
    revealLines(root.querySelectorAll("[data-hero-copy]"), c, { immediate: true, delay: 0.7 });
    if (c.reduced) return;
    gsap.from(root.querySelectorAll("[data-hero-rule]"), { scaleX: 0, transformOrigin: "0% 50%", duration: 1.6, delay: 0.5, ease: "expo.out" });

    // the display type sinks and separates as the barrel lifts away
    gsap.to(root.querySelectorAll(".hero__title > .mask"), {
      yPercent: (i) => [-18, -34, -52][i] ?? -30,
      ease: "none",
      scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(root.querySelector("[data-hero-scroll]"), {
      opacity: 0,
      y: 30,
      ease: "none",
      scrollTrigger: { trigger: root, start: "top top", end: "25% top", scrub: true },
    });
  });

  return (
    <section ref={ref} id="top" className="hero" aria-labelledby="hero-title">
      <div className="hero__meta">
        <span className="mask"><span className="eyebrow" data-hero-meta>{SITE.street} — {SITE.city}, Michigan</span></span>
        <span className="mask hero__status">
          <span className="eyebrow" data-hero-meta>
            <i className={`dot ${status?.open ? "dot--on" : ""}`} aria-hidden="true" />
            {status?.text ?? " "}
          </span>
        </span>
      </div>

      <h1 id="hero-title" className="hero__title display">
        <span className="mask hero__l1"><span data-hero-line>Every sip,</span></span>
        <span className="mask hero__l2"><span data-hero-line>every <em>moment</em></span></span>
        <span className="mask hero__l3"><span data-hero-line>matters.</span></span>
      </h1>

      <div className="hero__foot">
        <div className="hero__scroll" data-hero-scroll>
          <span className="hero__scroll-track" aria-hidden="true"><i /></span>
          <span className="eyebrow">Scroll</span>
        </div>
        <span className="hero__rule" data-hero-rule aria-hidden="true" />
        <p className="hero__copy" data-hero-copy>
          Handcrafted cocktails, exclusive distillates and fine wines — in a room of dark oak and green velvet on Oak Street.
        </p>
        <span className="mask hero__coords"><span className="eyebrow" data-hero-meta>{SITE.coords}</span></span>
      </div>
    </section>
  );
}
