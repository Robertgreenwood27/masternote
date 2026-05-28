'use client'

import { MasterModule, ModuleProps } from '../types'
import { Note } from '@/types'

function LinksComponent({ notes, onClose }: ModuleProps) {
  const linkNotes = notes.filter((n) => n.type === 'link')

  return (
    <div className="module-surface links-module">
      <button className="module-close" onClick={onClose} aria-label="Close">
        ×
      </button>
      <h2 className="module-title">Links</h2>
      {linkNotes.length === 0 ? (
        <p className="module-empty">
          No links saved yet. Paste a URL into the input to bookmark it.
        </p>
      ) : (
        <div className="links-list">
          {linkNotes.map((note: Note) => (
            <a
              key={note.id}
              href={note.content}
              target="_blank"
              rel="noopener noreferrer"
              className="link-item"
            >
              <span className="link-domain">
                {new URL(note.content).hostname}
              </span>
              <span className="link-url">{note.content}</span>
              <span className="link-date">
                {new Date(note.created_at).toLocaleDateString()}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export const LinksModule: MasterModule = {
  name: 'links',
  keywords: ['links', 'bookmarks', 'urls', 'saved', 'web'],
  Component: LinksComponent,
  noteTypes: ['link'],
  description: 'Browse saved links',
}
