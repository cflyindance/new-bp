import { seasoningApi } from "./seasoning-api";
import type {
  CursorPage,
  SeasoningBootstrap,
  SeasoningOption,
  SeasoningRelationSummary,
} from "./seasoning-types";

export type SeasoningTab = "relations" | "options";

export type SeasoningStoreState = {
  tab: SeasoningTab;
  bootstrap: SeasoningBootstrap | null;
  summaries: CursorPage<SeasoningRelationSummary> | null;
  options: CursorPage<SeasoningOption> | null;
  loading: boolean;
  error: string;
  relationFilters: { query: string; action: string; categoryId: string; status: string };
  optionFilters: { query: string; status: string };
};

export class SeasoningStore {
  private listeners = new Set<(state: SeasoningStoreState) => void>();
  readonly state: SeasoningStoreState = {
    tab: "relations",
    bootstrap: null,
    summaries: null,
    options: null,
    loading: false,
    error: "",
    relationFilters: { query: "", action: "", categoryId: "", status: "" },
    optionFilters: { query: "", status: "" },
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

  async loadCurrentTab(cursor = ""): Promise<void> {
    this.state.loading = true;
    this.state.error = "";
    this.emit();
    try {
      if (this.state.tab === "relations") {
        this.state.summaries = await seasoningApi.summaries({ ...this.state.relationFilters, cursor, limit: 20 });
      } else {
        this.state.options = await seasoningApi.options({ ...this.state.optionFilters, cursor, limit: 20 });
      }
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : "request_failed";
    } finally {
      this.state.loading = false;
      this.emit();
    }
  }
}
