"use client";

import { useRef } from "react";
import { gsap } from "@/lib/motion";
import { revealMasked, useSectionMotion } from "@/lib/reveal";
import { MENU, asset, type MenuItem } from "@/lib/content";

function Item({ item }: { item: MenuItem }) {
  return (
    <li className="bill__item" data-bill-item>
      <div className="bill__row">
        <h3 className="bill__name">{item.name}</h3>
        {item.tag && <span className="bill__tag">{item.tag}</span>}
        <span className="bill__price">${item.price}</span>
      </div>
      <p className="bill__desc">
        {item.desc}
        {item.note && <span className="bill__note"> ({item.note})</span>}
      </p>
    </li>
  );
}

/** The bar's printed menu, set as a parchment bill of fare. */
export default function DrinkMenu() {
  const ref = useRef<HTMLElement>(null);

  useSectionMotion(ref, (c, root) => {
    revealMasked(root.querySelectorAll("[data-bill-head]"), c, { scrollTrigger: { trigger: root, start: "top 75%", once: true } });
    const items = gsap.utils.toArray<HTMLElement>("[data-bill-item]", root);
    if (c.reduced) return;
    items.forEach((el) =>
      gsap.from(el, { opacity: 0, y: 18, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 92%", once: true } })
    );
  });

  const half = Math.ceil(MENU.classics.length / 2);

  return (
    <section ref={ref} id="drink-menu" className="bill" aria-labelledby="bill-title">
      <div className="bill__intro">
        <span className="mask"><span className="eyebrow" data-bill-head>The menu</span></span>
        <h2 id="bill-title" className="bill__heading display">
          <span className="mask"><span data-bill-head>What’s on</span></span>
          <span className="mask"><span data-bill-head><em>the bar tonight.</em></span></span>
        </h2>
      </div>

      <div className="bill__card">
        <div className="bill__frame" aria-hidden="true" />
        <header className="bill__cardhead">
          <div className="bill__rule"><i /><b /><span className="bill__brand">The Oak Barrel</span><b /><i /></div>
          <p className="bill__section">Classic Cocktails</p>
        </header>

        <div className="bill__cols">
          <ul className="bill__list">
            {MENU.classics.slice(0, half).map((m) => <Item key={m.name} item={m} />)}
          </ul>
          <span className="bill__divider" aria-hidden="true" />
          <ul className="bill__list">
            {MENU.classics.slice(half).map((m) => <Item key={m.name} item={m} />)}
          </ul>
        </div>

        <div className="bill__fall">
          <div className="bill__rule bill__rule--fall"><i /><b /><span className="bill__fall-title">Fall Features</span><b /><i /></div>
          <ul className="bill__list bill__list--fall">
            {MENU.fall.map((m) => <Item key={m.name} item={m} />)}
          </ul>
        </div>

        <footer className="bill__foot">
          <a className="ulink" href={asset("/menu/oak-barrel-menu.jpg")} target="_blank" rel="noopener noreferrer">
            View the printed menu ↗
          </a>
          <span>Please drink responsibly</span>
        </footer>
      </div>
    </section>
  );
}
