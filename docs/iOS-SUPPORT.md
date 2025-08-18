# iOS Support Documentation for Exocortex Plugin

## Overview
The Exocortex plugin now fully supports iOS devices with optimized performance, touch-friendly interfaces, and native-feeling interactions. This document covers iOS-specific features, limitations, and best practices.

## Key Features

### 1. Multi-Engine Support
The plugin automatically selects the best query engine based on device capabilities:

- **iOS Devices**: NativeQueryEngine → Datacore → Dataview
- **Desktop**: Dataview → Datacore → NativeQueryEngine

### 2. NativeQueryEngine
A lightweight query engine that works without Dataview/Datacore dependencies:
- Direct Obsidian API integration
- Optimized for mobile performance
- Supports table, list, task, and calendar queries
- 5-second query caching for improved responsiveness

### 3. Mobile Performance Optimizer
Intelligent performance management for iOS devices:

#### Adaptive Thresholds
- **Batch Processing**: 10 items (mobile) vs 50 items (desktop)
- **Cache Size**: 50 entries (mobile) vs 200 entries (desktop)
- **Debounce Timing**: 500ms (mobile) vs 200ms (desktop)

#### Memory Management
- Automatic memory pressure detection
- Callback system for memory-critical operations
- LRU cache with platform-aware limits
- Lazy loading with priority queues

#### Device Detection
```typescript
const optimizer = MobilePerformanceOptimizer.getInstance();
if (optimizer.isIOS()) {
    // iOS-specific optimizations
    const batchSize = optimizer.getBatchSize(); // Returns 10
    const cache = optimizer.createCache({ maxSize: 50 });
}
```

### 4. Touch-Optimized UI Components

#### TouchButtonRenderer
- 44x44pt minimum touch targets (iOS standard)
- Haptic feedback support
- Visual feedback with ripple effects
- Collapsible button groups for small screens

#### MobileModalAdapter
- iOS-style bottom sheet presentation
- Pull-to-dismiss gesture
- Keyboard-aware positioning
- Safe area handling for notches

#### TouchGraphController
- Pinch-to-zoom with momentum
- Pan gestures with bounce-back
- Double-tap to focus
- Long press for context menus

## iOS-Specific Optimizations

### 1. Safe Area Handling
```css
.mobile-modal {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
}
```

### 2. Touch Target Sizing
All interactive elements meet Apple's 44x44pt minimum:
```typescript
const TOUCH_TARGET_SIZE = 44; // Points
const actualSize = TOUCH_TARGET_SIZE * window.devicePixelRatio;
```

### 3. Gesture Recognition
Native iOS gestures are supported:
- Swipe to dismiss
- Pinch to zoom
- Pull to refresh
- Long press for options

### 4. Haptic Feedback
Contextual vibrations for user actions:
```typescript
navigator.vibrate([10]); // Light feedback
navigator.vibrate([20]); // Medium feedback
navigator.vibrate([30]); // Heavy feedback
```

## Performance Considerations

### 1. Virtual Scrolling
Large lists use virtual scrolling to maintain 60fps:
```typescript
const visibleItems = Math.ceil(viewport.height / itemHeight) + 2;
const startIndex = Math.floor(scrollTop / itemHeight);
const endIndex = startIndex + visibleItems;
```

### 2. Batch Processing
Operations are batched for optimal performance:
```typescript
await optimizer.processBatch(items, processor, {
    onProgress: (processed, total) => {
        updateProgressBar(processed / total);
    }
});
```

### 3. Memory Optimization
Features automatically disable under memory pressure:
- Animations turn off
- Shadows are removed
- Transitions are simplified
- Cache sizes reduce

## Configuration

### Enable/Disable Mobile Optimizations
```yaml
# In your vault's .obsidian/plugins/exocortex/data.json
{
  "mobileOptimizations": true,
  "preferredEngine": "native", // or "dataview", "datacore"
  "touchTargetSize": 44,
  "enableHapticFeedback": true
}
```

