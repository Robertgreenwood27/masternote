# masternote

A command-driven, single-surface personal knowledge tool.
No tabs, no nav, no clutter. Type to navigate.

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in your Supabase credentials
cp .env.local.example .env.local

# 3. Create the database table
#    Go to supabase.com → your project → SQL Editor → paste supabase-schema.sql → Run

# 4. Start
npm run dev
```

---

## How it works

The input at the bottom accepts two kinds of input:

| Input | What happens |
|-------|-------------|
| `gallery` / `gal` / `photos` | Opens the gallery module above the feed |
| `journal` / `diary` | Opens the journal module |
| `links` / `bookmarks` | Opens the links module |
| Any URL ending in `.jpg`, `.png`, etc. | Saved as an image note |
| Any other URL | Saved as a link note |
| Anything else | Saved as a text note (long text → journal type) |

**Enter** = submit. **Shift+Enter** = newline (for multi-line notes).

---

## Adding a new module

This is the whole workflow:

1. Create `/modules/yourfeature/index.tsx`:

```tsx
'use client'
import { MasterModule, ModuleProps } from '../types'

function YourComponent({ notes, onClose }: ModuleProps) {
  return (
    <div className="module-surface">
      <button className="module-close" onClick={onClose}>×</button>
      <h2 className="module-title">Your Feature</h2>
      {/* your UI */}
    </div>
  )
}

export const YourModule: MasterModule = {
  name: 'yourfeature',
  keywords: ['yourfeature', 'yf', 'alias'],
  Component: YourComponent,
  noteTypes: ['text'],        // which note types this module cares about
  description: 'Does something cool',
}
```

2. Open `/modules/index.ts` and add two lines:

```ts
import { YourModule } from './yourfeature'

export const MODULES: MasterModule[] = [
  JournalModule,
  GalleryModule,
  LinksModule,
  YourModule,   // ← add here
]
```

Done. The command parser, routing, and feed filtering all pick it up automatically.

---

## Planned features (not yet built)

- [ ] Speech to text (hook into note input)
- [ ] Text to speech (read notes aloud)
- [ ] Map module
- [ ] Calendar / timeline module
- [ ] AI summarization module
- [ ] Full-text search
- [ ] Auth (Supabase Auth — enable RLS in schema)
- [ ] Tags / filtering
- [ ] Export

---

## Architecture

```
/app
  page.tsx          ← the ONE page. orchestrates everything.
  layout.tsx
  globals.css

/modules
  index.ts          ← MODULE REGISTRY (add features here)
  types.ts          ← MasterModule interface
  /journal
  /gallery
  /links

/components
  CommandParser.ts  ← fuzzy input → module or note
  NoteInput.tsx     ← the bottom input bar
  NotesFeed.tsx     ← the scrolling note history
  ModuleView.tsx    ← renders the active module at top

/lib
  supabase.ts       ← supabase client
  notes.ts          ← all DB logic lives here

/types
  index.ts          ← shared types
```
