"use client";

import { useRef } from "react";
import { gsap } from "@/lib/motion";
import { parallax, revealLines, revealMasked, useSectionMotion } from "@/lib/reveal";
import { STATS } from "@/lib/content";

export default function Stats() {
  const ref = useRef<HTMLElement>(null);

  useSectionMotion(ref, (c, root) => {
    revealMasked(root.querySelectorAll("[data-shead]"), c, { scrollTrigger: { trigger: root, start: "top 75%", once: true } });
    parallax(root, c);
    gsap.utils.toArray<HTMLElement>("[data-stat]", root).forEach((el) => {
      const num = el.querySelector<HTMLElement>("[data-num]")!;
      const target = Number(num.dataset.num);
      const trig = { trigger: el, start: "top 82%", once: true };
      revealLines(el.querySelectorAll("[data-slabel]"), c, { trigger: el, start: "top 82%" });
      if (c.reduced) {
        num.textContent = String(target);
        return;
      }
      gsap.from(el.querySelector("[data-srule]"), { scaleX: 0, transformOrigin: "0% 50%", duration: 1.4, ease: "expo.out", scrollTrigger: trig });
      gsap.from(el.querySelector("[data-snum]"), { yPercent: 100, rotate: 4, transformOrigin: "0% 100%", duration: 1.4, ease: "expo.out", scrollTrigger: trig });
      const o = { v: 0 };
      num.textContent = "0";
      gsap.to(o, {
        v: target,
        duration: target > 20 ? 2.2 : 1.6,
        ease: "expo.out",
        scrollTrigger: trig,
        onUpdate: () => (num.textContent = String(Math.round(o.v))),
      });
    });
  });

  return (
    <section ref={ref} id="stats" className="stats" aria-labelledby="stats-title" data-speed-trigger>
      <span className="stats__ghost display" data-speed="0.86" aria-hidden="true">Oak</span>
      <div className="stats__head">
        <span className="mask"><span className="eyebrow" data-shead>(04) By the numbers</span></span>
        <h2 id="stats-title" className="stats__title display">
          <span className="mask"><span data-shead>A few figures</span></span>
          <span className="mask"><span data-shead><em>worth knowing.</em></span></span>
        </h2>
      </div>
      <ul className="stats__grid">
        {STATS.map((s, i) => (
          <li key={i} className={`stat stat--${i}`} data-stat>
            <span className="stat__rule" data-srule aria-hidden="true" />
            <span className="mask stat__mask">
              <span className="stat__num display" data-snum aria-label={`${s.prefix}${s.value}${s.suffix}`}>
                <span aria-hidden="true">
                  {s.prefix && <span className="stat__affix">{s.prefix}</span>}
                  <span data-num={s.value}>{s.value}</span>
                  {s.suffix && <span className="stat__affix">{s.suffix}</span>}
                </span>
              </span>
            </span>
            <p className="stat__label" data-slabel>{s.label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
