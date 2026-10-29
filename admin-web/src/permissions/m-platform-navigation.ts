import type { MModule } from './m-platform-catalog';

/** Permission-filtered modules already match navigation and authorization structure. */
export function groupMNavigation(authorized: MModule[]): MModule[] {
  return authorized.map(module => ({ ...module, pages: [...module.pages] }));
}
