import { z } from "zod"

export const languageLevels = ["Basic", "Advanced", "Fluent", "Native"] as const
export type LanguageLevel = (typeof languageLevels)[number]

export const socialSchema = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
})
export type Social = z.infer<typeof socialSchema>

export const workExperienceSchema = z.object({
  positionTitle: z.string().min(1),
  company: z.string().min(1),
  location: z.string().min(1),
  from: z.string().min(1),
  to: z.string().nullable(),
  description: z.string().min(1),
  keyAchievements: z.array(z.string()).default([]),
  techStack: z.array(z.string()).default([]),
  methodologies: z.array(z.string()).default([]),
})
export type WorkExperience = z.infer<typeof workExperienceSchema>

export const educationSchema = z.object({
  degree: z.string().min(1),
  university: z.string().min(1),
  from: z.string().min(1),
  to: z.string().nullable(),
})
export type Education = z.infer<typeof educationSchema>

export const otherAchievementSchema = z.object({
  name: z.string().min(1),
  date: z.string().nullable(),
})
export type OtherAchievement = z.infer<typeof otherAchievementSchema>

export const languageSchema = z.object({
  name: z.string().min(1),
  level: z.enum(languageLevels),
})
export type Language = z.infer<typeof languageSchema>

export const resumeSchema = z.object({
  fullName: z.string().min(1),
  headline: z.string().min(1),
  location: z.string().min(1),
  email: z.email(),
  phone: z.string().nullable(),
  profile: z.string().min(1),
  socials: z.array(socialSchema).default([]),
  workExperience: z.array(workExperienceSchema).min(1),
  education: z.array(educationSchema).default([]),
  otherAchievements: z.array(otherAchievementSchema).default([]),
  languages: z.array(languageSchema).default([]),
})
export type Resume = z.infer<typeof resumeSchema>

export const severities = [
  "Critical",
  "Important",
  "Medium",
  "Low",
  "Info",
] as const
export type Severity = (typeof severities)[number]

export const noteSchema = z.object({
  severity: z.enum(severities),
  text: z.string().min(1),
  suggestedFix: z.string().optional(),
})
export type Note = z.infer<typeof noteSchema>

export const alignmentResponseSchema = z.object({
  alignedResume: resumeSchema,
  notes: z.array(noteSchema),
})
export type AlignmentResponse = z.infer<typeof alignmentResponseSchema>

export interface Session {
  name: string
  jobPosting: string
  alignedResume: Resume | null
  notes: Note[]
  createdAt: string
  updatedAt: string
}

export function emptyResume(): Resume {
  return {
    fullName: "",
    headline: "",
    location: "",
    email: "",
    phone: null,
    profile: "",
    socials: [],
    workExperience: [
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
    ],
    education: [],
    otherAchievements: [],
    languages: [],
  }
}
