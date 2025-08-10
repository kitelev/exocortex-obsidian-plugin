import { Graph, Triple } from './Graph';

/**
 * Indexed Graph implementation for high-performance triple operations
 * Uses multiple indexes for O(1) lookups
 * Note: Extends Graph but overrides storage mechanism
 */
export class IndexedGraph extends Graph {
    // Override parent's private storage with our own
    private indexedTriples: Set<Triple> = new Set();
    // SPO Index: subject -> predicate -> object -> triple
    private spoIndex: Map<string, Map<string, Map<string, Triple>>> = new Map();
    
    // POS Index: predicate -> object -> subject -> triple
    private posIndex: Map<string, Map<string, Map<string, Triple>>> = new Map();
    
    // OSP Index: object -> subject -> predicate -> triple
    private ospIndex: Map<string, Map<string, Map<string, Triple>>> = new Map();
    
    // Predicate statistics
    private predicateStats: Map<string, number> = new Map();
    
    // Class instances index: class -> Set of subjects
    private classIndex: Map<string, Set<string>> = new Map();
    
    // Property values index: property -> value -> Set of subjects
    private propertyValueIndex: Map<string, Map<string, Set<string>>> = new Map();
    
    // Timestamp index for temporal queries
    private temporalIndex: Map<string, Triple[]> = new Map();
    
    constructor() {
        super();
    }
    
    /**
     * Add triple with indexing
     */
    add(triple: Triple): void {
        // Check if triple already exists
        if (this.hasTriple(triple)) {
            return;
        }
        
        // Add to our storage
        this.indexedTriples.add(triple);
        // Also add to parent for compatibility
        super.add(triple);
        // Add to indexes
        this.indexTriple(triple);
    }
    
    /**
     * Remove triple with index cleanup
     */
    remove(triple: Triple): void {
        if (!this.hasTriple(triple)) {
            return;
        }
        
        // Remove from our storage (need to find the exact object)
        for (const t of this.indexedTriples) {
            if (t.subject === triple.subject && 
                t.predicate === triple.predicate && 
                t.object === triple.object) {
                this.indexedTriples.delete(t);
                break;
            }
        }
        // Also remove from parent
        super.remove(triple);
        // Remove from indexes
        this.unindexTriple(triple);
    }
    
    /**
     * Optimized match using indexes
     */
    match(subject: string | null, predicate: string | null, object: string | null): Triple[] {
        // Use most selective index based on pattern
        if (subject && predicate && object) {
            // Exact match - use SPO index
            return this.exactMatch(subject, predicate, object);
        } else if (subject && predicate) {
            // SP pattern - use SPO index
            return this.matchSP(subject, predicate);
        } else if (predicate && object) {
            // PO pattern - use POS index
            return this.matchPO(predicate, object);
        } else if (subject && object) {
            // SO pattern - use OSP index
            return this.matchSO(subject, object);
        } else if (subject) {
            // S pattern - use SPO index
            return this.matchS(subject);
        } else if (predicate) {
            // P pattern - use POS index
            return this.matchP(predicate);
        } else if (object) {
            // O pattern - use OSP index
            return this.matchO(object);
        } else {
            // Return all triples
            return Array.from(this.indexedTriples);
        }
    }
    
    /**
     * Get all instances of a class
     */
    getClassInstances(className: string): string[] {
        const cleanName = className.replace(/\[\[|\]\]/g, '');
        return Array.from(this.classIndex.get(cleanName) || new Set());
    }
    
    /**
     * Get subjects by property value
     */
    getSubjectsByPropertyValue(property: string, value: string): string[] {
        const valueMap = this.propertyValueIndex.get(property);
        if (!valueMap) return [];
        
        const subjects = valueMap.get(value);
        return subjects ? Array.from(subjects) : [];
    }
    
    /**
     * Get predicate statistics
     */
    getPredicateStats(): Map<string, number> {
        return new Map(this.predicateStats);
    }
    
    /**
     * Get most used predicates
     */
    getTopPredicates(limit: number = 10): Array<{ predicate: string; count: number }> {
        return Array.from(this.predicateStats.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([predicate, count]) => ({ predicate, count }));
    }
    
    /**
     * Clear all indexes
     */
    clear(): void {
        super.clear();
        this.indexedTriples.clear();
        this.clearIndexes();
    }
    
    /**
     * Rebuild all indexes from scratch
     */
    rebuildIndexes(): void {
        this.clearIndexes();
        for (const triple of this.indexedTriples) {
            this.indexTriple(triple);
        }
    }
    
