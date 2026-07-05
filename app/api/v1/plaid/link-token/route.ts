import { NextResponse } from "next/server";
import { CountryCode, Products } from "plaid";
import { getPlaidClient } from "@/lib/plaid";
import { requireOwner } from "@/lib/require-owner";

export async function POST(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  try {
    // Required for OAuth institutions (Bank of America, Amex, etc.) — must
    // exactly match a URI registered in the Plaid Dashboard under Allowed
    // redirect URIs. Omitted entirely when unset, which is the normal case
    // for local/Sandbox dev — non-OAuth Sandbox institutions don't need it.
    const redirectUri = process.env.PLAID_REDIRECT_URI;

    const response = await getPlaidClient().linkTokenCreate({
      user: { client_user_id: auth.uid },
      client_name: "North Vector",
      products: [Products.Transactions, Products.Auth],
      country_codes: [CountryCode.Us],
      language: "en",
      ...(redirectUri ? { redirect_uri: redirectUri } : {}),
    });

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error("Failed to create Plaid link token", error);
    return NextResponse.json({ error: "Failed to create link token." }, { status: 500 });
  }
}
