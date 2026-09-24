"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import SmoothScroll from "./SmoothScroll";
import Preloader from "./Preloader";
import Grain from "./Grain";
import { onReady } from "@/lib/app";
import { ScrollTrigger, gsap, prefersReduced } from "@/lib/motion";

// one persistent canvas for the whole site, never server-rendered
const Stage = dynamic(() => import("./three/Stage"), { ssr: false });

function Refresher() {
  useEffect(() => {
    // after every section has registered its pins/triggers, measure once
    const off = onReady(() => {
      requestAnimationFrame(() => ScrollTrigger.refresh());
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    });

    // reduced motion: no scrubbed object travel — the barrel appears
    // only in the hero and the closing shot, with plain fades between.
    let st: ScrollTrigger[] = [];
    if (prefersReduced()) {
      // the canvas mounts lazily, so look it up at call time
      const set = (v: number) => {
        const stage = document.querySelector<HTMLElement>(".stage");
        if (stage) gsap.to(stage, { opacity: v, duration: 0.6, ease: "power1.out" });
      };
      st = [
        ScrollTrigger.create({ trigger: "#top", start: "top top", end: "bottom 30%", onLeave: () => set(0), onEnterBack: () => set(1) }),
        ScrollTrigger.create({ trigger: "#closing", start: "top 60%", onEnter: () => set(1), onLeaveBack: () => set(0) }),
      ];
    }
    return () => {
      off();
      st.forEach((s) => s.kill());
    };
  }, []);
  return null;
}

export default function Experience() {
  return (
    <>
      <SmoothScroll />
      <Stage />
      <Grain />
      <Preloader />
      <Refresher />
    </>
  );
}
