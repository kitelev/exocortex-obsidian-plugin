interface EventListenerRecord {
  element: HTMLElement;
  type: string;
  handler: EventListener;
}

export class EventListenerManager {
  private listeners: EventListenerRecord[] = [];

  register(element: HTMLElement, type: string, handler: EventListener): void {
    element.addEventListener(type, handler);
    this.listeners.push({ element, type, handler });
  }

  cleanup(): void {
    this.listeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    this.listeners = [];
  }

  getListenerCount(): number {
    return this.listeners.length;
  }
}
