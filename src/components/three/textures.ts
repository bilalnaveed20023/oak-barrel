import * as THREE from "three";

/**
 * Procedural oak. No image downloads: every texture is painted on a canvas
 * at startup (≈15ms), which keeps the preloader honest and the payload tiny.
 */

// deterministic PRNG so every visit gets the same barrel
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function finish(c: HTMLCanvasElement, srgb: boolean, anisotropy: number) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = anisotropy;
  t.needsUpdate = true;
  return t;
}

/** Side of the barrel: one column per stave, long rift-sawn grain, toasted ends. */
export function staveTextures(size: number, staves: number, anisotropy = 4) {
  const r = rng(166);
  const [c, g] = canvas(size, size);
  const [bc, bg] = canvas(size, size); // bump / roughness detail, grayscale
  const colW = size / staves;

  bg.fillStyle = "#808080";
  bg.fillRect(0, 0, size, size);

  for (let i = 0; i < staves; i++) {
    const x0 = i * colW;
    // each stave cut from a different part of the tree
    const hue = 22 + r() * 8;
    const sat = 30 + r() * 14;
    const lig = 19 + r() * 9;
    const grad = g.createLinearGradient(x0, 0, x0 + colW, 0);
    grad.addColorStop(0, `hsl(${hue} ${sat}% ${lig - 5}%)`);
    grad.addColorStop(0.5, `hsl(${hue} ${sat}% ${lig}%)`);
    grad.addColorStop(1, `hsl(${hue} ${sat}% ${lig - 6}%)`);
    g.fillStyle = grad;
    g.fillRect(x0, 0, colW, size);

    const lines = Math.round(colW * 1.1);
    for (let k = 0; k < lines; k++) {
      const x = x0 + r() * colW;
      const amp = 0.4 + r() * 2.2;
      const freq = 0.004 + r() * 0.012;
      const ph = r() * 10;
      const dark = r() > 0.28;
      const a = dark ? 0.06 + r() * 0.22 : 0.03 + r() * 0.07;
      g.strokeStyle = dark ? `rgba(34,16,6,${a})` : `rgba(255,214,160,${a})`;
      g.lineWidth = 0.4 + r() * (dark ? 1.8 : 1.1);
      bg.strokeStyle = dark ? `rgba(40,40,40,${a * 2.2})` : `rgba(200,200,200,${a * 1.5})`;
      bg.lineWidth = g.lineWidth;
      g.beginPath();
      bg.beginPath();
      for (let y = 0; y <= size; y += 8) {
        const xx = Math.min(x0 + colW - 1, Math.max(x0 + 1, x + Math.sin(y * freq + ph) * amp));
        if (y === 0) {
          g.moveTo(xx, y);
          bg.moveTo(xx, y);
        } else {
          g.lineTo(xx, y);
          bg.lineTo(xx, y);
        }
      }
      g.stroke();
      bg.stroke();
    }

    // medullary ray flecks — the tell of real white oak
    const flecks = Math.round(colW * 0.35);
    for (let k = 0; k < flecks; k++) {
      const fx = x0 + 2 + r() * (colW - 4);
      const fy = r() * size;
      const fl = 3 + r() * 14;
      g.fillStyle = `rgba(255,220,170,${0.05 + r() * 0.08})`;
      g.fillRect(fx, fy, 1 + r() * 1.5, fl);
    }

    // seam shading between staves
    g.fillStyle = "rgba(18,8,2,0.55)";
    g.fillRect(x0, 0, 1.5, size);
    bg.fillStyle = "#101010";
    bg.fillRect(x0, 0, 2, size);
  }

  // toasted, handled ends
  const ends = g.createLinearGradient(0, 0, 0, size);
  ends.addColorStop(0, "rgba(20,8,2,0.55)");
  ends.addColorStop(0.1, "rgba(20,8,2,0)");
  ends.addColorStop(0.9, "rgba(20,8,2,0)");
  ends.addColorStop(1, "rgba(20,8,2,0.55)");
  g.fillStyle = ends;
  g.fillRect(0, 0, size, size);

  return { map: finish(c, true, anisotropy), bump: finish(bc, false, anisotropy) };
}

/**
 * Barrel head: end-grain planks, growth rings and a burned-in brand.
 * `fontFamily` is the resolved display face so the brand iron matches the site.
 */
