import type { ServicePackage } from './subscription-service-domain';

export const packageOnSale = (pkg: ServicePackage): boolean => pkg.status === 'published' && pkg.saleStatus !== 'off';
