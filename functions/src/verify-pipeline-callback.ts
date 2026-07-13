import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";

// GitHub Actions has no Firebase Auth user to present, so this endpoint
// can't use require-owner.ts's verifyOwner (which checks a Firebase ID
// token) — a plain shared secret instead, mirrored as both a Firebase
// secret (PIPELINE_CALLBACK_TOKEN, read here) and a GitHub Actions repo
// secret of the same name (sent as the workflow's Authorization header).
// Only lets the caller trigger a push notification — no code-push or
// deploy capability rides on this token.
export function verifyPipelineCallback(req: Request, res: Response, expectedToken: string): boolean {
  const authHeader = req.headers.authorization;
  const token =
    typeof authHeader === "string" && authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

  if (!token || token !== expectedToken) {
    res.status(401).json({ ok: false, error: "Invalid or missing pipeline callback token." });
    return false;
  }

  return true;
}