export function headTexture(size: number, fontFamily: string, anisotropy = 4) {
  const r = rng(313);
  const [c, g] = canvas(size, size);
  const [bc, bg] = canvas(size, size);
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2;

  g.fillStyle = "hsl(28 34% 30%)";
  g.fillRect(0, 0, size, size);
  bg.fillStyle = "#808080";
  bg.fillRect(0, 0, size, size);

  // four planks, each its own ring pattern
  const planks = 5;
  const pw = size / planks;
  for (let p = 0; p < planks; p++) {
    const x0 = p * pw;
    g.save();
    bg.save();
    g.beginPath();
    g.rect(x0, 0, pw, size);
    g.clip();
    bg.beginPath();
    bg.rect(x0, 0, pw, size);
    bg.clip();
    g.fillStyle = `hsl(${26 + r() * 6} ${30 + r() * 12}% ${28 + r() * 8}%)`;
    g.fillRect(x0, 0, pw, size);
    const ox = x0 + pw * (r() - 0.5) * 3;
    const oy = size * (0.5 + (r() - 0.5) * 1.6);
    for (let k = 0; k < 90; k++) {
      const rad = 20 + k * (size / 70) + r() * 6;
      g.strokeStyle = `rgba(40,18,6,${0.08 + r() * 0.16})`;
      g.lineWidth = 0.6 + r() * 1.6;
      g.beginPath();
      g.ellipse(ox, oy, rad * 1.8, rad, 0, 0, Math.PI * 2);
      g.stroke();
      bg.strokeStyle = `rgba(50,50,50,${0.2 + r() * 0.3})`;
      bg.lineWidth = g.lineWidth;
      bg.beginPath();
      bg.ellipse(ox, oy, rad * 1.8, rad, 0, 0, Math.PI * 2);
      bg.stroke();
    }
    g.restore();
    bg.restore();
    g.fillStyle = "rgba(14,6,2,0.8)";
    g.fillRect(x0 - 1, 0, 2.5, size);
    bg.fillStyle = "#0a0a0a";
    bg.fillRect(x0 - 1, 0, 3, size);
  }

  // burned brand
  const burn = (ctx: CanvasRenderingContext2D, ink: string, blur: number) => {
    ctx.save();
    ctx.fillStyle = ink;
    ctx.strokeStyle = ink;
    ctx.shadowColor = ink;
    ctx.shadowBlur = blur;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.lineWidth = size * 0.006;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = size * 0.0025;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.52, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = `italic 400 ${size * 0.07}px ${fontFamily}`;
    ctx.fillText("The", cx, cy - size * 0.12);
    ctx.font = `500 ${size * 0.16}px ${fontFamily}`;
    ctx.fillText("Oak", cx, cy + size * 0.0);
    ctx.font = `500 ${size * 0.045}px ${fontFamily}`;
    const word = "B A R R E L";
    ctx.fillText(word, cx, cy + size * 0.12);

    // text on a circle
    const ring = "WYANDOTTE · MICHIGAN · 166 OAK STREET · ";
    ctx.font = `500 ${size * 0.034}px ${fontFamily}`;
    const rr = R * 0.62;
    const step = (Math.PI * 2) / ring.length;
    for (let i = 0; i < ring.length; i++) {
      const a = -Math.PI / 2 + i * step;
      ctx.save();
      ctx.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillText(ring[i], 0, 0);
      ctx.restore();
    }
    ctx.restore();
  };
  burn(g, "rgba(22,9,3,0.9)", size * 0.006);
  burn(bg, "rgba(0,0,0,1)", size * 0.004);

  // rim darkening
  const vig = g.createRadialGradient(cx, cy, R * 0.55, cx, cy, R);
  vig.addColorStop(0, "rgba(10,4,1,0)");
  vig.addColorStop(1, "rgba(10,4,1,0.6)");
  g.fillStyle = vig;
  g.fillRect(0, 0, size, size);

  return { map: finish(c, true, anisotropy), bump: finish(bc, false, anisotropy) };
}

export function softDot(size = 64) {
  const [c, g] = canvas(size, size);
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.35, "rgba(255,255,255,0.35)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function blobShadow(size = 128) {
  const [c, g] = canvas(size, size);
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, "rgba(0,0,0,0.9)");
  grd.addColorStop(0.45, "rgba(0,0,0,0.45)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
