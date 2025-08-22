import { Result } from "../core/Result";

export interface UIElement {
  readonly type:
    | "container"
    | "text"
    | "link"
    | "button"
    | "list"
    | "table"
    | "header"
    | "custom";
  readonly id: string;
  readonly cssClasses?: string[];
  readonly attributes?: Record<string, string>;
  readonly content?: string;
  readonly children?: UIElement[];
}

export interface UIRenderOptions {
  readonly containerId: string;
  readonly clearContainer?: boolean;
  readonly applyStyles?: boolean;
}

export interface UIEventHandler {
  readonly eventType: "click" | "focus" | "blur" | "change" | "submit";
  readonly elementId: string;
  readonly handler: (event: any) => void;
}

export interface IUIRenderer {
  render(element: UIElement, options: UIRenderOptions): Promise<Result<void>>;

  clear(containerId: string): Promise<Result<void>>;

  addEventHandler(handler: UIEventHandler): Promise<Result<void>>;

  removeEventHandler(
    elementId: string,
    eventType: string,
  ): Promise<Result<void>>;

  updateElement(
    elementId: string,
    updates: Partial<UIElement>,
  ): Promise<Result<void>>;

  addClass(elementId: string, className: string): Promise<Result<void>>;

  removeClass(elementId: string, className: string): Promise<Result<void>>;

  setStyle(
    elementId: string,
    property: string,
    value: string,
  ): Promise<Result<void>>;
}
