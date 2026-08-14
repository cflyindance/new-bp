import { seasoningApi } from "./seasoning-api";
import type {
  CursorPage,
  SeasoningBootstrap,
  SeasoningOption,
  SeasoningOptionCategory,
  SeasoningRelationPageSize,
  SeasoningRelationProductPage,
} from "./seasoning-types";

export type SeasoningTab = "relations" | "options";

export type SeasoningStoreState = {
  tab: SeasoningTab;
  bootstrap: SeasoningBootstrap | null;
  productGroups: SeasoningRelationProductPage | null;
  options: CursorPage<SeasoningOption> | null;
  optionCategories: SeasoningOptionCategory[];
  loading: boolean;
  error: string;
  relationFilters: { query: string; action: string; categoryId: string; status: string };
  relationPage: number;
  relationPageSize: SeasoningRelationPageSize;
  optionFilters: { query: string; status: string; categoryId: string };
};

export class SeasoningStore {
  private listeners = new Set<(state: SeasoningStoreState) => void>();
  readonly state: SeasoningStoreState = {
    tab: "relations",
    bootstrap: null,
    productGroups: null,
    options: null,
    optionCategories: [],
    loading: false,
    error: "",
    relationFilters: { query: "", action: "", categoryId: "", status: "" },
    relationPage: 1,
    relationPageSize: 10,
    optionFilters: { query: "", status: "", categoryId: "" },
  };

  subscribe(listener: (state: SeasoningStoreState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.state);
  }

  async initialize(): Promise<void> {
    this.state.loading = true;
    this.emit();
    try {
      this.state.bootstrap = await seasoningApi.bootstrap();
      await this.loadCurrentTab();
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : "request_failed";
    } finally {
      this.state.loading = false;
      this.emit();
    }
  }

  async setTab(tab: SeasoningTab): Promise<void> {
    if (this.state.tab === tab) return;
    this.state.tab = tab;
    await this.loadCurrentTab();
  }

  async refreshBootstrap(): Promise<void> {
    this.state.bootstrap = await seasoningApi.bootstrap();
  }

  async loadRelationPage(page = this.state.relationPage): Promise<void> {
    this.state.loading = true;
    this.state.error = "";
    this.state.relationPage = page;
    this.emit();
    try {
      let response = await seasoningApi.relationProductGroups({
        ...this.state.relationFilters,
        page,
        limit: this.state.relationPageSize,
      });
      if (response.totalPages > 0 && page > response.totalPages) {
        this.state.relationPage = response.totalPages;
        response = await seasoningApi.relationProductGroups({
          ...this.state.relationFilters,
          page: response.totalPages,
          limit: this.state.relationPageSize,
        });
      } else {
        this.state.relationPage = response.totalProducts === 0 ? 1 : response.page;
      }
      this.state.productGroups = response;
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : "request_failed";
    } finally {
      this.state.loading = false;
      this.emit();
    }
  }

  async setRelationPageSize(pageSize: SeasoningRelationPageSize): Promise<void> {
    this.state.relationPageSize = pageSize;
    await this.loadRelationPage(1);
  }

  async loadCurrentTab(cursor = ""): Promise<void> {
    this.state.loading = true;
    this.state.error = "";
    this.emit();
    try {
      if (this.state.tab === "relations") {
        let response = await seasoningApi.relationProductGroups({
          ...this.state.relationFilters,
          page: this.state.relationPage,
          limit: this.state.relationPageSize,
        });
        if (response.totalPages > 0 && this.state.relationPage > response.totalPages) {
          this.state.relationPage = response.totalPages;
          response = await seasoningApi.relationProductGroups({
            ...this.state.relationFilters,
            page: response.totalPages,
            limit: this.state.relationPageSize,
          });
        } else if (response.totalProducts === 0) {
          this.state.relationPage = 1;
        }
        this.state.productGroups = response;
      } else {
        const [options, categories] = await Promise.all([
          seasoningApi.options({ ...this.state.optionFilters, cursor, limit: 20 }),
          seasoningApi.optionCategories(true),
        ]);
        this.state.options = options;
        this.state.optionCategories = categories.items;
      }
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : "request_failed";
    } finally {
      this.state.loading = false;
      this.emit();
    }
  }
}
