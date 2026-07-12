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
