import { create } from "zustand"
import type { Note, Resume, Session } from "@/types/resume"

interface AlignmentStore {
  activeSessionName: string | null
  alignedResume: Resume | null
  notes: Note[]
  jobPosting: string
  loading: boolean

  hydrateFromSession: (session: Session) => void
  setAlignment: (
    alignedResume: Resume,
    notes: Note[],
    jobPosting: string
  ) => void
  setJobPosting: (jobPosting: string) => void
  clearActive: () => void
  setLoading: (loading: boolean) => void
}

export const useAlignmentStore = create<AlignmentStore>((set) => ({
  activeSessionName: null,
  alignedResume: null,
  notes: [],
  jobPosting: "",
  loading: false,

  hydrateFromSession: (session) =>
    set({
      activeSessionName: session.name,
      alignedResume: session.alignedResume,
      notes: session.notes,
      jobPosting: session.jobPosting,
    }),

  setAlignment: (alignedResume, notes, jobPosting) =>
    set({ alignedResume, notes, jobPosting }),

  setJobPosting: (jobPosting) => set({ jobPosting }),

  clearActive: () =>
    set({
      activeSessionName: null,
      alignedResume: null,
      notes: [],
      jobPosting: "",
    }),

  setLoading: (loading) => set({ loading }),
}))