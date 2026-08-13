export type SeasoningActionCode = "ADD" | "LESS" | "MORE" | "NONE";
export type SeasoningStatus = "active" | "inactive";

export type SeasoningActionDefinition = {
  code: SeasoningActionCode;
  labelKey: "seasoning.action.add" | "seasoning.action.less" | "seasoning.action.more" | "seasoning.action.none";
};

export type SeasoningOption = {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  status: SeasoningStatus;
  sortOrder: number;
  relationCount?: number;
  deletable?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SeasoningProduct = {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  categoryName: string;
  status: SeasoningStatus;
  emenuSellable: boolean;
  sortOrder: number;
  relationCount?: number;
  selectedOptionCount?: number;
};

export type ProductSeasoningRelation = {
  id: string;
  productId: string;
  action: SeasoningActionCode;
  optionId: string;
  priceDelta: number;
  sortOrder: number;
  status: SeasoningStatus;
  createdAt: string;
  updatedAt: string;
};

export type SeasoningRelationSummary = {
  action: SeasoningActionCode;
  optionId: string;
  optionCode: string;
  optionName: string;
  optionStatus: SeasoningStatus;
  activeProductCount: number;
  totalProductCount: number;
  activeRelationCount: number;
  inactiveRelationCount: number;
  minPrice: number;
  maxPrice: number;
  distinctPriceCount: number;
};

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
  total: number;
};

export type MenuNodeSelection = {
  selectedCount: number;
  selectableCount: number;
};

export type SeasoningMenuGroup = MenuNodeSelection & {
  id: string;
  name: string;
  categoryCount: number;
};

export type SeasoningMenuCategory = MenuNodeSelection & {
  id: string;
  groupId: string;
  name: string;
  dishCount: number;
};

export type SeasoningMenuDish = SeasoningProduct & {
  groupId: string;
  groupName: string;
  selected: boolean;
  selectable: boolean;
  unavailableReason?: "product_inactive" | "product_not_sellable";
};

export type SeasoningMenuStructure = {
  groups: SeasoningMenuGroup[];
  categories: SeasoningMenuCategory[];
  dishes: CursorPage<SeasoningMenuDish>;
  activeGroupId: string;
  activeCategoryId: string;
  query: string;
  selectedTotal: number;
};

export type ProductSelectionDraft = {
  token: string;
  total: number;
  expiresAt: string;
  menuVersion: string;
};

export type BatchOptionPrice = { optionId: string; priceDelta: number };

export type BatchActionOptions = {
  action: SeasoningActionCode;
  optionPrices: BatchOptionPrice[];
};

export type BatchCandidateKind = "new" | "same" | "different" | "inactive" | "unavailable";

export type BatchCandidate = {
  candidateId: string;
  productId: string;
  productName?: string;
  optionId: string;
  optionName?: string;
  action: SeasoningActionCode;
  priceDelta: number;
  existingPriceDelta?: number;
  sortOrder: number;
  status: SeasoningStatus;
  kind: BatchCandidateKind;
  reason?: "product_inactive" | "product_not_sellable" | "option_inactive";
};

export type BatchPreviewResponse = {
  previewToken: string;
  version: number;
  actualProductCount: number;
  total: number;
  unresolvedCount: number;
  summary: Record<BatchCandidateKind, number>;
  page: CursorPage<BatchCandidate>;
};

export type BatchDecision = {
  candidateId: string;
  resolution?: "keep" | "use" | "reactivate" | "remove";
  priceDelta?: number;
};

export type BatchPreviewPage = CursorPage<BatchCandidate & { decision?: BatchDecision }> & {
  unresolvedCount: number;
  summary: Record<BatchCandidateKind, number>;
};

export type BatchCommitResult = {
  version: number;
  created: number;
  updated: number;
  reactivated: number;
  skipped: number;
};

export type SeasoningBootstrap = {
  version: number;
  permissions: { canView: boolean; canEdit: boolean };
  categories: { id: string; name: string }[];
};

export type OrderSeasoningSelection = {
  action: SeasoningActionCode;
  optionId: string;
  priceDelta: number;
};
