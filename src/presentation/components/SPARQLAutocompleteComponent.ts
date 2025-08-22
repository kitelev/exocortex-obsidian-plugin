import {
  SPARQLSuggestion,
  SuggestionType,
} from "../../domain/autocomplete/SPARQLSuggestion";
import { SPARQLAutocompleteService } from "../../application/services/SPARQLAutocompleteService";

export interface AutocompleteComponentOptions {
  maxSuggestions?: number;
  debounceMs?: number;
  onSelect?: (suggestion: SPARQLSuggestion) => void;
  onDismiss?: () => void;
}

export class SPARQLAutocompleteComponent {
  private container: HTMLDivElement;
  private listElement: HTMLUListElement;
  private suggestions: SPARQLSuggestion[] = [];
  private selectedIndex = -1;
  private isVisible = false;
  private debounceTimer?: number;
  private currentRequest?: AbortController;

  private readonly defaultOptions: Required<AutocompleteComponentOptions> = {
    maxSuggestions: 20,
    debounceMs: 150,
    onSelect: () => {},
    onDismiss: () => {},
  };

  private options: Required<AutocompleteComponentOptions>;

  constructor(
    private readonly parentElement: HTMLElement,
    private readonly autocompleteService: SPARQLAutocompleteService,
    options: AutocompleteComponentOptions = {},
  ) {
    this.options = { ...this.defaultOptions, ...options };
    this.createElements();
    this.attachEventListeners();
  }

  private createElements(): void {
    this.container = document.createElement("div");
    this.container.className = "exocortex-sparql-autocomplete";
    this.container.style.cssText = `
            position: absolute;
            background: var(--background-primary);
            border: 1px solid var(--background-modifier-border);
            border-radius: var(--radius-m, 6px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            max-height: 320px;
            min-width: 280px;
            max-width: 450px;
            overflow: hidden;
            z-index: 1000;
            display: none;
        `;

    this.listElement = document.createElement("ul");
    this.listElement.className = "exocortex-autocomplete-list";
    this.listElement.style.cssText = `
            list-style: none;
            margin: 0;
            padding: 6px;
            overflow-y: auto;
            max-height: 308px;
        `;
    this.listElement.setAttribute("role", "listbox");
    this.listElement.setAttribute("aria-label", "SPARQL suggestions");

    this.container.appendChild(this.listElement);
    document.body.appendChild(this.container);
  }

  private attachEventListeners(): void {
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("click", this.handleDocumentClick.bind(this));

    this.listElement.addEventListener("mousemove", (e) => {
      const target = (e.target as HTMLElement).closest("li");
      if (target) {
        const index = parseInt(target.dataset.index || "-1");
        if (index >= 0) {
          this.selectSuggestion(index);
        }
      }
    });

    this.listElement.addEventListener("click", (e) => {
      const target = (e.target as HTMLElement).closest("li");
      if (target) {
        const index = parseInt(target.dataset.index || "-1");
        if (index >= 0 && this.suggestions[index]) {
          this.applySuggestion(this.suggestions[index]);
        }
      }
    });
  }

  async show(
    query: string,
    cursorPosition: number,
    anchorElement: HTMLElement,
  ): Promise<void> {
    if (this.currentRequest) {
      this.currentRequest.abort();
    }

    clearTimeout(this.debounceTimer);

    this.debounceTimer = window.setTimeout(async () => {
      this.currentRequest = new AbortController();

      try {
        const result = await this.autocompleteService.getSuggestions(
          query,
          cursorPosition,
          {
            maxSuggestions: this.options.maxSuggestions,
            includeDescriptions: true,
            contextBoost: true,
            cacheResults: true,
          },
        );

        if (result.isSuccess) {
          this.suggestions = result.getValue();
          if (this.suggestions.length > 0) {
            this.renderSuggestions();
            this.positionContainer(anchorElement);
            this.showContainer();
            this.selectedIndex = 0;
            this.updateSelection();
          } else {
            this.hide();
          }
        } else {
          console.warn("Failed to get suggestions:", result.errorValue());
          this.hide();
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Autocomplete error:", error);
        }
        this.hide();
      }
    }, this.options.debounceMs);
  }

  hide(): void {
    if (this.currentRequest) {
      this.currentRequest.abort();
      this.currentRequest = undefined;
    }

    clearTimeout(this.debounceTimer);
    this.container.style.display = "none";
    this.isVisible = false;
    this.selectedIndex = -1;
    this.suggestions = [];
    this.options.onDismiss();
  }

  private renderSuggestions(): void {
    this.listElement.innerHTML = "";

    this.suggestions.forEach((suggestion, index) => {
      const li = this.createSuggestionElement(suggestion, index);
      this.listElement.appendChild(li);
    });
  }

