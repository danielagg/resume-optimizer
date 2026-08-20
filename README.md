# Resume Optimizer

My local, single-use Resume tailoring loop.

## Run it

1. Copy `base_cv.example.json` to `base_cv.json` and fill it in.
2. Sign the Codex CLI into your ChatGPT account.
3. Start the tool.

```bash
codex login
bun start
```

The tool uses an ephemeral Codex CLI run and your saved ChatGPT authentication.
It does not require an OpenAI API key or use API billing. You can verify the
active login with `codex login status`.

The first screen asks you to paste the complete Job Posting. The terminal captures
the paste as one block and displays only a compact marker such as
`[Pasted 42 lines]`; press Enter to continue. The tool then aligns
`base_cv.json` and presents Codex's feedback as an interactive checklist.

Use the arrow keys to move, Space to check or uncheck a point, and Enter to
continue. For each checked point, accept Codex's suggested fix or type a custom
instruction. Info-only points remain visible but cannot be selected. Each pass
only revises the in-memory Resume JSON. The checklist always includes
`Finished, generate PDF`; select it whenever you want to stop revising and render
the current JSON. Even when Codex has no more feedback, PDF generation waits for
that explicit choice.

The final result overwrites `tailored_cv.pdf`.

## Design the PDF

Start the live PDF preview with:

```bash
bun run design
```

This opens `base_cv.json` in a full-browser PDF viewer. Edit
`src/resume-pdf-template.tsx` and save; the preview updates immediately through
React Fast Refresh. Changes to `base_cv.json` also reload the preview. The CLI's
final PDF export uses the same `ResumePdfTemplate` component.

`base_cv.json` and `tailored_cv.pdf` are git-ignored because they contain
personal data. Codex runs are ephemeral, so nothing from a run is saved
otherwise.

## Development checks

```bash
bun run typecheck
bun test
bun run lint
```
