"use client";

import { useRef } from "react";
import { gsap } from "@/lib/motion";
import { useSectionMotion } from "@/lib/reveal";
import { SITE } from "@/lib/content";
import { scrollToTarget } from "@/lib/app";

const FillLink = ({ href, children, external }: { href: string; children: string; external?: boolean }) => (
  <a className="flink" href={href} data-text={children} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
    {children}
  </a>
);

export default function Footer() {
  const ref = useRef<HTMLElement>(null);

  useSectionMotion(ref, (c, root) => {
    const letters = root.querySelectorAll("[data-wm]");
    if (c.reduced) {
      gsap.from(letters, { opacity: 0, duration: 0.8, ease: "power1.out", scrollTrigger: { trigger: root, start: "top 80%", once: true } });
      return;
    }
    gsap.from(letters, {
      yPercent: 105,
      rotate: 6,
      transformOrigin: "0% 100%",
      duration: 1.4,
      stagger: 0.045,
      ease: "expo.out",
      scrollTrigger: { trigger: root.querySelector(".footer__wordmark"), start: "top 95%", once: true },
    });
  });

  const word = "Oak Barrel";

  return (
    <footer ref={ref} className="footer">
      <div className="footer__grid">
        <div className="footer__col">
          <span className="eyebrow footer__label">Find us</span>
          <address>
            <FillLink href={SITE.maps} external>{`${SITE.street}, ${SITE.city}, ${SITE.region}`}</FillLink>
          </address>
        </div>
        <div className="footer__col">
          <span className="eyebrow footer__label">Talk to us</span>
          <FillLink href={SITE.tel}>{SITE.phone}</FillLink>
          <FillLink href={`mailto:${SITE.email}`}>{SITE.email}</FillLink>
        </div>
        <div className="footer__col">
          <span className="eyebrow footer__label">Follow</span>
          <FillLink href={SITE.instagram} external>Instagram</FillLink>
          <FillLink href={SITE.facebook} external>Facebook</FillLink>
        </div>
        <div className="footer__col footer__col--end">
          <span className="eyebrow footer__label">Kitchen</span>
          <span className="footer__muted">Full menu by our sister restaurant, Prime 166.</span>
        </div>
      </div>

      <p className="footer__wordmark display" aria-label="The Oak Barrel">
        <span className="footer__the eyebrow" aria-hidden="true">The</span>
        <span className="mask" aria-hidden="true">
          {word.split("").map((ch, i) => (
            <span key={i} data-wm className={ch === " " ? "wm-space" : undefined}>
              {ch === " " ? " " : ch}
            </span>
          ))}
        </span>
      </p>

      <div className="footer__base">
        <span className="eyebrow">© {new Date().getFullYear()} The Oak Barrel</span>
        <span className="eyebrow">Please drink responsibly</span>
        <a className="eyebrow ulink" href="#top" onClick={(e) => { e.preventDefault(); scrollToTarget(0); }}>
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
