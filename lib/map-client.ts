// Free, no-API-key geocoding via OpenStreetMap's Nominatim — chosen to match
// the Leaflet + OSM tile choice for show_map (see
// North_Vector_Sandbox_First_Simplification_Plan.md Section 4.2): no billing
// setup, no new secret to manage, sufficient for a single-user voice app.
// Nominatim's usage policy requires a real identifying User-Agent and caps
// at ~1 request/second — both fine for this app's traffic pattern.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "NorthVector/1.0 (personal chief-of-staff app; single user)";

export type GeocodedLocation = { lat: number; lon: number; displayName: string };

export async function geocodeLocation(query: string): Promise<GeocodedLocation | null> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Nominatim request failed: ${response.status}`);
  }

  const results = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  const first = results[0];
  if (!first) return null;

  return {
    lat: parseFloat(first.lat),
    lon: parseFloat(first.lon),
    displayName: first.display_name.split(",").slice(0, 3).join(",").trim(),
  };
}

// Overpass — OSM's own free query API, same ecosystem as Nominatim/CARTO
// above, no API key. Used to answer "illuminate/outline/highlight the
// building" requests with a real footprint polygon rather than declining
// them outright.
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

export type BuildingFootprint = { points: [number, number][] };

type OverpassWay = { type: string; geometry?: { lat: number; lon: number }[] };

function centroid(points: { lat: number; lon: number }[]): { lat: number; lon: number } {
  const sum = points.reduce((acc, p) => ({ lat: acc.lat + p.lat, lon: acc.lon + p.lon }), { lat: 0, lon: 0 });
  return { lat: sum.lat / points.length, lon: sum.lon / points.length };
}

function distanceSq(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  return (a.lat - b.lat) ** 2 + (a.lon - b.lon) ** 2;
}

// Finds the OSM building footprint nearest a point (default 150m search
// radius — wide enough to catch a large landmark building even if the
// geocoded point lands slightly off its actual outline, narrow enough to
// avoid picking up an unrelated neighboring building). Returns null rather
// than throwing when nothing tagged as a building exists nearby — a real,
// honest "no footprint data here" case (e.g. a park, a natural landmark),
// not a failure.
export async function getBuildingFootprint(lat: number, lon: number, radiusMeters = 150): Promise<BuildingFootprint | null> {
  const query = `[out:json][timeout:15];way["building"](around:${radiusMeters},${lat},${lon});out geom;`;

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain", "User-Agent": USER_AGENT },
    body: query,
  });

  if (!response.ok) {
    throw new Error(`Overpass request failed: ${response.status}`);
  }

  const data = (await response.json()) as { elements: OverpassWay[] };
  const ways = (data.elements ?? []).filter(
    (el): el is OverpassWay & { geometry: { lat: number; lon: number }[] } =>
      el.type === "way" && Array.isArray(el.geometry) && el.geometry.length >= 3
  );

  if (ways.length === 0) return null;

  // `around` returns everything within radius, not just the nearest — pick
  // whichever building's centroid is actually closest to the search point.
  let nearest: OverpassWay & { geometry: { lat: number; lon: number }[] } = ways[0];
  let nearestDist = distanceSq(centroid(ways[0].geometry), { lat, lon });
  for (const way of ways.slice(1)) {
    const d = distanceSq(centroid(way.geometry), { lat, lon });
    if (d < nearestDist) {
      nearest = way;
      nearestDist = d;
    }
  }

  return { points: nearest.geometry.map((p) => [p.lat, p.lon] as [number, number]) };
}
