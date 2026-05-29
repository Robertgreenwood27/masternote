'use client'

import { MasterModule, ModuleProps } from '../types'
import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { supabase } from '@/lib/supabase'

interface TodoItem {
  id: string
  text: string
  done: boolean
  created_at: string
}

const LOCAL_KEY = 'masternote_todos'

function getLocalTodos(): TodoItem[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalTodos(todos: TodoItem[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(todos))
}

async function getAuthedUser() {
  const { data } = await supabase.auth.getUser()
  return data.user
}

function TodoComponent({ onClose }: ModuleProps) {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [inputValue, setInputValue] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load todos on mount
  useEffect(() => {
    async function load() {
      const user = await getAuthedUser()
      setUserId(user?.id ?? null)

      if (user) {
        const { data, error } = await supabase
          .from('todos')
          .select('*')
          .order('created_at', { ascending: true })

        if (error) {
          setError(error.message)
        } else if (data) {
          setTodos(data as TodoItem[])
        }
      } else {
        setTodos(getLocalTodos())
      }

      setLoading(false)
    }

    load()
  }, [])

  // Focus input when module opens
  useEffect(() => {
    if (!loading) {
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [loading])

  const addTodo = async () => {
    const text = inputValue.trim()
    if (!text) return

    setError(null)

    if (userId) {
      const { data, error: insertError } = await supabase
        .from('todos')
        .insert([{ text, done: false, user_id: userId }])
        .select()
        .single()

      if (insertError) {
        console.error(insertError.message)
        setError(insertError.message)
        return
      }

      if (data) {
        setTodos((prev) => [...prev, data as TodoItem])
      }
    } else {
      const newTodo: TodoItem = {
        id: `todo_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        text,
        done: false,
        created_at: new Date().toISOString(),
      }

      const updated = [...todos, newTodo]
      saveLocalTodos(updated)
      setTodos(updated)
    }

    setInputValue('')
  }

  const toggleTodo = async (id: string) => {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return

    const newDone = !todo.done
    setError(null)

    if (userId) {
      const { error: updateError } = await supabase
        .from('todos')
        .update({ done: newDone })
        .eq('id', id)

      if (updateError) {
        console.error(updateError.message)
        setError(updateError.message)
        return
      }

      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, done: newDone } : t))
      )
    } else {
      const updated = todos.map((t) =>
        t.id === id ? { ...t, done: newDone } : t
      )

      saveLocalTodos(updated)
      setTodos(updated)
    }
  }

  const deleteTodo = async (id: string) => {
    setError(null)

    if (userId) {
      const { error: deleteError } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error(deleteError.message)
        setError(deleteError.message)
        return
      }

      setTodos((prev) => prev.filter((t) => t.id !== id))
    } else {
      const updated = todos.filter((t) => t.id !== id)
      saveLocalTodos(updated)
      setTodos(updated)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') addTodo()
    if (e.key === 'Escape') onClose()
  }

  const pending = todos.filter((t) => !t.done)
  const done = todos.filter((t) => t.done)

  return (
    <div className="module-surface todo-module">
      <button className="module-close" onClick={onClose} aria-label="Close">
        ×
      </button>

      <h2 className="module-title">
        Todo
        {todos.length > 0 && (
          <span className="todo-count">
            {pending.length} left
          </span>
        )}
      </h2>

      {/* Input */}
      <div className="todo-input-row">
        <input
          ref={inputRef}
          className="todo-input"
          type="text"
          placeholder="add a task…"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button
          className="todo-add-btn"
          onClick={addTodo}
          disabled={!inputValue.trim()}
          aria-label="Add task"
        >
          +
        </button>
      </div>

      {error && <p className="auth-error">{error}</p>}

      {loading ? (
        <p className="module-empty">loading…</p>
      ) : todos.length === 0 ? (
        <p className="module-empty">No tasks yet. Type one above and press ↵</p>
      ) : (
        <div className="todo-list">
          {/* Pending items */}
          {pending.map((todo) => (
            <div key={todo.id} className="todo-item todo-item--pending">
              <button
                className="todo-check"
                onClick={() => toggleTodo(todo.id)}
                aria-label="Complete task"
              >
                <span className="todo-check-inner" />
              </button>

              <span className="todo-text">{todo.text}</span>

              <button
                className="todo-delete"
                onClick={() => deleteTodo(todo.id)}
                aria-label="Delete task"
              >
                ×
              </button>
            </div>
          ))}

          {/* Divider + done items */}
          {done.length > 0 && (
            <>
              {pending.length > 0 && <div className="todo-divider" />}

              {done.map((todo) => (
                <div key={todo.id} className="todo-item todo-item--done">
                  <button
                    className="todo-check todo-check--done"
                    onClick={() => toggleTodo(todo.id)}
                    aria-label="Uncheck task"
                  >
                    <span className="todo-check-inner todo-check-inner--done">
                      ✓
                    </span>
                  </button>

                  <span className="todo-text todo-text--done">
                    {todo.text}
                  </span>

                  <button
                    className="todo-delete"
                    onClick={() => deleteTodo(todo.id)}
                    aria-label="Delete task"
                  >
                    ×
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export const TodoModule: MasterModule = {
  name: 'todo',
  keywords: ['todo', 'todos', 'task', 'tasks', 'list', 'checklist', 'check'],
  Component: TodoComponent,
  noteTypes: [],
  description: 'Manage your to-do list',
}