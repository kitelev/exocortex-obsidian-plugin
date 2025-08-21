import { ExocortexSettings, DEFAULT_SETTINGS } from '../../../../src/domain/entities/ExocortexSettings';

describe('ExocortexSettings', () => {
    describe('create', () => {
        it('should create settings with defaults', () => {
            const result = ExocortexSettings.create();
            
            expect(result.isSuccess).toBe(true);
            const settings = result.getValue()!;
            expect(settings.get('layoutsFolderPath')).toBe('layouts');
            expect(settings.get('preferredQueryEngine')).toBe('dataview');
            expect(settings.get('enableSPARQLCache')).toBe(true);
        });

        it('should create settings with partial data', () => {
            const result = ExocortexSettings.create({
                layoutsFolderPath: 'custom-layouts',
                enableSPARQLCache: false
            });
            
            expect(result.isSuccess).toBe(true);
            const settings = result.getValue()!;
            expect(settings.get('layoutsFolderPath')).toBe('custom-layouts');
            expect(settings.get('enableSPARQLCache')).toBe(false);
            // Should still have defaults for other values
            expect(settings.get('preferredQueryEngine')).toBe('dataview');
        });

        it('should fail with invalid data', () => {
            const result = ExocortexSettings.create({
                layoutsFolderPath: '',
                sparqlCacheMaxSize: -1
            });
            
            expect(result.isFailure).toBe(true);
            expect(result.getError()).toContain('cannot be empty');
        });
    });

    describe('validate', () => {
        it('should validate valid settings', () => {
            const settings = new ExocortexSettings();
            const result = settings.validate();
            
            expect(result.isSuccess).toBe(true);
        });

        it('should fail validation with invalid cache size', () => {
            const settings = new ExocortexSettings({
                sparqlCacheMaxSize: 0
            });
            const result = settings.validate();
            
            expect(result.isFailure).toBe(true);
            expect(result.getError()).toContain('must be at least 1');
        });

        it('should fail validation with invalid batch size', () => {
            const settings = new ExocortexSettings({
                batchProcessingSize: 0
            });
            const result = settings.validate();
            
            expect(result.isFailure).toBe(true);
            expect(result.getError()).toContain('must be at least 1');
        });
    });

    describe('update', () => {
        it('should update settings with valid data', () => {
            const settings = new ExocortexSettings();
            const result = settings.update({
                layoutsFolderPath: 'new-layouts',
                enableDebugMode: true
            });
            
            expect(result.isSuccess).toBe(true);
            expect(settings.get('layoutsFolderPath')).toBe('new-layouts');
            expect(settings.get('enableDebugMode')).toBe(true);
        });

        it('should fail update with invalid data', () => {
            const settings = new ExocortexSettings();
            const result = settings.update({
                sparqlCacheMaxSize: -5
            });
            
            expect(result.isFailure).toBe(true);
            expect(result.getError()).toContain('must be at least 1');
        });
    });

    describe('set and get', () => {
        it('should set and get individual values', () => {
            const settings = new ExocortexSettings();
            
            const result = settings.set('enableDebugMode', true);
            expect(result.isSuccess).toBe(true);
            expect(settings.get('enableDebugMode')).toBe(true);
        });

        it('should fail set with invalid value', () => {
            const settings = new ExocortexSettings();
            
            const result = settings.set('sparqlCacheMaxSize', -1);
            expect(result.isFailure).toBe(true);
        });
    });

    describe('JSON serialization', () => {
        it('should convert to JSON', () => {
            const settings = new ExocortexSettings({
                enableDebugMode: true,
                layoutsFolderPath: 'test-layouts'
            });
            
            const json = settings.toJSON();
            expect(json.enableDebugMode).toBe(true);
            expect(json.layoutsFolderPath).toBe('test-layouts');
            expect(json.preferredQueryEngine).toBe('dataview'); // Should have defaults
        });

        it('should create from JSON string', () => {
            const jsonStr = JSON.stringify({
                enableDebugMode: true,
                layoutsFolderPath: 'test-layouts'
            });
            
            const result = ExocortexSettings.fromJSON(jsonStr);
            expect(result.isSuccess).toBe(true);
            
            const settings = result.getValue()!;
            expect(settings.get('enableDebugMode')).toBe(true);
            expect(settings.get('layoutsFolderPath')).toBe('test-layouts');
        });

        it('should fail with invalid JSON', () => {
            const result = ExocortexSettings.fromJSON('invalid json');
            expect(result.isFailure).toBe(true);
            expect(result.getError()).toContain('Failed to parse');
        });
    });

    describe('resetToDefaults', () => {
        it('should reset all settings to defaults', () => {
            const settings = new ExocortexSettings({
                enableDebugMode: true,
                layoutsFolderPath: 'custom-layouts',
                sparqlCacheMaxSize: 1000
            });
            
            settings.resetToDefaults();
            
            expect(settings.get('enableDebugMode')).toBe(DEFAULT_SETTINGS.enableDebugMode);
            expect(settings.get('layoutsFolderPath')).toBe(DEFAULT_SETTINGS.layoutsFolderPath);
            expect(settings.get('sparqlCacheMaxSize')).toBe(DEFAULT_SETTINGS.sparqlCacheMaxSize);
        });
    });

    describe('getData', () => {
        it('should return a copy of all settings data', () => {
            const settings = new ExocortexSettings({
                enableDebugMode: true
            });
            
            const data = settings.getData();
            
            expect(data.enableDebugMode).toBe(true);
            expect(data.layoutsFolderPath).toBe('layouts');
            
            // Should be a copy - modifying should not affect original
            data.enableDebugMode = false;
            expect(settings.get('enableDebugMode')).toBe(true);
        });
    });
});