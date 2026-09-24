"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { headTexture, staveTextures } from "./textures";

/**
 * A cooper's barrel built from primitives.
 * Real staves (separate lathe segments with hairline gaps), a proper bilge
 * curve, brass hoops, inset heads with a burned brand, a bung and rivets.
 * Units: height 2, bilge radius 0.76.
 */
const H = 2;
const R_END = 0.6;
const R_MID = 0.76;
const T = 0.045; // stave thickness
const HEAD_INSET = 0.075;

const radiusAt = (y: number) => {
  const t = y / (H / 2);
  return R_END + (R_MID - R_END) * (1 - t * t);
};

function buildStaves(staves: number, rows: number, phiSegs: number) {
  const outer: THREE.Vector2[] = [];
  for (let j = 0; j <= rows; j++) {
    const y = -H / 2 + (H * j) / rows;
    outer.push(new THREE.Vector2(radiusAt(y), y));
  }
  const inner = outer.map((p) => new THREE.Vector2(p.x - T, p.y)).reverse();
  const profile = [...outer, ...inner, outer[0].clone()];
  const vOuter = rows / (profile.length - 1);

  const gap = 0.0045;
  const step = (Math.PI * 2) / staves;
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < staves; i++) {
    const g = new THREE.LatheGeometry(profile, phiSegs, i * step + gap / 2, step - gap);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let k = 0; k < uv.count; k++) {
      // each stave gets its own column of the texture; outer face spans full height
      uv.setXY(k, (i + uv.getX(k)) / staves, uv.getY(k) / vOuter);
    }
    parts.push(g);
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  merged.computeVertexNormals();
  return merged;
}

function buildHoops(segs: number) {
  const hoops: [number, number][] = [
    [-0.86, 0.075],
    [-0.66, 0.06],
    [-0.3, 0.07],
    [0.3, 0.07],
    [0.66, 0.06],
    [0.86, 0.075],
  ];
  const parts = hoops.map(([cy, w]) => {
    const y0 = cy - w / 2;
    const y1 = cy + w / 2;
    const pts = [
      new THREE.Vector2(radiusAt(y0) + 0.001, y0),
      new THREE.Vector2(radiusAt(y0) + 0.012, y0 + 0.004),
      new THREE.Vector2(radiusAt(y0 + 0.012) + 0.016, y0 + 0.012),
      new THREE.Vector2(radiusAt(y1 - 0.012) + 0.016, y1 - 0.012),
      new THREE.Vector2(radiusAt(y1) + 0.012, y1 - 0.004),
      new THREE.Vector2(radiusAt(y1) + 0.001, y1),
    ];
    return new THREE.LatheGeometry(pts, segs);
  });
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return { geometry: merged, hoops };
}

export type BarrelQuality = "high" | "low";

export function Barrel({
  quality,
  fontFamily,
  onBuilt,
}: {
  quality: BarrelQuality;
  fontFamily: string;
  onBuilt?: () => void;
}) {
  const hi = quality === "high";

  const built = useMemo(() => {
    const staves = hi ? 22 : 16;
    const staveGeo = buildStaves(staves, hi ? 40 : 24, hi ? 3 : 2);
    const { geometry: hoopGeo, hoops } = buildHoops(hi ? 96 : 56);
    const headR = radiusAt(H / 2 - HEAD_INSET) - T * 0.55;
    const headGeo = new THREE.CircleGeometry(headR, hi ? 64 : 40);

    const side = staveTextures(hi ? 1024 : 512, staves, hi ? 8 : 2);
    const head = headTexture(hi ? 1024 : 512, fontFamily, hi ? 8 : 2);

    const Mat = hi ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
    const wood = new Mat({
      map: side.map,
      bumpMap: side.bump,
      bumpScale: hi ? 2.2 : 1.4,
      roughness: 0.58,
      metalness: 0,
      side: THREE.DoubleSide,
      ...(hi ? { clearcoat: 0.32, clearcoatRoughness: 0.42, sheen: 0.4, sheenColor: new THREE.Color("#ffcf9a"), sheenRoughness: 0.6 } : {}),
    });
    const headMat = new Mat({
      map: head.map,
      bumpMap: head.bump,
      bumpScale: hi ? 3 : 2,
      roughness: 0.72,
      ...(hi ? { clearcoat: 0.15, clearcoatRoughness: 0.6 } : {}),
    });
    const brass = new Mat({
      color: new THREE.Color("#b88a46"),
      metalness: 1,
      roughness: 0.3,
      ...(hi ? { clearcoat: 0.4, clearcoatRoughness: 0.25 } : {}),
    });
    const darkBrass = new Mat({ color: new THREE.Color("#6b4d22"), metalness: 1, roughness: 0.45 });
    const cork = new Mat({ color: new THREE.Color("#3a2414"), roughness: 0.85 });

    // rivets: two per hoop, on opposite sides
    const rivetGeo = new THREE.SphereGeometry(0.014, 10, 8);
    const rivets = new THREE.InstancedMesh(rivetGeo, brass, hoops.length * 2);
    const m = new THREE.Matrix4();
    hoops.forEach(([cy], i) => {
      [0.4, 0.4 + Math.PI].forEach((a, k) => {
        const rr = radiusAt(cy) + 0.017;
        m.makeTranslation(Math.cos(a) * rr, cy, Math.sin(a) * rr);
        rivets.setMatrixAt(i * 2 + k, m);
      });
    });
    rivets.instanceMatrix.needsUpdate = true;

    return {
      staveGeo,
      hoopGeo,
      headGeo,
      headY: H / 2 - HEAD_INSET,
      wood,
      headMat,
      brass,
      darkBrass,
      cork,
      rivets,
      textures: [side.map, side.bump, head.map, head.bump],
    };
  }, [hi, fontFamily]);

  useEffect(() => {
    onBuilt?.();
    return () => {
      built.staveGeo.dispose();
      built.hoopGeo.dispose();
      built.headGeo.dispose();
      built.textures.forEach((t) => t.dispose());
      [built.wood, built.headMat, built.brass, built.darkBrass, built.cork].forEach((mm) => mm.dispose());
      built.rivets.dispose();
    };
  }, [built, onBuilt]);

  const bungR = radiusAt(0);

  return (
    <group>
      <mesh geometry={built.staveGeo} material={built.wood} />
      <mesh geometry={built.hoopGeo} material={built.brass} />
      <primitive object={built.rivets} />
      <mesh geometry={built.headGeo} material={built.headMat} position={[0, built.headY, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={built.headGeo} material={built.headMat} position={[0, -built.headY, 0]} rotation={[Math.PI / 2, 0, 0]} />
      {/* bung: brass ring + oak plug on the widest stave */}
      <group position={[0, 0.02, bungR - 0.004]}>
        <mesh material={built.darkBrass} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.052, 0.011, 12, hi ? 40 : 24]} />
        </mesh>
        <mesh material={built.cork} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.006]}>
          <cylinderGeometry args={[0.046, 0.05, 0.03, hi ? 32 : 18]} />
        </mesh>
      </group>
    </group>
  );
}
