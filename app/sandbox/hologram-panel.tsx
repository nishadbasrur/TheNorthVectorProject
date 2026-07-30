"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import type { HologramObjectType, HologramStructure } from "@/lib/visual-scanner";

// Tier 2 of the Sandbox's three-tier visual system — full-screen takeover
// for physical/visual subjects, same structural pattern as hud-map.tsx's
// map takeover (see .hud-page-hologram-active in globals.css, a parallel
// block to .hud-page-map-active rather than a shared one — mutual
// exclusion between the two takeover states is handled in
// voice-session-context.tsx, not here).
//
// The HologramSignal *shape* below is re-declared, not imported, per this
// codebase's usual client/server type decoupling (same reasoning as
// hud-map.tsx's MapVisual vs lib/voice-session-store.ts's VisualState) —
// but the type-only imports above ARE the established exception already
// in this exact file before this change: lib/visual-scanner.ts has no
// "server-only" guard (it's a pure regex/parsing module, safe anywhere),
// so HologramObjectType was already imported directly rather than
// re-declared, and HologramStructure follows the same precedent rather
// than introducing a second, inconsistent pattern.
export type HologramVisual = {
  objectType: HologramObjectType;
  label: string;
  structure?: HologramStructure;
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

// Standard CPK (Corey-Pauling-Koltun) element colors, the same convention
// most molecular viewers use — carbon gray, oxygen red, nitrogen blue,
// hydrogen white, etc. Covers the elements likely to show up in anything
// push_to_screen would plausibly ask for (organic compounds plus common
// biologically/commercially relevant inorganics); an element outside this
// list falls back to HUD_CYAN, keeping it visually on-theme rather than
// the pink/magenta some viewers use for "unknown."
const CPK_ELEMENT_COLORS: Record<string, number> = {
  H: 0xffffff,
  C: 0x909090,
  N: 0x3050f8,
  O: 0xff0d0d,
  F: 0x90e050,
  CL: 0x1ff01f,
  BR: 0xa62929,
  I: 0x940094,
  P: 0xff8000,
  S: 0xffff30,
  B: 0xffb5b5,
  SI: 0xf0c8a0,
  NA: 0xab5cf2,
  K: 0x8f40d4,
  CA: 0x3dff00,
  MG: 0x8aff00,
  FE: 0xe06633,
  ZN: 0x7d80b0,
};

function elementColor(element: string): number {
  return CPK_ELEMENT_COLORS[element.toUpperCase()] ?? HUD_CYAN;
}

// Hydrogen atoms render smaller than everything else — standard ball-and-
// stick convention, and it also keeps a structure's many H atoms (e.g.
// glucose's 12 of 24 atoms) from visually crowding out the heavier atoms
// that actually define its shape.
function atomRadius(element: string): number {
  return element.toUpperCase() === "H" ? 0.09 : 0.16;
}

// Builds a real per-atom/per-bond molecule from PubChem-sourced geometry
// (lib/pubchem-client.ts via handlePushToScreen) — spheres colored by
// element (CPK convention, see elementColor above), cylinder bonds only
// between pairs PubChem actually reports as bonded, at their real relative
// positions. Coordinates are recentered on the structure's own centroid
// and uniformly rescaled so the molecule's furthest atom sits at the same
// distance from center that the old fixed placeholder used (radius 1.1) —
// this keeps every molecule, regardless of how many atoms it has or how
// PubChem's own coordinate units happen to land, framed consistently in
// the camera regardless of actual size.
function buildMoleculeFromStructure(structure: HologramStructure): THREE.Group | null {
  const { atoms, bonds } = structure;
  if (!Array.isArray(atoms) || atoms.length === 0) return null;

  const group = new THREE.Group();

  const centroid = atoms.reduce(
    (acc, atom) => ({ x: acc.x + atom.x, y: acc.y + atom.y, z: acc.z + atom.z }),
    { x: 0, y: 0, z: 0 }
  );
  centroid.x /= atoms.length;
  centroid.y /= atoms.length;
  centroid.z /= atoms.length;

  const recentered = atoms.map((atom) => ({
    element: atom.element,
    x: atom.x - centroid.x,
    y: atom.y - centroid.y,
    z: atom.z - centroid.z,
  }));

  const maxDistance = recentered.reduce((max, atom) => {
    const distance = Math.sqrt(atom.x ** 2 + atom.y ** 2 + atom.z ** 2);
    return Math.max(max, distance);
  }, 0);
  const TARGET_MAX_DISTANCE = 1.3; // matches the placeholder molecule's own scale (outer atom radius 1.1, plus their own bulk)
  const scale = maxDistance > 0 ? TARGET_MAX_DISTANCE / maxDistance : 1;

  const positions = recentered.map((atom) => ({
    element: atom.element,
    x: atom.x * scale,
    y: atom.y * scale,
    z: atom.z * scale,
  }));

  positions.forEach((atom, index) => {
    // transparent: true is set up front (opacity still 1) rather than
    // only when isolate first fires — toggling `transparent` on an
    // existing material after first render can require a shader
    // recompile in some three.js versions; setting it once at creation
    // avoids that entirely.
    const material = new THREE.MeshBasicMaterial({
      color: elementColor(atom.element),
      wireframe: true,
      transparent: true,
    });
    const sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(atomRadius(atom.element), 1), material);
    sphere.position.set(atom.x, atom.y, atom.z);
    // kind/element/index drive click-to-isolate and subatomic reveal (see
    // HologramPanel below) — index is this atom's position in the
    // structure's own atoms[] array, used to key per-atom reveal state.
    sphere.userData = { kind: "atom", element: atom.element, index };
    group.add(sphere);

    // Element-symbol label — a CSS2DObject rather than a sprite/texture,
    // so it's real crisp text at every zoom level with zero texture-atlas
    // work, and it auto-projects to the correct screen position every
    // frame as the object rotates/orbits (see labelRenderer.render in the
    // component below) purely from being part of the THREE scene graph —
    // no manual screen-space math needed here. Added as a child of the
    // sphere (not the top-level group) so its position is simply (0,0,0)
    // in the sphere's own local space, riding along with it automatically
    // through both the auto-rotation and any future orbit interaction.
    // Hidden by default (see HologramPanel's showLabels toggle) — this
    // object always exists, only .visible changes, so toggling never
    // needs to rebuild the scene.
    const labelDiv = document.createElement("div");
    labelDiv.className = "hud-hologram-atom-label";
    labelDiv.textContent = atom.element;
    const label = new CSS2DObject(labelDiv);
    label.visible = false;
    sphere.add(label);
  });

  if (Array.isArray(bonds)) {
    for (const bond of bonds) {
      const from = positions[bond.a];
      const to = positions[bond.b];
      if (!from || !to) continue; // malformed/out-of-range bond index — skip rather than crash the whole render

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dz = to.z - from.z;
      const distance = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
      if (distance === 0) continue;

      // Own material instance per bond (not a single shared one) — click-
      // to-isolate fades individual bonds independently, which needs each
      // one's opacity controllable on its own.
      const bondMaterial = new THREE.MeshBasicMaterial({ color: HUD_CYAN, wireframe: true, transparent: true });

      // Cylinders are built along Y by default, so orient via
      // setFromUnitVectors — same technique the placeholder molecule
      // below already used for its center-to-outer sticks.
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, distance, 6), bondMaterial);
      stick.position.set(from.x + dx / 2, from.y + dy / 2, from.z + dz / 2);
      stick.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize());
      stick.userData = { kind: "bond" };
      group.add(stick);
    }
  }

  return group;
}

