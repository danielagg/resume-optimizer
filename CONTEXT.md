# Resume Optimizer

A small SPA that lets a user input their CV data, align it toward a specific job posting via an LLM, preview the tailored CV, and export it to PDF. No backend, no persistence beyond localStorage. Supports light and dark themes.

## Language

**Resume**:
The structured set of CV data the user inputs through the Builder page (personal details, profile, work experience, education, other achievements, languages). The single source of truth for everything the app renders and aligns.
_Avoid_: CV, profile, application

**Headline**:
A short professional title under the full name in the CV header — the user's current professional identity (e.g. "Senior Software Engineer"). Distinct from the per-role position titles inside work experience.
_Avoid_: position, title, role, current role

**Profile**:
A short free-text self-description, one field inside the Resume. Not to be confused with the Resume itself.
_Avoid_: bio, summary, about-me

**Alignment**:
The act of tailoring the Resume toward a specific Job Posting using an LLM. Produces an Aligned Resume plus Notes in a single response. The LLM may reorder sections and list items, rephrase content (wording only), and omit items it deems irrelevant — but may never substitute facts (e.g. degree names, numbers) or fabricate experience. Anything it wants to do but can't (e.g. suggest rewording a degree for a US audience, flag a gap) goes into Notes instead, where it surfaces to the user read-only.
_Avoid_: matching, tailoring, optimizing

**Revision**:
A follow-up pass after the user has reviewed Notes, ticked specific points to address, and optionally written free-text responses. The Revision contract is looser than Alignment: the LLM may execute any change the user has explicitly green-lit, including fact substitutions it wasn't allowed to do unprompted (e.g. "change headline from Full Stack Dev to Tech Lead"), adding new content the user described in their response, or any other edit the user authorized — no hand-holding, no "are you sure." The LLM is the user's instrument, not their nanny. Produces a new Aligned Resume plus a new set of Notes. Revisions are an open loop — the user can run as many as they want until the LLM returns zero Notes.
_Avoid_: re-run, retry, second pass

**Job Posting**:
The free-text job description the user pastes into the Customize page as the target for Alignment. Provider-agnostic — works with any source (LinkedIn, Indeed, a company careers page, an email forward).
_Avoid_: listing, job ad, role

**Aligned Resume**:
The Resume after Alignment — content rephrased or reordered to emphasize fit with the Job Posting, drawn only from data the user already input. Always a one-shot snapshot from the LLM; edits to the input Resume do not retroactively rewrite past Aligned Resumes.
_Avoid_: optimized CV, matched resume

**Session**:
One Alignment-and-Revision flow tied to a specific Job Posting. Contains the Job Posting text, the current Aligned Resume, the current Notes, a name, and a creation date. References the shared canonical input Resume (not a frozen snapshot) — editing the input Resume in Builder propagates to future Alignment calls for any session, but past Aligned Resumes stay as snapshots. Reverting a session re-runs Alignment against the live input Resume plus the session's stored Job Posting.
_Avoid_: version, save, draft, profile

**Notes**:
The list of Note items returned by the LLM alongside the Aligned Resume. Surfaced to the user on the Preview page — action-grade Notes can be ticked and addressed via a Revision pass; Info Notes are read-only awareness.
_Avoid_: suggestions, tips, feedback

**Note**:
A single structured feedback item returned by the LLM alongside the Aligned Resume. Each Note has a severity (Critical, Important, Medium, Low, Info), free-text body, and an optional `suggestedFix` (a concrete proposed edit the LLM couldn't make during Alignment because it would violate the contract). Info-severity Notes have no `suggestedFix` and are pure awareness ("you have a 6-month gap — prepare an explanation"). Action-grade Notes can be ticked by the user to address them, with an optional free-text response, then submitted via a Revision pass.
_Avoid_: suggestion, tip, feedback item

**Languages**:
Human/spoken languages the user lists with a proficiency level (Basic, Advanced, Fluent, Native). One field inside the Resume. Programming languages belong to the `tech_stack` of individual work experiences, not here.
_Avoid_: spoken languages, human languages, language proficiencies

**Socials**:
Open list of `{ label, url }` pairs the user adds to the Resume header — e.g. `{ label: "LinkedIn", url: "linkedin.com/in/johndoe" }`. No fixed set, no validation. The Template renders each as `<a href="{url}">{label}</a>`.
_Avoid_: links, network profiles, contacts

**Template**:
The static presentation component that renders a Resume (aligned or not) for preview and PDF export. Currently a single hardcoded layout.
_Avoid_: layout, theme, design