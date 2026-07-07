import { create } from "zustand"
import type { Note, Resume } from "@/types/resume"

interface AlignmentStore {
  alignedResume: Resume | null
  notes: Note[] | null
  jobPosting: string
  setAlignment: (alignedResume: Resume, notes: Note[], jobPosting: string) => void
  clear: () => void
}

export const useAlignmentStore = create<AlignmentStore>((set) => ({
  alignedResume: null,
  notes: null,
  jobPosting: "",
  setAlignment: (alignedResume, notes, jobPosting) =>
    set({ alignedResume, notes, jobPosting }),
  clear: () =>
    set({ alignedResume: null, notes: null, jobPosting: "" }),
}))