"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import type { HologramObjectType, HologramStructure } from "@/lib/visual-scanner";
import { lookupElement, neutronCount } from "@/lib/periodic-table-data";

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
//
// A discriminated union, mirroring lib/visual-scanner.ts's own
// HologramSignal split — a "reaction" hologram has a fundamentally
// different shape (multiple species, no single top-level structure) from
// every other object type.
export type ReactionSpecies = { label: string; structure?: HologramStructure };

// Optional word-problem context — see lib/visual-scanner.ts's ReactionVessel
// (re-declared here rather than imported, same client/server decoupling
// reasoning as the rest of this file's types) for what solvent/conditions
// mean and where they come from. Presence of this field is what switches a
// reaction hologram from the original free-floating molecule layout into
// the vessel/beaker scenario (see buildVessel and applyVesselSetupState
// below) — absence keeps the exact behavior already built and tested.
export type ReactionVessel = { solvent?: string; conditions?: string };

export type HologramVisual =
  | { objectType: Exclude<HologramObjectType, "reaction">; label: string; structure?: HologramStructure }
  | {
      objectType: "reaction";
      label: string;
      reactants: ReactionSpecies[];
      products: ReactionSpecies[];
      vessel?: ReactionVessel;
    };

const HOLOGRAM_OBJECT_TYPES: readonly HologramObjectType[] = [
  "card",
  "molecule",
  "building",
  "product",
  "abstract",
  "reaction",
];

function isHologramObjectType(value: unknown): value is HologramObjectType {
  return typeof value === "string" && (HOLOGRAM_OBJECT_TYPES as readonly string[]).includes(value);
}

export function isHologramVisual(value: unknown): value is HologramVisual {
  const v = value as Record<string, unknown> | null | undefined;
  if (!v || typeof v.label !== "string" || !isHologramObjectType(v.objectType)) return false;
  if (v.objectType === "reaction") {
    return Array.isArray(v.reactants) && Array.isArray(v.products);
  }
  return true;
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

// --- Subatomic reveal (Phase 2a) and electron shells (Phase 2b) ---------
//
// Stylized, not a real nuclear/quantum simulation — protons/neutrons
// jitter in place near the nucleus center, electrons continuously orbit a
// random tilted axis at a roughly fixed radius ("buzzing"), and shell
// mode just uses different fixed radii per shell instead of one shared
// radius. Counts come from lib/periodic-table-data.ts (real atomic
// number / standard atomic mass / Bohr-model shell configuration), so
// the counts are chemically real even though the motion isn't physics.

const PROTON_COLOR = 0xff4d6a;
const NEUTRON_COLOR = 0x7d93c9;
const ELECTRON_CLOUD_COLOR = 0x3ad6ff;
// Valence (outermost, chemically-relevant) shell renders bright white —
// visually distinct from the dimmer cyan core shells, since the valence
// shell is usually the actual point of interest for a given problem.
const VALENCE_SHELL_COLOR = 0xffffff;
const CORE_SHELL_COLOR = 0x2a6f8a;

const NUCLEUS_PACK_RADIUS = 0.05; // small tight cluster, not a "loose" shell
const NUCLEON_RADIUS = 0.018;
const ELECTRON_POINT_RADIUS = 0.012;
const ELECTRON_CLOUD_RADIUS = 0.24; // single loose shell, undifferentiated (2a)
const ELECTRON_SHELL_RADII = [0.12, 0.18, 0.24, 0.3]; // K, L, M, N — matches the deepest shell count anything H-Kr needs

type Nucleon = { mesh: THREE.Mesh; baseOffset: THREE.Vector3; phase: number };
type Electron = { mesh: THREE.Mesh; vector: THREE.Vector3; axis: THREE.Vector3; speed: number };

function randomPointInSphere(radius: number): THREE.Vector3 {
  const costheta = Math.random() * 2 - 1;
  const theta = Math.acos(costheta);
  const phi = Math.random() * Math.PI * 2;
  const r = radius * Math.cbrt(Math.random());
  return new THREE.Vector3(
    r * Math.sin(theta) * Math.cos(phi),
    r * Math.sin(theta) * Math.sin(phi),
    r * Math.cos(theta)
  );
}

function buildNucleus(protons: number, neutrons: number): { group: THREE.Group; nucleons: Nucleon[] } {
  const group = new THREE.Group();
  const nucleons: Nucleon[] = [];
  const total = protons + neutrons;

  for (let i = 0; i < total; i++) {
    const color = i < protons ? PROTON_COLOR : NEUTRON_COLOR;
    const material = new THREE.MeshBasicMaterial({ color, wireframe: true });
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(NUCLEON_RADIUS, 0), material);
    const baseOffset = randomPointInSphere(NUCLEUS_PACK_RADIUS);
    mesh.position.copy(baseOffset);
    group.add(mesh);
    nucleons.push({ mesh, baseOffset, phase: Math.random() * Math.PI * 2 });
  }

  return { group, nucleons };
}

function makeElectron(radius: number, color: number, opacity: number): Electron {
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(ELECTRON_POINT_RADIUS, 6, 6), material);
  const vector = randomPointInSphere(radius).setLength(radius); // start ON the shell, not somewhere inside it
  const axis = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
  const speed = 0.03 + Math.random() * 0.05; // radians/frame — deliberately varied per electron so they don't all stay in visual lockstep
  mesh.position.copy(vector);
  return { mesh, vector, axis, speed };
}

function buildElectronCloud(count: number): { group: THREE.Group; electrons: Electron[] } {
  const group = new THREE.Group();
  const electrons: Electron[] = [];
  for (let i = 0; i < count; i++) {
    const electron = makeElectron(ELECTRON_CLOUD_RADIUS, ELECTRON_CLOUD_COLOR, 0.9);
    group.add(electron.mesh);
    electrons.push(electron);
  }
  return { group, electrons };
}

// One thin wireframe sphere per shell as a faint boundary marker, purely
// so "these electrons are grouped into a shell" reads visually rather
// than just as a denser or sparser point cloud at some radius.
function buildShellBoundary(radius: number, color: number): THREE.Mesh {
  const material = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.12 });
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 8), material);
}

function buildElectronShells(shells: number[]): { group: THREE.Group; electrons: Electron[] } {
  const group = new THREE.Group();
  const electrons: Electron[] = [];
  const valenceIndex = shells.length - 1;

  shells.forEach((count, shellIndex) => {
    const radius = ELECTRON_SHELL_RADII[Math.min(shellIndex, ELECTRON_SHELL_RADII.length - 1)];
    const isValence = shellIndex === valenceIndex;
    const color = isValence ? VALENCE_SHELL_COLOR : CORE_SHELL_COLOR;

    group.add(buildShellBoundary(radius, color));

    for (let i = 0; i < count; i++) {
      const electron = makeElectron(radius, color, isValence ? 1 : 0.6);
      group.add(electron.mesh);
      electrons.push(electron);
    }
  });

  return { group, electrons };
}

