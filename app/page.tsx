'use client'

import { useState, useEffect, useCallback } from 'react'
import { NoteInput } from '@/components/NoteInput'
import { NotesFeed } from '@/components/NotesFeed'
import { ModuleView } from '@/components/ModuleView'
import { AuthPopover } from '@/components/AuthPopover'
import { parseCommand } from '@/components/CommandParser'
import { PaletteCommand } from '@/components/CommandRegistry'
import { saveNote, getNotes, deleteNote, uploadImage } from '@/lib/notes'
import {
  getLocalNotes,
  saveLocalNote,
  deleteLocalNote,
  clearLocalNotes,
} from '@/lib/localNotes'
import { onAuthChange, User } from '@/lib/auth'
import { Note } from '@/types'

// ── Dashboard card sub-components ────────────────────────────────

function TodoProgressRing({ done, total }: { done: number; total: number }) {
  const r = 8
  const circ = 2 * Math.PI * r
  const pct = total === 0 ? 0 : done / total
  const offset = circ * (1 - pct)
  return (
    <div className="todo-progress-ring">
      <svg viewBox="0 0 22 22">
        <circle cx="11" cy="11" r={r} className="todo-progress-ring-track" />
        <circle
          cx="11"
          cy="11"
          r={r}
          className="todo-progress-ring-fill"
          strokeDasharray={`${circ}`}
          strokeDashoffset={`${offset}`}
        />
      </svg>
    </div>
  )
}

interface DashboardProps {
  notes: Note[]
  todos: TodoItem[]
  activeTab: string
  onOpenModule: (name: string) => void
  onDelete: (id: string, note: Note) => void
}

interface TodoItem {
  id: string
  text: string
  done: boolean
  created_at: string
}

