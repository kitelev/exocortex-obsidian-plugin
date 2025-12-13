interface EventListenerRecord {
  element: HTMLElement;
  type: string;
  handler: EventListener;
}

export class EventListenerManager {
  private listeners: EventListenerRecord[] = [];

  /**
   * Registers an event listener on an element and tracks it for cleanup.
   * @returns Unsubscribe function to remove this specific listener
   */
  register(element: HTMLElement, type: string, handler: EventListener): () => void {
    element.addEventListener(type, handler);
    this.listeners.push({ element, type, handler });

    // Return unsubscribe function
    return () => this.unregister(element, type, handler);
  }

  /**
   * Unregisters a specific event listener.
   * @returns true if the listener was found and removed, false otherwise
   */
  unregister(element: HTMLElement, type: string, handler: EventListener): boolean {
    const index = this.listeners.findIndex(
      (record) =>
        record.element === element &&
        record.type === type &&
        record.handler === handler
    );

    if (index !== -1) {
      element.removeEventListener(type, handler);
      this.listeners.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Removes all registered event listeners.
   * Should be called in component unmount or plugin unload.
   */
  cleanup(): void {
    this.listeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    this.listeners = [];
  }

  /**
   * Returns the total number of tracked listeners.
   */
  getListenerCount(): number {
    return this.listeners.length;
  }
}
