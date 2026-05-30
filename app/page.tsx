'use client'

import { useState, useEffect, useCallback } from 'react'
import { NoteInput } from '@/components/NoteInput'
import { NotesFeed } from '@/components/NotesFeed'
import { ModuleView } from '@/components/ModuleView'
import { AuthPopover } from '@/components/AuthPopover'
import { parseCommand } from '@/components/CommandParser'
import { saveNote, getNotes, deleteNote, uploadImage } from '@/lib/notes'
import {
  getLocalNotes,
  saveLocalNote,
  deleteLocalNote,
  clearLocalNotes,
} from '@/lib/localNotes'
import { onAuthChange, User } from '@/lib/auth'
import { Note, NoteType } from '@/types'

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeModule) {
        setActiveModule(null)
        setSearchQuery(undefined)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeModule])

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

  const handleSubmit = useCallback(async (input: string, forceType?: 'journal') => {
    const trimmed = input.trim()
    if (!trimmed) return

    const command = parseCommand(trimmed)

    if (command.isCommand) {
      if (command.action === 'home') {
        setActiveModule(null)
        setSearchQuery(undefined)
      } else if (command.action === 'search') {
        setSearchQuery(command.searchQuery)
        setActiveModule('search')
      } else if (command.moduleName) {
        setActiveModule((prev) =>
          prev === command.moduleName ? null : command.moduleName!
        )
        setSearchQuery(undefined)
      }
      return
    }

    setIsLoading(true)

    if (user) {
      const saved = await saveNote(trimmed, forceType)
      if (saved) setNotes((prev) => [saved, ...prev])
    } else {
      const saved = saveLocalNote(trimmed, forceType)
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
        if (saved) setNotes((prev) => [saved, ...prev])
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
      if (ok) setNotes((prev) => prev.filter((n) => n.id !== id))
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
            <span className="status-crumb">
              {activeModule === 'search' && searchQuery
                ? `search: ${searchQuery}`
                : activeModule}
            </span>
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
          searchQuery={searchQuery}
          onClose={() => {
            setActiveModule(null)
            setSearchQuery(undefined)
          }}
        />
      )}

      <div className="feed-area">
        <NotesFeed notes={notes} onDelete={handleDelete} />
      </div>

      <div className="input-area">
        <NoteInput
          onSubmit={handleSubmit}
          onImagePaste={handleImagePaste}
          isLoading={isLoading}
          activeModule={activeModule}
        />
      </div>
    </main>
  )
}