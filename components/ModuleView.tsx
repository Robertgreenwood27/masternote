'use client'

import { findModule } from './CommandParser'
import { Note } from '@/types'

interface ModuleViewProps {
  activeModule: string | null
  notes: Note[]
  onClose: () => void
  onDelete?: (id: string, note: Note) => void   // ← add this
}

export function ModuleView({ activeModule, notes, onClose, onDelete }: ModuleViewProps) {
  if (!activeModule) return null

  const mod = findModule(activeModule)
  if (!mod) return null

  const { Component } = mod

  return (
    <div className="module-view">
      <Component notes={notes} onClose={onClose} isActive={true} onDelete={onDelete} />
    </div>
  )
}