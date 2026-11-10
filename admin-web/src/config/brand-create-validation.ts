export interface BrandCreationFields {
  name: string;
  contactName?: string;
  businessTypeIds: readonly string[];
  productLineIds: readonly string[];
}

/** Shared by wizard navigation and the final creation boundary. */
export function validateBrandCreationFields(input: BrandCreationFields): void {
  const name = input.name.trim();
  if (!name) throw Error("请填写品牌名称。");
  if (name.length > 60) throw Error("品牌名称最多60字。");
  if ((input.contactName?.trim().length ?? 0) > 30) throw Error("联系人最多30字。");
  if (!input.businessTypeIds.length) throw Error("请至少选择一个经营业态。");
  if (!input.productLineIds.length) throw Error("请至少选择一条产线。");
}
