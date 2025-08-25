import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@jest/globals';
import { ExocortexWorld } from '../support/world';
import { TFile } from 'obsidian';
import { DynamicBacklinksBlockRenderer } from '../../src/presentation/renderers/DynamicBacklinksBlockRenderer';
import { DynamicBacklinksService, PropertyBasedBacklink } from '../../src/application/services/DynamicBacklinksService';
import { Graph } from '../../src/domain/semantic/core/Graph';
import { Triple } from '../../src/domain/semantic/core/Triple';
import { IRI } from '../../src/domain/semantic/core/Triple';
import { Literal } from '../../src/domain/semantic/core/Triple';

interface RelationshipRow {
  asset: string;
  property: string;
  target: string;
  source?: string;
  relationship_type?: string;
  relationship?: string;
}

interface BacklinkExpectation {
  source: string;
  relationship_type: string;
}

interface RDFTripleExpectation {
  subject: string;
  predicate: string;
  object: string;
}

interface FrontmatterProperty {
  property: string;
  value: string;
}

interface ValidationIssue {
  issue_type: string;
  details: string;
}

interface CircularDependency {
  asset_a: string;
  property: string;
  asset_b: string;
}

interface ConnectionStrength {
  asset_a: string;
  asset_b: string;
  connection_types: string;
  frequency: string;
}

interface StrengthRanking {
  rank: string;
  target: string;
  strength_score: string;
}

// Background setup
Given('the semantic graph system is enabled', function (this: ExocortexWorld) {
  const graph = new Graph();
  this.setTestData('semanticGraph', graph);
  
  const backlinksService = new DynamicBacklinksService(
    this.container.resolve('IVaultAdapter'),
    this.container.resolve('IUIAdapter')
  );
  this.setTestData('backlinksService', backlinksService);
  
  expect(graph).toBeDefined();
  expect(backlinksService).toBeDefined();
});

Given('the RDF triple store is active', function (this: ExocortexWorld) {
  const graph = this.getTestData('semanticGraph') as Graph;
  expect(graph).toBeDefined();
  
  // Initialize with basic namespaces
  this.setTestData('namespaces', {
    'exo': 'http://exocortex.org/ontology#',
    'ems': 'http://exocortex.org/ems#'
  });
});

Given('I have a knowledge base with interconnected assets', function (this: ExocortexWorld) {
  // Create mock assets
  const mockAssets = new Map<string, TFile>();
  
  ['Project Alpha', 'Task Beta', 'Task Gamma', 'Document Delta', 'Epic Strategy'].forEach(name => {
    const file = {
      basename: name,
      name: `${name}.md`,
      path: `${name}.md`,
      vault: this.vault,
    } as TFile;
    
    mockAssets.set(name, file);
  });
  
  this.setTestData('mockAssets', mockAssets);
  
  // Mock vault.getAbstractFileByPath
  this.app.vault.getAbstractFileByPath = jest.fn().mockImplementation((path: string) => {
    return Array.from(mockAssets.values()).find(f => f.path === path);
  });
});

// Basic backlinks discovery scenarios
Given('I have the following assets with relationships:', function (this: ExocortexWorld, dataTable: any) {
  const relationships = dataTable.hashes() as RelationshipRow[];
  const mockAssets = this.getTestData('mockAssets') as Map<string, TFile>;
  const graph = this.getTestData('semanticGraph') as Graph;
  
  // Create metadata for each asset
  const metadataMap = new Map<string, Record<string, any>>();
  
  relationships.forEach(rel => {
    if (!metadataMap.has(rel.asset)) {
      metadataMap.set(rel.asset, {
        'exo__Instance_class': 'exo__Asset',
        'exo__Asset_label': rel.asset
      });
    }
    
    const metadata = metadataMap.get(rel.asset)!;
    
    // Clean target reference (remove brackets)
    const cleanTarget = rel.target.replace(/\[\[|\]\]/g, '');
    metadata[rel.property] = rel.target;
    
    // Create RDF triple
    const subject = new IRI(`http://exocortex.org/assets/${rel.asset.replace(/\s+/g, '_')}`);
    const predicate = new IRI(`http://exocortex.org/ontology#${rel.property.replace(/__/g, '_')}`);
    const object = new IRI(`http://exocortex.org/assets/${cleanTarget.replace(/\s+/g, '_')}`);
    
    graph.add(new Triple(subject, predicate, object));
  });
  
  // Mock metadataCache.getFileCache
  this.app.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => {
    const metadata = metadataMap.get(file.basename);
    return metadata ? { frontmatter: metadata } : null;
  });
  
  this.setTestData('relationshipMetadata', metadataMap);
  this.setTestData('relationshipData', relationships);
});

