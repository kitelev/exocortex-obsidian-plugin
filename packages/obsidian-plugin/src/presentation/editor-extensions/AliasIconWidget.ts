import { WidgetType } from "@codemirror/view";
import { setIcon } from "obsidian";

/**
 * Widget that displays an icon to add an alias to a target asset's frontmatter.
 * Appears next to wikilinks that use aliases not present in the target's aliases property.
 */
export class AliasIconWidget extends WidgetType {
  constructor(
    private readonly targetPath: string,
    private readonly alias: string,
    private readonly onClick: (targetPath: string, alias: string) => void,
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
      this.onClick(this.targetPath, this.alias);
    });

    return span;
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
