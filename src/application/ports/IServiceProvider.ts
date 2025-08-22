/**
 * Service Provider abstraction following Creator Pattern (GRASP)
 * Responsible for creating and providing services
 */
export interface IServiceProvider {
  /**
   * Initialize all services
   */
  initializeServices(): Promise<void>;

  /**
   * Get a service by type
   */
  getService<T>(serviceType: string): T;

  /**
   * Check if service is available
   */
  hasService(serviceType: string): boolean;

  /**
   * Cleanup all services
   */
  cleanup(): Promise<void>;
}