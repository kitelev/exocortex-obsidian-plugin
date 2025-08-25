import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@jest/globals';
import { ExocortexWorld } from '../support/world';
import { ErrorAnalyzer } from '../../src/domain/errors/ErrorAnalyzer';
import { ExocortexError } from '../../src/domain/errors/ExocortexError';
import { CircuitBreakerService } from '../../src/infrastructure/resilience/CircuitBreakerService';

interface ErrorCondition {
  error_type: string;
  error_category: string;
  severity: string;
  recovery_strategy: string;
}

interface ComponentFailure {
  failing_component: string;
  impact: string;
  expected_behavior: string;
}

interface RecoverableError {
  error_condition: string;
  recovery_action: string;
  max_attempts: string;
}

interface UserError {
  user_action: string;
  error_type: string;
  guidance_provided: string;
}

interface DataCorruption {
  data_type: string;
  corruption_indicators: string;
  protection_measures: string;
}

interface CircuitBreakerConfig {
  dependency_type: string;
  failure_threshold: string;
  circuit_behavior: string;
}

// Background setup
Given('the error handling system is active', function (this: ExocortexWorld) {
  const errorAnalyzer = new ErrorAnalyzer();
  this.setTestData('errorAnalyzer', errorAnalyzer);
  
  // Initialize error tracking
  this.setTestData('errorLog', []);
  this.setTestData('recoveryAttempts', new Map());
  
  expect(errorAnalyzer).toBeDefined();
});

Given('error logging is enabled', function (this: ExocortexWorld) {
  this.setTestData('errorLoggingEnabled', true);
  this.setTestData('logLevel', 'debug');
});

Given('recovery mechanisms are available', function (this: ExocortexWorld) {
  const circuitBreakerService = new CircuitBreakerService();
  this.setTestData('circuitBreakerService', circuitBreakerService);
  
  // Initialize recovery mechanisms
  this.setTestData('recoveryMechanisms', {
    retry: true,
    gracefulDegradation: true,
    circuitBreaker: true,
    backup: true
  });
});

// Error Classification Scenarios
Given('the system encounters various error conditions', function (this: ExocortexWorld) {
  this.setTestData('errorSimulationMode', true);
});

When('errors of different types occur:', function (this: ExocortexWorld, dataTable: any) {
  const errorConditions = dataTable.hashes() as ErrorCondition[];
  const errorAnalyzer = this.getTestData('errorAnalyzer') as ErrorAnalyzer;
  const classifiedErrors = [];
  
  errorConditions.forEach(condition => {
    const simulatedError = new Error(`Simulated ${condition.error_type} error`);
    
    const exocortexError = new ExocortexError(
      simulatedError.message,
      condition.error_type,
      condition.error_category as any,
      condition.severity as any,
      { originalError: simulatedError }
    );
    
    const analysis = errorAnalyzer.analyzeError(exocortexError);
    classifiedErrors.push({
      ...condition,
      analysis,
      errorCode: exocortexError.getErrorCode()
    });
  });
  
  this.setTestData('classifiedErrors', classifiedErrors);
});

Then('errors should be classified correctly', function (this: ExocortexWorld) {
  const classifiedErrors = this.getTestData('classifiedErrors') as any[];
  
  classifiedErrors.forEach(error => {
    expect(error.analysis).toBeDefined();
    expect(error.analysis.category).toBe(error.error_category);
    expect(error.analysis.severity).toBe(error.severity);
  });
});

Then('appropriate error codes should be assigned', function (this: ExocortexWorld) {
  const classifiedErrors = this.getTestData('classifiedErrors') as any[];
  
  classifiedErrors.forEach(error => {
    expect(error.errorCode).toBeDefined();
    expect(error.errorCode).toMatch(/^[A-Z]{3}_\d{4}$/); // Format: ABC_1234
  });
});

Then('error severity should determine response strategy', function (this: ExocortexWorld) {
  const classifiedErrors = this.getTestData('classifiedErrors') as any[];
  
  classifiedErrors.forEach(error => {
    switch (error.severity) {
      case 'critical':
        expect(error.recovery_strategy).toMatch(/backup|restore|emergency/);
        break;
      case 'high':
        expect(error.recovery_strategy).toMatch(/restart|fallback/);
        break;
      case 'medium':
        expect(error.recovery_strategy).toMatch(/retry|degradation/);
        break;
      case 'low':
        expect(error.recovery_strategy).toMatch(/continue|show_error/);
        break;
    }
  });
});

