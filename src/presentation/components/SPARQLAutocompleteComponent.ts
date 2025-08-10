import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import { SPARQLAutocompleteService, AutocompleteOptions } from '../../application/services/SPARQLAutocompleteService';
import { SPARQLSuggestion, SuggestionType } from '../../domain/autocomplete/SPARQLSuggestion';

export interface AutocompletePosition {
    top: number;
    left: number;
    maxHeight?: number;
}

export interface AutocompleteDisplayOptions {
    showDescriptions?: boolean;
    showTypes?: boolean;
    maxHeight?: number;
    minWidth?: number;
    maxWidth?: number;
}

export class SPARQLAutocompleteComponent {
    private container: HTMLElement | null = null;
    private listContainer: HTMLElement | null = null;
    private suggestions: SPARQLSuggestion[] = [];
    private selectedIndex = -1;
    private isVisible = false;
    private debounceTimeout: NodeJS.Timeout | null = null;
    private readonly debounceDelay = 150;
    private abortController: AbortController | null = null;
    
    constructor(
        private readonly autocompleteService: SPARQLAutocompleteService,
        private readonly options: AutocompleteDisplayOptions = {}
    ) {
        this.options = {
            showDescriptions: true,
            showTypes: true,
            maxHeight: 300,
            minWidth: 200,
            maxWidth: 500,
            ...options
        };
        
        this.bindMethods();
    }

    private bindMethods(): void {
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
    }

    async showSuggestions(
        editorView: EditorView,
        query: string,
        cursorPosition: number,
        autocompleteOptions?: AutocompleteOptions
    ): Promise<void> {
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }

        this.debounceTimeout = setTimeout(async () => {
            await this.performAutocompletion(editorView, query, cursorPosition, autocompleteOptions);
        }, this.debounceDelay);
    }

    private async performAutocompletion(
        editorView: EditorView,
        query: string,
        cursorPosition: number,
        autocompleteOptions?: AutocompleteOptions
    ): Promise<void> {
        try {
            if (this.abortController) {
                this.abortController.abort();
            }
            this.abortController = new AbortController();

            const result = await this.autocompleteService.getSuggestions(
                query,
                cursorPosition,
                {
                    maxSuggestions: 15,
                    includeDescriptions: this.options.showDescriptions,
                    contextBoost: true,
                    cacheResults: true,
                    ...autocompleteOptions
                }
            );

            if (this.abortController.signal.aborted) {
                return;
            }

            if (result.isFailure) {
                this.hideSuggestions();
                return;
            }

            const suggestions = result.getValue();
            if (suggestions.length === 0) {
                this.hideSuggestions();
                return;
            }

            this.suggestions = suggestions;
            this.selectedIndex = 0;
            
            this.renderSuggestions(editorView);
            this.positionDropdown(editorView, cursorPosition);
            this.showDropdown();
        } catch (error) {
            console.error('Autocomplete error:', error);
            this.hideSuggestions();
        }
    }

    private renderSuggestions(editorView: EditorView): void {
        if (!this.container) {
            this.createContainer();
        }

        if (!this.listContainer) {
            return;
        }

        this.listContainer.empty();

        this.suggestions.forEach((suggestion, index) => {
            const item = this.createSuggestionItem(suggestion, index);
            this.listContainer!.appendChild(item);
        });

        this.updateSelection();
    }

    private createContainer(): void {
        this.container = document.createElement('div');
        this.container.className = 'exocortex-autocomplete-container';
        this.container.style.cssText = `
            position: absolute;
            z-index: 1000;
            background: var(--background-primary);
            border: 1px solid var(--background-modifier-border);
            border-radius: var(--radius-m);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            max-height: ${this.options.maxHeight}px;
            min-width: ${this.options.minWidth}px;
            max-width: ${this.options.maxWidth}px;
            overflow: hidden;
            display: none;
        `;

        this.listContainer = document.createElement('div');
        this.listContainer.className = 'exocortex-autocomplete-list';
        this.listContainer.style.cssText = `
            overflow-y: auto;
            max-height: ${this.options.maxHeight}px;
        `;

        this.container.appendChild(this.listContainer);
        document.body.appendChild(this.container);

        this.attachEventListeners();
    }

    private createSuggestionItem(suggestion: SPARQLSuggestion, index: number): HTMLElement {
        const item = document.createElement('div');
        item.className = 'exocortex-autocomplete-item';
        item.setAttribute('data-index', index.toString());
        item.style.cssText = `
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid var(--background-modifier-border-hover);
            transition: background-color 0.1s ease;
            display: flex;
            flex-direction: column;
            gap: 2px;
        `;

        const mainContent = document.createElement('div');
        mainContent.className = 'autocomplete-item-main';
        mainContent.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        `;

        const textContainer = document.createElement('div');
        textContainer.className = 'autocomplete-item-text';
        textContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
            flex: 1;
            min-width: 0;
        `;

        if (this.options.showTypes) {
            const typeIcon = this.createTypeIcon(suggestion.getType());
            textContainer.appendChild(typeIcon);
        }

        const text = document.createElement('span');
        text.className = 'autocomplete-item-label';
        text.textContent = suggestion.getText();
        text.style.cssText = `
            font-family: var(--font-monospace);
            font-size: 0.9em;
            color: var(--text-normal);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `;
        textContainer.appendChild(text);

        mainContent.appendChild(textContainer);

        const confidence = this.createConfidenceIndicator(suggestion.calculateFinalScore());
        mainContent.appendChild(confidence);

        item.appendChild(mainContent);

        const metadata = suggestion.getMetadata();
        if (this.options.showDescriptions && metadata?.description) {
            const description = document.createElement('div');
            description.className = 'autocomplete-item-description';
            description.textContent = metadata.description;
            description.style.cssText = `
                font-size: 0.8em;
                color: var(--text-muted);
                margin-left: ${this.options.showTypes ? '20px' : '0px'};
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            `;
            item.appendChild(description);
        }

        item.addEventListener('mouseenter', () => {
            this.selectedIndex = index;
            this.updateSelection();
        });

        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.applySuggestion(index);
        });

        return item;
    }

    private createTypeIcon(type: SuggestionType): HTMLElement {
        const icon = document.createElement('span');
        icon.className = 'autocomplete-type-icon';
        icon.style.cssText = `
            display: inline-block;
            width: 14px;
            height: 14px;
            text-align: center;
            font-size: 10px;
            line-height: 14px;
            border-radius: 2px;
            flex-shrink: 0;
        `;

        switch (type) {
            case SuggestionType.KEYWORD:
                icon.textContent = 'K';
                icon.style.backgroundColor = 'var(--color-blue)';
                icon.style.color = 'white';
                break;
            case SuggestionType.FUNCTION:
                icon.textContent = 'F';
                icon.style.backgroundColor = 'var(--color-purple)';
                icon.style.color = 'white';
                break;
            case SuggestionType.PROPERTY:
                icon.textContent = 'P';
                icon.style.backgroundColor = 'var(--color-green)';
                icon.style.color = 'white';
                break;
            case SuggestionType.CLASS:
                icon.textContent = 'C';
                icon.style.backgroundColor = 'var(--color-orange)';
                icon.style.color = 'white';
                break;
            case SuggestionType.VARIABLE:
                icon.textContent = 'V';
                icon.style.backgroundColor = 'var(--color-red)';
                icon.style.color = 'white';
                break;
            case SuggestionType.PREFIX:
                icon.textContent = '@';
                icon.style.backgroundColor = 'var(--color-cyan)';
                icon.style.color = 'white';
                break;
            case SuggestionType.TEMPLATE:
                icon.textContent = 'T';
                icon.style.backgroundColor = 'var(--color-yellow)';
                icon.style.color = 'black';
                break;
            default:
                icon.textContent = '?';
                icon.style.backgroundColor = 'var(--background-modifier-border)';
                icon.style.color = 'var(--text-muted)';
        }

        return icon;
    }

    private createConfidenceIndicator(score: number): HTMLElement {
        const indicator = document.createElement('div');
        indicator.className = 'autocomplete-confidence';
        
        const percentage = Math.round(score * 100);
        const bars = Math.max(1, Math.min(3, Math.round(score * 3)));
        
        indicator.style.cssText = `
            display: flex;
            gap: 1px;
            align-items: center;
        `;

        for (let i = 0; i < 3; i++) {
            const bar = document.createElement('div');
            bar.style.cssText = `
                width: 3px;
                height: 8px;
                background: ${i < bars ? 'var(--text-accent)' : 'var(--background-modifier-border)'};
                border-radius: 1px;
            `;
            indicator.appendChild(bar);
        }

        indicator.title = `Confidence: ${percentage}%`;
        
        return indicator;
    }

    private positionDropdown(editorView: EditorView, cursorPosition: number): void {
        if (!this.container) return;

        const coords = editorView.coordsAtPos(cursorPosition);
        if (!coords) return;

        const editorRect = editorView.dom.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        let top = coords.bottom + window.scrollY;
        let left = coords.left + window.scrollX;

        if (top + containerRect.height > viewportHeight + window.scrollY) {
            top = coords.top + window.scrollY - containerRect.height;
        }

        if (left + containerRect.width > viewportWidth + window.scrollX) {
            left = viewportWidth + window.scrollX - containerRect.width - 10;
        }

        left = Math.max(10, left);
        top = Math.max(10, top);

        this.container.style.top = `${top}px`;
        this.container.style.left = `${left}px`;
    }

    private showDropdown(): void {
        if (!this.container) return;
        
        this.container.style.display = 'block';
        this.isVisible = true;
        
        document.addEventListener('click', this.handleDocumentClick, true);
        document.addEventListener('keydown', this.handleKeyDown, true);
        document.addEventListener('mousedown', this.handleMouseDown, true);
    }

    private attachEventListeners(): void {
        if (!this.listContainer) return;
        
        this.listContainer.addEventListener('scroll', (e) => {
            e.stopPropagation();
        });
    }

    private updateSelection(): void {
        if (!this.listContainer) return;

        const items = this.listContainer.querySelectorAll('.exocortex-autocomplete-item');
        items.forEach((item, index) => {
            const element = item as HTMLElement;
            if (index === this.selectedIndex) {
                element.style.backgroundColor = 'var(--background-modifier-hover)';
                element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                element.style.backgroundColor = 'transparent';
            }
        });
    }

    private handleKeyDown(e: KeyboardEvent): void {
        if (!this.isVisible) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                e.stopPropagation();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.suggestions.length - 1);
                this.updateSelection();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                e.stopPropagation();
                this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                this.updateSelection();
                break;
                
            case 'Enter':
            case 'Tab':
                e.preventDefault();
                e.stopPropagation();
                if (this.selectedIndex >= 0) {
                    this.applySuggestion(this.selectedIndex);
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                e.stopPropagation();
                this.hideSuggestions();
                break;
        }
    }

    private handleDocumentClick(e: Event): void {
        if (this.container && !this.container.contains(e.target as Node)) {
            this.hideSuggestions();
        }
    }

    private handleMouseDown(e: Event): void {
        if (this.container && this.container.contains(e.target as Node)) {
            e.preventDefault();
        }
    }

    private applySuggestion(index: number): void {
        if (index < 0 || index >= this.suggestions.length) return;

        const suggestion = this.suggestions[index];
        this.onSuggestionSelected?.(suggestion);
        this.hideSuggestions();
    }

    hideSuggestions(): void {
        if (!this.isVisible) return;

        if (this.container) {
            this.container.style.display = 'none';
        }
        
        this.isVisible = false;
        this.selectedIndex = -1;
        this.suggestions = [];
        
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = null;
        }

        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }

        document.removeEventListener('click', this.handleDocumentClick, true);
        document.removeEventListener('keydown', this.handleKeyDown, true);
        document.removeEventListener('mousedown', this.handleMouseDown, true);
    }

    destroy(): void {
        this.hideSuggestions();
        
        if (this.container) {
            this.container.remove();
            this.container = null;
            this.listContainer = null;
        }
    }

    isShowing(): boolean {
        return this.isVisible;
    }

    getSelectedSuggestion(): SPARQLSuggestion | null {
        if (this.selectedIndex >= 0 && this.selectedIndex < this.suggestions.length) {
            return this.suggestions[this.selectedIndex];
        }
        return null;
    }

    onSuggestionSelected?: (suggestion: SPARQLSuggestion) => void;
}