function JournalCard({ notes, onClick }: { notes: Note[]; onClick: () => void }) {
  const journal = notes.filter((n) => n.type === 'journal')
  const latest = journal[0]
  return (
    <div className="card" onClick={onClick}>
      <div className="card-header">
        <div className="card-header-left">
          <span className="card-icon">📓</span>
          <span className="card-title">Journal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="card-meta">
            {latest ? new Date(latest.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
          <span className="card-chevron">›</span>
        </div>
      </div>
      <div className="card-body">
        {latest ? (
          <>
            <p className="card-journal-title">{latest.content.split('\n')[0].slice(0, 60)}</p>
            <p className="card-journal-excerpt">{latest.content}</p>
            <div className="card-journal-tags">
              <span className="card-tag">#journal</span>
            </div>
          </>
        ) : (
          <p className="card-empty">No journal entries yet.</p>
        )}
      </div>
    </div>
  )
}

function TodoCard({ todos, onClick }: { todos: TodoItem[]; onClick: () => void }) {
  const done = todos.filter((t) => t.done).length
  const total = todos.length
  const preview = todos.slice(0, 5)
  return (
    <div className="card" onClick={onClick}>
      <div className="card-header">
        <div className="card-header-left">
          <span className="card-icon">✓</span>
          <span className="card-title">Todo</span>
        </div>
        <div className="card-todo-header-right">
          <span className="card-meta">{done}/{total}</span>
          <TodoProgressRing done={done} total={total} />
          <span className="card-chevron">›</span>
        </div>
      </div>
      <div className="card-body">
        {preview.length === 0 ? (
          <p className="card-empty">No tasks yet.</p>
        ) : (
          <div className="todo-items">
            {preview.map((t) => (
              <div key={t.id} className="todo-item-row">
                <div className={`todo-item-check${t.done ? ' todo-item-check--done' : ''}`}>
                  {t.done && '✓'}
                </div>
                <span className={`todo-item-label${t.done ? ' todo-item-label--done' : ''}`}>{t.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function LinksCard({ notes, onClick }: { notes: Note[]; onClick: () => void }) {
  const links = notes.filter((n) => n.type === 'link').slice(0, 4)
  return (
    <div className="card" onClick={onClick}>
      <div className="card-header">
        <div className="card-header-left">
          <span className="card-icon">🔗</span>
          <span className="card-title">Links</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="card-meta">{notes.filter((n) => n.type === 'link').length}</span>
          <span className="card-chevron">›</span>
        </div>
      </div>
      <div className="card-body" style={{ padding: '0 16px' }}>
        {links.length === 0 ? (
          <p className="card-empty" style={{ padding: '14px 0' }}>No links saved yet.</p>
        ) : (
          <div className="links-card-list">
            {links.map((note) => {
              let host = note.content
              try { host = new URL(note.content).hostname } catch { /* raw */ }
              const handle = note.metadata?.handle as string | undefined
              return (
                <a
                  key={note.id}
                  href={note.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="links-card-item"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="links-card-item-text">
                    <span className="links-card-name">{handle || host}</span>
                    <span className="links-card-url">{host}</span>
                  </div>
                  <span className="links-card-ext">↗</span>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function GalleryCard({ notes, onClick }: { notes: Note[]; onClick: () => void }) {
  const images = notes.filter((n) => n.type === 'image').slice(0, 8)
  return (
    <div className="card" onClick={onClick}>
      <div className="card-header">
        <div className="card-header-left">
          <span className="card-icon">🖼</span>
          <span className="card-title">Gallery</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="card-meta">{notes.filter((n) => n.type === 'image').length} items</span>
          <span className="card-chevron">›</span>
        </div>
      </div>
      <div className="card-body">
        {images.length === 0 ? (
          <p className="card-empty">No images yet. Paste to save.</p>
        ) : (
          <div className="gallery-card-grid">
            {images.map((note) => (
              <img
                key={note.id}
                src={note.content}
                alt={(note.metadata?.caption as string) || ''}
                className="gallery-card-img"
                loading="lazy"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function NoteCard({ notes, onClick }: { notes: Note[]; onClick: () => void }) {
  const plain = notes.filter((n) => n.type === 'journal')[0]
  return (
    <div className="card" onClick={onClick}>
      <div className="card-header">
        <div className="card-header-left">
          <span className="card-icon">📝</span>
          <span className="card-title">Notes</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="card-meta">
            {plain ? new Date(plain.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
          </span>
          <span className="card-chevron">›</span>
        </div>
      </div>
      <div className="card-body">
        {plain ? (
          <p className="card-journal-excerpt">{plain.content}</p>
        ) : (
          <p className="card-empty">No notes yet.</p>
        )}
      </div>
    </div>
  )
}

// ── Greeting helper ───────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning.'
  if (h < 18) return 'Good afternoon.'
  return 'Good evening.'
}

// ── Tab definitions ───────────────────────────────────────────────

const TABS = [
  { id: 'all',     label: 'All',     icon: '⊞' },
  { id: 'journal', label: 'Journal', icon: '📓' },
  { id: 'todo',    label: 'Todo',    icon: '✓' },
  { id: 'links',   label: 'Links',   icon: '🔗' },
  { id: 'gallery', label: 'Gallery', icon: '🖼' },
]

// ── Main page ─────────────────────────────────────────────────────

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)

  // Load todos from localStorage (guest) or Supabase (authed) for dashboard preview
  useEffect(() => {
    async function loadTodos() {
      try {
        const raw = localStorage.getItem('masternote_todos')
        setTodos(raw ? JSON.parse(raw) : [])
      } catch {
        setTodos([])
      }
    }
    loadTodos()
  }, [])

  // Subscribe to auth changes
  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      setUser(u)
      setAuthReady(true)
      if (u) {
        const dbNotes = await getNotes()
        setNotes(dbNotes)
      } else {
        setNotes(getLocalNotes())
      }
    })
    return unsub
  }, [])

  // Escape closes module
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeModule) setActiveModule(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeModule])

  // Migrate guest notes after sign-in
  const handleMigrateGuest = useCallback(async () => {
    const local = getLocalNotes()
    if (local.length === 0) return
    for (const n of [...local].reverse()) {
      await saveNote(n.content, n.type, n.metadata)
    }
    clearLocalNotes()
    const dbNotes = await getNotes()
    setNotes(dbNotes)
  }, [])

  // Handle palette command
  const handleCommand = useCallback((cmd: PaletteCommand) => {
    switch (cmd.action) {
      case 'module':
        setActiveModule((prev) => prev === cmd.payload ? null : cmd.payload ?? null)
        break
      case 'home':
        setActiveModule(null)
        break
      case 'export': {
        const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `masternote-export-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
        break
      }
    }
  }, [notes])

  const handleSubmit = useCallback(async (input: string) => {
    const trimmed = input.trim()
    if (!trimmed) return
    const command = parseCommand(trimmed)
    if (command.isCommand) {
      if (command.action === 'home') { setActiveModule(null) }
      else if (command.moduleName) { setActiveModule((prev) => prev === command.moduleName ? null : command.moduleName!) }
      return
    }
    setIsLoading(true)
    if (user) {
      const saved = await saveNote(trimmed)
      if (saved) setNotes((prev) => [saved, ...prev])
    } else {
      const saved = saveLocalNote(trimmed)
      setNotes((prev) => [saved, ...prev])
    }
    setIsLoading(false)
  }, [user])

  const handleImagePaste = useCallback(async (file: File) => {
    setIsLoading(true)
    if (user) {
      const url = await uploadImage(file)
      if (url) {
        const saved = await saveNote(url, 'image')
        if (saved) setNotes((prev) => [saved, ...prev])
      }
    } else {
      const url = URL.createObjectURL(file)
      const saved = saveLocalNote(url, 'image')
      setNotes((prev) => [saved, ...prev])
    }
    setIsLoading(false)
  }, [user])

  const handleDelete = useCallback(async (id: string, note: Note) => {
    if (user) {
      const ok = await deleteNote(id, note)
      if (ok) setNotes((prev) => prev.filter((n) => n.id !== id))
    } else {
      deleteLocalNote(id)
      setNotes((prev) => prev.filter((n) => n.id !== id))
    }
  }, [user])

  if (!authReady) return null

  const openModule = (name: string) => setActiveModule(name)

  // Tab filter for when a module is open in "feed" mode
  const tabFilteredNotes = activeTab === 'all'
    ? notes
    : activeTab === 'journal' ? notes.filter((n) => n.type === 'journal')
    : activeTab === 'links'   ? notes.filter((n) => n.type === 'link')
    : activeTab === 'gallery' ? notes.filter((n) => n.type === 'image')
    : notes

  return (
    <main className="page">

      {/* ── Top navigation bar ── */}
      <nav className="topnav">
        <a className="topnav-logo" href="/">
          <div className="topnav-logo-mark">m</div>
          <span className="topnav-wordmark">masternote</span>
        </a>


        <div className="topnav-right">
          <div className={`topnav-sync${user ? '' : ''}`}>
            <span className={`topnav-sync-dot${user ? '' : ' topnav-sync-dot--offline'}`} />
            {user ? 'Synced' : 'Local'}
            <span style={{ marginLeft: 2, color: 'var(--text-muted)', fontSize: 10 }}>▾</span>
          </div>

          {isLoading && <span className="status-loading">saving…</span>}

          <button className="topnav-icon-btn" title="Settings">⚙</button>

          <AuthPopover user={user} onMigrateGuest={handleMigrateGuest} />
        </div>
      </nav>

      {/* ── Module overlay (full-screen when active) ── */}
      {activeModule && (
        <ModuleView
          activeModule={activeModule}
          notes={notes}
          onClose={() => setActiveModule(null)}
          onDelete={handleDelete}
        />
      )}

      {/* ── Main scrollable area ── */}
      {!activeModule && (
        <div className="main-scroll">
          {/* Greeting */}
          <div className="greeting-hero">
            <h1 className="greeting-text">{getGreeting()}</h1>
            <p className="greeting-sub">Capture ideas, connect dots, build clarity.</p>
          </div>

          {/* Tab bar */}
          <div className="tab-bar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`tab-btn${activeTab === tab.id ? ' tab-btn--active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.id)
                  if (tab.id !== 'all') openModule(tab.id)
                }}
              >
                <span className="tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dashboard card grid */}
          <div className="dashboard">
            <JournalCard notes={notes} onClick={() => openModule('journal')} />
            <TodoCard    todos={todos}  onClick={() => openModule('todo')} />
            <GalleryCard notes={notes} onClick={() => openModule('gallery')} />
            <LinksCard   notes={notes} onClick={() => openModule('links')} />
            {/* Show a plain Notes card for anything that isn't one of the above */}
            <NoteCard    notes={notes} onClick={() => openModule('all')} />
          </div>
        </div>
      )}

      {/* ── Fixed input bar ── */}
      <div className="input-area">
        <NoteInput
          onSubmit={handleSubmit}
          onImagePaste={handleImagePaste}
          onCommand={handleCommand}
          isLoading={isLoading}
          activeModule={activeModule}
        />
      </div>
    </main>
  )
}