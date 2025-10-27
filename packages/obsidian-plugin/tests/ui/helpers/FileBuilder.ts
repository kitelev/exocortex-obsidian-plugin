/**
 * FileBuilder pattern for creating test files with metadata
 * Based on: https://davi.sh/blog/2022/12/obsidian-api-mock/
 *
 * Generates both file contents and metadata simultaneously,
 * avoiding manual position tracking and making tests more maintainable.
 */

export interface FileMetadata {
  frontmatter: Record<string, unknown>;
  headings: Array<{
    level: number;
    heading: string;
    position: { start: number; end: number };
  }>;
  sections: Array<{ type: string; position: { start: number; end: number } }>;
  links: Array<{ link: string; position: { start: number; end: number } }>;
}

export class ListBuilder {
  private items: string[] = [];

  item(text: string): this {
    this.items.push(text);
    return this;
  }

  build(): string[] {
    return this.items;
  }
}

export class FileBuilder {
  private lines: string[] = [];
  private metadata: FileMetadata = {
    frontmatter: {},
    headings: [],
    sections: [],
    links: [],
  };
  private currentLine = 0;

  /**
   * Add YAML frontmatter to the file
   */
  frontmatter(data: Record<string, unknown>): this {
    this.metadata.frontmatter = data;
    this.lines.push("---");
    this.currentLine++;

    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        this.lines.push(`${key}:`);
        this.currentLine++;
        for (const item of value) {
          this.lines.push(`  - ${item}`);
          this.currentLine++;
        }
      } else {
        this.lines.push(`${key}: ${value}`);
        this.currentLine++;
      }
    }

    this.lines.push("---");
    this.currentLine++;
    this.lines.push(""); // Empty line after frontmatter
    this.currentLine++;

    return this;
  }

  /**
   * Add a heading
   */
  heading(level: number, text: string): this {
    const start = this.currentLine;
    const heading = "#".repeat(level) + " " + text;
    this.lines.push(heading);
    this.currentLine++;

    this.metadata.headings.push({
      level,
      heading: text,
      position: { start, end: this.currentLine },
    });

    return this;
  }

  /**
   * Add plain text
   */
  text(content: string): this {
    this.lines.push(content);
    this.currentLine++;
    return this;
  }

  /**
   * Add a wikilink
   */
  link(target: string, alias?: string): this {
    const start = this.currentLine;
    const linkText = alias ? `[[${target}|${alias}]]` : `[[${target}]]`;
    this.lines.push(linkText);
    this.currentLine++;

    this.metadata.links.push({
      link: target,
      position: { start, end: this.currentLine },
    });

    return this;
  }

  /**
   * Add a list
   */
  list(builder: ListBuilder): this {
    const items = builder.build();
    for (const item of items) {
      this.lines.push(`- ${item}`);
      this.currentLine++;
    }
    return this;
  }

  /**
   * Add a code block
   */
  codeBlock(lang: string, code: string): this {
    this.lines.push("```" + lang);
    this.currentLine++;

    const codeLines = code.split("\n");
    for (const line of codeLines) {
      this.lines.push(line);
      this.currentLine++;
    }

    this.lines.push("```");
    this.currentLine++;
    return this;
  }

  /**
   * Add a table
   */
  table(headers: string[], rows: string[][]): this {
    // Header row
    this.lines.push("| " + headers.join(" | ") + " |");
    this.currentLine++;

    // Separator row
    this.lines.push("| " + headers.map(() => "---").join(" | ") + " |");
    this.currentLine++;

    // Data rows
    for (const row of rows) {
      this.lines.push("| " + row.join(" | ") + " |");
      this.currentLine++;
    }

    return this;
  }

  /**
   * Add a blank line
   */
  blank(): this {
    this.lines.push("");
    this.currentLine++;
    return this;
  }

  /**
   * Build and return both content and metadata
   */
  done(): [string, FileMetadata] {
    return [this.lines.join("\n"), this.metadata];
  }

  /**
   * Get only the content
   */
  getContent(): string {
    return this.lines.join("\n");
  }

  /**
   * Get only the metadata
   */
  getMetadata(): FileMetadata {
    return this.metadata;
  }
}