function disposeObject3D(object: THREE.Object3D) {
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
}

const BOND_RADIUS_SINGLE = 0.03;
// Thinner than a single bond's cylinder — two/three full-thickness
// parallel strands would visually read as one fat bar rather than a
// distinguishable double/triple bond.
const BOND_RADIUS_MULTI = 0.02;
const MULTI_BOND_STRAND_OFFSET = 0.045;

// Any vector not parallel to `dir` works as a reference to cross with to
// get a perpendicular — falls back to a different reference when `dir`
// itself is nearly parallel to the usual one, so the cross product never
// degenerates near-zero.
function perpendicularOffset(dir: THREE.Vector3): THREE.Vector3 {
  const reference = Math.abs(dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  return new THREE.Vector3().crossVectors(dir, reference).normalize();
}

// One bond cylinder, centered at `mid`, oriented along `direction`
// (already normalized). Own material instance per strand (not shared) —
// click-to-isolate fades individual bonds independently, which needs
// each one's opacity controllable on its own.
function buildBondStrand(
  mid: { x: number; y: number; z: number },
  direction: THREE.Vector3,
  length: number,
  radius: number
): THREE.Mesh {
  const material = new THREE.MeshBasicMaterial({ color: HUD_CYAN, wireframe: true, transparent: true });
  // Cylinders are built along Y by default, so orient via
  // setFromUnitVectors — same technique the placeholder molecule below
  // already used for its center-to-outer sticks.
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 6), material);
  stick.position.set(mid.x, mid.y, mid.z);
  stick.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  stick.userData = { kind: "bond" };
  return stick;
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

      const direction = new THREE.Vector3(dx, dy, dz).normalize();

      // Real PubChem SDF data always Kekulizes aromatic rings into clean
      // alternating integer bond orders — confirmed live against benzene
      // (CID 241): 1/2 alternating around the ring, no fractional value
      // or separate aromatic flag to handle. 1/2/3 covers every case
      // actually observed; anything else (0, >3, non-integer — which
      // shouldn't happen but isn't worth crashing over) falls back to a
      // single strand rather than guessing at an unrecognized order.
      const order = Number.isInteger(bond.order) && bond.order >= 1 && bond.order <= 3 ? bond.order : 1;

      const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2, z: (from.z + to.z) / 2 };

      if (order === 1) {
        group.add(buildBondStrand(mid, direction, distance, BOND_RADIUS_SINGLE));
      } else {
        // Parallel strands offset perpendicular to the bond axis — order
        // 2 gets two strands straddling the true bond line, order 3 adds
        // a third strand on the line itself. Standard double/triple-bond
        // drawing convention, not a claim about real bonding-electron
        // geometry.
        const perp = perpendicularOffset(direction).multiplyScalar(MULTI_BOND_STRAND_OFFSET);
        const strandOffsets = order === 2 ? [-1, 1] : [-1, 0, 1];
        for (const k of strandOffsets) {
          const strandMid = { x: mid.x + perp.x * k, y: mid.y + perp.y * k, z: mid.z + perp.z * k };
          group.add(buildBondStrand(strandMid, direction, distance, BOND_RADIUS_MULTI));
        }
      }
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

// --- Reaction choreography (Phase A: 1-2 reactants -> 1 product) --------
//
// Reuses buildMolecule for every species (same bond-order rendering, CPK
// coloring, click-to-isolate/reveal/shells as any standalone molecule
// hologram — a reactant or product is nothing more than a molecule
// positioned and animated differently). The transformation itself is
// deliberately NOT a mechanistic simulation — no bond-breaking/forming,
// no atom-by-atom morph — just reactants fading/shrinking/drifting toward
// center while the product fades/grows in at the same spot. Visually
// clear "A + B became C," not chemically rigorous.

const REACTION_SPECIES_SCALE = 0.55; // reactants render smaller than a standalone molecule so 1-2 of them plus the eventual product fit the frame without overlapping
const REACTION_REACTANT_SPACING = 1.7; // x-distance between reactant centers when there are 2
const REACTION_HOLD_MS = 1800; // how long reactants sit still before the transformation starts
const REACTION_CROSSFADE_MS = 1200;
const REACTION_TOTAL_MS = REACTION_HOLD_MS + REACTION_CROSSFADE_MS;
// Where the hold phase ends and the crossfade begins, as a fraction of
// the FULL 0-1 progress range — the single source of truth both
// computeReactionVisualState and the playback-speed math below key off.
const REACTION_HOLD_FRACTION = REACTION_HOLD_MS / REACTION_TOTAL_MS;
// Not literally 0 — a zero-scale Object3D can misbehave in matrix math in
// some three.js code paths, and a near-zero (rather than exactly zero)
// scale is also what keeps a technically-still-there mesh effectively
// unclickable (see the raycast note on ReactionRuntime below).
const REACTION_MIN_SCALE = 0.001;
const REACTION_SEEK_STEP_MS = 1000; // rewind/fast-forward button increment
const REACTION_SPEEDS = [0.25, 0.5, 1, 2, 4] as const;

type ReactionSpeciesRuntime = { group: THREE.Group; baseX: number };

// Returned alongside the built THREE.Group so the caller (the scene
// effect below) can drive the crossfade every frame — the group itself
// is just geometry, it has no opinion about time. reactantBaseScale/
// productBaseScale default to REACTION_SPECIES_SCALE/1 (see
// buildReactionContainer) — the exact multipliers the already-tested
// free-floating layout always used — and only shrink further when a
// vessel scenario needs the species to actually fit inside a beaker (see
// the vessel section below); applyReactionState itself doesn't know or
// care which case it's in.
type ReactionRuntime = {
  group: THREE.Group;
  reactants: ReactionSpeciesRuntime[];
  products: THREE.Group[];
  reactantBaseScale: number;
  productBaseScale: number;
  vessel?: VesselRuntime;
};

// Sets opacity uniformly across every mesh in a group, forcing
// `transparent = true` along the way — buildGenericMolecule's placeholder
// material doesn't set that up front the way buildMoleculeFromStructure's
// real-structure materials do (see that function's own comment on why),
// so a reactant/product that fell back to the placeholder still needs it
// set here before opacity animation has any visible effect.
function setGroupOpacity(group: THREE.Group, opacity: number) {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const material = child.material as THREE.MeshBasicMaterial;
      material.transparent = true;
      material.opacity = opacity;
    }
  });
}

