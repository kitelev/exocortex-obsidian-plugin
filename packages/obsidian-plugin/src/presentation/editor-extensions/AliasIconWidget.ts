import { WidgetType } from "@codemirror/view";
import { setIcon } from "obsidian";

/**
 * Result type for the onClick callback to support optimistic UI.
 * Allows the callback to signal success/failure for icon reappearance logic.
 */
export interface AliasIconClickResult {
  success: boolean;
  error?: string;
}

/**
 * Widget that displays an icon to add an alias to a target asset's frontmatter.
 * Appears next to wikilinks that use aliases not present in the target's aliases property.
 *
 * Implements optimistic UI: icon hides immediately on click, reappears on error.
 */
export class AliasIconWidget extends WidgetType {
  private isProcessing = false;

  constructor(
    private readonly targetPath: string,
    private readonly alias: string,
    private readonly onClick: (targetPath: string, alias: string) => Promise<AliasIconClickResult>,
  ) {
    super();
  }

  override toDOM(): HTMLElement {
    const span = document.createElement("span");
    span.className = "exocortex-alias-add-icon";
    span.setAttribute("aria-label", `Add "${this.alias}" to aliases`);
    span.setAttribute("data-target-path", this.targetPath);
    span.setAttribute("data-alias", this.alias);

    // Use Obsidian's setIcon for consistent theming
    setIcon(span, "bookmark-plus");

    span.addEventListener("mouseenter", () => {
      span.classList.add("is-hovered");
    });

    span.addEventListener("mouseleave", () => {
      span.classList.remove("is-hovered");
    });

    span.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleClick(span);
    });

    return span;
  }

  /**
   * Handle click with optimistic UI: hide immediately, reappear on error.
   * Uses CSS class 'is-hidden' for styling instead of direct style manipulation.
   */
  private async handleClick(element: HTMLElement): Promise<void> {
    // Guard against double-clicks while processing
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;

    // Optimistic UI: hide immediately (within 1 frame / 16ms)
    element.classList.add("is-hidden");

    try {
      const result = await this.onClick(this.targetPath, this.alias);

      if (!result.success) {
        // Operation failed: reappear the icon
        element.classList.remove("is-hidden");
      }
      // On success: icon stays hidden (decoration will be removed on next rebuild)
    } catch {
      // Error: reappear the icon
      element.classList.remove("is-hidden");
    } finally {
      this.isProcessing = false;
    }
  }

  override eq(other: WidgetType): boolean {
    if (!(other instanceof AliasIconWidget)) {
      return false;
    }
    return (
      other.targetPath === this.targetPath &&
      other.alias === this.alias
    );
  }

  override ignoreEvent(): boolean {
    return false;
  }
}
