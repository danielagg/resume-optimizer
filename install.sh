#!/bin/sh
set -eu

REPOSITORY="danielagg/resume-optimizer"
INSTALL_DIR="${RESUME_OPTIMIZER_INSTALL_DIR:-${HOME}/.local/bin}"
DOWNLOAD_BASE="${RESUME_OPTIMIZER_DOWNLOAD_BASE:-https://github.com/${REPOSITORY}/releases/latest/download}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "resume-optimizer: required command not found: $1" >&2
    exit 1
  fi
}

require_command curl
require_command gzip
require_command awk

case "$(uname -s)" in
  Darwin) os="darwin" ;;
  Linux) os="linux" ;;
  *)
    echo "resume-optimizer: unsupported operating system: $(uname -s)" >&2
    exit 1
    ;;
esac

case "$(uname -m)" in
  arm64|aarch64) arch="arm64" ;;
  x86_64|amd64) arch="x64" ;;
  *)
    echo "resume-optimizer: unsupported architecture: $(uname -m)" >&2
    exit 1
    ;;
esac

libc=""
if [ "$os" = "linux" ]; then
  if (ldd --version 2>&1 || true) | grep -qi musl; then
    libc="-musl"
  elif ls /lib/ld-musl-*.so.1 >/dev/null 2>&1; then
    libc="-musl"
  fi
fi

asset="resume-optimizer-${os}-${arch}${libc}.gz"
temporary_dir="$(mktemp -d)"
trap 'rm -rf "$temporary_dir"' EXIT INT TERM

echo "Downloading Resume Optimizer for ${os}/${arch}${libc}..."
curl -fsSL "${DOWNLOAD_BASE}/${asset}" -o "${temporary_dir}/${asset}"
curl -fsSL "${DOWNLOAD_BASE}/checksums.txt" -o "${temporary_dir}/checksums.txt"

expected="$(awk -v name="$asset" '$2 == name { print $1 }' "${temporary_dir}/checksums.txt")"
if [ -z "$expected" ]; then
  echo "resume-optimizer: checksum not found for ${asset}" >&2
  exit 1
fi

if command -v sha256sum >/dev/null 2>&1; then
  actual="$(sha256sum "${temporary_dir}/${asset}" | awk '{ print $1 }')"
elif command -v shasum >/dev/null 2>&1; then
  actual="$(shasum -a 256 "${temporary_dir}/${asset}" | awk '{ print $1 }')"
else
  echo "resume-optimizer: sha256sum or shasum is required" >&2
  exit 1
fi

if [ "$actual" != "$expected" ]; then
  echo "resume-optimizer: SHA-256 verification failed" >&2
  exit 1
fi

mkdir -p "$INSTALL_DIR"
gzip -dc "${temporary_dir}/${asset}" > "${temporary_dir}/resume-optimizer"
chmod 755 "${temporary_dir}/resume-optimizer"
mv "${temporary_dir}/resume-optimizer" "${INSTALL_DIR}/resume-optimizer"

echo "Installed Resume Optimizer $(${INSTALL_DIR}/resume-optimizer version)"
echo "Binary: ${INSTALL_DIR}/resume-optimizer"

case ":${PATH}:" in
  *":${INSTALL_DIR}:"*) ;;
  *)
    echo "Add ${INSTALL_DIR} to PATH, for example:" >&2
    echo "  export PATH=\"${INSTALL_DIR}:\$PATH\"" >&2
    ;;
esac
