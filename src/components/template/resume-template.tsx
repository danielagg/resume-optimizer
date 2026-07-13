import type { Resume } from "@/types/resume"

interface TemplateProps {
  resume: Resume
}

export function ResumeTemplate({ resume }: TemplateProps) {
  return (
    <article className="mx-auto max-w-[820px] overflow-hidden rounded-xl bg-white text-[#18231f] shadow-[0_14px_45px_rgba(20,35,30,0.10)]">
      <div className="h-1.5 bg-[#21766a]" />
      <header className="border-b border-[#dfe7e2] bg-[#f8faf8] px-6 py-7 sm:px-10 sm:py-9">
        <p className="mb-2 font-mono text-[0.58rem] font-semibold tracking-[0.2em] text-[#21766a] uppercase">
          Curriculum vitae
        </p>
        <h1 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
          {resume.fullName}
        </h1>
        <p className="mt-1 text-sm font-medium text-[#53645e]">
          {resume.headline}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.68rem] text-[#61716b]">
          {resume.location && <span>{resume.location}</span>}
          {resume.email && <span>{resume.email}</span>}
          {resume.phone && <span>{resume.phone}</span>}
          {resume.socials.map((s) => (
            <a
              key={s.label}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[#21766a] underline underline-offset-2"
            >
              {s.label}
            </a>
          ))}
        </div>
      </header>

      <section className="space-y-7 px-6 py-7 sm:px-10 sm:py-9">
        {resume.profile && (
          <section>
            <h2 className="font-mono text-[0.62rem] font-semibold tracking-[0.18em] text-[#21766a] uppercase">
              Profile
            </h2>
            <p className="mt-2 text-[0.8rem] leading-6 text-[#34423d]">
              {resume.profile}
            </p>
          </section>
        )}

        {resume.workExperience.length > 0 && (
          <section>
            <h2 className="border-b border-[#dfe7e2] pb-2 font-mono text-[0.62rem] font-semibold tracking-[0.18em] text-[#21766a] uppercase">
              Work Experience
            </h2>
            <div className="mt-4 space-y-5">
              {resume.workExperience.map((exp, i) => (
                <div key={i}>
                  <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline sm:gap-4">
                    <h3 className="text-[0.82rem] font-semibold">
                      {exp.positionTitle}{" "}
                      <span className="font-medium text-[#5d6c67]">
                        · {exp.company}
                      </span>
                    </h3>
                    <span className="shrink-0 font-mono text-[0.62rem] text-[#6b7974]">
                      {exp.from} — {exp.to ?? "Present"}
                    </span>
                  </div>
                  {exp.location && (
                    <p className="mt-0.5 text-[0.68rem] text-[#6b7974]">
                      {exp.location}
                    </p>
                  )}
                  {exp.description && (
                    <p className="mt-2 text-[0.78rem] leading-5 text-[#34423d]">
                      {exp.description}
                    </p>
                  )}
                  {exp.keyAchievements.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-[0.78rem] leading-5 marker:text-[#21766a]">
                      {exp.keyAchievements.map((a, j) => (
                        <li key={j}>{a}</li>
                      ))}
                    </ul>
                  )}
                  {(exp.techStack.length > 0 ||
                    exp.methodologies.length > 0) && (
                    <p className="mt-2 text-[0.67rem] leading-5 text-[#6b7974]">
                      {exp.techStack.length > 0 && (
                        <span>Stack: {exp.techStack.join(", ")}.</span>
                      )}{" "}
                      {exp.methodologies.length > 0 && (
                        <span>
                          Methodologies: {exp.methodologies.join(", ")}.
                        </span>
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
            <h2 className="border-b border-[#dfe7e2] pb-2 font-mono text-[0.62rem] font-semibold tracking-[0.18em] text-[#21766a] uppercase">
              Education
            </h2>
            <div className="mt-2 space-y-2">
              {resume.education.map((edu, i) => (
                <div
                  key={i}
                  className="flex items-baseline justify-between gap-4"
                >
                  <div>
                    <p className="text-[0.8rem] font-semibold">{edu.degree}</p>
                    <p className="text-[0.68rem] text-[#6b7974]">
                      {edu.university}
                    </p>
                  </div>
                  <span className="font-mono text-[0.62rem] text-[#6b7974]">
                    {edu.from} — {edu.to ?? "Present"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {resume.otherAchievements.length > 0 && (
          <section>
            <h2 className="border-b border-[#dfe7e2] pb-2 font-mono text-[0.62rem] font-semibold tracking-[0.18em] text-[#21766a] uppercase">
              Other Achievements
            </h2>
            <ul className="mt-3 list-disc space-y-1 pl-4 text-[0.78rem] leading-5 marker:text-[#21766a]">
              {resume.otherAchievements.map((a, i) => (
                <li key={i}>
                  {a.name}
                  {a.date && (
                    <span className="text-[#6b7974]"> — {a.date}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {resume.languages.length > 0 && (
          <section>
            <h2 className="border-b border-[#dfe7e2] pb-2 font-mono text-[0.62rem] font-semibold tracking-[0.18em] text-[#21766a] uppercase">
              Languages
            </h2>
            <p className="mt-3 text-[0.78rem]">
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
