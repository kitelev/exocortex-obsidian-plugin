/**
 * Simple Dependency Injection Container
 * Following Inversion of Control principle
 */
export class Container {
    private static instance: Container;
    private services: Map<string, any> = new Map();
    private factories: Map<string, () => any> = new Map();

    private constructor() {}

    public static getInstance(): Container {
        if (!Container.instance) {
            Container.instance = new Container();
        }
        return Container.instance;
    }

    /**
     * Register a service factory
     */
    public register<T>(token: string, factory: () => T): void {
        this.factories.set(token, factory);
    }

    /**
     * Register a singleton service
     */
    public registerSingleton<T>(token: string, service: T): void {
        this.services.set(token, service);
    }

    /**
     * Resolve a service
     */
    public resolve<T>(token: string): T {
        // Check if we have a singleton
        if (this.services.has(token)) {
            return this.services.get(token);
        }

        // Check if we have a factory
        if (this.factories.has(token)) {
            const factory = this.factories.get(token);
            if (factory) {
                const service = factory();
                
                // Optionally cache as singleton
                // this.services.set(token, service);
                
                return service;
            }
        }

        throw new Error(`Service not found: ${token}`);
    }

    /**
     * Check if a service is registered
     */
    public has(token: string): boolean {
        return this.services.has(token) || this.factories.has(token);
    }

    /**
     * Clear all registrations
     */
    public clear(): void {
        this.services.clear();
        this.factories.clear();
    }
}