// Pure function of `progress` (0-1, spanning the full hold+crossfade
// sequence) — no clock, no side effects. This is what makes playback
// controls possible at all: normal playback is just "advance progress by
// speed*deltaTime each frame," pause is "stop advancing it," and
// scrub/rewind/fast-forward are all just "set progress directly," and
// applying it (see applyReactionState below) always produces the exact
// same visual result for a given progress value regardless of how it got
// there.
type ReactionVisualState = {
  reactantOpacity: number;
  reactantScaleFactor: number; // multiplies REACTION_SPECIES_SCALE
  reactantPositionFactor: number; // multiplies each reactant's baseX
  productOpacity: number;
  productScale: number; // absolute, not a factor — the product's target scale is always 1
};

function computeReactionVisualState(progress: number): ReactionVisualState {
  const clamped = Math.min(1, Math.max(0, progress));

  if (clamped <= REACTION_HOLD_FRACTION) {
    // Hold phase — reactants full opacity/scale/position, product not
    // there yet. Also what a scrub backward into this range should show:
    // the un-faded starting state, not some interpolated remnant.
    return {
      reactantOpacity: 1,
      reactantScaleFactor: 1,
      reactantPositionFactor: 1,
      productOpacity: 0,
      productScale: REACTION_MIN_SCALE,
    };
  }

  const crossfadeProgress = (clamped - REACTION_HOLD_FRACTION) / (1 - REACTION_HOLD_FRACTION); // 0-1 within the crossfade itself
  return {
    reactantOpacity: 1 - crossfadeProgress,
    reactantScaleFactor: 1 - 0.4 * crossfadeProgress,
    reactantPositionFactor: 1 - crossfadeProgress, // drift toward center — the "merge" cue
    productOpacity: crossfadeProgress,
    productScale: REACTION_MIN_SCALE + (1 - REACTION_MIN_SCALE) * crossfadeProgress,
  };
}

function applyReactionState(runtime: ReactionRuntime, progress: number) {
  const state = computeReactionVisualState(progress);
  for (const { group, baseX } of runtime.reactants) {
    setGroupOpacity(group, state.reactantOpacity);
    group.scale.setScalar(runtime.reactantBaseScale * state.reactantScaleFactor);
    group.position.x = baseX * state.reactantPositionFactor;
  }
  for (const group of runtime.products) {
    setGroupOpacity(group, state.productOpacity);
    group.scale.setScalar(state.productScale * runtime.productBaseScale);
  }
}

// `vessel` is only ever present for a word-problem-style reaction ("A
// dissolved in B, heated to..." — see ReactionVessel) — when it's there,
// reactants spawn above the beaker's rim (for applyVesselSetupState's
// drop tween to bring down) and everything renders at the smaller
// VESSEL_SPECIES_SCALE so it actually fits inside the vessel body;
// otherwise this is byte-for-byte the original free-floating layout.
function buildReactionContainer(
  reactants: ReactionSpecies[],
  products: ReactionSpecies[],
  vessel?: ReactionVessel
): ReactionRuntime {
  const group = new THREE.Group();
  const reactantRuntimes: ReactionSpeciesRuntime[] = [];
  const productGroups: THREE.Group[] = [];
  const reactantSpacing = vessel ? VESSEL_REACTANT_SPACING : REACTION_REACTANT_SPACING;
  const restY = vessel ? VESSEL_LIQUID_REST_Y : 0;

  // Geometry/position only here — opacity, scale, and drift are all a
  // pure function of progress (see computeReactionVisualState above), so
  // the caller applies the actual initial visual state via
  // applyReactionState(runtime, 0) immediately after building this,
  // rather than this function guessing at "progress 0" values itself and
  // risking the two falling out of sync. Same reasoning applies to Y
  // position in vessel mode: applyVesselSetupState(runtime, 0) paints the
  // real starting drop position right after this returns.
  reactants.forEach((species, i) => {
    const sub = buildMolecule(species.structure);
    const baseX = reactants.length > 1 ? (i - (reactants.length - 1) / 2) * reactantSpacing : 0;
    sub.position.x = baseX;
    sub.position.y = vessel ? VESSEL_DROP_START_Y : 0;
    group.add(sub);
    reactantRuntimes.push({ group: sub, baseX });
  });

  products.forEach((species) => {
    const sub = buildMolecule(species.structure);
    sub.position.x = 0;
    sub.position.y = restY;
    group.add(sub);
    productGroups.push(sub);
  });

  // Same generic "model" tag buildObject applies for every non-molecule
  // hologram type — needed here too since reaction mode never calls
  // buildObject at all (see the scene effect below), so that pass never
  // runs for these groups otherwise. Every reactant/product here is
  // actually a molecule (real or generic-placeholder), so in practice
  // this only ever catches the generic placeholder's own meshes (real
  // per-atom molecules already tag themselves "atom"/"bond"). Runs
  // before the vessel/solvent are added below, since those tag
  // themselves directly (see buildVessel/buildSolventFill) rather than
  // relying on this generic sweep.
  group.traverse((child) => {
    if (child instanceof THREE.Mesh && !child.userData.kind) {
      child.userData.kind = "model";
    }
  });

  let vesselRuntime: VesselRuntime | undefined;
  if (vessel) {
    const vesselGroup = buildVessel();
    const solvent = buildSolventFill();
    vesselGroup.add(solvent);
    group.add(vesselGroup);
    vesselRuntime = { group: vesselGroup, solvent };
  }

  return {
    group,
    reactants: reactantRuntimes,
    products: productGroups,
    reactantBaseScale: vessel ? VESSEL_SPECIES_SCALE : REACTION_SPECIES_SCALE,
    productBaseScale: vessel ? VESSEL_SPECIES_SCALE : 1,
    vessel: vesselRuntime,
  };
}

// --- Vessel/beaker scenario (Phase A follow-up) ---
// Word-problem reactions ("X dissolved in Y in a beaker...") get a
// physical setup around the same reactant/product molecules and the same
// crossfade transformation built above — a beaker vessel, a staggered
// "dropping in" animation for each reactant, and a translucent solvent
// fill standing in for "now it's in solution." This setup plays once,
// automatically, and is deliberately NOT part of the scrubbable
// reactionProgressRef timeline (see the animate() loop in HologramPanel)
// — reactionProgressRef only starts advancing once the setup is done, so
// the existing playback controls always mean exactly what they already
// meant: scrubbing/pausing/speed only ever apply to the crossfade, never
// to the vessel setup. Letting the setup itself be scrubbable would mean
// every already-verified progress-to-visual-state mapping now depends on
// whether a vessel is present — exactly the kind of coupling the
// progress-based crossfade refactor was designed to avoid.

