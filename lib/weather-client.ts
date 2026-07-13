import "server-only";

// Open-Meteo is a free, keyless forecast API — no secret/API key to manage,
// which matters here since this tool has no mechanism to add credentials.
// Temperatures are requested directly in Fahrenheit so callers don't need
// to convert.

export interface DailyForecast {
  date: string;
  weatherCode: number;
  highF: number;
  lowF: number;
  precipitationChance: number;
}

const WEATHER_CODE_DESCRIPTIONS: Record<number, string> = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "fog",
  48: "freezing fog",
  51: "light drizzle",
  53: "moderate drizzle",
  55: "dense drizzle",
  61: "light rain",
  63: "moderate rain",
  65: "heavy rain",
  71: "light snow",
  73: "moderate snow",
  75: "heavy snow",
  80: "light rain showers",
  81: "moderate rain showers",
  82: "violent rain showers",
  95: "thunderstorm",
  96: "thunderstorm with hail",
  99: "thunderstorm with heavy hail",
};

export function describeWeatherCode(code: number): string {
  return WEATHER_CODE_DESCRIPTIONS[code] ?? "unknown conditions";
}

export async function getForecast(lat: number, lon: number, days: number): Promise<DailyForecast[]> {
  const clampedDays = Math.max(1, Math.min(days, 16));
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&temperature_unit=fahrenheit&timezone=auto&forecast_days=${clampedDays}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed: ${response.status}`);
  }

  const data = await response.json();
  const dates: string[] = data?.daily?.time ?? [];
  const codes: number[] = data?.daily?.weathercode ?? [];
  const highs: number[] = data?.daily?.temperature_2m_max ?? [];
  const lows: number[] = data?.daily?.temperature_2m_min ?? [];
  const precip: number[] = data?.daily?.precipitation_probability_max ?? [];

  return dates.map((date, i) => ({
    date,
    weatherCode: codes[i],
    highF: highs[i],
    lowF: lows[i],
    precipitationChance: precip[i],
  }));
}
