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
  action?: 'home'
  rawInput: string
  // If it's not a command, this is what gets saved as a note
  noteContent?: string
}
