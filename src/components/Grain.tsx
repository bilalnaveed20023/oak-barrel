"use client";

import { useEffect, useRef } from "react";

/** Film grain: one 160px noise tile painted once, jittered with CSS steps. */
export default function Grain() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const size = 160;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d")!;
    const img = g.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    c.toBlob((b) => {
      if (!b || !ref.current) return;
      ref.current.style.backgroundImage = `url(${URL.createObjectURL(b)})`;
    });
  }, []);
  return <div ref={ref} className="grain" aria-hidden="true" />;
}
