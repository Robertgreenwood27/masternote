'use client'

import { Note } from '@/types'

interface NotesFeedProps {
  notes: Note[]
  onDelete?: (id: string, note: Note) => void
  activeModule: string | null
}

function NoteCard({
  note,
  onDelete,
}: {
  note: Note
  onDelete?: (id: string, note: Note) => void
}) {
  const date = new Date(note.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`note-card note-type-${note.type}`} data-type={note.type}>
      <div className="note-meta">
        <span className="note-type-badge">{note.type}</span>
        <span className="note-date">{date}</span>

        {onDelete && (
          <button
            className="note-delete"
            onClick={() => onDelete(note.id, note)}
            aria-label="Delete note"
          >
            ×
          </button>
        )}
      </div>

      {note.type === 'link' ? (
        <a
          href={note.content}
          target="_blank"
          rel="noopener noreferrer"
          className="note-link"
        >
          {note.content}
        </a>
      ) : (
        <p className="note-text">{note.content}</p>
      )}
    </div>
  )
}

const MODULE_TYPE_MAP: Record<string, string[]> = {
  journal: ['journal'],
  links: ['link'],
  // gallery intentionally omitted — images live in the gallery module, not the feed
  // 'all' and 'todo' intentionally omitted — all shows non-image notes, todo has no notes
}

export function NotesFeed({ notes, onDelete, activeModule }: NotesFeedProps) {
  // Blank slate at home
  if (!activeModule) {
    return (
      <div className="feed-empty">
        <p>
          type <kbd>/journal</kbd>, <kbd>/gallery</kbd>, <kbd>/links</kbd>, or{' '}
          <kbd>/todo</kbd> — or <kbd>*</kbd> for everything
        </p>
      </div>
    )
  }

// todo module has no notes feed
if (activeModule === 'todo' || activeModule === 'gallery') {
  return null
}

  // Images are excluded from the bottom feed because /gallery is their dedicated home
  const nonImageNotes = notes.filter((n) => n.type !== 'image')

  const allowedTypes = MODULE_TYPE_MAP[activeModule]

  const filtered = allowedTypes
    ? nonImageNotes.filter((n) => allowedTypes.includes(n.type))
    : nonImageNotes // 'all' and 'gallery' fall here — but images are still excluded

  if (filtered.length === 0) {
    return (
      <div className="feed-empty">
        <p>
          Nothing saved yet.
          <br />
          Start typing below.
        </p>
      </div>
    )
  }

  return (
    <div className="notes-feed">
      {filtered.map((note) => (
        <NoteCard key={note.id} note={note} onDelete={onDelete} />
      ))}
    </div>
  )
}