import type { Note, Resume, Session } from "../src/types/resume"

export function formatNotes(notes: Note[]): string {
  if (notes.length === 0) return "No further notes — your CV is ready."
  return notes
    .map((note, index) => {
      const lines = [`${index + 1}. [${note.severity}] ${note.text}`]
      if (note.suggestedFix) {
        lines.push(`   Suggested direction: ${note.suggestedFix}`)
      }
      if (note.severity === "Info") lines.push("   Awareness only")
      return lines.join("\n")
    })
    .join("\n\n")
}

export function formatResume(resume: Resume): string {
  const lines: string[] = [
    resume.fullName,
    resume.headline,
    [resume.location, resume.email, resume.phone].filter(Boolean).join(" · "),
  ]

  if (resume.socials.length > 0) {
    lines.push(
      resume.socials
        .map((social) => `${social.label}: ${social.url}`)
        .join(" · ")
    )
  }
  if (resume.profile) lines.push("", "PROFILE", resume.profile)

  if (resume.workExperience.length > 0) {
    lines.push("", "WORK EXPERIENCE")
    for (const experience of resume.workExperience) {
      lines.push(
        "",
        `${experience.positionTitle} · ${experience.company}`,
        `${experience.from} — ${experience.to ?? "Present"} · ${experience.location}`,
        experience.description
      )
      lines.push(...experience.keyAchievements.map((item) => `- ${item}`))
      if (experience.techStack.length > 0) {
        lines.push(`Stack: ${experience.techStack.join(", ")}`)
      }
      if (experience.methodologies.length > 0) {
        lines.push(`Methodologies: ${experience.methodologies.join(", ")}`)
      }
    }
  }

  if (resume.education.length > 0) {
    lines.push("", "EDUCATION")
    for (const education of resume.education) {
      lines.push(
        `${education.degree} · ${education.university} · ${education.from} — ${education.to ?? "Present"}`
      )
    }
  }

  if (resume.otherAchievements.length > 0) {
    lines.push("", "OTHER ACHIEVEMENTS")
    lines.push(
      ...resume.otherAchievements.map(
        (achievement) =>
          `- ${achievement.name}${achievement.date ? ` — ${achievement.date}` : ""}`
      )
    )
  }

  if (resume.languages.length > 0) {
    lines.push("", "LANGUAGES")
    lines.push(
      resume.languages
        .map((language) => `${language.name} (${language.level})`)
        .join(" · ")
    )
  }

  return lines.join("\n").trim()
}

export function formatSessions(
  sessions: Session[],
  activeSessionName: string | null
): string {
  if (sessions.length === 0) return "No sessions yet."
  return sessions
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((session) => {
      const marker = session.name === activeSessionName ? "*" : " "
      const status = session.alignedResume ? "aligned" : "not aligned"
      return `${marker} ${session.name}  ${status}  ${session.updatedAt}`
    })
    .join("\n")
}
