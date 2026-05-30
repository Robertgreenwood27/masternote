'use client'

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react'
import { Note } from '@/types'

interface NoteInputProps {
  onSubmit: (value: string) => void
  onImagePaste?: (file: File) => void
  isLoading?: boolean
  activeModule?: string | null
  notes?: Note[]
}

export function NoteInput({ onSubmit, onImagePaste, isLoading, activeModule, notes = [] }: NoteInputProps) {
  const [value, setValue] = useState('')
  const [pastePreview, setPastePreview] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [selectedSuggestion, setSelectedSuggestion] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── /open autocomplete ──────────────────────────────────────────────
  const openMatch = value.match(/^\/open\s+(\S*)$/i)
  const openQuery = openMatch ? openMatch[1].toLowerCase() : null

  const handleSuggestions: { handle: string; url: string }[] = openQuery !== null
    ? notes
        .filter(
          (n) =>
            n.type === 'link' &&
            typeof n.metadata?.handle === 'string' &&
            (n.metadata.handle as string).startsWith(openQuery)
        )
        .map((n) => ({ handle: n.metadata!.handle as string, url: n.content }))
    : []

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedSuggestion(0)
  }, [handleSuggestions.length, openQuery])

  const applySuggestion = (handle: string) => {
    setValue(`/open ${handle}`)
    textareaRef.current?.focus()
    // Auto-submit immediately
    onSubmit(`/open ${handle}`)
    setValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Navigate suggestions with arrow keys
    if (handleSuggestions.length > 0) {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedSuggestion((i) => (i <= 0 ? handleSuggestions.length - 1 : i - 1))
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedSuggestion((i) => (i >= handleSuggestions.length - 1 ? 0 : i + 1))
        return
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        applySuggestion(handleSuggestions[selectedSuggestion].handle)
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()

      // If suggestions open and user presses Enter, pick the highlighted one
      if (handleSuggestions.length > 0) {
        applySuggestion(handleSuggestions[selectedSuggestion].handle)
        return
      }

      // If there's a pending pasted image, upload it
      if (pendingFile && onImagePaste) {
        onImagePaste(pendingFile)
        setPendingFile(null)
        setPastePreview(null)
        return
      }

      if (value.trim() && !isLoading) {
        onSubmit(value)
        setValue('')
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }
      }
    }

    // Escape clears suggestions or pending image paste
    if (e.key === 'Escape') {
      if (handleSuggestions.length > 0) {
        setValue('')
        return
      }
      if (pendingFile) {
        setPendingFile(null)
        setPastePreview(null)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find((item) => item.type.startsWith('image/'))

    if (imageItem) {
      e.preventDefault()
      const file = imageItem.getAsFile()
      if (!file) return

      setPendingFile(file)

      const reader = new FileReader()
      reader.onload = (ev) => {
        setPastePreview(ev.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const cancelPaste = () => {
    setPendingFile(null)
    setPastePreview(null)
    textareaRef.current?.focus()
  }

  const placeholder = activeModule
    ? `in ${activeModule} — type a note, or /home to exit`
    : 'type a note… or /journal  /gallery  /links  /todo'

  return (
    <div className="note-input-wrapper">
      {/* /open suggestions */}
      {handleSuggestions.length > 0 && (
        <div className="open-suggestions">
          {handleSuggestions.map((s, i) => (
            <button
              key={s.handle}
              className={`open-suggestion-item${i === selectedSuggestion ? ' open-suggestion-item--active' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault() // don't blur textarea
                applySuggestion(s.handle)
              }}
              onMouseEnter={() => setSelectedSuggestion(i)}
            >
              <span className="open-suggestion-handle">/{s.handle}</span>
              <span className="open-suggestion-url">{s.url}</span>
            </button>
          ))}
          <div className="open-suggestions-hint">↑↓ navigate · ↵ or tab to open</div>
        </div>
      )}

      {/* Image paste preview */}
      {pastePreview && (
        <div className="paste-preview">
          <img src={pastePreview} alt="paste preview" className="paste-preview-img" />
          <div className="paste-preview-actions">
            <span className="paste-preview-hint">press ↵ to save image</span>
            <button className="paste-cancel" onClick={cancelPaste}>
              cancel (esc)
            </button>
          </div>
        </div>
      )}

      <div className="note-input-container">
        <textarea
          ref={textareaRef}
          className="note-input"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={pendingFile ? '' : placeholder}
          disabled={isLoading}
          rows={1}
          autoFocus
        />
        <button
          className="note-submit"
          onClick={() => {
            if (handleSuggestions.length > 0) {
              applySuggestion(handleSuggestions[selectedSuggestion].handle)
              return
            }
            if (pendingFile && onImagePaste) {
              onImagePaste(pendingFile)
              setPendingFile(null)
              setPastePreview(null)
              return
            }
            if (value.trim() && !isLoading) {
              onSubmit(value)
              setValue('')
            }
          }}
          disabled={(!value.trim() && !pendingFile) || !!isLoading}
          aria-label="Submit"
        >
          {isLoading ? '…' : '↵'}
        </button>
      </div>
    </div>
  )
}