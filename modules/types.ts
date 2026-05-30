import { ComponentType } from 'react'
import { Note } from '@/types'

export interface MasterModule {
  name: string
  keywords: string[]
  Component: ComponentType<ModuleProps>
  noteTypes: string[]
  description?: string
}

export interface ModuleProps {
  notes: Note[]
  onClose: () => void
  isActive: boolean
  onDelete?: (id: string, note: Note) => void
}