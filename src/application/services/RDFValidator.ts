import { Result } from '../../domain/core/Result';
import { Graph } from '../../domain/semantic/core/Graph';
import { Triple, IRI, BlankNode, Literal } from '../../domain/semantic/core/Triple';
import { RDFFormat } from './RDFSerializer';

export interface ValidationError {
    type: 'error' | 'warning';
    message: string;
    triple?: Triple;
    location?: { line?: number; column?: number };
}

export interface ValidationOptions {
    strictMode?: boolean;
    checkDuplicates?: boolean;
    checkNamespaces?: boolean;
    checkLiterals?: boolean;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
    stats: {
        tripleCount: number;
        duplicateCount: number;
        invalidIRICount: number;
        invalidLiteralCount: number;
    };
}

export class RDFValidator {
    constructor() {}

    validateGraph(graph: Graph, options: ValidationOptions = {}): Result<ValidationResult> {
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];
        const stats = {
            tripleCount: 0,
            duplicateCount: 0,
            invalidIRICount: 0,
            invalidLiteralCount: 0
        };

        try {
            const triples = graph.toArray();
            stats.tripleCount = triples.length;

            const seenTriples = new Set<string>();

            for (const triple of triples) {
                const validationErrors = this.validateTriple(triple, options);
                errors.push(...validationErrors.filter(e => e.type === 'error'));
                warnings.push(...validationErrors.filter(e => e.type === 'warning'));

                if (validationErrors.some(e => e.message.includes('Invalid IRI'))) {
                    stats.invalidIRICount++;
                }
                if (validationErrors.some(e => e.message.includes('Invalid literal'))) {
                    stats.invalidLiteralCount++;
                }

                if (options.checkDuplicates) {
                    const tripleKey = this.getTripleKey(triple);
                    if (seenTriples.has(tripleKey)) {
                        stats.duplicateCount++;
                        warnings.push({
                            type: 'warning',
                            message: 'Duplicate triple detected',
                            triple
                        });
                    } else {
                        seenTriples.add(tripleKey);
                    }
                }
            }

            const result: ValidationResult = {
                isValid: errors.length === 0,
                errors,
                warnings,
                stats
            };

            return Result.ok(result);
        } catch (error) {
            return Result.fail(`Validation failed: ${error.message}`);
        }
    }

    validateTriple(triple: Triple, options: ValidationOptions = {}): ValidationError[] {
        const errors: ValidationError[] = [];

        const subject = triple.getSubject();
        const predicate = triple.getPredicate();
        const object = triple.getObject();

        if (!subject || !predicate || !object) {
            errors.push({
                type: 'error',
                message: 'Triple is missing required components',
                triple
            });
            return errors;
        }

        if (subject instanceof IRI) {
            const iriErrors = this.validateIRI(subject.toString());
            if (iriErrors.length > 0) {
                errors.push({
                    type: options.strictMode ? 'error' : 'warning',
                    message: `Invalid IRI in subject: ${iriErrors.join(', ')}`,
                    triple
                });
            }
        }

        if (predicate instanceof IRI) {
            const iriErrors = this.validateIRI(predicate.toString());
            if (iriErrors.length > 0) {
                errors.push({
                    type: 'error',
                    message: `Invalid IRI in predicate: ${iriErrors.join(', ')}`,
                    triple
                });
            }
        }

        if (object instanceof IRI) {
            const iriErrors = this.validateIRI(object.toString());
            if (iriErrors.length > 0) {
                errors.push({
                    type: options.strictMode ? 'error' : 'warning',
                    message: `Invalid IRI in object: ${iriErrors.join(', ')}`,
                    triple
                });
            }
        }

        if (options.checkLiterals && object instanceof Literal) {
            const literalErrors = this.validateLiteral(object);
            errors.push(...literalErrors);
        }

        return errors;
    }

    validateIRI(iri: string): string[] {
        const errors: string[] = [];

        if (!iri || iri.trim() === '') {
            errors.push('IRI cannot be empty');
            return errors;
        }

        if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(iri)) {
            errors.push('IRI must start with a valid scheme');
        }

        const invalidChars = /[\s<>"{}|\\^`]/;
        if (invalidChars.test(iri)) {
            errors.push('IRI contains invalid characters');
        }

        if (iri.length > 2048) {
            errors.push('IRI exceeds maximum length');
        }

        return errors;
    }

    validateLiteral(literal: Literal): ValidationError[] {
        const errors: ValidationError[] = [];

        const datatype = literal.getDatatype();
        const language = literal.getLanguage();
        const value = literal.getValue();

        if (datatype) {
            const datatypeErrors = this.validateIRI(datatype.toString());
            if (datatypeErrors.length > 0) {
                errors.push({
                    type: 'warning',
                    message: `Invalid datatype IRI: ${datatypeErrors.join(', ')}`
                });
            }

            const isValid = this.validateLiteralValue(value, datatype.toString());
            if (!isValid) {
                errors.push({
                    type: 'warning',
                    message: `Literal value does not match declared datatype ${datatype.toString()}`
                });
            }
        }

        if (language) {
            if (!/^[a-z]{2,3}(-[A-Z]{2})?$/.test(language)) {
                errors.push({
                    type: 'warning',
                    message: `Invalid language tag: ${language}`
                });
            }
        }

        return errors;
    }

    private validateLiteralValue(value: string, datatypeIRI: string): boolean {
        const xsdNamespace = 'http://www.w3.org/2001/XMLSchema#';
        
        if (datatypeIRI === `${xsdNamespace}integer`) {
            return /^-?\d+$/.test(value);
        }
        if (datatypeIRI === `${xsdNamespace}decimal`) {
            return /^-?\d+(\.\d+)?$/.test(value);
        }
        if (datatypeIRI === `${xsdNamespace}boolean`) {
            return value === 'true' || value === 'false';
        }
        if (datatypeIRI === `${xsdNamespace}dateTime`) {
            return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
        }
        if (datatypeIRI === `${xsdNamespace}date`) {
            return /^\d{4}-\d{2}-\d{2}$/.test(value);
        }
        
        return true;
    }

    validateExportOptions(options: any): Result<void> {
        if (!options.format) {
            return Result.fail('Export format is required');
        }

        const validFormats: RDFFormat[] = ['turtle', 'n-triples', 'json-ld', 'rdf-xml'];
        if (!validFormats.includes(options.format)) {
            return Result.fail(`Invalid export format: ${options.format}`);
        }

        if (options.targetFolder && typeof options.targetFolder !== 'string') {
            return Result.fail('Target folder must be a string');
        }

        if (options.fileName && typeof options.fileName !== 'string') {
            return Result.fail('File name must be a string');
        }

        return Result.ok();
    }

    validateImportOptions(options: any): Result<void> {
        if (!options.mergeMode) {
            return Result.fail('Merge mode is required');
        }

        if (options.mergeMode !== 'merge' && options.mergeMode !== 'replace') {
            return Result.fail(`Invalid merge mode: ${options.mergeMode}`);
        }

        if (options.format) {
            const validFormats: RDFFormat[] = ['turtle', 'n-triples', 'json-ld', 'rdf-xml'];
            if (!validFormats.includes(options.format)) {
                return Result.fail(`Invalid import format: ${options.format}`);
            }
        }

        return Result.ok();
    }

    private getTripleKey(triple: Triple): string {
        const subject = triple.getSubject();
        const predicate = triple.getPredicate();
        const object = triple.getObject();
        
        const subjectStr = subject instanceof IRI ? subject.toString() :
                          subject instanceof BlankNode ? `_:${subject.toString()}` : '';
        const predicateStr = predicate.toString();
        const objectStr = object instanceof IRI ? object.toString() :
                         object instanceof BlankNode ? `_:${object.toString()}` :
                         object instanceof Literal ? `"${object.toString()}"` : '';
        
        return `${subjectStr}|${predicateStr}|${objectStr}`;
    }
}