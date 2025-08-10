import { SPARQLAutocompleteComponent, AutocompleteDisplayOptions } from '../../../../src/presentation/components/SPARQLAutocompleteComponent';
import { SPARQLAutocompleteService } from '../../../../src/application/services/SPARQLAutocompleteService';
import { SPARQLSuggestion, SuggestionType } from '../../../../src/domain/autocomplete/SPARQLSuggestion';
import { Result } from '../../../../src/domain/core/Result';

// Mock EditorView for testing
const mockEditorView = {
    dom: document.createElement('div'),
    coordsAtPos: jest.fn(),
    dispatch: jest.fn(),
    state: {
        selection: {
            main: {
                from: 0,
                to: 0
            }
        },
        doc: {
            toString: () => 'SELECT * WHERE { ?s ?p ?o }'
        }
    }
} as any;

// Mock DOM methods
Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
Object.defineProperty(window, 'scrollX', { value: 0, writable: true });
Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });

// Mock HTMLElement methods
HTMLElement.prototype.getBoundingClientRect = jest.fn(() => ({
    top: 100,
    left: 200,
    bottom: 130,
    right: 400,
    width: 200,
    height: 30,
    x: 200,
    y: 100,
    toJSON: () => {}
}));

HTMLElement.prototype.scrollIntoView = jest.fn();
HTMLElement.prototype.empty = jest.fn(function() {
    this.innerHTML = '';
});

