import { PlatformDetector } from '../../infrastructure/utils/PlatformDetector';
import { VisualQueryCanvas } from '../components/VisualQueryCanvas';

/**
 * Touch gesture configuration
 */
export interface TouchGestureConfig {
    enablePinchZoom?: boolean;
    enablePanGesture?: boolean;
    enableTapGestures?: boolean;
    enableLongPress?: boolean;
    zoomSensitivity?: number;
    panSensitivity?: number;
    minZoom?: number;
    maxZoom?: number;
    doubleTapZoomFactor?: number;
    longPressDuration?: number;
    momentumDecay?: number;
    bounceBack?: boolean;
}

/**
 * Touch gesture callbacks
 */
export interface TouchGestureCallbacks {
    onTap?: (x: number, y: number) => void;
    onDoubleTap?: (x: number, y: number) => void;
    onLongPress?: (x: number, y: number) => void;
    onPinchStart?: (scale: number) => void;
    onPinchMove?: (scale: number, centerX: number, centerY: number) => void;
    onPinchEnd?: (scale: number) => void;
    onPanStart?: (x: number, y: number) => void;
    onPanMove?: (deltaX: number, deltaY: number) => void;
    onPanEnd?: (velocityX: number, velocityY: number) => void;
    onZoomChange?: (zoom: number) => void;
}

/**
 * Touch point data
 */
interface TouchPoint {
    id: number;
    x: number;
    y: number;
    timestamp: number;
}

/**
 * Gesture state
 */
interface GestureState {
    isActive: boolean;
    type: 'none' | 'pan' | 'pinch' | 'tap' | 'longpress';
    startTime: number;
    touches: Map<number, TouchPoint>;
    initialDistance?: number;
    initialCenter?: { x: number; y: number };
    initialZoom?: number;
    lastPanPosition?: { x: number; y: number };
    panVelocity?: { x: number; y: number };
    tapCount: number;
    lastTapTime: number;
    longPressTimer?: number;
}

/**
 * Touch controller for graph visualizations with iOS-optimized gestures
 * Implements pinch-to-zoom, pan, tap, and long-press interactions
 */
export class TouchGraphController {
    private element: HTMLElement;
    private config: Required<TouchGestureConfig>;
    private callbacks: TouchGestureCallbacks;
    private gestureState: GestureState;
    private momentumAnimation?: number;
    private hapticFeedback?: any;

    private readonly defaultConfig: Required<TouchGestureConfig> = {
        enablePinchZoom: true,
        enablePanGesture: true,
        enableTapGestures: true,
        enableLongPress: true,
        zoomSensitivity: 1.0,
        panSensitivity: 1.0,
        minZoom: 0.1,
        maxZoom: 5.0,
        doubleTapZoomFactor: 2.0,
        longPressDuration: 500,
        momentumDecay: 0.95,
        bounceBack: true
    };

    constructor(
        element: HTMLElement,
        config: TouchGestureConfig = {},
        callbacks: TouchGestureCallbacks = {}
    ) {
        this.element = element;
        this.config = { ...this.defaultConfig, ...config };
        this.callbacks = callbacks;
        
        this.gestureState = this.createInitialGestureState();
        
        this.initializeHapticFeedback();
        this.attachEventListeners();
        this.setupElementStyles();
    }

    /**
     * Create initial gesture state
     */
    private createInitialGestureState(): GestureState {
        return {
            isActive: false,
            type: 'none',
            startTime: 0,
            touches: new Map(),
            tapCount: 0,
            lastTapTime: 0
        };
    }

    /**
     * Initialize haptic feedback for iOS
     */
    private initializeHapticFeedback(): void {
        if (PlatformDetector.isIOS() && 'vibrate' in navigator) {
            this.hapticFeedback = {
                light: () => navigator.vibrate?.(10),
                medium: () => navigator.vibrate?.(20),
                heavy: () => navigator.vibrate?.(30),
                selection: () => navigator.vibrate?.(5)
            };
        }
    }

    /**
     * Setup element styles for touch interaction
     */
    private setupElementStyles(): void {
        this.element.style.touchAction = 'none';
        this.element.style.userSelect = 'none';
        this.element.style.webkitUserSelect = 'none';
        this.element.style.cursor = 'grab';
    }

