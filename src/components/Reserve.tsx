"use client";

import { useEffect, useRef, useState } from "react";
import { app } from "@/lib/app";
import { gsap, prefersReduced } from "@/lib/motion";
import { HOURS_LIST, OPENTABLE, SITE, openTableLoaderUrl } from "@/lib/content";

/**
 * Reservation panel. Opens from any "Reserve" button via openReserve().
 * OpenTable's loader script is only fetched the first time the panel opens,
 * so the third-party script never slows the first visit.
 */
export default function Reserve() {
  const root = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const live = Boolean(OPENTABLE.rid);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("oak:reserve", onOpen);
    return () => window.removeEventListener("oak:reserve", onOpen);
  }, []);

  // inject OpenTable's loader once; it inserts its iframe right before the script tag
  useEffect(() => {
    const el = slot.current;
    if (!open || !el || el.dataset.loaded) return;
    el.dataset.loaded = "1";
    const s = document.createElement("script");
    s.src = openTableLoaderUrl(OPENTABLE.rid ?? OPENTABLE.previewRid);
    s.async = true;
    el.appendChild(s);
  }, [open]);

  useEffect(() => {
    const el = root.current!;
    const panel = el.querySelector<HTMLElement>("[data-panel]")!;
    const lines = el.querySelectorAll("[data-rline]");
    const reduced = prefersReduced();
    if (open) {
      lastFocus.current = document.activeElement as HTMLElement;
      app.lenis?.stop();
      document.documentElement.style.overflow = "hidden";
      gsap.set(el, { visibility: "visible" });
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: reduced ? 0.2 : 0.5, ease: "power2.out" });
      if (!reduced) {
        gsap.fromTo(panel, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "expo.out" });
        gsap.fromTo(lines, { yPercent: 118, rotate: 3 }, { yPercent: 0, rotate: 0, duration: 1.2, stagger: 0.07, delay: 0.15, ease: "expo.out" });
      }
      closeBtn.current?.focus({ preventScroll: true });
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
    if (el.style.visibility === "visible") {
      gsap.to(el, {
        opacity: 0,
        duration: reduced ? 0.15 : 0.45,
        ease: "power2.out",
        onComplete: () => {
          gsap.set(el, { visibility: "hidden" });
        },
      });
      document.documentElement.style.overflow = "";
      app.lenis?.start();
      lastFocus.current?.focus({ preventScroll: true });
    }
  }, [open]);

  return (
    <div
      ref={root}
      className="reserve"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reserve-title"
      aria-hidden={!open}
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div className="reserve__panel" data-panel>
        <button ref={closeBtn} className="reserve__close eyebrow" onClick={() => setOpen(false)} aria-label="Close reservations">
          Close <span aria-hidden="true">✕</span>
        </button>

        <div className="reserve__copy">
          <span className="mask"><span className="eyebrow reserve__eyebrow" data-rline>Reservations · {SITE.street}</span></span>
          <h2 id="reserve-title" className="reserve__title display">
            <span className="mask"><span data-rline>Hold a table</span></span>
            <span className="mask"><span data-rline><em>for tonight.</em></span></span>
          </h2>
          <span className="mask">
            <p className="reserve__note" data-rline>
              Booths, bar seats and the velvet corner. For parties of 8 or more, bottle service or private events, call us and we’ll set it up.
            </p>
          </span>
          <span className="mask">
            <a className="ulink reserve__call" href={SITE.tel} data-rline>
              {SITE.phone}
            </a>
          </span>
          <dl className="reserve__hours">
            {HOURS_LIST.map((h) => (
              <div key={h.days}>
                <dt className="eyebrow">{h.days}</dt>
                <dd>{h.time}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="reserve__widget">
          <div className="reserve__frame">
            <div ref={slot} className="reserve__slot" />
            {!live && (
              <a className="reserve__guard" href={SITE.tel}>
                <span className="eyebrow">Preview</span>
                <span className="reserve__guard-title display">Online booking opens soon</span>
                <span className="reserve__guard-cta">Call {SITE.phone} to reserve</span>
              </a>
            )}
          </div>
          <span className="eyebrow reserve__powered">Reservations by OpenTable</span>
        </div>
      </div>
    </div>
  );
}
