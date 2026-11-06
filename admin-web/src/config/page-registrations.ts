import type { PageRegistration } from "./page-registration-domain";

/**
 * 研发页面注册清单。新页面在现有业务路由实现后在这里声明。
 * 相同 path 可替换旧导航目录的默认描述；id 必须长期稳定。
 * 加载地址使用部署配置提供的实际地址，不向菜单编辑者开放技术参数。
 */
export const PAGE_REGISTRATIONS: readonly PageRegistration[] = [
  {
    id: "merchant.products.list",
    title: "商品",
    titleEn: "Products",
    module: "商品中心",
    status: "active",
    source: "page-registrations.ts",
    routing: { type: "inner", path: "/brand-products/products" },
  },
];
