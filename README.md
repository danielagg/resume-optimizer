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

The first question asks for the Job Posting. Press Enter (the default), paste the
description and requirements directly into the terminal, and press Enter once.
The tool detects when the paste stops and continues automatically. Alternatively,
enter a public HTTP(S) URL and the tool will fetch it. It then aligns
`base_cv.json` and shows the model's numbered Notes.

Enter the Notes you want to address and optionally give the model an instruction
for each one. The loop continues until there are no Notes or you press Enter
without selecting any.

The final result overwrites `tailored_cv.pdf`.

`base_cv.json` and `tailored_cv.pdf` are git-ignored because they contain
personal data. Codex runs are ephemeral, so nothing from a run is saved
otherwise.

## Development checks

```bash
bun run typecheck
bun test
bun run lint
```