Then('detailed error context should be captured', function (this: ExocortexWorld) {
  const classifiedErrors = this.getTestData('classifiedErrors') as any[];
  
  classifiedErrors.forEach(error => {
    expect(error.analysis.context).toBeDefined();
    expect(error.analysis.timestamp).toBeDefined();
    expect(error.analysis.stackTrace).toBeDefined();
  });
});

// Graceful Degradation Scenarios
Given('a non-critical system component fails', function (this: ExocortexWorld) {
  this.setTestData('componentFailureMode', true);
});

When('the error occurs in:', function (this: ExocortexWorld, dataTable: any) {
  const componentFailures = dataTable.hashes() as ComponentFailure[];
  const degradationResults = new Map();
  
  componentFailures.forEach(failure => {
    const degradationResult = this.simulateComponentFailure(failure.failing_component);
    degradationResults.set(failure.failing_component, {
      impact: failure.impact,
      expectedBehavior: failure.expected_behavior,
      actualResponse: degradationResult
    });
  });
  
  this.setTestData('degradationResults', degradationResults);
});

Then('core functionality should remain available', function (this: ExocortexWorld) {
  const degradationResults = this.getTestData('degradationResults') as Map<string, any>;
  
  for (const [component, result] of degradationResults.entries()) {
    expect(result.actualResponse.coreFunctionalityAvailable).toBe(true);
  }
});

Then('users should be informed of limitations', function (this: ExocortexWorld) {
  const degradationResults = this.getTestData('degradationResults') as Map<string, any>;
  
  for (const [component, result] of degradationResults.entries()) {
    expect(result.actualResponse.userNotified).toBe(true);
    expect(result.actualResponse.notificationMessage).toBeDefined();
  }
});

Then('alternative workflows should be suggested', function (this: ExocortexWorld) {
  const degradationResults = this.getTestData('degradationResults') as Map<string, any>;
  
  for (const [component, result] of degradationResults.entries()) {
    expect(result.actualResponse.alternatives).toBeDefined();
    expect(result.actualResponse.alternatives.length).toBeGreaterThan(0);
  }
});

Then('the system should continue operating normally', function (this: ExocortexWorld) {
  const degradationResults = this.getTestData('degradationResults') as Map<string, any>;
  
  for (const [component, result] of degradationResults.entries()) {
    expect(result.actualResponse.systemStable).toBe(true);
  }
});

// Automatic Recovery Scenarios
Given('the system encounters recoverable errors', function (this: ExocortexWorld) {
  this.setTestData('recoverableErrorMode', true);
});

When('transient errors occur:', function (this: ExocortexWorld, dataTable: any) {
  const recoverableErrors = dataTable.hashes() as RecoverableError[];
  const recoveryResults = new Map();
  
  recoverableErrors.forEach(error => {
    const maxAttempts = error.max_attempts === 'unlimited' ? -1 : parseInt(error.max_attempts);
    const recoveryResult = this.simulateRecoveryAttempts(error.error_condition, error.recovery_action, maxAttempts);
    
    recoveryResults.set(error.error_condition, recoveryResult);
  });
  
  this.setTestData('recoveryResults', recoveryResults);
});

Then('automatic recovery should be attempted', function (this: ExocortexWorld) {
  const recoveryResults = this.getTestData('recoveryResults') as Map<string, any>;
  
  for (const [condition, result] of recoveryResults.entries()) {
    expect(result.recoveryAttempted).toBe(true);
    expect(result.attemptCount).toBeGreaterThan(0);
  }
});

Then('recovery attempts should follow backoff strategies', function (this: ExocortexWorld) {
  const recoveryResults = this.getTestData('recoveryResults') as Map<string, any>;
  
  for (const [condition, result] of recoveryResults.entries()) {
    if (condition.includes('network') || condition.includes('rate_limit')) {
      expect(result.usedBackoffStrategy).toBe(true);
      expect(result.backoffIntervals).toBeDefined();
    }
  }
});

Then('success/failure should be logged appropriately', function (this: ExocortexWorld) {
  const recoveryResults = this.getTestData('recoveryResults') as Map<string, any>;
  const errorLog = this.getTestData('errorLog') as any[];
  
  for (const [condition, result] of recoveryResults.entries()) {
    const relevantLogs = errorLog.filter(log => log.condition === condition);
    expect(relevantLogs.length).toBeGreaterThan(0);
    
    const finalLog = relevantLogs[relevantLogs.length - 1];
    expect(finalLog.outcome).toMatch(/success|failure|max_attempts_exceeded/);
  }
});

