'use client'

import { MasterModule, ModuleProps } from '../types'
import { Note } from '@/types'

function GalleryComponent({ notes, onClose, onDelete }: ModuleProps & { onDelete?: (id: string, note: Note) => void }) {
  const imageNotes = notes.filter((n) => n.type === 'image')

  return (
    <div className="module-surface gallery-module">
      <button className="module-close" onClick={onClose} aria-label="Close">
        ×
      </button>
      <h2 className="module-title">Gallery</h2>
      {imageNotes.length === 0 ? (
        <p className="module-empty">
          No images yet. Paste an image into the input to save it.
        </p>
      ) : (
        <div className="gallery-grid">
          {imageNotes.map((note: Note) => (
            <div key={note.id} className="gallery-item">
              <img
                src={note.content}
                alt={(note.metadata?.caption as string) || 'Saved image'}
                className="gallery-img"
                loading="lazy"
              />
              {onDelete && (
                <button
                  className="gallery-delete"
                  onClick={() => onDelete(note.id, note)}
                  aria-label="Delete image"
                >
                  ×
                </button>
              )}
              {typeof note.metadata?.caption === 'string' && note.metadata.caption.trim() !== '' && (
                <span className="gallery-caption">
                  {note.metadata.caption}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const GalleryModule: MasterModule = {
  name: 'gallery',
  keywords: ['gallery', 'photos', 'images', 'pics', 'pictures'],
  Component: GalleryComponent,
  noteTypes: ['image'],
  description: 'Browse saved images',
}