import type { Resume, Session } from "@/types/resume"

const ORIGINAL_KEY = "resume-optimizer:original-resume"
const API_KEY = "resume-optimizer:openai-key"
const SESSIONS_KEY = "resume-optimizer:sessions"
const ACTIVE_KEY = "resume-optimizer:active-session"

/* ---- original resume ---- */

export function loadOriginalResume(): Resume | null {
  const raw = localStorage.getItem(ORIGINAL_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Resume
  } catch {
    return null
  }
}

export function saveOriginalResume(resume: Resume): void {
  localStorage.setItem(ORIGINAL_KEY, JSON.stringify(resume))
}

/* ---- openai key ---- */

export function loadApiKey(): string {
  return localStorage.getItem(API_KEY) ?? ""
}

export function saveApiKey(key: string): void {
  localStorage.setItem(API_KEY, key)
}

/* ---- sessions ---- */

export function loadSessions(): Record<string, Session> {
  const raw = localStorage.getItem(SESSIONS_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, Session>
  } catch {
    return {}
  }
}

export function saveSessions(sessions: Record<string, Session>): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function getActiveSessionName(): string | null {
  return localStorage.getItem(ACTIVE_KEY)
}

export function setActiveSessionName(name: string | null): void {
  if (name === null) localStorage.removeItem(ACTIVE_KEY)
  else localStorage.setItem(ACTIVE_KEY, name)
}

export function getActiveSession(): Session | null {
  const name = getActiveSessionName()
  if (!name) return null
  const sessions = loadSessions()
  return sessions[name] ?? null
}

export function getMRUSession(): Session | null {
  const sessions = loadSessions()
  const list = Object.values(sessions)
  if (list.length === 0) return null
  list.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
  return list[0]
}

export function createSession(
  name: string,
  jobPosting: string
): Session {
  const now = new Date().toISOString()
  const session: Session = {
    name,
    jobPosting,
    alignedResume: null,
    notes: [],
    createdAt: now,
    updatedAt: now,
  }
  const sessions = loadSessions()
  sessions[name] = session
  saveSessions(sessions)
  setActiveSessionName(name)
  return session
}

export function updateSession(
  name: string,
  updates: Partial<Session>
): void {
  const sessions = loadSessions()
  if (!sessions[name]) return
  sessions[name] = {
    ...sessions[name],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  saveSessions(sessions)
}

export function deleteSession(name: string): void {
  const sessions = loadSessions()
  delete sessions[name]
  saveSessions(sessions)
  if (getActiveSessionName() === name) {
    setActiveSessionName(null)
  }
}

export function renameSession(oldName: string, newName: string): boolean {
  const sessions = loadSessions()
  if (sessions[newName]) return false
  const session = sessions[oldName]
  if (!session) return false
  const renamed: Session = {
    ...session,
    name: newName,
    updatedAt: new Date().toISOString(),
  }
  delete sessions[oldName]
  sessions[newName] = renamed
  saveSessions(sessions)
  if (getActiveSessionName() === oldName) {
    setActiveSessionName(newName)
  }
  return true
}

export function generateSessionName(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10)
  const sessions = loadSessions()
  if (!sessions[date]) return date
  const time = now.toISOString().slice(11, 16)
  return `${date} ${time}`
}