"use client";

import { useRef } from "react";
import { revealLines, revealMasked, useSectionMotion } from "@/lib/reveal";
import { HOURS_LIST, SITE } from "@/lib/content";
import Magnetic from "../ui/Magnetic";
import RollLabel from "../ui/RollLabel";

export default function Closing() {
  const ref = useRef<HTMLElement>(null);

  useSectionMotion(ref, (c, root) => {
    const trig = { trigger: root, start: "top 55%", once: true };
    revealMasked(root.querySelectorAll("[data-cl]"), c, { scrollTrigger: trig, stagger: 0.1 });
    revealMasked(root.querySelectorAll("[data-cmeta]"), c, { scrollTrigger: { trigger: root, start: "top 40%", once: true }, stagger: 0.05, duration: 1.1 });
    revealLines(root.querySelectorAll("[data-ccopy]"), c, { trigger: root, start: "top 45%" });
  });

  return (
    <section ref={ref} id="closing" className="closing" aria-labelledby="closing-title">
      <span className="mask closing__eyebrow"><span className="eyebrow" data-cl>(05) Reservations & private events</span></span>
      <h2 id="closing-title" className="closing__title display">
        <span className="mask closing__l1"><span data-cl>Gather</span></span>
        <span className="mask closing__l2"><span data-cl><em>the group.</em></span></span>
      </h2>

      <div className="closing__cta">
        <p className="closing__copy" data-ccopy>
          Tables, birthdays, bottle service or the whole room — call and we’ll have it ready.
        </p>
        <div className="closing__buttons">
          <Magnetic strength={0.4} radius={110}>
            <a className="btn btn--lg" href={SITE.tel}>
              <RollLabel>Book your table</RollLabel>
              <span className="btn__arrow" aria-hidden="true">→</span>
            </a>
          </Magnetic>
          <a className="ulink eyebrow closing__dir" href={SITE.maps} target="_blank" rel="noopener noreferrer">
            Get directions ↗
          </a>
        </div>
      </div>

      <dl className="closing__hours">
        {HOURS_LIST.map((h) => (
          <div key={h.days} className="closing__row">
            <dt className="mask"><span className="eyebrow" data-cmeta>{h.days}</span></dt>
            <dd className="mask"><span data-cmeta>{h.time}</span></dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
