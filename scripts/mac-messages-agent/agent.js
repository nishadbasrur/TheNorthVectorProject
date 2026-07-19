// Local Mac Mini Messages agent — the one legitimate path to give North
// visibility into iMessage/SMS content, since no cloud API can reach it
// directly. Runs periodically (via the LaunchAgent in this same directory),
// reads new rows from this Mac's own ~/Library/Messages/chat.db (the same
// database Messages.app itself maintains), and forwards new INCOMING
// messages to app/api/v1/messages/mac-ingest.
//
// Zero npm dependencies on purpose — this machine is old and slow, so
// "npm install" (especially anything needing native compilation, like
// better-sqlite3) is exactly the kind of setup pain worth avoiding. Instead
// this shells out to the `sqlite3` CLI, which has shipped with macOS for
// well over a decade, and uses Node's built-in fetch (Node 18+).
//
// Requires: Full Disk Access granted to whatever `node` binary runs this
// (System Settings -> Privacy & Security -> Full Disk Access) — chat.db is
// TCC-protected and unreadable without it, even for the machine's own user.

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const AGENT_DIR = __dirname;
const ENV_FILE = path.join(AGENT_DIR, ".env");
const STATE_FILE = path.join(AGENT_DIR, "state.json");
const LOCK_FILE = path.join(AGENT_DIR, "agent.lock");
const CHAT_DB = path.join(os.homedir(), "Library", "Messages", "chat.db");

// Guards against two instances racing on state.json — this actually
// happened in practice: the LaunchAgent silently reloads itself at every
// login (independent of any manual `launchctl unload`, which is only a
// live/in-memory state that doesn't survive a restart), so a manual
// `node agent.js` run can easily overlap with a periodic run already in
// flight. Without this, whichever run finishes last clobbers the other's
// state.json write, and a stale/reset lastRowId causes already-ingested
// messages to be resent as duplicates. Stale-lock threshold guards against
// a crashed prior run permanently wedging every future run.
const LOCK_STALE_MS = 10 * 60 * 1000;

function acquireLock() {
  if (fs.existsSync(LOCK_FILE)) {
    const age = Date.now() - Number(fs.readFileSync(LOCK_FILE, "utf8").trim() || 0);
    if (age < LOCK_STALE_MS) {
      return false;
    }
  }
  fs.writeFileSync(LOCK_FILE, String(Date.now()));
  return true;
}

function releaseLock() {
  fs.rmSync(LOCK_FILE, { force: true });
}

// Apple/Cocoa epoch (2001-01-01T00:00:00Z) expressed as a Unix timestamp —
// the `date` column in chat.db is nanoseconds since this epoch on any
// macOS from Sierra (2017) onward, which this fresh install certainly is.
const APPLE_EPOCH_UNIX_SECONDS = 978307200;

const MAX_BATCH = 50; // must match app/api/v1/messages/mac-ingest/route.ts's MAX_BATCH

// North doesn't need a decade of texting history, just enough to be useful
// day to day — cutting this off at the SQL level (not just filtering after
// the fact) also means a fresh Mac freshly signed into a years-deep iMessage
// account never even attempts to pull the bulk of that history in the first
// place. Recomputed fresh on every run (not a one-time fixed date), so it
// naturally stays a rolling window rather than ever needing manual pruning.
const HISTORY_WINDOW_YEARS = 2;

function historyWindowStartAppleNanoseconds() {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - HISTORY_WINDOW_YEARS);
  const seconds = Math.floor(cutoff.getTime() / 1000) - APPLE_EPOCH_UNIX_SECONDS;
  return BigInt(seconds) * 1_000_000_000n;
}

