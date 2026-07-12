import "server-only";
import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { sendPushNotification } from "./push-server";

// Seed of a real "capability gap" workflow — North logs what it couldn't do
// and pushes a notification, instead of the request just evaporating after
// a spoken "I can't do that." Does NOT write or deploy any code itself; a
// human (Nishad, via a normal Claude Code session) reviews the log and
// decides what, if anything, to build. See
// North_Vector_Autonomous_Self_Extension_Plan.md for why the further step
// (North writing and shipping its own new tools with no review) is a
// separate, much larger decision, not implemented here.
export async function logCapabilityGap(request: string, capability: string): Promise<void> {
  await adminDb.collection("capability_gaps").add({
    request,
    capability,
    createdAt: FieldValue.serverTimestamp(),
  });

  await sendPushNotification(
    "North: capability gap",
    `${capability} — asked: "${request}"`
  );
}
