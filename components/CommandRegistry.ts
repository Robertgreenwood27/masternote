export interface PaletteCommand {
  id: string
  label: string
  hint: string
  icon: string
  category: 'module' | 'action' | 'type' | 'filter'
  keywords: string[]
  // What gets dispatched when selected
  action: 'module' | 'home' | 'export' | 'search' | 'forceType'
  payload?: string   // module name, type override, etc.
}

export const PALETTE_COMMANDS: PaletteCommand[] = [
  // ── Modules ──────────────────────────────────────────────────────
  {
    id: 'journal',
    label: 'journal',
    hint: 'view journal entries',
    icon: '📓',
    category: 'module',
    keywords: ['journal', 'diary', 'entries', 'log', 'j'],
    action: 'module',
    payload: 'journal',
  },
  {
    id: 'gallery',
    label: 'gallery',
    hint: 'browse saved images',
    icon: '🖼',
    category: 'module',
    keywords: ['gallery', 'photos', 'images', 'pics', 'pictures', 'g'],
    action: 'module',
    payload: 'gallery',
  },
  {
    id: 'links',
    label: 'links',
    hint: 'saved bookmarks & URLs',
    icon: '🔗',
    category: 'module',
    keywords: ['links', 'bookmarks', 'urls', 'saved', 'web', 'l'],
    action: 'module',
    payload: 'links',
  },
  {
    id: 'todo',
    label: 'todo',
    hint: 'manage tasks & checklists',
    icon: '✓',
    category: 'module',
    keywords: ['todo', 'todos', 'task', 'tasks', 'list', 'checklist', 'check', 't'],
    action: 'module',
    payload: 'todo',
  },

  // ── Actions ──────────────────────────────────────────────────────
  {
    id: 'home',
    label: 'home',
    hint: 'close module / go home',
    icon: '⌂',
    category: 'action',
    keywords: ['home', 'back', 'exit', 'close', 'menu', 'h'],
    action: 'home',
  },
  {
    id: 'export',
    label: 'export',
    hint: 'download notes as JSON',
    icon: '↓',
    category: 'action',
    keywords: ['export', 'download', 'backup', 'save'],
    action: 'export',
  },
]

// ── Fuzzy scorer ─────────────────────────────────────────────────

function scoreCommand(cmd: PaletteCommand, q: string): number {
  if (cmd.label === q)                            return 100
  if (cmd.label.startsWith(q))                   return 80
  if (cmd.keywords.some((kw) => kw.startsWith(q))) return 60
  if (cmd.label.includes(q))                     return 40
  if (cmd.keywords.some((kw) => kw.includes(q))) return 20
  if (cmd.hint.includes(q))                      return 10
  return 0
}

export function filterCommands(query: string): PaletteCommand[] {
  const q = query.toLowerCase().trim()
  if (!q) return PALETTE_COMMANDS

  return PALETTE_COMMANDS
    .map((cmd) => ({ cmd, score: scoreCommand(cmd, q) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ cmd }) => cmd)
}