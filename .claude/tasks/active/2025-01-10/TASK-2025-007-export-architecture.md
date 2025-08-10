# TASK-2025-007: Canvas-to-Image Export Architecture

## Overview
- **Task ID**: TASK-2025-007
- **Feature**: PNG Export Technical Design
- **Status**: in_progress  
- **Priority**: critical
- **Agent**: Technical Architect Agent
- **Created**: 2025-01-10

## Technical Architecture Design

### Export System Architecture

```typescript
interface ExportOptions {
    format: 'png' | 'svg';
    resolution: number; // 1x, 2x, 4x scaling factor
    quality?: number;   // PNG quality (0.1 - 1.0)
    filename?: string;
    dimensions?: { width: number; height: number };
}

interface ExportResult {
    success: boolean;
    filename: string;
    size: number;
    error?: string;
}
```

### PNG Export Implementation Strategy

#### Method 1: SVG-to-Canvas Direct Conversion
```typescript
private async exportAsPNG(
    container: HTMLElement, 
    options: ExportOptions
): Promise<ExportResult> {
    const svg = container.querySelector('svg');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Scale for resolution
    const scale = options.resolution || 1;
    canvas.width = svg.clientWidth * scale;
    canvas.height = svg.clientHeight * scale;
    
    // Create image from SVG
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
    const img = new Image();
    
    return new Promise((resolve) => {
        img.onload = () => {
            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob((blob) => {
                this.downloadBlob(blob, options.filename || 'graph.png');
                resolve({ success: true, filename: options.filename, size: blob.size });
            }, 'image/png', options.quality || 0.9);
        };
        img.src = URL.createObjectURL(svgBlob);
    });
}
```

#### Method 2: Canvas Recreation (More Reliable)
```typescript
private async exportAsPNGDirect(
    data: GraphData,
    config: GraphConfig,
    options: ExportOptions
): Promise<ExportResult> {
    const scale = options.resolution || 1;
    const width = 800 * scale;
    const height = 600 * scale;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Set high-DPI scaling
    ctx.scale(scale, scale);
    
    // Render background
    ctx.fillStyle = this.getThemeColor('--background-primary');
    ctx.fillRect(0, 0, 800, 600);
    
    // Render graph directly to canvas
    await this.renderGraphToCanvas(ctx, data, config, 800, 600);
    
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            this.downloadBlob(blob, options.filename || 'graph.png');
            resolve({ success: true, filename: options.filename, size: blob.size });
        }, 'image/png', options.quality || 0.9);
    });
}
```

### UI Architecture Enhancement

#### Resolution Selector Component
```typescript
private createResolutionSelector(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'export-resolution-selector';
    
    const label = document.createElement('label');
    label.textContent = 'Resolution: ';
    
    const select = document.createElement('select');
    const options = [
        { value: '1', label: 'Standard (800x600)' },
        { value: '2', label: 'High (1600x1200)' },
        { value: '4', label: '4K (3200x2400)' }
    ];
    
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        select.appendChild(option);
    });
    
    container.appendChild(label);
    container.appendChild(select);
    
    return container;
}
```

#### Enhanced Export Controls
```typescript
private addEnhancedExportControls(
    container: HTMLElement, 
    data: GraphData, 
    config: GraphConfig
): void {
    // Create export dropdown
    const exportContainer = document.createElement('div');
    exportContainer.className = 'graph-export-container';
    
    // PNG Export with resolution options
    const pngButton = document.createElement('button');
    pngButton.textContent = 'Export PNG ▼';
    
    const pngDropdown = this.createPNGExportDropdown(data, config);
    
    // SVG Export (existing)
    const svgButton = document.createElement('button');
    svgButton.textContent = 'Export SVG';
    svgButton.addEventListener('click', () => this.exportAsSVG(container));
    
    exportContainer.appendChild(pngButton);
    exportContainer.appendChild(pngDropdown);
    exportContainer.appendChild(svgButton);
    
    container.appendChild(exportContainer);
}
```

### Canvas Rendering Engine