// Generic placeholder — a rough sphere-and-stick arrangement (1 center + 5
// outer atoms), not a real molecular geometry. Used whenever real PubChem
// geometry isn't available (no `subject` was supplied, PubChem couldn't
// resolve it, or the SDF failed to parse — see buildMoleculeFromStructure
// and handlePushToScreen) so a hologram never has nothing to show.
function buildGenericMolecule(): THREE.Group {
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

function buildMolecule(structure: HologramStructure | undefined): THREE.Group {
  if (structure) {
    const real = buildMoleculeFromStructure(structure);
    if (real) return real;
  }
  return buildGenericMolecule();
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

function buildObject(objectType: HologramObjectType, structure: HologramStructure | undefined): THREE.Group {
  const group = (() => {
    switch (objectType) {
      case "card":
        return buildCard();
      case "molecule":
        return buildMolecule(structure);
      case "building":
        return buildBuilding();
      case "product":
        return buildProduct();
      case "abstract":
      default:
        return buildAbstract();
    }
  })();

  // Only buildMoleculeFromStructure tags its own meshes ("atom"/"bond") —
  // click-to-isolate/reveal is specific to real per-atom molecule
  // geometry. Everything else (card/building/product/abstract/the generic
  // placeholder molecule) gets a generic "model" tag here instead of at
  // each individual mesh creation site, purely so raycasting can still
  // tell "the click landed on the model" apart from "the click landed on
  // empty background" (which drives the pause toggle) — a plain click on
  // one of these doesn't get an isolate/reveal menu, just doesn't count
  // as a background click either.
  group.traverse((child) => {
    if (child instanceof THREE.Mesh && !child.userData.kind) {
      child.userData.kind = "model";
    }
  });

  return group;
}

// Angular velocity the object idles at whenever nothing has taken manual
// control of it — the original fixed auto-rotation rate, now also the
// value a drag-release replaces (Phase 1a) and the value pause-resume
// restores (Phase 1b), rather than a value only ever used once at mount.
const DEFAULT_IDLE_VELOCITY = { x: 0.0015, y: 0.004 };
// Radians of rotation per pixel of drag movement — hand-tuned starting
// point, same "expect real-world tuning" treatment as every other
// interaction constant in this codebase (see voice-session-context.tsx's
// own thresholds).
const DRAG_SENSITIVITY = 0.008;
// Below this total pointer movement (px), a pointerdown/pointerup pair
// counts as a click, not a drag — matches the fix note's own suggested
// value.
const CLICK_MOVE_THRESHOLD = 5;
// How many of the most recent pointermove deltas feed the release-
// momentum average — smooths out one jittery last-frame sample without
// lagging so far behind that a deliberate flick-and-release feels muted.
const VELOCITY_SAMPLE_COUNT = 5;
// Isolate fades everything else to near-zero rather than fully to 0 —
// keeps a faint silhouette of the rest of the structure for spatial
// context instead of the isolated piece looking like it's floating in a
// void with no reference for where it sits in the whole molecule.
const ISOLATE_FADE_OPACITY = 0.06;

type SceneUserData = { kind?: "atom" | "bond" | "model"; element?: string; index?: number };

export function HologramPanel({ hologram, onClose }: { hologram: HologramVisual; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  // Populated by the scene-building effect below, read by the visibility-
  // sync effect further down — kept in a ref (not state) since these are
  // live THREE objects, not something a re-render should ever recreate.
  const labelObjectsRef = useRef<CSS2DObject[]>([]);
  const [showLabels, setShowLabels] = useState(false);

  // --- Orbit/pause (Phase 1a/1b) ---
  // spinPaused lives in a ref, not state: the animate() loop is a plain
  // rAF callback, not a React render, so it needs to read the CURRENT
  // value synchronously every frame rather than close over whatever
  // spinPaused was at the moment animate() was defined. There's no
  // required visual "paused" indicator in the spec beyond the behavior
  // itself, so no matching useState is needed either.
  const spinPausedRef = useRef(false);
  const angularVelocityRef = useRef({ ...DEFAULT_IDLE_VELOCITY });
  const isDraggingRef = useRef(false);
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const velocitySamplesRef = useRef<{ x: number; y: number }[]>([]);

  // --- Click-to-isolate (Phase 1c) ---
  const interactiveMeshesRef = useRef<THREE.Mesh[]>([]); // just the "atom"/"bond" tagged meshes — what isolate/show-all act on
  const selectedMeshRef = useRef<THREE.Mesh | null>(null);
  const selectionMenuRef = useRef<CSS2DObject | null>(null);
  const [isIsolated, setIsIsolated] = useState(false);

  // Only meaningful when there's real per-atom element data to label —
  // the generic placeholder molecule (see buildGenericMolecule) has no
  // CSS2DObject children at all, and non-molecule holograms never did
  // either, so the toggle button only renders when it would actually do
  // something.
  const hasLabels = hologram.objectType === "molecule" && !!hologram.structure;

  // Detaches the floating per-object menu from whatever mesh it's
  // currently attached to (if any) — safe to call even when nothing is
  // selected. Does NOT touch isolation state; deselecting and clearing an
  // isolation are independent (you can dismiss the menu after clicking
  // Isolate and the isolation itself stays in effect).
  function clearSelectionMenu() {
    if (selectionMenuRef.current) {
      selectionMenuRef.current.parent?.remove(selectionMenuRef.current);
      selectionMenuRef.current = null;
    }
    selectedMeshRef.current = null;
  }

  // Fades every interactive mesh except `mesh` to ISOLATE_FADE_OPACITY.
  // Kept as a plain function (not useCallback) — called from DOM
  // onclick handlers attached imperatively inside the scene effect, not
  // passed as a prop or effect dependency anywhere, so memoization buys
  // nothing here.
  function isolateMesh(mesh: THREE.Mesh) {
    for (const m of interactiveMeshesRef.current) {
      (m.material as THREE.MeshBasicMaterial).opacity = m === mesh ? 1 : ISOLATE_FADE_OPACITY;
    }
    setIsIsolated(true);
    clearSelectionMenu();
  }

  function showAll() {
    for (const m of interactiveMeshesRef.current) {
      (m.material as THREE.MeshBasicMaterial).opacity = 1;
    }
    setIsIsolated(false);
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // A fresh hologram is a fresh scene — any interaction state from the
    // previous one refers to meshes that are about to be disposed.
    spinPausedRef.current = false;
    angularVelocityRef.current = { ...DEFAULT_IDLE_VELOCITY };
    isDraggingRef.current = false;
    selectedMeshRef.current = null;
    selectionMenuRef.current = null;
    setIsIsolated(false);

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
    renderer.domElement.style.touchAction = "none"; // otherwise mobile browsers try to scroll/zoom the page during a drag
    renderer.domElement.style.cursor = "grab";
    container.appendChild(renderer.domElement);

    // Overlaid on top of the WebGL canvas, absolutely positioned to fill
    // the same box — CSS2DRenderer projects each CSS2DObject's 3D
    // position to the matching 2D screen coordinate every frame, so atom
    // labels (and the floating isolate menu below) stay pinned to their
    // anchor through rotation automatically. pointer-events: none at the
    // layer level so it never blocks drag/click on the canvas beneath it
    // or the close button above it — individual floating-menu buttons
    // re-enable pointer-events on themselves (see globals.css).
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(container.clientWidth, container.clientHeight);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0px";
    labelRenderer.domElement.style.left = "0px";
    labelRenderer.domElement.style.pointerEvents = "none";
    container.appendChild(labelRenderer.domElement);

    const object = buildObject(hologram.objectType, hologram.structure);
    scene.add(object);

    labelObjectsRef.current = [];
    interactiveMeshesRef.current = [];
    const allInteractiveMeshes: THREE.Mesh[] = [];
    object.traverse((child) => {
      if (child instanceof CSS2DObject) {
        child.visible = showLabels;
        labelObjectsRef.current.push(child);
        return;
      }
      if (child instanceof THREE.Mesh) {
        const kind = (child.userData as SceneUserData).kind;
        if (kind) allInteractiveMeshes.push(child); // "atom" | "bond" | "model" — anything real enough to count as "hit the object"
        if (kind === "atom" || kind === "bond") interactiveMeshesRef.current.push(child);
      }
    });

    // --- Pointer interaction: drag-to-orbit (1a), pause-and-freeze via
    // background click (1b), click-to-isolate (1c). All three share one
    // pointerdown/move/up cycle, since "was this a drag or a click, and
    // did it land on the model or the background" has to be decided from
    // the same gesture.
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();

    function ndcFromEvent(e: PointerEvent): THREE.Vector2 {
      const rect = renderer.domElement.getBoundingClientRect();
      return pointerNdc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
    }

    function buildSelectionMenuDiv(mesh: THREE.Mesh): HTMLDivElement {
      const div = document.createElement("div");
      div.className = "hud-hologram-floating-menu";

      const isolateBtn = document.createElement("button");
      isolateBtn.type = "button";
      isolateBtn.textContent = "Isolate";
      isolateBtn.onclick = (ev) => {
        ev.stopPropagation();
        isolateMesh(mesh);
      };
      div.appendChild(isolateBtn);

      // Phase 2 (subatomic reveal / electron shells) adds Reveal/Shells
      // buttons here, for atom-kind meshes only — deliberately left as a
      // marker rather than built now, per the fix note's own phased
      // rollout (get orbit + isolate solid first).

      return div;
    }

    function selectMesh(mesh: THREE.Mesh) {
      clearSelectionMenu();
      selectedMeshRef.current = mesh;
      const menu = new CSS2DObject(buildSelectionMenuDiv(mesh));
      mesh.add(menu);
      selectionMenuRef.current = menu;
    }

    function handleBackgroundClick() {
      if (spinPausedRef.current) {
        spinPausedRef.current = false;
        angularVelocityRef.current = { ...DEFAULT_IDLE_VELOCITY }; // resume means idle auto-rotation, not whatever custom momentum existed pre-pause
      } else {
        spinPausedRef.current = true; // freezes exactly where it is — animate() just stops applying angularVelocity below
      }
      clearSelectionMenu();
    }

    function handleClick(e: PointerEvent) {
      raycaster.setFromCamera(ndcFromEvent(e), camera);
      const hits = raycaster.intersectObjects(allInteractiveMeshes, false);

      if (hits.length === 0) {
        handleBackgroundClick();
        return;
      }

      const hit = hits[0].object as THREE.Mesh;
      const kind = (hit.userData as SceneUserData).kind;
      if (kind === "atom" || kind === "bond") {
        selectMesh(hit);
      }
      // kind === "model" — a real hit, but not something isolate/reveal
      // applies to (card/building/product/abstract/placeholder-molecule
      // geometry). Absorbed as a no-op: not a background click (so it
      // doesn't toggle pause), but nothing to select either.
    }

    function handlePointerDown(e: PointerEvent) {
      isDraggingRef.current = true;
      pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      velocitySamplesRef.current = [];
      renderer.domElement.setPointerCapture(e.pointerId);
      renderer.domElement.style.cursor = "grabbing";
    }

    function handlePointerMove(e: PointerEvent) {
      if (!isDraggingRef.current || !lastPointerRef.current) return;
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };

      // Live rotation while dragging — happens identically whether
      // spinPaused is true or not (per 1b: "while paused, dragging still
      // rotates the object in real time").
      const rotY = dx * DRAG_SENSITIVITY;
      const rotX = dy * DRAG_SENSITIVITY;
      object.rotation.y += rotY;
      object.rotation.x += rotX;

      velocitySamplesRef.current.push({ x: rotX, y: rotY });
      if (velocitySamplesRef.current.length > VELOCITY_SAMPLE_COUNT) velocitySamplesRef.current.shift();
    }

    function handlePointerUp(e: PointerEvent) {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      renderer.domElement.releasePointerCapture(e.pointerId);
      renderer.domElement.style.cursor = "grab";

      const start = pointerDownPosRef.current;
      const moved = start ? Math.hypot(e.clientX - start.x, e.clientY - start.y) : Infinity;

      if (moved < CLICK_MOVE_THRESHOLD) {
        handleClick(e);
        return;
      }

      // A real drag release. Momentum only gets imparted when NOT
      // paused — while paused, per 1b, "on release, no momentum is
      // imparted — it just stops exactly where you left it," which is
      // already true by construction as long as we skip updating
      // angularVelocityRef here (animate() never applies it while
      // spinPausedRef is true regardless of what it's set to).
      if (!spinPausedRef.current) {
        const samples = velocitySamplesRef.current;
        if (samples.length > 0) {
          const avg = samples.reduce((acc, s) => ({ x: acc.x + s.x, y: acc.y + s.y }), { x: 0, y: 0 });
          angularVelocityRef.current = { x: avg.x / samples.length, y: avg.y / samples.length };
        }
      }
    }

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);

    let animationActive = true;

    function animate() {
      if (!animationActive) return;
      if (!isDraggingRef.current && !spinPausedRef.current) {
        object.rotation.y += angularVelocityRef.current.y;
        object.rotation.x += angularVelocityRef.current.x;
      }
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    }
    animate();

    function handleResize() {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      labelRenderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      animationActive = false;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      labelObjectsRef.current = [];
      interactiveMeshesRef.current = [];

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
      container.removeChild(labelRenderer.domElement);
    };
    // Rebuilds the whole scene on a new hologram (objectType/label/
    // structure change) rather than swapping geometry in place — these
    // takeovers are infrequent (once per proactively-triggered voice
    // response), so the simplicity of a full remount outweighs any
    // benefit from a more surgical update. showLabels is deliberately
    // NOT a dependency here — toggling it is handled by the separate
    // effect below, which flips .visible on the already-built label
    // objects rather than rebuilding the whole scene for a pure
    // visibility change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hologram.objectType, hologram.label, hologram.structure]);

  // Syncs label visibility whenever the toggle changes, without touching
  // the scene/geometry at all — see the ref populated in the effect above.
  useEffect(() => {
    for (const label of labelObjectsRef.current) {
      label.visible = showLabels;
    }
  }, [showLabels]);

  return (
    <div className="hud-hologram-overlay">
      <div ref={containerRef} className="hud-hologram-canvas" />
      <div className="hud-hologram-fade" />
      <div className="hud-hologram-label">{hologram.label}</div>
      {isIsolated && (
        <button type="button" className="hud-hologram-show-all" onClick={showAll}>
          Show all
        </button>
      )}
      {hasLabels && (
        <button
          type="button"
          className={`hud-hologram-labels-toggle${showLabels ? " hud-hologram-labels-toggle-active" : ""}`}
          onClick={() => setShowLabels((v) => !v)}
          aria-label={showLabels ? "Hide atom labels" : "Show atom labels"}
          aria-pressed={showLabels}
        >
          Aa
        </button>
      )}
      <button type="button" className="hud-hologram-close" onClick={onClose} aria-label="Close hologram">
        ✕
      </button>
    </div>
  );
}
