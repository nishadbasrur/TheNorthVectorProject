import "server-only";
import { NextResponse } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "./firebase-admin";
import { OWNER_EMAIL } from "./owner";

export async function requireOwner(request: Request): Promise<DecodedIdToken | NextResponse> {
  const authHeader = request.headers.get("authorization");
  const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

  if (!idToken) {
    return NextResponse.json({ error: "Missing Authorization header." }, { status: 401 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);

    if (decoded.email !== OWNER_EMAIL) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    return decoded;
  } catch {
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
  }
}
