import { MODULES, MasterModule } from '@/modules'
import { ParsedCommand } from '@/types'

// Words after the slash that close any open module and return "home"
const HOME_KEYWORDS = ['home', 'back', 'exit', 'close', 'menu']

// Match a typed command word against a module's keywords.
// Exact match, or prefix shorthand (2+ chars) so "/gal" → gallery.
function matchesKeyword(word: string, keywords: string[]): boolean {
  return keywords.some(
    (kw) => kw === word || (word.length >= 2 && kw.startsWith(word))
  )
}

export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim()

  // * alone → show everything
  if (trimmed === '*') {
    return { isCommand: true, moduleName: 'all', rawInput: trimmed }
  }

  // Commands MUST start with "/". Anything else is always a note.
  if (!trimmed.startsWith('/')) {
    return { isCommand: false, rawInput: trimmed, noteContent: trimmed }
  }

  // Strip the slash, take the first word (ignore anything after a space)
  const word = trimmed.slice(1).trim().toLowerCase().split(/\s+/)[0]

  // "/" alone, or /home /back /exit /close /menu → close any open module
  if (word === '' || matchesKeyword(word, HOME_KEYWORDS)) {
    return { isCommand: true, action: 'home', rawInput: trimmed }
  }

  // /open <handle> → open a saved link by handle
  if (word === 'open') {
    const parts = trimmed.slice(1).trim().split(/\s+/)
    const handle = parts[1]?.toLowerCase() ?? ''

    return {
      isCommand: true,
      action: 'open',
      actionArg: handle,
      rawInput: trimmed,
    }
  }

  // /all → show everything
  if (word === 'all' || word === 'al') {
    return { isCommand: true, moduleName: 'all', rawInput: trimmed }
  }

  // /journal /gallery /links /todo (or shorthand) → open that module
  const matchedModule = MODULES.find((m) => matchesKeyword(word, m.keywords))

  if (matchedModule) {
    return {
      isCommand: true,
      moduleName: matchedModule.name,
      rawInput: trimmed,
    }
  }

  // Unrecognized "/..." → treat as a normal note
  return { isCommand: false, rawInput: trimmed, noteContent: trimmed }
}

export function findModule(name: string): MasterModule | undefined {
  return MODULES.find((m) => m.name === name)
}