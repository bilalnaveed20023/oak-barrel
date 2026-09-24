"use client";

import { useEffect, useRef, useState } from "react";
import { app, onReady, scrollToTarget } from "@/lib/app";
import { gsap, prefersReduced } from "@/lib/motion";
import { SITE } from "@/lib/content";
import Magnetic from "./ui/Magnetic";
import RollLabel from "./ui/RollLabel";

const LINKS = [
  { href: "#features", label: "Drinks" },
  { href: "#gallery", label: "Gallery" },
  { href: "#stats", label: "Nights" },
  { href: "#closing", label: "Visit" },
];

export default function Nav() {
  const bar = useRef<HTMLElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  // hide on scroll down, return on scroll up
  useEffect(() => {
    const el = bar.current!;
    let last = 0;
    let hidden = false;
    gsap.set(el, { yPercent: -120, visibility: "visible" });
    const off = onReady(() => {
      gsap.to(el, { yPercent: 0, duration: 1.3, delay: 0.5, ease: "expo.out" });
    });
    const onScroll = () => {
      const y = window.scrollY;
      const down = y > last && y > 120;
      if (down !== hidden && !document.documentElement.classList.contains("menu-open")) {
        hidden = down;
        gsap.to(el, { yPercent: down ? -120 : 0, duration: 0.8, ease: "expo.out", overwrite: "auto" });
      }
      el.classList.toggle("nav--solid", y > 40);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      off();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const ov = overlay.current!;
    const items = ov.querySelectorAll("[data-menu-line]");
    const html = document.documentElement;
    if (open) {
      html.classList.add("menu-open");
      app.lenis?.stop();
      gsap.set(ov, { visibility: "visible" });
      gsap.fromTo(ov, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "expo.out" });
      gsap.fromTo(items, { yPercent: 120, rotate: 4 }, { yPercent: 0, rotate: 0, duration: 1.2, stagger: 0.07, delay: 0.15, ease: "expo.out" });
      const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
      window.addEventListener("keydown", esc);
      return () => window.removeEventListener("keydown", esc);
    } else if (html.classList.contains("menu-open")) {
      html.classList.remove("menu-open");
      app.lenis?.start();
      gsap.to(ov, {
        clipPath: "inset(0% 0% 100% 0%)",
        duration: prefersReduced() ? 0.01 : 0.8,
        ease: "expo.out",
        onComplete: () => {
          gsap.set(ov, { visibility: "hidden" });
        },
      });
    }
  }, [open]);

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    window.setTimeout(() => scrollToTarget(href), open ? 350 : 0);
  };

  return (
    <>
      <header ref={bar} className="nav">
        <a href="#top" className="nav__brand" onClick={go("#top")} aria-label="The Oak Barrel — back to top">
          <span className="display">The Oak</span>
          <span className="nav__brand-small eyebrow">Barrel</span>
        </a>
        <nav className="nav__links" aria-label="Primary">
          {LINKS.map((l, i) => (
            <a key={l.href} href={l.href} onClick={go(l.href)} className="ulink">
              <span className="nav__idx">0{i + 1}</span>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="nav__cta">
          <Magnetic strength={0.3}>
            <a className="btn btn--sm" href={SITE.tel}>
              <RollLabel>Reserve</RollLabel>
            </a>
          </Magnetic>
          <button
            className="nav__menu"
            aria-expanded={open}
            aria-controls="menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="roll" style={{ height: "1.2em" }}>
              <span className={`roll__track ${open ? "is-rolled" : ""}`}>
                <span className="roll__a">Menu</span>
                <span className="roll__b">Close</span>
              </span>
            </span>
          </button>
        </div>
      </header>

      <div ref={overlay} id="menu" className="menu" role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={!open}>
        <nav className="menu__links">
          {LINKS.map((l, i) => (
            <a key={l.href} href={l.href} onClick={go(l.href)} tabIndex={open ? 0 : -1}>
              <span className="mask">
                <span data-menu-line className="menu__item display">
                  <em className="eyebrow">0{i + 1}</em>
                  {l.label}
                </span>
              </span>
            </a>
          ))}
        </nav>
        <div className="menu__foot">
          <span className="mask"><span data-menu-line className="eyebrow">{SITE.street}, {SITE.city}</span></span>
          <span className="mask"><a data-menu-line className="eyebrow" href={SITE.tel} tabIndex={open ? 0 : -1}>{SITE.phone}</a></span>
        </div>
      </div>
    </>
  );
}
