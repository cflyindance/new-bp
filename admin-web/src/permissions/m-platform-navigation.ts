import type { MModule } from './m-platform-catalog';

/** Presentation only: callers must filter permissions before grouping. */
export function groupMNavigation(authorized: MModule[]): MModule[] {
  const activityIds = ['merchant-activity', 'device-activity'];
  return authorized.flatMap(module => {
    if (module.id !== 'merchants') return [{ ...module, pages: [...module.pages] }];
    const pages = module.pages.filter(page => !activityIds.includes(page.id));
    const activities = activityIds.flatMap(id => module.pages.filter(page => page.id === id));
    return [
      ...(pages.length ? [{ ...module, pages }] : []),
      ...(activities.length ? [{ id: 'activity-analysis', title: '使用活跃分析', pages: activities }] : []),
    ];
  });
}
