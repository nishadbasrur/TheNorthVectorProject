import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { markNotificationRead } from "@/lib/notification-store";

// Marks a notification read — fired when its card is expanded on the
// /notifications list page or its detail card is opened directly via a
// push's deep link.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  await markNotificationRead(id);

  return NextResponse.json({ ok: true });
}
