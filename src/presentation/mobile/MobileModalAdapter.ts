import { App, Modal, Setting, TextComponent, DropdownComponent, ToggleComponent, TextAreaComponent, ButtonComponent, Notice } from 'obsidian';
import { PlatformDetector } from '../../infrastructure/utils/PlatformDetector';

/**
 * Interface for modal content configuration
 */
export interface MobileModalConfig {
    title: string;
    subtitle?: string;
    content?: HTMLElement | string;
    showCloseButton?: boolean;
    allowDismiss?: boolean;
    fullscreen?: boolean;
    keyboardHandling?: 'auto' | 'manual' | 'none';
    maxHeight?: string;
    className?: string;
}

/**
 * Interface for keyboard event handling
 */
export interface KeyboardHandler {
    onShow?: () => void;
    onHide?: () => void;
    onHeightChange?: (height: number) => void;
}

/**
 * Mobile-optimized modal adapter for iOS and touch devices
 * Handles keyboard appearance, safe areas, and touch interactions
 */
export class MobileModalAdapter extends Modal {
    private config: Required<MobileModalConfig>;
    private keyboardHandler?: KeyboardHandler;
    private originalViewportHeight: number;
    private isKeyboardVisible = false;
    private keyboardHeight = 0;
    private resizeObserver?: ResizeObserver;
    private touchStartY = 0;
    private isDragging = false;
    private dragThreshold = 100;

    private readonly defaultConfig: Required<MobileModalConfig> = {
        title: '',
        subtitle: '',
        content: '',
        showCloseButton: true,
        allowDismiss: true,
        fullscreen: false,
        keyboardHandling: 'auto',
        maxHeight: '90vh',
        className: ''
    };

    constructor(app: App, config: MobileModalConfig, keyboardHandler?: KeyboardHandler) {
        super(app);
        this.config = { ...this.defaultConfig, ...config };
        this.keyboardHandler = keyboardHandler;
        this.originalViewportHeight = window.innerHeight;
        
        this.setupMobileStyles();
        this.setupKeyboardHandling();
        this.setupGestureHandling();
    }

    /**
     * Setup mobile-specific modal styles and behavior
     */
    private setupMobileStyles(): void {
        const { modalEl } = this;
        
        // Add mobile-specific classes
        modalEl.addClass('exocortex-mobile-modal');
        if (this.config.className) {
            modalEl.addClass(this.config.className);
        }

        // Apply mobile layout
        if (PlatformDetector.isMobile()) {
            modalEl.addClass('mobile-layout');
            
            if (this.config.fullscreen) {
                modalEl.addClass('fullscreen-modal');
            } else {
                modalEl.addClass('bottom-sheet');
            }
        }

        // Setup backdrop
        this.setupBackdrop();
        
        // Setup safe area handling for iOS devices
        if (PlatformDetector.isIOS()) {
            this.setupSafeAreaHandling();
        }
    }