    /**
     * Attach touch and pointer event listeners
     */
    private attachEventListeners(): void {
        // Touch events (primary for mobile)
        this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });

        // Pointer events (for hybrid devices)
        if ('PointerEvent' in window) {
            this.element.addEventListener('pointerdown', this.handlePointerDown.bind(this));
            this.element.addEventListener('pointermove', this.handlePointerMove.bind(this));
            this.element.addEventListener('pointerup', this.handlePointerUp.bind(this));
            this.element.addEventListener('pointercancel', this.handlePointerCancel.bind(this));
        }

        // Mouse events (fallback for desktop)
        if (!PlatformDetector.hasTouch()) {
            this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
            this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
            this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
            this.element.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        }

        // Prevent context menu on long press
        this.element.addEventListener('contextmenu', (e) => {
            if (PlatformDetector.hasTouch()) {
                e.preventDefault();
            }
        });
    }

    /**
     * Handle touch start event
     */
    private handleTouchStart(event: TouchEvent): void {
        event.preventDefault();
        
        const touches = Array.from(event.touches);
        const currentTime = Date.now();

        // Update touch tracking
        touches.forEach(touch => {
            this.gestureState.touches.set(touch.identifier, {
                id: touch.identifier,
                x: touch.clientX,
                y: touch.clientY,
                timestamp: currentTime
            });
        });

        if (touches.length === 1) {
            this.handleSingleTouchStart(touches[0], currentTime);
        } else if (touches.length === 2) {
            this.handlePinchStart(touches, currentTime);
        }
    }

    /**
     * Handle single touch start (tap, pan, long press)
     */
    private handleSingleTouchStart(touch: Touch, timestamp: number): void {
        const rect = this.element.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        // Check for double tap
        if (this.config.enableTapGestures) {
            const timeSinceLastTap = timestamp - this.gestureState.lastTapTime;
            if (timeSinceLastTap < 300) {
                this.gestureState.tapCount++;
                if (this.gestureState.tapCount === 2) {
                    this.handleDoubleTap(x, y);
                    this.resetTapState();
                    return;
                }
            } else {
                this.gestureState.tapCount = 1;
            }
            this.gestureState.lastTapTime = timestamp;
        }

        // Setup for potential pan gesture
        if (this.config.enablePanGesture) {
            this.gestureState.lastPanPosition = { x, y };
            this.gestureState.panVelocity = { x: 0, y: 0 };
        }

        // Setup long press timer
        if (this.config.enableLongPress) {
            this.gestureState.longPressTimer = window.setTimeout(() => {
                if (this.gestureState.touches.size === 1 && !this.gestureState.isActive) {
                    this.handleLongPress(x, y);
                }
            }, this.config.longPressDuration);
        }

        this.gestureState.startTime = timestamp;
    }

    /**
     * Handle pinch gesture start
     */
    private handlePinchStart(touches: Touch[], timestamp: number): void {
        if (!this.config.enablePinchZoom) return;

        this.clearLongPressTimer();
        this.resetTapState();

        const distance = this.calculateDistance(touches[0], touches[1]);
        const center = this.calculateCenter(touches[0], touches[1]);

        this.gestureState.isActive = true;
        this.gestureState.type = 'pinch';
        this.gestureState.initialDistance = distance;
        this.gestureState.initialCenter = center;
        this.gestureState.startTime = timestamp;

        this.triggerHaptic('light');
        this.callbacks.onPinchStart?.(1.0);
    }

    /**
     * Handle touch move event
     */
    private handleTouchMove(event: TouchEvent): void {
        event.preventDefault();

        const touches = Array.from(event.touches);
        const currentTime = Date.now();

        // Update touch positions
        touches.forEach(touch => {
            const existing = this.gestureState.touches.get(touch.identifier);
            if (existing) {
                existing.x = touch.clientX;
                existing.y = touch.clientY;
                existing.timestamp = currentTime;
            }
        });

        if (touches.length === 1) {
            this.handleSingleTouchMove(touches[0], currentTime);
        } else if (touches.length === 2 && this.gestureState.type === 'pinch') {
            this.handlePinchMove(touches, currentTime);
        }
    }

    /**
     * Handle single touch move (pan gesture)
     */
    private handleSingleTouchMove(touch: Touch, timestamp: number): void {
        if (!this.config.enablePanGesture || !this.gestureState.lastPanPosition) return;

        const rect = this.element.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        const deltaX = (x - this.gestureState.lastPanPosition.x) * this.config.panSensitivity;
        const deltaY = (y - this.gestureState.lastPanPosition.y) * this.config.panSensitivity;

        // Start pan gesture if moved enough
        if (!this.gestureState.isActive && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
            this.gestureState.isActive = true;
            this.gestureState.type = 'pan';
            this.clearLongPressTimer();
            this.resetTapState();
            this.element.style.cursor = 'grabbing';
            this.callbacks.onPanStart?.(x, y);
        }

        if (this.gestureState.type === 'pan') {
            // Update velocity for momentum
            const timeDelta = timestamp - this.gestureState.startTime;
            if (timeDelta > 0) {
                this.gestureState.panVelocity = {
                    x: deltaX / timeDelta * 1000, // pixels per second
                    y: deltaY / timeDelta * 1000
                };
            }

            this.callbacks.onPanMove?.(deltaX, deltaY);
        }

        this.gestureState.lastPanPosition = { x, y };
    }

    /**
     * Handle pinch gesture move
     */
    private handlePinchMove(touches: Touch[], timestamp: number): void {
        if (!this.config.enablePinchZoom || !this.gestureState.initialDistance || !this.gestureState.initialCenter) {
            return;
        }

        const distance = this.calculateDistance(touches[0], touches[1]);
        const center = this.calculateCenter(touches[0], touches[1]);
        
        let scale = distance / this.gestureState.initialDistance;
        scale *= this.config.zoomSensitivity;

        // Apply zoom constraints
        scale = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, scale));

        const rect = this.element.getBoundingClientRect();
        const centerX = center.x - rect.left;
        const centerY = center.y - rect.top;

        this.callbacks.onPinchMove?.(scale, centerX, centerY);
    }

    /**
     * Handle touch end event
     */
    private handleTouchEnd(event: TouchEvent): void {
        event.preventDefault();

        const currentTime = Date.now();
        const remainingTouches = Array.from(event.touches);

        // Remove ended touches
        Array.from(event.changedTouches).forEach(touch => {
            this.gestureState.touches.delete(touch.identifier);
        });

        if (remainingTouches.length === 0) {
            this.handleAllTouchesEnd(currentTime);
        } else if (remainingTouches.length === 1 && this.gestureState.type === 'pinch') {
            // Transition from pinch to pan
            this.handlePinchToPanTransition(remainingTouches[0], currentTime);
        }
    }

    /**
     * Handle all touches ending
     */
    private handleAllTouchesEnd(timestamp: number): void {
        this.clearLongPressTimer();
        this.element.style.cursor = 'grab';

        if (this.gestureState.type === 'pan') {
            const velocity = this.gestureState.panVelocity;
            this.callbacks.onPanEnd?.(velocity?.x || 0, velocity?.y || 0);

            // Apply momentum scrolling
            if (velocity && (Math.abs(velocity.x) > 100 || Math.abs(velocity.y) > 100)) {
                this.startMomentumAnimation(velocity);
            }
        } else if (this.gestureState.type === 'pinch') {
            this.callbacks.onPinchEnd?.(1.0);
        } else if (this.gestureState.tapCount === 1 && !this.gestureState.isActive) {
            // Single tap
            setTimeout(() => {
                if (this.gestureState.tapCount === 1) {
                    const touch = this.gestureState.touches.values().next().value;
                    if (touch) {
                        const rect = this.element.getBoundingClientRect();
                        this.callbacks.onTap?.(touch.x - rect.left, touch.y - rect.top);
                    }
                    this.resetTapState();
                }
            }, 300);
        }

        this.resetGestureState();
    }

    /**
     * Handle transition from pinch to pan
     */
    private handlePinchToPanTransition(touch: Touch, timestamp: number): void {
        this.callbacks.onPinchEnd?.(1.0);
        
        // Reset for pan gesture
        const rect = this.element.getBoundingClientRect();
        this.gestureState.type = 'pan';
        this.gestureState.lastPanPosition = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
        this.gestureState.panVelocity = { x: 0, y: 0 };
        
        this.callbacks.onPanStart?.(this.gestureState.lastPanPosition.x, this.gestureState.lastPanPosition.y);
    }

    /**
     * Handle touch cancel event
     */
    private handleTouchCancel(event: TouchEvent): void {
        this.handleTouchEnd(event);
    }

    /**
     * Handle double tap gesture
     */
    private handleDoubleTap(x: number, y: number): void {
        this.triggerHaptic('medium');
        this.callbacks.onDoubleTap?.(x, y);
    }

    /**
     * Handle long press gesture
     */
    private handleLongPress(x: number, y: number): void {
        this.triggerHaptic('heavy');
        this.callbacks.onLongPress?.(x, y);
    }

    /**
     * Start momentum animation for smooth scrolling
     */
    private startMomentumAnimation(velocity: { x: number; y: number }): void {
        this.cancelMomentumAnimation();

        let currentVelocity = { ...velocity };
        
        const animate = () => {
            // Apply momentum step
            this.callbacks.onPanMove?.(
                currentVelocity.x / 60, // 60fps
                currentVelocity.y / 60
            );

            // Decay velocity
            currentVelocity.x *= this.config.momentumDecay;
            currentVelocity.y *= this.config.momentumDecay;

            // Continue if velocity is significant
            if (Math.abs(currentVelocity.x) > 1 || Math.abs(currentVelocity.y) > 1) {
                this.momentumAnimation = requestAnimationFrame(animate);
            }
        };

        this.momentumAnimation = requestAnimationFrame(animate);
    }

    /**
     * Cancel momentum animation
     */
    private cancelMomentumAnimation(): void {
        if (this.momentumAnimation) {
            cancelAnimationFrame(this.momentumAnimation);
            this.momentumAnimation = undefined;
        }
    }

    /**
     * Calculate distance between two touches
     */
    private calculateDistance(touch1: Touch, touch2: Touch): number {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Calculate center point between two touches
     */
    private calculateCenter(touch1: Touch, touch2: Touch): { x: number; y: number } {
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
        };
    }

    /**
     * Clear long press timer
     */
    private clearLongPressTimer(): void {
        if (this.gestureState.longPressTimer) {
            clearTimeout(this.gestureState.longPressTimer);
            this.gestureState.longPressTimer = undefined;
        }
    }

    /**
     * Reset tap state
     */
    private resetTapState(): void {
        this.gestureState.tapCount = 0;
        this.gestureState.lastTapTime = 0;
    }

    /**
     * Reset gesture state
     */
    private resetGestureState(): void {
        this.gestureState.isActive = false;
        this.gestureState.type = 'none';
        this.gestureState.touches.clear();
        this.gestureState.initialDistance = undefined;
        this.gestureState.initialCenter = undefined;
        this.gestureState.lastPanPosition = undefined;
        this.gestureState.panVelocity = undefined;
    }

    /**
     * Trigger haptic feedback
     */
    private triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'selection'): void {
        if (this.hapticFeedback && this.hapticFeedback[type]) {
            this.hapticFeedback[type]();
        }
    }

    /**
     * Pointer event handlers (for hybrid devices)
     */
    private handlePointerDown(event: PointerEvent): void {
        if (event.pointerType === 'touch') {
            // Convert to touch-like handling
            const fakeTouch = this.createFakeTouchEvent('touchstart', [event]);
            this.handleTouchStart(fakeTouch);
        }
    }

    private handlePointerMove(event: PointerEvent): void {
        if (event.pointerType === 'touch') {
            const fakeTouch = this.createFakeTouchEvent('touchmove', [event]);
            this.handleTouchMove(fakeTouch);
        }
    }

    private handlePointerUp(event: PointerEvent): void {
        if (event.pointerType === 'touch') {
            const fakeTouch = this.createFakeTouchEvent('touchend', [event]);
            this.handleTouchEnd(fakeTouch);
        }
    }

    private handlePointerCancel(event: PointerEvent): void {
        if (event.pointerType === 'touch') {
            const fakeTouch = this.createFakeTouchEvent('touchcancel', [event]);
            this.handleTouchCancel(fakeTouch);
        }
    }

    /**
     * Mouse event handlers (fallback for desktop)
     */
    private handleMouseDown(event: MouseEvent): void {
        if (event.button === 0) { // Left mouse button
            const fakeTouch = this.createFakeTouchEvent('touchstart', [event]);
            this.handleTouchStart(fakeTouch);
        }
    }

    private handleMouseMove(event: MouseEvent): void {
        if (this.gestureState.isActive) {
            const fakeTouch = this.createFakeTouchEvent('touchmove', [event]);
            this.handleTouchMove(fakeTouch);
        }
    }

    private handleMouseUp(event: MouseEvent): void {
        if (this.gestureState.isActive) {
            const fakeTouch = this.createFakeTouchEvent('touchend', [event]);
            this.handleTouchEnd(fakeTouch);
        }
    }

    private handleWheel(event: WheelEvent): void {
        if (!this.config.enablePinchZoom) return;

        event.preventDefault();
        
        const rect = this.element.getBoundingClientRect();
        const centerX = event.clientX - rect.left;
        const centerY = event.clientY - rect.top;
        
        const scale = event.deltaY > 0 ? 0.9 : 1.1;
        
        this.callbacks.onPinchStart?.(1.0);
        this.callbacks.onPinchMove?.(scale, centerX, centerY);
        this.callbacks.onPinchEnd?.(scale);
    }

    /**
     * Create fake touch event from mouse/pointer event
     */
    private createFakeTouchEvent(type: string, events: (MouseEvent | PointerEvent)[]): TouchEvent {
        const touches = events.map((event, index) => ({
            identifier: (event as PointerEvent).pointerId || 0,
            clientX: event.clientX,
            clientY: event.clientY,
            pageX: event.pageX,
            pageY: event.pageY,
            screenX: event.screenX,
            screenY: event.screenY,
            target: event.target
        })) as any;

        return {
            type,
            touches,
            changedTouches: touches,
            targetTouches: touches,
            preventDefault: () => {},
            stopPropagation: () => {}
        } as TouchEvent;
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<TouchGestureConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Update callbacks
     */
    updateCallbacks(newCallbacks: Partial<TouchGestureCallbacks>): void {
        this.callbacks = { ...this.callbacks, ...newCallbacks };
    }

    /**
     * Enable/disable gestures
     */
    setEnabled(enabled: boolean): void {
        if (enabled) {
            this.element.style.pointerEvents = '';
            this.element.style.touchAction = 'none';
        } else {
            this.element.style.pointerEvents = 'none';
            this.element.style.touchAction = 'auto';
            this.resetGestureState();
            this.cancelMomentumAnimation();
        }
    }

    /**
     * Get current gesture state
     */
    getGestureState(): Readonly<GestureState> {
        return this.gestureState;
    }

    /**
     * Destroy controller and cleanup
     */
    destroy(): void {
        this.cancelMomentumAnimation();
        this.clearLongPressTimer();
        this.resetGestureState();

        // Remove all event listeners
        this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
        this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
        this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
        this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));

        if ('PointerEvent' in window) {
            this.element.removeEventListener('pointerdown', this.handlePointerDown.bind(this));
            this.element.removeEventListener('pointermove', this.handlePointerMove.bind(this));
            this.element.removeEventListener('pointerup', this.handlePointerUp.bind(this));
            this.element.removeEventListener('pointercancel', this.handlePointerCancel.bind(this));
        }

        this.element.removeEventListener('mousedown', this.handleMouseDown.bind(this));
        this.element.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        this.element.removeEventListener('mouseup', this.handleMouseUp.bind(this));
        this.element.removeEventListener('wheel', this.handleWheel.bind(this));

        // Restore element styles
        this.element.style.touchAction = '';
        this.element.style.userSelect = '';
        this.element.style.webkitUserSelect = '';
        this.element.style.cursor = '';
    }
}

