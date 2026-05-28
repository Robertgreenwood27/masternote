'use client'

import { MasterModule, ModuleProps } from '../types'
import { Note } from '@/types'

function GalleryComponent({ notes, onClose }: ModuleProps) {
  const imageNotes = notes.filter((n) => n.type === 'image')

  return (
    <div className="module-surface gallery-module">
      <button className="module-close" onClick={onClose} aria-label="Close">
        ×
      </button>
      <h2 className="module-title">Gallery</h2>
      {imageNotes.length === 0 ? (
        <p className="module-empty">
          No images yet. Paste an image URL into the input to save it.
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
              {note.metadata?.caption && (
                <span className="gallery-caption">
                  {note.metadata.caption as string}
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
