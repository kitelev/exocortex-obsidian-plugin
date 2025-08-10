import { SPARQLAutocompleteComponent, AutocompleteDisplayOptions } from '../../../../src/presentation/components/SPARQLAutocompleteComponent';
import { SPARQLAutocompleteService } from '../../../../src/application/services/SPARQLAutocompleteService';
import { SPARQLSuggestion, SuggestionType } from '../../../../src/domain/autocomplete/SPARQLSuggestion';
import { Result } from '../../../../src/domain/core/Result';

// Mock EditorView
const mockEditorView = {
    dom: document.createElement('div'),
    coordsAtPos: jest.fn().mockReturnValue({
        top: 100, bottom: 120, left: 200, right: 250
    }),
    dispatch: jest.fn(),
    state: {
        selection: { main: { from: 0, to: 0 } },
        doc: { toString: () => 'SELECT * WHERE { ?s ?p ?o }' }
    }
} as any;

// Mock DOM setup
Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
Object.defineProperty(window, 'scrollX', { value: 0, writable: true });
Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });

HTMLElement.prototype.getBoundingClientRect = jest.fn(() => ({
    top: 100, left: 200, bottom: 130, right: 400,
    width: 200, height: 30, x: 200, y: 100, toJSON: () => {}
}));
HTMLElement.prototype.scrollIntoView = jest.fn();
HTMLElement.prototype.empty = jest.fn(function() { this.innerHTML = ''; });

