/**
 * Lifecycle Manager abstraction following Pure Fabrication Pattern (GRASP)
 * Handles specific lifecycle concerns with single responsibility
 */
export interface ILifecycleManager {
  /**
   * Initialize the lifecycle component
   */
  initialize(): Promise<void>;

  /**
   * Cleanup the lifecycle component
   */
  cleanup(): Promise<void>;

  /**
   * Get manager identifier for logging/debugging
   */
  getManagerId(): string;
}
