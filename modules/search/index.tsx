'use client'

import { MasterModule, ModuleProps } from '../types'
import { Note } from '@/types'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface TodoItem {
  id: string
  text: string
  done: boolean
  created_at: string
}

interface SearchResult {
  kind: 'note' | 'todo'
  id: string
  content: string
  type?: string
  done?: boolean
  created_at: string
  matchedField?: string
}

function highlight(text: string, query: string): string {
  if (!query) return text
  // Escape regex special chars
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '|||$1|||')
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const parts = highlight(text, query).split('|||')
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="search-highlight">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

function SearchComponent({ notes, onClose, query }: ModuleProps & { query?: string }) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searchedQuery, setSearchedQuery] = useState('')

  useEffect(() => {
    if (!query) {
      setResults([])
      setSearchedQuery('')
      return
    }

    const q = query.trim().toLowerCase()
    setSearchedQuery(q)
    setLoading(true)

    async function runSearch() {
      const allResults: SearchResult[] = []

      // Search notes (passed in as props — already loaded)
      for (const note of notes) {
        if (note.content.toLowerCase().includes(q)) {
          allResults.push({
            kind: 'note',
            id: note.id,
            content: note.content,
            type: note.type,
            created_at: note.created_at,
          })
        }
      }

      // Search todos from Supabase or localStorage
      const { data: user } = await supabase.auth.getUser()
      let todos: TodoItem[] = []

      if (user.user) {
        const { data } = await supabase
          .from('todos')
          .select('*')
          .ilike('text', `%${q}%`)
          .order('created_at', { ascending: false })
        todos = (data as TodoItem[]) ?? []
      } else {
        try {
          const raw = localStorage.getItem('masternote_todos')
          const local: TodoItem[] = raw ? JSON.parse(raw) : []
          todos = local.filter((t) => t.text.toLowerCase().includes(q))
        } catch {
          todos = []
        }
      }

      for (const todo of todos) {
        allResults.push({
          kind: 'todo',
          id: todo.id,
          content: todo.text,
          done: todo.done,
          created_at: todo.created_at,
        })
      }

      // Sort by date, newest first
      allResults.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setResults(allResults)
      setLoading(false)
    }

    runSearch()
  }, [query, notes])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="module-surface search-module">
      <button className="module-close" onClick={onClose} aria-label="Close">
        ×
      </button>

      <h2 className="module-title">
        Search
        {searchedQuery && (
          <span className="search-query-label">"{searchedQuery}"</span>
        )}
        {!loading && searchedQuery && (
          <span className="todo-count">{results.length} result{results.length !== 1 ? 's' : ''}</span>
        )}
      </h2>

      {!searchedQuery ? (
        <p className="module-empty">
          Type <kbd>/search your query</kbd> to search across notes and todos.
        </p>
      ) : loading ? (
        <p className="module-empty" style={{ color: 'var(--accent)', animation: 'pulse 1s ease-in-out infinite' }}>
          searching…
        </p>
      ) : results.length === 0 ? (
        <p className="module-empty">
          Nothing found for "{searchedQuery}".
        </p>
      ) : (
        <div className="search-results">
          {results.map((result) => (
            <div key={`${result.kind}-${result.id}`} className={`search-result-item search-result-${result.kind}`}>
              <div className="search-result-meta">
                <span className={`note-type-badge search-kind-badge search-kind-${result.kind}${result.done ? ' search-kind-done' : ''}`}>
                  {result.kind === 'todo' ? (result.done ? '✓ done' : '○ todo') : result.type}
                </span>
                <span className="note-date">{formatDate(result.created_at)}</span>
              </div>
              <p className={`search-result-text${result.done ? ' todo-text--done' : ''}`}>
                {result.type === 'link' ? (
                  <a href={result.content} target="_blank" rel="noopener noreferrer" className="note-link">
                    <HighlightedText text={result.content} query={searchedQuery} />
                  </a>
                ) : (
                  <HighlightedText text={result.content} query={searchedQuery} />
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// We need a wrapper because ModuleProps doesn't carry query,
// so we store it on the module itself dynamically.
export function makeSearchModule(query?: string): MasterModule {
  return {
    name: 'search',
    keywords: ['search', 'find', 'query', 'lookup'],
    Component: (props: ModuleProps) => <SearchComponent {...props} query={query} />,
    noteTypes: [],
    description: 'Search across notes and todos',
  }
}

export const SearchModule: MasterModule = makeSearchModule()