#### Direct Canvas Graph Rendering
```typescript
private async renderGraphToCanvas(
    ctx: CanvasRenderingContext2D,
    data: GraphData,
    config: GraphConfig,
    width: number,
    height: number
): Promise<void> {
    // Position nodes (reuse existing algorithm)
    this.positionNodes(data.nodes, width, height);
    
    // Render links first (background)
    for (const link of data.links) {
        await this.renderLinkToCanvas(ctx, link, data.nodes, config);
    }
    
    // Render nodes on top
    for (const node of data.nodes) {
        await this.renderNodeToCanvas(ctx, node, config);
    }
    
    // Render labels if enabled
    if (config.showLabels) {
        for (const node of data.nodes) {
            this.renderNodeLabelToCanvas(ctx, node, config);
        }
    }
}

private renderNodeToCanvas(
    ctx: CanvasRenderingContext2D,
    node: GraphNode,
    config: GraphConfig
): void {
    const x = node.x || 0;
    const y = node.y || 0;
    const radius = config.nodeSize || 8;
    
    // Draw node circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = this.getNodeCanvasColor(node.type);
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = this.getThemeColor('--background-modifier-border');
    ctx.lineWidth = 2;
    ctx.stroke();
}
```

### Theme Integration

#### Theme Color Resolution
```typescript
private getThemeColor(cssVariable: string): string {
    // Get computed CSS custom property value
    const style = getComputedStyle(document.documentElement);
    const color = style.getPropertyValue(cssVariable).trim();
    
    // Convert CSS color to canvas-compatible format
    if (color.startsWith('hsl')) {
        return this.hslToHex(color);
    }
    if (color.startsWith('rgb')) {
        return this.rgbToHex(color);
    }
    
    return color || '#000000'; // fallback
}

private getNodeCanvasColor(type: 'subject' | 'object' | 'predicate'): string {
    switch (type) {
        case 'subject': return this.getThemeColor('--color-accent') || '#7c3aed';
        case 'object': return this.getThemeColor('--color-blue') || '#2563eb';
        case 'predicate': return this.getThemeColor('--color-green') || '#059669';
        default: return '#6b7280';
    }
}
```

### Error Handling & Validation

#### Export Validation
```typescript
private validateExportOptions(options: ExportOptions): Result<ExportOptions> {
    // Validate resolution limits
    if (options.resolution > 4) {
        return Result.failure('Maximum resolution is 4x (3200x2400)');
    }
    
    // Check browser canvas limits
    const maxDimension = 32767; // Most browsers
    const estimatedWidth = 800 * options.resolution;
    const estimatedHeight = 600 * options.resolution;
    
    if (estimatedWidth > maxDimension || estimatedHeight > maxDimension) {
        return Result.failure(`Resolution too high. Max canvas size: ${maxDimension}px`);
    }
    
    return Result.success(options);
}
```

### File Structure Changes

#### New Files to Create
```
src/presentation/processors/export/
├── GraphExportManager.ts          # Main export coordinator
├── CanvasRenderer.ts              # Direct canvas rendering
├── ExportOptionsUI.ts             # UI components for export
└── ThemeColorResolver.ts          # Theme integration

src/presentation/processors/GraphVisualizationProcessor.ts
└── Enhanced with export manager integration
```

#### Modified Files
1. **GraphVisualizationProcessor.ts**: 
   - Integrate GraphExportManager
   - Replace simple SVG export
   - Add enhanced controls

2. **Type Definitions**: Add export interfaces

## Implementation Plan

### Phase 1: Core PNG Export
1. Create GraphExportManager class
2. Implement SVG-to-Canvas conversion
3. Add basic PNG export functionality
4. Test with current graphs

### Phase 2: Resolution Control  
1. Create resolution selector UI
2. Add scaling logic
3. Implement canvas size validation
4. Test high-resolution exports

### Phase 3: Canvas Rendering Engine
1. Direct canvas graph rendering
2. Theme color integration  
3. High-quality rendering optimizations
4. Performance testing

### Phase 4: UI Enhancement
1. Enhanced export dropdown
2. Progress indicators
3. Error handling UI
4. User experience polish

## Performance Considerations

### Memory Management
- Clean up temporary canvas elements
- Revoke blob URLs after download
- Use requestAnimationFrame for large renders

### Browser Compatibility
- Feature detection for canvas.toBlob()
- Fallback to canvas.toDataURL() if needed
- Handle browser-specific canvas limits

### Quality vs Size Trade-offs
- Default quality: 0.9 (good balance)
- High resolution warning for 4x exports
- Estimated file size preview

## Testing Strategy

### Unit Tests
- Export option validation
- Color conversion utilities
- Canvas rendering components

### Integration Tests
- End-to-end export workflow
- Cross-browser compatibility
- High-resolution export handling

### Manual Testing
- Various graph sizes and complexities
- Different Obsidian themes
- Performance on large datasets

---
*Agent: Technical Architect*
*Status: Architecture Design Complete*
*Next: Route to SWEBOK Agent for Implementation*