# Resume Optimizer

Tailor your CV to any job description using an LLM — no sign-up, no backend, your data stays in your browser.

## Features

- **Builder** — enter CV data (experience, education, skills, languages)
- **Customize** — paste a job posting + your OpenAI API key, run Alignment
- **Preview** — review the tailored CV, tick Notes items, run Revisions
- **PDF export** — download your original or aligned CV as PDF

## Tech stack

React, TypeScript, Vite, shadcn/ui, TanStack Router, Zustand, Tailwind CSS, `@react-pdf/renderer`.

## Getting started

```bash
npm install
npm run dev
```

## Usage

1. Fill in your CV on the Builder page (required: full name, headline, email, profile, at least one work experience).
2. Go to Customize, paste a job posting and your OpenAI API key, click "Align my CV".
3. Review the aligned CV on Preview. Tick Notes you want to address and run a Revision, or export to PDF.
4. Switch sessions to try different job postings without losing work.

Data is persisted to `localStorage`. No server. Your API key is sent directly to OpenAI from your browser.
