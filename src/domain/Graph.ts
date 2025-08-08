export interface Triple {
    subject: string;
    predicate: string;
    object: string;
}

export class Graph {
    private triples: Set<string> = new Set();
    private index: Map<string, Triple[]> = new Map();
    
    add(triple: Triple): void {
        const key = `${triple.subject}|${triple.predicate}|${triple.object}`;
        if (!this.triples.has(key)) {
            this.triples.add(key);
            
            // Index by subject
            if (!this.index.has(triple.subject)) {
                this.index.set(triple.subject, []);
            }
            this.index.get(triple.subject)!.push(triple);
        }
    }
    
    remove(triple: Triple): void {
        const key = `${triple.subject}|${triple.predicate}|${triple.object}`;
        this.triples.delete(key);
        
        // Update index
        const subjectTriples = this.index.get(triple.subject);
        if (subjectTriples) {
            const filtered = subjectTriples.filter(t => 
                t.predicate !== triple.predicate || t.object !== triple.object
            );
            if (filtered.length > 0) {
                this.index.set(triple.subject, filtered);
            } else {
                this.index.delete(triple.subject);
            }
        }
    }
    
    match(subject: string | null, predicate: string | null, object: string | null): Triple[] {
        const results: Triple[] = [];
        
        if (subject) {
            const subjectTriples = this.index.get(subject) || [];
            for (const triple of subjectTriples) {
                if ((!predicate || triple.predicate === predicate) &&
                    (!object || triple.object === object)) {
                    results.push(triple);
                }
            }
        } else {
            // Full scan
            for (const key of this.triples) {
                const [s, p, o] = key.split('|');
                if ((!predicate || p === predicate) &&
                    (!object || o === object)) {
                    results.push({ subject: s, predicate: p, object: o });
                }
            }
        }
        
        return results;
    }
    
    clear(): void {
        this.triples.clear();
        this.index.clear();
    }
    
    get size(): number {
        return this.triples.size;
    }
}
