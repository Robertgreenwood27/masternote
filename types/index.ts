export type NoteType = 'text' | 'journal' | 'image' | 'link'

export interface Note {
  id: string
  content: string
  type: NoteType
  metadata?: Record<string, unknown>
  created_at: string
}

export interface ParsedCommand {
  isCommand: boolean
  moduleName?: string
  action?: 'home' | 'open'
  actionArg?: string          // ← the handle after /open
  rawInput: string
  noteContent?: string
}