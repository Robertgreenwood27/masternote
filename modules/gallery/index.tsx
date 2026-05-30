'use client'

import { MasterModule, ModuleProps } from '../types'
import { Note } from '@/types'

interface GalleryProps extends ModuleProps {
  onDelete?: (id: string, note: Note) => void
}

function GalleryComponent({ notes, onClose, onDelete }: GalleryProps) {
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
        <div className="masonry-grid">
          {imageNotes.map((note: Note) => (
            <div key={note.id} className="masonry-item">
              <img
                src={note.content}
                alt={(note.metadata?.caption as string) || 'Saved image'}
                className="masonry-img"
                loading="lazy"
              />
              {onDelete && (
                <button
                  className="masonry-delete"
                  onClick={() => onDelete(note.id, note)}
                  aria-label="Delete image"
                >
                  ×
                </button>
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