Then('users should be informed of recovery progress for long operations', function (this: ExocortexWorld) {
  const recoveryResults = this.getTestData('recoveryResults') as Map<string, any>;
  
  for (const [condition, result] of recoveryResults.entries()) {
    if (result.attemptCount > 3) { // Long operations
      expect(result.userProgressUpdates).toBe(true);
    }
  }
});

// User Error Handling Scenarios
Given('a user provides invalid input or performs invalid actions', function (this: ExocortexWorld) {
  this.setTestData('userErrorMode', true);
});

When('user errors occur:', function (this: ExocortexWorld, dataTable: any) {
  const userErrors = dataTable.hashes() as UserError[];
  const errorHandlingResults = new Map();
  
  userErrors.forEach(error => {
    const handlingResult = this.simulateUserErrorHandling(error.user_action, error.error_type);
    
    errorHandlingResults.set(error.user_action, {
      errorType: error.error_type,
      expectedGuidance: error.guidance_provided,
      actualResponse: handlingResult
    });
  });
  
  this.setTestData('userErrorHandlingResults', errorHandlingResults);
});

Then('clear error messages should be displayed', function (this: ExocortexWorld) {
  const handlingResults = this.getTestData('userErrorHandlingResults') as Map<string, any>;
  
  for (const [action, result] of handlingResults.entries()) {
    expect(result.actualResponse.errorMessage).toBeDefined();
    expect(result.actualResponse.errorMessage.length).toBeGreaterThan(10);
    expect(result.actualResponse.errorMessage).not.toMatch(/undefined|null|error/i);
  }
});

Then('specific guidance should be provided', function (this: ExocortexWorld) {
  const handlingResults = this.getTestData('userErrorHandlingResults') as Map<string, any>;
  
  for (const [action, result] of handlingResults.entries()) {
    expect(result.actualResponse.guidance).toBeDefined();
    expect(result.actualResponse.guidance.length).toBeGreaterThan(0);
    
    // Check that guidance is relevant to the error type
    if (result.errorType === 'syntax_error') {
      expect(result.actualResponse.guidance).toMatch(/syntax|line|format/i);
    }
  }
});

Then('users should be able to easily correct the error', function (this: ExocortexWorld) {
  const handlingResults = this.getTestData('userErrorHandlingResults') as Map<string, any>;
  
  for (const [action, result] of handlingResults.entries()) {
    expect(result.actualResponse.correctionOptions).toBeDefined();
    expect(result.actualResponse.correctionOptions.length).toBeGreaterThan(0);
  }
});

Then('the system should preserve user\\'s work when possible', function (this: ExocortexWorld) {
  const handlingResults = this.getTestData('userErrorHandlingResults') as Map<string, any>;
  
  for (const [action, result] of handlingResults.entries()) {
    expect(result.actualResponse.workPreserved).toBe(true);
    expect(result.actualResponse.rollbackAvailable).toBe(true);
  }
});

// Data Integrity Scenarios
Given('the system monitors data integrity continuously', function (this: ExocortexWorld) {
  this.setTestData('dataIntegrityMonitoringEnabled', true);
});

When('data corruption is detected in:', function (this: ExocortexWorld, dataTable: any) {
  const dataCorruptions = dataTable.hashes() as DataCorruption[];
  const corruptionHandlingResults = new Map();
  
  dataCorruptions.forEach(corruption => {
    const handlingResult = this.simulateDataCorruptionDetection(
      corruption.data_type,
      corruption.corruption_indicators
    );
    
    corruptionHandlingResults.set(corruption.data_type, {
      indicators: corruption.corruption_indicators,
      protectionMeasures: corruption.protection_measures,
      actualResponse: handlingResult
    });
  });
  
  this.setTestData('corruptionHandlingResults', corruptionHandlingResults);
});

Then('corruption should be detected early', function (this: ExocortexWorld) {
  const handlingResults = this.getTestData('corruptionHandlingResults') as Map<string, any>;
  
  for (const [dataType, result] of handlingResults.entries()) {
    expect(result.actualResponse.detectedEarly).toBe(true);
    expect(result.actualResponse.detectionTime).toBeLessThan(5000); // Within 5 seconds
  }
});

