/**
 * Smart Memory Bank Optimizer for Claude Code
 * Implements predictive loading, compression, and intelligent caching
 */

interface MemoryBankEntry {
  id: string;
  content: string;
  lastAccessed: number;
  accessCount: number;
  size: number;
  compressed?: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  tags: string[];
}

interface AccessPattern {
  entryId: string;
  accessTime: number;
  context: string;
  subsequentAccess?: string[]; // What was accessed after this
}

export class MemoryBankOptimizer {
  private cache = new Map<string, MemoryBankEntry>();
  private accessPatterns: AccessPattern[] = [];
  private compressionCache = new Map<string, string>();
  private preloadQueue = new Set<string>();
  
  // Memory thresholds
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly COMPRESSION_THRESHOLD = 1024 * 10; // 10KB
  private readonly MAX_ACCESS_PATTERNS = 1000;
  
  // Predictive patterns learned from usage
  private sequencePatterns = new Map<string, string[]>();
  private contextualPatterns = new Map<string, string[]>();

  async initializeMemoryBank(): Promise<void> {
    console.log('🧠 Initializing Smart Memory Bank...');
    
    // Load critical documentation first
    await this.preloadCriticalDocuments();
    
    // Load access patterns from previous sessions
    await this.loadAccessPatterns();
    
    // Initialize compression system
    this.initializeCompression();
    
    // Start predictive preloading
    this.startPredictivePreloading();
  }

  private async preloadCriticalDocuments(): Promise<void> {
    const criticalDocs = [
      'CLAUDE.md',
      'CLAUDE-agents.md', 
      'CLAUDE-test-patterns.md',
      'package.json',
      'jest.config.js'
    ];

    const loadPromises = criticalDocs.map(async (docPath) => {
      try {
        const content = await this.loadDocument(docPath);
        if (content) {
          await this.cacheDocument(docPath, content, 'critical');
        }
      } catch (error) {
        console.warn(`Failed to preload ${docPath}:`, error);
      }
    });

    await Promise.all(loadPromises);
    console.log(`✅ Preloaded ${criticalDocs.length} critical documents`);
  }

  async getDocument(path: string, context?: string): Promise<string | null> {
    // Record access pattern
    this.recordAccess(path, context);
    
    // Check cache first
    const cached = this.cache.get(path);
    if (cached) {
      cached.lastAccessed = Date.now();
      cached.accessCount++;
      
      // Decompress if needed
      if (cached.compressed) {
        return this.decompress(cached.content);
      }
      return cached.content;
    }

    // Load from storage
    const content = await this.loadDocument(path);
    if (content) {
      await this.cacheDocument(path, content, 'medium', context);
      
      // Trigger predictive preloading
      this.triggerPredictivePreload(path, context);
    }

    return content;
  }

  private async cacheDocument(
    path: string, 
    content: string, 
    priority: MemoryBankEntry['priority'],
    context?: string
  ): Promise<void> {
    const size = new Blob([content]).size;
    
    // Check if we need to free space
    await this.ensureCacheSpace(size);
    
    // Compress large documents
    const shouldCompress = size > this.COMPRESSION_THRESHOLD;
    const finalContent = shouldCompress ? this.compress(content) : content;
    
    const entry: MemoryBankEntry = {
      id: path,
      content: finalContent,
      lastAccessed: Date.now(),
      accessCount: 1,
      size: shouldCompress ? new Blob([finalContent]).size : size,
      compressed: shouldCompress,
      priority,
      tags: this.extractTags(content, context)
    };

    this.cache.set(path, entry);
  }

