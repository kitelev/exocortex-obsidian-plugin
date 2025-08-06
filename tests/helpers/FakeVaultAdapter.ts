import { IVaultAdapter } from '../../src/application/ports/IVaultAdapter';

/**
 * Fake implementation of IVaultAdapter for testing
 * Provides in-memory storage instead of actual file system
 */
export class FakeVaultAdapter implements IVaultAdapter {
  private files: Map<string, string> = new Map();
  private metadata: Map<string, Record<string, any>> = new Map();

  async create(path: string, content: string): Promise<void> {
    if (this.files.has(path)) {
      throw new Error(`File already exists: ${path}`);
    }
    this.files.set(path, content);
    this.extractMetadata(path, content);
  }

  async read(path: string): Promise<string> {
    const content = this.files.get(path);
    if (!content) {
      throw new Error(`File not found: ${path}`);
    }
    return content;
  }

  async update(path: string, content: string): Promise<void> {
    if (!this.files.has(path)) {
      throw new Error(`File not found: ${path}`);
    }
    this.files.set(path, content);
    this.extractMetadata(path, content);
  }

  async delete(path: string): Promise<void> {
    if (!this.files.has(path)) {
      throw new Error(`File not found: ${path}`);
    }
    this.files.delete(path);
    this.metadata.delete(path);
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }

  async list(pattern?: string): Promise<string[]> {
    const paths = Array.from(this.files.keys());
    if (!pattern) {
      return paths;
    }
    const regex = new RegExp(pattern);
    return paths.filter(p => regex.test(p));
  }

  async getMetadata(path: string): Promise<Record<string, any> | null> {
    return this.metadata.get(path) || null;
  }

  // Helper methods for testing
  getFileCount(): number {
    return this.files.size;
  }

  getFileContent(path: string): string | undefined {
    return this.files.get(path);
  }

  setFileContent(path: string, content: string): void {
    this.files.set(path, content);
    this.extractMetadata(path, content);
  }

  clear(): void {
    this.files.clear();
    this.metadata.clear();
  }

  private extractMetadata(path: string, content: string): void {
    // Simple frontmatter extraction for testing
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
      try {
        // Simple YAML parsing (in real implementation, use proper YAML parser)
        const frontmatter: Record<string, any> = {};
        const lines = match[1].split('\n');
        
        for (const line of lines) {
          const colonIndex = line.indexOf(':');
          if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            
            // Handle quoted strings
            if (value.startsWith('"') && value.endsWith('"')) {
              frontmatter[key] = value.slice(1, -1);
            } else if (value === 'true') {
              frontmatter[key] = true;
            } else if (value === 'false') {
              frontmatter[key] = false;
            } else if (!isNaN(Number(value))) {
              frontmatter[key] = Number(value);
            } else {
              frontmatter[key] = value;
            }
          }
        }
        
        this.metadata.set(path, frontmatter);
      } catch (error) {
        console.warn(`Failed to parse metadata for ${path}:`, error);
      }
    }
  }
}