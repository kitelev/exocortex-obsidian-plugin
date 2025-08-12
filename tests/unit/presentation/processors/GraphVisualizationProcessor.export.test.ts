import { GraphVisualizationProcessor } from '../../../../src/presentation/processors/GraphVisualizationProcessor';
import { Graph } from '../../../../src/domain/semantic/core/Graph';
import { Triple, IRI, Literal } from '../../../../src/domain/semantic/core/Triple';
import { Plugin } from 'obsidian';

// Mock Obsidian classes
jest.mock('obsidian');

// Mock global functions used in export functionality
global.XMLSerializer = class {
    serializeToString(node: Node): string {
        return '<svg>mock-svg-content</svg>';
    }
};

// Mock URL constructor for IRI validation
class MockURL {
    constructor(url: string) {
        if (!url || !url.startsWith('http')) {
            throw new Error('Invalid URL');
        }
    }
    static createObjectURL = jest.fn(() => 'mock-blob-url');
    static revokeObjectURL = jest.fn();
}

global.URL = MockURL as any;

// Mock HTMLCanvasElement and CanvasRenderingContext2D
const mockCanvas = {
    _width: 0,
    _height: 0,
    getContext: jest.fn(),
    toBlob: jest.fn(),
    get width() { return this._width; },
    set width(value) { this._width = value; },
    get height() { return this._height; },
    set height(value) { this._height = value; }
};

const mockContext = {
    scale: jest.fn(),
    fillStyle: '',
    fillRect: jest.fn(),
    strokeStyle: '',
    lineWidth: 0,
    strokeRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 50 })),
    fillText: jest.fn(),
    font: '',
    textAlign: '',
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high'
};

global.document.createElement = jest.fn((tagName: string) => {
    if (tagName === 'canvas') {
        mockCanvas.getContext.mockReturnValue(mockContext);
        return mockCanvas as any;
    }
    if (tagName === 'a') {
        return {
            href: '',
            download: '',
            click: jest.fn(),
            style: { display: '' }
        } as any;
    }
    return {
        style: { cssText: '', display: '', background: '' },
        className: '',
        textContent: '',
        appendChild: jest.fn(),
        querySelector: jest.fn(),
        addEventListener: jest.fn(),
        setAttribute: jest.fn(),
        getBBox: jest.fn(() => ({ x: 0, y: 0, width: 100, height: 20 }))
    } as any;
});

// Mock getComputedStyle
global.getComputedStyle = jest.fn(() => ({
    getPropertyValue: jest.fn((prop: string) => {
        const colorMap: { [key: string]: string } = {
            '--background-primary': '#ffffff',
            '--background-modifier-border': '#e5e5e5',
            '--text-muted': '#6b7280',
            '--text-normal': '#000000',
            '--color-accent': '#7c3aed',
            '--color-blue': '#2563eb',
            '--color-green': '#059669'
        };
        return colorMap[prop] || '#000000';
    })
})) as any;