describe('SPARQLAutocompleteComponent', () => {
    let component: SPARQLAutocompleteComponent;
    let mockAutocompleteService: jest.Mocked<SPARQLAutocompleteService>;
    let mockSuggestions: SPARQLSuggestion[];

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '';
        
        // Create mock suggestions
        mockSuggestions = [
            SPARQLSuggestion.create({
                id: 'keyword-select',
                text: 'SELECT',
                insertText: 'SELECT ',
                type: SuggestionType.KEYWORD,
                confidence: 0.9,
                contextualScore: 0.8,
                metadata: {
                    description: 'Query form that returns variable bindings',
                    usage: 'SELECT ?var WHERE { ... }'
                }
            }),
            SPARQLSuggestion.create({
                id: 'keyword-where',
                text: 'WHERE',
                insertText: 'WHERE { ',
                type: SuggestionType.KEYWORD,
                confidence: 0.85,
                contextualScore: 0.9,
                metadata: {
                    description: 'Graph pattern matching clause'
                }
            }),
            SPARQLSuggestion.create({
                id: 'property-rdf-type',
                text: 'rdf:type',
                insertText: 'rdf:type',
                type: SuggestionType.PROPERTY,
                confidence: 0.7,
                contextualScore: 0.6,
                metadata: {
                    description: 'The subject is an instance of a class',
                    namespace: 'rdf'
                }
            })
        ];

        // Create mock service
        mockAutocompleteService = {
            getSuggestions: jest.fn(),
            clearCache: jest.fn()
        } as any;

        // Setup default successful response
        mockAutocompleteService.getSuggestions.mockResolvedValue(
            Result.ok(mockSuggestions)
        );

        // Setup editor coordinates
        mockEditorView.coordsAtPos.mockReturnValue({
            top: 100,
            bottom: 120,
            left: 200,
            right: 250
        });

        component = new SPARQLAutocompleteComponent(mockAutocompleteService);
    });

    afterEach(() => {
        component.destroy();
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    describe('Construction and Initialization', () => {
        it('should initialize with default options', () => {
            const comp = new SPARQLAutocompleteComponent(mockAutocompleteService);
            expect(comp.isShowing()).toBe(false);
            expect(comp.getSelectedSuggestion()).toBeNull();
        });

        it('should accept custom display options', () => {
            const options: AutocompleteDisplayOptions = {
                showDescriptions: false,
                showTypes: false,
                maxHeight: 200,
                minWidth: 150,
                maxWidth: 400
            };

            const comp = new SPARQLAutocompleteComponent(mockAutocompleteService, options);
            expect(comp).toBeDefined();
        });
    });

    describe('Suggestion Display', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        it('should show suggestions after debounce delay', async () => {
            const query = 'SELECT * WHERE { ?s';
            const cursorPosition = 18;

            component.showSuggestions(mockEditorView, query, cursorPosition);

            // Should not show immediately
            expect(component.isShowing()).toBe(false);

            // Fast-forward timers
            jest.runAllTimers();

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockAutocompleteService.getSuggestions).toHaveBeenCalledWith(
                query,
                cursorPosition,
                expect.objectContaining({
                    maxSuggestions: 15,
                    includeDescriptions: true,
                    contextBoost: true,
                    cacheResults: true
                })
            );

            expect(component.isShowing()).toBe(true);
        });

        it('should hide suggestions when no results', async () => {
            mockAutocompleteService.getSuggestions.mockResolvedValue(
                Result.ok([])
            );

            component.showSuggestions(mockEditorView, 'SELECT', 6);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(component.isShowing()).toBe(false);
        });

        it('should handle service errors gracefully', async () => {
            mockAutocompleteService.getSuggestions.mockResolvedValue(
                Result.fail('Service error')
            );

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            component.showSuggestions(mockEditorView, 'SELECT', 6);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(component.isShowing()).toBe(false);
            consoleSpy.mockRestore();
        });

        it('should debounce multiple rapid calls', async () => {
            component.showSuggestions(mockEditorView, 'S', 1);
            component.showSuggestions(mockEditorView, 'SE', 2);
            component.showSuggestions(mockEditorView, 'SEL', 3);

            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));

            // Should only make one service call with the latest query
            expect(mockAutocompleteService.getSuggestions).toHaveBeenCalledTimes(1);
            expect(mockAutocompleteService.getSuggestions).toHaveBeenCalledWith(
                'SEL',
                3,
                expect.any(Object)
            );
        });
    });

    describe('DOM Rendering', () => {
        beforeEach(async () => {
            jest.useFakeTimers();
            component.showSuggestions(mockEditorView, 'SELECT', 6);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        it('should create container in DOM', () => {
            const container = document.querySelector('.exocortex-autocomplete-container');
            expect(container).toBeTruthy();
            expect(container?.style.display).toBe('block');
        });

        it('should render suggestion items', () => {
            const items = document.querySelectorAll('.exocortex-autocomplete-item');
            expect(items).toHaveLength(3);
            
            const firstItem = items[0];
            expect(firstItem.textContent).toContain('SELECT');
            expect(firstItem.textContent).toContain('Query form that returns variable bindings');
        });

        it('should show type icons when enabled', () => {
            const typeIcons = document.querySelectorAll('.autocomplete-type-icon');
            expect(typeIcons).toHaveLength(3);
            
            // Check different type icons
            expect(typeIcons[0].textContent).toBe('K'); // KEYWORD
            expect(typeIcons[1].textContent).toBe('K'); // KEYWORD
            expect(typeIcons[2].textContent).toBe('P'); // PROPERTY
        });

        it('should show confidence indicators', () => {
            const confidenceIndicators = document.querySelectorAll('.autocomplete-confidence');
            expect(confidenceIndicators).toHaveLength(3);
            
            // Check that confidence bars are rendered
            const firstIndicator = confidenceIndicators[0];
            const bars = firstIndicator.querySelectorAll('div');
            expect(bars).toHaveLength(3); // Should have 3 bars
        });

        it('should hide descriptions when option disabled', async () => {
            component.destroy();
            component = new SPARQLAutocompleteComponent(mockAutocompleteService, {
                showDescriptions: false
            });

            component.showSuggestions(mockEditorView, 'SELECT', 6);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));

            const descriptions = document.querySelectorAll('.autocomplete-item-description');
            expect(descriptions).toHaveLength(0);
        });
    });

    describe('Keyboard Navigation', () => {
        beforeEach(async () => {
            jest.useFakeTimers();
            component.showSuggestions(mockEditorView, 'SELECT', 6);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        it('should navigate with arrow keys', () => {
            // Initial selection should be first item
            expect(component.getSelectedSuggestion()?.getId()).toBe('keyword-select');

            // Navigate down
            const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            document.dispatchEvent(downEvent);
            expect(component.getSelectedSuggestion()?.getId()).toBe('keyword-where');

            // Navigate down again
            document.dispatchEvent(downEvent);
            expect(component.getSelectedSuggestion()?.getId()).toBe('property-rdf-type');

            // Navigate up
            const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            document.dispatchEvent(upEvent);
            expect(component.getSelectedSuggestion()?.getId()).toBe('keyword-where');
        });

        it('should not navigate beyond bounds', () => {
            // Try to go up from first item
            const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            document.dispatchEvent(upEvent);
            expect(component.getSelectedSuggestion()?.getId()).toBe('keyword-select');

            // Navigate to last item
            for (let i = 0; i < 3; i++) {
                const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
                document.dispatchEvent(downEvent);
            }
            expect(component.getSelectedSuggestion()?.getId()).toBe('property-rdf-type');
        });

        it('should apply suggestion on Enter key', () => {
            const mockOnSelected = jest.fn();
            component.onSuggestionSelected = mockOnSelected;

            const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
            document.dispatchEvent(enterEvent);

            expect(mockOnSelected).toHaveBeenCalledWith(mockSuggestions[0]);
            expect(component.isShowing()).toBe(false);
        });

        it('should apply suggestion on Tab key', () => {
            const mockOnSelected = jest.fn();
            component.onSuggestionSelected = mockOnSelected;

            const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
            document.dispatchEvent(tabEvent);

            expect(mockOnSelected).toHaveBeenCalledWith(mockSuggestions[0]);
            expect(component.isShowing()).toBe(false);
        });

        it('should hide on Escape key', () => {
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(escapeEvent);

            expect(component.isShowing()).toBe(false);
        });
    });

    describe('Mouse Interaction', () => {
        beforeEach(async () => {
            jest.useFakeTimers();
            component.showSuggestions(mockEditorView, 'SELECT', 6);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        it('should update selection on mouse hover', () => {
            const items = document.querySelectorAll('.exocortex-autocomplete-item');
            const secondItem = items[1] as HTMLElement;

            // Simulate mouse enter
            const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true });
            secondItem.dispatchEvent(mouseEnterEvent);

            expect(component.getSelectedSuggestion()?.getId()).toBe('keyword-where');
        });

        it('should apply suggestion on click', () => {
            const mockOnSelected = jest.fn();
            component.onSuggestionSelected = mockOnSelected;

            const items = document.querySelectorAll('.exocortex-autocomplete-item');
            const firstItem = items[0] as HTMLElement;

            // Simulate click
            const clickEvent = new MouseEvent('click', { bubbles: true });
            firstItem.dispatchEvent(clickEvent);

            expect(mockOnSelected).toHaveBeenCalledWith(mockSuggestions[0]);
            expect(component.isShowing()).toBe(false);
        });

        it('should hide on external click', async () => {
            // Click outside the autocomplete container
            const externalElement = document.createElement('div');
            document.body.appendChild(externalElement);

            const clickEvent = new MouseEvent('click', { bubbles: true });
            externalElement.dispatchEvent(clickEvent);

            expect(component.isShowing()).toBe(false);
        });
    });

    describe('Positioning', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        it('should position dropdown below cursor by default', async () => {
            mockEditorView.coordsAtPos.mockReturnValue({
                top: 100,
                bottom: 120,
                left: 200,
                right: 250
            });

            component.showSuggestions(mockEditorView, 'SELECT', 6);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));

            const container = document.querySelector('.exocortex-autocomplete-container') as HTMLElement;
            expect(container.style.top).toBe('120px'); // Should be at coords.bottom
            expect(container.style.left).toBe('200px'); // Should be at coords.left
        });

        it('should position dropdown above cursor when no space below', async () => {
            // Mock large viewport height to trigger above positioning
            Object.defineProperty(window, 'innerHeight', { value: 150 });
            
            mockEditorView.coordsAtPos.mockReturnValue({
                top: 100,
                bottom: 120,
                left: 200,
                right: 250
            });

            // Mock container height
            HTMLElement.prototype.getBoundingClientRect = jest.fn(() => ({
                height: 200, // Larger than available space below
                width: 200,
                top: 0,
                left: 0,
                bottom: 200,
                right: 200,
                x: 0,
                y: 0,
                toJSON: () => {}
            }));

            component.showSuggestions(mockEditorView, 'SELECT', 6);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));

            const container = document.querySelector('.exocortex-autocomplete-container') as HTMLElement;
            // Should position above cursor (top - height)
            const expectedTop = 100 - 200; // coords.top - container.height
            expect(parseInt(container.style.top)).toBeLessThan(120); // Above cursor
        });

        it('should adjust horizontal position when near viewport edge', async () => {
            Object.defineProperty(window, 'innerWidth', { value: 300 });
            
            mockEditorView.coordsAtPos.mockReturnValue({
                top: 100,
                bottom: 120,
                left: 250, // Near right edge
                right: 280
            });

            component.showSuggestions(mockEditorView, 'SELECT', 6);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));

            const container = document.querySelector('.exocortex-autocomplete-container') as HTMLElement;
            const leftPosition = parseInt(container.style.left);
            expect(leftPosition).toBeLessThan(250); // Should be adjusted left
        });
    });

    describe('Cleanup and Destruction', () => {
        it('should clean up on destroy', async () => {
            jest.useFakeTimers();
            component.showSuggestions(mockEditorView, 'SELECT', 6);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(component.isShowing()).toBe(true);

            component.destroy();

            expect(component.isShowing()).toBe(false);
            expect(document.querySelector('.exocortex-autocomplete-container')).toBeNull();
        });

        it('should abort pending requests on hide', async () => {
            // Start a request
            component.showSuggestions(mockEditorView, 'SELECT', 6);
            
            // Hide before completion
            component.hideSuggestions();

            // Verify service call was aborted (implementation detail)
            expect(component.isShowing()).toBe(false);
        });

        it('should clear timeouts on destroy', () => {
            jest.useFakeTimers();
            
            component.showSuggestions(mockEditorView, 'SELECT', 6);
            component.destroy();

            // Verify no timers are left running
            expect(jest.getTimerCount()).toBe(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty suggestion list', async () => {
            jest.useFakeTimers();
            mockAutocompleteService.getSuggestions.mockResolvedValue(Result.ok([]));

            component.showSuggestions(mockEditorView, 'UNKNOWN', 7);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(component.isShowing()).toBe(false);
        });

        it('should handle invalid cursor coordinates', async () => {
            jest.useFakeTimers();
            mockEditorView.coordsAtPos.mockReturnValue(null);

            component.showSuggestions(mockEditorView, 'SELECT', 6);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));

            // Should still create container even without proper positioning
            expect(component.isShowing()).toBe(true);
        });

        it('should handle suggestions without metadata', async () => {
            jest.useFakeTimers();
            const suggestionWithoutMetadata = SPARQLSuggestion.create({
                id: 'simple',
                text: 'SIMPLE',
                type: SuggestionType.KEYWORD,
                confidence: 0.5,
                contextualScore: 0.5
            });

            mockAutocompleteService.getSuggestions.mockResolvedValue(
                Result.ok([suggestionWithoutMetadata])
            );

            component.showSuggestions(mockEditorView, 'SIMPLE', 6);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));

            const items = document.querySelectorAll('.exocortex-autocomplete-item');
            expect(items).toHaveLength(1);
            expect(items[0].textContent).toContain('SIMPLE');
        });
    });
});