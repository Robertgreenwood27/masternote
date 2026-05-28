import { ComponentType } from 'react'
import { Note } from '@/types'

export interface MasterModule {
  // The name shown in the UI when this module is active
  name: string

  // Keywords that activate this module (fuzzy matched against input)
  // e.g. ['gallery', 'photos', 'images']
  keywords: string[]

  // The React component that renders in the top surface
  // Receives all notes of the relevant types so it can display them
  Component: ComponentType<ModuleProps>

  // Which note types this module "owns" — used to filter the feed
  noteTypes: string[]

  // Optional: describe what this module does (shown as hint)
  description?: string
}

export interface ModuleProps {
  notes: Note[]
  onClose: () => void
  isActive: boolean
}
