import type { Resume } from "@/types/resume"

const RESUME_KEY = "resume-optimizer:resume"
const API_KEY = "resume-optimizer:openai-key"

export function loadResume(): Resume | null {
  const raw = localStorage.getItem(RESUME_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Resume
  } catch {
    return null
  }
}

export function saveResume(resume: Resume): void {
  localStorage.setItem(RESUME_KEY, JSON.stringify(resume))
}

export function loadApiKey(): string {
  return localStorage.getItem(API_KEY) ?? ""
}

export function saveApiKey(key: string): void {
  localStorage.setItem(API_KEY, key)
}