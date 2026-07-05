"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlaidLink, type PlaidLinkOnSuccess } from "react-plaid-link";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/firebase";

type Status = "idle" | "loading-link-token" | "connecting" | "success" | "error";

type AccountBalance = {
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

const LINK_TOKEN_STORAGE_KEY = "plaid_link_token";

function formatCurrency(value: number | null, isoCurrencyCode: string | null) {
  if (value === null) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: isoCurrencyCode ?? "USD",
  }).format(value);
}

export default function AccountsPage() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [receivedRedirectUri, setReceivedRedirectUri] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const [accounts, setAccounts] = useState<AccountBalance[]>([]);
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const authorizedFetch = useCallback(async (input: string, init?: RequestInit) => {
    const idToken = await auth.currentUser?.getIdToken();

    return fetch(input, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${idToken}`,
      },
    });
  }, []);

  const loadAccountData = useCallback(async () => {
    setIsLoadingData(true);
    setDataError(null);

    try {
      const [balanceResponse, transactionsResponse] = await Promise.all([
        authorizedFetch("/api/v1/plaid/balance"),
        authorizedFetch("/api/v1/plaid/transactions"),
      ]);

      if (!balanceResponse.ok || !transactionsResponse.ok) {
        throw new Error("Failed to load account data.");
      }

      const balanceData = await balanceResponse.json();
      const transactionsData = await transactionsResponse.json();

      setAccounts(balanceData.accounts ?? []);
      setTransactions(transactionsData.transactions ?? []);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsLoadingData(false);
    }
  }, [authorizedFetch]);

  useEffect(() => {
    loadAccountData();
  }, [loadAccountData]);

  // Returning from an OAuth institution's authentication page (Bank of
  // America, Amex, etc.) lands back here with an oauth_state_id param.
  // Link must be reinitialized with the *same* link_token from before the
  // redirect (stashed in sessionStorage, since the page fully navigated
  // away and back) plus the full callback URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthStateId = params.get("oauth_state_id");
    if (!oauthStateId) return;

    const storedToken = sessionStorage.getItem(LINK_TOKEN_STORAGE_KEY);
    if (!storedToken) return;

    setLinkToken(storedToken);
    setReceivedRedirectUri(window.location.href);
  }, []);

  async function fetchLinkToken() {
    setStatus("loading-link-token");
    setMessage(null);

    try {
      const response = await authorizedFetch("/api/v1/plaid/link-token", { method: "POST" });

      if (!response.ok) {
        throw new Error("Failed to create link token.");
      }

      const data = await response.json();
      sessionStorage.setItem(LINK_TOKEN_STORAGE_KEY, data.link_token);
      setLinkToken(data.link_token);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  const onSuccess: PlaidLinkOnSuccess = async (publicToken) => {
    sessionStorage.removeItem(LINK_TOKEN_STORAGE_KEY);
    setStatus("connecting");

    try {
      const response = await authorizedFetch("/api/v1/plaid/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_token: publicToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to finish linking your account.");
      }

      setStatus("success");
      setMessage("Bank account connected.");
      setLinkToken(null);
      await loadAccountData();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  };

  const { open, ready } = usePlaidLink({
    token: linkToken,
    receivedRedirectUri,
    onSuccess,
  });

  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  const isBusy = status === "loading-link-token" || status === "connecting";

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Financial Layer</div>
        <div className="page-title">Accounts</div>
        <div className="page-meta">
          Connect bank accounts via Plaid · balances and transactions are fetched
          fresh on each page load, nothing is stored yet
        </div>
      </div>

      <div className="page-body">
        <div className="card" style={{ maxWidth: 420, marginBottom: 24 }}>
          <div className="section-heading">Connect a Bank</div>

          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8, marginBottom: 16 }}>
            Opens Plaid Link. Your bank credentials never touch this app —
            Plaid handles authentication and returns a token, which is encrypted before storage.
          </p>

          <button
            className="nv-button"
            onClick={fetchLinkToken}
            disabled={isBusy}
            style={{ width: "100%" }}
          >
            {status === "loading-link-token"
              ? "Preparing…"
              : status === "connecting"
                ? "Finishing connection…"
                : "Connect a bank"}
          </button>

          {message && (
            <div
              style={{
                marginTop: 12,
                fontSize: 12,
                color: status === "error" ? "var(--status-warning)" : "var(--status-success)",
              }}
            >
              {message}
            </div>
          )}
        </div>

        <div className="section-heading">Connected Accounts</div>

        {isLoadingData && (
          <div className="card" style={{ color: "var(--text-faint)", fontSize: 13 }}>
            Loading account data…
          </div>
        )}

        {!isLoadingData && dataError && (
          <div className="card" style={{ color: "var(--status-warning)", fontSize: 13 }}>
            {dataError}
          </div>
        )}

        {!isLoadingData && !dataError && accounts.length === 0 && (
          <div className="card" style={{ color: "var(--text-faint)", fontSize: 13 }}>
            No connected accounts yet. Connect a bank above to see balances here.
          </div>
        )}

        {!isLoadingData &&
          accounts.map((account) => {
            const accountTransactions = transactions.filter(
              (transaction) => transaction.accountId === account.accountId
            );

            return (
              <div key={account.accountId} className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div className="card-title">
                      {account.name}
                      {account.mask && (
                        <span style={{ color: "var(--text-faint)", fontWeight: 400 }}> ···{account.mask}</span>
                      )}
                    </div>
                    <div className="card-sub" style={{ fontSize: 12 }}>
                      {account.type}
                      {account.subtype ? ` · ${account.subtype}` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontFamily: "DM Serif Display, serif", color: "var(--white)" }}>
                      {formatCurrency(account.current, account.isoCurrencyCode)}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-faint)" }}>
                      {formatCurrency(account.available, account.isoCurrencyCode)} available
                    </div>
                  </div>
                </div>

                {accountTransactions.length > 0 && (
                  <div style={{ marginTop: 14, borderTop: "1px solid var(--border-default)", paddingTop: 10 }}>
                    <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Recent Transactions
                    </div>
                    {accountTransactions.map((transaction) => (
                      <div
                        key={transaction.transactionId}
                        style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}
                      >
                        <div>
                          {transaction.merchantName ?? transaction.name}
                          {transaction.pending && (
                            <span className="badge badge-muted" style={{ marginLeft: 8 }}>
                              pending
                            </span>
                          )}
                          <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{transaction.date}</div>
                        </div>
                        <div style={{ color: transaction.amount > 0 ? "var(--status-risk)" : "var(--status-success)" }}>
                          {formatCurrency(-transaction.amount, transaction.isoCurrencyCode)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </AppShell>
  );
}
