import type { Resume } from "@/types/resume"

interface TemplateProps {
  resume: Resume
}

export function ResumeTemplate({ resume }: TemplateProps) {
  return (
    <article className="mx-auto max-w-[820px] bg-card text-card-foreground shadow-sm">
      <header className="border-b border-border px-10 py-8">
        <h1 className="text-2xl font-medium">{resume.fullName}</h1>
        <p className="text-sm text-muted-foreground">{resume.headline}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {resume.location && <span>{resume.location}</span>}
          {resume.email && <span>{resume.email}</span>}
          {resume.phone && <span>{resume.phone}</span>}
          {resume.socials.map((s) => (
            <a
              key={s.label}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              {s.label}
            </a>
          ))}
        </div>
      </header>

      <section className="space-y-6 px-10 py-8">
        {resume.profile && (
          <section>
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
              Profile
            </h2>
            <p className="mt-1 text-sm leading-relaxed">{resume.profile}</p>
          </section>
        )}

        {resume.workExperience.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
              Work Experience
            </h2>
            <div className="mt-2 space-y-4">
              {resume.workExperience.map((exp, i) => (
                <div key={i}>
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-sm font-medium">
                      {exp.positionTitle} <span className="text-muted-foreground">· {exp.company}</span>
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {exp.from} — {exp.to ?? "Present"}
                    </span>
                  </div>
                  {exp.location && (
                    <p className="text-xs text-muted-foreground">{exp.location}</p>
                  )}
                  {exp.description && (
                    <p className="mt-1 text-sm leading-relaxed">{exp.description}</p>
                  )}
                  {exp.keyAchievements.length > 0 && (
                    <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm leading-relaxed">
                      {exp.keyAchievements.map((a, j) => (
                        <li key={j}>{a}</li>
                      ))}
                    </ul>
                  )}
                  {(exp.techStack.length > 0 || exp.methodologies.length > 0) && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {exp.techStack.length > 0 && (
                        <span>Stack: {exp.techStack.join(", ")}.</span>
                      )}{" "}
                      {exp.methodologies.length > 0 && (
                        <span>Methodologies: {exp.methodologies.join(", ")}.</span>
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {resume.education.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
              Education
            </h2>
            <div className="mt-2 space-y-2">
              {resume.education.map((edu, i) => (
                <div key={i} className="flex items-baseline justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{edu.degree}</p>
                    <p className="text-xs text-muted-foreground">{edu.university}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {edu.from} — {edu.to ?? "Present"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {resume.otherAchievements.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
              Other Achievements
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {resume.otherAchievements.map((a, i) => (
                <li key={i}>
                  {a.name}
                  {a.date && <span className="text-muted-foreground"> — {a.date}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {resume.languages.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
              Languages
            </h2>
            <p className="mt-1 text-sm">
              {resume.languages
                .map((l) => `${l.name} (${l.level})`)
                .join(" · ")}
            </p>
          </section>
        )}
      </section>
    </article>
  )
}