  private createSuggestionElement(
    suggestion: SPARQLSuggestion,
    index: number,
  ): HTMLLIElement {
    const li = document.createElement("li");
    li.className = "exocortex-autocomplete-item";
    li.dataset.index = index.toString();
    li.setAttribute("role", "option");
    li.setAttribute("aria-selected", "false");
    li.style.cssText = `
            display: flex;
            align-items: center;
            padding: 8px 12px;
            margin: 2px 0;
            border-radius: var(--radius-s, 4px);
            cursor: pointer;
            transition: background-color 0.15s ease;
        `;

    const typeIndicator = this.createTypeIndicator(suggestion.getType());
    li.appendChild(typeIndicator);

    const content = document.createElement("div");
    content.className = "autocomplete-content";
    content.style.cssText = "flex: 1; min-width: 0;";

    const title = document.createElement("div");
    title.className = "autocomplete-title";
    title.textContent = suggestion.getText();
    title.style.cssText = `
            font-weight: 500;
            font-size: 14px;
            color: var(--text-normal);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `;
    content.appendChild(title);

    const metadata = suggestion.getMetadata();
    if (metadata?.description) {
      const description = document.createElement("div");
      description.className = "autocomplete-description";
      description.textContent = metadata.description;
      description.style.cssText = `
                font-size: 12px;
                color: var(--text-muted);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                margin-top: 2px;
            `;
      content.appendChild(description);
    }

    li.appendChild(content);

    const confidence = document.createElement("div");
    confidence.className = "autocomplete-confidence";
    confidence.style.cssText = `
            margin-left: 8px;
            font-size: 11px;
            color: var(--text-muted);
            opacity: 0.6;
        `;
    const score = Math.round(suggestion.calculateFinalScore() * 100);
    if (score > 70) {
      confidence.textContent = "●●●";
    } else if (score > 40) {
      confidence.textContent = "●●○";
    } else {
      confidence.textContent = "●○○";
    }
    li.appendChild(confidence);

    return li;
  }

  private createTypeIndicator(type: SuggestionType): HTMLSpanElement {
    const span = document.createElement("span");
    span.className = `autocomplete-type-indicator type-${type}`;
    span.style.cssText = `
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            margin-right: 10px;
            border-radius: var(--radius-s, 4px);
            font-size: 11px;
            font-weight: 600;
            flex-shrink: 0;
        `;

    const colors = this.getTypeColors(type);
    span.style.background = colors.bg;
    span.style.color = colors.text;
    span.style.border = `1px solid ${colors.border}`;

    span.textContent = this.getTypeAbbreviation(type);

    return span;
  }

  private getTypeColors(type: SuggestionType): {
    bg: string;
    text: string;
    border: string;
  } {
    const isDark = document.body.classList.contains("theme-dark");

    const lightColors: Record<
      SuggestionType,
      { bg: string; text: string; border: string }
    > = {
      [SuggestionType.KEYWORD]: {
        bg: "#e3f2fd",
        text: "#1565c0",
        border: "#bbdefb",
      },
      [SuggestionType.FUNCTION]: {
        bg: "#f3e5f5",
        text: "#7b1fa2",
        border: "#ce93d8",
      },
      [SuggestionType.PREFIX]: {
        bg: "#e8f5e8",
        text: "#2e7d32",
        border: "#c8e6c9",
      },
      [SuggestionType.VARIABLE]: {
        bg: "#fff3e0",
        text: "#ef6c00",
        border: "#ffcc02",
      },
      [SuggestionType.PROPERTY]: {
        bg: "#fce4ec",
        text: "#c2185b",
        border: "#f48fb1",
      },
      [SuggestionType.CLASS]: {
        bg: "#e0f2f1",
        text: "#00695c",
        border: "#80cbc4",
      },
      [SuggestionType.NAMESPACE]: {
        bg: "#f1f8e9",
        text: "#558b2f",
        border: "#c5e1a5",
      },
      [SuggestionType.OPERATOR]: {
        bg: "#ede7f6",
        text: "#512da8",
        border: "#b39ddb",
      },
      [SuggestionType.TEMPLATE]: {
        bg: "#fafafa",
        text: "#424242",
        border: "#e0e0e0",
      },
    };

    const darkColors: Record<
      SuggestionType,
      { bg: string; text: string; border: string }
    > = {
      [SuggestionType.KEYWORD]: {
        bg: "rgba(33, 150, 243, 0.2)",
        text: "#90caf9",
        border: "rgba(33, 150, 243, 0.3)",
      },
      [SuggestionType.FUNCTION]: {
        bg: "rgba(156, 39, 176, 0.2)",
        text: "#ce93d8",
        border: "rgba(156, 39, 176, 0.3)",
      },
      [SuggestionType.PREFIX]: {
        bg: "rgba(76, 175, 80, 0.2)",
        text: "#81c784",
        border: "rgba(76, 175, 80, 0.3)",
      },
      [SuggestionType.VARIABLE]: {
        bg: "rgba(255, 152, 0, 0.2)",
        text: "#ffb74d",
        border: "rgba(255, 152, 0, 0.3)",
      },
      [SuggestionType.PROPERTY]: {
        bg: "rgba(233, 30, 99, 0.2)",
        text: "#f48fb1",
        border: "rgba(233, 30, 99, 0.3)",
      },
      [SuggestionType.CLASS]: {
        bg: "rgba(0, 150, 136, 0.2)",
        text: "#4db6ac",
        border: "rgba(0, 150, 136, 0.3)",
      },
      [SuggestionType.NAMESPACE]: {
        bg: "rgba(139, 195, 74, 0.2)",
        text: "#aed581",
        border: "rgba(139, 195, 74, 0.3)",
      },
      [SuggestionType.OPERATOR]: {
        bg: "rgba(103, 58, 183, 0.2)",
        text: "#b39ddb",
        border: "rgba(103, 58, 183, 0.3)",
      },
      [SuggestionType.TEMPLATE]: {
        bg: "rgba(158, 158, 158, 0.2)",
        text: "#bdbdbd",
        border: "rgba(158, 158, 158, 0.3)",
      },
    };

    return isDark ? darkColors[type] : lightColors[type];
  }