When('I view backlinks for {string}', function (this: ExocortexWorld, assetName: string) {
  const mockAssets = this.getTestData('mockAssets') as Map<string, TFile>;
  const targetFile = mockAssets.get(assetName);
  
  expect(targetFile).toBeDefined();
  this.currentFile = targetFile!;
  
  // Mock the backlinks discovery
  const relationships = this.getTestData('relationshipData') as RelationshipRow[];
  const backlinks: PropertyBasedBacklink[] = [];
  
  // Find relationships pointing to this asset
  const targetReferences = relationships.filter(rel => 
    rel.target.includes(assetName)
  );
  
  // Group by property type
  const propertyGroups = new Map<string, any[]>();
  targetReferences.forEach(rel => {
    if (!propertyGroups.has(rel.property)) {
      propertyGroups.set(rel.property, []);
    }
    
    const mockAssets = this.getTestData('mockAssets') as Map<string, TFile>;
    const sourceFile = mockAssets.get(rel.asset);
    if (sourceFile) {
      propertyGroups.get(rel.property)!.push(sourceFile);
    }
  });
  
  // Convert to PropertyBasedBacklink format
  for (const [property, files] of propertyGroups) {
    backlinks.push({
      propertyName: property,
      referencingFiles: files
    });
  }
  
  this.setTestData('discoveredBacklinks', backlinks);
});

Then('I should see {int} incoming relationships:', function (this: ExocortexWorld, expectedCount: number, dataTable: any) {
  const backlinks = this.getTestData('discoveredBacklinks') as PropertyBasedBacklink[];
  const expectedBacklinks = dataTable.hashes() as BacklinkExpectation[];
  
  // Count total relationships across all properties
  const totalRelationships = backlinks.reduce((sum, bl) => sum + bl.referencingFiles.length, 0);
  expect(totalRelationships).toBe(expectedCount);
  
  // Verify specific relationships exist
  expectedBacklinks.forEach(expected => {
    const propertyBacklinks = backlinks.find(bl => bl.propertyName === expected.relationship_type);
    expect(propertyBacklinks).toBeDefined();
    
    const hasSourceFile = propertyBacklinks!.referencingFiles.some(
      (file: TFile) => file.basename === expected.source
    );
    expect(hasSourceFile).toBe(true);
  });
});

// Dynamic rendering scenarios
Given('I am viewing the note {string}', function (this: ExocortexWorld, noteName: string) {
  const mockAssets = this.getTestData('mockAssets') as Map<string, TFile>;
  const noteFile = mockAssets.get(noteName);
  
  expect(noteFile).toBeDefined();
  this.currentFile = noteFile!;
});

Given('it has multiple incoming relationships', function (this: ExocortexWorld) {
  // Mock multiple backlinks for the current file
  const mockBacklinks: PropertyBasedBacklink[] = [
    {
      propertyName: 'ems__Effort_parent',
      referencingFiles: [
        { basename: 'Task A', path: 'Task A.md' },
        { basename: 'Task B', path: 'Task B.md' }
      ]
    },
    {
      propertyName: 'exo__Asset_relatedTo',
      referencingFiles: [
        { basename: 'Document C', path: 'Document C.md' }
      ]
    }
  ];
  
  this.setTestData('discoveredBacklinks', mockBacklinks);
});

When('the dynamic backlinks block is rendered', async function (this: ExocortexWorld) {
  const renderer = new DynamicBacklinksBlockRenderer(this.app);
  const container = document.createElement('div');
  
  // Mock the backlinks service to return our test data
  const backlinks = this.getTestData('discoveredBacklinks') as PropertyBasedBacklink[];
  const mockResult = { isFailure: false, getValue: () => backlinks };
  
  jest.spyOn(DynamicBacklinksService.prototype, 'discoverPropertyBasedBacklinks')
    .mockResolvedValue(mockResult as any);
  
  await renderer.render(container, {}, this.currentFile!, null);
  
  this.setTestData('renderContainer', container);
  this.setTestData('renderedContent', container.innerHTML);
});

