# v3 — Sessions (deferred design notes)

Captured during the v2 (Revision) grilling session. These notes record the user's intent for when we spin up a dedicated grilling session on Sessions.

## Motivation

Today (v1/v2) the app supports a single alignment flow at a time: one input Resume in localStorage, one ephemeral Aligned Resume in Zustand. The user wants to support multiple parallel alignment efforts without re-entering their CV each time:

> the user inputs the original resume first, we save that. then the user may create and fine tune a CV to 1 job posting, then reverts the changes, pastes another job posting and fine tunes, etc

## Proposed model

- **"Original" Resume** — the user's input CV, persisted in localStorage. Per-v3 spec this is *the* canonical input Resume that all sessions derive from.
- **Session** — one aligned-and-revised CV keyed by name. Each session contains:
  - The Job Posting text it was aligned against
  - The current Aligned Resume
  - The current Notes
  - A pointer to (or snapshot of) the original Resume state at the time the session was created
- **Storage keys** — keyed by session name in localStorage, e.g.
  - `resume-optimizer:original` — the canonical input Resume
  - `resume-optimizer:session:<name>` — per-session state
- **Naming** — sessions are named by the user, defaulting to `<date>` if no name provided. Need to enforce uniqueness (reject duplicates; suggest a disambiguated alternative).
- **UI** — a dropdown somewhere in the app to load an existing session by name. Where exactly (top nav? Customize page? a new Sessions landing route?) is an open design question — depends on whether we re-introduce a top nav or keep the linear in-page CTA model.

## Open design questions to grill before building v3

1. **Frozen vs. shared original.** When the user edits the input Resume (e.g. fixes a phone number), do existing Aligned Resumes re-derive from the new original, or are they frozen snapshots from the time the session was created? (Frozen is reproducible but stale; shared is simpler but drifts.)
2. **Revert to original.** The user explicitly wants a UI to "revert back to the original" — i.e. discard a session's Aligned Resume and start a fresh alignment from the canonical input Resume. Need to pin down where this affordance lives (Customize page? a "Sessions" management view?).
3. **Cleanup.** Max sessions? Explicit delete? Auto-expire old sessions?
4. **Routing.** When a user deep-links to `/preview` without an active session selected, do we add a session-selection step? Or always force them through a Session landing page first?
5. **Migration.** The current v1 stores a single `resume-optimizer:resume` key. Do we auto-migrate it to the new "original" key? Do we create a default session from any existing Aligned Resume?
6. **Active session identity.** How is the currently-active session tracked across refreshes — a separate `resume-optimizer:active-session` key pointing at a name?

## Why deferred

v1 just shipped as a single-stream Alignment flow. v2 is currently being grilling-bounded as "Revision loop" — ticked Notes + Revise CV + open-loop iterations. Sessions is a third layer on top of both, and bundles in a non-trivial data-model fork (frozen vs. shared original) plus a new UI surface (session picker). Folding Sessions into v2 would double the scope and muddle the Revision boundary. Capture the intent, defer the design.