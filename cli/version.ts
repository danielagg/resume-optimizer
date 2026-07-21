import packageMetadata from "../package.json" with { type: "json" }

declare const RESUME_OPTIMIZER_VERSION: string | undefined
declare const RESUME_OPTIMIZER_STANDALONE: boolean | undefined
declare const RESUME_OPTIMIZER_ASSET: string | undefined

export const VERSION =
  typeof RESUME_OPTIMIZER_VERSION === "string"
    ? RESUME_OPTIMIZER_VERSION
    : packageMetadata.version

export const IS_STANDALONE =
  typeof RESUME_OPTIMIZER_STANDALONE === "boolean" &&
  RESUME_OPTIMIZER_STANDALONE

export const RELEASE_ASSET =
  typeof RESUME_OPTIMIZER_ASSET === "string" ? RESUME_OPTIMIZER_ASSET : null
