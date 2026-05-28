'use client'

import { Note } from '@/types'

interface NotesFeedProps {
  notes: Note[]
  onDelete?: (id: string, note: Note) => void
}

function NoteCard({ note, onDelete }: { note: Note; onDelete?: (id: string, note: Note) => void }) {
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

      {note.type === 'image' ? (
        <img src={note.content} alt="saved" className="note-image" loading="lazy" />
      ) : note.type === 'link' ? (
        <a href={note.content} target="_blank" rel="noopener noreferrer" className="note-link">
          {note.content}
        </a>
      ) : (
        <p className="note-text">{note.content}</p>
      )}
    </div>
  )
}

export function NotesFeed({ notes, onDelete }: NotesFeedProps) {
  if (notes.length === 0) {
    return (
      <div className="feed-empty">
        <p>Nothing saved yet. Start typing.</p>
      </div>
    )
  }

  return (
    <div className="notes-feed">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} onDelete={onDelete} />
      ))}
    </div>
  )
}