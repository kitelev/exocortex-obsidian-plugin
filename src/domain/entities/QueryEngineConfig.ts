import { Entity } from "../core/Entity";
import { Result } from "../core/Result";
import { QueryEngineType } from "../ports/IQueryEngine";

export interface QueryEngineConfigProps {
  id: string;
  preferredEngine: QueryEngineType;
  fallbackEngine?: QueryEngineType;
  autoDetect: boolean;
  enableCache: boolean;
  cacheTimeout?: number; // minutes
  maxCacheSize?: number; // number of cached results
}

/**
 * Query Engine Configuration Entity
 * Manages preferences and settings for query engine selection
 */
export class QueryEngineConfig extends Entity<QueryEngineConfigProps> {
  private constructor(props: QueryEngineConfigProps) {
    super(props);
  }

  public static create(
    props: QueryEngineConfigProps,
  ): Result<QueryEngineConfig> {
    if (!props.id || props.id.trim().length === 0) {
      return Result.fail<QueryEngineConfig>("Config ID is required");
    }

    if (!props.preferredEngine) {
      return Result.fail<QueryEngineConfig>("Preferred engine is required");
    }

    // Set reasonable defaults
    const configProps: QueryEngineConfigProps = {
      ...props,
      autoDetect: props.autoDetect ?? true,
      enableCache: props.enableCache ?? true,
      cacheTimeout: props.cacheTimeout ?? 30,
      maxCacheSize: props.maxCacheSize ?? 100,
    };

    return Result.ok<QueryEngineConfig>(new QueryEngineConfig(configProps));
  }

  public static createDefault(): Result<QueryEngineConfig> {
    return QueryEngineConfig.create({
      id: "default",
      preferredEngine: "dataview",
      fallbackEngine: "datacore",
      autoDetect: true,
      enableCache: true,
      cacheTimeout: 30,
      maxCacheSize: 100,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get preferredEngine(): QueryEngineType {
    return this.props.preferredEngine;
  }

  get fallbackEngine(): QueryEngineType | undefined {
    return this.props.fallbackEngine;
  }

  get autoDetect(): boolean {
    return this.props.autoDetect;
  }

  get enableCache(): boolean {
    return this.props.enableCache;
  }

  get cacheTimeout(): number {
    return this.props.cacheTimeout ?? 30;
  }

  get maxCacheSize(): number {
    return this.props.maxCacheSize ?? 100;
  }

  public updatePreferredEngine(engine: QueryEngineType): Result<void> {
    this.props.preferredEngine = engine;
    return Result.ok<void>();
  }

  public updateFallbackEngine(engine?: QueryEngineType): Result<void> {
    this.props.fallbackEngine = engine;
    return Result.ok<void>();
  }

  public toggleAutoDetect(): void {
    this.props.autoDetect = !this.props.autoDetect;
  }

  public toggleCache(): void {
    this.props.enableCache = !this.props.enableCache;
  }

  public updateCacheSettings(timeout: number, maxSize: number): Result<void> {
    if (timeout < 1) {
      return Result.fail<void>("Cache timeout must be at least 1 minute");
    }

    if (maxSize < 1) {
      return Result.fail<void>("Max cache size must be at least 1");
    }

    this.props.cacheTimeout = timeout;
    this.props.maxCacheSize = maxSize;
    return Result.ok<void>();
  }
}
