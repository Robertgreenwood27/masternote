'use client'

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react'

interface NoteInputProps {
  onSubmit: (value: string) => void
  onImagePaste?: (file: File) => void
  isLoading?: boolean
  activeModule?: string | null
}

export function NoteInput({ onSubmit, onImagePaste, isLoading, activeModule }: NoteInputProps) {
  const [value, setValue] = useState('')
  const [pastePreview, setPastePreview] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Detect mobile on mount + resize
  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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
        if (textareaRef.current) textareaRef.current.style.height = 'auto'
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPastePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    // Reset so the same file can be picked again
    e.target.value = ''
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
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
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

  const canSubmit = (!!value.trim() || !!pendingFile) && !isLoading

  return (
    <div className="note-input-wrapper">
      {pastePreview && (
        <div className="paste-preview">
          <img src={pastePreview} alt="paste preview" className="paste-preview-img" />
          <div className="paste-preview-actions">
            <span className="paste-preview-hint">press ↵ to save image</span>
            <button className="paste-cancel" onClick={cancelPaste}>cancel (esc)</button>
          </div>
        </div>
      )}

      {/* Hidden file input — accepts images, opens camera on mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div className={`note-input-container${isMobile ? ' note-input-container--mobile' : ''}`}>
        {/* Mobile-only: add image / camera button */}
        {isMobile && (
          <button
            className="note-media-btn"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Add image or take photo"
            disabled={!!isLoading}
          >
            +
          </button>
        )}

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
          autoFocus={!isMobile}
        />

        {/* Submit button — always visible on mobile, hover-only on desktop */}
        <button
          className={`note-submit${isMobile ? ' note-submit--mobile' : ''}`}
          onClick={handleSubmit}
          disabled={!canSubmit}
          aria-label="Submit"
        >
          {isLoading ? '…' : '↵'}
        </button>
      </div>
    </div>
  )
}