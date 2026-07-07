# Resume Optimizer — Design Spec

Resolved across two grilling sessions (26 + 17 branches). Source of truth for building.

## Architecture

- **Pure SPA**, no backend. (ADR 0001)
- **BYO OpenAI key**: user pastes their own key on `/customize`, stored alongside resume data in localStorage.
- **Input Resume** persists in localStorage → pre-populates Builder on next visit.
- **Aligned Resume + Notes** are ephemeral (Zustand, dies with the tab — close the tab, lose the alignment). Multi-session persistence is an upcoming feature (see `docs/upcoming-sessions-notes.md`).

## Domain Language

See `CONTEXT.md` for the canonical glossary. Terms to use everywhere (UI, code, docs):
Resume · Headline · Profile · Alignment · Job Posting · Aligned Resume · Notes · Note · Revision · Languages · Socials · Template.

## Alignment Contract

The LLM may: **reorder** sections/list items, **rephrase** content (wording only), **omit** items it deems irrelevant.
It may **never**: substitute facts (degree names, numbers) or fabricate experience.
Anything it wants to do but can't (e.g. "consider rewording BSc to BS for US audiences", "you seem to be missing X skill") goes into **Notes**, surfaced to the user read-only.

## Revision Contract

A follow-up pass after the user has ticked specific Notes to address and optionally written free-text responses. The Revision contract is **looser than Alignment**:

- The LLM may execute **anything the user has explicitly green-lit** by ticking + responding, including:
  - Fact substitutions forbidden during Alignment ("change headline from Full Stack Dev to Tech Lead")
  - Adding new content the user described in their response (e.g. "I have Kubernetes exposure from 2022-2023 side project — please add it to my ACME role's tech stack")
  - Any other edit the user authorized
- **No hand-holding, no "are you sure."** The LLM is the user's instrument, not their nanny. The user has all the power; whatever they green-light, the LLM executes.
- **Revision is incremental**: the base is the current Aligned Resume, not the original input Resume. The LLM preserves previously-aligned content except where green-lit changes apply.
- **Revision is destructive at the UI level**: the new Aligned Resume + Notes overwrite the previous ones in Zustand. Recovery from an unwanted revision = re-align from scratch via `/customize`.
- **Convergence**: revisions run in an open loop until the LLM returns zero Notes. At that point "Revise CV" is disabled, the page displays "No further notes — your CV is ready," and "Download Aligned CV" remains the exit.

## Note Schema

```ts
type Severity = 'Critical' | 'Important' | 'Medium' | 'Low' | 'Info'

interface Note {
  severity: Severity
  text: string
  suggestedFix?: string  // optional. Absent for pure awareness Notes (Info severity typically)
}
```

- **5 severity levels**: Critical / Important / Medium / Low / Info. Drives the UI Badge color (red / orange / yellow / blue / gray).
- **`suggestedFix`**: optional free-text concrete proposed edit. Present when the LLM has a specific Resume edit it couldn't execute during Alignment (would violate the contract); absent for pure awareness feedback (e.g. "you have a 6-month gap — prepare an explanation").
- **Info Notes** have no `suggestedFix` and render without a "tick to address" checkbox — pure awareness.

## Resume Data Model

```ts
type Level = 'Basic' | 'Advanced' | 'Fluent' | 'Native'

interface Social { label: string; url: string }
interface WorkExperience {
  positionTitle: string
  company: string
  location: string
  from: string         // free-text, UI default = month/year picker (with toggle to free-text)
  to: string | null    // null => currently employed
  description: string
  keyAchievements: string[]
  techStack: string[]
  methodologies: string[]
}
interface Education {
  degree: string
  university: string
  from: string
  to: string | null
}
interface OtherAchievement { name: string; date: string | null }
interface Language { name: string; level: Level }

interface Resume {
  fullName: string
  headline: string
  location: string
  email: string
  phone: string | null
  profile: string
  socials: Social[]
  workExperience: WorkExperience[]   // mandatory, min 1
  education: Education[]              // optional
  otherAchievements: OtherAchievement[] // optional
  languages: Language[]               // optional
}
```

**Required-fields gate** (for Builder form submission): `fullName + headline + email + profile + ≥1 work experience`. Everything else optional.

## Alignment Response Shape

Both Alignment and Revision return the same shape:

```ts
interface AlignmentResponse {
  alignedResume: Resume
  notes: Note[]
}
```

Reused for both passes — the call site (`alignResume()` vs `reviseResume()`) disambiguates intent.

## Routing

- `/` Home — landing page, "Get Started" always → `/builder`
- `/builder` Builder — long scrollable form, shadcn Card per section. Pre-populated from localStorage (no skip). Bottom CTA: "Continue to Customize →" (validator blocks if required fields missing). Also has "Download CV as is" button.
- `/customize` Customize — paste Job Posting + OpenAI API key (both persist). "Align my CV" button → OpenAI call (Alignment contract). Inline shadcn Alert for errors, distinct per failure mode (401/429/schema/network/refusal). On success → set Zustand, navigate to `/preview`.
- `/preview` Preview — renders Aligned Resume via Template. Interactive Notes section (see below). "Download Aligned CV" button. "Back to Customize" link. Direct navigation with no Aligned Resume in store → redirect to `/customize`.

