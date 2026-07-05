import { NextResponse } from "next/server";
import { getPlaidClient } from "@/lib/plaid";
import { requireOwner } from "@/lib/require-owner";
import { encrypt } from "@/lib/encryption";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const publicToken = typeof body.public_token === "string" ? body.public_token : "";

  if (!publicToken) {
    return NextResponse.json({ error: "public_token is required." }, { status: 400 });
  }

  try {
    const exchangeResponse = await getPlaidClient().itemPublicTokenExchange({
      public_token: publicToken,
    });

    const { access_token: accessToken, item_id: itemId } = exchangeResponse.data;

    await adminDb.collection("plaid_items").add({
      itemId,
      accessTokenEncrypted: encrypt(accessToken),
      ownerUid: auth.uid,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, itemId }, { status: 201 });
  } catch (error) {
    console.error("Failed to exchange Plaid public token", error);
    return NextResponse.json({ error: "Failed to link account." }, { status: 500 });
  }
}
