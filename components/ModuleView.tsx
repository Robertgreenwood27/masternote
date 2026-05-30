'use client'

import { findModule } from './CommandParser'
import { Note } from '@/types'
import { makeSearchModule } from '@/modules/search'

interface ModuleViewProps {
  activeModule: string | null
  notes: Note[]
  onClose: () => void
  searchQuery?: string
}

export function ModuleView({ activeModule, notes, onClose, searchQuery }: ModuleViewProps) {
  if (!activeModule) return null

  // For search, build a dynamic module with the current query baked in
  const mod =
    activeModule === 'search'
      ? makeSearchModule(searchQuery)
      : findModule(activeModule)

  if (!mod) return null

  const { Component } = mod

  return (
    <div className="module-view">
      <Component notes={notes} onClose={onClose} isActive={true} />
    </div>
  )
}