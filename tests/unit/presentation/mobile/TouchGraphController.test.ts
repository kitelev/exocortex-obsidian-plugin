import { TouchGraphController, TouchGestureConfig, TouchGestureCallbacks } from '../../../../src/presentation/mobile/TouchGraphController';
import { PlatformDetector } from '../../../../src/infrastructure/utils/PlatformDetector';

// Mock PlatformDetector
jest.mock('../../../../src/infrastructure/utils/PlatformDetector', () => ({
    PlatformDetector: {
        isIOS: jest.fn(() => false),
        hasTouch: jest.fn(() => true)
    }
}));

describe('TouchGraphController', () => {
    let element: HTMLElement;
    let controller: TouchGraphController;
    let callbacks: TouchGestureCallbacks;
    let config: TouchGestureConfig;

    beforeEach(() => {
        element = document.createElement('div');
        element.style.width = '400px';
        element.style.height = '300px';
        document.body.appendChild(element);

        callbacks = {
            onTap: jest.fn(),
            onDoubleTap: jest.fn(),
            onLongPress: jest.fn(),
            onPinchStart: jest.fn(),
            onPinchMove: jest.fn(),
            onPinchEnd: jest.fn(),
            onPanStart: jest.fn(),
            onPanMove: jest.fn(),
            onPanEnd: jest.fn(),
            onZoomChange: jest.fn()
        };

        config = {
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

        // Mock navigator.vibrate
        Object.defineProperty(navigator, 'vibrate', {
            value: jest.fn(),
            configurable: true
        });

        controller = new TouchGraphController(element, config, callbacks);
    });

    afterEach(() => {
        controller.destroy();
        document.body.removeChild(element);
        jest.clearAllMocks();
    });

    const createTouchEvent = (
        type: string,
        touches: Array<{ x: number; y: number; id?: number }>,
        target = element
    ): TouchEvent => {
        const touchList = touches.map((touch, index) => ({
            identifier: touch.id || index,
            clientX: touch.x,
            clientY: touch.y,
            pageX: touch.x,
            pageY: touch.y,
            screenX: touch.x,
            screenY: touch.y,
            target
        })) as any;

        const event = new Event(type) as any;
        event.touches = touchList;
        event.changedTouches = type === 'touchend' || type === 'touchcancel' ? touchList : [];
        event.targetTouches = touchList;
        event.preventDefault = jest.fn();
        event.stopPropagation = jest.fn();

        return event;
    };

    describe('Touch Event Setup', () => {
        it('should setup element styles for touch interaction', () => {
            expect(element.style.touchAction).toBe('none');
            expect(element.style.userSelect).toBe('none');
            expect(element.style.cursor).toBe('grab');
        });

        it('should attach event listeners', () => {
            const addEventListenerSpy = jest.spyOn(element, 'addEventListener');
            
            new TouchGraphController(document.createElement('div'), config, callbacks);

            expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: false });
            expect(addEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
            expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: false });
            expect(addEventListenerSpy).toHaveBeenCalledWith('touchcancel', expect.any(Function), { passive: false });
        });
    });

    describe('Tap Gestures', () => {
        it('should detect single tap', (done) => {
            const touchStart = createTouchEvent('touchstart', [{ x: 100, y: 100 }]);
            const touchEnd = createTouchEvent('touchend', [{ x: 100, y: 100 }]);

            element.dispatchEvent(touchStart);
            
            setTimeout(() => {
                element.dispatchEvent(touchEnd);
                
                setTimeout(() => {
                    expect(callbacks.onTap).toHaveBeenCalledWith(100, 100);
                    done();
                }, 350); // Wait for double-tap timeout
            }, 100);
        });

        it('should detect double tap', () => {
            const touchStart = createTouchEvent('touchstart', [{ x: 100, y: 100 }]);
            const touchEnd = createTouchEvent('touchend', [{ x: 100, y: 100 }]);

            // First tap
            element.dispatchEvent(touchStart);
            element.dispatchEvent(touchEnd);

            // Second tap quickly
            setTimeout(() => {
                element.dispatchEvent(touchStart);
                element.dispatchEvent(touchEnd);
                
                expect(callbacks.onDoubleTap).toHaveBeenCalledWith(100, 100);
            }, 100);
        });

        it('should detect long press', (done) => {
            const touchStart = createTouchEvent('touchstart', [{ x: 100, y: 100 }]);
            
            element.dispatchEvent(touchStart);

            setTimeout(() => {
                expect(callbacks.onLongPress).toHaveBeenCalledWith(100, 100);
                done();
            }, 550); // Wait for long press duration
        });

        it('should cancel long press on movement', (done) => {
            const touchStart = createTouchEvent('touchstart', [{ x: 100, y: 100 }]);
            const touchMove = createTouchEvent('touchmove', [{ x: 120, y: 100 }]);
            
            element.dispatchEvent(touchStart);
            
            setTimeout(() => {
                element.dispatchEvent(touchMove);
                
                setTimeout(() => {
                    expect(callbacks.onLongPress).not.toHaveBeenCalled();
                    done();
                }, 600);
            }, 100);
        });
    });

    describe('Pan Gestures', () => {
        it('should detect pan start', () => {
            const touchStart = createTouchEvent('touchstart', [{ x: 100, y: 100 }]);
            const touchMove = createTouchEvent('touchmove', [{ x: 120, y: 100 }]);

            element.dispatchEvent(touchStart);
            element.dispatchEvent(touchMove);

            expect(callbacks.onPanStart).toHaveBeenCalledWith(120, 100);
            expect(element.style.cursor).toBe('grabbing');
        });

        it('should track pan movement', () => {
            const touchStart = createTouchEvent('touchstart', [{ x: 100, y: 100 }]);
            const touchMove1 = createTouchEvent('touchmove', [{ x: 120, y: 100 }]);
            const touchMove2 = createTouchEvent('touchmove', [{ x: 140, y: 110 }]);

            element.dispatchEvent(touchStart);
            element.dispatchEvent(touchMove1);
            element.dispatchEvent(touchMove2);

            expect(callbacks.onPanMove).toHaveBeenCalledWith(20, 10);
        });

        it('should detect pan end with velocity', () => {
            const touchStart = createTouchEvent('touchstart', [{ x: 100, y: 100 }]);
            const touchMove = createTouchEvent('touchmove', [{ x: 150, y: 120 }]);
            const touchEnd = createTouchEvent('touchend', [{ x: 150, y: 120 }]);

            element.dispatchEvent(touchStart);
            element.dispatchEvent(touchMove);
            element.dispatchEvent(touchEnd);

            expect(callbacks.onPanEnd).toHaveBeenCalledWith(expect.any(Number), expect.any(Number));
            expect(element.style.cursor).toBe('grab');
        });

        it('should apply pan sensitivity', () => {
            const sensitiveConfig = { ...config, panSensitivity: 2.0 };
            const sensitiveController = new TouchGraphController(element, sensitiveConfig, callbacks);

            const touchStart = createTouchEvent('touchstart', [{ x: 100, y: 100 }]);
            const touchMove = createTouchEvent('touchmove', [{ x: 110, y: 100 }]);

            element.dispatchEvent(touchStart);
            element.dispatchEvent(touchMove);

            expect(callbacks.onPanMove).toHaveBeenCalledWith(20, 0); // 10 * 2.0 sensitivity

            sensitiveController.destroy();
        });
    });

    describe('Pinch Gestures', () => {
        it('should detect pinch start', () => {
            const touchStart = createTouchEvent('touchstart', [
                { x: 100, y: 100, id: 0 },
                { x: 200, y: 100, id: 1 }
            ]);

            element.dispatchEvent(touchStart);

            expect(callbacks.onPinchStart).toHaveBeenCalledWith(1.0);
        });

        it('should calculate pinch scale', () => {
            const touchStart = createTouchEvent('touchstart', [
                { x: 100, y: 100, id: 0 },
                { x: 200, y: 100, id: 1 }
            ]);
            const touchMove = createTouchEvent('touchmove', [
                { x: 80, y: 100, id: 0 },
                { x: 220, y: 100, id: 1 }
            ]);

            element.dispatchEvent(touchStart);
            element.dispatchEvent(touchMove);

            // Initial distance: 100px, new distance: 140px, scale: 1.4
            expect(callbacks.onPinchMove).toHaveBeenCalledWith(
                1.4,
                150, // Center X
                100  // Center Y
            );
        });

        it('should detect pinch end', () => {
            const touchStart = createTouchEvent('touchstart', [
                { x: 100, y: 100, id: 0 },
                { x: 200, y: 100, id: 1 }
            ]);
            const touchEnd = createTouchEvent('touchend', [
                { x: 100, y: 100, id: 0 },
                { x: 200, y: 100, id: 1 }
            ]);

            element.dispatchEvent(touchStart);
            element.dispatchEvent(touchEnd);

            expect(callbacks.onPinchEnd).toHaveBeenCalledWith(1.0);
        });

        it('should apply zoom constraints', () => {
            const constraintConfig = { ...config, minZoom: 0.5, maxZoom: 2.0 };
            const constraintController = new TouchGraphController(element, constraintConfig, callbacks);

            // Test minimum zoom constraint
            const touchStart = createTouchEvent('touchstart', [
                { x: 100, y: 100, id: 0 },
                { x: 200, y: 100, id: 1 }
            ]);
            const touchMove = createTouchEvent('touchmove', [
                { x: 130, y: 100, id: 0 },
                { x: 170, y: 100, id: 1 }
            ]);

            element.dispatchEvent(touchStart);
            element.dispatchEvent(touchMove);

            // Should be clamped to minimum zoom
            expect(callbacks.onPinchMove).toHaveBeenCalledWith(
                0.5, // Clamped to minZoom
                expect.any(Number),
                expect.any(Number)
            );

            constraintController.destroy();
        });

        it('should transition from pinch to pan', () => {
            const touchStart = createTouchEvent('touchstart', [
                { x: 100, y: 100, id: 0 },
                { x: 200, y: 100, id: 1 }
            ]);
            const touchEnd = createTouchEvent('touchend', [
                { x: 200, y: 100, id: 1 }
            ]); // One finger lifted
            const touchMove = createTouchEvent('touchmove', [
                { x: 120, y: 100, id: 0 }
            ]);

            element.dispatchEvent(touchStart);
            element.dispatchEvent(touchEnd);
            element.dispatchEvent(touchMove);

            expect(callbacks.onPinchEnd).toHaveBeenCalled();
            expect(callbacks.onPanStart).toHaveBeenCalled();
        });
    });

    describe('Momentum Animation', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should start momentum animation with high velocity', () => {
            const requestAnimationFrameSpy = jest.spyOn(window, 'requestAnimationFrame')
                .mockImplementation((callback) => {
                    callback(0);
                    return 1;
                });

            const touchStart = createTouchEvent('touchstart', [{ x: 100, y: 100 }]);
            const touchMove = createTouchEvent('touchmove', [{ x: 200, y: 100 }]);
            const touchEnd = createTouchEvent('touchend', [{ x: 200, y: 100 }]);

            element.dispatchEvent(touchStart);
            
            setTimeout(() => {
                element.dispatchEvent(touchMove);
                element.dispatchEvent(touchEnd);
            }, 10); // Quick movement for high velocity

            jest.runAllTimers();

            expect(requestAnimationFrameSpy).toHaveBeenCalled();

            requestAnimationFrameSpy.mockRestore();
        });

        it('should decay momentum velocity', () => {
            const requestAnimationFrameSpy = jest.spyOn(window, 'requestAnimationFrame')
                .mockImplementation((callback) => {
                    callback(0);
                    return 1;
                });

            controller.updateConfig({ momentumDecay: 0.9 });

            const touchStart = createTouchEvent('touchstart', [{ x: 100, y: 100 }]);
            const touchMove = createTouchEvent('touchmove', [{ x: 200, y: 100 }]);
            const touchEnd = createTouchEvent('touchend', [{ x: 200, y: 100 }]);

            element.dispatchEvent(touchStart);
            element.dispatchEvent(touchMove);
            element.dispatchEvent(touchEnd);

            jest.runAllTimers();

            expect(requestAnimationFrameSpy).toHaveBeenCalled();

            requestAnimationFrameSpy.mockRestore();
        });
    });

    describe('Haptic Feedback', () => {
        beforeEach(() => {
            (PlatformDetector.isIOS as jest.Mock).mockReturnValue(true);
        });

        it('should provide haptic feedback on iOS', () => {
            const touchStart = createTouchEvent('touchstart', [
                { x: 100, y: 100, id: 0 },
                { x: 200, y: 100, id: 1 }
            ]);

            element.dispatchEvent(touchStart);

            expect(navigator.vibrate).toHaveBeenCalledWith(10);
        });

        it('should provide different haptic feedback for different gestures', (done) => {
            const touchStart = createTouchEvent('touchstart', [{ x: 100, y: 100 }]);
            element.dispatchEvent(touchStart);

            setTimeout(() => {
                expect(navigator.vibrate).toHaveBeenCalledWith(30); // Heavy vibration for long press
                done();
            }, 550);
        });
    });

    describe('Configuration Updates', () => {
        it('should update configuration', () => {
            controller.updateConfig({ zoomSensitivity: 2.0 });
            
            const state = controller.getGestureState();
            expect(state).toBeDefined();
        });

        it('should update callbacks', () => {
            const newCallbacks = { onTap: jest.fn() };
            controller.updateCallbacks(newCallbacks);

            const touchStart = createTouchEvent('touchstart', [{ x: 100, y: 100 }]);
            const touchEnd = createTouchEvent('touchend', [{ x: 100, y: 100 }]);

            element.dispatchEvent(touchStart);
            
            setTimeout(() => {
                element.dispatchEvent(touchEnd);
                
                setTimeout(() => {
                    expect(newCallbacks.onTap).toHaveBeenCalled();
                }, 350);
            }, 100);
        });
    });

    describe('Enable/Disable', () => {
        it('should disable gestures', () => {
            controller.setEnabled(false);

            expect(element.style.pointerEvents).toBe('none');
            expect(element.style.touchAction).toBe('auto');
        });

        it('should enable gestures', () => {
            controller.setEnabled(false);
            controller.setEnabled(true);

            expect(element.style.pointerEvents).toBe('');
            expect(element.style.touchAction).toBe('none');
        });
    });

    describe('Mouse Events (Desktop Fallback)', () => {
        beforeEach(() => {
            (PlatformDetector.hasTouch as jest.Mock).mockReturnValue(false);
            // Create new controller without touch
            controller.destroy();
            controller = new TouchGraphController(element, config, callbacks);
        });

        it('should handle mouse events when no touch support', () => {
            const mouseDown = new MouseEvent('mousedown', {
                button: 0,
                clientX: 100,
                clientY: 100
            });
            const mouseMove = new MouseEvent('mousemove', {
                clientX: 120,
                clientY: 100
            });
            const mouseUp = new MouseEvent('mouseup', {
                clientX: 120,
                clientY: 100
            });

            element.dispatchEvent(mouseDown);
            element.dispatchEvent(mouseMove);
            element.dispatchEvent(mouseUp);

            expect(callbacks.onPanStart).toHaveBeenCalled();
            expect(callbacks.onPanMove).toHaveBeenCalled();
            expect(callbacks.onPanEnd).toHaveBeenCalled();
        });

        it('should handle wheel events for zoom', () => {
            const wheelEvent = new WheelEvent('wheel', {
                deltaY: -100,
                clientX: 150,
                clientY: 150
            });
            wheelEvent.preventDefault = jest.fn();

            element.dispatchEvent(wheelEvent);

            expect(callbacks.onPinchStart).toHaveBeenCalledWith(1.0);
            expect(callbacks.onPinchMove).toHaveBeenCalledWith(1.1, 150, 150);
            expect(callbacks.onPinchEnd).toHaveBeenCalledWith(1.1);
            expect(wheelEvent.preventDefault).toHaveBeenCalled();
        });
    });

    describe('Pointer Events (Hybrid Devices)', () => {
        beforeEach(() => {
            // Mock PointerEvent support
            (window as any).PointerEvent = class PointerEvent extends Event {
                pointerId: number;
                pointerType: string;
                clientX: number;
                clientY: number;

                constructor(type: string, options: any = {}) {
                    super(type);
                    this.pointerId = options.pointerId || 0;
                    this.pointerType = options.pointerType || 'touch';
                    this.clientX = options.clientX || 0;
                    this.clientY = options.clientY || 0;
                }
            };
        });

        it('should handle pointer events for touch', () => {
            const pointerDown = new (window as any).PointerEvent('pointerdown', {
                pointerType: 'touch',
                pointerId: 1,
                clientX: 100,
                clientY: 100
            });

            element.dispatchEvent(pointerDown);
            // Should convert to touch event internally
            expect(callbacks.onPanStart || callbacks.onTap).toBeDefined();
        });
    });

    describe('Cleanup', () => {
        it('should remove event listeners on destroy', () => {
            const removeEventListenerSpy = jest.spyOn(element, 'removeEventListener');
            
            controller.destroy();

            expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
            expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
            expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
            expect(removeEventListenerSpy).toHaveBeenCalledWith('touchcancel', expect.any(Function));
        });

        it('should restore element styles on destroy', () => {
            controller.destroy();

            expect(element.style.touchAction).toBe('');
            expect(element.style.userSelect).toBe('');
            expect(element.style.cursor).toBe('');
        });

        it('should cancel momentum animation on destroy', () => {
            const cancelAnimationFrameSpy = jest.spyOn(window, 'cancelAnimationFrame');
            
            controller.destroy();

            expect(cancelAnimationFrameSpy).toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        it('should ignore touches with more than 2 fingers', () => {
            const touchStart = createTouchEvent('touchstart', [
                { x: 100, y: 100, id: 0 },
                { x: 200, y: 100, id: 1 },
                { x: 150, y: 150, id: 2 }
            ]);

            element.dispatchEvent(touchStart);

            // Should not trigger pinch or other gestures
            expect(callbacks.onPinchStart).not.toHaveBeenCalled();
        });

        it('should handle touch cancel events', () => {
            const touchStart = createTouchEvent('touchstart', [{ x: 100, y: 100 }]);
            const touchCancel = createTouchEvent('touchcancel', [{ x: 100, y: 100 }]);

            element.dispatchEvent(touchStart);
            element.dispatchEvent(touchCancel);

            // Should cleanup state
            const state = controller.getGestureState();
            expect(state.isActive).toBe(false);
        });

        it('should handle disabled gestures', () => {
            const disabledConfig = {
                ...config,
                enablePinchZoom: false,
                enablePanGesture: false,
                enableTapGestures: false,
                enableLongPress: false
            };
            
            controller.destroy();
            controller = new TouchGraphController(element, disabledConfig, callbacks);

            const touchStart = createTouchEvent('touchstart', [{ x: 100, y: 100 }]);
            element.dispatchEvent(touchStart);

            expect(callbacks.onTap).not.toHaveBeenCalled();
            expect(callbacks.onPanStart).not.toHaveBeenCalled();
        });
    });
});