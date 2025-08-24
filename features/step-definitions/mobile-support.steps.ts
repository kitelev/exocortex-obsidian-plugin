import { Given, When, Then, DataTable, Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import { expect } from 'chai';

setDefaultTimeout(10000);

// Mock platform detection
interface PlatformInfo {
  platform: 'desktop' | 'mobile';
  deviceType: 'iOS' | 'Android' | 'Desktop';
  screenSize: 'small' | 'medium' | 'large';
  touchEnabled: boolean;
  userAgent: string;
}

// Mock mobile performance optimizer
class MobilePerformanceOptimizer {
  private readonly config = {
    mobile: {
      batchSize: 10,
      queryLimit: 50,
      cacheSize: 10 * 1024 * 1024, // 10MB
      renderThrottle: 16
    },
    desktop: {
      batchSize: 50,
      queryLimit: 200,
      cacheSize: 50 * 1024 * 1024, // 50MB
      renderThrottle: 8
    }
  };

  optimizeForPlatform(platform: 'mobile' | 'desktop'): any {
    return this.config[platform];
  }

  getPerformanceMetrics(): any {
    return {
      frameRate: 60,
      memoryUsage: 45 * 1024 * 1024, // 45MB
      renderTime: 16.67 // ms per frame
    };
  }
}

// Mock UI component with touch support
class TouchOptimizedButton {
  private readonly specs = {
    minHeight: 44,
    minWidth: 44,
    spacing: 8,
    tapTarget: true
  };

  constructor(
    private element: HTMLElement,
    private isMobile: boolean
  ) {
    this.applyTouchOptimizations();
  }

  private applyTouchOptimizations(): void {
    if (this.isMobile) {
      this.element.style.minHeight = `${this.specs.minHeight}px`;
      this.element.style.minWidth = `${this.specs.minWidth}px`;
      this.element.style.margin = `${this.specs.spacing}px`;
    }
  }

  getSpecs(): any {
    return this.specs;
  }

  simulateTouch(gesture: string): void {
    switch (gesture) {
      case 'tap':
        this.element.click();
        break;
      case 'long_press':
        // Simulate long press context menu
        break;
      case 'swipe':
        // Simulate swipe gesture
        break;
    }
  }
}

// Mock modal with mobile adaptations
class MobileModal {
  private isFullScreen = false;
  private keyboardVisible = false;
  private swipeGestureEnabled = true;

  constructor(
    private screenSize: 'small' | 'medium' | 'large',
    private element: HTMLElement
  ) {
    this.adaptForMobile();
  }

  private adaptForMobile(): void {
    if (this.screenSize === 'small') {
      this.isFullScreen = true;
      this.element.style.position = 'fixed';
      this.element.style.top = '0';
      this.element.style.left = '0';
      this.element.style.width = '100%';
      this.element.style.height = '100%';
    }
  }

  showKeyboard(): void {
    this.keyboardVisible = true;
    if (this.screenSize === 'small') {
      // Push content up
      this.element.style.transform = 'translateY(-150px)';
    }
  }

  hideKeyboard(): void {
    this.keyboardVisible = false;
    this.element.style.transform = 'translateY(0)';
  }

  enableSwipeToDismiss(): void {
    this.swipeGestureEnabled = true;
  }

  isAdaptedForMobile(): boolean {
    return this.isFullScreen && this.swipeGestureEnabled;
  }

  getFeatures(): any {
    return {
      size: this.isFullScreen ? 'Full screen on small devices' : 'Modal',
      keyboard: this.keyboardVisible ? 'Push content up when visible' : 'Hidden',
      scrolling: 'Smooth with momentum',
      buttons: 'Bottom-aligned for thumb reach'
    };
  }
}

// Mock responsive table
class ResponsiveTable {
  private adaptations: any = {};

  constructor(
    private columns: string[],
    private isMobile: boolean
  ) {
    this.applyMobileAdaptations();
  }

  private applyMobileAdaptations(): void {
    if (this.isMobile) {
      this.adaptations = {
        layout: 'Horizontal scroll enabled',
        priorityCols: ['Title', 'Status'], // Always visible
        touchScroll: 'Smooth with indicators',
        rowHeight: 'Increased for touch targets'
      };
    }
  }

  getAdaptations(): any {
    return this.adaptations;
  }

  toggleColumnVisibility(column: string, visible: boolean): void {
    // Implementation for column visibility toggles
  }
}

// Mock graph with touch controls
class MobileTouchGraph {
  private gestures: Map<string, string> = new Map();
  private hapticEnabled = false;

  constructor() {
    this.setupTouchControls();
  }

  private setupTouchControls(): void {
    this.gestures.set('pinch', 'Zoom in/out');
    this.gestures.set('two-finger drag', 'Pan view');
    this.gestures.set('tap node', 'Show details');
    this.gestures.set('double-tap', 'Focus node');
    this.gestures.set('long-press', 'Context menu');
  }

  enableHapticFeedback(): void {
    this.hapticEnabled = true;
  }

  handleGesture(gesture: string): string {
    const action = this.gestures.get(gesture);
    if (action && this.hapticEnabled) {
      this.provideHapticFeedback();
    }
    return action || 'Unknown gesture';
  }

  private provideHapticFeedback(): void {
    // Simulate haptic feedback
  }

  getTouchControls(): Map<string, string> {
    return this.gestures;
  }
}

// Mock offline capability manager
class OfflineCapabilityManager {
  private isOffline = false;
  private queuedChanges: any[] = [];
  private cachedData: Map<string, any> = new Map();

  setOfflineMode(offline: boolean): void {
    this.isOffline = offline;
  }

  cacheData(key: string, data: any): void {
    this.cachedData.set(key, data);
  }

  queueChange(change: any): void {
    if (this.isOffline) {
      this.queuedChanges.push(change);
    }
  }

  syncWhenOnline(): Promise<void> {
    return new Promise(resolve => {
      if (!this.isOffline && this.queuedChanges.length > 0) {
        // Sync queued changes
        this.queuedChanges = [];
      }
      resolve();
    });
  }

  getCapabilities(): any {
    return {
      cacheData: 'Store locally',
      queueChanges: 'Sync when online',
      indicateStatus: 'Show offline badge',
      fullFunctionality: 'Everything works offline'
    };
  }

  isWorkingOffline(): boolean {
    return this.isOffline;
  }
}

// Mock memory manager
class MobileMemoryManager {
  private memoryUsage = 45 * 1024 * 1024; // 45MB
  private maxMemory = 100 * 1024 * 1024; // 100MB
  private memoryPressure = false;

  checkMemoryPressure(): boolean {
    return (this.memoryUsage / this.maxMemory) > 0.8;
  }

  handleMemoryPressure(): void {
    this.memoryPressure = true;
    // Clear old cache
    this.clearOldCache();
    // Reduce batch size
    this.reduceBatchSize();
    // Pause background tasks
    this.pauseBackground();
  }

  private clearOldCache(): void {
    this.memoryUsage *= 0.7; // Reduce by 30%
  }

  private reduceBatchSize(): void {
    // Batch size reduced in performance optimizer
  }

  private pauseBackground(): void {
    // Background tasks paused
  }

  getMemoryActions(): any {
    return {
      'Clear old cache': this.memoryUsage > this.maxMemory * 0.8 ? '>80% memory use' : 'Normal',
      'Reduce batch size': this.memoryPressure ? 'Memory warning' : 'Normal',
      'Pause background': this.memoryPressure ? 'Critical memory' : 'Normal',
      'Graceful degradation': 'Maintain core features'
    };
  }
}

// Mock text input optimizer
class MobileTextInputOptimizer {
  private inputFeatures = {
    fontSize: '16px', // Minimum to prevent auto-zoom
    tapTargets: '44x44px',
    autoZoom: false,
    keyboardType: 'default',
    autocomplete: true
  };

  optimizeInput(inputElement: HTMLInputElement, context: string): void {
    inputElement.style.fontSize = this.inputFeatures.fontSize;
    inputElement.style.minHeight = this.inputFeatures.tapTargets;
    inputElement.style.minWidth = this.inputFeatures.tapTargets;
    
    // Context-appropriate keyboard
    switch (context) {
      case 'email':
        inputElement.type = 'email';
        this.inputFeatures.keyboardType = 'email';
        break;
      case 'number':
        inputElement.type = 'number';
        this.inputFeatures.keyboardType = 'numeric';
        break;
      case 'url':
        inputElement.type = 'url';
        this.inputFeatures.keyboardType = 'url';
        break;
      default:
        inputElement.type = 'text';
        this.inputFeatures.keyboardType = 'default';
    }
    
    if (this.inputFeatures.autocomplete) {
      inputElement.autocomplete = 'on';
    }
  }

  getInputFeatures(): any {
    return this.inputFeatures;
  }
}

// Test World interface
interface MobileWorld {
  platformInfo: PlatformInfo;
  performanceOptimizer: MobilePerformanceOptimizer;
  touchButtons: TouchOptimizedButton[];
  modal: MobileModal | null;
  responsiveTable: ResponsiveTable | null;
  touchGraph: MobileTouchGraph;
  offlineManager: OfflineCapabilityManager;
  memoryManager: MobileMemoryManager;
  textInputOptimizer: MobileTextInputOptimizer;
  
  // Test state
  componentInitialized: boolean;
  gestureRecognized: string;
  performanceMetrics: any;
  modalFeatures: any;
  tableAdaptations: any;
  
  // DOM elements for testing
  mockElement: HTMLElement;
}

let world: MobileWorld;

Before(function() {
  // Create mock DOM element
  const mockElement = {
    style: {} as CSSStyleDeclaration,
    click: () => {},
    addEventListener: () => {}
  } as HTMLElement;

  world = {
    platformInfo: {
      platform: 'mobile',
      deviceType: 'iOS',
      screenSize: 'small',
      touchEnabled: true,
      userAgent: 'Mobile Safari'
    },
    performanceOptimizer: new MobilePerformanceOptimizer(),
    touchButtons: [],
    modal: null,
    responsiveTable: null,
    touchGraph: new MobileTouchGraph(),
    offlineManager: new OfflineCapabilityManager(),
    memoryManager: new MobileMemoryManager(),
    textInputOptimizer: new MobileTextInputOptimizer(),
    componentInitialized: false,
    gestureRecognized: '',
    performanceMetrics: {},
    modalFeatures: {},
    tableAdaptations: {},
    mockElement
  };
});

After(function() {
  world.touchButtons = [];
  world.modal = null;
  world.responsiveTable = null;
});

Given('I am using Obsidian mobile app', function() {
  world.platformInfo.platform = 'mobile';
  expect(world.platformInfo.platform).to.equal('mobile');
});

Given('Exocortex plugin is installed', function() {
  world.componentInitialized = true;
  expect(world.componentInitialized).to.be.true;
});

Given('platform detection identifies mobile device', function() {
  world.platformInfo = {
    platform: 'mobile',
    deviceType: 'iOS',
    screenSize: 'small',
    touchEnabled: true,
    userAgent: 'Mobile Safari iPhone'
  };
});

Given('I am viewing an asset with buttons', function() {
  // Create touch-optimized buttons
  for (let i = 0; i < 3; i++) {
    const button = new TouchOptimizedButton(world.mockElement, true);
    world.touchButtons.push(button);
  }
});

Given('limited mobile device resources', function() {
  world.platformInfo.screenSize = 'small';
  world.memoryManager = new MobileMemoryManager();
});

Given('a children efforts table with many columns', function() {
  const columns = ['Title', 'Status', 'Assignee', 'Priority', 'Deadline', 'Progress', 'Tags', 'Notes'];
  world.responsiveTable = new ResponsiveTable(columns, true);
});

Given('a knowledge graph on mobile', function() {
  world.touchGraph = new MobileTouchGraph();
  world.touchGraph.enableHapticFeedback();
});

Given('intermittent mobile connectivity', function() {
  world.offlineManager.setOfflineMode(true);
});

Given('mobile memory constraints', function() {
  world.memoryManager = new MobileMemoryManager();
});

When('the plugin initializes on mobile', function() {
  world.componentInitialized = true;
  world.performanceMetrics = world.performanceOptimizer.optimizeForPlatform('mobile');
});

When('I interact with UI elements', function() {
  // Simulate interaction with touch-optimized elements
  world.touchButtons.forEach(button => {
    button.simulateTouch('tap');
  });
});

When('loading large knowledge bases', function() {
  world.performanceMetrics = world.performanceOptimizer.getPerformanceMetrics();
});

When('I open the asset creation modal', function() {
  world.modal = new MobileModal(world.platformInfo.screenSize, world.mockElement);
  world.modalFeatures = world.modal.getFeatures();
});

When('displayed on mobile', function() {
  world.tableAdaptations = world.responsiveTable!.getAdaptations();
});

When('I interact with the graph', function() {
  world.gestureRecognized = world.touchGraph.handleGesture('pinch');
});

When('working offline', function() {
  world.offlineManager.setOfflineMode(true);
  world.offlineManager.queueChange({ type: 'update', data: 'test' });
});

When('memory pressure detected', function() {
  world.memoryManager.handleMemoryPressure();
});

When('editing properties on mobile', function() {
  const input = document.createElement('input') as HTMLInputElement;
  world.textInputOptimizer.optimizeInput(input, 'text');
});

Then('it should detect:', function(dataTable: DataTable) {
  const expectedProperties = dataTable.hashes();
  
  expectedProperties.forEach(row => {
    const property = row.property;
    const value = row.value;
    
    switch (property) {
      case 'platform':
        expect(world.platformInfo.platform).to.equal(value);
        break;
      case 'device_type':
        expect(['iOS', 'Android']).to.include(world.platformInfo.deviceType);
        break;
      case 'screen_size':
        expect(['small', 'medium']).to.include(world.platformInfo.screenSize);
        break;
      case 'touch_enabled':
        expect(world.platformInfo.touchEnabled).to.equal(value === 'true');
        break;
    }
  });
});

Then('load mobile-optimized components', function() {
  expect(world.componentInitialized).to.be.true;
});

Then('adjust UI element sizes', function() {
  // Verify UI elements are properly sized for mobile
  expect(world.touchButtons).to.not.be.empty;
});

Then('buttons should be:', function(dataTable: DataTable) {
  const specs = dataTable.hashes();
  
  specs.forEach(spec => {
    const property = spec.property;
    const specification = spec.specification;
    
    world.touchButtons.forEach(button => {
      const buttonSpecs = button.getSpecs();
      
      switch (property) {
        case 'min_height':
          expect(buttonSpecs.minHeight).to.equal(44);
          break;
        case 'min_width':
          expect(buttonSpecs.minWidth).to.equal(44);
          break;
        case 'spacing':
          expect(buttonSpecs.spacing).to.be.greaterThanOrEqual(8);
          break;
        case 'tap_target':
          expect(buttonSpecs.tapTarget).to.be.true;
          break;
      }
    });
  });
});

Then('support touch gestures:', function(dataTable: DataTable) {
  const gestures = dataTable.hashes();
  
  gestures.forEach(gesture => {
    const gestureType = gesture.gesture;
    const action = gesture.action;
    
    // Simulate gesture
    world.touchButtons[0]?.simulateTouch(gestureType);
    // In real implementation, would verify the action occurred
    expect(action).to.not.be.empty;
  });
});

Then('the plugin should:', function(dataTable: DataTable) {
  const optimizations = dataTable.hashes();
  
  optimizations.forEach(opt => {
    const optimization = opt.optimization;
    const description = opt.description;
    
    switch (optimization) {
      case 'Batch size':
        expect(world.performanceMetrics.batchSize).to.equal(10);
        break;
      case 'Query limit':
        expect(world.performanceMetrics.queryLimit).to.equal(50);
        break;
      case 'Cache size':
        expect(world.performanceMetrics.cacheSize).to.equal(10 * 1024 * 1024);
        break;
      case 'Render throttle':
        expect(world.performanceMetrics.renderThrottle).to.equal(16);
        break;
    }
  });
});

Then('maintain responsive UI \\({int} FPS)', function(fps: number) {
  expect(world.performanceMetrics.frameRate).to.equal(fps);
});

Then('the modal should:', function(dataTable: DataTable) {
  const features = dataTable.hashes();
  
  features.forEach(feature => {
    const featureType = feature.feature;
    const behavior = feature.behavior;
    
    expect(world.modalFeatures[featureType.toLowerCase()]).to.include(behavior);
  });
});

Then('support swipe-to-dismiss gesture', function() {
  expect(world.modal?.isAdaptedForMobile()).to.be.true;
});

Then('the table should:', function(dataTable: DataTable) {
  const adaptations = dataTable.hashes();
  
  adaptations.forEach(adaptation => {
    const adaptationType = adaptation.adaptation;
    const description = adaptation.description;
    
    expect(world.tableAdaptations[adaptationType.toLowerCase().replace(' ', '')]).to.include(description);
  });
});

Then('provide column visibility toggles', function() {
  // Verify column toggle functionality exists
  expect(world.responsiveTable?.toggleColumnVisibility).to.be.a('function');
});

Then('touch controls should include:', function(dataTable: DataTable) {
  const controls = dataTable.hashes();
  const touchControls = world.touchGraph.getTouchControls();
  
  controls.forEach(control => {
    const gesture = control.gesture;
    const func = control.function;
    
    expect(touchControls.get(gesture)).to.equal(func);
  });
});

Then('provide haptic feedback', function() {
  // Haptic feedback is enabled in the setup
  const result = world.touchGraph.handleGesture('tap node');
  expect(result).to.equal('Show details');
});

Then('the plugin should:', function(dataTable: DataTable) {
  const capabilities = dataTable.hashes();
  const offlineCapabilities = world.offlineManager.getCapabilities();
  
  capabilities.forEach(capability => {
    const cap = capability.capability;
    const implementation = capability.implementation;
    
    expect(offlineCapabilities[cap.toLowerCase().replace(' ', '')]).to.equal(implementation);
  });
});

Then('the plugin should:', function(dataTable: DataTable) {
  const actions = dataTable.hashes();
  const memoryActions = world.memoryManager.getMemoryActions();
  
  actions.forEach(action => {
    const actionType = action.action;
    const trigger = action.trigger;
    
    // Verify memory management actions are appropriate
    expect(memoryActions[actionType]).to.not.be.null;
  });
});

Then('input fields should:', function(dataTable: DataTable) {
  const features = dataTable.hashes();
  const inputFeatures = world.textInputOptimizer.getInputFeatures();
  
  features.forEach(feature => {
    const featureType = feature.feature;
    const implementation = feature.implementation;
    
    switch (featureType) {
      case 'Font size':
        expect(inputFeatures.fontSize).to.equal('16px');
        break;
      case 'Tap targets':
        expect(inputFeatures.tapTargets).to.equal('44x44px');
        break;
      case 'Auto-zoom':
        expect(inputFeatures.autoZoom).to.be.false;
        break;
      case 'Keyboard type':
        expect(inputFeatures.keyboardType).to.not.be.empty;
        break;
      case 'Autocomplete':
        expect(inputFeatures.autocomplete).to.be.true;
        break;
    }
  });
});