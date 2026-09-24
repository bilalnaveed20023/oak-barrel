"use client";

import type Lenis from "lenis";

/**
 * Tiny shared runtime: the Lenis instance, the "site is revealed" signal and
 * a pointer position that the 3D scene can read without React re-renders.
 */
type Listener = () => void;

const readyListeners = new Set<Listener>();
const sceneListeners = new Set<Listener>();

export const app = {
  lenis: null as Lenis | null,
  ready: false,
  sceneReady: false,
  /** normalised pointer, -1..1 */
  pointer: { x: 0, y: 0 },
  /** set by the Stage so DOM code can ask for a frame */
  invalidate: (() => {}) as () => void,
};

export function onReady(fn: Listener) {
  if (app.ready) {
    fn();
    return () => {};
  }
  readyListeners.add(fn);
  return () => readyListeners.delete(fn);
}

export function markReady() {
  if (app.ready) return;
  app.ready = true;
  readyListeners.forEach((fn) => fn());
  readyListeners.clear();
}

export function onSceneReady(fn: Listener) {
  if (app.sceneReady) {
    fn();
    return () => {};
  }
  sceneListeners.add(fn);
  return () => sceneListeners.delete(fn);
}

export function markSceneReady() {
  if (app.sceneReady) return;
  app.sceneReady = true;
  sceneListeners.forEach((fn) => fn());
  sceneListeners.clear();
}

export function lockScroll(lock: boolean) {
  const html = document.documentElement;
  if (lock) {
    app.lenis?.stop();
    html.style.overflow = "hidden";
  } else {
    html.style.overflow = "";
    app.lenis?.start();
  }
}

export function scrollToTarget(target: string | number) {
  if (app.lenis) {
    app.lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
  } else if (typeof target === "string") {
    document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
  } else {
    window.scrollTo({ top: target, behavior: "smooth" });
  }
}