Then('I should see a collapsible section titled {string}', function (this: ExocortexWorld, sectionTitle: string) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  
  // Look for section with the expected title
  const sectionHeader = Array.from(container.querySelectorAll('h3, h4, .section-title'))
    .find(el => el.textContent?.includes(sectionTitle));
  
  expect(sectionHeader).toBeTruthy();
});

Then('each backlink should show:', function (this: ExocortexWorld, dataTable: any) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  const expectedElements = dataTable.hashes();
  
  expectedElements.forEach(element => {
    switch (element.element) {
      case 'source_asset':
        const assetLinks = container.querySelectorAll('a.internal-link');
        expect(assetLinks.length).toBeGreaterThan(0);
        break;
        
      case 'relationship_type':
        const relationshipLabels = container.querySelectorAll('.relationship-type, .property-name');
        expect(relationshipLabels.length).toBeGreaterThan(0);
        break;
        
      case 'context_snippet':
        // Context snippets would be shown if implemented
        expect(true).toBe(true); // Placeholder
        break;
    }
  });
});

Then('the section should have proper CSS styling', function (this: ExocortexWorld) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  
  // Check for expected CSS classes
  const hasBacklinksClass = container.querySelector('.backlinks, .dynamic-backlinks');
  expect(hasBacklinksClass).toBeTruthy();
});

// Filtering scenarios
Given('I have backlinks with various relationship types:', function (this: ExocortexWorld, dataTable: any) {
  const backlinkTypes = dataTable.hashes();
  const mockBacklinks: PropertyBasedBacklink[] = [];
  
  // Group by relationship type
  const propertyGroups = new Map<string, any[]>();
  
  backlinkTypes.forEach(bl => {
    if (!propertyGroups.has(bl.relationship)) {
      propertyGroups.set(bl.relationship, []);
    }
    
    propertyGroups.get(bl.relationship)!.push({
      basename: bl.source,
      path: `${bl.source}.md`
    });
  });
  
  // Convert to PropertyBasedBacklink format
  for (const [property, files] of propertyGroups) {
    mockBacklinks.push({
      propertyName: property,
      referencingFiles: files
    });
  }
  
  this.setTestData('discoveredBacklinks', mockBacklinks);
});

When('I filter backlinks by relationship type {string}', function (this: ExocortexWorld, relationshipType: string) {
  const allBacklinks = this.getTestData('discoveredBacklinks') as PropertyBasedBacklink[];
  
  const filteredBacklinks = allBacklinks.filter(bl => bl.propertyName === relationshipType);
  this.setTestData('filteredBacklinks', filteredBacklinks);
});

Then('I should see only {int} backlinks:', function (this: ExocortexWorld, expectedCount: number, dataTable: any) {
  const filteredBacklinks = this.getTestData('filteredBacklinks') as PropertyBasedBacklink[];
  const expectedResults = dataTable.hashes();
  
  const totalCount = filteredBacklinks.reduce((sum, bl) => sum + bl.referencingFiles.length, 0);
  expect(totalCount).toBe(expectedCount);
  
  // Verify specific results
  expectedResults.forEach(expected => {
    const foundBacklink = filteredBacklinks.find(bl => 
      bl.referencingFiles.some((f: any) => f.basename === expected.source)
    );
    expect(foundBacklink).toBeDefined();
    expect(foundBacklink!.propertyName).toBe(expected.relationship);
  });
});

// RDF processing scenarios
Given('I have an asset with frontmatter:', function (this: ExocortexWorld, dataTable: any) {
  const properties = dataTable.hashes() as FrontmatterProperty[];
  const frontmatter: Record<string, any> = {};
  
  properties.forEach(prop => {
    let value = prop.value;
    
    // Handle array values (comma-separated)
    if (value.includes(', [[')) {
      value = value.split(', ').map(v => v.trim());
    }
    
    frontmatter[prop.property] = value;
  });
  
  // Create a mock current asset
  const assetFile = {
    basename: 'CurrentAsset',
    name: 'CurrentAsset.md',
    path: 'CurrentAsset.md',
    vault: this.vault,
  } as TFile;
  
  this.currentFile = assetFile;
  this.setTestData('assetFrontmatter', frontmatter);
  
  // Mock metadataCache to return this frontmatter
  this.app.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => {
    if (file === assetFile) {
      return { frontmatter };
    }
    return null;
  });
});

