import { DomainEvent } from "../core/Entity";
import { ILogger } from "../../infrastructure/logging/ILogger";
import { LoggerFactory } from "../../infrastructure/logging/LoggerFactory";

/**
 * Domain event handler interface
 */
export interface IDomainEventHandler<T extends DomainEvent = DomainEvent> {
  handle(event: T): Promise<void>;
}

/**
 * Domain event subscription
 */
interface EventSubscription {
  eventType: string;
  handler: IDomainEventHandler;
  priority: number;
}

/**
 * Event processing options
 */
export interface EventProcessingOptions {
  async?: boolean;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * Event processing result
 */
export interface EventProcessingResult {
  eventType: string;
  success: boolean;
  error?: string;
  processingTime: number;
  handlerResults: Array<{
    handlerName: string;
    success: boolean;
    error?: string;
    executionTime: number;
  }>;
}

/**
 * Domain event bus for decoupled communication between aggregates
 * Implements the Observer pattern for domain events
 */
export class DomainEventBus {
  private logger: ILogger;
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private eventHistory: DomainEvent[] = [];
  private maxHistorySize: number = 1000;
  private isProcessing: boolean = false;
  private eventQueue: Array<{
    event: DomainEvent;
    options?: EventProcessingOptions;
  }> = [];

  constructor() {
    this.logger = LoggerFactory.createForClass(DomainEventBus);
  }

  /**
   * Subscribe to a specific event type
   */
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: IDomainEventHandler<T>,
    priority: number = 0,
  ): void {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }

    const subscription: EventSubscription = {
      eventType,
      handler: handler as IDomainEventHandler,
      priority,
    };

    const subscriptions = this.subscriptions.get(eventType)!;
    subscriptions.push(subscription);

    // Sort by priority (higher priority first)
    subscriptions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Unsubscribe from an event type
   */
  unsubscribe(eventType: string, handler: IDomainEventHandler): void {
    const subscriptions = this.subscriptions.get(eventType);
    if (!subscriptions) return;

    const index = subscriptions.findIndex((sub) => sub.handler === handler);
    if (index >= 0) {
      subscriptions.splice(index, 1);
    }

    if (subscriptions.length === 0) {
      this.subscriptions.delete(eventType);
    }
  }

  /**
   * Publish an event to all subscribers
   */
  async publish(
    event: DomainEvent,
    options: EventProcessingOptions = {},
  ): Promise<EventProcessingResult> {
    // Add to history
    this.addToHistory(event);

    const startTime = Date.now();
    const result: EventProcessingResult = {
      eventType: event.eventType,
      success: true,
      processingTime: 0,
      handlerResults: [],
    };

    if (options.async) {
      // Queue for async processing
      this.eventQueue.push({ event, options });
      this.processQueueAsync();
      return result;
    }

    try {
      await this.processEvent(event, options, result);
    } catch (error) {
      result.success = false;
      result.error = `Event processing failed: ${error}`;
    }

    result.processingTime = Date.now() - startTime;
    return result;
  }

  /**
   * Publish multiple events in batch
   */
  async publishBatch(
    events: DomainEvent[],
    options: EventProcessingOptions = {},
  ): Promise<EventProcessingResult[]> {
    const results: EventProcessingResult[] = [];

    for (const event of events) {
      const result = await this.publish(event, options);
      results.push(result);

      // Stop processing if an event fails and we're not in async mode
      if (!result.success && !options.async) {
        break;
      }
    }

    return results;
  }

  /**
   * Get all subscribers for an event type
   */
  getSubscribers(eventType: string): IDomainEventHandler[] {
    const subscriptions = this.subscriptions.get(eventType) || [];
    return subscriptions.map((sub) => sub.handler);
  }

  /**
   * Get all registered event types
   */
  getEventTypes(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Get event history
   */
  getEventHistory(eventType?: string): DomainEvent[] {
    if (eventType) {
      return this.eventHistory.filter((event) => event.eventType === eventType);
    }
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get statistics about the event bus
   */
  getStatistics(): {
    totalSubscriptions: number;
    eventTypes: number;
    historySize: number;
    queueSize: number;
    isProcessing: boolean;
  } {
    const totalSubscriptions = Array.from(this.subscriptions.values()).reduce(
      (total, subs) => total + subs.length,
      0,
    );

    return {
      totalSubscriptions,
      eventTypes: this.subscriptions.size,
      historySize: this.eventHistory.length,
      queueSize: this.eventQueue.length,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Wait for all queued events to be processed
   */
  async waitForCompletion(): Promise<void> {
    while (this.eventQueue.length > 0 || this.isProcessing) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.subscriptions.clear();
    this.eventQueue = [];
    this.eventHistory = [];
  }

  /**
   * Process a single event
   */
  private async processEvent(
    event: DomainEvent,
    options: EventProcessingOptions,
    result: EventProcessingResult,
  ): Promise<void> {
    const subscriptions = this.subscriptions.get(event.eventType) || [];

    for (const subscription of subscriptions) {
      const handlerStartTime = Date.now();
      const handlerResult: {
        handlerName: string;
        success: boolean;
        executionTime: number;
        error?: string;
      } = {
        handlerName: subscription.handler.constructor.name,
        success: true,
        executionTime: 0,
      };

      try {
        const timeout = options.timeout || 5000;
        await this.executeWithTimeout(
          () => subscription.handler.handle(event),
          timeout,
        );
      } catch (error) {
        handlerResult.success = false;
        handlerResult.error = String(error);
        result.success = false;

        // Implement retry logic if specified
        if (options.retryCount && options.retryCount > 0) {
          const retrySuccess = await this.retryHandler(
            subscription.handler,
            event,
            options.retryCount,
            options.retryDelay || 1000,
          );

          if (retrySuccess) {
            handlerResult.success = true;
            delete handlerResult.error;
            result.success = true;
          }
        }
      }

      handlerResult.executionTime = Date.now() - handlerStartTime;
      result.handlerResults.push(handlerResult);
    }
  }

  /**
   * Process event queue asynchronously
   */
  private async processQueueAsync(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.eventQueue.length > 0) {
        const { event, options } = this.eventQueue.shift()!;
        const result: EventProcessingResult = {
          eventType: event.eventType,
          success: true,
          processingTime: 0,
          handlerResults: [],
        };

        try {
          await this.processEvent(event, options || {}, result);
        } catch (error) {
          this.logger.error('Async event processing failed', {
            eventType: event.eventType,
            queueSize: this.eventQueue.length
          }, error as Error);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute handler with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      operation()
        .then((result) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Retry handler execution
   */
  private async retryHandler(
    handler: IDomainEventHandler,
    event: DomainEvent,
    retryCount: number,
    retryDelay: number,
  ): Promise<boolean> {
    for (let i = 0; i < retryCount; i++) {
      try {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        await handler.handle(event);
        return true;
      } catch (error) {
        this.logger.warn('Event handler retry failed', {
          handlerName: handler.constructor.name,
          retry: `${i + 1}/${retryCount}`,
          eventType: event.eventType
        });
      }
    }
    return false;
  }

  /**
   * Add event to history with size management
   */
  private addToHistory(event: DomainEvent): void {
    this.eventHistory.push(event);

    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }
}

/**
 * Singleton instance of the domain event bus
 */
export const domainEventBus = new DomainEventBus();