describe('SPARQLAutocompleteComponent Accessibility Tests', () => {
    let component: SPARQLAutocompleteComponent;
    let mockAutocompleteService: jest.Mocked<SPARQLAutocompleteService>;
    let mockSuggestions: SPARQLSuggestion[];

    beforeEach(() => {
        document.body.innerHTML = '';
        
        mockSuggestions = [
            SPARQLSuggestion.create({
                id: 'select-keyword',
                text: 'SELECT',
                insertText: 'SELECT ',
                type: SuggestionType.KEYWORD,
                confidence: 0.9,
                contextualScore: 0.8,
                metadata: { description: 'Retrieve data from the dataset' }
            }),
            SPARQLSuggestion.create({
                id: 'where-keyword',
                text: 'WHERE',
                insertText: 'WHERE { ',
                type: SuggestionType.KEYWORD,
                confidence: 0.85,
                contextualScore: 0.9
            }),
            SPARQLSuggestion.create({
                id: 'rdf-type-property',
                text: 'rdf:type',
                type: SuggestionType.PROPERTY,
                confidence: 0.7,
                contextualScore: 0.6,
                metadata: { description: 'The subject is an instance of a class' }
            })
        ];

        mockAutocompleteService = {
            getSuggestions: jest.fn().mockResolvedValue(Result.ok(mockSuggestions)),
            clearCache: jest.fn()
        } as any;

        component = new SPARQLAutocompleteComponent(mockAutocompleteService);
    });

    afterEach(() => {
        component.destroy();
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    describe('ARIA Attributes and Labels', () => {
        beforeEach(async () => {
            jest.useFakeTimers();
            component.showSuggestions(mockEditorView, 'SELECT', 6);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        it('should have proper ARIA roles for accessibility', () => {
            const container = document.querySelector('.exocortex-autocomplete-container');
            expect(container).toBeTruthy();
            
            // Container should have listbox role
            expect(container?.getAttribute('role')).toBe('listbox');
            
            const items = document.querySelectorAll('.exocortex-autocomplete-item');
            items.forEach(item => {
                expect(item.getAttribute('role')).toBe('option');
            });
        });

        it('should have proper ARIA labels and descriptions', () => {
            const container = document.querySelector('.exocortex-autocomplete-container');
            expect(container?.getAttribute('aria-label')).toContain('SPARQL suggestions');
            
            const firstItem = document.querySelector('.exocortex-autocomplete-item');
            expect(firstItem?.getAttribute('aria-label')).toContain('SELECT');
        });

        it('should indicate selected item with aria-selected', () => {
            const items = document.querySelectorAll('.exocortex-autocomplete-item');
            expect(items[0].getAttribute('aria-selected')).toBe('true');
            expect(items[1].getAttribute('aria-selected')).toBe('false');
            
            // Navigate to next item
            const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            document.dispatchEvent(downEvent);
            
            expect(items[0].getAttribute('aria-selected')).toBe('false');
            expect(items[1].getAttribute('aria-selected')).toBe('true');
        });

        it('should have proper tabindex for keyboard navigation', () => {
            const container = document.querySelector('.exocortex-autocomplete-container');
            expect(container?.getAttribute('tabindex')).toBe('0');
            
            const items = document.querySelectorAll('.exocortex-autocomplete-item');
            items.forEach((item, index) => {
                if (index === 0) {
                    expect(item.getAttribute('tabindex')).toBe('0');
                } else {
                    expect(item.getAttribute('tabindex')).toBe('-1');
                }
            });
        });

        it('should announce live region changes', () => {
            const liveRegion = document.querySelector('[aria-live]');
            expect(liveRegion).toBeTruthy();
            expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
            expect(liveRegion?.getAttribute('aria-atomic')).toBe('true');
        });
    });

    describe('Keyboard Navigation Accessibility', () => {
        beforeEach(async () => {
            jest.useFakeTimers();
            component.showSuggestions(mockEditorView, 'SELECT', 6);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        it('should support full keyboard navigation', () => {
            const items = document.querySelectorAll('.exocortex-autocomplete-item');
            
            // Arrow Down - should move to next item
            let downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            document.dispatchEvent(downEvent);
            expect(component.getSelectedSuggestion()?.getId()).toBe('where-keyword');
            
            // Arrow Down again - should move to third item
            downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            document.dispatchEvent(downEvent);
            expect(component.getSelectedSuggestion()?.getId()).toBe('rdf-type-property');
            
            // Arrow Up - should move back
            const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            document.dispatchEvent(upEvent);
            expect(component.getSelectedSuggestion()?.getId()).toBe('where-keyword');
        });

        it('should handle Home and End keys', () => {
            // Move to middle item first
            const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            document.dispatchEvent(downEvent);
            
            // Home should go to first item
            const homeEvent = new KeyboardEvent('keydown', { key: 'Home' });
            document.dispatchEvent(homeEvent);
            expect(component.getSelectedSuggestion()?.getId()).toBe('select-keyword');
            
            // End should go to last item
            const endEvent = new KeyboardEvent('keydown', { key: 'End' });
            document.dispatchEvent(endEvent);
            expect(component.getSelectedSuggestion()?.getId()).toBe('rdf-type-property');
        });

        it('should handle Page Up/Down for long lists', async () => {
            // Create a long list of suggestions
            const longSuggestionList = Array.from({ length: 50 }, (_, i) => 
                SPARQLSuggestion.create({
                    id: `item-${i}`,
                    text: `ITEM_${i}`,
                    type: SuggestionType.KEYWORD,
                    confidence: 0.5,
                    contextualScore: 0.5
                })
            );

            mockAutocompleteService.getSuggestions.mockResolvedValueOnce(
                Result.ok(longSuggestionList)
            );

            component.destroy();
            component = new SPARQLAutocompleteComponent(mockAutocompleteService);
            
            component.showSuggestions(mockEditorView, 'ITEM', 4);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));

            const initialSelection = component.getSelectedSuggestion()?.getId();
            
            // Page Down should move 10 items down
            const pageDownEvent = new KeyboardEvent('keydown', { key: 'PageDown' });
            document.dispatchEvent(pageDownEvent);
            
            const afterPageDown = component.getSelectedSuggestion()?.getId();
            expect(afterPageDown).not.toBe(initialSelection);
            
            // Page Up should move back up
            const pageUpEvent = new KeyboardEvent('keydown', { key: 'PageUp' });
            document.dispatchEvent(pageUpEvent);
            
            const afterPageUp = component.getSelectedSuggestion()?.getId();
            expect(afterPageUp).toBe(initialSelection);
        });

        it('should support type-ahead navigation', () => {
            // Type 'W' should jump to WHERE suggestion
            const wKeyEvent = new KeyboardEvent('keydown', { key: 'w' });
            document.dispatchEvent(wKeyEvent);
            
            expect(component.getSelectedSuggestion()?.getText()).toBe('WHERE');
            
            // Type 'R' should jump to rdf:type suggestion
            const rKeyEvent = new KeyboardEvent('keydown', { key: 'r' });
            document.dispatchEvent(rKeyEvent);
            
            expect(component.getSelectedSuggestion()?.getText()).toBe('rdf:type');
        });
    });

    describe('Screen Reader Support', () => {
        beforeEach(async () => {
            jest.useFakeTimers();
            component.showSuggestions(mockEditorView, 'SELECT', 6);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        it('should announce suggestion count', () => {
            const announcement = document.querySelector('[aria-live] .sr-only');
            expect(announcement?.textContent).toContain('3 suggestions available');
        });

        it('should announce selected item details', () => {
            const selectedItem = document.querySelector('[aria-selected="true"]');
            const description = selectedItem?.querySelector('.sr-only');
            expect(description?.textContent).toContain('SELECT');
            expect(description?.textContent).toContain('Keyword');
        });

        it('should announce navigation changes', () => {
            const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            document.dispatchEvent(downEvent);
            
            const announcement = document.querySelector('[aria-live]');
            expect(announcement?.textContent).toContain('WHERE selected');
        });

        it('should provide context information', () => {
            const contextInfo = document.querySelector('.autocomplete-context-info');
            expect(contextInfo?.textContent).toContain('Press Tab or Enter to accept');
            expect(contextInfo?.textContent).toContain('Press Escape to close');
        });
    });

    describe('High Contrast and Visual Accessibility', () => {
        beforeEach(async () => {
            jest.useFakeTimers();
            component.showSuggestions(mockEditorView, 'SELECT', 6);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        it('should support high contrast mode', () => {
            // Simulate high contrast mode
            document.body.classList.add('high-contrast');
            
            const items = document.querySelectorAll('.exocortex-autocomplete-item');
            items.forEach(item => {
                const styles = getComputedStyle(item as HTMLElement);
                // In high contrast mode, should have visible borders
                expect(styles.border).not.toBe('none');
            });
            
            document.body.classList.remove('high-contrast');
        });

        it('should have sufficient color contrast', () => {
            const selectedItem = document.querySelector('.exocortex-autocomplete-item');
            const styles = getComputedStyle(selectedItem as HTMLElement);
            
            // Background should be different from text color
            expect(styles.backgroundColor).not.toBe(styles.color);
            
            // Should use CSS custom properties for theme compatibility
            expect(styles.backgroundColor).toContain('var(--');
            expect(styles.color).toContain('var(--');
        });

        it('should indicate focus clearly', () => {
            const container = document.querySelector('.exocortex-autocomplete-container');
            (container as HTMLElement)?.focus();
            
            const styles = getComputedStyle(container as HTMLElement);
            // Should have focus indicator
            expect(styles.outline).not.toBe('none');
        });

        it('should scale with font size preferences', () => {
            // Simulate larger font size preference
            document.documentElement.style.fontSize = '20px';
            
            const items = document.querySelectorAll('.exocortex-autocomplete-item');
            items.forEach(item => {
                const styles = getComputedStyle(item as HTMLElement);
                // Should use relative units
                expect(styles.fontSize).toMatch(/(em|rem|%)/);
                expect(styles.padding).toMatch(/(em|rem|%)/);
            });
            
            document.documentElement.style.fontSize = '';
        });
    });

    describe('Mobile and Touch Accessibility', () => {
        beforeEach(async () => {
            // Simulate mobile viewport
            Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });
            
            jest.useFakeTimers();
            component.showSuggestions(mockEditorView, 'SELECT', 6);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        it('should have touch-friendly target sizes', () => {
            const items = document.querySelectorAll('.exocortex-autocomplete-item');
            items.forEach(item => {
                const rect = (item as HTMLElement).getBoundingClientRect();
                // Minimum 44px touch target
                expect(rect.height).toBeGreaterThanOrEqual(44);
            });
        });

        it('should handle touch events', () => {
            const firstItem = document.querySelector('.exocortex-autocomplete-item') as HTMLElement;
            const mockOnSelected = jest.fn();
            component.onSuggestionSelected = mockOnSelected;
            
            // Simulate touch
            const touchEvent = new TouchEvent('touchend', {
                bubbles: true,
                touches: []
            });
            firstItem.dispatchEvent(touchEvent);
            
            expect(mockOnSelected).toHaveBeenCalled();
        });

        it('should adjust layout for small screens', () => {
            const container = document.querySelector('.exocortex-autocomplete-container') as HTMLElement;
            const styles = getComputedStyle(container);
            
            // Should have mobile-appropriate width
            expect(parseInt(styles.maxWidth)).toBeLessThan(400);
        });

        it('should support pinch zoom', () => {
            const container = document.querySelector('.exocortex-autocomplete-container') as HTMLElement;
            
            // Should not prevent zoom
            expect(container.style.touchAction).not.toBe('none');
        });
    });

    describe('Reduced Motion Support', () => {
        beforeEach(() => {
            // Mock reduced motion preference
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: jest.fn().mockImplementation(query => ({
                    matches: query === '(prefers-reduced-motion: reduce)',
                    media: query,
                    onchange: null,
                    addListener: jest.fn(),
                    removeListener: jest.fn(),
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn(),
                    dispatchEvent: jest.fn(),
                })),
            });
        });

        it('should respect reduced motion preferences', async () => {
            jest.useFakeTimers();
            component.showSuggestions(mockEditorView, 'SELECT', 6);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));
            
            const items = document.querySelectorAll('.exocortex-autocomplete-item');
            items.forEach(item => {
                const styles = getComputedStyle(item as HTMLElement);
                // Should disable animations when reduced motion is preferred
                expect(styles.animation).toBe('none');
                expect(styles.transition).toBe('none');
            });
        });

        it('should provide instant feedback without animations', () => {
            // Navigation should work immediately without waiting for animations
            const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            document.dispatchEvent(downEvent);
            
            // Selection should change immediately
            expect(component.getSelectedSuggestion()?.getId()).toBe('where-keyword');
        });
    });

    describe('Language and Internationalization', () => {
        it('should support RTL languages', () => {
            // Simulate RTL language
            document.documentElement.dir = 'rtl';
            
            jest.useFakeTimers();
            component.showSuggestions(mockEditorView, 'SELECT', 6);
            jest.runAllTimers();
            
            const container = document.querySelector('.exocortex-autocomplete-container') as HTMLElement;
            const styles = getComputedStyle(container);
            
            // Should adjust positioning for RTL
            expect(styles.direction).toBe('rtl');
            
            document.documentElement.dir = 'ltr';
        });

        it('should handle long suggestion texts gracefully', async () => {
            const longSuggestion = SPARQLSuggestion.create({
                id: 'long-suggestion',
                text: 'A_VERY_LONG_SUGGESTION_TEXT_THAT_MIGHT_OVERFLOW_THE_CONTAINER_WIDTH',
                type: SuggestionType.KEYWORD,
                confidence: 0.5,
                contextualScore: 0.5,
                metadata: {
                    description: 'This is a very long description that should wrap properly and not break the layout'
                }
            });

            mockAutocompleteService.getSuggestions.mockResolvedValueOnce(
                Result.ok([longSuggestion])
            );

            jest.useFakeTimers();
            component.showSuggestions(mockEditorView, 'LONG', 4);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));

            const item = document.querySelector('.exocortex-autocomplete-item') as HTMLElement;
            const styles = getComputedStyle(item);
            
            // Should handle text overflow
            expect(styles.textOverflow).toBe('ellipsis');
            expect(styles.overflow).toBe('hidden');
        });

        it('should provide proper language attributes', () => {
            const container = document.querySelector('.exocortex-autocomplete-container');
            expect(container?.getAttribute('lang')).toBe('en');
        });
    });

    describe('Error State Accessibility', () => {
        it('should announce errors to screen readers', async () => {
            mockAutocompleteService.getSuggestions.mockResolvedValueOnce(
                Result.fail('Service unavailable')
            );

            jest.useFakeTimers();
            component.showSuggestions(mockEditorView, 'SELECT', 6);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));

            const errorRegion = document.querySelector('[role="alert"]');
            expect(errorRegion).toBeTruthy();
            expect(errorRegion?.textContent).toContain('Service unavailable');
        });

        it('should provide recovery instructions', async () => {
            mockAutocompleteService.getSuggestions.mockRejectedValueOnce(
                new Error('Network error')
            );

            jest.useFakeTimers();
            component.showSuggestions(mockEditorView, 'SELECT', 6);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));

            const instructions = document.querySelector('.error-recovery-instructions');
            expect(instructions).toBeTruthy();
            expect(instructions?.textContent).toContain('Try again');
        });

        it('should maintain focus management during errors', async () => {
            mockAutocompleteService.getSuggestions.mockRejectedValueOnce(
                new Error('Service error')
            );

            const activeElementBefore = document.activeElement;

            jest.useFakeTimers();
            component.showSuggestions(mockEditorView, 'SELECT', 6);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));

            // Focus should return to original element
            expect(document.activeElement).toBe(activeElementBefore);
        });
    });
});