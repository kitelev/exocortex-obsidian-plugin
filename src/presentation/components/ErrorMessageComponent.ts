import { ExocortexError, ErrorSeverity, FixSuggestion } from '../../domain/errors/ExocortexError';

export interface ErrorDisplayOptions {
    showTechnicalDetails?: boolean;
    compact?: boolean;
    autoHide?: boolean;
    timeout?: number;
    onRetry?: () => void | Promise<void>;
    onDismiss?: () => void;
}

export class ErrorMessageComponent {
    private container: HTMLElement | null = null;

    constructor(
        private error: ExocortexError,
        private options: ErrorDisplayOptions = {}
    ) {
        this.options = {
            showTechnicalDetails: false,
            compact: false,
            autoHide: false,
            timeout: 5000,
            ...options
        };
    }

    render(): HTMLElement {
        this.container = document.createElement('div');
        this.container.className = this.getContainerClasses();
        this.container.setAttribute('role', 'alert');
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('data-error-id', this.error.id);

        const content = document.createElement('div');
        content.className = 'error-content';

        content.appendChild(this.createHeader());
        content.appendChild(this.createMessage());

        if (this.error.context.location && typeof this.error.context.location === 'object') {
            content.appendChild(this.createLocationInfo());
        }

        if (this.error.suggestions && this.error.suggestions.length > 0 && !this.options.compact) {
            content.appendChild(this.createSuggestions());
        }

        if (this.options.showTechnicalDetails && this.error.technicalDetails) {
            content.appendChild(this.createTechnicalDetails());
        }

        this.container.appendChild(content);

        if (this.error.recoverable || this.options.onDismiss) {
            this.container.appendChild(this.createActions());
        }

        if (this.options.autoHide) {
            setTimeout(() => this.dismiss(), this.options.timeout);
        }

        return this.container;
    }

    private getContainerClasses(): string {
        const classes = ['exocortex-error-message', 'animate-fade-in'];
        
        classes.push(`error-severity-${this.error.severity}`);
        classes.push(`error-category-${this.error.category}`);
        
        if (this.options.compact) {
            classes.push('error-compact');
        }

        const severityClasses = this.getSeverityClasses();
        classes.push(...severityClasses.split(' '));

        return classes.join(' ');
    }

    private getSeverityClasses(): string {
        switch (this.error.severity) {
            case ErrorSeverity.CRITICAL:
                return 'bg-red-50 border-2 border-red-600 text-red-900 shadow-lg';
            case ErrorSeverity.ERROR:
                return 'bg-red-50 border border-red-400 text-red-800';
            case ErrorSeverity.WARNING:
                return 'bg-yellow-50 border border-yellow-400 text-yellow-800';
            case ErrorSeverity.INFO:
                return 'bg-blue-50 border border-blue-400 text-blue-800';
            default:
                return 'bg-gray-50 border border-gray-400 text-gray-800';
        }
    }

    private createHeader(): HTMLElement {
        const header = document.createElement('div');
        header.className = 'error-header flex items-center gap-2 mb-2';

        const icon = this.createIcon();
        header.appendChild(icon);

        const title = document.createElement('h3');
        title.className = 'error-title font-semibold text-base';
        title.textContent = this.error.title;
        header.appendChild(title);

        if (this.error.severity === ErrorSeverity.CRITICAL) {
            title.classList.add('animate-pulse');
        }

        return header;
    }

    private createIcon(): HTMLElement {
        const icon = document.createElement('span');
        icon.className = 'error-icon text-xl';
        icon.setAttribute('aria-hidden', 'true');

        switch (this.error.severity) {
            case ErrorSeverity.CRITICAL:
                icon.textContent = '🚨';
                break;
            case ErrorSeverity.ERROR:
                icon.textContent = '❌';
                break;
            case ErrorSeverity.WARNING:
                icon.textContent = '⚠️';
                break;
            case ErrorSeverity.INFO:
                icon.textContent = 'ℹ️';
                break;
        }

        return icon;
    }

    private createMessage(): HTMLElement {
        const message = document.createElement('p');
        message.className = 'error-message text-sm mb-2';
        message.textContent = this.error.message;
        return message;
    }

    private createLocationInfo(): HTMLElement {
        const location = this.error.context.location;
        if (typeof location !== 'object' || !('line' in location)) {
            return document.createElement('div');
        }

        const locationDiv = document.createElement('div');
        locationDiv.className = 'error-location text-xs text-gray-600 mb-2 font-mono';
        
        const parts = [];
        if (location.file) {
            parts.push(location.file);
        }
        if (location.line) {
            parts.push(`Line ${location.line}`);
            if (location.column) {
                parts.push(`Column ${location.column}`);
            }
        }
        
        locationDiv.textContent = parts.join(' • ');
        return locationDiv;
    }

