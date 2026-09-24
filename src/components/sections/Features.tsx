"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/motion";
import { revealMasked, useSectionMotion } from "@/lib/reveal";
import { FEATURES } from "@/lib/content";
import { scrollToTarget } from "@/lib/app";

/**
 * Pinned. Four features cycle as the section holds; the barrel (driven by
 * the master choreography) turns to a new angle for each one.
 */
export default function Features() {
  const ref = useRef<HTMLElement>(null);

  useSectionMotion(ref, (c, root) => {
    const panels = gsap.utils.toArray<HTMLElement>("[data-feature]", root);
    const idxItems = gsap.utils.toArray<HTMLElement>("[data-index-item]", root);
    const counter = root.querySelector<HTMLElement>("[data-counter]")!;
    const bar = root.querySelector<HTMLElement>("[data-progress]")!;
    const partsOf = (p: HTMLElement) => ({
      lines: p.querySelectorAll("[data-fl]"),
      body: p.querySelectorAll("[data-fb]"),
      rule: p.querySelector("[data-frule]"),
    });

    revealMasked(root.querySelectorAll("[data-fhead]"), c, { scrollTrigger: { trigger: root, start: "top 75%", once: true } });

    if (c.reduced) {
      ScrollTrigger.create({ id: "features", trigger: root, start: "top top", end: "bottom bottom" });
      panels.forEach((p) => gsap.from(p, { opacity: 0, duration: 0.8, ease: "power1.out", scrollTrigger: { trigger: p, start: "top 85%", once: true } }));
      return;
    }

    // everything but the first panel starts below its mask
    panels.forEach((p, i) => {
      const { lines, body, rule } = partsOf(p);
      gsap.set(p, { autoAlpha: i === 0 ? 1 : 0 });
      gsap.set([...lines, ...body], { yPercent: 118, rotate: 3, transformOrigin: "0% 100%" });
      gsap.set(rule, { scaleX: 0, transformOrigin: "0% 50%" });
    });

    let current = -1;
    const show = (next: number) => {
      if (next === current) return;
      const dir = next > current ? 1 : -1;
      const prev = current;
      current = next;
      counter.textContent = FEATURES[next].n;
      idxItems.forEach((el, i) => el.classList.toggle("is-active", i === next));
      if (prev >= 0) {
        const o = partsOf(panels[prev]);
        gsap.to([...o.lines, ...o.body], { yPercent: -118 * dir, rotate: -3 * dir, duration: 0.8, stagger: 0.04, ease: "expo.out", overwrite: true });
        gsap.to(o.rule, { scaleX: 0, transformOrigin: dir > 0 ? "100% 50%" : "0% 50%", duration: 0.7, ease: "expo.out", overwrite: true });
        gsap.set(panels[prev], { autoAlpha: 0, delay: 0.8 });
      }
      const n = partsOf(panels[next]);
      gsap.set(panels[next], { autoAlpha: 1, overwrite: true });
      gsap.fromTo(
        [...n.lines, ...n.body],
        { yPercent: 118 * dir, rotate: 3 * dir },
        { yPercent: 0, rotate: 0, duration: 1.3, stagger: 0.075, delay: prev >= 0 ? 0.18 : 0, ease: "expo.out", overwrite: true }
      );
      gsap.fromTo(n.rule, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 1.4, delay: 0.3, ease: "expo.out", overwrite: true });
    };

    ScrollTrigger.create({
      trigger: root,
      start: "top 55%",
      once: true,
      onEnter: () => show(0),
    });

    ScrollTrigger.create({
      id: "features",
      trigger: root,
      start: "top top",
      end: () => "+=" + window.innerHeight * (c.mobile ? 3 : 3.4),
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate(self) {
        bar.style.transform = `scaleX(${self.progress})`;
        const i = Math.min(FEATURES.length - 1, Math.floor(self.progress * FEATURES.length));
        show(i);
      },
    });
  });

  const jump = (i: number) => {
    const st = ScrollTrigger.getById("features");
    if (!st) return;
    const seg = (st.end - st.start) / FEATURES.length;
    scrollToTarget(st.start + seg * (i + 0.45));
  };

  return (
    <section ref={ref} id="features" className="features" aria-label="What we pour">
      <div className="features__head">
        <span className="mask"><span className="eyebrow" data-fhead>(02) What we pour</span></span>
        <span className="mask features__count">
          <span className="eyebrow" data-fhead>
            <span data-counter>01</span> / 0{FEATURES.length}
          </span>
        </span>
        <span className="features__bar" aria-hidden="true"><span data-progress /></span>
      </div>

      <div className="features__panels">
        {FEATURES.map((f) => (
          <article key={f.n} className="feature" data-feature>
            <span className="mask"><span className="eyebrow feature__eyebrow" data-fb>{f.n} — {f.eyebrow}</span></span>
            <h2 className="feature__title display">
              {f.title.map((t, i) => (
                <span key={t} className="mask">
                  <span data-fl>{i === f.italic ? <em>{t}</em> : t}</span>
                </span>
              ))}
            </h2>
            <span className="feature__rule" data-frule aria-hidden="true" />
            <span className="mask"><p className="feature__body" data-fb>{f.body}</p></span>
            <span className="mask">
              <ul className="feature__detail" data-fb>
                {f.detail.map((d) => (
                  <li key={d} className="eyebrow">{d}</li>
                ))}
              </ul>
            </span>
          </article>
        ))}
      </div>

      <ol className="features__index" aria-label="Features">
        {FEATURES.map((f, i) => (
          <li key={f.n} data-index-item>
            <button type="button" onClick={() => jump(i)} className="eyebrow">
              <span>{f.n}</span> {f.eyebrow}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