describe('GraphVisualizationProcessor - Export Functionality', () => {
    let processor: GraphVisualizationProcessor;
    let mockPlugin: Plugin;
    let graph: Graph;
    
    beforeEach(() => {
        mockPlugin = {
            app: {
                workspace: {
                    openLinkText: jest.fn()
                }
            }
        } as any;
        
        graph = new Graph();
        
        // Add test triples with simple valid IRIs
        try {
            graph.add(new Triple(
                new IRI('https://example.org/subject'),
                new IRI('https://example.org/predicate'),
                Literal.string('Test Object')
            ));
        } catch (error) {
            // If IRI construction fails, skip it - tests will work with empty graph
            console.warn('IRI construction failed:', error);
        }
        
        processor = new GraphVisualizationProcessor(mockPlugin, graph);
        
        // Reset mocks
        jest.clearAllMocks();
    });
    
    describe('PNG Export', () => {
        it('should create PNG export dropdown with resolution options', async () => {
            const container = document.createElement('div');
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            container.appendChild(svg);
            
            const data = {
                nodes: [
                    { id: 'node1', label: 'Test Node', type: 'subject' as const, group: 1, x: 100, y: 100 }
                ],
                links: [
                    { source: 'node1', target: 'node2', label: 'test-relation', id: 'link1' }
                ]
            };
            
            const config = {
                showLabels: true,
                nodeSize: 8,
                linkDistance: 80
            };
            
            // Call the private method through reflection
            const createDropdown = (processor as any).createPNGExportDropdown.bind(processor);
            const dropdown = createDropdown(container, data, config);
            
            expect(dropdown).toBeDefined();
            expect(dropdown.style.cssText).toContain('position: relative');
        });
        
        it('should export PNG with standard resolution', async () => {
            const container = document.createElement('div');
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '800');
            svg.setAttribute('height', '600');
            container.appendChild(svg);
            
            // Ensure querySelector finds the SVG
            container.querySelector = jest.fn(() => svg);
            
            const data = {
                nodes: [
                    { id: 'node1', label: 'Test Node', type: 'subject' as const, group: 1, x: 100, y: 100 }
                ],
                links: []
            };
            
            const config = {
                showLabels: true,
                nodeSize: 8
            };
            
            // Reset canvas dimensions
            mockCanvas._width = 0;
            mockCanvas._height = 0;
            
            // Mock canvas.toBlob to simulate successful PNG creation
            mockCanvas.toBlob.mockImplementation((callback) => {
                const mockBlob = new Blob(['mock-png-data'], { type: 'image/png' });
                Object.defineProperty(mockBlob, 'size', { value: 1024 });
                callback(mockBlob);
            });
            
            // Call export method
            await (processor as any).exportAsPNG(container, data, config, 1, 'test.png');
            
            expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
            // Canvas dimensions should be set by the export method
            expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png', 0.9);
        });
        
        it('should export PNG with high resolution (2x)', async () => {
            const container = document.createElement('div');
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '800');
            svg.setAttribute('height', '600');
            container.appendChild(svg);
            
            // Ensure querySelector finds the SVG
            container.querySelector = jest.fn(() => svg);
            
            const data = {
                nodes: [
                    { id: 'node1', label: 'Test Node', type: 'subject' as const, group: 1, x: 100, y: 100 }
                ],
                links: []
            };
            
            const config = { showLabels: true, nodeSize: 8 };
            
            mockCanvas.toBlob.mockImplementation((callback) => {
                const mockBlob = new Blob(['mock-png-data'], { type: 'image/png' });
                Object.defineProperty(mockBlob, 'size', { value: 4096 });
                callback(mockBlob);
            });
            
            await (processor as any).exportAsPNG(container, data, config, 2, 'test-hd.png');
            
            expect(mockCanvas.width).toBe(1600); // 800 * 2
            expect(mockCanvas.height).toBe(1200); // 600 * 2
            expect(mockContext.scale).toHaveBeenCalledWith(2, 2);
        });
        
        it('should export PNG with 4K resolution (4x)', async () => {
            const container = document.createElement('div');
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '800');
            svg.setAttribute('height', '600');
            container.appendChild(svg);
            
            // Ensure querySelector finds the SVG
            container.querySelector = jest.fn(() => svg);
            
            const data = {
                nodes: [
                    { id: 'node1', label: 'Test Node', type: 'subject' as const, group: 1, x: 100, y: 100 }
                ],
                links: []
            };
            
            const config = { showLabels: true, nodeSize: 8 };
            
            mockCanvas.toBlob.mockImplementation((callback) => {
                const mockBlob = new Blob(['mock-png-data'], { type: 'image/png' });
                Object.defineProperty(mockBlob, 'size', { value: 16384 });
                callback(mockBlob);
            });
            
            await (processor as any).exportAsPNG(container, data, config, 4, 'test-4k.png');
            
            expect(mockCanvas.width).toBe(3200); // 800 * 4
            expect(mockCanvas.height).toBe(2400); // 600 * 4
            expect(mockContext.scale).toHaveBeenCalledWith(4, 4);
        });
        
        it('should handle PNG export errors gracefully', async () => {
            const container = document.createElement('div');
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '800');
            svg.setAttribute('height', '600');
            container.appendChild(svg);
            
            // Ensure querySelector finds the SVG
            container.querySelector = jest.fn(() => svg);
            
            const data = { nodes: [], links: [] };
            const config = { showLabels: true, nodeSize: 8 };
            
            // Mock canvas.toBlob to return null (failure case)
            mockCanvas.toBlob.mockImplementation((callback) => {
                callback(null);
            });
            
            // Should not throw error, but handle gracefully
            await expect((processor as any).exportAsPNG(container, data, config, 1, 'test.png'))
                .resolves.toBeUndefined();
            
            expect(mockCanvas.toBlob).toHaveBeenCalled();
        });
    });
    
    describe('SVG Export', () => {
        it('should export SVG successfully', () => {
            const container = document.createElement('div');
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            container.appendChild(svg);
            container.querySelector = jest.fn(() => svg);
            
            // Mock console.log to capture test environment behavior
            const originalConsoleLog = console.log;
            console.log = jest.fn();
            
            (processor as any).exportAsSVG(container);
            
            // In test environment (JSDOM), it should log instead of download
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Test environment: Would download knowledge-graph.svg')
            );
            
            // Restore original console.log
            console.log = originalConsoleLog;
        });
        
        it('should handle missing SVG gracefully', () => {
            const container = document.createElement('div');
            container.querySelector = jest.fn(() => null);
            
            // Should not throw error
            expect(() => (processor as any).exportAsSVG(container)).not.toThrow();
        });
    });
    
    describe('Canvas Rendering', () => {
        it('should render graph data to canvas', async () => {
            const data = {
                nodes: [
                    { id: 'node1', label: 'Node 1', type: 'subject' as const, group: 1, x: 100, y: 100 },
                    { id: 'node2', label: 'Node 2', type: 'object' as const, group: 2, x: 200, y: 200 }
                ],
                links: [
                    { source: 'node1', target: 'node2', label: 'connects', id: 'link1' }
                ]
            };
            
            const config = {
                showLabels: true,
                nodeSize: 10
            };
            
            await (processor as any).renderGraphToCanvas(mockContext, data, config, 800, 600);
            
            // Verify nodes were rendered (using actual circular layout positions)
            expect(mockContext.beginPath).toHaveBeenCalled();
            // With circular layout: center=(400,300), radius=200
            // Node 1: 400 + 200*cos(0) = 600, 300 + 200*sin(0) = 300
            // Node 2: 400 + 200*cos(π) = 200, 300 + 200*sin(π) = 300  
            expect(mockContext.arc).toHaveBeenCalledWith(600, 300, 10, 0, 2 * Math.PI);
            expect(mockContext.arc).toHaveBeenCalledWith(200, 300, 10, 0, 2 * Math.PI);
            
            // Verify links were rendered (using actual positions)
            expect(mockContext.moveTo).toHaveBeenCalledWith(600, 300);
            expect(mockContext.lineTo).toHaveBeenCalledWith(200, 300);
            
            // Verify labels were rendered (using actual positions)
            expect(mockContext.fillText).toHaveBeenCalledWith('Node 1', 600, 325); // y + radius + 15
            expect(mockContext.fillText).toHaveBeenCalledWith('Node 2', 200, 325);
        });
        
        it('should render without labels when disabled', async () => {
            const data = {
                nodes: [
                    { id: 'node1', label: 'Node 1', type: 'subject' as const, group: 1, x: 100, y: 100 }
                ],
                links: []
            };
            
            const config = {
                showLabels: false,
                nodeSize: 10
            };
            
            await (processor as any).renderGraphToCanvas(mockContext, data, config, 800, 600);
            
            // Should render node but not label (using actual circular layout)
            // With circular layout: center=(400,300), radius=200, single node at 0 radians
            // Position: 400 + 200*cos(0) = 600, 300 + 200*sin(0) = 300
            expect(mockContext.arc).toHaveBeenCalledWith(600, 300, 10, 0, 2 * Math.PI);
            
            // Should not render node labels
            const fillTextCalls = (mockContext.fillText as jest.Mock).mock.calls.filter(
                call => call[0] === 'Node 1'
            );
            expect(fillTextCalls).toHaveLength(0);
        });
    });
    
    describe('Theme Integration', () => {
        it('should get theme colors correctly', () => {
            const color = (processor as any).getThemeColor('--background-primary');
            expect(color).toBe('#ffffff');
        });
        
        it('should get node colors based on type', () => {
            const subjectColor = (processor as any).getNodeCanvasColor('subject');
            const objectColor = (processor as any).getNodeCanvasColor('object');
            const predicateColor = (processor as any).getNodeCanvasColor('predicate');
            
            expect(subjectColor).toBe('#7c3aed'); // --color-accent
            expect(objectColor).toBe('#2563eb');  // --color-blue  
            expect(predicateColor).toBe('#059669'); // --color-green
        });
        
        it('should convert RGB colors to hex', () => {
            const hexColor = (processor as any).rgbToHex('rgb(123, 58, 237)');
            expect(hexColor).toBe('#7b3aed');
        });
        
        it('should handle invalid RGB colors', () => {
            const hexColor = (processor as any).rgbToHex('invalid-color');
            expect(hexColor).toBe('#000000');
        });
    });
    
    describe('File Download', () => {
        it('should download blob with correct filename', () => {
            const mockBlob = new Blob(['test'], { type: 'text/plain' });
            
            // Mock console.log to capture test environment behavior
            const originalConsoleLog = console.log;
            console.log = jest.fn();
            
            (processor as any).downloadBlob(mockBlob, 'test-file.txt');
            
            // In test environment (JSDOM), it should log instead of download
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Test environment: Would download test-file.txt (4 bytes)')
            );
            
            // Restore original console.log
            console.log = originalConsoleLog;
        });
    });
    
    describe('Arrow Head Rendering', () => {
        it('should draw arrow head correctly', () => {
            (processor as any).drawArrowHead(mockContext, 100, 100, 200, 200);
            
            expect(mockContext.beginPath).toHaveBeenCalled();
            expect(mockContext.moveTo).toHaveBeenCalled();
            expect(mockContext.lineTo).toHaveBeenCalled();
            expect(mockContext.stroke).toHaveBeenCalled();
        });
    });
});