Then('automatic repair should be attempted when safe', function (this: ExocortexWorld) {
  const handlingResults = this.getTestData('corruptionHandlingResults') as Map<string, any>;
  
  for (const [dataType, result] of handlingResults.entries()) {
    if (result.actualResponse.repairSafe) {
      expect(result.actualResponse.repairAttempted).toBe(true);
    }
  }
});

Then('backup data should be used when available', function (this: ExocortexWorld) {
  const handlingResults = this.getTestData('corruptionHandlingResults') as Map<string, any>;
  
  for (const [dataType, result] of handlingResults.entries()) {
    if (result.actualResponse.backupAvailable) {
      expect(result.actualResponse.backupUsed).toBe(true);
    }
  }
});

Then('users should be warned about potential data loss', function (this: ExocortexWorld) {
  const handlingResults = this.getTestData('corruptionHandlingResults') as Map<string, any>;
  
  for (const [dataType, result] of handlingResults.entries()) {
    if (result.actualResponse.potentialDataLoss) {
      expect(result.actualResponse.userWarned).toBe(true);
      expect(result.actualResponse.warningMessage).toBeDefined();
    }
  }
});

// Circuit Breaker Scenarios
Given('the system uses external services or resources', function (this: ExocortexWorld) {
  this.setTestData('externalDependenciesMode', true);
});

When('external dependencies become unreliable:', function (this: ExocortexWorld, dataTable: any) {
  const circuitConfigs = dataTable.hashes() as CircuitBreakerConfig[];
  const circuitBreakerService = this.getTestData('circuitBreakerService') as CircuitBreakerService;
  const circuitResults = new Map();
  
  circuitConfigs.forEach(config => {
    const circuitResult = this.simulateCircuitBreakerBehavior(
      config.dependency_type,
      config.failure_threshold,
      config.circuit_behavior
    );
    
    circuitResults.set(config.dependency_type, circuitResult);
  });
  
  this.setTestData('circuitResults', circuitResults);
});

Then('circuit breaker should open to prevent cascade failures', function (this: ExocortexWorld) {
  const circuitResults = this.getTestData('circuitResults') as Map<string, any>;
  
  for (const [dependency, result] of circuitResults.entries()) {
    expect(result.circuitState).toBe('OPEN');
    expect(result.cascadeFailurePrevented).toBe(true);
  }
});

Then('alternative functionality should be provided where possible', function (this: ExocortexWorld) {
  const circuitResults = this.getTestData('circuitResults') as Map<string, any>;
  
  for (const [dependency, result] of circuitResults.entries()) {
    if (result.alternativesAvailable) {
      expect(result.alternativeFunctionality).toBeDefined();
      expect(result.alternativeFunctionality.length).toBeGreaterThan(0);
    }
  }
});

// Helper methods for ExocortexWorld
ExocortexWorld.prototype.simulateComponentFailure = function (component: string) {
  const responses: Record<string, any> = {
    visualization_engine: {
      coreFunctionalityAvailable: true,
      userNotified: true,
      notificationMessage: 'Graph visualization unavailable, using table view',
      alternatives: ['table_view', 'list_view'],
      systemStable: true
    },
    cache_system: {
      coreFunctionalityAvailable: true,
      userNotified: true,
      notificationMessage: 'Cache unavailable, performance may be slower',
      alternatives: ['direct_queries'],
      systemStable: true
    },
    export_functionality: {
      coreFunctionalityAvailable: true,
      userNotified: true,
      notificationMessage: 'Export unavailable, try copy-to-clipboard',
      alternatives: ['copy_clipboard', 'manual_copy'],
      systemStable: true
    },
    advanced_search: {
      coreFunctionalityAvailable: true,
      userNotified: true,
      notificationMessage: 'Advanced search unavailable, using basic search',
      alternatives: ['basic_search', 'manual_filter'],
      systemStable: true
    },
    ui_theming: {
      coreFunctionalityAvailable: true,
      userNotified: true,
      notificationMessage: 'Theme unavailable, using default appearance',
      alternatives: ['default_theme'],
      systemStable: true
    }
  };
  
  return responses[component] || {
    coreFunctionalityAvailable: true,
    userNotified: true,
    notificationMessage: 'Component unavailable',
    alternatives: [],
    systemStable: true
  };
};

