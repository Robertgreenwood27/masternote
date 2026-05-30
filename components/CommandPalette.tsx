'use client'

import { useEffect, useRef } from 'react'
import { PaletteCommand, filterCommands } from './CommandRegistry'

interface CommandPaletteProps {
  query: string
  selectedIndex: number
  onSelect: (cmd: PaletteCommand) => void
  onChangeIndex: (index: number) => void
}

const CATEGORY_LABELS: Record<string, string> = {
  module:  'modules',
  type:    'save as',
  action:  'actions',
  filter:  'filter',
}

export function CommandPalette({
  query,
  selectedIndex,
  onSelect,
  onChangeIndex,
}: CommandPaletteProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const commands = filterCommands(query)

  // Keep selected item scrolled into view
  useEffect(() => {
    const el = listRef.current?.querySelector(
      `[data-index="${selectedIndex}"]`
    ) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (commands.length === 0) return null

  // Group by category, preserving ranked order within each group
  const grouped: { category: string; items: (PaletteCommand & { rank: number })[] }[] = []
  const seen = new Set<string>()

  commands.forEach((cmd, rank) => {
    if (!seen.has(cmd.category)) {
      seen.add(cmd.category)
      grouped.push({ category: cmd.category, items: [] })
    }
    grouped.find((g) => g.category === cmd.category)!.items.push({ ...cmd, rank })
  })

  return (
    <div className="cmd-palette" role="listbox" aria-label="Command palette">
      <div className="cmd-palette-inner" ref={listRef}>
        {grouped.map(({ category, items }) => (
          <div key={category} className="cmd-group">
            <div className="cmd-group-label">
              {CATEGORY_LABELS[category] ?? category}
            </div>
            {items.map((cmd) => (
              <div
                key={cmd.id}
                data-index={cmd.rank}
                role="option"
                aria-selected={cmd.rank === selectedIndex}
                className={`cmd-item ${cmd.rank === selectedIndex ? 'cmd-item--active' : ''}`}
                onMouseEnter={() => onChangeIndex(cmd.rank)}
                onClick={() => onSelect(cmd)}
              >
                <span className="cmd-icon">{cmd.icon}</span>
                <span className="cmd-label">{cmd.label}</span>
                <span className="cmd-hint">{cmd.hint}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="cmd-palette-footer">
        <span>↑↓ navigate</span>
        <span>↵ select</span>
        <span>esc dismiss</span>
      </div>
    </div>
  )
}