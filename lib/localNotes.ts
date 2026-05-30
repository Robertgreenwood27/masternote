import { Note, NoteType } from '@/types'
import { detectNoteType } from './notes'

const STORAGE_KEY = 'masternote_guest_notes'

export function getLocalNotes(): Note[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown[] = JSON.parse(raw)
    return parsed.map((n) => {
      const item = n as Record<string, unknown>
      const type = (item.type as string) === 'text' ? 'journal' : (item.type as string)
      return {
        ...item,
        type: type as NoteType,
      } as Note
    })
  } catch {
    return []
  }
}

export function saveLocalNote(
  content: string,
  type?: NoteType,
  metadata?: Record<string, unknown>
): Note {
  const note: Note = {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    content,
    type: type ?? detectNoteType(content),
    metadata: metadata ?? {},
    created_at: new Date().toISOString(),
  }
  const notes = getLocalNotes()
  const updated = [note, ...notes]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return note
}

export function deleteLocalNote(id: string): boolean {
  const notes = getLocalNotes()
  const updated = notes.filter((n) => n.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return true
}

export function clearLocalNotes(): void {
  localStorage.removeItem(STORAGE_KEY)
}