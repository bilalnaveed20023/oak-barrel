# The Oak Barrel

Scroll-driven marketing site for The Oak Barrel — 166 Oak Street, Wyandotte, MI.

A single persistent WebGL canvas renders a procedurally built oak barrel that travels,
turns and changes lighting mood as you scroll through the page.

## Stack

- Next.js 15 (App Router) + TypeScript
- Three.js via React Three Fiber + drei
- GSAP + ScrollTrigger + SplitText
- Lenis smooth scrolling
- Tailwind (layout utilities only)

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

To test on a phone on the same Wi‑Fi, add your machine's LAN IP to
`allowedDevOrigins` in `next.config.ts` and open `http://<your-ip>:3000`.

## Where things live

| Path | What |
| --- | --- |
| `src/lib/content.ts` | All copy, hours, events, gallery and stats |
| `src/lib/choreo.ts` | Barrel poses per section (the scroll → 3D timeline) |
| `src/components/three/` | Canvas, lighting moods, barrel geometry and textures |
| `src/components/sections/` | Hero, manifesto, features, gallery, stats, closing, footer |
| `src/app/globals.css` | Design tokens, type and layout |

## Photos

The gallery and "The room" image are CC0 placeholders — see
[`PLACEHOLDER-PHOTOS.md`](PLACEHOLDER-PHOTOS.md) for sources and how to swap in
the bar's own photography.
