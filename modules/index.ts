import { MasterModule } from './types'
import { JournalModule } from './journal'
import { GalleryModule } from './gallery'
import { LinksModule } from './links'
import { TodoModule } from './todo'
import { SearchModule } from './search'

/**
 * MODULE REGISTRY
 *
 * To add a new feature:
 *   1. Create /modules/yourfeature/index.tsx
 *   2. Export a YourFeatureModule satisfying the MasterModule interface
 *   3. Import it here and add it to this array
 *
 * That's it. The command parser, routing, and feed filtering
 * all derive from this list automatically.
 */
export const MODULES: MasterModule[] = [
  JournalModule,
  GalleryModule,
  LinksModule,
  TodoModule,
  SearchModule,
]

export type { MasterModule }