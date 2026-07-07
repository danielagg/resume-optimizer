import { useEffect, useMemo, useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Plus } from "lucide-react"
import { StepIndicator } from "@/components/shared/step-indicator"
import { ResumeTemplate } from "@/components/template/resume-template"
import { downloadResumePdf } from "@/components/template/download-pdf"
import { loadOriginalResume, saveOriginalResume } from "@/lib/storage"
import {
  emptyResume,
  languageLevels,
  resumeSchema,
  type LanguageLevel,
  type Resume,
} from "@/types/resume"

export const Route = createFileRoute("/builder")({
  component: BuilderPage,
})

const STEPS = [
  { label: "Builder" },
  { label: "Customize" },
  { label: "Preview" },
]

function BuilderPage() {
  const navigate = useNavigate()
  const [resume, setResume] = useState<Resume>(() => loadOriginalResume() ?? emptyResume())
  const [submitted, setSubmitted] = useState(false)

  const errors = useMemo<Record<string, string>>(() => {
    if (!submitted) return {}
    const result = resumeSchema.safeParse(resume)
    if (!result.success) {
      const flat: Record<string, string> = {}
      for (const issue of result.error.issues) {
        flat[issue.path.join(".")] = issue.message
      }
      return flat
    }
    return {}
  }, [resume, submitted])

  useEffect(() => {
    saveOriginalResume(resume)
  }, [resume])

  const update = <K extends keyof Resume>(key: K, value: Resume[K]) => {
    setResume((r) => ({ ...r, [key]: value }))
  }

  const handleSubmit = () => {
    setSubmitted(true)
    const result = resumeSchema.safeParse(resume)
    if (!result.success) {
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    saveOriginalResume(resume)
    navigate({ to: "/customize" })
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex justify-center">
        <StepIndicator steps={STEPS} currentIndex={0} />
      </div>

      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Please fix the highlighted fields before continuing.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" error={errors["fullName"]}>
              <Input
                value={resume.fullName}
                onChange={(e) => update("fullName", e.target.value)}
              />
            </Field>
            <Field label="Headline" error={errors["headline"]}>
              <Input
                value={resume.headline}
                onChange={(e) => update("headline", e.target.value)}
              />
            </Field>
            <Field label="Location">
              <Input
                value={resume.location}
                onChange={(e) => update("location", e.target.value)}
              />
            </Field>
            <Field label="Email" error={errors["email"]}>
              <Input
                type="email"
                value={resume.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </Field>
            <Field label="Phone (optional)">
              <Input
                value={resume.phone ?? ""}
                onChange={(e) => update("phone", e.target.value || null)}
              />
            </Field>
            <div className="sm:col-span-2">
              <SocialsEditor
                socials={resume.socials}
                onChange={(socials) => update("socials", socials)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <Field label="Short description of who you are" error={errors["profile"]}>
              <Textarea
                rows={4}
                value={resume.profile}
                onChange={(e) => update("profile", e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>

        <WorkExperienceEditor
          workExperience={resume.workExperience}
          onChange={(workExperience) => update("workExperience", workExperience)}
          errorPrefix="workExperience"
        />

        <Card>
          <CardHeader>
            <CardTitle>Education (optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <EducationEditor
              education={resume.education}
              onChange={(education) => update("education", education)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Other achievements (optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <AchievementsEditor
              achievements={resume.otherAchievements}
              onChange={(otherAchievements) =>
                update("otherAchievements", otherAchievements)
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Languages (optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <LanguagesEditor
              languages={resume.languages}
              onChange={(languages) => update("languages", languages)}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              downloadResumePdf(resume, resume.fullName || "resume")
            }
          >
            Download CV
          </Button>
          <Button type="button" size="lg" onClick={handleSubmit}>
            Continue to Customize →
          </Button>
        </div>
      </div>

      <div className="mt-16 border-t border-border/50 pt-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border/30" />
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground">
            Live preview
          </h2>
          <div className="h-px flex-1 bg-border/30" />
        </div>
        <ResumeTemplate resume={resume} />
      </div>
    </main>
  )
}

/* ---- small reusable field wrapper ---- */

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

/* ---- socials ---- */

function SocialsEditor({
  socials,
  onChange,
}: {
  socials: Resume["socials"]
  onChange: (next: Resume["socials"]) => void
}) {
  return (
    <div className="space-y-2">
      <Label>Socials</Label>
      {socials.map((s, i) => (
        <div key={i} className="flex gap-2">
          <Input
            placeholder="Label (e.g. LinkedIn)"
            value={s.label}
            onChange={(e) => {
              const next = [...socials]
              next[i] = { ...s, label: e.target.value }
              onChange(next)
            }}
          />
          <Input
            placeholder="URL"
            value={s.url}
            onChange={(e) => {
              const next = [...socials]
              next[i] = { ...s, url: e.target.value }
              onChange(next)
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(socials.filter((_, j) => j !== i))}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...socials, { label: "", url: "" }])}
      >
        <Plus className="mr-1 size-3" /> Add social
      </Button>
    </div>
  )
}

/* ---- work experience ---- */

function WorkExperienceEditor({
  workExperience,
  onChange,
}: {
  workExperience: Resume["workExperience"]
  onChange: (next: Resume["workExperience"]) => void
  errorPrefix?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Work experience</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {workExperience.map((exp, i) => (
          <div key={i} className="rounded-md border p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium">Experience {i + 1}</h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={workExperience.length <= 1}
                onClick={() => onChange(workExperience.filter((_, j) => j !== i))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Position title">
                <Input
                  value={exp.positionTitle}
                  onChange={(e) => {
                    const next = [...workExperience]
                    next[i] = { ...exp, positionTitle: e.target.value }
                    onChange(next)
                  }}
                />
              </Field>
              <Field label="Company">
                <Input
                  value={exp.company}
                  onChange={(e) => {
                    const next = [...workExperience]
                    next[i] = { ...exp, company: e.target.value }
                    onChange(next)
                  }}
                />
              </Field>
              <Field label="Location">
                <Input
                  value={exp.location}
                  onChange={(e) => {
                    const next = [...workExperience]
                    next[i] = { ...exp, location: e.target.value }
                    onChange(next)
                  }}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="From">
                  <Input
                    placeholder="e.g. Jan 2022"
                    value={exp.from}
                    onChange={(e) => {
                      const next = [...workExperience]
                      next[i] = { ...exp, from: e.target.value }
                      onChange(next)
                    }}
                  />
                </Field>
                <Field label="To">
                  <Input
                    placeholder="Present"
                    value={exp.to ?? ""}
                    onChange={(e) => {
                      const next = [...workExperience]
                      next[i] = { ...exp, to: e.target.value || null }
                      onChange(next)
                    }}
                  />
                </Field>
              </div>
            </div>

            <div className="mt-4">
              <Field label="Short description">
                <Textarea
                  rows={2}
                  value={exp.description}
                  onChange={(e) => {
                    const next = [...workExperience]
                    next[i] = { ...exp, description: e.target.value }
                    onChange(next)
                  }}
                />
              </Field>
            </div>

            <div className="mt-4 space-y-3">
              <StringListEditor
                label="Key achievements"
                placeholder="e.g. Reduced infra cost by 40%"
                items={exp.keyAchievements}
                onChange={(keyAchievements) => {
                  const next = [...workExperience]
                  next[i] = { ...exp, keyAchievements }
                  onChange(next)
                }}
              />
              <StringListEditor
                label="Tech stack"
                placeholder="e.g. React"
                items={exp.techStack}
                onChange={(techStack) => {
                  const next = [...workExperience]
                  next[i] = { ...exp, techStack }
                  onChange(next)
                }}
              />
              <StringListEditor
                label="Methodologies"
                placeholder="e.g. Scrum"
                items={exp.methodologies}
                onChange={(methodologies) => {
                  const next = [...workExperience]
                  next[i] = { ...exp, methodologies }
                  onChange(next)
                }}
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange([
              ...workExperience,
              {
                positionTitle: "",
                company: "",
                location: "",
                from: "",
                to: null,
                description: "",
                keyAchievements: [],
                techStack: [],
                methodologies: [],
              },
            ])
          }
        >
          <Plus className="mr-1 size-3" /> Add work experience
        </Button>
      </CardContent>
    </Card>
  )
}

function StringListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string
  items: string[]
  onChange: (next: string[]) => void
  placeholder: string
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="space-y-2">
        {items.map((val, i) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder={placeholder}
              value={val}
              onChange={(e) => {
                const next = [...items]
                next[i] = e.target.value
                onChange(next)
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...items, ""])}
        >
          <Plus className="mr-1 size-3" /> Add
        </Button>
      </div>
    </div>
  )
}

/* ---- education ---- */

function EducationEditor({
  education,
  onChange,
}: {
  education: Resume["education"]
  onChange: (next: Resume["education"]) => void
}) {
  return (
    <div className="space-y-4">
      {education.map((edu, i) => (
        <div key={i} className="rounded-md border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">Education {i + 1}</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange(education.filter((_, j) => j !== i))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Degree">
              <Input
                placeholder="e.g. BSc in Business IT"
                value={edu.degree}
                onChange={(e) => {
                  const next = [...education]
                  next[i] = { ...edu, degree: e.target.value }
                  onChange(next)
                }}
              />
            </Field>
            <Field label="University">
              <Input
                value={edu.university}
                onChange={(e) => {
                  const next = [...education]
                  next[i] = { ...edu, university: e.target.value }
                  onChange(next)
                }}
              />
            </Field>
            <Field label="From">
              <Input
                placeholder="e.g. 2018"
                value={edu.from}
                onChange={(e) => {
                  const next = [...education]
                  next[i] = { ...edu, from: e.target.value }
                  onChange(next)
                }}
              />
            </Field>
            <Field label="To">
              <Input
                placeholder="Present"
                value={edu.to ?? ""}
                onChange={(e) => {
                  const next = [...education]
                  next[i] = { ...edu, to: e.target.value || null }
                  onChange(next)
                }}
              />
            </Field>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange([...education, { degree: "", university: "", from: "", to: null }])
        }
      >
        <Plus className="mr-1 size-3" /> Add education
      </Button>
    </div>
  )
}

/* ---- achievements ---- */

function AchievementsEditor({
  achievements,
  onChange,
}: {
  achievements: Resume["otherAchievements"]
  onChange: (next: Resume["otherAchievements"]) => void
}) {
  return (
    <div className="space-y-4">
      {achievements.map((a, i) => (
        <div key={i} className="flex items-end gap-2">
          <Field label="Name">
            <Input
              value={a.name}
              onChange={(e) => {
                const next = [...achievements]
                next[i] = { ...a, name: e.target.value }
                onChange(next)
              }}
            />
          </Field>
          <Field label="Date (optional)">
            <Input
              placeholder="e.g. 2022"
              value={a.date ?? ""}
              onChange={(e) => {
                const next = [...achievements]
                next[i] = { ...a, date: e.target.value || null }
                onChange(next)
              }}
            />
          </Field>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(achievements.filter((_, j) => j !== i))}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...achievements, { name: "", date: null }])}
      >
        <Plus className="mr-1 size-3" /> Add achievement
      </Button>
    </div>
  )
}

/* ---- languages ---- */

function LanguagesEditor({
  languages,
  onChange,
}: {
  languages: Resume["languages"]
  onChange: (next: Resume["languages"]) => void
}) {
  return (
    <div className="space-y-4">
      {languages.map((l, i) => (
        <div key={i} className="flex items-end gap-2">
          <Field label="Language">
            <Input
              value={l.name}
              onChange={(e) => {
                const next = [...languages]
                next[i] = { ...l, name: e.target.value }
                onChange(next)
              }}
            />
          </Field>
          <div className="flex-1 space-y-1.5">
            <Label>Level</Label>
            <Select
              value={l.level}
              onValueChange={(v) => {
                const next = [...languages]
                next[i] = { ...l, level: v as LanguageLevel }
                onChange(next)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languageLevels.map((lvl) => (
                  <SelectItem key={lvl} value={lvl}>
                    {lvl}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(languages.filter((_, j) => j !== i))}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...languages, { name: "", level: "Basic" }])}
      >
        <Plus className="mr-1 size-3" /> Add language
      </Button>
    </div>
  )
}