import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";
import { getAuth } from "firebase-admin/auth";
import { OWNER_EMAIL } from "../../lib/owner";

export async function verifyOwner(req: Request, res: Response): Promise<boolean> {
  const authHeader = req.headers.authorization;
  const idToken =
    typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

  if (!idToken) {
    res.status(401).json({ error: "Missing Authorization header." });
    return false;
  }

  try {
    const decoded = await getAuth().verifyIdToken(idToken);

    if (decoded.email !== OWNER_EMAIL) {
      res.status(403).json({ error: "Forbidden." });
      return false;
    }

    return true;
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
    return false;
  }
}