    /**
     * Get index statistics
     */
    getIndexStats(): {
        totalTriples: number;
        spoIndexSize: number;
        posIndexSize: number;
        ospIndexSize: number;
        classCount: number;
        predicateCount: number;
        uniqueSubjects: number;
        uniqueObjects: number;
    } {
        const uniqueSubjects = new Set<string>();
        const uniqueObjects = new Set<string>();
        
        for (const triple of this.indexedTriples) {
            uniqueSubjects.add(triple.subject);
            uniqueObjects.add(triple.object);
        }
        
        return {
            totalTriples: this.size,
            spoIndexSize: this.countNestedMaps(this.spoIndex),
            posIndexSize: this.countNestedMaps(this.posIndex),
            ospIndexSize: this.countNestedMaps(this.ospIndex),
            classCount: this.classIndex.size,
            predicateCount: this.predicateStats.size,
            uniqueSubjects: uniqueSubjects.size,
            uniqueObjects: uniqueObjects.size
        };
    }
    
    // Private indexing methods
    
    private indexTriple(triple: Triple): void {
        const { subject, predicate, object } = triple;
        
        // SPO Index
        if (!this.spoIndex.has(subject)) {
            this.spoIndex.set(subject, new Map());
        }
        const spoP = this.spoIndex.get(subject)!;
        if (!spoP.has(predicate)) {
            spoP.set(predicate, new Map());
        }
        spoP.get(predicate)!.set(object, triple);
        
        // POS Index
        if (!this.posIndex.has(predicate)) {
            this.posIndex.set(predicate, new Map());
        }
        const posO = this.posIndex.get(predicate)!;
        if (!posO.has(object)) {
            posO.set(object, new Map());
        }
        posO.get(object)!.set(subject, triple);
        
        // OSP Index
        if (!this.ospIndex.has(object)) {
            this.ospIndex.set(object, new Map());
        }
        const ospS = this.ospIndex.get(object)!;
        if (!ospS.has(subject)) {
            ospS.set(subject, new Map());
        }
        ospS.get(subject)!.set(predicate, triple);
        
        // Update predicate statistics
        this.predicateStats.set(predicate, (this.predicateStats.get(predicate) || 0) + 1);
        
        // Update class index if it's a type assertion
        if (predicate === 'a' || predicate === 'rdf:type' || predicate === 'exo__Instance_class') {
            const className = object.replace(/\[\[|\]\]/g, '');
            if (!this.classIndex.has(className)) {
                this.classIndex.set(className, new Set());
            }
            this.classIndex.get(className)!.add(subject);
        }
        
        // Update property value index
        if (!this.propertyValueIndex.has(predicate)) {
            this.propertyValueIndex.set(predicate, new Map());
        }
        const valueMap = this.propertyValueIndex.get(predicate)!;
        if (!valueMap.has(object)) {
            valueMap.set(object, new Set());
        }
        valueMap.get(object)!.add(subject);
        
        // Update temporal index if it's a date property
        if (this.isDateProperty(predicate) && this.isDateValue(object)) {
            const dateKey = this.extractDateKey(object);
            if (!this.temporalIndex.has(dateKey)) {
                this.temporalIndex.set(dateKey, []);
            }
            this.temporalIndex.get(dateKey)!.push(triple);
        }
    }
    
    private unindexTriple(triple: Triple): void {
        const { subject, predicate, object } = triple;
        
        // Remove from SPO Index
        const spoP = this.spoIndex.get(subject);
        if (spoP) {
            const spoO = spoP.get(predicate);
            if (spoO) {
                spoO.delete(object);
                if (spoO.size === 0) spoP.delete(predicate);
            }
            if (spoP.size === 0) this.spoIndex.delete(subject);
        }
        
        // Remove from POS Index
        const posO = this.posIndex.get(predicate);
        if (posO) {
            const posS = posO.get(object);
            if (posS) {
                posS.delete(subject);
                if (posS.size === 0) posO.delete(object);
            }
            if (posO.size === 0) this.posIndex.delete(predicate);
        }
        
        // Remove from OSP Index
        const ospS = this.ospIndex.get(object);
        if (ospS) {
            const ospP = ospS.get(subject);
            if (ospP) {
                ospP.delete(predicate);
                if (ospP.size === 0) ospS.delete(subject);
            }
            if (ospS.size === 0) this.ospIndex.delete(object);
        }
        
        // Update predicate statistics
        const count = this.predicateStats.get(predicate);
        if (count && count > 1) {
            this.predicateStats.set(predicate, count - 1);
        } else {
            this.predicateStats.delete(predicate);
        }
        
        // Update class index
        if (predicate === 'a' || predicate === 'rdf:type' || predicate === 'exo__Instance_class') {
            const className = object.replace(/\[\[|\]\]/g, '');
            const instances = this.classIndex.get(className);
            if (instances) {
                instances.delete(subject);
                if (instances.size === 0) {
                    this.classIndex.delete(className);
                }
            }
        }
        
        // Update property value index
        const valueMap = this.propertyValueIndex.get(predicate);
        if (valueMap) {
            const subjects = valueMap.get(object);
            if (subjects) {
                subjects.delete(subject);
                if (subjects.size === 0) {
                    valueMap.delete(object);
                }
            }
            if (valueMap.size === 0) {
                this.propertyValueIndex.delete(predicate);
            }
        }
        
        // Update temporal index
        if (this.isDateProperty(predicate) && this.isDateValue(object)) {
            const dateKey = this.extractDateKey(object);
            const dateTriples = this.temporalIndex.get(dateKey);
            if (dateTriples) {
                const index = dateTriples.findIndex(t => 
                    t.subject === subject && t.predicate === predicate && t.object === object
                );
                if (index !== -1) {
                    dateTriples.splice(index, 1);
                }
                if (dateTriples.length === 0) {
                    this.temporalIndex.delete(dateKey);
                }
            }
        }
    }
    
