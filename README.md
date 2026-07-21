# Resume Optimizer

Tailor your CV to any job description using an LLM — in the browser or from the command line. There is no app backend: the web app keeps data in browser storage and the CLI keeps it in local JSON files.

## Features

- **Builder** — enter CV data (experience, education, skills, languages)
- **Customize** — paste a job posting + your OpenAI API key, run Alignment
- **Preview** — review the tailored CV, tick Notes items, run Revisions
- **PDF export** — download your original or aligned CV as PDF
- **CLI** — the same Alignment, Notes, Revision, re-alignment, session, and export workflow from a terminal

## Tech stack

React, TypeScript, Vite, Bun, shadcn/ui, TanStack Router, Zustand, Tailwind CSS, `@react-pdf/renderer`.

## Getting started

```bash
bun install
bun run dev
```

## Usage

1. Fill in your CV on the Builder page (required: full name, headline, email, profile, at least one work experience).
2. Go to Customize, paste a job posting and your OpenAI API key, click "Align my CV".
3. Review the aligned CV on Preview. Tick Notes you want to address and run a Revision, or export to PDF.
4. Switch sessions to try different job postings without losing work.

Data is persisted to `localStorage`. No server. Your API key is sent directly to OpenAI from your browser.

## CLI

Install the standalone CLI on macOS or Linux—no Bun or Node.js required:

```bash
curl -fsSL https://raw.githubusercontent.com/danielagg/resume-optimizer/main/install.sh | sh
```

The installer detects the platform, verifies the release checksum, and writes `resume-optimizer` to `~/.local/bin`. Set `RESUME_OPTIMIZER_INSTALL_DIR` to choose another directory.

To inspect the installer before running it:

```bash
curl -fsSLO https://raw.githubusercontent.com/danielagg/resume-optimizer/main/install.sh
less install.sh
sh install.sh
```

For development, run the CLI from the repository:

```bash
bun run cli -- --help
```

Or make the `resume-optimizer` command available locally:

```bash
bun link
resume-optimizer --help
```

The quickest workflow is:

```bash
# Create .resume-optimizer/resume.json, then fill it in.
resume-optimizer init
resume-optimizer resume validate

# Align it. Use "-" instead of a filename to pipe the posting over stdin.
OPENAI_API_KEY=sk-... resume-optimizer align \
  --job job-posting.txt \
  --name acme

# Review and address numbered Notes.
resume-optimizer notes
OPENAI_API_KEY=sk-... resume-optimizer revise \
  --address 1,3 \
  --response '3=Use the suggested fix, but keep my current headline'

# Preview in the terminal and export the same PDF template used by the web app.
resume-optimizer show
resume-optimizer export --output acme-resume.pdf
```

You can also start from the checked-in shape example:

```bash
resume-optimizer init --from examples/resume.example.json
```

### Command map

| Web behavior                      | CLI command                                                  |
| --------------------------------- | ------------------------------------------------------------ |
| Builder                           | `init`, then edit `resume.json`; `resume validate` checks it |
| Align to a Job Posting            | `align --job <file> [--name <session>]`                      |
| Review the Aligned Resume         | `show` or `show --json`                                      |
| Review Notes                      | `notes` or `notes --json`                                    |
| Address Notes and revise          | `revise --address 1,2 [--response '2=...']`                  |
| Re-align from the base Resume     | `realign --yes`                                              |
| Switch/manage sessions            | `sessions list/new/use/rename/delete`                        |
| Export original or aligned Resume | `export [--original] [--format <type>]`                      |
| Show installed version            | `version`                                                    |
| Check for an update now           | `update`                                                     |

Export types are `pdf`, `json`, and `markdown`.

CLI state defaults to `.resume-optimizer/` in the current directory and is git-ignored. Override it with `--data-dir <path>` or `RESUME_OPTIMIZER_HOME`. The CLI does not store the OpenAI API key; use `OPENAI_API_KEY` (recommended) or `--api-key` for a single invocation.

The browser and CLI deliberately use different storage, but share the Resume and Session schemas, OpenAI request/response handling, checked-in prompts, and PDF document component.

The installed CLI checks GitHub Releases at most once every 24 hours. In an interactive terminal, a newer stable version produces an `Update now? (Y/n)` prompt. Checks are silent for JSON output, pipes, CI, and network failures. Source builds offer the curl installer instead of replacing Bun. Set `RESUME_OPTIMIZER_NO_UPDATE_CHECK=1` to disable automatic checks.

See [docs/RELEASING.md](docs/RELEASING.md) for the release and versioning process.

## Verification

```bash
bun run typecheck
bun test
bun run lint
bun run build
```