**Top nav:** none. Linear flow via in-page CTAs only.
**Step indicator:** non-interactive "Step N of 3: X" at top of Builder/Customize/Preview (Home excluded).

## Builder Form

- One long scrollable form, sections as shadcn Cards.
- Lists: "+ Add {item}" button at bottom of each list; trash icon to remove.
- Mandatory lists (work experience): Remove disabled at min-1.
- Optional lists (socials, education, other achievements, languages): Remove always available, even on last entry.
- Validation runs on submit; errors stay hidden until first submit attempt, then live-rederive as user types (clearing as fields become valid).
- Dates: stored as strings; UI defaults to month/year picker with a toggle to free-text.

## Customize

- API key field (above the Align button), persisted in localStorage, pre-filled on return.
- Job Posting: free textarea. Provider-agnostic (LinkedIn, Indeed, anything).
- "Align my CV" calls OpenAI with:
  - System message: contents of `src/prompts/alignment.md` (checked-in file, imported via Vite `?raw`).
  - User message: `{ resume, job_posting }` JSON.
  - `response_format: json_object` returning `{ alignedResume: Resume, notes: Note[] }`.

## Preview & Notes UI

- Aligned Resume via Template (same component as Builder's live preview).
- **Notes section** below the Resume — a list of Cards, one per Note:
  - Severity Badge on the left (colored: red/orange/yellow/blue/gray for Critical/Important/Medium/Low/Info).
  - Note `text` body.
  - `suggestedFix`, if present, rendered as "LLM suggests: …" subtext.
  - "Tick to address" checkbox (disabled/hidden for Info severity — pure awareness).
  - When ticked: optional free-text textarea appears below for the user's response. Blank = "execute the suggestedFix as-is."
- **"Revise CV" button** below the Notes list, disabled until ≥1 Note is ticked. Label includes count ("Revise CV (2 addressed)").
- Clicking "Revise CV" calls `reviseResume()` (Revision contract), shows loading state, replaces Aligned Resume + Notes in Zustand with the new result.
- **Convergence** (zero Notes returned): "Revise CV" disabled/hidden, page shows "No further notes — your CV is ready" callout, "Download Aligned CV" remains the exit.
- **UI is uniform from the first Alignment** — no special "first pass is read-only" gate; user can tick + Revise immediately.

## Revision API

- Separate prompt file: `src/prompts/revision.md` (imported via Vite `?raw`).
- Separate client function: `reviseResume()` in `src/lib/revise.ts` (parallel to `src/lib/align.ts`).
- Reuses `AlignmentResponse` shape: `{ alignedResume: Resume, notes: Note[] }`.
- **User message JSON**:
  ```json
  {
    "jobPosting": "...",
    "currentAlignedResume": { ...Resume },
    "addressedNotes": [
      { "severity": "...", "text": "...", "suggestedFix": "..." | null, "userResponse": "..." | null }
    ],
    "dismissedNotes": [
      { "severity": "...", "text": "...", "suggestedFix": "..." | null }
    ]
  }
  ```
  The LLM may re-raise a dismissed Note only if newly relevant given the changes applied this pass; otherwise returns fresh Notes only.
- **System message**: `revision.md` — defines the looser contract, the format of `addressedNotes`/`dismissedNotes`, and the output JSON shape.

## Preview & PDF

- Template renders the Resume (aligned or not) for on-screen preview (HTML/Tailwind) and PDF export (`@react-pdf/renderer` — separate React tree with `@react-pdf` primitives; one `Resume` type, two render paths).
- Builder has "Download CV as is" → exports the plain Resume.
- Preview has "Download Aligned CV" → exports the Aligned Resume.

## Tech Stack

- **Bun** as package manager / script runner.
- Scaffold via: `bunx --bun shadcn@latest init --preset b1tzITugS --template vite --pointer` (pulls in Vite React TS template + shadcn/ui + Tailwind v4).
- **React 19** + Vite.
- **TanStack Router** for routing (file-based, auto-generated route tree via `@tanstack/router-plugin`).
- **Zustand** for the alignment state store (`{ alignedResume, notes, jobPosting }`).
- **shadcn/ui** + Tailwind v4 (via preset) + shadcn `badge` component for severity badges.
- **@react-pdf/renderer** for PDF export.
- **openai** SDK for the OpenAI call (BYO key from localStorage).
- **zod** for runtime schema validation (Resume shape, Note shape, OpenAI response parsing).
- **Skip TanStack Query** (no remote data; only one-shot OpenAI mutations).
- Plain `useState` + `useMemo` for the Builder form (no TanStack Form — too much ceremony for a project this size).

## Theme

Light + dark mode both supported, with a visible toggle in the app (the shadcn preset already ships a `ThemeProvider` + 'd' keyboard shortcut). Persisted via localStorage.

## Excluded

- Auth / user management (Get Started just routes to Builder, no session).
- Persistence of Aligned Resume + Notes (ephemeral in Zustand; upcoming feature — see `docs/upcoming-sessions-notes.md`).
- URL-based job posting fetching (paste raw text only).
- Multi-session support / session picker / per-session original-Resume snapshots (upcoming feature — see `docs/upcoming-sessions-notes.md`).
- Revision history / undo / compare-revisions (Revision is destructive at the UI level).
- Open socials list expansion beyond `{label, url}` fields.
