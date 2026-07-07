import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Pencil, Plus, Trash2, AlertTriangle } from "lucide-react"
import { useAlignmentStore } from "@/store/alignment"
import {
  loadSessions,
  createSession,
  deleteSession,
  renameSession,
  generateSessionName,
  setActiveSessionName,
} from "@/lib/storage"
import type { Session } from "@/types/resume"

interface SessionPopoverProps {
  disabled?: boolean
}

export function SessionPopover({ disabled }: SessionPopoverProps) {
  const navigate = useNavigate()
  const { activeSessionName, hydrateFromSession, clearActive } =
    useAlignmentStore()
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [renameError, setRenameError] = useState("")

  const sessions = loadSessions()
  const sessionList = Object.values(sessions).sort((a, b) =>
    (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")
  )
  const activeSession = activeSessionName
    ? sessions[activeSessionName]
    : null

  const handleSelect = (name: string | null) => {
    if (!name) return
    const session = sessions[name]
    if (!session) return
    setActiveSessionName(name)
    hydrateFromSession(session)
    if (session.alignedResume) {
      navigate({ to: "/preview" })
    } else {
      navigate({ to: "/customize" })
    }
  }

  const handleNew = () => {
    const name = generateSessionName()
    const session = createSession(name, "")
    hydrateFromSession(session)
    navigate({ to: "/customize" })
  }

  const handleRenameSubmit = () => {
    if (!activeSessionName) return
    if (!newName.trim()) return
    if (newName === activeSessionName) {
      setRenameOpen(false)
      return
    }
    const ok = renameSession(activeSessionName, newName.trim())
    if (!ok) {
      setRenameError("Name already exists")
      return
    }
    const sessions = loadSessions()
    const updated = sessions[newName.trim()]
    if (updated) hydrateFromSession(updated)
    setRenameOpen(false)
    setNewName("")
    setRenameError("")
  }

  const handleDeleteSubmit = () => {
    if (!activeSessionName) return
    deleteSession(activeSessionName)
    clearActive()
    setDeleteOpen(false)
    const remaining = Object.values(loadSessions())
    if (remaining.length === 0) {
      navigate({ to: "/builder" })
    } else {
      navigate({ to: "/customize" })
    }
  }

  if (disabled) {
    const hasSessions = Object.keys(loadSessions()).length > 0
    return (
      <div className="flex items-center gap-2 opacity-50">
        <Select disabled>
          <SelectTrigger className="w-[180px]">
            <SelectValue
              placeholder={hasSessions ? "No active session" : "First session"}
            />
          </SelectTrigger>
        </Select>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Select
          value={activeSessionName ?? undefined}
          onValueChange={handleSelect}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select session" />
          </SelectTrigger>
          <SelectContent>
            {sessionList.map((s: Session) => (
              <SelectItem key={s.name} value={s.name}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleNew}
          title="New session"
        >
          <Plus className="size-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setNewName(activeSessionName ?? "")
            setRenameError("")
            setRenameOpen(true)
          }}
          disabled={!activeSession}
          title="Rename session"
        >
          <Pencil className="size-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeleteOpen(true)}
          disabled={!activeSession}
          title="Delete session"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename session</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="session-name">Session name</Label>
            <Input
              id="session-name"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value)
                setRenameError("")
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit()
              }}
            />
            {renameError && (
              <Alert variant="destructive">
                <AlertDescription>{renameError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameSubmit}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete session</DialogTitle>
            <DialogDescription>
              <span className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-destructive" />
                Delete "{activeSessionName}"? This cannot be undone.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubmit}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}