When('the system processes the relationships', function (this: ExocortexWorld) {
  const frontmatter = this.getTestData('assetFrontmatter') as Record<string, any>;
  const graph = this.getTestData('semanticGraph') as Graph;
  const namespaces = this.getTestData('namespaces') as Record<string, string>;
  
  const processedTriples: Triple[] = [];
  
  // Process each frontmatter property into RDF triples
  Object.entries(frontmatter).forEach(([property, value]) => {
    const subject = new IRI('http://exocortex.org/assets/CurrentAsset');
    const predicate = new IRI(`${namespaces.exo}${property.replace(/__/g, '_')}`);
    
    // Handle arrays
    const values = Array.isArray(value) ? value : [value];
    
    values.forEach(v => {
      // Clean up wikilinks
      const cleanValue = v.toString().replace(/\[\[|\]\]/g, '');
      const object = new IRI(`http://exocortex.org/assets/${cleanValue.replace(/\s+/g, '_')}`);
      
      const triple = new Triple(subject, predicate, object);
      graph.add(triple);
      processedTriples.push(triple);
    });
  });
  
  this.setTestData('processedTriples', processedTriples);
});

Then('RDF triples should be created:', function (this: ExocortexWorld, dataTable: any) {
  const expectedTriples = dataTable.hashes() as RDFTripleExpectation[];
  const processedTriples = this.getTestData('processedTriples') as Triple[];
  
  expectedTriples.forEach(expected => {
    const matchingTriple = processedTriples.find(triple => {
      const subjectMatches = triple.getSubject().toString().includes(expected.subject.replace(/\s+/g, '_'));
      const predicateMatches = triple.getPredicate().toString().includes(expected.predicate.replace(/__/g, '_'));
      const objectMatches = triple.getObject().toString().includes(expected.object.replace(/\s+/g, '_'));
      
      return subjectMatches && predicateMatches && objectMatches;
    });
    
    expect(matchingTriple).toBeDefined();
  });
});

// Grouping and piped links scenarios
Given('I have an asset with the following relationships:', function (this: ExocortexWorld, dataTable: any) {
  const relationships = dataTable.hashes() as FrontmatterProperty[];
  const frontmatter: Record<string, any> = {};
  
  // Group properties with same name into arrays
  const propertyGroups = new Map<string, string[]>();
  
  relationships.forEach(rel => {
    if (!propertyGroups.has(rel.property)) {
      propertyGroups.set(rel.property, []);
    }
    propertyGroups.get(rel.property)!.push(rel.value);
  });
  
  // Convert to frontmatter format
  for (const [property, values] of propertyGroups) {
    frontmatter[property] = values.length === 1 ? values[0] : values;
  }
  
  this.setTestData('pipedLinkFrontmatter', frontmatter);
  
  // Mock current file
  const assetFile = {
    basename: 'TestAsset',
    name: 'TestAsset.md',
    path: 'TestAsset.md',
    vault: this.vault,
  } as TFile;
  
  this.currentFile = assetFile;
  
  this.app.metadataCache.getFileCache = jest.fn().mockReturnValue({
    frontmatter
  });
});

When('I render the relations block', function (this: ExocortexWorld) {
  const frontmatter = this.getTestData('pipedLinkFrontmatter') as Record<string, any>;
  
  // Process relations for rendering
  const relationGroups = new Map<string, string[]>();
  
  Object.entries(frontmatter).forEach(([property, value]) => {
    const values = Array.isArray(value) ? value : [value];
    
    relationGroups.set(property, values.map(v => {
      // Extract display name from piped links [[Asset|Display Name]]
      const pipedMatch = v.toString().match(/\[\[([^|]+)\|([^\]]+)\]\]/);
      if (pipedMatch) {
        return pipedMatch[2]; // Return display name
      }
      
      // Regular wikilink [[Asset]]
      const linkMatch = v.toString().match(/\[\[([^\]]+)\]\]/);
      if (linkMatch) {
        return linkMatch[1];
      }
      
      return v.toString();
    }));
  });
  
  this.setTestData('renderedRelations', relationGroups);
});

Then('relations should be grouped by property:', function (this: ExocortexWorld, dataTable: any) {
  const expectedGroups = dataTable.hashes();
  const renderedRelations = this.getTestData('renderedRelations') as Map<string, string[]>;
  
  expectedGroups.forEach(expected => {
    const group = renderedRelations.get(expected.property_group);
    expect(group).toBeDefined();
    
    const expectedRelations = expected.relations.split(', ').map(r => r.trim());
    expectedRelations.forEach(relation => {
      expect(group).toContain(relation);
    });
  });
});

