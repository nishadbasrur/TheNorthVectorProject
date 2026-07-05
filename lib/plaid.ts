import "server-only";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

let cachedClient: PlaidApi | null = null;

function resolvePlaidBasePath(): string {
  const env = process.env.PLAID_ENV ?? "sandbox";

  if (env !== "sandbox" && env !== "production") {
    throw new Error(`Invalid PLAID_ENV "${env}" — must be "sandbox" or "production".`);
  }

  return PlaidEnvironments[env];
}

export function getPlaidClient(): PlaidApi {
  if (cachedClient) {
    return cachedClient;
  }

  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;

  if (!clientId || !secret) {
    throw new Error("PLAID_CLIENT_ID and PLAID_SECRET must be set.");
  }

  const configuration = new Configuration({
    basePath: resolvePlaidBasePath(),
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET": secret,
      },
    },
  });

  cachedClient = new PlaidApi(configuration);
  return cachedClient;
}