const VESSEL_BOTTOM_Y = -1.05;
const VESSEL_BODY_RADIUS = 0.78;
const VESSEL_BODY_TOP_Y = 0.65;
const VESSEL_LIP_RADIUS = 0.94;
const VESSEL_RIM_Y = 0.85;
const VESSEL_FILL_TOP_Y = 0.1; // solvent surface height — left below the rim for headroom
const VESSEL_LIQUID_REST_Y = -0.3; // where dropped-in reactants (and the eventual product) come to rest
const VESSEL_DROP_START_Y = VESSEL_RIM_Y + 1.4; // reactants start above the rim, out of frame at first
const VESSEL_SPECIES_SCALE = 0.42; // smaller than REACTION_SPECIES_SCALE — has to actually fit inside the vessel body
const VESSEL_REACTANT_SPACING = 0.55;
const VESSEL_SOLVENT_MAX_OPACITY = 0.16;
const VESSEL_DROP_STAGGER_MS = 500; // the next reactant starts dropping this long after the previous one
const VESSEL_DROP_DURATION_MS = 700; // how long a single reactant's drop tween takes
const VESSEL_SOLVENT_FADE_MS = 600; // solvent fill fades in after the last reactant lands

function vesselSetupTotalMs(reactantCount: number): number {
  return (reactantCount - 1) * VESSEL_DROP_STAGGER_MS + VESSEL_DROP_DURATION_MS + VESSEL_SOLVENT_FADE_MS;
}

type VesselRuntime = { group: THREE.Group; solvent: THREE.Mesh };

// Simple cylindrical beaker body with a slight taper and a flared pour
// lip, revolved from a 2D radius/height profile via LatheGeometry — the
// same "outline over faint fill" holographic treatment as every other
// solid in this file (see buildHolographicSolid), just built from a lathe
// profile instead of an extruded 2D shape the way the card is. A real
// beaker's pour spout is a break in the rim's radial symmetry, which a
// lathe revolve can't produce at all without a separate non-axisymmetric
// patch — not worth the extra geometry for what only needs to read as "a
// beaker" at a glance, so the lip is a plain flared rim with no spout
// notch.
function buildVessel(): THREE.Group {
  const profile = [
    new THREE.Vector2(0, VESSEL_BOTTOM_Y),
    new THREE.Vector2(VESSEL_BODY_RADIUS * 0.9, VESSEL_BOTTOM_Y),
    new THREE.Vector2(VESSEL_BODY_RADIUS, VESSEL_BOTTOM_Y + 0.08),
    new THREE.Vector2(VESSEL_BODY_RADIUS, VESSEL_BODY_TOP_Y),
    new THREE.Vector2(VESSEL_BODY_RADIUS * 0.96, VESSEL_BODY_TOP_Y + 0.06),
    new THREE.Vector2(VESSEL_LIP_RADIUS, VESSEL_RIM_Y),
    new THREE.Vector2(VESSEL_LIP_RADIUS * 0.88, VESSEL_RIM_Y + 0.015),
  ];
  const geometry = new THREE.LatheGeometry(profile, 48);
  return buildHolographicSolid(geometry, HUD_CYAN);
}

// Translucent fill cylinder standing in for "now it's in solution" — see
// this phase's fix note for why this (a plain colored volume) rather than
// rendering individual solvent molecules: it's honest about not being a
// real solvation simulation and doesn't require solving how to render
// thousands of water molecules sensibly. Starts fully transparent;
// applyVesselSetupState fades it in once the reactants have landed.
function buildSolventFill(): THREE.Mesh {
  const height = VESSEL_FILL_TOP_Y - (VESSEL_BOTTOM_Y + 0.08);
  const geometry = new THREE.CylinderGeometry(VESSEL_BODY_RADIUS * 0.92, VESSEL_BODY_RADIUS * 0.92, height, 32);
  const material = new THREE.MeshBasicMaterial({ color: HUD_CYAN, transparent: true, opacity: 0 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = VESSEL_BOTTOM_Y + 0.08 + height / 2;
  mesh.userData = { kind: "model" };
  return mesh;
}

// Pure function of setup progress (0-1, spanning the whole drop+fill
// sequence — see vesselSetupTotalMs), same "no clock, just a function of
// progress" shape as computeReactionVisualState above and for the same
// reason: it's what lets the setup be driven deterministically from
// accumulated deltaMs regardless of frame timing.
type VesselSetupState = {
  reactantDropProgress: number[]; // one per reactant, in order — 0 at the rim, 1 landed
  solventOpacity: number; // 0-1, multiplies VESSEL_SOLVENT_MAX_OPACITY
};

function computeVesselSetupState(progress: number, reactantCount: number): VesselSetupState {
  const totalMs = vesselSetupTotalMs(reactantCount);
  const progressMs = Math.min(1, Math.max(0, progress)) * totalMs;

  let lastLandMs = 0;
  const reactantDropProgress: number[] = [];
  for (let i = 0; i < reactantCount; i++) {
    const startMs = i * VESSEL_DROP_STAGGER_MS;
    const endMs = startMs + VESSEL_DROP_DURATION_MS;
    lastLandMs = Math.max(lastLandMs, endMs);
    const local = Math.min(1, Math.max(0, (progressMs - startMs) / VESSEL_DROP_DURATION_MS));
    reactantDropProgress.push(1 - (1 - local) ** 2); // ease-out — decelerates into the landing rather than stopping abruptly
  }

  const solventOpacity = Math.min(1, Math.max(0, (progressMs - lastLandMs) / VESSEL_SOLVENT_FADE_MS));

  return { reactantDropProgress, solventOpacity };
}

function applyVesselSetupState(runtime: ReactionRuntime, progress: number) {
  const vessel = runtime.vessel;
  if (!vessel) return;
  const state = computeVesselSetupState(progress, runtime.reactants.length);
  runtime.reactants.forEach(({ group }, i) => {
    const t = state.reactantDropProgress[i] ?? 1;
    group.position.y = VESSEL_DROP_START_Y + (VESSEL_LIQUID_REST_Y - VESSEL_DROP_START_Y) * t;
  });
  (vessel.solvent.material as THREE.MeshBasicMaterial).opacity = state.solventOpacity * VESSEL_SOLVENT_MAX_OPACITY;
}

// Stylized network/issuer color differentiation — explicitly NOT an
// attempt at real card artwork or logos (exact branded designs are a
// trademark question, not an engineering one). Just a body/chip color
// keyed off whichever network name appears in the hologram's label — a
// Visa card reads as a blue rectangle, Mastercard as red, etc., same
// idea as any other wireframe hologram in this file, colored instead of
// uniformly cyan. Falls back to the plain HUD_CYAN scheme (the original,
// pre-differentiation look) whenever no known network name is found —
// e.g. a generic "gift card" or an issuer this list doesn't cover.
const CARD_NETWORK_COLORS: { pattern: RegExp; color: number }[] = [
  { pattern: /\bvisa\b/i, color: 0x2a5bd7 },
  { pattern: /\bmastercard\b/i, color: 0xeb4034 },
  { pattern: /\b(amex|american express)\b/i, color: 0x2fa8a0 },
  { pattern: /\bdiscover\b/i, color: 0xff8a1e },
];

function detectCardNetworkColor(label: string): number {
  const match = CARD_NETWORK_COLORS.find(({ pattern }) => pattern.test(label));
  return match ? match.color : HUD_CYAN;
}

// Real ISO/IEC 7810 ID-1 proportions (85.60mm x 53.98mm, ~3.18mm corner
// radius) scaled to the same 3.37-unit width the old flat-box card
// already used, so this reads at the same on-screen size as before.
const CARD_WIDTH = 3.37;
const CARD_HEIGHT = 2.12;
const CARD_DEPTH = 0.06;
const CARD_CORNER_RADIUS = 0.13;

function roundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const w = width / 2;
  const h = height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-w + radius, -h);
  shape.lineTo(w - radius, -h);
  shape.quadraticCurveTo(w, -h, w, -h + radius);
  shape.lineTo(w, h - radius);
  shape.quadraticCurveTo(w, h, w - radius, h);
  shape.lineTo(-w + radius, h);
  shape.quadraticCurveTo(-w, h, -w, h - radius);
  shape.lineTo(-w, -h + radius);
  shape.quadraticCurveTo(-w, -h, -w + radius, -h);
  shape.closePath();
  return shape;
}

