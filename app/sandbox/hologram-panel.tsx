"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { HologramObjectType } from "@/lib/visual-scanner";

// Tier 2 of the Sandbox's three-tier visual system — full-screen takeover
// for physical/visual subjects, same structural pattern as hud-map.tsx's
// map takeover (see .hud-page-hologram-active in globals.css, a parallel
// block to .hud-page-map-active rather than a shared one — mutual
// exclusion between the two takeover states is handled in
// voice-session-context.tsx, not here).
//
// Deliberately decoupled from lib/visual-scanner.ts's server-side
// HologramSignal type (re-declared below) — this file is a client
// component and shouldn't import from a route/server-adjacent module even
// for a type-only import, same reasoning as hud-map.tsx's MapVisual vs
// lib/voice-session-store.ts's VisualState.
export type HologramVisual = {
  objectType: HologramObjectType;
  label: string;
};

const HOLOGRAM_OBJECT_TYPES: readonly HologramObjectType[] = ["card", "molecule", "building", "product", "abstract"];

function isHologramObjectType(value: unknown): value is HologramObjectType {
  return typeof value === "string" && (HOLOGRAM_OBJECT_TYPES as readonly string[]).includes(value);
}

export function isHologramVisual(value: unknown): value is HologramVisual {
  const v = value as Record<string, unknown> | null | undefined;
  return !!v && isHologramObjectType(v.objectType) && typeof v.label === "string";
}

const HUD_CYAN = 0x3ad6ff;

// A rough sphere-and-stick arrangement — 5 outer atoms spaced around the
// central one, not a real molecular geometry (that would need an actual
// per-compound lookup, well beyond "regex/keyword, zero AI calls"). The
// goal per the spec is "visually interesting and on-theme," not accurate.
function buildMolecule(): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: HUD_CYAN, wireframe: true });

  const center = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 1), material);
  group.add(center);

  const outerCount = 5;
  const radius = 1.1;
  for (let i = 0; i < outerCount; i++) {
    const theta = (i / outerCount) * Math.PI * 2;
    const phi = Math.PI / 3 + (i % 2 === 0 ? 0.4 : -0.4);
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    const outer = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), material);
    outer.position.set(x, y, z);
    group.add(outer);

    // A thin cylinder "stick" from center to this outer atom — cylinders
    // are built along Y by default, so orient via lookAt-style math: place
    // at the midpoint, then rotate to point from center to the outer atom.
    const distance = Math.sqrt(x * x + y * y + z * z);
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, distance, 6), material);
    stick.position.set(x / 2, y / 2, z / 2);
    stick.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x, y, z).normalize());
    group.add(stick);
  }

  return group;
}

// Credit/debit card — flat rectangle at the real ISO/IEC 7810 ID-1 aspect
// ratio (85.6mm x 53.98mm), plus a smaller embossed rectangle standing in
// for the chip. Not literal photorealism, per the spec's own "visually
// interesting and on-theme" goal, not "perfect model."
function buildCard(): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: HUD_CYAN, wireframe: true });

  const body = new THREE.Mesh(new THREE.BoxGeometry(3.37, 2.12, 0.06), material);
  group.add(body);

  const chip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.1), material);
  chip.position.set(-1, 0.4, 0.08);
  group.add(chip);

  return group;
}

// A few stacked boxes of decreasing width — a simple skyscraper-like
// silhouette rather than one plain box, per "building/architecture" in
// the spec's starting object list.
function buildBuilding(): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: HUD_CYAN, wireframe: true });

  const tiers = [
    { width: 1.6, height: 1.4, y: -0.7 },
    { width: 1.2, height: 1.0, y: 0.3 },
    { width: 0.8, height: 0.8, y: 1.2 },
  ];

  for (const tier of tiers) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(tier.width, tier.height, tier.width), material);
    box.position.y = tier.y;
    group.add(box);
  }

  return group;
}

// Generic device/product — a rectangular body with a smaller inset
// rectangle standing in for a screen, per "generic products/devices
// (box/rectangular form)" in the spec.
function buildProduct(): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: HUD_CYAN, wireframe: true });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 0.15), material);
  group.add(body);

  const screen = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.9, 0.2), material);
  screen.position.z = 0.05;
  group.add(screen);

  return group;
}

// Fallback for anything that doesn't match one of the four specific
// renderers — a torus knot reads as "an interesting glowing form" without
// claiming to represent any specific real object.
function buildAbstract(): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: HUD_CYAN, wireframe: true });
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.9, 0.28, 120, 16), material);
  group.add(knot);
  return group;
}

function buildObject(objectType: HologramObjectType): THREE.Group {
  switch (objectType) {
    case "card":
      return buildCard();
    case "molecule":
      return buildMolecule();
    case "building":
      return buildBuilding();
    case "product":
      return buildProduct();
    case "abstract":
    default:
      return buildAbstract();
  }
}

export function HologramPanel({ hologram, onClose }: { hologram: HologramVisual; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.6, 4.5);
    camera.lookAt(0, 0, 0);

    // alpha: true — the canvas itself stays transparent so the page's own
    // dark HUD background (and the fade overlay below) shows through,
    // matching hud-map-overlay's layered look rather than a flat black box.
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const object = buildObject(hologram.objectType);
    scene.add(object);

    let animationActive = true;

    function animate() {
      if (!animationActive) return;
      // Slow, gentle tumble — matches the ticket's "rotating slowly."
      object.rotation.y += 0.004;
      object.rotation.x += 0.0015;
      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    }
    animate();

    function handleResize() {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      animationActive = false;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", handleResize);

      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
    // Rebuilds the whole scene on a new hologram (objectType/label change)
    // rather than swapping geometry in place — these takeovers are
    // infrequent (once per proactively-triggered voice response), so the
    // simplicity of a full remount outweighs any benefit from a more
    // surgical update.
  }, [hologram.objectType, hologram.label]);

  return (
    <div className="hud-hologram-overlay">
      <div ref={containerRef} className="hud-hologram-canvas" />
      <div className="hud-hologram-fade" />
      <div className="hud-hologram-label">{hologram.label}</div>
      <button type="button" className="hud-hologram-close" onClick={onClose} aria-label="Close hologram">
        ✕
      </button>
    </div>
  );
}
