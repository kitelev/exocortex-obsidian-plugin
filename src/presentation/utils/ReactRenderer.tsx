import React from "react";
import { createRoot, Root } from "react-dom/client";

/**
 * Utility for rendering React components in Obsidian plugin containers
 */
export class ReactRenderer {
  private roots: Map<HTMLElement, Root> = new Map();

  /**
   * Render a React component into an HTMLElement
   */
  render(element: HTMLElement, component: React.ReactElement): void {
    // Clean up existing root if any
    this.unmount(element);

    // Create new root and render
    const root = createRoot(element);
    root.render(component);
    this.roots.set(element, root);
  }

  /**
   * Unmount a React component from an HTMLElement
   */
  unmount(element: HTMLElement): void {
    const root = this.roots.get(element);
    if (root) {
      root.unmount();
      this.roots.delete(element);
    }
  }

  /**
   * Clean up all roots
   */
  cleanup(): void {
    this.roots.forEach((root) => root.unmount());
    this.roots.clear();
  }
}
