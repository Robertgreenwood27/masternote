'use client'

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent, useCallback } from 'react'
import { CommandPalette } from './CommandPalette'
import { PaletteCommand, filterCommands } from './CommandRegistry'

interface NoteInputProps {
  onSubmit: (value: string) => void
  onImagePaste?: (file: File) => void
  onCommand?: (cmd: PaletteCommand) => void
  isLoading?: boolean
  activeModule?: string | null
}

export function NoteInput({
  onSubmit,
  onImagePaste,
  onCommand,
  isLoading,
  activeModule,
}: NoteInputProps) {
  const [value, setValue] = useState('')
  const [pastePreview, setPastePreview] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Palette state
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState('')
  const [paletteIndex, setPaletteIndex] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mobile detection
  useEffect(() => {
    const check = () =>
      setIsMobile(
        window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768
      )
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Palette helpers ──────────────────────────────────────────────

  const openPalette = useCallback((query: string) => {
    setPaletteOpen(true)
    setPaletteQuery(query)
    setPaletteIndex(0)
  }, [])

  const closePalette = useCallback(() => {
    setPaletteOpen(false)
    setPaletteQuery('')
    setPaletteIndex(0)
  }, [])

  const selectCommand = useCallback(
    (cmd: PaletteCommand) => {
      closePalette()
      setValue('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.focus()
      }
      onCommand?.(cmd)
    },
    [closePalette, onCommand]
  )

  // ── Main submit ──────────────────────────────────────────────────

  const submit = useCallback(() => {
    // Image pending
    if (pendingFile && onImagePaste) {
      onImagePaste(pendingFile)
      setPendingFile(null)
      setPastePreview(null)
      return
    }

    const trimmed = value.trim()
    if (!trimmed || isLoading) return

    // If palette is open, select the highlighted item instead of submitting text
    if (paletteOpen) {
      const matches = filterCommands(paletteQuery)
      const cmd = matches[paletteIndex]
      if (cmd) {
        selectCommand(cmd)
        return
      }
    }

    onSubmit(trimmed)
    setValue('')
    closePalette()
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.focus()
    }
  }, [
    pendingFile,
    onImagePaste,
    value,
    isLoading,
    paletteOpen,
    paletteQuery,
    paletteIndex,
    selectCommand,
    onSubmit,
    closePalette,
  ])

  // ── Keyboard handler ─────────────────────────────────────────────

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Palette navigation
    if (paletteOpen) {
      const matches = filterCommands(paletteQuery)
      const max = matches.length

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setPaletteIndex((i) => (i + 1) % max)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setPaletteIndex((i) => (i - 1 + max) % max)
        return
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        // Tab cycles forward
        setPaletteIndex((i) => (i + 1) % max)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        closePalette()
        setValue('')
        return
      }
    }

    // Escape clears pending image paste
    if (e.key === 'Escape' && pendingFile) {
      setPendingFile(null)
      setPastePreview(null)
      return
    }

    // Enter submits
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  // ── Input change — drives palette ────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setValue(v)

    // Auto-resize
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`

    // Open/update palette when input starts with "/"
    if (v.startsWith('/')) {
      const query = v.slice(1) // everything after "/"
      openPalette(query)
    } else {
      if (paletteOpen) closePalette()
    }
  }

  // ── Image paste ──────────────────────────────────────────────────

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
    if (onImagePaste) {
      onImagePaste(file)
    }
    e.target.value = ''
  }

  const cancelPaste = () => {
    setPendingFile(null)
    setPastePreview(null)
    textareaRef.current?.focus()
  }

  const canSubmit = (!!value.trim() || !!pendingFile) && !isLoading

  const placeholder = activeModule
    ? `in ${activeModule} — type a note, or /home to exit`
    : 'type a note… or / for commands'

  return (
    <div className="note-input-wrapper">
      {/* Command palette — rises above the input bar */}
      {paletteOpen && (
        <CommandPalette
          query={paletteQuery}
          selectedIndex={paletteIndex}
          onSelect={selectCommand}
          onChangeIndex={setPaletteIndex}
        />
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

      {/* Hidden file input for mobile image picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div className="note-input-container">
        {/* Mobile image attach button */}
        {onImagePaste && (
          <button
            className="note-attach"
            onClick={() => fileInputRef.current?.click()}
            disabled={!!isLoading}
            aria-label="Attach image"
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

        <button
          className="note-submit"
          onClick={submit}
          disabled={!canSubmit}
          aria-label="Submit"
        >
          {isLoading ? '…' : '↵'}
        </button>
      </div>
    </div>
  )
}