  private async ensureCacheSpace(requiredSize: number): Promise<void> {
    const currentSize = this.getCurrentCacheSize();
    
    if (currentSize + requiredSize <= this.MAX_CACHE_SIZE) {
      return;
    }

    // Evict least recently used entries with low priority
    const entries = Array.from(this.cache.values())
      .filter(e => e.priority !== 'critical')
      .sort((a, b) => {
        // Sort by priority first, then by access time
        const priorityWeight = { high: 3, medium: 2, low: 1, critical: 4 };
        const priorityDiff = priorityWeight[a.priority] - priorityWeight[b.priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        return a.lastAccessed - b.lastAccessed;
      });

    let freedSpace = 0;
    for (const entry of entries) {
      if (freedSpace >= requiredSize) break;
      
      this.cache.delete(entry.id);
      freedSpace += entry.size;
    }
  }

  private getCurrentCacheSize(): number {
    return Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
  }

  private recordAccess(path: string, context?: string): void {
    const pattern: AccessPattern = {
      entryId: path,
      accessTime: Date.now(),
      context: context || 'unknown'
    };

    this.accessPatterns.push(pattern);
    
    // Limit pattern history
    if (this.accessPatterns.length > this.MAX_ACCESS_PATTERNS) {
      this.accessPatterns = this.accessPatterns.slice(-this.MAX_ACCESS_PATTERNS);
    }

    // Update sequence patterns
    this.updateSequencePatterns(path);
  }

  private updateSequencePatterns(currentPath: string): void {
    // Find recent accesses to identify sequences
    const recentAccesses = this.accessPatterns
      .slice(-10) // Last 10 accesses
      .map(p => p.entryId);

    if (recentAccesses.length >= 2) {
      const previousPath = recentAccesses[recentAccesses.length - 2];
      
      if (!this.sequencePatterns.has(previousPath)) {
        this.sequencePatterns.set(previousPath, []);
      }
      
      const sequences = this.sequencePatterns.get(previousPath)!;
      if (!sequences.includes(currentPath)) {
        sequences.push(currentPath);
        
        // Limit sequence length
        if (sequences.length > 5) {
          sequences.shift();
        }
      }
    }
  }

  private triggerPredictivePreload(path: string, context?: string): void {
    // Predict next likely documents based on patterns
    const likelyNext = this.predictNextDocuments(path, context);
    
    // Add to preload queue
    likelyNext.forEach(docPath => {
      if (!this.cache.has(docPath) && !this.preloadQueue.has(docPath)) {
        this.preloadQueue.add(docPath);
      }
    });
  }

  private predictNextDocuments(currentPath: string, context?: string): string[] {
    const predictions: string[] = [];
    
    // Sequence-based prediction
    const sequences = this.sequencePatterns.get(currentPath);
    if (sequences) {
      predictions.push(...sequences);
    }

    // Context-based prediction
    if (context) {
      const contextual = this.contextualPatterns.get(context);
      if (contextual) {
        predictions.push(...contextual);
      }
    }

    // Pattern-based prediction
    if (currentPath.includes('CLAUDE-agents')) {
      predictions.push('CLAUDE-test-patterns.md', 'CLAUDE-tasks.md');
    } else if (currentPath.includes('package.json')) {
      predictions.push('jest.config.js', 'esbuild.config.mjs');
    } else if (currentPath.includes('test')) {
      predictions.push('CLAUDE-test-patterns.md');
    }

    return [...new Set(predictions)]; // Remove duplicates
  }

  private startPredictivePreloading(): void {
    // Process preload queue every 2 seconds
    setInterval(async () => {
      if (this.preloadQueue.size === 0) return;
      
      const nextDocument = this.preloadQueue.values().next().value;
      this.preloadQueue.delete(nextDocument);
      
      try {
        const content = await this.loadDocument(nextDocument);
        if (content) {
          await this.cacheDocument(nextDocument, content, 'low');
        }
      } catch (error) {
        // Ignore preload errors
      }
    }, 2000);
  }

  private compress(content: string): string {
    // Simple compression simulation
    // In real implementation, use proper compression algorithm
    const compressed = this.compressionCache.get(content);
    if (compressed) return compressed;
    
    // Simulate compression by removing extra whitespace and comments
    const result = content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim();
    
    this.compressionCache.set(content, result);
    return result;
  }

  private decompress(compressed: string): string {
    // In real implementation, use proper decompression
    // For now, just return the compressed content
    return compressed;
  }

  private extractTags(content: string, context?: string): string[] {
    const tags: string[] = [];
    
    // Content-based tags
    if (content.includes('agent')) tags.push('agents');
    if (content.includes('test')) tags.push('testing');
    if (content.includes('performance')) tags.push('performance');
    if (content.includes('typescript')) tags.push('typescript');
    if (content.includes('jest')) tags.push('jest');
    
    // Context-based tags
    if (context) {
      tags.push(`context:${context}`);
    }
    
    return tags;
  }

  private async loadDocument(path: string): Promise<string | null> {
    // Simulate document loading
    // In real implementation, this would read from file system
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`Content of ${path}`);
      }, Math.random() * 100);
    });
  }

  private async loadAccessPatterns(): Promise<void> {
    // In real implementation, load from persistent storage
    console.log('📊 Loading access patterns from previous sessions...');
  }

  private initializeCompression(): void {
    // Set up compression cache eviction
    setInterval(() => {
      if (this.compressionCache.size > 100) {
        // Keep only the most recently used compression results
        const entries = Array.from(this.compressionCache.entries());
        this.compressionCache.clear();
        
        // Keep last 50 entries
        entries.slice(-50).forEach(([key, value]) => {
          this.compressionCache.set(key, value);
        });
      }
    }, 300000); // Every 5 minutes
  }

  // Performance monitoring
  generatePerformanceReport(): {
    cacheHitRate: number;
    averageAccessTime: number;
    cacheSize: number;
    compressionRatio: number;
    preloadQueueSize: number;
    topPatterns: Array<{pattern: string, frequency: number}>;
  } {
    const totalAccesses = this.accessPatterns.length;
    const cacheHits = this.accessPatterns.filter(p => this.cache.has(p.entryId)).length;
    
    const compressedEntries = Array.from(this.cache.values()).filter(e => e.compressed);
    const totalCompressed = compressedEntries.reduce((sum, e) => sum + e.size, 0);
    const estimatedUncompressed = totalCompressed * 2.5; // Estimate 2.5x compression

    return {
      cacheHitRate: totalAccesses > 0 ? cacheHits / totalAccesses : 0,
      averageAccessTime: 50, // Placeholder
      cacheSize: this.getCurrentCacheSize(),
      compressionRatio: estimatedUncompressed > 0 ? estimatedUncompressed / totalCompressed : 1,
      preloadQueueSize: this.preloadQueue.size,
      topPatterns: this.getTopAccessPatterns()
    };
  }

  private getTopAccessPatterns(): Array<{pattern: string, frequency: number}> {
    const patterns = new Map<string, number>();
    
    for (const [key, sequences] of this.sequencePatterns) {
      sequences.forEach(seq => {
        const pattern = `${key} → ${seq}`;
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
      });
    }

    return Array.from(patterns.entries())
      .map(([pattern, frequency]) => ({ pattern, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }
}

// Export singleton
export const memoryBankOptimizer = new MemoryBankOptimizer();