/**
 * Factory function to create touch controller for VisualQueryCanvas
 */
export function createTouchGraphController(
    canvas: VisualQueryCanvas,
    element: HTMLElement,
    config: TouchGestureConfig = {}
): TouchGraphController {
    const callbacks: TouchGestureCallbacks = {
        onTap: (x, y) => {
            // Handle node selection on tap
            console.log('Graph tap at:', x, y);
        },
        
        onDoubleTap: (x, y) => {
            // Zoom to fit or zoom to point
            if (canvas.zoomToFit) {
                canvas.zoomToFit();
            }
        },
        
        onLongPress: (x, y) => {
            // Show context menu or node creation
            console.log('Graph long press at:', x, y);
        },
        
        onPinchMove: (scale, centerX, centerY) => {
            // Apply zoom with scale and center
            const currentState = (canvas as any).getCurrentCanvasState?.();
            if (currentState) {
                const newZoom = Math.max(0.1, Math.min(5.0, currentState.viewport.zoom * scale));
                // Apply zoom transformation
                console.log('Applying zoom:', newZoom, 'at center:', centerX, centerY);
            }
        },
        
        onPanMove: (deltaX, deltaY) => {
            // Apply pan transformation
            const currentState = (canvas as any).getCurrentCanvasState?.();
            if (currentState) {
                // Update viewport position
                console.log('Applying pan:', deltaX, deltaY);
            }
        }
    };

    return new TouchGraphController(element, config, callbacks);
}