'use client'

import { MasterModule, ModuleProps } from '../types'
import { Note } from '@/types'

interface GalleryProps extends ModuleProps {
  onDelete?: (id: string, note: Note) => void
}

function GalleryComponent({ notes, onClose, onDelete }: GalleryProps) {
  const imageNotes = notes.filter((n) => n.type === 'image')

  const cols: Note[][] = [[], [], []]
  imageNotes.forEach((note, i) => cols[i % 3].push(note))

  return (
    <div style={{
      position: 'relative',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface)',
    }}>
      <button className="module-close" onClick={onClose} aria-label="Close">×</button>
      <h2 className="module-title" style={{ padding: '1.25rem 2rem 0.75rem', marginBottom: 0, flexShrink: 0 }}>
        Gallery
      </h2>

      {imageNotes.length === 0 ? (
        <p className="module-empty" style={{ padding: '0 2rem' }}>
          No images yet. Paste an image to save it.
        </p>
      ) : (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          gap: '6px',
          padding: '0 8px 8px',
          alignItems: 'flex-start',
        }}>
          {cols.map((col, ci) => (
            <div key={ci} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {col.map((note) => (
                <div
                  key={note.id}
                  style={{ position: 'relative', borderRadius: '2px', overflow: 'hidden', background: 'var(--border)' }}
                  className="gallery-item"
                >
                  <img
                    src={note.content}
                    alt={(note.metadata?.caption as string) || 'Saved image'}
                    style={{ width: '100%', height: 'auto', display: 'block', filter: 'grayscale(10%)' }}
                    loading="lazy"
                  />
                  {onDelete && (
                    <button
                      onClick={() => onDelete(note.id, note)}
                      aria-label="Delete image"
                      className="masonry-delete"
                    />
                  )}
                  {typeof note.metadata?.caption === 'string' && note.metadata.caption && (
                    <span className="gallery-caption">{note.metadata.caption}</span>
                  )}
                </div>
              ))}
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