# CLI releases

The CLI uses Semantic Versioning and GitHub Releases. `package.json` contains the version embedded in source builds; release tags must use the exact same version with a `v` prefix.

Examples:

- `v0.1.1`: bug fix
- `v0.2.0`: feature release
- `v1.0.0`: first stable compatibility contract

Before 1.0, any necessary breaking CLI change should be called out prominently in the release notes and shipped in a minor version, never a patch.

## Publishing a release

1. Update `version` in `package.json`.
2. Run the full verification suite:

   ```bash
   bun run typecheck
   bun test
   bun run lint
   bun run build
   bun run build:cli
   ./dist/resume-optimizer version
   ```

3. Commit and merge the version change to `main`.
4. Create and push the matching tag:

   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

The `Release CLI` GitHub Actions workflow then:

1. Verifies the web app and CLI.
2. Confirms the tag matches `package.json`.
3. Cross-compiles standalone binaries with Bun 1.3.14.
4. Builds artifacts for Intel/ARM macOS and glibc/musl Linux.
5. Compresses the binaries and generates `checksums.txt`.
6. Creates the GitHub Release with generated release notes.

The repository and its Releases must be public for unauthenticated curl installation and update checks. The workflow needs `contents: write`, which is declared in the workflow itself; repository Actions settings must also allow the `GITHUB_TOKEN` to create releases.

## Installation contract

The public install command is:

```bash
curl -fsSL https://raw.githubusercontent.com/danielagg/resume-optimizer/main/install.sh | sh
```

`install.sh` downloads the matching asset from the latest GitHub Release, verifies it against `checksums.txt`, decompresses it, and installs it to `~/.local/bin/resume-optimizer` by default.

To install elsewhere:

```bash
RESUME_OPTIMIZER_INSTALL_DIR=/usr/local/bin sh install.sh
```

To install a specific version with a downloaded copy of `install.sh`:

```bash
RESUME_OPTIMIZER_DOWNLOAD_BASE=https://github.com/danielagg/resume-optimizer/releases/download/v0.1.0 sh install.sh
```

## Update behavior

The CLI queries GitHub's public latest-release endpoint at most once per 24 hours and caches the response under the user's standard cache directory. It only prompts when stdin and stderr are interactive terminals, and never interrupts the user's command when GitHub is unavailable.

When a newer stable release exists, the default-yes prompt is:

```text
Resume Optimizer 0.1.1 is available (installed: 0.1.0).
Update now? (Y/n)
```

Release binaries download their matching compressed asset, verify its SHA-256 checksum, and atomically replace the installed executable. Development/source builds print the curl installer command instead of attempting to overwrite Bun.

Automatic checks can be disabled with `RESUME_OPTIMIZER_NO_UPDATE_CHECK=1`; `resume-optimizer update` always performs an explicit check.