// Crisp outline (EdgesGeometry + LineSegments) over a near-transparent
// fill, rather than a wireframe box — a wireframe box shows every
// triangle's diagonal as a crosshatch; this shows only the silhouette
// and face boundaries, reading as a clean card outline the way the
// molecule/bond holograms elsewhere in this file read as clean
// sphere-and-stick outlines rather than a mess of triangle edges.
function buildHolographicSolid(geometry: THREE.BufferGeometry, color: number): THREE.Group {
  const group = new THREE.Group();

  const fillMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.08 });
  const fill = new THREE.Mesh(geometry, fillMaterial);
  fill.userData = { kind: "model" };
  group.add(fill);

  const edgesGeometry = new THREE.EdgesGeometry(geometry);
  const edges = new THREE.LineSegments(edgesGeometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 }));
  group.add(edges);

  // Rim-glow approximation — WebGL's LineBasicMaterial ignores linewidth
  // on most platforms (a long-standing driver limitation, not a bug
  // here), so a real Fresnel-edge shader would be the "correct" way to
  // get a glowing rim; a couple of the same outline drawn slightly
  // larger and dimmer underneath is the standard cheap substitute for
  // that, and is visually close enough for a HUD-style hologram.
  for (const [scale, opacity] of [
    [1.04, 0.22],
    [1.09, 0.1],
  ] as const) {
    const glowEdges = new THREE.LineSegments(
      edgesGeometry,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity })
    );
    glowEdges.scale.set(scale, scale, 1);
    group.add(glowEdges);
  }

  return group;
}

// A handful of thin line segments across the chip face, standing in for
// an EMV contact grid — abstract pattern, not a reproduction of any real
// chip's actual contact layout.
function buildChipGridLines(width: number, height: number, color: number): THREE.LineSegments {
  const points: THREE.Vector3[] = [];
  const w = width / 2;
  const h = height / 2;
  for (const fx of [-0.3, 0, 0.3]) {
    points.push(new THREE.Vector3(fx * width, -h, 0), new THREE.Vector3(fx * width, h, 0));
  }
  for (const fy of [-0.25, 0.25]) {
    points.push(new THREE.Vector3(-w, fy * height, 0), new THREE.Vector3(w, fy * height, 0));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 }));
}

// Small raised block(s) standing in for card-number/expiry/cardholder-
// name embossing — abstract rectangles at roughly the right position and
// scale, deliberately not actual rendered glyphs (no text geometry, no
// specific wordmark). "Raised" the same way the chip is: offset slightly
// above the front face in z, like real embossed printing.
function buildEmbossedBlock(width: number, height: number, color: number): THREE.Mesh {
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75 });
  return new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.015), material);
}

