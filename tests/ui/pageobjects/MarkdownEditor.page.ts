/**
 * Page Object for Markdown Editor interactions
 */
export class MarkdownEditorPage {
  /**
   * Get the CodeMirror editor element
   */
  get editor() {
    return $(".cm-editor");
  }

  /**
   * Get editor content element
   */
  get editorContent() {
    return $(".cm-content");
  }

  /**
   * Wait for editor to be ready
   */
  async waitForEditor(timeout = 5000): Promise<void> {
    await this.editor.waitForDisplayed({ timeout });
  }

  /**
   * Insert text at cursor position
   */
  async insertText(text: string): Promise<void> {
    await browser.executeObsidian(({ app }, content: string) => {
      const view = app.workspace.getActiveViewOfType(
        app.constructor.MarkdownView,
      );
      if (view && view.editor) {
        const cursor = view.editor.getCursor();
        view.editor.replaceRange(content, cursor);
      }
    }, text);
  }

  /**
   * Get entire editor content
   */
  async getContent(): Promise<string> {
    return await browser.executeObsidian(({ app }) => {
      const view = app.workspace.getActiveViewOfType(
        app.constructor.MarkdownView,
      );
      if (view && view.editor) {
        return view.editor.getValue();
      }
      return "";
    });
  }

  /**
   * Set entire editor content
   */
  async setContent(content: string): Promise<void> {
    await browser.executeObsidian(({ app }, text: string) => {
      const view = app.workspace.getActiveViewOfType(
        app.constructor.MarkdownView,
      );
      if (view && view.editor) {
        view.editor.setValue(text);
      }
    }, content);
  }

  /**
   * Append text to the end of the document
   */
  async appendText(text: string): Promise<void> {
    await browser.executeObsidian(({ app }, content: string) => {
      const view = app.workspace.getActiveViewOfType(
        app.constructor.MarkdownView,
      );
      if (view && view.editor) {
        const doc = view.editor.getDoc();
        const lastLine = doc.lastLine();
        const lastLineLength = doc.getLine(lastLine).length;
        view.editor.replaceRange(content, {
          line: lastLine,
          ch: lastLineLength,
        });
      }
    }, text);
  }

  /**
   * Insert a SPARQL code block
   */
  async insertSparqlBlock(query: string): Promise<void> {
    const sparqlBlock = `\n\`\`\`sparql\n${query}\n\`\`\`\n`;
    await this.appendText(sparqlBlock);
  }

  /**
   * Get line count
   */
  async getLineCount(): Promise<number> {
    return await browser.executeObsidian(({ app }) => {
      const view = app.workspace.getActiveViewOfType(
        app.constructor.MarkdownView,
      );
      if (view && view.editor) {
        return view.editor.lineCount();
      }
      return 0;
    });
  }

  /**
   * Get current cursor position
   */
  async getCursorPosition(): Promise<{ line: number; ch: number }> {
    return await browser.executeObsidian(({ app }) => {
      const view = app.workspace.getActiveViewOfType(
        app.constructor.MarkdownView,
      );
      if (view && view.editor) {
        return view.editor.getCursor();
      }
      return { line: 0, ch: 0 };
    });
  }

  /**
   * Set cursor position
   */
  async setCursorPosition(line: number, ch: number): Promise<void> {
    await browser.executeObsidian(
      ({ app }, pos: { line: number; ch: number }) => {
        const view = app.workspace.getActiveViewOfType(
          app.constructor.MarkdownView,
        );
        if (view && view.editor) {
          view.editor.setCursor(pos);
        }
      },
      { line, ch },
    );
  }

  /**
   * Select text range
   */
  async selectRange(
    fromLine: number,
    fromCh: number,
    toLine: number,
    toCh: number,
  ): Promise<void> {
    await browser.executeObsidian(
      (
        { app },
        range: {
          from: { line: number; ch: number };
          to: { line: number; ch: number };
        },
      ) => {
        const view = app.workspace.getActiveViewOfType(
          app.constructor.MarkdownView,
        );
        if (view && view.editor) {
          view.editor.setSelection(range.from, range.to);
        }
      },
      {
        from: { line: fromLine, ch: fromCh },
        to: { line: toLine, ch: toCh },
      },
    );
  }

  /**
   * Get selected text
   */
  async getSelectedText(): Promise<string> {
    return await browser.executeObsidian(({ app }) => {
      const view = app.workspace.getActiveViewOfType(
        app.constructor.MarkdownView,
      );
      if (view && view.editor) {
        return view.editor.getSelection();
      }
      return "";
    });
  }

  /**
   * Check if editor is in source mode
   */
  async isSourceMode(): Promise<boolean> {
    return await browser.executeObsidian(({ app }) => {
      const view = app.workspace.getActiveViewOfType(
        app.constructor.MarkdownView,
      );
      if (view) {
        return view.getMode() === "source";
      }
      return false;
    });
  }

  /**
   * Check if editor is in preview mode
   */
  async isPreviewMode(): Promise<boolean> {
    return await browser.executeObsidian(({ app }) => {
      const view = app.workspace.getActiveViewOfType(
        app.constructor.MarkdownView,
      );
      if (view) {
        return view.getMode() === "preview";
      }
      return false;
    });
  }
}
