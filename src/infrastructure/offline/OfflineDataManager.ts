import { Result } from "../../domain/core/Result";
import { PlatformDetector } from "../utils/PlatformDetector";

/**
 * Offline Storage Strategy
 */
export type OfflineStorageStrategy = "indexeddb" | "localstorage" | "memory";

/**
 * Sync Status
 */
export type SyncStatus = "synced" | "pending" | "conflict" | "error";

/**
 * Offline Data Entry
 */
export interface OfflineDataEntry<T = any> {
  id: string;
  data: T;
  timestamp: number;
  version: number;
  syncStatus: SyncStatus;
  lastSyncAttempt?: number;
  checksum?: string;
  metadata?: Record<string, any>;
}

/**
 * Sync Operation
 */
export interface SyncOperation {
  id: string;
  type: "create" | "update" | "delete";
  collection: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

/**
 * Offline Configuration
 */
export interface OfflineConfig {
  /** Storage strategy to use */
  strategy: OfflineStorageStrategy;
  /** Maximum storage size in MB */
  maxStorageMB: number;
  /** Maximum age of cached data in ms */
  maxAge: number;
  /** Enable automatic sync when online */
  autoSync: boolean;
  /** Sync interval in ms */
  syncIntervalMs: number;
  /** Enable conflict resolution */
  enableConflictResolution: boolean;
  /** Enable compression for large data */
  enableCompression: boolean;
}

/**
 * Storage Interface
 */
interface IOfflineStorage {
  get<T>(key: string): Promise<OfflineDataEntry<T> | null>;
  set<T>(key: string, entry: OfflineDataEntry<T>): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  size(): Promise<number>;
}

/**
 * IndexedDB Storage Implementation
 */
class IndexedDBStorage implements IOfflineStorage {
  private dbName = "ExocortexOfflineDB";
  private version = 1;
  private storeName = "offlineData";
  private db?: IDBDatabase;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: "id" });
          store.createIndex("timestamp", "timestamp");
          store.createIndex("syncStatus", "syncStatus");
        }
      };
    });
  }

  async get<T>(key: string): Promise<OfflineDataEntry<T> | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async set<T>(key: string, entry: OfflineDataEntry<T>): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.put({ ...entry, id: key });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async keys(): Promise<string[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }

  async size(): Promise<number> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.count();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

/**
 * LocalStorage Implementation (fallback)
 */
class LocalStorageStorage implements IOfflineStorage {
  private prefix = "exocortex_offline_";

  async get<T>(key: string): Promise<OfflineDataEntry<T> | null> {
    try {
      const stored = localStorage.getItem(this.prefix + key);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, entry: OfflineDataEntry<T>): Promise<void> {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (error) {
      throw new Error(`LocalStorage quota exceeded: ${error}`);
    }
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key);
  }

  async clear(): Promise<void> {
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith(this.prefix),
    );
    keys.forEach((key) => localStorage.removeItem(key));
  }

  async keys(): Promise<string[]> {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(this.prefix))
      .map((k) => k.substring(this.prefix.length));
  }

  async size(): Promise<number> {
    return (await this.keys()).length;
  }
}

/**
 * Memory Storage Implementation (for testing)
 */
class MemoryStorage implements IOfflineStorage {
  private data = new Map<string, OfflineDataEntry<any>>();

  async get<T>(key: string): Promise<OfflineDataEntry<T> | null> {
    return this.data.get(key) || null;
  }

  async set<T>(key: string, entry: OfflineDataEntry<T>): Promise<void> {
    this.data.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.data.keys());
  }

  async size(): Promise<number> {
    return this.data.size;
  }
}

/**
 * Offline Data Manager
 * Provides offline-first data storage with automatic synchronization
 */
export class OfflineDataManager {
  private storage: IOfflineStorage;
  private config: OfflineConfig;
  private syncQueue: SyncOperation[] = [];
  private isOnline = navigator.onLine;
  private syncInterval?: ReturnType<typeof setInterval>;
  private listeners = new Map<string, Set<(data: any) => void>>();

  constructor(config?: Partial<OfflineConfig>) {
    this.config = {
      strategy: this.detectBestStrategy(),
      maxStorageMB: PlatformDetector.isMobile() ? 50 : 200,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      autoSync: true,
      syncIntervalMs: 30000, // 30 seconds
      enableConflictResolution: true,
      enableCompression: false,
      ...config,
    };

    this.storage = this.createStorage(this.config.strategy);
    this.setupNetworkListeners();
    this.setupAutoSync();
  }

