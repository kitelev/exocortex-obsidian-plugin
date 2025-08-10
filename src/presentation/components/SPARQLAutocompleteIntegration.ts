import { EditorView } from '@codemirror/view';
import { EditorState, Extension } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { SPARQLAutocompleteComponent } from './SPARQLAutocompleteComponent';
import { SPARQLAutocompleteService } from '../../application/services/SPARQLAutocompleteService';
import { SPARQLSuggestion } from '../../domain/autocomplete/SPARQLSuggestion';

/**
 * Integration layer between CodeMirror editor and SPARQL autocomplete component.
 * This class handles the setup and coordination of autocomplete functionality.
 */
export class SPARQLAutocompleteIntegration {
    private autocompleteComponent: SPARQLAutocompleteComponent;
    private currentEditorView: EditorView | null = null;
    private isEnabled = true;

    constructor(
        private readonly autocompleteService: SPARQLAutocompleteService,
        private readonly onSuggestionApplied?: (suggestion: SPARQLSuggestion, editor: EditorView) => void
    ) {
        this.autocompleteComponent = new SPARQLAutocompleteComponent(autocompleteService, {
            showDescriptions: true,
            showTypes: true,
            maxHeight: 300,
            minWidth: 250,
            maxWidth: 500
        });

        this.setupSuggestionHandler();
    }

    /**
     * Creates a CodeMirror extension that enables SPARQL autocomplete
     */
    createExtension(): Extension {
        return [
            keymap.of([
                {
                    key: 'Ctrl-Space',
                    preventDefault: true,
                    run: (view) => {
                        this.triggerAutocomplete(view);
                        return true;
                    }
                },
                {
                    key: 'Escape',
                    preventDefault: true,
                    run: (view) => {
                        if (this.autocompleteComponent.isShowing()) {
                            this.autocompleteComponent.hideSuggestions();
                            return true;
                        }
                        return false;
                    }
                }
            ]),
            EditorView.inputHandler.of((view, from, to, insert) => {
                this.handleInput(view, from, to, insert);
                return false; // Continue with default handling
            }),
            EditorView.updateListener.of((update) => {
                if (update.docChanged || update.selectionSet) {
                    this.handleDocumentChange(update.view);
                }
            })
        ];
    }

    /**
     * Manually trigger autocomplete at current cursor position
     */
    triggerAutocomplete(view: EditorView): void {
        if (!this.isEnabled) return;

        this.currentEditorView = view;
        const state = view.state;
        const cursor = state.selection.main.head;
        const query = state.doc.toString();

        this.showAutocomplete(view, query, cursor);
    }

    /**
     * Handle input events for real-time autocomplete
     */
    private handleInput(view: EditorView, from: number, to: number, insert: string): void {
        if (!this.isEnabled) return;

        // Only trigger autocomplete on certain characters
        const triggerChars = [' ', '?', ':', '<', '{', '('];
        const shouldTrigger = triggerChars.some(char => insert.includes(char));

        if (shouldTrigger) {
            // Small delay to allow the document to update
            setTimeout(() => {
                this.currentEditorView = view;
                const state = view.state;
                const cursor = state.selection.main.head;
                const query = state.doc.toString();

                this.showAutocomplete(view, query, cursor);
            }, 50);
        }
    }

    /**
     * Handle document changes to update or hide autocomplete
     */
    private handleDocumentChange(view: EditorView): void {
        if (!this.autocompleteComponent.isShowing()) return;

        const state = view.state;
        const cursor = state.selection.main.head;
        const query = state.doc.toString();

        // Update autocomplete with new context
        if (this.currentEditorView === view) {
            this.showAutocomplete(view, query, cursor);
        } else {
            this.autocompleteComponent.hideSuggestions();
        }
    }

    /**
     * Show autocomplete suggestions
     */
    private showAutocomplete(view: EditorView, query: string, cursorPosition: number): void {
        this.autocompleteComponent.showSuggestions(view, query, cursorPosition, {
            maxSuggestions: 15,
            includeDescriptions: true,
            contextBoost: true,
            cacheResults: true
        });
    }

