'use client'

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent, useCallback } from 'react'
import { createPortal } from 'react-dom'
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
  const [inputAreaBottom, setInputAreaBottom] = useState(0)

  // Palette state
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState('')
  const [paletteIndex, setPaletteIndex] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

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

  // On mobile: track the input area's distance from the bottom of the viewport
  // so the fixed palette can sit right above it, even when the keyboard is open.
  useEffect(() => {
    if (!isMobile) return

    const update = () => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect()
        // Distance from the top of the wrapper to the bottom of the viewport
        setInputAreaBottom(window.innerHeight - rect.top)
      }
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update)
    // visualViewport fires when the software keyboard opens/closes
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update)
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
    }
  }, [isMobile])

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
    if (pendingFile && onImagePaste) {
      onImagePaste(pendingFile)
      setPendingFile(null)
      setPastePreview(null)
      return
    }

    const trimmed = value.trim()
    if (!trimmed || isLoading) return

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
    pendingFile, onImagePaste, value, isLoading,
    paletteOpen, paletteQuery, paletteIndex,
    selectCommand, onSubmit, closePalette,
  ])

  // ── Keyboard handler ─────────────────────────────────────────────

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (paletteOpen) {
      const matches = filterCommands(paletteQuery)
      const max = matches.length

      if (e.key === 'ArrowDown') { e.preventDefault(); setPaletteIndex((i) => (i + 1) % max); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setPaletteIndex((i) => (i - 1 + max) % max); return }
      if (e.key === 'Tab')       { e.preventDefault(); setPaletteIndex((i) => (i + 1) % max); return }
      if (e.key === 'Escape')    { e.preventDefault(); closePalette(); setValue(''); return }
    }

    if (e.key === 'Escape' && pendingFile) {
      setPendingFile(null)
      setPastePreview(null)
      return
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  // ── Input change — drives palette ────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setValue(v)

    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`

    if (v.startsWith('/')) {
      openPalette(v.slice(1))
    } else {
      if (paletteOpen) closePalette()
    }
  }

  // ── Image handling ───────────────────────────────────────────────

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
    if (onImagePaste) onImagePaste(file)
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

  // ── Palette rendering ────────────────────────────────────────────
  // Desktop: absolute, anchored to .note-input-wrapper (rises above)
  // Mobile:  fixed, anchored to visualViewport so keyboard can't hide it

  const palette = paletteOpen ? (
    <CommandPalette
      query={paletteQuery}
      selectedIndex={paletteIndex}
      onSelect={selectCommand}
      onChangeIndex={setPaletteIndex}
      isMobile={isMobile}
      bottomOffset={inputAreaBottom}
    />
  ) : null

  return (
    <div className="note-input-wrapper" ref={wrapperRef}>
      {/* Desktop palette: absolute inside wrapper */}
      {!isMobile && palette}

      {/* Mobile palette: portalled to body so keyboard layout can't clip it */}
      {isMobile && paletteOpen && typeof document !== 'undefined'
        ? createPortal(palette, document.body)
        : null}

      {pastePreview && (
        <div className="paste-preview">
          <img src={pastePreview} alt="paste preview" className="paste-preview-img" />
          <div className="paste-preview-actions">
            <span className="paste-preview-hint">press ↵ to save image</span>
            <button className="paste-cancel" onClick={cancelPaste}>cancel (esc)</button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div className="note-input-container">
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