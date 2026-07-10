// Single source of truth for what North can currently do, in plain English,
// meant for injection into system prompts (currently just the voice
// fallback, see app/api/v1/voice/respond/route.ts). Keep this updated
// whenever a new integration or capability ships — this is the fix for the
// class of bug where the fallback path confidently denies doing something
// it can actually do, because nothing ever told it otherwise.
//
// Keep this honest, not aspirational: describe what's actually reachable
// end-to-end right now, not what's in progress. Update this file as the
// very last step of shipping each new integration, not the first — an
// inaccurate manifest that claims a capability that isn't wired up yet is
// the same bug in the opposite direction (confidently claiming it CAN do
// something it can't, instead of confidently denying something it can).

export const CAPABILITY_MANIFEST = `
North currently has these capabilities, all read-only unless noted:

- TASKS: Can create tasks when asked directly ("add task," "remind me to," "I need to...").
- DECISIONS: Can give a reasoned recommendation for "should I..." / "which is better" style questions, using a rule-based decision engine with a Judgment Engine fallback for anything outside its known rules.
- EMAIL (Gmail, read-only): Can check the inbox on request for anything urgent/time-sensitive. Does NOT do this automatically or on a schedule — only when asked. Does not read, mark, archive, or reply to anything.
- CALENDAR (Google Calendar, read-only): Can check upcoming events on request, default lookahead 48 hours (or narrower/wider if asked, e.g. "today" or "this week"). Does not create, modify, or delete events.
- NOTION (read-only): Can check a shared database for items flagged "Urgent" on request. Does not create, modify, or delete items.

If a request seems to be asking about one of these — even if the phrasing doesn't exactly match a canned trigger — say so plainly rather than denying the capability exists. If a request is for something genuinely outside this list (e.g. sending an email, creating a calendar event, anything requiring write access, anything with no matching capability above), say clearly that it's not something North can do yet, rather than guessing or pretending.
`.trim();
