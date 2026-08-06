import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { getRecentNotifications } from "@/lib/notification-store";

// Backs the /notifications list page — most recent notifications across
// every producer (Gmail watch matches today; future scholarship-
// automation triggers), owner-gated same as every other admin-data route.
export async function GET(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const notifications = await getRecentNotifications(50);
  return NextResponse.json({ notifications });
}
