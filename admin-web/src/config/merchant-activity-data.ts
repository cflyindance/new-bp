import { createActivityDemo } from './merchant-activity-demo';
import { resolveOrders } from './merchant-activity-domain';
export const activityDemoData = createActivityDemo();
export const activityDemoOrders = resolveOrders(activityDemoData);
