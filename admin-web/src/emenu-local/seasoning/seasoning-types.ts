export type SeasoningActionCode = "ADD" | "LESS" | "MORE" | "NONE";
export type SeasoningStatus = "active" | "inactive";

export type SeasoningOptionCategory = {
  id: string;
  code: string;
  name: string;
  status: SeasoningStatus;
  sortOrder: number;
  system: boolean;
  optionCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type SeasoningActionDefinition = {
  code: SeasoningActionCode;
  labelKey: "seasoning.action.add" | "seasoning.action.less" | "seasoning.action.more" | "seasoning.action.none";
};

export type SeasoningOption = {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  categoryId: string;
  categoryName?: string;
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

export type SeasoningRelationProductOption = {
  relationId: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
  sortOrder: number;
  status: SeasoningStatus;
};

export type SeasoningRelationProductAction = {
  action: SeasoningActionCode;
  items: SeasoningRelationProductOption[];
};

export type SeasoningRelationProductGroup = {
  product: SeasoningProduct;
  visibleRelationCount: number;
  status: "active" | "mixed" | "inactive";
  actions: SeasoningRelationProductAction[];
};

export type SeasoningRelationPageSize = 5 | 10 | 20 | 50;

export type SeasoningRelationProductPage = {
  items: SeasoningRelationProductGroup[];
  page: number;
  pageSize: SeasoningRelationPageSize;
  totalPages: number;
  totalProducts: number;
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
  menuSource?: string | null;
  menuFromCache?: boolean;
};

export type ProductSelectionDraft = {
  token: string;
  total: number;
  expiresAt: string;
  menuVersion: string;
};

export type BatchOptionPrice = {
  optionId: string;
  inputPrice: number;
  markupCoefficient: number;
  priceDelta: number;
};

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
  inputPrice: number;
  markupCoefficient: number;
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

export type BatchFinalConfiguredRelation = {
  source: "configured";
  includedInFinal: true;
  candidateId: string;
  relationId?: string;
  action: SeasoningActionCode;
  optionId: string;
  optionName: string;
  inputPrice: number;
  markupCoefficient: number;
  priceDelta: number;
  status: "active";
  kind: Exclude<BatchCandidateKind, "unavailable">;
  sortOrder: number;
};

export type SeasoningOptionPickerSnapshot = {
  version: number;
  categories: SeasoningOptionCategory[];
  items: SeasoningOption[];
};

export type BatchFinalPreservedRelation = {
  source: "preserved";
  includedInFinal: true;
  relationId: string;
  action: SeasoningActionCode;
  optionId: string;
  optionName: string;
  inputPrice: number;
  markupCoefficient: 1;
  priceDelta: number;
  status: SeasoningStatus;
  preservedReason: "not_configured" | "configured_but_unavailable" | "product_unavailable";
  sortOrder: number;
};

export type BatchExcludedCandidate = {
  source: "configured";
  includedInFinal: false;
  candidateId: string;
  action: SeasoningActionCode;
  optionId: string;
  optionName: string;
  inputPrice: number;
  markupCoefficient: number;
  priceDelta: number;
  kind: "unavailable";
  reason: "product_inactive" | "product_not_sellable" | "option_inactive";
  existingRelationId?: string;
};

export type BatchPreviewActionGroup = {
  action: SeasoningActionCode;
  items: Array<BatchFinalConfiguredRelation | BatchFinalPreservedRelation>;
};

export type BatchPreviewProductGroup = {
  productId: string;
  productName: string;
  disposition: "merge" | "unchanged_unavailable";
  actions: BatchPreviewActionGroup[];
  excludedCandidates: BatchExcludedCandidate[];
  finalRelationCount: number;
};

export type BatchPreviewProductCursorPage = CursorPage<BatchPreviewProductGroup> & {
  unresolvedCount: number;
  summary: Record<BatchCandidateKind, number>;
};

export type BatchPreviewPageSize = 5 | 10 | 20 | 50;

export type BatchPreviewProductNumberPage = {
  items: BatchPreviewProductGroup[];
  page: number;
  pageSize: BatchPreviewPageSize;
  totalPages: number;
  totalProducts: number;
  unresolvedCount: number;
  summary: Record<BatchCandidateKind, number>;
};

export type BatchPreviewProductPage = BatchPreviewProductCursorPage | BatchPreviewProductNumberPage;

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
