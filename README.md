# Resume Optimizer

My local, single-use Resume tailoring loop.

## Run it

1. Copy `base_cv.example.json` to `base_cv.json` and fill it in.
2. Export an OpenAI API key.
3. Start the tool.

```bash
export OPENAI_API_KEY=sk-...
bun start
```

The first question asks for the Job Posting. Press Enter (the default) to paste
the description and requirements directly into the terminal, then type `END` on
its own line. Alternatively, enter a public HTTP(S) URL and the tool will fetch
it. It then aligns `base_cv.json` and shows the model's numbered Notes.

Enter the Notes you want to address and optionally give the model an instruction
for each one. The loop continues until there are no Notes or you press Enter
without selecting any.

The final result overwrites `tailored_cv.pdf`.

`base_cv.json` and `tailored_cv.pdf` are git-ignored because they contain
personal data. Nothing from a run is saved otherwise.

## Development checks

```bash
bun run typecheck
bun test
bun run lint
```
