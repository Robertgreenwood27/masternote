// ─── Command Registry ───────────────────────────────────────────────
// Every entry the / palette can show. Add new commands here; the
// palette and parser pick them up automatically.

export type CommandCategory = 'module' | 'type' | 'action' | 'filter'

export interface PaletteCommand {
  id: string
  label: string
  hint: string
  category: CommandCategory
  keywords: string[]  // for fuzzy matching
  icon: string        // single glyph / emoji kept monochrome by CSS
}

export const PALETTE_COMMANDS: PaletteCommand[] = [
  // ── Modules ─────────────────────────────────────────────────────
  {
    id: 'open:journal',
    label: 'journal',
    hint: 'open journal view',
    category: 'module',
    keywords: ['journal', 'diary', 'entries', 'log', 'jou'],
    icon: '▤',
  },
  {
    id: 'open:gallery',
    label: 'gallery',
    hint: 'open image gallery',
    category: 'module',
    keywords: ['gallery', 'images', 'photos', 'pics', 'gal'],
    icon: '▦',
  },
  {
    id: 'open:links',
    label: 'links',
    hint: 'open saved links',
    category: 'module',
    keywords: ['links', 'bookmarks', 'urls', 'web', 'lin'],
    icon: '⌁',
  },
  {
    id: 'open:todo',
    label: 'todo',
    hint: 'open task list',
    category: 'module',
    keywords: ['todo', 'tasks', 'checklist', 'list', 'tod'],
    icon: '☐',
  },

  // ── Note type overrides ──────────────────────────────────────────
  {
    id: 'as:journal',
    label: 'save as journal',
    hint: 'force journal type on next note',
    category: 'type',
    keywords: ['journal', 'as journal', 'force journal', 'long'],
    icon: '◈',
  },
  {
    id: 'as:link',
    label: 'save as link',
    hint: 'force link type on next note',
    category: 'type',
    keywords: ['link', 'as link', 'bookmark', 'url'],
    icon: '◈',
  },
  {
    id: 'as:text',
    label: 'save as text',
    hint: 'force plain text on next note',
    category: 'type',
    keywords: ['text', 'plain', 'as text'],
    icon: '◈',
  },

  // ── Actions ──────────────────────────────────────────────────────
  {
    id: 'action:home',
    label: 'home',
    hint: 'close any open module',
    category: 'action',
    keywords: ['home', 'close', 'back', 'exit', 'main'],
    icon: '⌂',
  },
  {
    id: 'action:export',
    label: 'export notes',
    hint: 'download all notes as JSON',
    category: 'action',
    keywords: ['export', 'download', 'backup', 'json'],
    icon: '↓',
  },
]

// ─── Fuzzy match ────────────────────────────────────────────────────
// Returns commands ranked by match quality against `query`.
export function filterCommands(query: string): PaletteCommand[] {
  const q = query.toLowerCase().trim()
  if (!q) return PALETTE_COMMANDS

  return PALETTE_COMMANDS
    .map((cmd) => ({ cmd, score: scoreCommand(cmd, q) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ cmd }) => cmd)
}

function scoreCommand(cmd: PaletteCommand, q: string): number {
  // Exact label match
  if (cmd.label === q) return 100
  // Label starts with query
  if (cmd.label.startsWith(q)) return 80
  // Any keyword starts with query
  if (cmd.keywords.some((kw) => kw.startsWith(q))) return 60
  // Label contains query
  if (cmd.label.includes(q)) return 40
  // Any keyword contains query
  if (cmd.keywords.some((kw) => kw.includes(q))) return 20
  // Hint contains query
  if (cmd.hint.includes(q)) return 10
  return 0
}