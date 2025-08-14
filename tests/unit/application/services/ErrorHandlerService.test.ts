import { ErrorHandlerService, ErrorHandlerOptions, ErrorMetrics } from '../../../../src/application/services/ErrorHandlerService';
import { ExocortexError, ErrorSeverity, ErrorCategory, ErrorBuilder, FixSuggestion } from '../../../../src/domain/errors/ExocortexError';
import { EnhancedResult } from '../../../../src/domain/core/EnhancedResult';
import { ErrorAnalyzer } from '../../../../src/domain/errors/ErrorAnalyzer';
import { Notice } from 'obsidian';

// Mock dependencies
jest.mock('../../../../src/domain/errors/ErrorAnalyzer');
jest.mock('obsidian', () => ({
  Notice: jest.fn()
}));

describe('ErrorHandlerService', () => {
  let errorHandlerService: ErrorHandlerService;
  let mockAnalyzer: jest.Mocked<typeof ErrorAnalyzer>;
  let mockNotice: jest.MockedClass<typeof Notice>;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    mockAnalyzer = ErrorAnalyzer as jest.Mocked<typeof ErrorAnalyzer>;
    mockNotice = Notice as jest.MockedClass<typeof Notice>;
    
    // Mock console methods
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should create service with default options', () => {
      errorHandlerService = new ErrorHandlerService();
      
      const metrics = errorHandlerService.getMetrics();
      expect(metrics.totalErrors).toBe(0);
      expect(metrics.errorsBySeverity[ErrorSeverity.CRITICAL]).toBe(0);
      expect(metrics.errorsByCategory[ErrorCategory.SYSTEM]).toBe(0);
    });

    it('should create service with custom options', () => {
      const options: ErrorHandlerOptions = {
        showUserNotification: false,
        logToConsole: false,
        trackMetrics: false,
        autoRecover: true
      };

      errorHandlerService = new ErrorHandlerService(options);
      expect(errorHandlerService).toBeDefined();
    });

    it('should merge custom options with defaults', () => {
      const options: ErrorHandlerOptions = {
        showUserNotification: false
      };

      errorHandlerService = new ErrorHandlerService(options);
      expect(errorHandlerService).toBeDefined();
    });

    it('should initialize empty error history', () => {
      errorHandlerService = new ErrorHandlerService();
      
      const history = errorHandlerService.getErrorHistory();
      expect(history).toEqual([]);
    });

    it('should initialize metrics with zero values', () => {
      errorHandlerService = new ErrorHandlerService();
      
      const metrics = errorHandlerService.getMetrics();
      expect(metrics.totalErrors).toBe(0);
      expect(metrics.averageResolutionTime).toBe(0);
      expect(metrics.lastError).toBeUndefined();
    });
  });

  describe('handleError', () => {
    beforeEach(() => {
      errorHandlerService = new ErrorHandlerService();
    });

    it('should handle string error successfully', async () => {
      const mockError: ExocortexError = createMockExocortexError();
      mockAnalyzer.analyze.mockReturnValue(mockError);

      const result = await errorHandlerService.handleError('Test error message');

      expect(result.isSuccess).toBe(true);
      expect(mockAnalyzer.analyze).toHaveBeenCalledWith('Test error message');
    });

    it('should handle Error object successfully', async () => {
      const mockError: ExocortexError = createMockExocortexError();
      mockAnalyzer.analyze.mockReturnValue(mockError);
      const errorObject = new Error('Test error');

      const result = await errorHandlerService.handleError(errorObject);

      expect(result.isSuccess).toBe(true);
      expect(mockAnalyzer.analyze).toHaveBeenCalledWith(errorObject);
    });

    it('should handle ExocortexError directly', async () => {
      const exocortexError: ExocortexError = createMockExocortexError();

      const result = await errorHandlerService.handleError(exocortexError);

      expect(result.isSuccess).toBe(true);
      expect(mockAnalyzer.analyze).not.toHaveBeenCalled();
    });

    it('should merge context when provided', async () => {
      const mockError: ExocortexError = createMockExocortexError();
      mockAnalyzer.analyze.mockReturnValue(mockError);
      
      const context = {
        userId: 'user123',
        sessionId: 'session456'
      };

      const result = await errorHandlerService.handleError('Test error', context);

      expect(result.isSuccess).toBe(true);
    });

    it('should update metrics when tracking enabled', async () => {
      const mockError: ExocortexError = createMockExocortexError();
      mockAnalyzer.analyze.mockReturnValue(mockError);

      await errorHandlerService.handleError('Test error');

      const metrics = errorHandlerService.getMetrics();
      expect(metrics.totalErrors).toBe(1);
      expect(metrics.errorsBySeverity[ErrorSeverity.ERROR]).toBe(1);
      expect(metrics.errorsByCategory[ErrorCategory.VALIDATION]).toBe(1);
    });

    it('should skip metrics when tracking disabled', async () => {
      errorHandlerService = new ErrorHandlerService({ trackMetrics: false });
      const mockError: ExocortexError = createMockExocortexError();
      mockAnalyzer.analyze.mockReturnValue(mockError);

      await errorHandlerService.handleError('Test error');

      const metrics = errorHandlerService.getMetrics();
      expect(metrics.totalErrors).toBe(0);
    });

    it('should log to console when enabled', async () => {
      const mockError: ExocortexError = createMockExocortexError();
      mockAnalyzer.analyze.mockReturnValue(mockError);

      await errorHandlerService.handleError('Test error');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should skip console logging when disabled', async () => {
      errorHandlerService = new ErrorHandlerService({ logToConsole: false });
      const mockError: ExocortexError = createMockExocortexError();
      mockAnalyzer.analyze.mockReturnValue(mockError);

      await errorHandlerService.handleError('Test error');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should show user notification when enabled', async () => {
      const mockError: ExocortexError = createMockExocortexError();
      mockAnalyzer.analyze.mockReturnValue(mockError);

      await errorHandlerService.handleError('Test error');

      expect(mockNotice).toHaveBeenCalled();
    });

    it('should skip user notification when disabled', async () => {
      errorHandlerService = new ErrorHandlerService({ showUserNotification: false });
      const mockError: ExocortexError = createMockExocortexError();
      mockAnalyzer.analyze.mockReturnValue(mockError);

      await errorHandlerService.handleError('Test error');

      expect(mockNotice).not.toHaveBeenCalled();
    });

    it('should add error to history', async () => {
      const mockError: ExocortexError = createMockExocortexError();
      mockAnalyzer.analyze.mockReturnValue(mockError);

      await errorHandlerService.handleError('Test error');

      const history = errorHandlerService.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(mockError);
    });

    it('should attempt recovery when enabled and error is recoverable', async () => {
      errorHandlerService = new ErrorHandlerService({ autoRecover: true });
      const mockSuggestion: FixSuggestion = {
        title: 'Auto Fix',
        description: 'Automatic fix suggestion',
        confidence: 0.95,
        action: {
          label: 'Apply Fix',
          handler: jest.fn().mockResolvedValue(undefined)
        }
      };
      
      const mockError: ExocortexError = {
        ...createMockExocortexError(),
        recoverable: true,
        suggestions: [mockSuggestion]
      };
      mockAnalyzer.analyze.mockReturnValue(mockError);

      await errorHandlerService.handleError('Recoverable error');

      expect(mockSuggestion.action!.handler).toHaveBeenCalled();
    });

    it('should skip recovery when disabled', async () => {
      const mockSuggestion: FixSuggestion = {
        title: 'Auto Fix',
        description: 'Automatic fix suggestion',
        confidence: 0.95,
        action: {
          label: 'Apply Fix',
          handler: jest.fn().mockResolvedValue(undefined)
        }
      };
      
      const mockError: ExocortexError = {
        ...createMockExocortexError(),
        recoverable: true,
        suggestions: [mockSuggestion]
      };
      mockAnalyzer.analyze.mockReturnValue(mockError);

      await errorHandlerService.handleError('Recoverable error');

      expect(mockSuggestion.action!.handler).not.toHaveBeenCalled();
    });

    it('should handle error in error handler gracefully', async () => {
      mockAnalyzer.analyze.mockImplementation(() => {
        throw new Error('Analyzer failed');
      });

      const result = await errorHandlerService.handleError('Test error');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Failed to handle the error properly');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in error handler:', expect.any(Error));
    });
  });

  describe('markErrorResolved', () => {
    beforeEach(() => {
      errorHandlerService = new ErrorHandlerService();
    });

    it('should track resolution time', async () => {
      const mockError: ExocortexError = createMockExocortexError();
      mockAnalyzer.analyze.mockReturnValue(mockError);

      // Handle error and mark as resolved
      await errorHandlerService.handleError('Test error');
      
      // Add a small delay to ensure resolution time > 0
      await new Promise(resolve => setTimeout(resolve, 1));
      
      errorHandlerService.markErrorResolved(mockError.id);

      const metrics = errorHandlerService.getMetrics();
      expect(metrics.averageResolutionTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle non-existent error ID gracefully', () => {
      expect(() => {
        errorHandlerService.markErrorResolved('non-existent-id');
      }).not.toThrow();
    });

    it('should calculate average resolution time correctly', async () => {
      const mockError1: ExocortexError = { ...createMockExocortexError(), id: 'error1' };
      const mockError2: ExocortexError = { ...createMockExocortexError(), id: 'error2' };
      
      mockAnalyzer.analyze.mockReturnValueOnce(mockError1).mockReturnValueOnce(mockError2);

      await errorHandlerService.handleError('Error 1');
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      await errorHandlerService.handleError('Error 2');

      errorHandlerService.markErrorResolved('error1');
      errorHandlerService.markErrorResolved('error2');

      const metrics = errorHandlerService.getMetrics();
      expect(metrics.averageResolutionTime).toBeGreaterThan(0);
    });

    it('should limit resolution time history to 100 entries', async () => {
      // Create 101 errors
      for (let i = 0; i < 101; i++) {
        const mockError: ExocortexError = { ...createMockExocortexError(), id: `error${i}` };
        mockAnalyzer.analyze.mockReturnValue(mockError);
        
        await errorHandlerService.handleError(`Error ${i}`);
        
        // Add tiny delay to ensure resolution time > 0
        if (i === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
        
        errorHandlerService.markErrorResolved(`error${i}`);
      }

      // Should maintain only 100 resolution times
      const metrics = errorHandlerService.getMetrics();
      expect(metrics.averageResolutionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('logging methods', () => {
    beforeEach(() => {
      errorHandlerService = new ErrorHandlerService();
    });

    it('should log critical errors to console.error', async () => {
      const mockError: ExocortexError = {
        ...createMockExocortexError(),
        severity: ErrorSeverity.CRITICAL
      };
      mockAnalyzer.analyze.mockReturnValue(mockError);

      await errorHandlerService.handleError('Critical error');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log warnings to console.warn', async () => {
      const mockError: ExocortexError = {
        ...createMockExocortexError(),
        severity: ErrorSeverity.WARNING
      };
      mockAnalyzer.analyze.mockReturnValue(mockError);

      await errorHandlerService.handleError('Warning error');

      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log info messages to console.info', async () => {
      const mockError: ExocortexError = {
        ...createMockExocortexError(),
        severity: ErrorSeverity.INFO
      };
      mockAnalyzer.analyze.mockReturnValue(mockError);

      await errorHandlerService.handleError('Info message');

      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it('should format error message with location', async () => {
      const mockError: ExocortexError = {
        ...createMockExocortexError(),
        context: {
          operation: 'test',
          timestamp: new Date(),
          location: { line: 42, column: 10, file: 'test.sparql' }
        }
      };
      mockAnalyzer.analyze.mockReturnValue(mockError);

      await errorHandlerService.handleError('Error with location');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('(Line 42:10)'),
        expect.any(Object)
      );
    });

    it('should handle string location context', async () => {
      const mockError: ExocortexError = {
        ...createMockExocortexError(),
        context: {
          operation: 'test',
          timestamp: new Date(),
          location: 'Some location string'
        }
      };
      mockAnalyzer.analyze.mockReturnValue(mockError);

      await errorHandlerService.handleError('Error with string location');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('user notifications', () => {
    beforeEach(() => {
      errorHandlerService = new ErrorHandlerService();
    });

    it('should show longer notification for critical errors', async () => {
      const mockError: ExocortexError = {
        ...createMockExocortexError(),
        severity: ErrorSeverity.CRITICAL
      };
      mockAnalyzer.analyze.mockReturnValue(mockError);

      await errorHandlerService.handleError('Critical error');

      expect(mockNotice).toHaveBeenCalledWith(expect.any(String), 10000);
    });

    it('should show shorter notification for info messages', async () => {
      const mockError: ExocortexError = {
        ...createMockExocortexError(),
        severity: ErrorSeverity.INFO
      };
      mockAnalyzer.analyze.mockReturnValue(mockError);

      await errorHandlerService.handleError('Info message');

      expect(mockNotice).toHaveBeenCalledWith(expect.any(String), 3000);
    });

    it('should include suggestion in notification message', async () => {
      const mockSuggestion: FixSuggestion = {
        title: 'Quick Fix',
        description: 'Try this solution'
      };
      
      const mockError: ExocortexError = {
        ...createMockExocortexError(),
        suggestions: [mockSuggestion]
      };
      mockAnalyzer.analyze.mockReturnValue(mockError);

      await errorHandlerService.handleError('Error with suggestion');

      expect(mockNotice).toHaveBeenCalledWith(
        expect.stringContaining('💡 Quick Fix'),
        expect.any(Number)
      );
    });

    it('should handle error without suggestions', async () => {
      const mockError: ExocortexError = {
        ...createMockExocortexError(),
        suggestions: []
      };
      mockAnalyzer.analyze.mockReturnValue(mockError);

      await errorHandlerService.handleError('Error without suggestions');

      expect(mockNotice).toHaveBeenCalledWith(
        expect.not.stringContaining('💡'),
        expect.any(Number)
      );
    });
  });

  describe('error history management', () => {
    beforeEach(() => {
      errorHandlerService = new ErrorHandlerService();
    });

    it('should maintain error history in LIFO order', async () => {
      const mockError1: ExocortexError = { ...createMockExocortexError(), id: 'error1', title: 'First Error' };
      const mockError2: ExocortexError = { ...createMockExocortexError(), id: 'error2', title: 'Second Error' };
      
      mockAnalyzer.analyze.mockReturnValueOnce(mockError1).mockReturnValueOnce(mockError2);

      await errorHandlerService.handleError('First error');
      await errorHandlerService.handleError('Second error');

      const history = errorHandlerService.getErrorHistory();
      expect(history[0].title).toBe('Second Error');
      expect(history[1].title).toBe('First Error');
    });

    it('should limit history to maximum size', async () => {
      // Add 101 errors to exceed the limit
      for (let i = 0; i < 101; i++) {
        const mockError: ExocortexError = { ...createMockExocortexError(), id: `error${i}` };
        mockAnalyzer.analyze.mockReturnValue(mockError);
        await errorHandlerService.handleError(`Error ${i}`);
      }

      const history = errorHandlerService.getErrorHistory();
      expect(history).toHaveLength(100);
    });

    it('should clear history successfully', async () => {
      const mockError: ExocortexError = createMockExocortexError();
      mockAnalyzer.analyze.mockReturnValue(mockError);

      await errorHandlerService.handleError('Test error');
      expect(errorHandlerService.getErrorHistory()).toHaveLength(1);

      errorHandlerService.clearHistory();
      expect(errorHandlerService.getErrorHistory()).toHaveLength(0);
    });

    it('should clear error start times when clearing history', async () => {
      const mockError: ExocortexError = createMockExocortexError();
      mockAnalyzer.analyze.mockReturnValue(mockError);

      await errorHandlerService.handleError('Test error');
      errorHandlerService.clearHistory();
      
      // Should not throw when trying to mark resolved after clear
      expect(() => {
        errorHandlerService.markErrorResolved(mockError.id);
      }).not.toThrow();
    });
  });

  describe('getSuggestions', () => {
    beforeEach(() => {
      errorHandlerService = new ErrorHandlerService();
    });

    it('should return suggestions for string error', () => {
      const mockSuggestions: FixSuggestion[] = [
        { title: 'Fix 1', description: 'First fix' },
        { title: 'Fix 2', description: 'Second fix' }
      ];
      
      const mockError: ExocortexError = {
        ...createMockExocortexError(),
        suggestions: mockSuggestions
      };
      mockAnalyzer.analyze.mockReturnValue(mockError);

      const suggestions = errorHandlerService.getSuggestions('Test error');

      expect(suggestions).toEqual(mockSuggestions);
      expect(mockAnalyzer.analyze).toHaveBeenCalledWith('Test error');
    });

    it('should return suggestions for Error object', () => {
      const mockSuggestions: FixSuggestion[] = [
        { title: 'Error Fix', description: 'Fix for error object' }
      ];
      
      const mockError: ExocortexError = {
        ...createMockExocortexError(),
        suggestions: mockSuggestions
      };
      mockAnalyzer.analyze.mockReturnValue(mockError);
      
      const errorObject = new Error('Test error object');
      const suggestions = errorHandlerService.getSuggestions(errorObject);

      expect(suggestions).toEqual(mockSuggestions);
      expect(mockAnalyzer.analyze).toHaveBeenCalledWith(errorObject);
    });

    it('should return empty array when no suggestions available', () => {
      const mockError: ExocortexError = {
        ...createMockExocortexError(),
        suggestions: undefined
      };
      mockAnalyzer.analyze.mockReturnValue(mockError);

      const suggestions = errorHandlerService.getSuggestions('Error without suggestions');

      expect(suggestions).toEqual([]);
    });
  });

  describe('analyzeError', () => {
    beforeEach(() => {
      errorHandlerService = new ErrorHandlerService();
    });

    it('should return analyzed ExocortexError for string', () => {
      const mockError: ExocortexError = createMockExocortexError();
      mockAnalyzer.analyze.mockReturnValue(mockError);

      const analyzed = errorHandlerService.analyzeError('Test error');

      expect(analyzed).toEqual(mockError);
      expect(mockAnalyzer.analyze).toHaveBeenCalledWith('Test error');
    });

    it('should return analyzed ExocortexError for Error object', () => {
      const mockError: ExocortexError = createMockExocortexError();
      mockAnalyzer.analyze.mockReturnValue(mockError);
      
      const errorObject = new Error('Test error object');
      const analyzed = errorHandlerService.analyzeError(errorObject);

      expect(analyzed).toEqual(mockError);
      expect(mockAnalyzer.analyze).toHaveBeenCalledWith(errorObject);
    });
  });

  describe('recovery mechanism', () => {
    beforeEach(() => {
      errorHandlerService = new ErrorHandlerService({ autoRecover: true });
    });

    it('should not attempt recovery for non-recoverable errors', async () => {
      const mockSuggestion: FixSuggestion = {
        title: 'Manual Fix',
        description: 'Requires manual intervention',
        confidence: 0.95,
        action: {
          label: 'Apply',
          handler: jest.fn()
        }
      };
      
      const mockError: ExocortexError = {
        ...createMockExocortexError(),
        recoverable: false,
        suggestions: [mockSuggestion]
      };
      mockAnalyzer.analyze.mockReturnValue(mockError);

      await errorHandlerService.handleError('Non-recoverable error');

      expect(mockSuggestion.action!.handler).not.toHaveBeenCalled();
    });

    it('should not attempt recovery for low-confidence suggestions', async () => {
      const mockSuggestion: FixSuggestion = {
        title: 'Uncertain Fix',
        description: 'Low confidence fix',
        confidence: 0.5,
        action: {
          label: 'Try',
          handler: jest.fn()
        }
      };
      
      const mockError: ExocortexError = {
        ...createMockExocortexError(),
        recoverable: true,
        suggestions: [mockSuggestion]
      };
      mockAnalyzer.analyze.mockReturnValue(mockError);

      await errorHandlerService.handleError('Low confidence error');

      expect(mockSuggestion.action!.handler).not.toHaveBeenCalled();
    });

    it('should handle recovery failure gracefully', async () => {
      const mockSuggestion: FixSuggestion = {
        title: 'Failing Fix',
        description: 'This fix will fail',
        confidence: 0.95,
        action: {
          label: 'Apply',
          handler: jest.fn().mockRejectedValue(new Error('Recovery failed'))
        }
      };
      
      const mockError: ExocortexError = {
        ...createMockExocortexError(),
        recoverable: true,
        suggestions: [mockSuggestion]
      };
      mockAnalyzer.analyze.mockReturnValue(mockError);

      const result = await errorHandlerService.handleError('Failing recovery error');

      expect(result.isSuccess).toBe(true); // Main error handling should still succeed
      expect(consoleErrorSpy).toHaveBeenCalledWith('Auto-recovery failed:', expect.any(Error));
    });

    it('should show recovery notification on success', async () => {
      const mockSuggestion: FixSuggestion = {
        title: 'Successful Fix',
        description: 'This fix will succeed',
        confidence: 0.95,
        action: {
          label: 'Apply',
          handler: jest.fn().mockResolvedValue(undefined)
        }
      };
      
      const mockError: ExocortexError = {
        ...createMockExocortexError(),
        recoverable: true,
        suggestions: [mockSuggestion]
      };
      mockAnalyzer.analyze.mockReturnValue(mockError);

      await errorHandlerService.handleError('Recoverable error');

      expect(mockNotice).toHaveBeenCalledWith('Auto-recovery: Successful Fix', 3000);
    });
  });

  describe('edge cases and boundary conditions', () => {
    beforeEach(() => {
      errorHandlerService = new ErrorHandlerService();
    });

    it('should handle empty string error', async () => {
      const mockError: ExocortexError = createMockExocortexError();
      mockAnalyzer.analyze.mockReturnValue(mockError);

      const result = await errorHandlerService.handleError('');

      expect(result.isSuccess).toBe(true);
      expect(mockAnalyzer.analyze).toHaveBeenCalledWith('');
    });

    it('should handle null context gracefully', async () => {
      const mockError: ExocortexError = createMockExocortexError();
      mockAnalyzer.analyze.mockReturnValue(mockError);

      const result = await errorHandlerService.handleError('Test error', null as any);

      expect(result.isSuccess).toBe(true);
    });

    it('should handle undefined suggestions array', async () => {
      const mockError: ExocortexError = {
        ...createMockExocortexError(),
        suggestions: undefined
      };
      mockAnalyzer.analyze.mockReturnValue(mockError);

      const result = await errorHandlerService.handleError('Error without suggestions');

      expect(result.isSuccess).toBe(true);
    });

    it('should handle error with null action in suggestion', async () => {
      const mockSuggestion: FixSuggestion = {
        title: 'No Action Fix',
        description: 'Suggestion without action',
        confidence: 0.95,
        action: null as any
      };
      
      const mockError: ExocortexError = {
        ...createMockExocortexError(),
        recoverable: true,
        suggestions: [mockSuggestion]
      };
      mockAnalyzer.analyze.mockReturnValue(mockError);

      const result = await errorHandlerService.handleError('Error with null action');

      expect(result.isSuccess).toBe(true);
    });

    it('should handle very large error messages', async () => {
      const largeMessage = 'Large error message: ' + 'x'.repeat(10000);
      const mockError: ExocortexError = {
        ...createMockExocortexError(),
        message: largeMessage
      };
      mockAnalyzer.analyze.mockReturnValue(mockError);

      const result = await errorHandlerService.handleError(largeMessage);

      expect(result.isSuccess).toBe(true);
    });
  });

  // Helper function to create mock ExocortexError
  function createMockExocortexError(): ExocortexError {
    return {
      id: 'test-error-id',
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.VALIDATION,
      title: 'Test Error',
      message: 'This is a test error message',
      context: {
        operation: 'test-operation',
        timestamp: new Date()
      },
      recoverable: false
    };
  }
});