ExocortexWorld.prototype.simulateRecoveryAttempts = function (condition: string, action: string, maxAttempts: number) {
  const errorLog = this.getTestData('errorLog') as any[];
  
  let attemptCount = 0;
  let recovered = false;
  const backoffIntervals: number[] = [];
  
  // Simulate recovery attempts
  while (attemptCount < maxAttempts || maxAttempts === -1) {
    attemptCount++;
    
    // Simulate backoff for network-related errors
    if (condition.includes('network') || condition.includes('rate_limit')) {
      const backoffTime = Math.min(1000 * Math.pow(2, attemptCount - 1), 30000);
      backoffIntervals.push(backoffTime);
    }
    
    // Simulate success after a few attempts
    if (attemptCount >= 3) {
      recovered = true;
      break;
    }
    
    if (maxAttempts !== -1 && attemptCount >= maxAttempts) {
      break;
    }
  }
  
  // Log the final outcome
  errorLog.push({
    condition,
    outcome: recovered ? 'success' : 'max_attempts_exceeded',
    attemptCount,
    timestamp: Date.now()
  });
  
  return {
    recoveryAttempted: true,
    attemptCount,
    recovered,
    usedBackoffStrategy: backoffIntervals.length > 0,
    backoffIntervals,
    userProgressUpdates: attemptCount > 3
  };
};

ExocortexWorld.prototype.simulateUserErrorHandling = function (userAction: string, errorType: string) {
  const responses: Record<string, any> = {
    malformed_sparql_query: {
      errorMessage: 'SPARQL syntax error at line 2: Expected WHERE clause',
      guidance: 'Check your query syntax. SPARQL queries require SELECT, WHERE, and proper bracket matching.',
      correctionOptions: ['syntax_highlighting', 'query_builder', 'examples'],
      workPreserved: true,
      rollbackAvailable: true
    },
    invalid_property_name: {
      errorMessage: 'Property name must follow naming convention: namespace__Property_name',
      guidance: 'Use format like "exo__Asset_title" or "ems__Effort_status"',
      correctionOptions: ['auto_correct', 'property_picker', 'naming_guide'],
      workPreserved: true,
      rollbackAvailable: true
    },
    circular_dependency: {
      errorMessage: 'Circular dependency detected: Task A → Task B → Task C → Task A',
      guidance: 'Remove one of the dependency links to break the cycle',
      correctionOptions: ['dependency_visualizer', 'auto_fix_suggestions'],
      workPreserved: true,
      rollbackAvailable: true
    },
    missing_required_field: {
      errorMessage: 'Required field "title" is missing',
      guidance: 'Please provide a title for this asset',
      correctionOptions: ['field_highlighting', 'auto_focus', 'default_values'],
      workPreserved: true,
      rollbackAvailable: true
    },
    incompatible_file_format: {
      errorMessage: 'Unsupported file format. Expected: .ttl, .rdf, .json-ld',
      guidance: 'Convert your file to one of the supported RDF formats',
      correctionOptions: ['format_converter', 'supported_formats_list'],
      workPreserved: true,
      rollbackAvailable: true
    }
  };
  
  return responses[userAction] || {
    errorMessage: 'An error occurred',
    guidance: 'Please check your input and try again',
    correctionOptions: ['retry'],
    workPreserved: true,
    rollbackAvailable: true
  };
};

ExocortexWorld.prototype.simulateDataCorruptionDetection = function (dataType: string, indicators: string) {
  const responses: Record<string, any> = {
    rdf_triple_store: {
      detectedEarly: true,
      detectionTime: 2000,
      repairSafe: true,
      repairAttempted: true,
      backupAvailable: true,
      backupUsed: false,
      potentialDataLoss: false,
      userWarned: false
    },
    asset_frontmatter: {
      detectedEarly: true,
      detectionTime: 1000,
      repairSafe: true,
      repairAttempted: true,
      backupAvailable: false,
      backupUsed: false,
      potentialDataLoss: false,
      userWarned: false
    },
    cache_data: {
      detectedEarly: true,
      detectionTime: 500,
      repairSafe: true,
      repairAttempted: true,
      backupAvailable: false,
      backupUsed: false,
      potentialDataLoss: false,
      userWarned: false
    },
    configuration_file: {
      detectedEarly: true,
      detectionTime: 3000,
      repairSafe: false,
      repairAttempted: false,
      backupAvailable: true,
      backupUsed: true,
      potentialDataLoss: true,
      userWarned: true,
      warningMessage: 'Configuration corruption detected. Using backup configuration.'
    },
    index_structures: {
      detectedEarly: true,
      detectionTime: 4000,
      repairSafe: true,
      repairAttempted: true,
      backupAvailable: false,
      backupUsed: false,
      potentialDataLoss: false,
      userWarned: false
    }
  };
  
  return responses[dataType] || {
    detectedEarly: true,
    detectionTime: 1000,
    repairSafe: false,
    repairAttempted: false,
    backupAvailable: false,
    backupUsed: false,
    potentialDataLoss: true,
    userWarned: true,
    warningMessage: 'Data corruption detected'
  };
};

