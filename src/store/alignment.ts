import { create } from "zustand"
import type { Resume } from "@/types/resume"

interface AlignmentStore {
  alignedResume: Resume | null
  notes: string | null
  setAlignment: (alignedResume: Resume, notes: string) => void
  clear: () => void
}

export const useAlignmentStore = create<AlignmentStore>((set) => ({
  alignedResume: null,
  notes: null,
  setAlignment: (alignedResume, notes) => set({ alignedResume, notes }),
  clear: () => set({ alignedResume: null, notes: null }),
}))