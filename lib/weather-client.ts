import "server-only";

// Free, keyless forecast API — no API key/secret to manage, which keeps
// this tool buildable without touching auth/secrets. Open-Meteo takes plain
// lat/lon (already resolved upstream via lib/map-client.ts's geocodeLocation,
// same geocoder show_map uses) and returns daily aggregates directly, so
// there's no separate geocoding step to maintain here.

export interface DailyForecast {
  date: string;
  tempMaxF: number;
  tempMinF: number;
  precipitationChance: number;
  condition: string;
}

// WMO weather codes, per Open-Meteo's documented mapping — not exhaustive of
// every code they emit, but covers the common clear/cloudy/rain/snow/storm
// cases; anything unmapped falls back to a plain "unknown" description
// rather than throwing.
const WEATHER_CODE_DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

function describeWeatherCode(code: number): string {
  return WEATHER_CODE_DESCRIPTIONS[code] ?? "Unknown conditions";
}

export async function getWeatherForecast(lat: number, lon: number, days: number): Promise<DailyForecast[]> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode",
    temperature_unit: "fahrenheit",
    timezone: "auto",
    forecast_days: String(days),
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed with status ${response.status}`);
  }

  const data = await response.json();
  const dates: string[] = data?.daily?.time ?? [];
  const tempMax: number[] = data?.daily?.temperature_2m_max ?? [];
  const tempMin: number[] = data?.daily?.temperature_2m_min ?? [];
  const precip: number[] = data?.daily?.precipitation_probability_max ?? [];
  const codes: number[] = data?.daily?.weathercode ?? [];

  return dates.map((date, i) => ({
    date,
    tempMaxF: Math.round(tempMax[i]),
    tempMinF: Math.round(tempMin[i]),
    precipitationChance: precip[i] ?? 0,
    condition: describeWeatherCode(codes[i]),
  }));
}
