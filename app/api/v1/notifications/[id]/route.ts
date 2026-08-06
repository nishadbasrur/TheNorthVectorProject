import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { getNotification } from "@/lib/notification-store";

// Backs the notification detail card (/notifications/[id]) — the actual
// deep-link target every notification push points at.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const notification = await getNotification(id);

  if (!notification) {
    return NextResponse.json({ error: "No notification found for that id." }, { status: 404 });
  }

  return NextResponse.json({ notification });
}
