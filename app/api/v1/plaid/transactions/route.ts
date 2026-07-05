import { NextResponse } from "next/server";
import type { Transaction } from "plaid";
import { getPlaidClient } from "@/lib/plaid";
import { requireOwner } from "@/lib/require-owner";
import { decrypt } from "@/lib/encryption";
import { adminDb } from "@/lib/firebase-admin";

type TransactionSummary = {
  itemId: string;
  accountId: string;
  transactionId: string;
  name: string;
  merchantName: string | null;
  amount: number;
  isoCurrencyCode: string | null;
  date: string;
  pending: boolean;
};

const MAX_TRANSACTIONS_PER_ITEM = 25;

async function fetchAllAddedTransactions(accessToken: string): Promise<Transaction[]> {
  const client = getPlaidClient();
  const added: Transaction[] = [];
  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const response = await client.transactionsSync({
      access_token: accessToken,
      cursor,
    });

    added.push(...response.data.added);
    hasMore = response.data.has_more;
    cursor = response.data.next_cursor;
  }

  return added;
}

export async function GET(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const itemsSnapshot = await adminDb
    .collection("plaid_items")
    .where("ownerUid", "==", auth.uid)
    .get();

  const transactions: TransactionSummary[] = [];
  const errors: string[] = [];

  for (const itemDoc of itemsSnapshot.docs) {
    const { itemId, accessTokenEncrypted } = itemDoc.data() as {
      itemId: string;
      accessTokenEncrypted: string;
    };

    try {
      const accessToken = decrypt(accessTokenEncrypted);
      // No cursor is persisted (Firestore storage for transaction data is a
      // deliberate later step), so every call re-syncs from scratch — fine
      // for Sandbox-sized data, but this refetches full history each time.
      const added = await fetchAllAddedTransactions(accessToken);

      added
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, MAX_TRANSACTIONS_PER_ITEM)
        .forEach((transaction) => {
          transactions.push({
            itemId,
            accountId: transaction.account_id,
            transactionId: transaction.transaction_id,
            name: transaction.name,
            merchantName: transaction.merchant_name ?? null,
            amount: transaction.amount,
            isoCurrencyCode: transaction.iso_currency_code,
            date: transaction.date,
            pending: transaction.pending,
          });
        });
    } catch (error) {
      // A just-linked Sandbox Item can transiently return PRODUCT_NOT_READY
      // while Plaid finishes its initial transaction pull — surfaced to the
      // client via `errors`, not treated as a hard failure for other items.
      console.error(`Failed to fetch transactions for Plaid item ${itemId}`, error);
      errors.push(itemId);
    }
  }

  return NextResponse.json({ transactions, errors });
}
