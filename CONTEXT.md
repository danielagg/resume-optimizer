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

**Job Posting**:
The free-text job description the user pastes into the Customize page as the target for Alignment. Provider-agnostic — works with any source (LinkedIn, Indeed, a company careers page, an email forward).
_Avoid_: listing, job ad, role

**Aligned Resume**:
The Resume after Alignment — content rephrased or reordered to emphasize fit with the Job Posting, drawn only from data the user already input.
_Avoid_: optimized CV, matched resume

**Notes**:
Free-text output from the LLM alongside the Aligned Resume — gaps, missing skills, and other pass-aware feedback to the user. Read-only in v1; no "act on" affordance.
_Avoid_: suggestions, tips, feedback

**Languages**:
Human/spoken languages the user lists with a proficiency level (Basic, Advanced, Fluent, Native). One field inside the Resume. Programming languages belong to the `tech_stack` of individual work experiences, not here.
_Avoid_: spoken languages, human languages, language proficiencies

**Socials**:
Open list of `{ label, url }` pairs the user adds to the Resume header — e.g. `{ label: "LinkedIn", url: "linkedin.com/in/johndoe" }`. No fixed set, no validation. The Template renders each as `<a href="{url}">{label}</a>`.
_Avoid_: links, network profiles, contacts

**Template**:
The static presentation component that renders a Resume (aligned or not) for preview and PDF export. v1 is a single hardcoded layout.
_Avoid_: layout, theme, design