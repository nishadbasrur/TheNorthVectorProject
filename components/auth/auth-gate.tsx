"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { OWNER_EMAIL } from "@/lib/owner";
import { initForegroundPushListenerIfEnabled } from "@/lib/push-client";

type Mode = "sign-in" | "sign-up";

export function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsChecking(false);

      if (nextUser) {
        initForegroundPushListenerIfEnabled();
      }
    });
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === "sign-in") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (email.trim().toLowerCase() !== OWNER_EMAIL) {
          setError("Sign-up is restricted to the account owner.");
          return;
        }

        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isChecking) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "var(--text-faint)" }}>
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <form onSubmit={handleSubmit} className="card" style={{ width: 320 }}>
          <div className="section-heading">{mode === "sign-in" ? "Sign In" : "Create Account"}</div>

          <input
            className="nv-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={{ marginTop: 12, width: "100%" }}
            required
          />

          <input
            className="nv-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={{ marginTop: 12, width: "100%" }}
            required
            minLength={6}
          />

          {error && (
            <div style={{ color: "var(--status-warning)", fontSize: 12, marginTop: 10 }}>{error}</div>
          )}

          <button
            className="nv-button"
            type="submit"
            disabled={isSubmitting}
            style={{ marginTop: 14, width: "100%" }}
          >
            {isSubmitting ? "Please wait…" : mode === "sign-in" ? "Sign In" : "Create Account"}
          </button>

          <button
            type="button"
            className="nv-button-secondary"
            style={{ marginTop: 10, width: "100%" }}
            onClick={() => {
              setMode(mode === "sign-in" ? "sign-up" : "sign-in");
              setError(null);
            }}
          >
            {mode === "sign-in" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
