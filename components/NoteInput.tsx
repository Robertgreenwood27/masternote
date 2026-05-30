'use client'

import { useState, useRef, KeyboardEvent, ClipboardEvent } from 'react'

interface NoteInputProps {
  onSubmit: (value: string) => void
  onImagePaste?: (file: File) => void
  isLoading?: boolean
  activeModule?: string | null
}

export function NoteInput({ onSubmit, onImagePaste, isLoading, activeModule }: NoteInputProps) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [pastePreview, setPastePreview] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const charCount = value.length
  const charClass =
    charCount > 240 ? 'danger' : charCount > 180 ? 'warn' : ''

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()

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

    if (e.key === 'Escape' && pendingFile) {
      setPendingFile(null)
      setPastePreview(null)
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
      reader.onload = (ev) => setPastePreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const cancelPaste = () => {
    setPendingFile(null)
    setPastePreview(null)
    textareaRef.current?.focus()
  }

  const handleSubmit = () => {
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

  const placeholder = activeModule
    ? `in ${activeModule} — type a note, or /home to exit`
    : 'type a note… or /journal  /gallery  /links  /todo'

  return (
    <div className="note-input-wrapper">
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

      <div className={`note-input-container${focused ? ' focused' : ''}`}>
        <textarea
          ref={textareaRef}
          className="note-input"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={pendingFile ? '' : placeholder}
          disabled={isLoading}
          rows={1}
          autoFocus
        />
        <button
          className="note-submit"
          onClick={handleSubmit}
          disabled={(!value.trim() && !pendingFile) || !!isLoading}
          aria-label="Submit"
        >
          {isLoading ? '…' : '↵'}
        </button>
      </div>

      <div className="input-meta-row">
        <div className="input-shortcuts">
          <span className="input-shortcut"><kbd>↵</kbd> save</span>
          <span className="input-shortcut"><kbd>shift ↵</kbd> newline</span>
          <span className="input-shortcut"><kbd>esc</kbd> home</span>
        </div>
        {value.length > 0 && (
          <span className={`input-char-count${charClass ? ` ${charClass}` : ''}`}>
            {charCount}
          </span>
        )}
      </div>
    </div>
  )
}