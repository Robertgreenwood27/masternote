'use client'

import { useState, useEffect, useCallback } from 'react'
import { NoteInput } from '@/components/NoteInput'
import { NotesFeed } from '@/components/NotesFeed'
import { ModuleView } from '@/components/ModuleView'
import { parseCommand } from '@/components/CommandParser'
import { saveNote, getNotes, deleteNote, uploadImage } from '@/lib/notes'
import { Note } from '@/types'

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    getNotes().then(setNotes)
  }, [])

  const handleSubmit = useCallback(async (input: string) => {
    const trimmed = input.trim()
    if (!trimmed) return

    const command = parseCommand(trimmed)

    if (command.isCommand && command.moduleName) {
      setActiveModule((prev) =>
        prev === command.moduleName ? null : command.moduleName!
      )
      return
    }

    setIsLoading(true)
    const saved = await saveNote(trimmed)
    if (saved) setNotes((prev) => [saved, ...prev])
    setIsLoading(false)
  }, [])

  const handleImagePaste = useCallback(async (file: File) => {
    setIsLoading(true)
    const url = await uploadImage(file)
    if (url) {
      const saved = await saveNote(url, 'image')
      if (saved) setNotes((prev) => [saved, ...prev])
    }
    setIsLoading(false)
  }, [])

  const handleDelete = useCallback(async (id: string, note: Note) => {
    const ok = await deleteNote(id, note)
    if (ok) setNotes((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return (
    <main className="page">
      <div className="status-bar">
        <span>masternote</span>
        {activeModule && (
          <>
            <span>›</span>
            <span className="status-crumb">{activeModule}</span>
          </>
        )}
        {isLoading && <span className="status-loading">saving…</span>}
      </div>

      {activeModule && (
        <ModuleView
          activeModule={activeModule}
          notes={notes}
          onClose={() => setActiveModule(null)}
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