"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export type MapVisual = { type: "map"; location: string; lat: number; lon: number; zoom: number };

// Leaflet touches `window`/`document` at import time in places, so it's
// dynamically imported inside the effect below rather than statically at
// the top of the file — avoids any SSR-time import issues under Next.js's
// App Router. No default marker icon (Leaflet's ships broken image paths
// under most bundlers, a well-known gotcha) — a plain glowing circle marker
// matches the app's existing HUD cyan look better than a pin anyway.
export function HudMap({ visual, onClose }: { visual: MapVisual; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").CircleMarker | null>(null);

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [visual.lat, visual.lon],
        zoom: visual.zoom,
        zoomControl: false,
        attributionControl: true,
      });

      // CARTO's dark basemap — free, no API key/account (unlike Mapbox/
      // MapTiler's dark styles), and matches the HUD's own dark theme far
      // better than OSM's default light tiles did. Requires crediting both
      // CARTO and OSM (the underlying data source) per their attribution
      // terms.
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 20,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
          '&copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);

      const marker = L.circleMarker([visual.lat, visual.lon], {
        radius: 8,
        color: "#3ad6ff",
        weight: 2,
        fillColor: "#3ad6ff",
        fillOpacity: 0.5,
      }).addTo(map);

      mapRef.current = map;
      markerRef.current = marker;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Map is created once per mount; location/zoom updates are handled by
    // the effect below via setView/setLatLng instead of recreating it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return; // still loading — the mount effect's initial center/zoom already matches
    map.setView([visual.lat, visual.lon], visual.zoom);
    marker.setLatLng([visual.lat, visual.lon]);
  }, [visual.lat, visual.lon, visual.zoom]);

  return (
    <div className="hud-map-overlay">
      {/* Leaflet manages containerRef's own drag/zoom math relative to
          itself, so the perspective tilt lives on this wrapper ancestor
          rather than on containerRef directly — panning/zooming still work
          correctly, the tilt is purely a visual presentation layer on top. */}
      <div className="hud-map-tilt">
        <div ref={containerRef} className="hud-map-canvas" />
      </div>
      <div className="hud-map-fade" />
      <div className="hud-map-label">{visual.location}</div>
      <button type="button" className="hud-map-close" onClick={onClose} aria-label="Close map">
        ✕
      </button>
    </div>
  );
}
