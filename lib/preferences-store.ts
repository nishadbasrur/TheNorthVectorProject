import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

// Standing instructions Nishad states going forward (e.g. "stop calling me
// sir", "I prefer nights for hard tasks") — distinct from the `memories`
// collection, which holds historical facts imported from the ChatGPT export,
// not live conversation content. Doc id is the preference's own key, so
// writing a correction to an existing key overwrites it rather than creating
// a duplicate.
export type Preference = {
  key: string;
  value: string;
};

export async function setPreference(key: string, value: string): Promise<void> {
  await adminDb
    .collection("preferences")
    .doc(key)
    .set({ key, value, setAt: FieldValue.serverTimestamp() });
}

export async function getPreferences(): Promise<Preference[]> {
  const snapshot = await adminDb.collection("preferences").get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      key: typeof data.key === "string" ? data.key : doc.id,
      value: typeof data.value === "string" ? data.value : "",
    };
  });
}

// Plain-language block for a system prompt — empty string if there are no
// preferences yet, so it doesn't clutter the prompt with nothing to say.
export function formatPreferencesForPrompt(preferences: Preference[]): string {
  if (preferences.length === 0) return "";

  const list = preferences.map((p) => `- ${p.value}`).join("\n");
  return `\n\nStanding preferences the person has stated:\n${list}\nFollow these consistently.`;
}
