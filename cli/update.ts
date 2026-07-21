import { createHash } from "node:crypto"
import {
  chmod,
  mkdir,
  readFile,
  realpath,
  rename,
  writeFile,
} from "node:fs/promises"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { promisify } from "node:util"
import { gunzip } from "node:zlib"
import { IS_STANDALONE, RELEASE_ASSET, VERSION } from "./version"

const REPOSITORY = "danielagg/resume-optimizer"
const RELEASE_API = `https://api.github.com/repos/${REPOSITORY}/releases/latest`
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000
const decompress = promisify(gunzip)

interface ReleaseAsset {
  name: string
  browser_download_url: string
}

interface LatestRelease {
  tag_name: string
  html_url: string
  assets: ReleaseAsset[]
}

interface UpdateCache {
  checkedAt: string
  release: LatestRelease | null
  lastPromptedVersion?: string
  lastPromptedAt?: string
}

export interface AvailableUpdate {
  version: string
  releaseUrl: string
  assets: ReleaseAsset[]
}

function cachePath(): string {
  const root = process.env.XDG_CACHE_HOME ?? join(homedir(), ".cache")
  return join(root, "resume-optimizer", "update-check.json")
}

function normalizedVersion(version: string): string {
  return version.trim().replace(/^v/, "")
}

function versionParts(
  version: string
): [number, number, number, string | null] | null {
  const match = normalizedVersion(version).match(
    /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/
  )
  if (!match) return null
  return [
    Number.parseInt(match[1], 10),
    Number.parseInt(match[2], 10),
    Number.parseInt(match[3], 10),
    match[4] ?? null,
  ]
}

export function isNewerVersion(candidate: string, current: string): boolean {
  const next = versionParts(candidate)
  const installed = versionParts(current)
  if (!next || !installed) return false
  const nextNumbers = next.slice(0, 3) as [number, number, number]
  const installedNumbers = installed.slice(0, 3) as [number, number, number]
  for (let index = 0; index < nextNumbers.length; index += 1) {
    if (nextNumbers[index] > installedNumbers[index]) return true
    if (nextNumbers[index] < installedNumbers[index]) return false
  }
  if (next[3] === installed[3]) return false
  if (next[3] === null) return installed[3] !== null
  if (installed[3] === null) return false
  return next[3].localeCompare(installed[3], undefined, { numeric: true }) > 0
}

async function readCache(): Promise<UpdateCache | null> {
  try {
    return JSON.parse(await readFile(cachePath(), "utf8")) as UpdateCache
  } catch {
    return null
  }
}

async function writeCache(cache: UpdateCache): Promise<void> {
  try {
    const path = cachePath()
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, `${JSON.stringify(cache, null, 2)}\n`, {
      mode: 0o600,
    })
  } catch {
    // Update checks must never stop the user's actual command.
  }
}

function isFresh(timestamp: string | undefined): boolean {
  if (!timestamp) return false
  const checkedAt = Date.parse(timestamp)
  return (
    Number.isFinite(checkedAt) && Date.now() - checkedAt < CHECK_INTERVAL_MS
  )
}

async function fetchLatestRelease(): Promise<LatestRelease | null> {
  const response = await fetch(RELEASE_API, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": `resume-optimizer/${VERSION}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    signal: AbortSignal.timeout(2_000),
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}.`)
  const release = (await response.json()) as Partial<LatestRelease>
  if (
    typeof release.tag_name !== "string" ||
    typeof release.html_url !== "string" ||
    !Array.isArray(release.assets)
  ) {
    throw new Error("GitHub returned an invalid release response.")
  }
  return release as LatestRelease
}

export async function checkForUpdate(
  force = false
): Promise<AvailableUpdate | null> {
  let cache = await readCache()
  if (!force && cache?.lastPromptedVersion && isFresh(cache.lastPromptedAt)) {
    return null
  }

  if (force || !cache || !isFresh(cache.checkedAt)) {
    try {
      const release = await fetchLatestRelease()
      cache = { checkedAt: new Date().toISOString(), release }
      await writeCache(cache)
    } catch (error) {
      if (force) throw error
      return null
    }
  }

  const release = cache.release
  if (!release || !isNewerVersion(release.tag_name, VERSION)) return null
  return {
    version: normalizedVersion(release.tag_name),
    releaseUrl: release.html_url,
    assets: release.assets,
  }
}

export async function markUpdatePrompted(version: string): Promise<void> {
  const cache = await readCache()
  if (!cache) return
  await writeCache({
    ...cache,
    lastPromptedVersion: version,
    lastPromptedAt: new Date().toISOString(),
  })
}

function assetUrl(update: AvailableUpdate, name: string): string {
  const asset = update.assets.find((candidate) => candidate.name === name)
  if (!asset) throw new Error(`Release ${update.version} is missing ${name}.`)
  return asset.browser_download_url
}

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: { "User-Agent": `resume-optimizer/${VERSION}` },
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok)
    throw new Error(`Download failed with HTTP ${response.status}.`)
  return Buffer.from(await response.arrayBuffer())
}

function expectedChecksum(checksums: string, assetName: string): string {
  for (const line of checksums.split("\n")) {
    const [checksum, name] = line.trim().split(/\s+/, 2)
    if (name === assetName && /^[a-f0-9]{64}$/i.test(checksum)) return checksum
  }
  throw new Error(`checksums.txt has no entry for ${assetName}.`)
}

export function canSelfUpdate(): boolean {
  return IS_STANDALONE && RELEASE_ASSET !== null
}

export async function installUpdate(update: AvailableUpdate): Promise<void> {
  if (!canSelfUpdate() || !RELEASE_ASSET) {
    throw new Error("This development build cannot replace itself.")
  }

  const [archive, checksums] = await Promise.all([
    download(assetUrl(update, RELEASE_ASSET)),
    download(assetUrl(update, "checksums.txt")),
  ])
  const expected = expectedChecksum(checksums.toString("utf8"), RELEASE_ASSET)
  const actual = createHash("sha256").update(archive).digest("hex")
  if (actual !== expected)
    throw new Error("Downloaded update failed SHA-256 verification.")

  const executable = await realpath(process.execPath)
  const temporary = join(
    dirname(executable),
    `.resume-optimizer-${process.pid}.tmp`
  )
  await writeFile(temporary, await decompress(archive), { mode: 0o755 })
  await chmod(temporary, 0o755)
  await rename(temporary, executable)
}

export const INSTALL_COMMAND =
  "curl -fsSL https://raw.githubusercontent.com/danielagg/resume-optimizer/main/install.sh | sh"
