'use client'

import { useState, useEffect, useCallback } from 'react'
import { NoteInput } from '@/components/NoteInput'
import { NotesFeed } from '@/components/NotesFeed'
import { ModuleView } from '@/components/ModuleView'
import { AuthPopover } from '@/components/AuthPopover'
import { parseCommand } from '@/components/CommandParser'
import { PaletteCommand } from '@/components/CommandRegistry'
import { saveNote, getNotes, deleteNote, uploadImage } from '@/lib/notes'
import {
  getLocalNotes,
  saveLocalNote,
  deleteLocalNote,
  clearLocalNotes,
} from '@/lib/localNotes'
import { onAuthChange, User } from '@/lib/auth'
import { Note } from '@/types'

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)

  // Subscribe to auth changes
  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      setUser(u)
      setAuthReady(true)

      if (u) {
        const dbNotes = await getNotes()
        setNotes(dbNotes)
      } else {
        setNotes(getLocalNotes())
      }
    })

    return unsub
  }, [])

  // Escape closes the active module from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeModule) {
        setActiveModule(null)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeModule])

  // Migrate guest notes into DB after sign-in
  const handleMigrateGuest = useCallback(async () => {
    const local = getLocalNotes()
    if (local.length === 0) return

    const toMigrate = [...local].reverse()
    for (const n of toMigrate) {
      await saveNote(n.content, n.type, n.metadata)
    }

    clearLocalNotes()
    const dbNotes = await getNotes()
    setNotes(dbNotes)
  }, [])

  // Handle palette command selections
  const handleCommand = useCallback((cmd: PaletteCommand) => {
    switch (cmd.action) {
      case 'module':
        setActiveModule((prev) =>
          prev === cmd.payload ? null : cmd.payload ?? null
        )
        break
      case 'home':
        setActiveModule(null)
        break
      case 'export': {
        // Download notes as JSON
        const blob = new Blob([JSON.stringify(notes, null, 2)], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `masternote-export-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
        break
      }
      default:
        break
    }
  }, [notes])

  // Handle plain text / legacy slash commands typed and submitted directly
  const handleSubmit = useCallback(async (input: string) => {
    const trimmed = input.trim()
    if (!trimmed) return

    const command = parseCommand(trimmed)

    if (command.isCommand) {
      if (command.action === 'home') {
        setActiveModule(null)
      } else if (command.moduleName) {
        setActiveModule((prev) =>
          prev === command.moduleName ? null : command.moduleName!
        )
      }
      return
    }

    setIsLoading(true)

    if (user) {
      const saved = await saveNote(trimmed)
      if (saved) {
        setNotes((prev) => [saved, ...prev])
      }
    } else {
      const saved = saveLocalNote(trimmed)
      setNotes((prev) => [saved, ...prev])
    }

    setIsLoading(false)
  }, [user])

  const handleImagePaste = useCallback(async (file: File) => {
    setIsLoading(true)

    if (user) {
      const url = await uploadImage(file)
      if (url) {
        const saved = await saveNote(url, 'image')
        if (saved) {
          setNotes((prev) => [saved, ...prev])
        }
      }
    } else {
      const url = URL.createObjectURL(file)
      const saved = saveLocalNote(url, 'image')
      setNotes((prev) => [saved, ...prev])
    }

    setIsLoading(false)
  }, [user])

  const handleDelete = useCallback(async (id: string, note: Note) => {
    if (user) {
      const ok = await deleteNote(id, note)
      if (ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id))
      }
    } else {
      deleteLocalNote(id)
      setNotes((prev) => prev.filter((n) => n.id !== id))
    }
  }, [user])

  if (!authReady) return null

  return (
    <main className="page">
      <div className="status-bar">
        <AuthPopover user={user} onMigrateGuest={handleMigrateGuest} />

        <span className="status-app-name">masternote</span>

        {activeModule && (
          <>
            <span>›</span>
            <span className="status-crumb">{activeModule}</span>
          </>
        )}

        {isLoading && <span className="status-loading">saving…</span>}

        {!user && (
          <span className="status-guest-hint">
            notes are local until you sign in
          </span>
        )}
      </div>

      {activeModule && (
        <ModuleView
          activeModule={activeModule}
          notes={notes}
          onClose={() => setActiveModule(null)}
          onDelete={handleDelete}
        />
      )}

      <div className="feed-area" style={activeModule ? { display: 'none' } : undefined}>
        <NotesFeed notes={notes} onDelete={handleDelete} activeModule={activeModule} />
      </div>

      <div className="input-area">
        <NoteInput
          onSubmit={handleSubmit}
          onImagePaste={handleImagePaste}
          onCommand={handleCommand}
          isLoading={isLoading}
          activeModule={activeModule}
        />
      </div>
    </main>
  )
}