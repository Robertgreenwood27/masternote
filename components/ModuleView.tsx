'use client'

import { findModule } from './CommandParser'
import { Note } from '@/types'

interface ModuleViewProps {
  activeModule: string | null
  notes: Note[]
  onClose: () => void
  onDelete?: (id: string, note: Note) => void
}

const FULL_HEIGHT_MODULES = ['gallery']

export function ModuleView({ activeModule, notes, onClose, onDelete }: ModuleViewProps) {
  if (!activeModule) return null
  const mod = findModule(activeModule)
  if (!mod) return null
  const { Component } = mod

  const isFull = FULL_HEIGHT_MODULES.includes(activeModule)

  return (
    <div className={`module-view ${isFull ? 'module-view--full' : ''}`}>
      <Component notes={notes} onClose={onClose} isActive={true} onDelete={onDelete} />
    </div>
  )
}