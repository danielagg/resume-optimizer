# Resume Optimizer — Design Spec

Resolved during the grilling session (26 branches). Source of truth for building.

## Architecture

- **Pure SPA**, no backend. (ADR 0001)
- **BYO OpenAI key**: user pastes their own key on `/customize`, stored alongside resume data in localStorage.
- **Input Resume** persists in localStorage → pre-populates Builder on next visit.
- **Aligned Resume + Notes** are ephemeral (Zustand, dies with the tab — close the tab, lose the alignment).

## Domain Language

See `CONTEXT.md` for the canonical glossary. Terms to use everywhere (UI, code, docs):
Resume · Headline · Profile · Alignment · Job Posting · Aligned Resume · Notes · Languages · Socials · Template.

## Alignment Contract

The LLM may: **reorder** sections/list items, **rephrase** content (wording only), **omit** items it deems irrelevant.
It may **never**: substitute facts (degree names, numbers) or fabricate experience.
Anything it wants to do but can't (e.g. "consider rewording BSc to BS for US audiences", "you seem to be missing X skill") goes into **Notes**, surfaced read-only to the user.

## Resume Data Model

```ts
type Level = 'Basic' | 'Advanced' | 'Fluent' | 'Native'

interface Social { label: string; url: string }
interface WorkExperience {
  positionTitle: string
  company: string
  location: string
  from: string         // free-text, UI default = month/year picker
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

## Routing

- `/` Home — landing page, "Get Started" always → `/builder`
- `/builder` Builder — long scrollable form, shadcn Card per section. Pre-populated from localStorage (no skip). Bottom CTA: "Continue to Customize →" (validator blocks if required fields missing). Also has "Download CV" button.
- `/customize` Customize — paste Job Posting + OpenAI API key (both persist). "Align my CV" button → OpenAI call. Inline shadcn Alert for errors, distinct per failure mode (401/429/schema/network/refusal). On success → set Zustand, navigate to `/preview`.
- `/preview` Preview — renders Aligned Resume via Template. Notes section below. "Download Aligned CV" button. "Back to Customize" link. Direct navigation with no Aligned Resume in store → redirect to `/customize`.

**Top nav:** none. Linear flow via in-page CTAs only.
**Step indicator:** non-interactive "Step N of 3: X" at top of Builder/Customize/Preview (Home excluded).

## Builder Form

- One long scrollable form, sections as shadcn Cards.
- Lists: "+ Add {item}" button at bottom of each list; trash icon to remove.
- Mandatory lists (work experience): Remove disabled at min-1.
- Optional lists (socials, education, other achievements, languages): Remove always available, even on last entry.
- Dates: default month/year picker with a toggle to free-text; under the hood always stored as string.

## Customize

- API key field (above the Align button), persisted in localStorage, pre-filled on return.
- Job Posting: free textarea. Provider-agnostic (LinkedIn, Indeed, anything).
- "Align my CV" calls OpenAI with:
  - System message: contents of `src/prompts/alignment.md` (checked-in file, imported via Vite `?raw`).
  - User message: `{ resume, job_posting }` JSON.
  - `response_format: json_schema` returning `{ aligned_resume: Resume, notes: string }`.

## Preview & PDF

- Template renders the Resume (aligned or not) for on-screen preview (HTML/Tailwind) and PDF export (`@react-pdf/renderer` — separate React tree with `@react-pdf` primitives; one `Resume` type, two render paths).
- Builder has "Download CV" → exports the plain Resume.
- Preview has "Download Aligned CV" → exports the Aligned Resume.

## Tech Stack

- **Bun** as package manager / script runner.
- Scaffold via: `bunx --bun shadcn@latest init --preset b1tzITugS --template vite --pointer` (pulls in Vite React TS template + shadcn/ui + Tailwind v4).
- **React 19** + Vite.
- **TanStack Router** for routing.
- **TanStack Form** for the Builder's nested forms (`useFieldArray` for lists).
- **Zustand** for the alignment state store (wraps `{ alignedResume, notes }`).
- **shadcn/ui** + Tailwind v4 (via preset).
- **@react-pdf/renderer** for PDF export.
- **Skip TanStack Query** (no remote data; only a one-shot OpenAI mutation).

## Theme

Light + dark mode both supported, with a visible toggle in the app (the shadcn preset already ships a `ThemeProvider` + 'd' keyboard shortcut). Persisted via localStorage.

## Excluded from v1

- Auth / user management (Get Started just routes to Builder, no session).
- Persistence of Aligned Resume + Notes.
- URL-based job posting fetching (paste raw text only).
- "Act on" affordance for Notes (read-only).
- Open socials list expansion beyond `{label, url}` fields.