function loadEnvFile() {
  const env = {};
  if (!fs.existsSync(ENV_FILE)) return env;
  for (const line of fs.readFileSync(ENV_FILE, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

function loadState() {
  if (!fs.existsSync(STATE_FILE)) return { lastRowId: 0 };
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return { lastRowId: 0 };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Queries chat.db read-only via the sqlite3 CLI's -json output mode
// (supported since sqlite 3.33, macOS Big Sur+) — no driver, no native
// module, just a subprocess call.
//
// Filters: date >= the rolling HISTORY_WINDOW_YEARS cutoff (skip anything
// older, permanently — the next run's `ROWID > afterRowId` never revisits
// a ROWID once it's been scanned, qualifying or not); is_from_me = 0 (only
// messages North should ever mention are ones Nishad received, never his
// own outgoing texts); and text IS NOT NULL (plain-text messages only —
// tapback reactions and rich-content-only messages, where the real text
// lives in the binary attributedBody blob, are skipped rather than guessed
// at from an unreliable manual parse of Apple's typedstream format; a real
// message with garbled reconstructed text is a worse outcome than a rare
// skipped one).
function queryNewMessages(afterRowId) {
  const historyStart = historyWindowStartAppleNanoseconds();
  const sql = `
    SELECT
      m.ROWID AS rowid,
      m.guid AS guid,
      m.text AS text,
      m.date AS date,
      m.is_from_me AS is_from_me,
      h.id AS sender,
      c.chat_identifier AS chat_id,
      (SELECT COUNT(*) FROM chat_handle_join chj WHERE chj.chat_id = c.ROWID) AS participant_count
    FROM message m
    JOIN chat_message_join cmj ON cmj.message_id = m.ROWID
    JOIN chat c ON c.ROWID = cmj.chat_id
    LEFT JOIN handle h ON h.ROWID = m.handle_id
    WHERE m.ROWID > ${afterRowId}
      AND m.date >= ${historyStart}
      AND m.is_from_me = 0
      AND m.text IS NOT NULL
      AND trim(m.text) != ''
      AND (m.associated_message_type IS NULL OR m.associated_message_type = 0)
    ORDER BY m.ROWID ASC
    LIMIT 500;
  `;

  const output = execFileSync("sqlite3", ["-json", "-readonly", CHAT_DB, sql], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 32,
  });

  if (!output.trim()) return [];
  return JSON.parse(output);
}

function appleDateToIso(appleDateNanoseconds) {
  const seconds = Number(appleDateNanoseconds) / 1e9 + APPLE_EPOCH_UNIX_SECONDS;
  return new Date(seconds * 1000).toISOString();
}

function toIncomingMessage(row) {
  return {
    sender: row.sender || row.chat_id || "unknown",
    // `display_name` on the `chat` row is the CONVERSATION's name (e.g. a
    // group chat's title), not the individual sender's — using it here
    // would misattribute every message in "Family Group" to a contact
    // literally named "Family Group". No per-handle contact-name
    // resolution exists in this v1 (that needs a separate, also
    // TCC-protected, query against the Contacts database) — always null
    // for now; check_messages/search_messages fall back to raw `sender`.
    senderName: null,
    text: row.text,
    isGroupChat: row.participant_count > 1,
    chatId: String(row.chat_id || row.guid),
    sentAt: appleDateToIso(row.date),
  };
}

async function postBatch(url, secret, messages) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ingest-secret": secret,
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Ingest POST failed: ${response.status} ${body}`);
  }

  return response.json();
}

async function main() {
  if (!acquireLock()) {
    console.log(`[${new Date().toISOString()}] Another run is already in progress — skipping.`);
    return;
  }

  try {
    await run();
  } finally {
    releaseLock();
  }
}

async function run() {
  const env = { ...loadEnvFile(), ...process.env };
  const ingestUrl = env.INGEST_URL;
  const ingestSecret = env.INGEST_SECRET;

  if (!ingestUrl || !ingestSecret) {
    // Thrown, not process.exit() — a synchronous exit here would skip
    // main()'s `finally` block and leak the lock file forever.
    throw new Error("Missing INGEST_URL or INGEST_SECRET — set them in scripts/mac-messages-agent/.env");
  }

  if (!fs.existsSync(CHAT_DB)) {
    throw new Error(`chat.db not found at ${CHAT_DB} — is Messages set up and signed in?`);
  }

  const state = loadState();
  let rows;

  try {
    rows = queryNewMessages(state.lastRowId);
  } catch (error) {
    throw new Error(
      "Failed to read chat.db — most likely missing Full Disk Access for this process's node binary. " +
        "Grant it in System Settings -> Privacy & Security -> Full Disk Access.\n" +
        String(error)
    );
  }

  if (rows.length === 0) {
    console.log(`[${new Date().toISOString()}] No new messages.`);
    return;
  }

  console.log(`[${new Date().toISOString()}] Found ${rows.length} new message(s), forwarding...`);

  for (let i = 0; i < rows.length; i += MAX_BATCH) {
    const chunk = rows.slice(i, i + MAX_BATCH);
    const messages = chunk.map(toIncomingMessage);
    const result = await postBatch(ingestUrl, ingestSecret, messages);
    console.log(`  batch ${i / MAX_BATCH + 1}: saved ${result.saved}, rejected ${result.rejected}`);

    // Advance state after each successful batch, not just at the very end —
    // if a later batch fails, already-forwarded messages aren't re-sent on
    // the next run.
    const lastRowIdInChunk = chunk[chunk.length - 1].rowid;
    saveState({ lastRowId: lastRowIdInChunk });
  }

  console.log(`[${new Date().toISOString()}] Done. lastRowId now ${loadState().lastRowId}.`);
}

main().catch((error) => {
  console.error("Agent run failed:", error);
  process.exit(1);
});
