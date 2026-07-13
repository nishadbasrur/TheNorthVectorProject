import "server-only";

// Uses open.er-api.com — a free, keyless exchange-rate API (updated ~daily,
// no auth, no rate-limit headers required for light personal use). No new
// npm dependency: relies on the global `fetch` already available in this
// Next.js/server runtime, same as any other server-side data fetch here.

interface ExchangeRateResponse {
  result: string;
  rates: Record<string, number>;
}

const API_BASE = "https://open.er-api.com/v6/latest";

export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<{ converted: number; rate: number } | null> {
  const fromCode = from.trim().toUpperCase();
  const toCode = to.trim().toUpperCase();

  if (!fromCode || !toCode) return null;

  const response = await fetch(`${API_BASE}/${encodeURIComponent(fromCode)}`);
  if (!response.ok) return null;

  const data = (await response.json()) as ExchangeRateResponse;
  if (data.result !== "success" || !data.rates || !(toCode in data.rates)) return null;

  const rate = data.rates[toCode];
  return { converted: amount * rate, rate };
}
