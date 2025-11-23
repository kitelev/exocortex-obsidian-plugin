import { IEventBus } from "@exocortex/core";

type EventHandler<T = any> = (data: T) => void;

export class ObsidianEventBus implements IEventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  publish<T = any>(eventName: string, data: T): void {
    const eventHandlers = this.handlers.get(eventName);
    if (eventHandlers) {
      eventHandlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[EventBus] Error in handler for event "${eventName}":`, error);
        }
      });
    }
  }

  subscribe<T = any>(eventName: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    const handlers = this.handlers.get(eventName);
    if (handlers) {
      handlers.add(handler as EventHandler);
    }

    return () => this.unsubscribe(eventName, handler);
  }

  unsubscribe(eventName: string, handler: EventHandler): void {
    const eventHandlers = this.handlers.get(eventName);
    if (eventHandlers) {
      eventHandlers.delete(handler);

      if (eventHandlers.size === 0) {
        this.handlers.delete(eventName);
      }
    }
  }
}