  private getTypeAbbreviation(type: SuggestionType): string {
    const abbreviations: Record<SuggestionType, string> = {
      [SuggestionType.KEYWORD]: "K",
      [SuggestionType.FUNCTION]: "F",
      [SuggestionType.PREFIX]: "P",
      [SuggestionType.VARIABLE]: "V",
      [SuggestionType.PROPERTY]: "P",
      [SuggestionType.CLASS]: "C",
      [SuggestionType.NAMESPACE]: "N",
      [SuggestionType.OPERATOR]: "O",
      [SuggestionType.TEMPLATE]: "T",
    };

    return abbreviations[type] || "?";
  }

  private positionContainer(anchorElement: HTMLElement): void {
    const rect = anchorElement.getBoundingClientRect();
    const containerHeight = 320;
    const containerWidth = 350;

    let top = rect.bottom + 5;
    let left = rect.left;

    if (top + containerHeight > window.innerHeight) {
      top = rect.top - containerHeight - 5;
    }

    if (left + containerWidth > window.innerWidth) {
      left = window.innerWidth - containerWidth - 10;
    }

    this.container.style.top = `${top}px`;
    this.container.style.left = `${left}px`;
  }

  private showContainer(): void {
    this.container.style.display = "block";
    this.isVisible = true;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.isVisible) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this.selectNext();
        break;
      case "ArrowUp":
        e.preventDefault();
        this.selectPrevious();
        break;
      case "Enter":
      case "Tab":
        if (this.selectedIndex >= 0 && this.suggestions[this.selectedIndex]) {
          e.preventDefault();
          this.applySuggestion(this.suggestions[this.selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        this.hide();
        break;
    }
  }

  private handleDocumentClick(e: MouseEvent): void {
    if (
      !this.container.contains(e.target as Node) &&
      !this.parentElement.contains(e.target as Node)
    ) {
      this.hide();
    }
  }

  private selectNext(): void {
    if (this.selectedIndex < this.suggestions.length - 1) {
      this.selectedIndex++;
      this.updateSelection();
    }
  }

  private selectPrevious(): void {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      this.updateSelection();
    }
  }

  private selectSuggestion(index: number): void {
    if (index >= 0 && index < this.suggestions.length) {
      this.selectedIndex = index;
      this.updateSelection();
    }
  }

  private updateSelection(): void {
    const items = this.listElement.querySelectorAll("li");
    items.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.classList.add("is-selected");
        item.setAttribute("aria-selected", "true");
        item.style.backgroundColor = "var(--background-modifier-hover)";
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.classList.remove("is-selected");
        item.setAttribute("aria-selected", "false");
        item.style.backgroundColor = "";
      }
    });
  }

  private applySuggestion(suggestion: SPARQLSuggestion): void {
    this.options.onSelect(suggestion);
    this.hide();
  }

  destroy(): void {
    document.removeEventListener("keydown", this.handleKeyDown.bind(this));
    document.removeEventListener("click", this.handleDocumentClick.bind(this));

    if (this.currentRequest) {
      this.currentRequest.abort();
    }

    clearTimeout(this.debounceTimer);

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
