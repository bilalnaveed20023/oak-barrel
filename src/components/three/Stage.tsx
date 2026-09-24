"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Barrel } from "./Barrel";
import { blobShadow, softDot } from "./textures";
import { app, markSceneReady } from "@/lib/app";
import { buildChoreo, choreoReady, isHidden, rig, sample, wantsFloat, type Pose } from "@/lib/choreo";
import { ScrollTrigger, prefersReduced } from "@/lib/motion";

type Mood = {
  key: THREE.Color;
  keyI: number;
  rim: THREE.Color;
  rimI: number;
  fill: THREE.Color;
  fillI: number;
  env: number;
  motes: number;
};
const mood = (key: string, keyI: number, rim: string, rimI: number, fill: string, fillI: number, env: number, motes: number): Mood => ({
  key: new THREE.Color(key),
  keyI,
  rim: new THREE.Color(rim),
  rimI,
  fill: new THREE.Color(fill),
  fillI,
  env,
  motes,
});

/** 0 warm hero · 1 ember · 2 emerald · 3 ivory daylight · 4 gold beauty */
const MOODS: Mood[] = [
  mood("#ffb877", 3.2, "#ffd9a3", 5.5, "#2f6b52", 0.7, 0.55, 0.9),
  mood("#ff9a52", 1.9, "#f0c27e", 4.2, "#1d4a38", 0.45, 0.35, 0.6),
  mood("#d9efe4", 2.2, "#46e0a6", 7.5, "#0e3b2c", 1.1, 0.5, 0.25),
  mood("#fff3df", 3.6, "#ffffff", 2.5, "#c9b99a", 1.2, 1.0, 0),
  mood("#ffc47a", 3.8, "#ffe0a0", 7, "#1f5a44", 0.8, 0.8, 1),
];

const H = 2;
const R_MID = 0.76;
const KEYS: (keyof Pose)[] = ["x", "y", "z", "s", "rx", "ry", "rz", "mood", "f", "sh"];

function useDisplayFont() {
  const [family, setFamily] = useState<string | null>(null);
  useEffect(() => {
    const fam = getComputedStyle(document.body).getPropertyValue("--font-display").trim() || "serif";
    const done = () => setFamily(fam);
    Promise.all([
      document.fonts.load(`500 64px ${fam}`),
      document.fonts.load(`italic 400 64px ${fam}`),
    ])
      .then(done, done);
    // never let a slow font hold up the barrel
    const t = window.setTimeout(done, 1200);
    return () => window.clearTimeout(t);
  }, []);
  return family;
}

