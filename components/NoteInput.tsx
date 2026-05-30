'use client'

import { useState, useRef, KeyboardEvent, ClipboardEvent } from 'react'

interface NoteInputProps {
  onSubmit: (value: string, forceType?: 'journal') => void
  onImagePaste?: (file: File) => void
  isLoading?: boolean
  activeModule?: string | null
}

export function NoteInput({ onSubmit, onImagePaste, isLoading, activeModule }: NoteInputProps) {
  const [value, setValue] = useState('')
  const [pastePreview, setPastePreview] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const submit = (forceType?: 'journal') => {
    if (pendingFile && onImagePaste) {
      onImagePaste(pendingFile)
      setPendingFile(null)
      setPastePreview(null)
      return
    }
    if (value.trim() && !isLoading) {
      onSubmit(value, forceType)
      setValue('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      // Ctrl+Shift+Enter → save as journal
      if (e.ctrlKey && e.shiftKey) {
        e.preventDefault()
        submit('journal')
        return
      }
      // Ctrl+Enter → save as note (auto-detected type)
      if (e.ctrlKey && !e.shiftKey) {
        e.preventDefault()
        submit()
        return
      }
      // Plain Enter or Shift+Enter → newline (default textarea behavior)
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

  const placeholder = activeModule === 'search'
    ? '/search another term, or /home to exit'
    : 'ctrl+↵ save note · ctrl+shift+↵ save journal · enter for newline'

  return (
    <div className="note-input-wrapper">
      {pastePreview && (
        <div className="paste-preview">
          <img src={pastePreview} alt="paste preview" className="paste-preview-img" />
          <div className="paste-preview-actions">
            <span className="paste-preview-hint">ctrl+↵ to save image</span>
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
          onClick={() => submit()}
          disabled={(!value.trim() && !pendingFile) || !!isLoading}
          aria-label="Submit"
        >
          {isLoading ? '…' : '↵'}
        </button>
      </div>
    </div>
  )
}