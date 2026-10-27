"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, SplitText } from "@/lib/motion";
import { parallax, revealImage, revealMasked, useSectionMotion } from "@/lib/reveal";
import { asset } from "@/lib/content";

/** Words reveal one-by-one, scrubbed to scroll (opacity + blur + lift). */
export default function Manifesto() {
  const ref = useRef<HTMLElement>(null);

  useSectionMotion(ref, (c, root) => {
    const text = root.querySelector<HTMLElement>("[data-manifesto]")!;
    revealMasked(root.querySelectorAll("[data-eyebrow]"), c, { scrollTrigger: { trigger: root, start: "top 80%", once: true } });
    revealImage(root.querySelector<HTMLElement>("[data-frame]")!, c);
    parallax(root, c);

    const split = SplitText.create(text, { type: "words", wordsClass: "mword" });
    if (c.reduced) {
      gsap.from(text, { opacity: 0, duration: 0.8, ease: "power1.out", scrollTrigger: { trigger: text, start: "top 80%", once: true } });
      return () => split.revert();
    }
    gsap.fromTo(
      split.words,
      { opacity: 0.1, filter: c.mobile ? "blur(0px)" : "blur(8px)", yPercent: 18 },
      {
        opacity: 1,
        filter: "blur(0px)",
        yPercent: 0,
        ease: "none",
        stagger: 0.08,
        scrollTrigger: {
          trigger: text,
          start: "top 78%",
          end: "bottom 55%",
          scrub: true,
        },
      }
    );
    return () => split.revert();
  });

  return (
    <section ref={ref} id="manifesto" className="manifesto" data-speed-trigger>
      <div className="manifesto__side">
        <span className="mask"><span className="eyebrow" data-eyebrow>(01)</span></span>
        <span className="mask"><span className="eyebrow" data-eyebrow>The room</span></span>
      </div>
      <p className="manifesto__text display front" data-manifesto>
        Down on Oak Street there’s a room of dark wood, <em>green velvet</em> and low <em className="gold">gold light</em> — where the pour is patient, the band plays late, and nobody is in a hurry to call it a night.
      </p>
      <p className="manifesto__sign eyebrow front">Cheers to unforgettable moments.</p>
      <figure className="manifesto__img" data-speed="1.14">
        <div className="frame" data-frame>
          <div className="frame__inner" data-img>
            <Image src={asset("/img/the-lounge.jpg")} alt="The Oak Barrel lounge: green velvet chairs, gold chandeliers and the long wooden bar" fill sizes="(max-width: 767px) 52vw, 22vw" />
          </div>
        </div>
        <figcaption className="eyebrow">The lounge</figcaption>
      </figure>
    </section>
  );
}