// Credit/debit card — real rounded-rectangle ISO/IEC 7810 silhouette
// rendered as a holographic solid (semi-transparent fill + glowing
// edges, see buildHolographicSolid), with an embossed chip, a magnetic
// stripe on the reverse face, and abstract raised placeholders where a
// card number/expiry/cardholder name would sit. Deliberately excludes
// any brand-specific logo, wordmark, or text — see this function's
// call site in TOOL_DEFINITIONS' schema note and the fix note this was
// built from for why: reproducing an issuer's actual card artwork is a
// trademark question, not an engineering one, and was explicitly scoped
// out.
function buildCard(label: string): THREE.Group {
  const group = new THREE.Group();
  const color = detectCardNetworkColor(label);

  const cardShape = roundedRectShape(CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
  const bodyGeometry = new THREE.ExtrudeGeometry(cardShape, { depth: CARD_DEPTH, bevelEnabled: false });
  bodyGeometry.translate(0, 0, -CARD_DEPTH / 2); // center the extrusion on z=0 like every other hologram in this file
  const body = buildHolographicSolid(bodyGeometry, color);
  group.add(body);

  // EMV chip — real cards place this roughly a third of the way down
  // from the top edge, a similar distance in from the left edge; "upper-
  // left third of the face" per the fix note.
  const chipWidth = 0.55;
  const chipHeight = 0.42;
  const chipShape = roundedRectShape(chipWidth, chipHeight, 0.06);
  const chipGeometry = new THREE.ExtrudeGeometry(chipShape, { depth: 0.02, bevelEnabled: false });
  const chip = buildHolographicSolid(chipGeometry, color);
  const chipX = -CARD_WIDTH / 2 + 0.75;
  const chipY = CARD_HEIGHT / 2 - 0.62;
  chip.position.set(chipX, chipY, CARD_DEPTH / 2);
  group.add(chip);

  const chipGrid = buildChipGridLines(chipWidth * 0.75, chipHeight * 0.7, color);
  chipGrid.position.set(chipX, chipY, CARD_DEPTH / 2 + 0.021);
  group.add(chipGrid);

  // Magnetic stripe — reverse face (opposite z side from the chip),
  // positioned near the top the way it is on a real card. Solid dark
  // fill rather than the translucent holographic treatment everything
  // else here uses: a mag stripe reads as an opaque physical band, not
  // part of the glowing hologram material.
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(CARD_WIDTH - 0.2, 0.32, 0.01),
    new THREE.MeshBasicMaterial({ color: 0x0a0e16, transparent: true, opacity: 0.85 })
  );
  stripe.position.set(0, CARD_HEIGHT / 2 - 0.35, -CARD_DEPTH / 2 - 0.006);
  stripe.userData = { kind: "model" };
  group.add(stripe);

  // Abstract embossed placeholders — card number (four digit-group
  // blocks), expiry, and cardholder name. Positions match where these
  // sit on a real card; content is intentionally just blank raised bars.
  const numberY = -0.35;
  const numberGroupWidth = 0.42;
  const numberGap = 0.14;
  const numberStartX = -CARD_WIDTH / 2 + 0.55;
  for (let i = 0; i < 4; i++) {
    const block = buildEmbossedBlock(numberGroupWidth, 0.16, color);
    block.position.set(numberStartX + i * (numberGroupWidth + numberGap) + numberGroupWidth / 2, numberY, CARD_DEPTH / 2);
    group.add(block);
  }

  const nameBlock = buildEmbossedBlock(1.3, 0.1, color);
  nameBlock.position.set(-CARD_WIDTH / 2 + 0.55 + 1.3 / 2, -0.68, CARD_DEPTH / 2);
  group.add(nameBlock);

  const expiryBlock = buildEmbossedBlock(0.45, 0.1, color);
  expiryBlock.position.set(CARD_WIDTH / 2 - 0.55, -0.68, CARD_DEPTH / 2);
  group.add(expiryBlock);

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

function buildObject(
  objectType: Exclude<HologramObjectType, "reaction">,
  structure: HologramStructure | undefined,
  label: string
): THREE.Group {
  const group = (() => {
    switch (objectType) {
      case "card":
        return buildCard(label);
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
  // Non-null exactly when isolated — the click raycast (see handleClick
  // in the scene effect) reads this synchronously to restrict its hit
  // targets to just this mesh while isolated, since a ref (unlike
  // isIsolated state) is guaranteed current inside an imperative event
  // handler closure. isIsolated itself stays purely for the "Show all"
  // button's conditional render.
  const isolatedMeshRef = useRef<THREE.Mesh | null>(null);
  const [isIsolated, setIsIsolated] = useState(false);

  // --- Subatomic reveal / electron shells (Phase 2) ---
  // Keyed by the original atom sphere mesh — one entry per currently-
  // revealed atom, holding the nucleus/electron THREE objects the
  // animate() loop needs to update every frame (jitter/orbit) and the
  // objects reveal/unreveal need to add/remove from the scene.
  const revealedAtomsRef = useRef<
    Map<
      THREE.Mesh,
      {
        mode: "cloud" | "shells";
        nucleusGroup: THREE.Group;
        electronGroup: THREE.Group;
        nucleons: Nucleon[];
        electrons: Electron[];
        priorOpacity: number;
      }
    >
  >(new Map());
  const animationFrameCountRef = useRef(0); // drives nucleon jitter phase — see animate() below

  // --- Reaction choreography + playback controls (Phase A + controls) ---
  // reactionProgressRef (0-1, spanning the whole hold+crossfade sequence)
  // is the single source of truth applyReactionState reads every frame —
  // normal playback advances it by speed*deltaTime, pause just stops
  // advancing it, and scrub/rewind/fast-forward all just set it directly.
  // All in refs, not state: the animate() loop is a plain rAF callback,
  // not a React render, so it needs the CURRENT value synchronously each
  // frame. reactionProgressStateRef mirrors the value into the scrub
  // bar's DOM node directly (see the scrub <input> below) rather than via
  // React state, which would mean a re-render on every one of ~60
  // frames/sec during normal playback — same reasoning as spinPausedRef
  // above for orbit, just for a value that changes continuously instead
  // of only on user action.
  const reactionRuntimeRef = useRef<ReactionRuntime | null>(null);
  const reactionProgressRef = useRef(0);
  const reactionPlayingRef = useRef(true); // autoplays on a fresh reaction hologram, same as the original non-controllable version did
  const reactionSpeedRef = useRef<number>(1);
  const reactionLastFrameTimeRef = useRef<number | null>(null);
  const scrubInputRef = useRef<HTMLInputElement | null>(null);
  const [isReactionPlaying, setIsReactionPlaying] = useState(true);
  const [reactionSpeed, setReactionSpeed] = useState<number>(1);
  const isReactionHologram = hologram.objectType === "reaction";
  const reactionVessel = hologram.objectType === "reaction" ? hologram.vessel : undefined;
  const hasVessel = !!reactionVessel;

  // --- Vessel/beaker scenario setup (see buildVessel/applyVesselSetupState
  // above) — a separate 0-1 progress ref from reactionProgressRef, since
  // the setup (vessel + drop-in + solvent fill) is a fixed intro that
  // plays once automatically and is never itself scrubbable; see the
  // vessel section's own comment for why. In a ref for the same reason
  // as every other value the animate() rAF loop reads every frame.
  const vesselSetupProgressRef = useRef(0);

  // Only meaningful when there's real per-atom element data to label —
  // the generic placeholder molecule (see buildGenericMolecule) has no
  // CSS2DObject children at all, and non-molecule holograms never did
  // either, so the toggle button only renders when it would actually do
  // something. For a reaction, true if ANY reactant/product resolved a
  // real structure (any one of them could still have fallen back to the
  // placeholder and would just have no labels of its own).
  const hasLabels =
    (hologram.objectType === "molecule" && !!hologram.structure) ||
    (hologram.objectType === "reaction" &&
      [...hologram.reactants, ...hologram.products].some((species) => !!species.structure));

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
    isolatedMeshRef.current = mesh;
    setIsIsolated(true);
    clearSelectionMenu();
  }

  function showAll() {
    for (const m of interactiveMeshesRef.current) {
      (m.material as THREE.MeshBasicMaterial).opacity = 1;
    }
    isolatedMeshRef.current = null;
    setIsIsolated(false);
  }

  // --- Reaction playback controls ---
  // Every manual seek (scrub/rewind/fast-forward) pauses playback first —
  // a jump while still advancing on its own would fight the user's
  // input and read as stuttery. Scrubbing does NOT auto-resume on
  // release either; staying paused wherever you left it is the same
  // "safer default for something meant to be studied" call already made
  // for auto-pause-at-end below.
  function setReactionProgress(next: number) {
    const clamped = Math.min(1, Math.max(0, next));
    reactionProgressRef.current = clamped;
    if (reactionRuntimeRef.current) applyReactionState(reactionRuntimeRef.current, clamped);
    if (scrubInputRef.current) scrubInputRef.current.value = String(clamped);
  }

  function pauseReactionPlayback() {
    reactionPlayingRef.current = false;
    setIsReactionPlaying(false);
  }

  function toggleReactionPlaying() {
    const next = !reactionPlayingRef.current;
    // Resuming from the very end restarts from the beginning instead of
    // just re-arming a loop that's already sitting at progress 1 (which
    // would visibly do nothing when Play is pressed) — this is the
    // "meant to be studied" case where you watched it once and want to
    // watch it again, not a real loop mode.
    if (next && reactionProgressRef.current >= 1) {
      setReactionProgress(0);
    }
    reactionPlayingRef.current = next;
    setIsReactionPlaying(next);
  }

  function seekReactionBy(deltaMs: number) {
    pauseReactionPlayback();
    setReactionProgress(reactionProgressRef.current + deltaMs / REACTION_TOTAL_MS);
  }

  function handleScrubInput(event: React.ChangeEvent<HTMLInputElement>) {
    pauseReactionPlayback();
    setReactionProgress(Number(event.target.value));
  }

  function setPlaybackSpeed(speed: number) {
    reactionSpeedRef.current = speed;
    setReactionSpeed(speed);
  }

  // Replaces an atom sphere with a nucleus + electron cloud/shells.
  // Doesn't remove the sphere from the scene (a removed mesh can't be
  // re-clicked to bring the menu back and toggle reveal off) — instead
  // it's faded to opacity 0 but stays raycast-hittable, since three.js
  // raycasting is purely geometric and doesn't consider material opacity
  // or transparency at all.
  function revealAtom(sphere: THREE.Mesh, mode: "cloud" | "shells") {
    const existing = revealedAtomsRef.current.get(sphere);
    if (existing?.mode === mode) return; // already showing exactly this
    if (existing) teardownReveal(sphere, existing);

    const userData = sphere.userData as SceneUserData;
    const element = userData.element ? lookupElement(userData.element) : null;
    if (!element) return; // outside H-Kr (see lib/periodic-table-data.ts) — no data to reveal accurately, leave the plain sphere as-is

    const parent = sphere.parent;
    if (!parent) return;

    const { group: nucleusGroup, nucleons } = buildNucleus(element.atomicNumber, neutronCount(element));
    nucleusGroup.position.copy(sphere.position);
    parent.add(nucleusGroup);

    const { group: electronGroup, electrons } =
      mode === "shells" ? buildElectronShells(element.shells) : buildElectronCloud(element.atomicNumber);
    electronGroup.position.copy(sphere.position);
    parent.add(electronGroup);

    const material = sphere.material as THREE.MeshBasicMaterial;
    const priorOpacity = material.opacity;
    material.opacity = 0;

    revealedAtomsRef.current.set(sphere, { mode, nucleusGroup, electronGroup, nucleons, electrons, priorOpacity });
  }

  function teardownReveal(
    sphere: THREE.Mesh,
    entry: NonNullable<ReturnType<(typeof revealedAtomsRef)["current"]["get"]>>
  ) {
    entry.nucleusGroup.parent?.remove(entry.nucleusGroup);
    entry.electronGroup.parent?.remove(entry.electronGroup);
    disposeObject3D(entry.nucleusGroup);
    disposeObject3D(entry.electronGroup);
    (sphere.material as THREE.MeshBasicMaterial).opacity = entry.priorOpacity;
  }

  function unrevealAtom(sphere: THREE.Mesh) {
    const entry = revealedAtomsRef.current.get(sphere);
    if (!entry) return;
    teardownReveal(sphere, entry);
    revealedAtomsRef.current.delete(sphere);
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
    isolatedMeshRef.current = null;
    setIsIsolated(false);
    revealedAtomsRef.current = new Map(); // the meshes these referenced belong to the previous scene, about to be disposed below
    animationFrameCountRef.current = 0;
    reactionRuntimeRef.current = null;
    reactionProgressRef.current = 0;
    reactionPlayingRef.current = true;
    reactionSpeedRef.current = 1;
    reactionLastFrameTimeRef.current = null;
    setIsReactionPlaying(true);
    setReactionSpeed(1);
    vesselSetupProgressRef.current = 0;

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

    const object =
      hologram.objectType === "reaction"
        ? (() => {
            const runtime = buildReactionContainer(hologram.reactants, hologram.products, hologram.vessel);
            reactionRuntimeRef.current = runtime;
            applyReactionState(runtime, reactionProgressRef.current); // paints the actual progress=0 starting state — see buildReactionContainer's own comment on why it doesn't set this itself
            applyVesselSetupState(runtime, vesselSetupProgressRef.current); // no-op when there's no vessel — paints the drop-start/solvent-invisible starting state otherwise
            return runtime.group;
          })()
        : buildObject(hologram.objectType, hologram.structure, hologram.label);
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

      // Reveal/Shells are independent of each other and of Isolate (not
      // nested under one another) — atom-kind meshes only, since bonds
      // don't have a nucleus/electrons to reveal. Label reflects current
      // state at the moment the menu is built (rebuilt fresh on every
      // selection, so it's never stale): "Reveal"/"Hide subatomic" and
      // "Shells"/"Hide shells" toggle that specific mode off if it's
      // already active, or switch to it otherwise (revealAtom tears down
      // and rebuilds if the other mode was active — see its own comment).
      if ((mesh.userData as SceneUserData).kind === "atom") {
        const current = revealedAtomsRef.current.get(mesh);

        const revealBtn = document.createElement("button");
        revealBtn.type = "button";
        revealBtn.textContent = current?.mode === "cloud" ? "Hide subatomic" : "Reveal";
        revealBtn.onclick = (ev) => {
          ev.stopPropagation();
          if (current?.mode === "cloud") unrevealAtom(mesh);
          else revealAtom(mesh, "cloud");
          clearSelectionMenu();
        };
        div.appendChild(revealBtn);

        const shellsBtn = document.createElement("button");
        shellsBtn.type = "button";
        shellsBtn.textContent = current?.mode === "shells" ? "Hide shells" : "Shells";
        shellsBtn.onclick = (ev) => {
          ev.stopPropagation();
          if (current?.mode === "shells") unrevealAtom(mesh);
          else revealAtom(mesh, "shells");
          clearSelectionMenu();
        };
        div.appendChild(shellsBtn);
      }

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
      // While isolated, every other atom/bond is faded to near-zero
      // opacity but was otherwise still a full raycast target — a click
      // could geometrically hit one of those invisible meshes first
      // (whichever is nearest the camera along that ray) and silently
      // select the wrong, invisible atom instead of the one actually
      // visible on screen. Restricting the hit-test to just the isolated
      // mesh means anything else — faded geometry included — behaves
      // like it looks: not there, so a click "through" it correctly
      // falls through to a background click instead.
      const raycastTargets = isolatedMeshRef.current ? [isolatedMeshRef.current] : allInteractiveMeshes;
      const hits = raycaster.intersectObjects(raycastTargets, false);

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

      // Subatomic reveal animation — nucleons jitter around their base
      // offset, electrons continuously rotate around their own random
      // axis ("buzzing"). Runs regardless of drag/pause state, same as
      // the label projection below — this is per-atom internal motion,
      // independent of whether the whole molecule itself is spinning.
      animationFrameCountRef.current += 1;
      const t = animationFrameCountRef.current;
      for (const entry of revealedAtomsRef.current.values()) {
        for (const nucleon of entry.nucleons) {
          nucleon.mesh.position.set(
            nucleon.baseOffset.x + 0.008 * Math.sin(t * 0.15 + nucleon.phase),
            nucleon.baseOffset.y + 0.008 * Math.sin(t * 0.13 + nucleon.phase * 1.3),
            nucleon.baseOffset.z + 0.008 * Math.sin(t * 0.17 + nucleon.phase * 0.7)
          );
        }
        for (const electron of entry.electrons) {
          electron.vector.applyAxisAngle(electron.axis, electron.speed);
          electron.mesh.position.copy(electron.vector);
        }
      }

      // Reaction playback — this loop runs every real frame regardless of
      // play/pause (same as the orbit rotation above), so `now - last`
      // stays a normal small frame-to-frame delta even across however
      // long the reaction sits paused; no special "reset the clock on
      // resume" logic needed, since pausing never lets a large gap
      // accumulate in the first place. Only ADVANCING reactionProgressRef
      // is gated on isPlaying — applying the current progress to the
      // scene happens every frame either way, since a paused (or
      // just-scrubbed) reaction still needs to render at wherever it is.
      if (reactionRuntimeRef.current) {
        const runtime = reactionRuntimeRef.current;
        const now = performance.now();
        const last = reactionLastFrameTimeRef.current ?? now;
        const deltaMs = now - last;
        reactionLastFrameTimeRef.current = now;

        // Vessel setup (drop-in + solvent fill) advances on its own real-
        // time clock, same "runs every frame regardless of play/pause"
        // reasoning as the crossfade below — it isn't gated on
        // reactionPlayingRef at all, since it isn't user-controllable in
        // the first place (see the vessel section's own comment on why).
        // Once it reaches 1 this becomes a cheap no-op every frame after.
        const vesselDone = !runtime.vessel || vesselSetupProgressRef.current >= 1;
        if (runtime.vessel && !vesselDone) {
          const totalMs = vesselSetupTotalMs(runtime.reactants.length);
          vesselSetupProgressRef.current = Math.min(1, vesselSetupProgressRef.current + deltaMs / totalMs);
          applyVesselSetupState(runtime, vesselSetupProgressRef.current);
        }

        // The crossfade itself only starts advancing once the vessel
        // setup (if any) has finished landing every reactant and fading
        // in the solvent — handing off cleanly into the already-built,
        // already-tested playback system described above, rather than
        // racing the two animations against each other.
        if (reactionPlayingRef.current && vesselDone) {
          reactionProgressRef.current = Math.min(
            1,
            reactionProgressRef.current + (deltaMs * reactionSpeedRef.current) / REACTION_TOTAL_MS
          );
          if (reactionProgressRef.current >= 1) {
            // Auto-pause at the end rather than looping — this is meant
            // to be studied, not watched passively on a loop.
            reactionPlayingRef.current = false;
            setIsReactionPlaying(false);
          }
        }

        applyReactionState(runtime, reactionProgressRef.current);

        // Keeps the scrub bar's thumb position in sync during normal
        // playback without a React re-render every frame — see this
        // ref's own declaration comment for why state isn't used here.
        if (scrubInputRef.current && document.activeElement !== scrubInputRef.current) {
          scrubInputRef.current.value = String(reactionProgressRef.current);
        }
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
    // Rebuilds the whole scene on a new hologram rather than swapping
    // geometry in place — these takeovers are infrequent (once per
    // proactively-triggered voice response), so the simplicity of a full
    // remount outweighs any benefit from a more surgical update. Depends
    // on the whole `hologram` object (every SSE event constructs a fresh
    // one, so reference inequality alone is enough to detect a real
    // change) rather than picking out individual fields, now that its
    // shape varies by objectType (a "reaction" hologram has no single
    // `structure` field the way every other type does). showLabels is
    // deliberately NOT a dependency here — toggling it is handled by the
    // separate effect below, which flips .visible on the already-built
    // label objects rather than rebuilding the whole scene for a pure
    // visibility change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hologram]);

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
      {hasVessel && reactionVessel?.conditions && (
        <div className="hud-hologram-vessel-conditions">{reactionVessel.conditions}</div>
      )}
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
      {isReactionHologram && (
        <div className="hud-hologram-reaction-controls">
          <button
            type="button"
            className="hud-hologram-reaction-btn"
            onClick={() => seekReactionBy(-REACTION_SEEK_STEP_MS)}
            aria-label="Rewind 1 second"
          >
            ⏮
          </button>
          <button
            type="button"
            className="hud-hologram-reaction-btn"
            onClick={toggleReactionPlaying}
            aria-label={isReactionPlaying ? "Pause" : "Play"}
          >
            {isReactionPlaying ? "⏸" : "▶"}
          </button>
          <button
            type="button"
            className="hud-hologram-reaction-btn"
            onClick={() => seekReactionBy(REACTION_SEEK_STEP_MS)}
            aria-label="Fast-forward 1 second"
          >
            ⏭
          </button>
          <input
            ref={scrubInputRef}
            type="range"
            className="hud-hologram-reaction-scrub"
            min={0}
            max={1}
            step={0.001}
            defaultValue={0}
            onChange={handleScrubInput}
            aria-label="Reaction progress"
          />
          <div className="hud-hologram-reaction-speeds">
            {REACTION_SPEEDS.map((speed) => (
              <button
                key={speed}
                type="button"
                className={`hud-hologram-reaction-speed-btn${
                  reactionSpeed === speed ? " hud-hologram-reaction-speed-btn-active" : ""
                }`}
                onClick={() => setPlaybackSpeed(speed)}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
