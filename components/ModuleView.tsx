'use client'

import { findModule } from './CommandParser'
import { Note } from '@/types'

interface ModuleViewProps {
  activeModule: string | null
  notes: Note[]
  onClose: () => void
}

export function ModuleView({ activeModule, notes, onClose }: ModuleViewProps) {
  if (!activeModule) return null

  const mod = findModule(activeModule)
  if (!mod) return null

  const { Component } = mod

  return (
    <div className="module-view">
      <Component notes={notes} onClose={onClose} isActive={true} />
    </div>
  )
}
