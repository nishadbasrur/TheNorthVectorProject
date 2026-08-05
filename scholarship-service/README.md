# scholarship-service

Standalone scholarship-automation service — same shape as `../agent-runner-service`
(its own long-running/headless process, not bolted onto the voice pipeline),
not yet deployed. This directory currently holds a **scoped proof-of-concept**,
not the full service described in the fix note: it proves the core
login/session-persistence mechanism works end-to-end on one real site, and
that real scholarship data can be found, scraped, and assessed for fit.
Nothing here fills forms, drafts essays, creates Drive folders, or triggers
notifications yet — see the fix note for the full architecture that this is
step one of.

## The login model

Nishad logs into the real site himself, once, in a real visible browser
window — typing his actual credentials directly into the site's actual
login page. This code never sees, stores, or enters a credential at any
point. The resulting session state (cookies/storage — never the password)
is captured to `.sessions/` (gitignored) and reused headlessly for every
run after that, for as long as the site's session stays valid.

`.sessions/` is a local file for this scoped test only. Once this scales
beyond one test site, session state needs to move to Secret Manager/GCS
with encryption at rest, matching how `GMAIL_REFRESH_TOKEN` and friends
are already handled in the main app.

## Scripts

Run these in order, from this directory:

1. `npm run login` — launches a real, visible browser and navigates to
   the Scholarship America applicant Hub. Runs in the background/keeps
   polling; log in yourself in the window it opens, then tell North
   you're done (or `touch .sessions/READY_TO_CAPTURE` directly) — it
   captures the session and exits.
2. `npm run verify-session` — a completely separate, **headless** run
   that loads *only* the saved session file (no visible browser, no
   re-entering anything) and confirms it's genuinely authenticated.
   Writes `.sessions/verify-session-screenshot.png` for visual proof.
3. `npm run fetch-scholarship` — walks the real, public scholarship
   listing (`scholarshipamerica.org/students/browse-scholarships/`) and
   scrapes one real, currently-listed scholarship's actual eligibility,
   award amount, and requirements into `.data/last-fetched-scholarship.json`.
4. `npm run assess` — sends that real scraped data plus Nishad's real
   known profile facts (from `lib/opportunity-research.ts` /
   `00-Foundation/Intelligence_Profile.md`) to the same OpenAI model the
   main app uses, and prints a real yes/no/maybe verdict with reasoning
   grounded in the actual eligibility text — not a generic summary.

## What this proved (first real run)

- Headed login → saved session → **separate headless process reused it
  successfully** (screenshot-confirmed: landed on the authenticated
  Student Hub with zero re-login).
- Scraped a real, currently-listed scholarship (#RAREis Scholarship
  Fund — $5,000, status Closed, real eligibility/requirements text).
- Real applicability verdict: **no** — the scraped eligibility requires
  a physician-diagnosed rare disease, which isn't true of Nishad, and
  the model said so directly rather than a vague "could be a good fit."