    /**
     * Setup the suggestion selection handler
     */
    private setupSuggestionHandler(): void {
        this.autocompleteComponent.onSuggestionSelected = (suggestion: SPARQLSuggestion) => {
            if (!this.currentEditorView) return;

            this.applySuggestion(this.currentEditorView, suggestion);
            
            // Notify external handler if provided
            if (this.onSuggestionApplied) {
                this.onSuggestionApplied(suggestion, this.currentEditorView);
            }
        };
    }

    /**
     * Apply the selected suggestion to the editor
     */
    private applySuggestion(view: EditorView, suggestion: SPARQLSuggestion): void {
        const state = view.state;
        const cursor = state.selection.main.head;
        const query = state.doc.toString();

        // Find the current token boundaries
        const tokenBounds = this.findCurrentTokenBounds(query, cursor);
        
        // Create the replacement transaction
        const transaction = state.update({
            changes: {
                from: tokenBounds.start,
                to: tokenBounds.end,
                insert: suggestion.getInsertText()
            },
            selection: {
                anchor: tokenBounds.start + suggestion.getInsertText().length
            }
        });

        view.dispatch(transaction);
    }

    /**
     * Find the boundaries of the current token at cursor position
     */
    private findCurrentTokenBounds(query: string, cursor: number): { start: number; end: number } {
        // Find start of current token (go backward until whitespace)
        let start = cursor;
        while (start > 0 && !/\s/.test(query[start - 1])) {
            start--;
        }

        // Find end of current token (go forward until whitespace)
        let end = cursor;
        while (end < query.length && !/\s/.test(query[end])) {
            end++;
        }

        return { start, end };
    }

    /**
     * Enable or disable autocomplete functionality
     */
    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
        if (!enabled) {
            this.autocompleteComponent.hideSuggestions();
        }
    }

    /**
     * Check if autocomplete is currently enabled
     */
    isAutocompleteEnabled(): boolean {
        return this.isEnabled;
    }

    /**
     * Get the underlying autocomplete component for advanced usage
     */
    getComponent(): SPARQLAutocompleteComponent {
        return this.autocompleteComponent;
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.autocompleteComponent.destroy();
        this.currentEditorView = null;
    }
}

/**
 * Factory function to create a properly configured SPARQL editor with autocomplete
 */
export function createSPARQLEditor(
    parent: HTMLElement,
    initialContent: string,
    autocompleteService: SPARQLAutocompleteService,
    onSuggestionApplied?: (suggestion: SPARQLSuggestion, editor: EditorView) => void
): { editor: EditorView; integration: SPARQLAutocompleteIntegration } {
    
    const integration = new SPARQLAutocompleteIntegration(
        autocompleteService,
        onSuggestionApplied
    );

    const editor = new EditorView({
        state: EditorState.create({
            doc: initialContent,
            extensions: [
                integration.createExtension(),
                // Add other extensions as needed (syntax highlighting, etc.)
            ]
        }),
        parent
    });

    return { editor, integration };
}

/**
 * Example usage for Obsidian plugin integration
 */
export class ObsidianSPARQLEditor {
    private editor: EditorView;
    private integration: SPARQLAutocompleteIntegration;

    constructor(
        container: HTMLElement,
        initialQuery: string,
        autocompleteService: SPARQLAutocompleteService
    ) {
        const result = createSPARQLEditor(
            container,
            initialQuery,
            autocompleteService,
            this.handleSuggestionApplied.bind(this)
        );

        this.editor = result.editor;
        this.integration = result.integration;
    }

    private handleSuggestionApplied(suggestion: SPARQLSuggestion, editor: EditorView): void {
        // Custom handling for Obsidian context
        console.log(`Applied suggestion: ${suggestion.getText()}`);
        
        // Could trigger additional actions like:
        // - Update query validation
        // - Trigger syntax highlighting
        // - Save query state
        // - Notify other components
    }

    getQuery(): string {
        return this.editor.state.doc.toString();
    }

    setQuery(query: string): void {
        const transaction = this.editor.state.update({
            changes: {
                from: 0,
                to: this.editor.state.doc.length,
                insert: query
            }
        });
        this.editor.dispatch(transaction);
    }

    focus(): void {
        this.editor.focus();
    }

    enableAutocomplete(enabled: boolean): void {
        this.integration.setEnabled(enabled);
    }

    destroy(): void {
        this.integration.destroy();
        this.editor.destroy();
    }
}