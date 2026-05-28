import { MODULES, MasterModule } from '@/modules'
import { ParsedCommand } from '@/types'

/**
 * Simple fuzzy match: does the input start with or contain a keyword?
 * This is intentionally loose — "gal", "gallery", "pics" all work.
 * Extend this later with a proper fuzzy library if needed.
 */
function fuzzyMatch(input: string, keywords: string[]): boolean {
  const lower = input.toLowerCase().trim()
  return keywords.some(
    (kw) =>
      lower === kw ||
      lower.startsWith(kw) ||
      kw.startsWith(lower) ||
      (lower.length >= 3 && kw.includes(lower))
  )
}

export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim()

  // Check if the input matches any module's keywords
  const matchedModule = MODULES.find((m: MasterModule) =>
    fuzzyMatch(trimmed, m.keywords)
  )

  if (matchedModule) {
    return {
      isCommand: true,
      moduleName: matchedModule.name,
      rawInput: trimmed,
    }
  }

  return {
    isCommand: false,
    rawInput: trimmed,
    noteContent: trimmed,
  }
}

export function findModule(name: string): MasterModule | undefined {
  return MODULES.find((m) => m.name === name)
}