    private createSuggestions(): HTMLElement {
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'error-suggestions mt-3 pt-3 border-t border-gray-200';

        const title = document.createElement('h4');
        title.className = 'text-sm font-semibold mb-2';
        title.textContent = '💡 Suggestions:';
        suggestionsDiv.appendChild(title);

        const list = document.createElement('ul');
        list.className = 'space-y-2';

        this.error.suggestions!.forEach(suggestion => {
            list.appendChild(this.createSuggestionItem(suggestion));
        });

        suggestionsDiv.appendChild(list);
        return suggestionsDiv;
    }

    private createSuggestionItem(suggestion: FixSuggestion): HTMLElement {
        const item = document.createElement('li');
        item.className = 'suggestion-item';

        const content = document.createElement('div');
        content.className = 'flex flex-col gap-1';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'suggestion-title text-sm font-medium';
        titleDiv.textContent = suggestion.title;
        content.appendChild(titleDiv);

        const description = document.createElement('div');
        description.className = 'suggestion-description text-xs text-gray-600';
        description.textContent = suggestion.description;
        content.appendChild(description);

        if (suggestion.confidence) {
            const confidence = document.createElement('span');
            confidence.className = 'text-xs text-gray-500';
            confidence.textContent = `(${Math.round(suggestion.confidence * 100)}% confidence)`;
            description.appendChild(confidence);
        }

        item.appendChild(content);

        if (suggestion.action || suggestion.learnMore) {
            const actions = document.createElement('div');
            actions.className = 'suggestion-actions flex gap-2 mt-1';

            if (suggestion.action) {
                const button = document.createElement('button');
                button.className = 'text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600';
                button.textContent = suggestion.action.label;
                button.onclick = async () => {
                    try {
                        await suggestion.action!.handler();
                        this.markSuggestionApplied(item);
                    } catch (error) {
                        console.error('Failed to apply suggestion:', error);
                    }
                };
                actions.appendChild(button);
            }

            if (suggestion.learnMore) {
                const link = document.createElement('a');
                link.className = 'text-xs text-blue-600 hover:underline';
                link.href = suggestion.learnMore.url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = suggestion.learnMore.title;
                actions.appendChild(link);
            }

            item.appendChild(actions);
        }

        return item;
    }

    private createTechnicalDetails(): HTMLElement {
        const details = document.createElement('details');
        details.className = 'error-technical-details mt-3 pt-3 border-t border-gray-200';

        const summary = document.createElement('summary');
        summary.className = 'cursor-pointer text-xs text-gray-600 hover:text-gray-800';
        summary.textContent = 'Technical Details';
        details.appendChild(summary);

        const content = document.createElement('pre');
        content.className = 'mt-2 p-2 bg-gray-100 text-xs overflow-x-auto rounded';
        content.textContent = this.error.technicalDetails!;

        if (this.error.stackTrace) {
            content.textContent += '\n\nStack Trace:\n' + this.error.stackTrace;
        }

        details.appendChild(content);
        return details;
    }

    private createActions(): HTMLElement {
        const actions = document.createElement('div');
        actions.className = 'error-actions flex gap-2 mt-3 pt-3 border-t border-gray-200';

        if (this.error.recoverable && this.options.onRetry) {
            const retryButton = document.createElement('button');
            retryButton.className = 'px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600';
            retryButton.textContent = 'Retry';
            retryButton.onclick = async () => {
                retryButton.disabled = true;
                retryButton.textContent = 'Retrying...';
                try {
                    await this.options.onRetry!();
                    this.dismiss();
                } catch (error) {
                    console.error('Retry failed:', error);
                    retryButton.disabled = false;
                    retryButton.textContent = 'Retry';
                }
            };
            actions.appendChild(retryButton);
        }

        if (this.options.onDismiss) {
            const dismissButton = document.createElement('button');
            dismissButton.className = 'px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400';
            dismissButton.textContent = 'Dismiss';
            dismissButton.onclick = () => {
                this.dismiss();
                if (this.options.onDismiss) {
                    this.options.onDismiss();
                }
            };
            actions.appendChild(dismissButton);
        }

        return actions;
    }

    private markSuggestionApplied(item: HTMLElement): void {
        item.classList.add('opacity-50');
        const badge = document.createElement('span');
        badge.className = 'text-xs text-green-600 ml-2';
        badge.textContent = '✓ Applied';
        item.querySelector('.suggestion-title')?.appendChild(badge);
    }

    dismiss(): void {
        if (this.container) {
            this.container.classList.add('animate-fade-out');
            setTimeout(() => {
                this.container?.remove();
                this.container = null;
            }, 200);
        }
    }
}