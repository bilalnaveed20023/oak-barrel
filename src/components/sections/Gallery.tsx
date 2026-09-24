"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, ScrollTrigger, mq } from "@/lib/motion";
import { revealLines, revealMasked, useSectionMotion } from "@/lib/reveal";
import { GALLERY, SITE, asset } from "@/lib/content";

/**
 * Vertical scroll → horizontal track. Each photo parallaxes inside its
 * frame against the track (containerAnimation), and tilts toward the cursor.
 */
export default function Gallery() {
  const ref = useRef<HTMLElement>(null);

  useSectionMotion(ref, (c, root) => {
    const track = root.querySelector<HTMLElement>("[data-track]")!;
    const cards = gsap.utils.toArray<HTMLElement>("[data-card]", root);
    revealMasked(root.querySelectorAll("[data-gtitle]"), c, { scrollTrigger: { trigger: root, start: "top 70%", once: true } });
    revealLines(root.querySelectorAll("[data-gcopy]"), c, { trigger: root, start: "top 60%" });

    if (c.reduced) {
      ScrollTrigger.create({ id: "gallery", trigger: root, start: "top top", end: "bottom top" });
      return;
    }

    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const scrollTween = gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        id: "gallery",
        trigger: root,
        start: "top top",
        end: () => "+=" + distance(),
        pin: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    cards.forEach((card) => {
      const frame = card.querySelector<HTMLElement>("[data-frame]")!;
      const img = card.querySelector<HTMLElement>("[data-img]")!;
      const cap = card.querySelectorAll("[data-cap]");
      // image travels against the track: 0.85x → 1.15x feel
      gsap.fromTo(
        img,
        { xPercent: -9 },
        { xPercent: 9, ease: "none", scrollTrigger: { trigger: card, containerAnimation: scrollTween, start: "left right", end: "right left", scrub: true } }
      );
      const tl = gsap.timeline({
        scrollTrigger: { trigger: card, containerAnimation: scrollTween, start: "left 92%", once: true },
      });
      tl.fromTo(frame, { clipPath: "inset(0% 0% 0% 100%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.out" })
        .fromTo(img, { scale: 1.15 }, { scale: 1, duration: 1.8, ease: "expo.out" }, 0)
        .from(cap, { yPercent: 118, rotate: 3, duration: 1.2, stagger: 0.08, ease: "expo.out" }, 0.25);
    });

    // cursor tilt, 2–3°, fine pointers only
    if (window.matchMedia(mq.fine).matches) {
      const offs = cards.map((card) => {
        const frame = card.querySelector<HTMLElement>("[data-tilt]")!;
        const rx = gsap.quickTo(frame, "rotationX", { duration: 0.8, ease: "expo.out" });
        const ry = gsap.quickTo(frame, "rotationY", { duration: 0.8, ease: "expo.out" });
        const move = (e: PointerEvent) => {
          const r = frame.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          ry(px * 5);
          rx(-py * 5);
        };
        const leave = () => {
          rx(0);
          ry(0);
        };
        card.addEventListener("pointermove", move);
        card.addEventListener("pointerleave", leave);
        return () => {
          card.removeEventListener("pointermove", move);
          card.removeEventListener("pointerleave", leave);
        };
      });
      return () => offs.forEach((f) => f());
    }
  });

  return (
    <section ref={ref} id="gallery" className="gallery" aria-labelledby="gallery-title">
      <div className="gallery__track" data-track>
        <header className="gallery__intro">
          <span className="mask"><span className="eyebrow" data-gtitle>(03) From the bar</span></span>
          <h2 id="gallery-title" className="gallery__title display">
            <span className="mask"><span data-gtitle>Seen at</span></span>
            <span className="mask"><span data-gtitle><em>the Oak.</em></span></span>
          </h2>
          <p className="gallery__copy" data-gcopy>
            A few things that have crossed the bar lately. The rest you’ll have to see for yourself.
          </p>
        </header>

        {GALLERY.map((g, i) => (
          <figure key={g.src} className={`gcard gcard--${g.shape} gcard--${i % 2 ? "low" : "high"}`} data-card>
            <div className="gcard__tilt" data-tilt>
              <div className="frame gcard__frame" data-frame>
                <div className="gcard__img" data-img>
                  <Image src={asset(g.src)} alt={g.caption} fill sizes="(max-width: 767px) 80vw, 40vw" />
                </div>
              </div>
            </div>
            <figcaption className="gcard__cap">
              <span className="mask"><span className="eyebrow gcard__num" data-cap>{String(i + 1).padStart(2, "0")}</span></span>
              <span className="mask"><span className="gcard__title display" data-cap>{g.caption}</span></span>
              <span className="mask"><span className="eyebrow gcard__note" data-cap>{g.note}</span></span>
            </figcaption>
          </figure>
        ))}

        <div className="gallery__outro">
          <span className="eyebrow">More on Instagram</span>
          <a className="gallery__ig display ulink" href={SITE.instagram} target="_blank" rel="noopener noreferrer">
            @oakbarrelwyandotte
          </a>
        </div>
      </div>
    </section>
  );
}