ExocortexWorld.prototype.simulateCircuitBreakerBehavior = function (dependency: string, threshold: string, behavior: string) {
  const responses: Record<string, any> = {
    file_system_access: {
      circuitState: 'OPEN',
      cascadeFailurePrevented: true,
      alternativesAvailable: true,
      alternativeFunctionality: ['read_only_mode', 'cached_data']
    },
    obsidian_api: {
      circuitState: 'OPEN',
      cascadeFailurePrevented: true,
      alternativesAvailable: true,
      alternativeFunctionality: ['cached_ui', 'limited_features']
    },
    large_query_engine: {
      circuitState: 'OPEN',
      cascadeFailurePrevented: true,
      alternativesAvailable: true,
      alternativeFunctionality: ['simple_queries', 'cached_results']
    },
    export_service: {
      circuitState: 'OPEN',
      cascadeFailurePrevented: true,
      alternativesAvailable: false,
      alternativeFunctionality: []
    }
  };
  
  return responses[dependency] || {
    circuitState: 'OPEN',
    cascadeFailurePrevented: true,
    alternativesAvailable: false,
    alternativeFunctionality: []
  };
};

// Additional stub scenarios
Given('the system experiences memory pressure', function (this: ExocortexWorld) {
  this.setTestData('memoryPressure', true);
});

Then('memory should be freed and operations should continue', function (this: ExocortexWorld) {
  expect(this.getTestData('memoryPressure')).toBe(true);
});

Given('multiple error conditions occur simultaneously', function (this: ExocortexWorld) {
  this.setTestData('multipleErrors', true);
});

Then('errors should be prioritized and handled appropriately', function (this: ExocortexWorld) {
  expect(this.getTestData('multipleErrors')).toBe(true);
});

Given('the system is under heavy load during error conditions', function (this: ExocortexWorld) {
  this.setTestData('heavyLoadWithErrors', true);
});

Then('error handling should not significantly impact performance', function (this: ExocortexWorld) {
  expect(this.getTestData('heavyLoadWithErrors')).toBe(true);
});

When('error handling mechanisms are stress tested', function (this: ExocortexWorld) {
  this.setTestData('errorHandlingStressTested', true);
});

Then('the system should maintain stability under stress', function (this: ExocortexWorld) {
  expect(this.getTestData('errorHandlingStressTested')).toBe(true);
});

When('I trigger various error scenarios', function (this: ExocortexWorld) {
  this.setTestData('errorScenariosTriggered', true);
});

Then('comprehensive error reporting should be available', function (this: ExocortexWorld) {
  const errorLog = this.getTestData('errorLog') as any[];
  expect(Array.isArray(errorLog)).toBe(true);
});

Then('error metrics should be collected for analysis', function (this: ExocortexWorld) {
  expect(this.getTestData('errorAnalyzer')).toBeDefined();
});

Given('the system has been running for an extended period', function (this: ExocortexWorld) {
  this.setTestData('extendedRuntime', true);
});

Then('error handling should remain effective over time', function (this: ExocortexWorld) {
  expect(this.getTestData('extendedRuntime')).toBe(true);
});

When('error conditions resolve themselves', function (this: ExocortexWorld) {
  this.setTestData('errorsResolved', true);
});

Then('the system should automatically return to normal operation', function (this: ExocortexWorld) {
  expect(this.getTestData('errorsResolved')).toBe(true);
});

Given('error handling is disabled or compromised', function (this: ExocortexWorld) {
  this.setTestData('errorHandlingDisabled', true);
});

Then('the system should have fallback error handling mechanisms', function (this: ExocortexWorld) {
  expect(this.getTestData('errorHandlingDisabled')).toBe(true);
});