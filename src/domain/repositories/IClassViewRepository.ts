import { ClassView } from '../aggregates/ClassView';
import { ClassName } from '../value-objects/ClassName';
import { AssetId } from '../value-objects/AssetId';
import { Result } from '../core/Result';

/**
 * Repository interface for ClassView aggregate
 * Following DDD - repositories handle aggregate persistence
 */
export interface IClassViewRepository {
    /**
     * Find ClassView configuration for a specific class
     */
    findByClassName(className: ClassName): Promise<Result<ClassView | null>>;

    /**
     * Find ClassView by its ID
     */
    findById(id: AssetId): Promise<Result<ClassView | null>>;

    /**
     * Save or update a ClassView
     */
    save(classView: ClassView): Promise<Result<void>>;

    /**
     * Delete a ClassView
     */
    delete(id: AssetId): Promise<Result<void>>;

    /**
     * Find all ClassViews
     */
    findAll(): Promise<Result<ClassView[]>>;

    /**
     * Check if a ClassView exists for a class
     */
    exists(className: ClassName): Promise<Result<boolean>>;
}