### Query Engine Selection
```yaml
blocks:
  - type: custom
    queryEngineQuery:
      query: 'table file.name from ""'
      engineType: auto  # Options: auto, native, dataview, datacore
```

## Limitations on iOS

### 1. Dataview Availability
- Dataview may not be available on all iOS installations
- NativeQueryEngine provides fallback functionality
- Some advanced Dataview features may be limited

### 2. Memory Constraints
- Large vaults (>10,000 notes) may experience slower performance
- Graph visualizations limited to 100 nodes on older devices
- Complex SPARQL queries may timeout

### 3. File System Access
- Some file operations are restricted by iOS sandboxing
- External file links may not work
- Plugin data stored in app-specific directories

## Migration Guide

### For Existing Users
1. Update to the latest plugin version
2. No configuration changes required - auto-detection handles everything
3. Optional: Customize mobile settings in plugin preferences

### For Developers
1. Use `MobilePerformanceOptimizer.getInstance()` for platform detection
2. Implement touch-friendly UI with provided components
3. Test on actual iOS devices when possible

## Troubleshooting

### Common Issues

#### Plugin Not Loading on iOS
1. Ensure Obsidian mobile app is updated
2. Check plugin compatibility in Community Plugins
3. Restart Obsidian app

#### Poor Performance
1. Reduce batch sizes in settings
2. Clear query cache regularly
3. Disable animations in accessibility settings

#### Touch Targets Too Small
1. Enable "Larger Touch Targets" in plugin settings
2. Use tablet mode on iPads
3. Zoom in using pinch gesture

### Debug Mode
Enable debug logging for iOS-specific issues:
```javascript
window.ExocortexDebug = {
    logPlatform: true,
    logPerformance: true,
    logGestures: true
};
```

## Best Practices

### 1. Design Considerations
- Always test on actual iOS devices
- Provide visual feedback for all interactions
- Use native iOS UI patterns when possible
- Respect user's accessibility settings

### 2. Performance Tips
- Lazy load heavy components
- Use virtual scrolling for long lists
- Batch operations when possible
- Cache frequently accessed data

### 3. Accessibility
- Ensure all controls are keyboard accessible
- Provide proper ARIA labels
- Support VoiceOver screen reader
- Respect reduced motion preferences

## API Reference

### MobilePerformanceOptimizer
```typescript
interface MobilePerformanceOptimizer {
    isIOS(): boolean;
    isAndroid(): boolean;
    isTablet(): boolean;
    getBatchSize(): number;
    getCacheSize(): number;
    getDebounceMs(): number;
    onMemoryPressure(callback: () => void): () => void;
    processBatch<T, R>(items: T[], processor: (item: T) => Promise<R>): Promise<R[]>;
    lazyLoad<T>(key: string, loader: () => Promise<T>): Promise<T>;
    debounce<T>(func: T, wait?: number): T;
    throttle<T>(func: T, wait?: number): T;
    createCache<K, V>(options?: CacheOptions): Map<K, V>;
}
```

### NativeQueryEngine
```typescript
interface NativeQueryEngine extends IQueryEngine {
    executeQuery(query: string, context?: any): Result<QueryResult>;
    clearCache(): void;
}
```

### Touch Component Props
```typescript
interface TouchComponentProps {
    enableHaptic?: boolean;
    touchTargetSize?: number;
    gestureConfig?: GestureConfig;
    onTouch?: (event: TouchEvent) => void;
}
```

## Support

For iOS-specific issues:
1. Check this documentation first
2. Search existing issues on GitHub
3. Create a new issue with iOS label
4. Include device model and iOS version

## Future Enhancements

Planned iOS improvements:
- Widget support for iOS 14+
- Shortcuts app integration
- iCloud sync optimization
- ShareSheet extension
- Siri shortcuts
- Apple Pencil support for iPad

## Version History

- v3.0.0 - Initial iOS support with NativeQueryEngine
- v3.0.1 - Added haptic feedback and gesture improvements
- v3.0.2 - Performance optimizations for older devices
- v3.0.3 - Safe area handling for newer iPhones

## License

Same as main Exocortex plugin - MIT License