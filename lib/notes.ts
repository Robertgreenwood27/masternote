import { supabase } from './supabase'
import { Note, NoteType } from '@/types'
import { parseLinkWithHandle } from './parseLink'

export { parseLinkWithHandle } from './parseLink'

export function detectNoteType(input: string): NoteType {
  // Strip any "as <handle>" suffix before checking the URL
  const { url: trimmed } = parseLinkWithHandle(input.trim())

  try {
    const url = new URL(trimmed)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    if (imageExtensions.some((ext) => url.pathname.toLowerCase().endsWith(ext))) {
      return 'image'
    }
    return 'link'
  } catch {
    // not a URL
  }

  if (trimmed.includes('\n') || trimmed.length > 280) {
    return 'journal'
  }

  return 'text'
}

export async function uploadImage(file: File): Promise<string | null> {
  const ext = file.type.split('/')[1] || 'png'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('images')
    .upload(filename, file, { contentType: file.type })

  if (error) {
    console.error('Error uploading image:', error)
    return null
  }

  const { data } = supabase.storage.from('images').getPublicUrl(filename)
  return data.publicUrl
}

function extractStorageFilename(url: string): string | null {
  try {
    const path = new URL(url).pathname
    const marker = '/public/images/'
    const idx = path.indexOf(marker)
    if (idx === -1) return null
    return path.slice(idx + marker.length)
  } catch {
    return null
  }
}

export async function saveNote(
  content: string,
  type?: NoteType,
  metadata?: Record<string, unknown>
): Promise<Note | null> {
  const noteType = type ?? detectNoteType(content)

  const { data, error } = await supabase
    .from('notes')
    .insert([{ content, type: noteType, metadata: metadata ?? {} }])
    .select()
    .single()

  if (error) {
    console.error('Error saving note:', error)
    return null
  }

  return data as Note
}

export async function getNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching notes:', error)
    return []
  }

  return data as Note[]
}

export async function deleteNote(id: string, note?: Note): Promise<boolean> {
  if (note?.type === 'image') {
    const filename = extractStorageFilename(note.content)
    if (filename) {
      const { error: storageError } = await supabase.storage
        .from('images')
        .remove([filename])
      if (storageError) {
        console.error('Error deleting image from storage:', storageError)
      }
    }
  }

  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) {
    console.error('Error deleting note:', error)
    return false
  }
  return true
}