import type { IEventBus } from "@exocortex/core";
import { LoggerFactory } from "../../adapters/logging/LoggerFactory";

type EventHandler<T = unknown> = (data: T) => void;

const logger = LoggerFactory.create("ObsidianEventBus");

export class ObsidianEventBus implements IEventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  publish<T>(eventName: string, data: T): void {
    const eventHandlers = this.handlers.get(eventName);
    if (eventHandlers) {
      eventHandlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          logger.error(`Error in handler for event "${eventName}"`, error instanceof Error ? error : new Error(String(error)));
        }
      });
    }
  }

  subscribe<T>(eventName: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    const handlers = this.handlers.get(eventName);
    if (handlers) {
      handlers.add(handler as EventHandler);
    }

    return () => this.unsubscribe(eventName, handler as EventHandler<unknown>);
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
