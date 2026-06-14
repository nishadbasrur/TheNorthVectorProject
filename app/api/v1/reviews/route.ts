import { NextResponse } from "next/server";
import { createReview, listReviews } from "@/services/review-service";

function userIdFrom(request: Request) {
  return request.headers.get("x-user-id");
}

export async function GET(request: Request) {
  const userId = userIdFrom(request);
  if (!userId) return NextResponse.json({ error: "Missing user" }, { status: 401 });

  const reviews = await listReviews(userId);
  return NextResponse.json({ reviews });
}

export async function POST(request: Request) {
  const userId = userIdFrom(request);
  if (!userId) return NextResponse.json({ error: "Missing user" }, { status: 401 });

  const input = await request.json();
  const review = await createReview({ ...input, userId });
  return NextResponse.json({ review }, { status: 201 });
}