    private clearIndexes(): void {
        this.spoIndex.clear();
        this.posIndex.clear();
        this.ospIndex.clear();
        this.predicateStats.clear();
        this.classIndex.clear();
        this.propertyValueIndex.clear();
        this.temporalIndex.clear();
    }
    
    // Query optimization methods
    
    private exactMatch(subject: string, predicate: string, object: string): Triple[] {
        const spoP = this.spoIndex.get(subject);
        if (!spoP) return [];
        
        const spoO = spoP.get(predicate);
        if (!spoO) return [];
        
        const triple = spoO.get(object);
        return triple ? [triple] : [];
    }
    
    private matchSP(subject: string, predicate: string): Triple[] {
        const spoP = this.spoIndex.get(subject);
        if (!spoP) return [];
        
        const spoO = spoP.get(predicate);
        if (!spoO) return [];
        
        return Array.from(spoO.values());
    }
    
    private matchPO(predicate: string, object: string): Triple[] {
        const posO = this.posIndex.get(predicate);
        if (!posO) return [];
        
        const posS = posO.get(object);
        if (!posS) return [];
        
        return Array.from(posS.values());
    }
    
    private matchSO(subject: string, object: string): Triple[] {
        const ospS = this.ospIndex.get(object);
        if (!ospS) return [];
        
        const ospP = ospS.get(subject);
        if (!ospP) return [];
        
        return Array.from(ospP.values());
    }
    
    private matchS(subject: string): Triple[] {
        const spoP = this.spoIndex.get(subject);
        if (!spoP) return [];
        
        const results: Triple[] = [];
        for (const spoO of spoP.values()) {
            results.push(...spoO.values());
        }
        return results;
    }
    
    private matchP(predicate: string): Triple[] {
        const posO = this.posIndex.get(predicate);
        if (!posO) return [];
        
        const results: Triple[] = [];
        for (const posS of posO.values()) {
            results.push(...posS.values());
        }
        return results;
    }
    
    private matchO(object: string): Triple[] {
        const ospS = this.ospIndex.get(object);
        if (!ospS) return [];
        
        const results: Triple[] = [];
        for (const ospP of ospS.values()) {
            results.push(...ospP.values());
        }
        return results;
    }
    
    private hasTriple(triple: Triple): boolean {
        const { subject, predicate, object } = triple;
        const spoP = this.spoIndex.get(subject);
        if (!spoP) return false;
        
        const spoO = spoP.get(predicate);
        if (!spoO) return false;
        
        return spoO.has(object);
    }
    
    // Helper methods
    
    private countNestedMaps(index: Map<string, Map<string, Map<string, any>>>): number {
        let count = 0;
        for (const level1 of index.values()) {
            for (const level2 of level1.values()) {
                count += level2.size;
            }
        }
        return count;
    }
    
    private isDateProperty(predicate: string): boolean {
        const dateProperties = [
            'exo__Asset_createdAt',
            'exo__Asset_updatedAt',
            'ems__Task_dueDate',
            'ems__Event_date',
            'ems__Task_completedAt'
        ];
        return dateProperties.includes(predicate);
    }
    
    private isDateValue(value: string): boolean {
        // Simple check for ISO date format
        return /^\d{4}-\d{2}-\d{2}/.test(value);
    }
    
    private extractDateKey(dateValue: string): string {
        // Extract YYYY-MM-DD from date value
        const match = dateValue.match(/^(\d{4}-\d{2}-\d{2})/);
        return match ? match[1] : dateValue;
    }
}