'use client'

import { MasterModule, ModuleProps } from '../types'
import { Note } from '@/types'

function JournalComponent({ notes, onClose }: ModuleProps) {
  const journalNotes = notes.filter((n) => n.type === 'journal')

  return (
    <div className="module-surface journal-module">
      <button className="module-close" onClick={onClose} aria-label="Close">
        ×
      </button>
      <h2 className="module-title">Journal</h2>
      {journalNotes.length === 0 ? (
        <p className="module-empty">
          No journal entries yet. Write below and press{' '}
          <kbd>Ctrl+Shift+↵</kbd> to save as a journal entry.
        </p>
      ) : (
        <div className="journal-entries">
          {journalNotes.map((note: Note) => (
            <div key={note.id} className="journal-entry">
              <span className="entry-date">
                {new Date(note.created_at).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <p className="entry-content">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const JournalModule: MasterModule = {
  name: 'journal',
  keywords: ['journal', 'diary', 'entries', 'log'],
  Component: JournalComponent,
  noteTypes: ['journal'],
  description: 'View your journal entries',
}