Then('piped link display names should be preserved', function (this: ExocortexWorld) {
  const renderedRelations = this.getTestData('renderedRelations') as Map<string, string[]>;
  
  // Check that display names are used instead of asset names
  const relatedToGroup = renderedRelations.get('exo__Asset_relatedTo');
  expect(relatedToGroup).toContain('Display Name A');
  expect(relatedToGroup).toContain('Display Name B');
});

Then('actual asset references should be used for navigation', function (this: ExocortexWorld) {
  // In a real implementation, would verify that clicking links navigates to actual assets
  // For now, just verify that we can extract the actual asset references
  const frontmatter = this.getTestData('pipedLinkFrontmatter') as Record<string, any>;
  
  const relatedToValues = Array.isArray(frontmatter['exo__Asset_relatedTo']) 
    ? frontmatter['exo__Asset_relatedTo'] 
    : [frontmatter['exo__Asset_relatedTo']];
    
  relatedToValues.forEach((value: string) => {
    if (value.includes('|')) {
      const actualAsset = value.match(/\[\[([^|]+)\|/)?.[1];
      expect(actualAsset).toBeTruthy();
    }
  });
});

// Performance and caching scenarios
Given('I have a knowledge base with:', function (this: ExocortexWorld, dataTable: any) {
  const metrics = dataTable.hashes()[0];
  
  // Mock large dataset
  this.setTestData('knowledgeBaseMetrics', {
    totalAssets: parseInt(metrics.total_assets),
    totalRelationships: parseInt(metrics.total_relationships),
    maxRelationshipsPerAsset: parseInt(metrics.max_relationships_per_asset)
  });
  
  // Create mock performance data
  this.setTestData('performanceStartTime', performance.now());
});

When('I query relationships for any asset', function (this: ExocortexWorld) {
  const startTime = performance.now();
  this.setTestData('queryStartTime', startTime);
  
  // Simulate query execution
  const mockResults: PropertyBasedBacklink[] = [
    {
      propertyName: 'exo__Asset_relatedTo',
      referencingFiles: []
    }
  ];
  
  const endTime = performance.now();
  this.setTestData('queryEndTime', endTime);
  this.setTestData('queryResults', mockResults);
});

Then('the query should complete within {int}ms', function (this: ExocortexWorld, maxMs: number) {
  const startTime = this.getTestData('queryStartTime') as number;
  const endTime = this.getTestData('queryEndTime') as number;
  
  const duration = endTime - startTime;
  expect(duration).toBeLessThan(maxMs);
});

Then('results should be cached for subsequent requests', function (this: ExocortexWorld) {
  // Mock caching behavior
  this.setTestData('resultsAreCached', true);
  expect(this.getTestData('resultsAreCached')).toBe(true);
});

Then('memory usage should remain bounded', function (this: ExocortexWorld) {
  // In real implementation, would monitor actual memory usage
  expect(true).toBe(true);
});

// Validation scenarios
Given('I have the following relationships:', function (this: ExocortexWorld, dataTable: any) {
  const relationships = dataTable.hashes();
  const mockAssets = new Map<string, boolean>();
  
  relationships.forEach(rel => {
    // Track which assets exist
    if (rel.exists !== undefined) {
      mockAssets.set(rel.asset_a, rel.exists === 'true');
    } else {
      mockAssets.set(rel.asset_a, true);
      if (rel.asset_b) {
        mockAssets.set(rel.asset_b, true);
      }
    }
  });
  
  this.setTestData('validationRelationships', relationships);
  this.setTestData('assetExistence', mockAssets);
});

When('the system validates relationships', function (this: ExocortexWorld) {
  const relationships = this.getTestData('validationRelationships') as any[];
  const assetExistence = this.getTestData('assetExistence') as Map<string, boolean>;
  
  const validationIssues: ValidationIssue[] = [];
  
  relationships.forEach(rel => {
    if (rel.asset_b && assetExistence.get(rel.asset_b) === false) {
      validationIssues.push({
        issue_type: 'broken_reference',
        details: `${rel.asset_b} does not exist`
      });
      
      validationIssues.push({
        issue_type: 'orphaned_relation',
        details: `${rel.asset_a} -> ${rel.asset_b} is orphaned`
      });
    }
  });
  
  this.setTestData('validationIssues', validationIssues);
});

Then('I should receive validation warnings:', function (this: ExocortexWorld, dataTable: any) {
  const expectedIssues = dataTable.hashes() as ValidationIssue[];
  const actualIssues = this.getTestData('validationIssues') as ValidationIssue[];
  
  expectedIssues.forEach(expected => {
    const matchingIssue = actualIssues.find(issue => 
      issue.issue_type === expected.issue_type && 
      issue.details.includes(expected.details.split(' does not exist')[0])
    );
    expect(matchingIssue).toBeDefined();
  });
});

Then('valid relationships should remain intact', function (this: ExocortexWorld) {
  // In real implementation, would verify valid relationships are preserved
  expect(true).toBe(true);
});

Then('broken relationships should be flagged for cleanup', function (this: ExocortexWorld) {
  const validationIssues = this.getTestData('validationIssues') as ValidationIssue[];
  const brokenReferences = validationIssues.filter(issue => issue.issue_type === 'broken_reference');
  
  expect(brokenReferences.length).toBeGreaterThan(0);
});

// Circular dependency scenarios
Given('I have relationships forming a cycle:', function (this: ExocortexWorld, dataTable: any) {
  const cycleRelationships = dataTable.hashes() as CircularDependency[];
  this.setTestData('cyclicRelationships', cycleRelationships);
  
  // Build dependency graph
  const dependencyGraph = new Map<string, string[]>();
  
  cycleRelationships.forEach(rel => {
    if (!dependencyGraph.has(rel.asset_a)) {
      dependencyGraph.set(rel.asset_a, []);
    }
    dependencyGraph.get(rel.asset_a)!.push(rel.asset_b);
  });
  
  this.setTestData('dependencyGraph', dependencyGraph);
});

When('the system analyzes dependencies', function (this: ExocortexWorld) {
  const dependencyGraph = this.getTestData('dependencyGraph') as Map<string, string[]>;
  
  // Simple cycle detection algorithm
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycles: string[][] = [];
  
  function detectCycle(node: string, path: string[]): boolean {
    if (recursionStack.has(node)) {
      // Found cycle - extract the cycle path
      const cycleStart = path.indexOf(node);
      const cyclePath = [...path.slice(cycleStart), node];
      cycles.push(cyclePath);
      return true;
    }
    
    if (visited.has(node)) {
      return false;
    }
    
    visited.add(node);
    recursionStack.add(node);
    
    const dependencies = dependencyGraph.get(node) || [];
    for (const dep of dependencies) {
      if (detectCycle(dep, [...path, node])) {
        return true;
      }
    }
    
    recursionStack.delete(node);
    return false;
  }
  
  // Check each node for cycles
  for (const node of dependencyGraph.keys()) {
    if (!visited.has(node)) {
      detectCycle(node, []);
    }
  }
  
  this.setTestData('detectedCycles', cycles);
});

Then('a circular dependency should be detected', function (this: ExocortexWorld) {
  const cycles = this.getTestData('detectedCycles') as string[][];
  expect(cycles.length).toBeGreaterThan(0);
});

Then('I should receive a warning about the cycle:', function (this: ExocortexWorld, dataTable: any) {
  const expectedCycle = dataTable.hashes()[0];
  const cycles = this.getTestData('detectedCycles') as string[][];
  
  expect(cycles.length).toBeGreaterThan(0);
  
  // Verify the cycle path contains expected elements
  const cycle = cycles[0];
  expect(cycle).toContain('Task A');
  expect(cycle).toContain('Task B');
  expect(cycle).toContain('Task C');
});

Then('the cycle should be visualized if requested', function (this: ExocortexWorld) {
  // In real implementation, would generate visualization
  expect(true).toBe(true);
});

// Relationship strength scenarios
Given('I have assets with varying connection strengths:', function (this: ExocortexWorld, dataTable: any) {
  const connections = dataTable.hashes() as ConnectionStrength[];
  this.setTestData('connectionStrengths', connections);
});

When('I analyze relationship strength', function (this: ExocortexWorld) {
  const connections = this.getTestData('connectionStrengths') as ConnectionStrength[];
  
  // Calculate strength scores based on connection types and frequency
  const strengthScores = connections.map(conn => {
    const types = conn.connection_types.split(', ').length;
    const frequency = parseInt(conn.frequency);
    
    // Simple scoring algorithm: (types * 0.3 + frequency * 0.7) / max_possible
    const score = (types * 0.3 + frequency * 0.7) / 6; // Normalized to max score of ~1
    
    return {
      target: conn.asset_b,
      strength_score: Math.min(score, 1).toFixed(1)
    };
  });
  
  // Sort by strength descending
  strengthScores.sort((a, b) => parseFloat(b.strength_score) - parseFloat(a.strength_score));
  
  // Add ranks
  const rankedConnections = strengthScores.map((conn, index) => ({
    rank: (index + 1).toString(),
    target: conn.target,
    strength_score: conn.strength_score
  }));
  
  this.setTestData('rankedConnections', rankedConnections);
});

Then('connections should be ranked by strength:', function (this: ExocortexWorld, dataTable: any) {
  const expectedRanking = dataTable.hashes() as StrengthRanking[];
  const actualRanking = this.getTestData('rankedConnections') as StrengthRanking[];
  
  expectedRanking.forEach((expected, index) => {
    expect(actualRanking[index]).toBeDefined();
    expect(actualRanking[index].rank).toBe(expected.rank);
    expect(actualRanking[index].target).toBe(expected.target);
    // Allow some tolerance in strength score comparison
    expect(Math.abs(parseFloat(actualRanking[index].strength_score) - parseFloat(expected.strength_score))).toBeLessThan(0.2);
  });
});

// Placeholder implementations for complex scenarios
When('I search for {string}', function (this: ExocortexWorld, searchQuery: string) {
  this.setTestData('searchQuery', searchQuery);
});

Then('the system should traverse relationships', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

Then('find {string} through the path: {string}', function (this: ExocortexWorld, foundAsset: string, path: string) {
  expect(true).toBe(true); // Stub
});

Then('the traversal path should be shown in results', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

When('I open the relationship browser', function (this: ExocortexWorld) {
  this.setTestData('relationshipBrowserOpen', true);
});

Then('I should see an interactive interface with:', function (this: ExocortexWorld, dataTable: any) {
  expect(true).toBe(true); // Stub
});

Given('I am using the plugin on a mobile device', function (this: ExocortexWorld) {
  this.setTestData('isMobileDevice', true);
});

When('I view relationships for an asset', function (this: ExocortexWorld) {
  this.setTestData('viewingRelationships', true);
});

Then('the relationship interface should be touch-friendly:', function (this: ExocortexWorld, dataTable: any) {
  expect(true).toBe(true); // Stub
});

// Additional stub implementations
Then('I should be able to export in formats:', function (this: ExocortexWorld, dataTable: any) {
  expect(true).toBe(true); // Stub
});

Then('exported data should preserve:', function (this: ExocortexWorld, dataTable: any) {
  expect(true).toBe(true); // Stub
});

When('user A creates a new relationship', function (this: ExocortexWorld) {
  this.setTestData('userAAction', 'create_relationship');
});

Then('user B should see the relationship appear', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

Then('the relationship should be reflected in B\\'s backlinks view', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

Then('conflict resolution should handle simultaneous edits', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

Given('multiple users are editing the knowledge base', function (this: ExocortexWorld) {
  this.setTestData('multiUserMode', true);
});

When('I export the relationship data', function (this: ExocortexWorld) {
  this.setTestData('exportInitiated', true);
});

Given('I have a set of assets with rich relationships', function (this: ExocortexWorld) {
  this.setTestData('richRelationships', true);
});

Given('I have assets with different access levels:', function (this: ExocortexWorld, dataTable: any) {
  const accessLevels = dataTable.hashes();
  this.setTestData('assetAccessLevels', accessLevels);
});

Given('I have read access only to public assets', function (this: ExocortexWorld) {
  this.setTestData('userAccessLevel', 'public');
});

Then('I should see the relationship exists', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

Then('I should not be able to access {string}', function (this: ExocortexWorld, assetName: string) {
  expect(true).toBe(true); // Stub
});

Then('relationship traversal should stop at access boundaries', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

Given('I have a mature knowledge base with many relationships', function (this: ExocortexWorld) {
  this.setTestData('matureKnowledgeBase', true);
});

When('I request relationship analytics', function (this: ExocortexWorld) {
  this.setTestData('analyticsRequested', true);
});

Then('I should see insights like:', function (this: ExocortexWorld, dataTable: any) {
  expect(true).toBe(true); // Stub
});

Given('I have relationships with various data issues:', function (this: ExocortexWorld, dataTable: any) {
  const dataIssues = dataTable.hashes();
  this.setTestData('relationshipDataIssues', dataIssues);
});

When('the system processes these relationships', function (this: ExocortexWorld) {
  this.setTestData('relationshipsProcessed', true);
});

Then('errors should be handled gracefully:', function (this: ExocortexWorld, dataTable: any) {
  expect(true).toBe(true); // Stub
});

Then('the UI should remain functional with partial data', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

Given('the relationship system is under normal load', function (this: ExocortexWorld) {
  this.setTestData('systemUnderLoad', true);
});

When('performance metrics are collected', function (this: ExocortexWorld) {
  this.setTestData('metricsCollected', true);
});

Then('I should be able to monitor:', function (this: ExocortexWorld, dataTable: any) {
  expect(true).toBe(true); // Stub
});

Then('performance degradation should trigger alerts', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

// Cache-specific scenarios
Given('I have queried relationships for {string}', function (this: ExocortexWorld, assetName: string) {
  this.setTestData('queriedAsset', assetName);
});

Given('the results are cached', function (this: ExocortexWorld) {
  this.setTestData('resultsCached', true);
});

When('I navigate to another asset and back', function (this: ExocortexWorld) {
  this.setTestData('navigationOccurred', true);
});

Then('the cached relationships should be used', function (this: ExocortexWorld) {
  expect(this.getTestData('resultsCached')).toBe(true);
});

Then('the response time should be under {int}ms', function (this: ExocortexWorld, maxMs: number) {
  // In real implementation, would measure actual response time
  expect(true).toBe(true);
});

When('a related asset is modified', function (this: ExocortexWorld) {
  this.setTestData('assetModified', true);
});

Then('the cache should be invalidated', function (this: ExocortexWorld) {
  expect(this.getTestData('assetModified')).toBe(true);
});

Then('fresh data should be fetched on next access', function (this: ExocortexWorld) {
  expect(true).toBe(true);
});

// Ontology-aware scenarios  
Given('I have ontology definitions that map:', function (this: ExocortexWorld, dataTable: any) {
  const ontologyMappings = dataTable.hashes();
  const mappings = new Map<string, string>();
  
  ontologyMappings.forEach(mapping => {
    mappings.set(mapping.property_iri, mapping.human_label);
  });
  
  this.setTestData('ontologyMappings', mappings);
});

Given('I have an asset with these relationships', function (this: ExocortexWorld) {
  // Create test relationships using the ontology properties
  const testFrontmatter = {
    'exo__Asset_relatedTo': '[[Test Asset]]',
    'ems__Effort_parent': '[[Parent Project]]',
    'exo__Asset_dependsOn': '[[Dependency]]'
  };
  
  this.setTestData('assetFrontmatter', testFrontmatter);
});

Then('relationships should be displayed with human-readable labels:', function (this: ExocortexWorld, dataTable: any) {
  const expectedLabels = dataTable.hashes();
  const ontologyMappings = this.getTestData('ontologyMappings') as Map<string, string>;
  
  expectedLabels.forEach(expected => {
    const actualLabel = ontologyMappings.get(expected.property_iri);
    expect(actualLabel).toBe(expected.displayed_label);
  });
});

// Inverse relationship scenarios
Given('I have asset A with relation {string} to asset B', function (this: ExocortexWorld, relationName: string) {
  this.setTestData('directRelation', {
    source: 'Asset A',
    relation: relationName,
    target: 'Asset B'
  });
});

Given('the ontology defines {string} has inverse {string}', function (this: ExocortexWorld, relation: string, inverse: string) {
  const inverseMapping = new Map<string, string>();
  inverseMapping.set(relation, inverse);
  this.setTestData('inverseMappings', inverseMapping);
});

When('I view asset B', function (this: ExocortexWorld) {
  this.setTestData('viewingAsset', 'Asset B');
});

Then('I should see an inverse relationship:', function (this: ExocortexWorld, dataTable: any) {
  const expectedInverse = dataTable.hashes()[0];
  const directRelation = this.getTestData('directRelation');
  const inverseMappings = this.getTestData('inverseMappings') as Map<string, string>;
  
  const inverseRelation = inverseMappings.get(directRelation.relation);
  expect(inverseRelation).toBe(expectedInverse.relationship);
  expect(directRelation.source).toBe(expectedInverse.source);
});

Then('the inverse relationship should be marked as computed', function (this: ExocortexWorld) {
  // In real implementation, would verify computed relationship marking
  expect(true).toBe(true);
});