  /**
   * Store data offline
   */
  async store<T>(
    collection: string,
    id: string,
    data: T,
    metadata?: Record<string, any>,
  ): Promise<Result<void>> {
    try {
      const now = Date.now();
      const key = `${collection}:${id}`;

      // Check if entry exists to determine version
      const existing = await this.storage.get<T>(key);
      const version = existing ? existing.version + 1 : 1;

      const entry: OfflineDataEntry<T> = {
        id: key,
        data,
        timestamp: now,
        version,
        syncStatus: "pending",
        checksum: this.calculateChecksum(data),
        metadata,
      };

      await this.storage.set(key, entry);

      // Add to sync queue if auto-sync is enabled
      if (this.config.autoSync) {
        this.addToSyncQueue({
          id: key,
          type: existing ? "update" : "create",
          collection,
          data,
          timestamp: now,
          retryCount: 0,
          maxRetries: 3,
        });
      }

      // Notify listeners
      this.notifyListeners(collection, data);

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to store offline data: ${error}`);
    }
  }

  /**
   * Retrieve data from offline storage
   */
  async retrieve<T>(collection: string, id: string): Promise<Result<T | null>> {
    try {
      const key = `${collection}:${id}`;
      const entry = await this.storage.get<T>(key);

      if (!entry) {
        return Result.ok<T | null>(null);
      }

      // Check if data is too old
      if (Date.now() - entry.timestamp > this.config.maxAge) {
        await this.storage.delete(key);
        return Result.ok<T | null>(null);
      }

      return Result.ok<T | null>(entry.data);
    } catch (error) {
      return Result.fail<T | null>(`Failed to retrieve offline data: ${error}`);
    }
  }

  /**
   * List all items in a collection
   */
  async list<T>(collection: string): Promise<Result<T[]>> {
    try {
      const keys = await this.storage.keys();
      const collectionKeys = keys.filter((k) => k.startsWith(`${collection}:`));

      const items: T[] = [];
      for (const key of collectionKeys) {
        const entry = await this.storage.get<T>(key);
        if (entry && Date.now() - entry.timestamp <= this.config.maxAge) {
          items.push(entry.data);
        }
      }

      return Result.ok<T[]>(items);
    } catch (error) {
      return Result.fail<T[]>(`Failed to list offline data: ${error}`);
    }
  }

  /**
   * Delete data from offline storage
   */
  async delete(collection: string, id: string): Promise<Result<void>> {
    try {
      const key = `${collection}:${id}`;
      await this.storage.delete(key);

      // Add delete operation to sync queue
      if (this.config.autoSync) {
        this.addToSyncQueue({
          id: key,
          type: "delete",
          collection,
          data: null,
          timestamp: Date.now(),
          retryCount: 0,
          maxRetries: 3,
        });
      }

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to delete offline data: ${error}`);
    }
  }

  /**
   * Force synchronization with server
   */
  async sync(): Promise<Result<void>> {
    if (!this.isOnline) {
      return Result.fail<void>("Cannot sync while offline");
    }

    try {
      const operations = [...this.syncQueue];
      const results: Array<{
        success: boolean;
        operation: SyncOperation;
        error?: string;
      }> = [];

      for (const operation of operations) {
        try {
          // Here you would implement actual sync with your backend
          // For now, we'll simulate successful sync
          await this.simulateServerSync(operation);

          // Mark as synced
          if (operation.type !== "delete") {
            const entry = await this.storage.get(operation.id);
            if (entry) {
              entry.syncStatus = "synced";
              entry.lastSyncAttempt = Date.now();
              await this.storage.set(operation.id, entry);
            }
          }

          // Remove from sync queue
          this.removeSyncOperation(operation.id);
          results.push({ success: true, operation });
        } catch (error) {
          operation.retryCount++;
          if (operation.retryCount >= operation.maxRetries) {
            // Mark as error and remove from queue
            const entry = await this.storage.get(operation.id);
            if (entry) {
              entry.syncStatus = "error";
              entry.lastSyncAttempt = Date.now();
              await this.storage.set(operation.id, entry);
            }
            this.removeSyncOperation(operation.id);
          }
          results.push({ success: false, operation, error: String(error) });
        }
      }

      console.log("Sync completed:", results);
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Sync failed: ${error}`);
    }
  }

  /**
   * Get sync status for debugging
   */
  async getSyncStatus(): Promise<{
    pendingOperations: number;
    totalItems: number;
    lastSync: number | null;
    isOnline: boolean;
  }> {
    const totalItems = await this.storage.size();
    return {
      pendingOperations: this.syncQueue.length,
      totalItems,
      lastSync: null, // Could be tracked separately
      isOnline: this.isOnline,
    };
  }

  /**
   * Clear all offline data
   */
  async clearAll(): Promise<Result<void>> {
    try {
      await this.storage.clear();
      this.syncQueue.length = 0;
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to clear offline data: ${error}`);
    }
  }

  /**
   * Subscribe to data changes in a collection
   */
  subscribe<T>(collection: string, listener: (data: T) => void): () => void {
    if (!this.listeners.has(collection)) {
      this.listeners.set(collection, new Set());
    }

    this.listeners.get(collection)!.add(listener);

    // Return unsubscribe function
    return () => {
      const collectionListeners = this.listeners.get(collection);
      if (collectionListeners) {
        collectionListeners.delete(listener);
        if (collectionListeners.size === 0) {
          this.listeners.delete(collection);
        }
      }
    };
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    usedBytes: number;
    totalItems: number;
    oldestItem: number | null;
    newestItem: number | null;
  }> {
    const keys = await this.storage.keys();
    let usedBytes = 0;
    let oldestTimestamp: number | null = null;
    let newestTimestamp: number | null = null;

    for (const key of keys) {
      const entry = await this.storage.get(key);
      if (entry) {
        usedBytes += this.estimateSize(entry);

        if (!oldestTimestamp || entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp;
        }

        if (!newestTimestamp || entry.timestamp > newestTimestamp) {
          newestTimestamp = entry.timestamp;
        }
      }
    }

    return {
      usedBytes,
      totalItems: keys.length,
      oldestItem: oldestTimestamp,
      newestItem: newestTimestamp,
    };
  }

  private detectBestStrategy(): OfflineStorageStrategy {
    // Check IndexedDB support
    if (typeof indexedDB !== "undefined") {
      return "indexeddb";
    }

    // Fallback to localStorage
    if (typeof localStorage !== "undefined") {
      return "localstorage";
    }

    // Final fallback to memory
    return "memory";
  }

  private createStorage(strategy: OfflineStorageStrategy): IOfflineStorage {
    switch (strategy) {
      case "indexeddb":
        return new IndexedDBStorage();
      case "localstorage":
        return new LocalStorageStorage();
      case "memory":
        return new MemoryStorage();
      default:
        throw new Error(`Unknown storage strategy: ${strategy}`);
    }
  }

  private setupNetworkListeners(): void {
    window.addEventListener("online", () => {
      this.isOnline = true;
      console.log("Back online - triggering sync");
      if (this.config.autoSync) {
        this.sync();
      }
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      console.log("Gone offline - entering offline mode");
    });
  }

  private setupAutoSync(): void {
    if (this.config.autoSync) {
      this.syncInterval = setInterval(() => {
        if (this.isOnline && this.syncQueue.length > 0) {
          this.sync();
        }
      }, this.config.syncIntervalMs);
    }
  }

  private addToSyncQueue(operation: SyncOperation): void {
    // Remove any existing operation for the same item
    this.removeSyncOperation(operation.id);
    this.syncQueue.push(operation);
  }

  private removeSyncOperation(id: string): void {
    const index = this.syncQueue.findIndex((op) => op.id === id);
    if (index !== -1) {
      this.syncQueue.splice(index, 1);
    }
  }

  private async simulateServerSync(operation: SyncOperation): Promise<void> {
    // Simulate network delay
    await new Promise((resolve) =>
      setTimeout(resolve, 100 + Math.random() * 200),
    );

    // Simulate occasional failures for testing
    if (Math.random() < 0.1) {
      throw new Error("Simulated server error");
    }

    console.log(`Simulated sync: ${operation.type} ${operation.id}`);
  }

  private calculateChecksum(data: any): string {
    // Simple checksum implementation
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  private estimateSize(entry: OfflineDataEntry): number {
    return new Blob([JSON.stringify(entry)]).size;
  }

  private notifyListeners(collection: string, data: any): void {
    const collectionListeners = this.listeners.get(collection);
    if (collectionListeners) {
      collectionListeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.warn("Error in offline data listener:", error);
        }
      });
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    window.removeEventListener("online", this.setupNetworkListeners);
    window.removeEventListener("offline", this.setupNetworkListeners);

    this.listeners.clear();
  }
}