    /**
     * Setup backdrop with mobile-friendly dismiss behavior
     */
    private setupBackdrop(): void {
        const backdrop = this.modalEl.parentElement;
        if (!backdrop) return;

        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: flex;
            align-items: ${PlatformDetector.isMobile() ? 'flex-end' : 'center'};
            justify-content: center;
            transition: opacity 0.3s ease;
        `;

        if (this.config.allowDismiss) {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    this.close();
                }
            });
        }
    }

    /**
     * Setup iOS safe area handling
     */
    private setupSafeAreaHandling(): void {
        const safeAreaInsets = PlatformDetector.getSafeAreaInsets();
        
        this.modalEl.style.paddingTop = `${safeAreaInsets.top}px`;
        this.modalEl.style.paddingBottom = `${safeAreaInsets.bottom}px`;
        this.modalEl.style.paddingLeft = `${safeAreaInsets.left}px`;
        this.modalEl.style.paddingRight = `${safeAreaInsets.right}px`;
    }

    /**
     * Setup iOS keyboard handling
     */
    private setupKeyboardHandling(): void {
        if (this.config.keyboardHandling === 'none') return;

        // iOS keyboard detection using viewport height changes
        if (PlatformDetector.isIOS()) {
            const checkKeyboard = () => {
                const currentHeight = window.innerHeight;
                const heightDiff = this.originalViewportHeight - currentHeight;
                
                if (heightDiff > 150) { // Keyboard is likely visible
                    if (!this.isKeyboardVisible) {
                        this.isKeyboardVisible = true;
                        this.keyboardHeight = heightDiff;
                        this.handleKeyboardShow();
                    }
                } else { // Keyboard is likely hidden
                    if (this.isKeyboardVisible) {
                        this.isKeyboardVisible = false;
                        this.keyboardHeight = 0;
                        this.handleKeyboardHide();
                    }
                }
            };

            // Use ResizeObserver for more reliable detection
            if ('ResizeObserver' in window) {
                this.resizeObserver = new ResizeObserver(checkKeyboard);
                this.resizeObserver.observe(document.documentElement);
            } else {
                // Fallback to resize event
                window.addEventListener('resize', checkKeyboard);
                
                // Additional iOS-specific events
                document.addEventListener('focusin', checkKeyboard);
                document.addEventListener('focusout', checkKeyboard);
            }
        }

        // Visual Viewport API for better keyboard detection (where supported)
        if ('visualViewport' in window) {
            const visualViewport = window.visualViewport!;
            
            visualViewport.addEventListener('resize', () => {
                const heightDiff = window.innerHeight - visualViewport.height;
                
                if (heightDiff > 50) {
                    if (!this.isKeyboardVisible) {
                        this.isKeyboardVisible = true;
                        this.keyboardHeight = heightDiff;
                        this.handleKeyboardShow();
                    }
                } else {
                    if (this.isKeyboardVisible) {
                        this.isKeyboardVisible = false;
                        this.keyboardHeight = 0;
                        this.handleKeyboardHide();
                    }
                }
            });
        }
    }

    /**
     * Handle keyboard appearance
     */
    private handleKeyboardShow(): void {
        this.modalEl.addClass('keyboard-visible');
        
        if (this.config.keyboardHandling === 'auto') {
            // Adjust modal position and size
            this.modalEl.style.transform = `translateY(-${Math.min(this.keyboardHeight * 0.5, 100)}px)`;
            this.modalEl.style.maxHeight = `${window.innerHeight - this.keyboardHeight - 40}px`;
            
            // Ensure focused input is visible
            setTimeout(() => {
                const focusedElement = document.activeElement as HTMLElement;
                if (focusedElement && this.modalEl.contains(focusedElement)) {
                    focusedElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }, 100);
        }

        this.keyboardHandler?.onShow?.();
        this.keyboardHandler?.onHeightChange?.(this.keyboardHeight);
    }

    /**
     * Handle keyboard disappearance
     */
    private handleKeyboardHide(): void {
        this.modalEl.removeClass('keyboard-visible');
        
        if (this.config.keyboardHandling === 'auto') {
            this.modalEl.style.transform = '';
            this.modalEl.style.maxHeight = this.config.maxHeight;
        }

        this.keyboardHandler?.onHide?.();
        this.keyboardHandler?.onHeightChange?.(0);
    }

    /**
     * Setup gesture handling for touch devices
     */
    private setupGestureHandling(): void {
        if (!PlatformDetector.hasTouch()) return;

        // Pull-to-dismiss gesture for mobile modals
        if (PlatformDetector.isMobile() && this.config.allowDismiss) {
            this.setupPullToDismiss();
        }

        // Prevent background scrolling on mobile
        this.preventBackgroundScroll();
    }

    /**
     * Setup pull-to-dismiss gesture
     */
    private setupPullToDismiss(): void {
        const modalContent = this.contentEl;
        
        modalContent.addEventListener('touchstart', (e) => {
            this.touchStartY = e.touches[0].clientY;
            this.isDragging = false;
        }, { passive: true });

        modalContent.addEventListener('touchmove', (e) => {
            if (!this.isDragging) {
                const deltaY = e.touches[0].clientY - this.touchStartY;
                
                if (deltaY > 10 && modalContent.scrollTop === 0) {
                    this.isDragging = true;
                    modalContent.style.touchAction = 'none';
                }
            }

            if (this.isDragging) {
                const deltaY = Math.max(0, e.touches[0].clientY - this.touchStartY);
                const progress = Math.min(deltaY / this.dragThreshold, 1);
                
                this.modalEl.style.transform = `translateY(${deltaY}px)`;
                this.modalEl.style.opacity = `${1 - progress * 0.5}`;
                
                // Add visual feedback
                if (deltaY > this.dragThreshold * 0.7) {
                    this.modalEl.addClass('will-dismiss');
                } else {
                    this.modalEl.removeClass('will-dismiss');
                }
            }
        }, { passive: false });

        modalContent.addEventListener('touchend', (e) => {
            if (this.isDragging) {
                const deltaY = e.changedTouches[0].clientY - this.touchStartY;
                
                if (deltaY > this.dragThreshold) {
                    this.close();
                } else {
                    // Snap back
                    this.modalEl.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                    this.modalEl.style.transform = '';
                    this.modalEl.style.opacity = '';
                    
                    setTimeout(() => {
                        this.modalEl.style.transition = '';
                    }, 300);
                }
                
                this.modalEl.removeClass('will-dismiss');
                modalContent.style.touchAction = '';
                this.isDragging = false;
            }
        }, { passive: true });
    }

    /**
     * Prevent background scrolling when modal is open
     */
    private preventBackgroundScroll(): void {
        const originalOverflow = document.body.style.overflow;
        const originalPosition = document.body.style.position;
        
        document.body.style.overflow = 'hidden';
        if (PlatformDetector.isIOS()) {
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.height = '100%';
        }

        // Restore on close
        this.modalEl.addEventListener('beforeunload', () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.position = originalPosition;
        });
    }

    /**
     * Override onOpen to setup mobile-specific content
     */
    onOpen(): void {
        const { contentEl } = this;
        
        this.setupModalStructure();
        this.populateContent();
        
        // Focus management for accessibility
        if (PlatformDetector.hasTouch()) {
            this.setupTouchFocusManagement();
        }
    }

    /**
     * Setup the modal structure with header, body, and footer
     */
    private setupModalStructure(): void {
        const { contentEl } = this;
        
        // Clear any existing content
        contentEl.empty();
        
        // Create header
        if (this.config.title || this.config.showCloseButton) {
            const header = this.createModalHeader();
            contentEl.appendChild(header);
        }

        // Create body
        const body = this.createModalBody();
        contentEl.appendChild(body);
    }

    /**
     * Create modal header with title and close button
     */
    private createModalHeader(): HTMLElement {
        const header = document.createElement('div');
        header.className = 'exocortex-mobile-modal-header';
        
        // Add drag indicator for mobile
        if (PlatformDetector.isMobile()) {
            const dragIndicator = document.createElement('div');
            dragIndicator.className = 'modal-drag-indicator';
            header.appendChild(dragIndicator);
        }

        // Title section
        if (this.config.title) {
            const titleContainer = document.createElement('div');
            titleContainer.className = 'modal-title-container';
            
            const title = document.createElement('h2');
            title.className = 'modal-title';
            title.textContent = this.config.title;
            titleContainer.appendChild(title);
            
            if (this.config.subtitle) {
                const subtitle = document.createElement('p');
                subtitle.className = 'modal-subtitle';
                subtitle.textContent = this.config.subtitle;
                titleContainer.appendChild(subtitle);
            }
            
            header.appendChild(titleContainer);
        }

        // Close button
        if (this.config.showCloseButton) {
            const closeButton = this.createTouchCloseButton();
            header.appendChild(closeButton);
        }

        return header;
    }

    /**
     * Create touch-optimized close button
     */
    private createTouchCloseButton(): HTMLElement {
        const button = document.createElement('button');
        button.className = 'modal-close-button';
        button.innerHTML = '✕';
        button.setAttribute('aria-label', 'Close modal');
        
        // iOS-compliant touch target
        button.style.cssText = `
            width: 44px;
            height: 44px;
            border: none;
            background: none;
            color: var(--text-muted);
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            cursor: pointer;
            transition: background-color 0.2s ease;
            -webkit-tap-highlight-color: transparent;
        `;

        button.addEventListener('click', () => this.close());
        
        // Touch feedback
        if (PlatformDetector.hasTouch()) {
            button.addEventListener('touchstart', () => {
                button.style.backgroundColor = 'var(--background-modifier-hover)';
            }, { passive: true });
            
            button.addEventListener('touchend', () => {
                setTimeout(() => {
                    button.style.backgroundColor = '';
                }, 150);
            }, { passive: true });
        } else {
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = 'var(--background-modifier-hover)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = '';
            });
        }

        return button;
    }

    /**
     * Create modal body container
     */
    private createModalBody(): HTMLElement {
        const body = document.createElement('div');
        body.className = 'exocortex-mobile-modal-body';
        
        body.style.cssText = `
            flex: 1;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            padding: 0 20px 20px 20px;
        `;

        return body;
    }

    /**
     * Populate modal content
     */
    private populateContent(): void {
        const body = this.contentEl.querySelector('.exocortex-mobile-modal-body') as HTMLElement;
        if (!body) return;

        if (typeof this.config.content === 'string') {
            body.innerHTML = this.config.content;
        } else if (this.config.content instanceof HTMLElement) {
            body.appendChild(this.config.content);
        }
    }

    /**
     * Setup touch-specific focus management
     */
    private setupTouchFocusManagement(): void {
        // Prevent focus outline on touch devices
        const focusableElements = this.contentEl.querySelectorAll(
            'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        focusableElements.forEach(element => {
            element.addEventListener('touchstart', () => {
                element.classList.add('touch-active');
            });

            element.addEventListener('touchend', () => {
                setTimeout(() => {
                    element.classList.remove('touch-active');
                }, 150);
            });
        });
    }

    /**
     * Add content to modal body
     */
    addContent(content: HTMLElement | string): void {
        const body = this.contentEl.querySelector('.exocortex-mobile-modal-body') as HTMLElement;
        if (!body) return;

        if (typeof content === 'string') {
            const div = document.createElement('div');
            div.innerHTML = content;
            body.appendChild(div);
        } else {
            body.appendChild(content);
        }
    }

    /**
     * Create mobile-optimized form section
     */
    createFormSection(title?: string): HTMLElement {
        const section = document.createElement('div');
        section.className = 'mobile-form-section';
        
        if (title) {
            const titleEl = document.createElement('h3');
            titleEl.className = 'form-section-title';
            titleEl.textContent = title;
            section.appendChild(titleEl);
        }

        const content = document.createElement('div');
        content.className = 'form-section-content';
        section.appendChild(content);

        return section;
    }

    /**
     * Create mobile-optimized button group
     */
    createButtonGroup(buttons: Array<{
        text: string;
        onClick: () => void;
        variant?: 'primary' | 'secondary' | 'danger';
        disabled?: boolean;
    }>): HTMLElement {
        const group = document.createElement('div');
        group.className = 'mobile-button-group';
        
        const isVertical = PlatformDetector.isMobile();
        group.style.cssText = `
            display: flex;
            flex-direction: ${isVertical ? 'column' : 'row'};
            gap: 12px;
            margin-top: 20px;
        `;

        buttons.forEach(buttonConfig => {
            const button = this.createTouchButton(buttonConfig);
            group.appendChild(button);
        });

        return group;
    }

    /**
     * Create touch-optimized button
     */
    private createTouchButton(config: {
        text: string;
        onClick: () => void;
        variant?: 'primary' | 'secondary' | 'danger';
        disabled?: boolean;
    }): HTMLElement {
        const button = document.createElement('button');
        button.textContent = config.text;
        button.className = `mobile-button mobile-button--${config.variant || 'secondary'}`;
        
        if (config.disabled) {
            button.disabled = true;
        }

        button.addEventListener('click', config.onClick);

        return button;
    }

    /**
     * Show mobile notification within modal context
     */
    showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
        const notification = document.createElement('div');
        notification.className = `mobile-notification mobile-notification--${type}`;
        notification.textContent = message;
        
        // Insert at top of modal
        const header = this.contentEl.querySelector('.exocortex-mobile-modal-header');
        if (header) {
            header.appendChild(notification);
        } else {
            this.contentEl.insertBefore(notification, this.contentEl.firstChild);
        }

        // Auto-remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, type === 'error' ? 5000 : 3000);
    }

    /**
     * Update modal configuration
     */
    updateConfig(newConfig: Partial<MobileModalConfig>): void {
        this.config = { ...this.config, ...newConfig };
        
        // Update title if changed
        if (newConfig.title) {
            const titleEl = this.contentEl.querySelector('.modal-title');
            if (titleEl) {
                titleEl.textContent = newConfig.title;
            }
        }

        // Update subtitle if changed
        if (newConfig.subtitle) {
            const subtitleEl = this.contentEl.querySelector('.modal-subtitle');
            if (subtitleEl) {
                subtitleEl.textContent = newConfig.subtitle;
            }
        }
    }

    /**
     * Get current keyboard height
     */
    getKeyboardHeight(): number {
        return this.keyboardHeight;
    }

    /**
     * Check if keyboard is currently visible
     */
    isKeyboardOpen(): boolean {
        return this.isKeyboardVisible;
    }

    /**
     * Override onClose to cleanup
     */
    onClose(): void {
        // Cleanup keyboard handling
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        // Restore body styles
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';

        // Clear content
        const { contentEl } = this;
        contentEl.empty();
    }
}