function Motes({ count, hi }: { count: number; hi: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const { geometry, speeds } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const sp = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 9;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3 - 0.5;
      sp[i] = 0.03 + Math.random() * 0.08;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geometry: g, speeds: sp };
  }, [count]);
  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: hi ? 0.028 : 0.04,
        map: softDot(),
        color: "#f3cf8e",
        transparent: true,
        depthWrite: false,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    [hi]
  );
  useEffect(() => () => {
    geometry.dispose();
    material.map?.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame((state, delta) => {
    const p = ref.current;
    if (!p) return;
    const arr = (p.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    const dt = Math.min(delta, 1 / 20);
    const t = state.clock.elapsedTime;
    for (let i = 0; i < speeds.length; i++) {
      arr[i * 3 + 1] += speeds[i] * dt;
      arr[i * 3] += Math.sin(t * 0.3 + i) * 0.0015;
      if (arr[i * 3 + 1] > 2.6) arr[i * 3 + 1] = -2.6;
    }
    p.geometry.attributes.position.needsUpdate = true;
  });
  return <points ref={ref} geometry={geometry} material={material} renderOrder={2} />;
}

function Scene({ hi, font, reduced }: { hi: boolean; font: string; reduced: boolean }) {
  const { camera, invalidate, scene } = useThree();
  const group = useRef<THREE.Group>(null);
  const shadowGroup = useRef<THREE.Group>(null);
  const blob = useRef<THREE.Mesh>(null);
  const key = useRef<THREE.SpotLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.PointLight>(null);
  const motes = useRef<THREE.Group>(null);
  const cur = useRef<Pose>({ ...rig });
  const tilt = useRef({ x: 0, y: 0 });
  const first = useRef(true);
  const lastScroll = useRef(-1);
  const blobTex = useMemo(() => (hi ? null : blobShadow()), [hi]);
  const tmp = useMemo(() => ({ key: new THREE.Color(), rim: new THREE.Color(), fill: new THREE.Color() }), []);

  useEffect(() => {
    app.invalidate = invalidate;
    const rebuild = () => {
      buildChoreo();
      invalidate();
    };
    ScrollTrigger.addEventListener("refresh", rebuild);
    rebuild();
    const onScroll = () => invalidate();
    window.addEventListener("scroll", onScroll, { passive: true });
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      app.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      app.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      invalidate();
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      ScrollTrigger.removeEventListener("refresh", rebuild);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [invalidate]);

  const onBuilt = useCallback(() => {
    // wait one painted frame so the preloader never reveals an empty stage
    invalidate();
    requestAnimationFrame(() => requestAnimationFrame(markSceneReady));
  }, [invalidate]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const y = window.scrollY;
    if (!choreoReady()) buildChoreo();
    // until the page is measured, hold the first real pose instead of easing from a default
    if (!choreoReady()) first.current = true;
    const target = sample(y);
    const hidden = isHidden(y);
    g.visible = !hidden;
    if (shadowGroup.current) shadowGroup.current.visible = !hidden;
    if (motes.current) motes.current.visible = !hidden;

    const dt = Math.min(delta, 1 / 15);
    // λ≈6 ≈ lerp 0.1 per 60fps frame: the object trails the scroll, never snaps
    const lambda = reduced ? 50 : 6;
    const c = cur.current;
    let moving = false;
    for (const k of KEYS) {
      if (first.current) c[k] = target[k];
      else c[k] = THREE.MathUtils.damp(c[k], target[k], lambda, dt);
      if (Math.abs(c[k] - target[k]) > 0.0004) moving = true;
    }
    first.current = false;

    // pointer tilt, desktop only (pointer stays 0 on touch)
    tilt.current.x = THREE.MathUtils.damp(tilt.current.x, app.pointer.x, 3, dt);
    tilt.current.y = THREE.MathUtils.damp(tilt.current.y, app.pointer.y, 3, dt);
    if (Math.abs(tilt.current.x - app.pointer.x) + Math.abs(tilt.current.y - app.pointer.y) > 0.002) moving = true;

    const cam = camera as THREE.PerspectiveCamera;
    const halfH = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.position.z;
    const halfW = halfH * cam.aspect;
    const base = Math.min((halfH * 2 * 0.5) / H, (halfW * 2 * 0.56) / (R_MID * 2));
    const s = base * c.s;

    const floating = !reduced && c.f > 0.02 && wantsFloat(y);
    const t = state.clock.elapsedTime;
    const bob = floating ? Math.sin(t * 0.9) * 0.035 * c.f : 0;
    const sway = floating ? Math.sin(t * 0.45) * 0.08 * c.f : 0;

    g.position.set(c.x * halfW, c.y * halfH + bob, c.z);
    g.scale.setScalar(s);
    g.rotation.set(c.rx + tilt.current.y * 0.12, c.ry + sway + tilt.current.x * 0.25, c.rz);

    // contact shadow follows position/scale only, never rotation
    const reach = s * (Math.abs(Math.cos(c.rz) * Math.cos(c.rx)) * (H / 2) + Math.abs(Math.sin(c.rz)) * R_MID + Math.abs(Math.sin(c.rx)) * R_MID * 0.6);
    if (shadowGroup.current) {
      shadowGroup.current.position.set(g.position.x, g.position.y - bob - reach - 0.01, 0);
      shadowGroup.current.scale.setScalar(s * (1 - bob * 2));
      const plane = shadowGroup.current.children[0]?.children?.[0] as THREE.Mesh | undefined;
      const mat = (plane?.material ?? (blob.current?.material as THREE.Material | undefined)) as THREE.MeshBasicMaterial | undefined;
      if (mat) mat.opacity = c.sh;
    }

    // mood
    const mi = THREE.MathUtils.clamp(c.mood, 0, MOODS.length - 1);
    const a = MOODS[Math.floor(mi)];
    const b = MOODS[Math.min(MOODS.length - 1, Math.floor(mi) + 1)];
    const f = mi - Math.floor(mi);
    if (key.current) {
      key.current.color.copy(tmp.key.copy(a.key).lerp(b.key, f));
      key.current.intensity = THREE.MathUtils.lerp(a.keyI, b.keyI, f) * 13;
    }
    if (rim.current) {
      rim.current.color.copy(tmp.rim.copy(a.rim).lerp(b.rim, f));
      rim.current.intensity = THREE.MathUtils.lerp(a.rimI, b.rimI, f);
    }
    if (fill.current) {
      fill.current.color.copy(tmp.fill.copy(a.fill).lerp(b.fill, f));
      fill.current.intensity = THREE.MathUtils.lerp(a.fillI, b.fillI, f) * 6;
    }
    scene.environmentIntensity = THREE.MathUtils.lerp(a.env, b.env, f);
    if (motes.current) {
      const pts = motes.current.children[0] as THREE.Points | undefined;
      if (pts) (pts.material as THREE.PointsMaterial).opacity = THREE.MathUtils.lerp(a.motes, b.motes, f) * 0.55;
    }

    const scrolled = y !== lastScroll.current;
    lastScroll.current = y;
    if (!hidden && (moving || floating || scrolled)) invalidate();
  });

  return (
    <>
      <ambientLight intensity={0.12} color="#9fbfae" />
      <spotLight ref={key} position={[-5.5, 4.5, 3]} angle={0.55} penumbra={1} decay={1.4} distance={30} />
      <directionalLight ref={rim} position={[4.5, 2.5, -3.5]} />
      <directionalLight color="#ffe2b8" intensity={0.9} position={[-4, 1, -4]} />
      {hi && <pointLight ref={fill} position={[3, -2, 3]} decay={2} distance={12} />}

      <Environment resolution={hi ? 256 : 64} frames={1}>
        {/* bar-back glow + softboxes: reflections for brass and clearcoat */}
        <Lightformer form="rect" intensity={2.2} color="#ffd6a0" position={[0, 4, -3]} rotation-x={Math.PI / 2} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#fff2df" position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[3, 5, 1]} />
        <Lightformer form="rect" intensity={1.8} color="#6fd6ab" position={[5, 0.5, -1]} rotation-y={-Math.PI / 2} scale={[2, 6, 1]} />
        <Lightformer form="ring" intensity={1.2} color="#ffcf8a" position={[0, -3, 4]} scale={2} />
      </Environment>

      <group ref={group}>
        <Barrel quality={hi ? "high" : "low"} fontFamily={font} onBuilt={onBuilt} />
      </group>

      <group ref={shadowGroup}>
        {hi ? (
          <ContactShadows position={[0, 0, 0]} scale={3.2} resolution={256} blur={2.6} far={1.6} opacity={0.7} color="#020805" frames={Infinity} />
        ) : (
          <mesh ref={blob} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.2, 2.2]} />
            <meshBasicMaterial map={blobTex} transparent depthWrite={false} opacity={0.6} color="#000" />
          </mesh>
        )}
      </group>

      {!reduced && (
        <group ref={motes}>
          <Motes count={hi ? 160 : 60} hi={hi} />
        </group>
      )}
    </>
  );
}

export default function Stage() {
  const font = useDisplayFont();
  const [cfg] = useState(() => {
    if (typeof window === "undefined") return { hi: true, dpr: 1.5, reduced: false };
    const small = window.innerWidth < 768;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const lowCores = (navigator.hardwareConcurrency ?? 8) <= 4;
    const hi = !small && !coarse && !lowCores;
    return { hi, dpr: Math.min(window.devicePixelRatio || 1, hi ? 2 : 1.5), reduced: prefersReduced() };
  });

  return (
    <div className="stage" aria-hidden="true">
      {font && (
        <Canvas
          frameloop="demand"
          dpr={cfg.dpr}
          camera={{ fov: 32, position: [0, 0, 7.5], near: 0.1, far: 40 }}
          gl={{ antialias: cfg.hi, alpha: true, powerPreference: "high-performance", stencil: false }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1;
          }}
        >
          <Scene hi={cfg.hi} font={font} reduced={cfg.reduced} />
        </Canvas>
      )}
    </div>
  );
}
