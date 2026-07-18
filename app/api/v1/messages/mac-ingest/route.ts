import { NextResponse } from "next/server";
import { requireMacAgentSecret } from "@/lib/require-mac-agent-secret";
import { saveTextMessage, type IncomingTextMessage } from "@/lib/text-message-store";

// Receives new messages forwarded by the Mac Mini local agent
// (scripts/mac-messages-agent/) — a batch per check-in, not one request per
// message, since the agent polls chat.db periodically rather than
// streaming in real time. See North_Vector_Real_Time_Triggers_Plan.md-
// adjacent design notes on why this exists: no cloud API can reach
// iMessage/SMS content directly, so this is the one legitimate path,
// reading a local Mac's own message history with the owner's own consent.

const MAX_TEXT_LENGTH = 10_000;
const MAX_BATCH = 50;

function isValidMessage(value: unknown): value is IncomingTextMessage {
  if (!value || typeof value !== "object") return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.sender === "string" &&
    m.sender.trim().length > 0 &&
    typeof m.text === "string" &&
    m.text.trim().length > 0 &&
    m.text.length <= MAX_TEXT_LENGTH &&
    typeof m.isGroupChat === "boolean" &&
    typeof m.chatId === "string" &&
    typeof m.sentAt === "string" &&
    (m.senderName === null || typeof m.senderName === "string")
  );
}

export async function POST(request: Request) {
  const auth = requireMacAgentSecret(request);
  if (auth !== true) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const messages = (body as Record<string, unknown>)?.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Missing or empty 'messages' array." }, { status: 400 });
  }

  if (messages.length > MAX_BATCH) {
    return NextResponse.json({ error: `Batch exceeds ${MAX_BATCH} message limit.` }, { status: 413 });
  }

  const valid = messages.filter(isValidMessage);
  await Promise.all(valid.map((message) => saveTextMessage(message)));

  return NextResponse.json(
    { ok: true, saved: valid.length, rejected: messages.length - valid.length },
    { status: 201 }
  );
}
