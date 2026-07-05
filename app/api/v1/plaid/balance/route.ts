import { NextResponse } from "next/server";
import { getPlaidClient } from "@/lib/plaid";
import { requireOwner } from "@/lib/require-owner";
import { decrypt } from "@/lib/encryption";
import { adminDb } from "@/lib/firebase-admin";

type AccountBalanceSummary = {
  itemId: string;
  accountId: string;
  name: string;
  type: string;
  subtype: string | null;
  mask: string | null;
  available: number | null;
  current: number | null;
  isoCurrencyCode: string | null;
};

export async function GET(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const itemsSnapshot = await adminDb
    .collection("plaid_items")
    .where("ownerUid", "==", auth.uid)
    .get();

  const accounts: AccountBalanceSummary[] = [];
  const errors: string[] = [];

  for (const itemDoc of itemsSnapshot.docs) {
    const { itemId, accessTokenEncrypted } = itemDoc.data() as {
      itemId: string;
      accessTokenEncrypted: string;
    };

    try {
      const accessToken = decrypt(accessTokenEncrypted);
      const response = await getPlaidClient().accountsBalanceGet({ access_token: accessToken });

      for (const account of response.data.accounts) {
        accounts.push({
          itemId,
          accountId: account.account_id,
          name: account.name,
          type: account.type,
          subtype: account.subtype ?? null,
          mask: account.mask,
          available: account.balances.available,
          current: account.balances.current,
          isoCurrencyCode: account.balances.iso_currency_code,
        });
      }
    } catch (error) {
      console.error(`Failed to fetch balance for Plaid item ${itemId}`, error);
      errors.push(itemId);
    }
  }

  return NextResponse.json({ accounts, errors });
}
