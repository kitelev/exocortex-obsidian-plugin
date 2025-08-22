import { DomainEvent } from "../core/Entity";
import { AssetId } from "../value-objects/AssetId";
import { ClassName } from "../value-objects/ClassName";
import { OntologyPrefix } from "../value-objects/OntologyPrefix";

/**
 * Base class for all asset-related domain events
 */
export abstract class AssetDomainEvent implements DomainEvent {
  readonly eventType: string;
  readonly aggregateId: string;
  readonly occurredOn: Date;
  readonly eventData: Record<string, any>;
  
  constructor(
    eventType: string,
    assetId: AssetId,
    eventData: Record<string, any> = {}
  ) {
    this.eventType = eventType;
    this.aggregateId = assetId.toString();
    this.occurredOn = new Date();
    this.eventData = {
      assetId: assetId.toString(),
      ...eventData
    };
  }
  
  getAssetId(): AssetId {
    return { toString: () => this.aggregateId } as AssetId;
  }
}

/**
 * Asset creation events
 */
export class AssetCreatedEvent extends AssetDomainEvent {
  constructor(
    assetId: AssetId,
    className: ClassName,
    ontology: OntologyPrefix,
    title: string,
    properties: Record<string, any> = {}
  ) {
    super("AssetCreated", assetId, {
      className: className.toString(),
      ontology: ontology.toString(),
      title,
      properties
    });
  }
  
  getClassName(): string {
    return this.eventData.className;
  }
  
  getOntology(): string {
    return this.eventData.ontology;
  }
  
  getTitle(): string {
    return this.eventData.title;
  }
  
  getProperties(): Record<string, any> {
    return this.eventData.properties;
  }
}

/**
 * Asset update events
 */
export class AssetUpdatedEvent extends AssetDomainEvent {
  constructor(
    assetId: AssetId,
    changes: Record<string, { oldValue: any; newValue: any }>,
    version: number
  ) {
    super("AssetUpdated", assetId, {
      changes,
      version,
      changeCount: Object.keys(changes).length
    });
  }
  
  getChanges(): Record<string, { oldValue: any; newValue: any }> {
    return this.eventData.changes;
  }
  
  getVersion(): number {
    return this.eventData.version;
  }
  
  getChangeCount(): number {
    return this.eventData.changeCount;
  }
  
  hasPropertyChanged(propertyName: string): boolean {
    return propertyName in this.eventData.changes;
  }
}

export class AssetTitleUpdatedEvent extends AssetDomainEvent {
  constructor(
    assetId: AssetId,
    oldTitle: string,
    newTitle: string
  ) {
    super("AssetTitleUpdated", assetId, {
      oldTitle,
      newTitle
    });
  }
  
  getOldTitle(): string {
    return this.eventData.oldTitle;
  }
  
  getNewTitle(): string {
    return this.eventData.newTitle;
  }
}

export class AssetDescriptionUpdatedEvent extends AssetDomainEvent {
  constructor(
    assetId: AssetId,
    oldDescription: string | undefined,
    newDescription: string | undefined
  ) {
    super("AssetDescriptionUpdated", assetId, {
      oldDescription,
      newDescription
    });
  }
  
  getOldDescription(): string | undefined {
    return this.eventData.oldDescription;
  }
  
  getNewDescription(): string | undefined {
    return this.eventData.newDescription;
  }
}

export class AssetClassChangedEvent extends AssetDomainEvent {
  constructor(
    assetId: AssetId,
    oldClassName: string,
    newClassName: string
  ) {
    super("AssetClassChanged", assetId, {
      oldClassName,
      newClassName
    });
  }
  
  getOldClassName(): string {
    return this.eventData.oldClassName;
  }
  
  getNewClassName(): string {
    return this.eventData.newClassName;
  }
}

/**
 * Asset property events
 */
export class AssetPropertyUpdatedEvent extends AssetDomainEvent {
  constructor(
    assetId: AssetId,
    propertyKey: string,
    oldValue: any,
    newValue: any
  ) {
    super("AssetPropertyUpdated", assetId, {
      propertyKey,
      oldValue,
      newValue
    });
  }
  
  getPropertyKey(): string {
    return this.eventData.propertyKey;
  }
  
  getOldValue(): any {
    return this.eventData.oldValue;
  }
  
  getNewValue(): any {
    return this.eventData.newValue;
  }
}

export class AssetPropertyRemovedEvent extends AssetDomainEvent {
  constructor(
    assetId: AssetId,
    propertyKey: string,
    removedValue: any
  ) {
    super("AssetPropertyRemoved", assetId, {
      propertyKey,
      removedValue
    });
  }
  
  getPropertyKey(): string {
    return this.eventData.propertyKey;
  }
  
  getRemovedValue(): any {
    return this.eventData.removedValue;
  }
}

export class AssetPropertiesUpdatedEvent extends AssetDomainEvent {
  constructor(
    assetId: AssetId,
    updatedProperties: string[],
    changeCount: number
  ) {
    super("AssetPropertiesUpdated", assetId, {
      updatedProperties,
      changeCount
    });
  }
  
  getUpdatedProperties(): string[] {
    return this.eventData.updatedProperties;
  }
  
  getChangeCount(): number {
    return this.eventData.changeCount;
  }
}

/**
 * Asset deletion events
 */
export class AssetDeletedEvent extends AssetDomainEvent {
  constructor(
    assetId: AssetId,
    className: string,
    title: string,
    soft: boolean = true
  ) {
    super("AssetDeleted", assetId, {
      className,
      title,
      soft
    });
  }
  
  getClassName(): string {
    return this.eventData.className;
  }
  
  getTitle(): string {
    return this.eventData.title;
  }
  
  isSoftDelete(): boolean {
    return this.eventData.soft;
  }
}

export class AssetRestoredEvent extends AssetDomainEvent {
  constructor(
    assetId: AssetId,
    className: string,
    title: string
  ) {
    super("AssetRestored", assetId, {
      className,
      title
    });
  }
  
  getClassName(): string {
    return this.eventData.className;
  }
  
  getTitle(): string {
    return this.eventData.title;
  }
}

/**
 * Asset relationship events
 */
export class AssetRelationshipCreatedEvent extends AssetDomainEvent {
  constructor(
    fromAssetId: AssetId,
    toAssetId: AssetId,
    relationshipType: string
  ) {
    super("AssetRelationshipCreated", fromAssetId, {
      fromAssetId: fromAssetId.toString(),
      toAssetId: toAssetId.toString(),
      relationshipType
    });
  }
  
  getFromAssetId(): string {
    return this.eventData.fromAssetId;
  }
  
  getToAssetId(): string {
    return this.eventData.toAssetId;
  }
  
  getRelationshipType(): string {
    return this.eventData.relationshipType;
  }
}

export class AssetRelationshipRemovedEvent extends AssetDomainEvent {
  constructor(
    fromAssetId: AssetId,
    toAssetId: AssetId,
    relationshipType: string
  ) {
    super("AssetRelationshipRemoved", fromAssetId, {
      fromAssetId: fromAssetId.toString(),
      toAssetId: toAssetId.toString(),
      relationshipType
    });
  }
  
  getFromAssetId(): string {
    return this.eventData.fromAssetId;
  }
  
  getToAssetId(): string {
    return this.eventData.toAssetId;
  }
  
  getRelationshipType(): string {
    return this.eventData.relationshipType;
  }
}

/**
 * Asset validation events
 */
export class AssetValidationFailedEvent extends AssetDomainEvent {
  constructor(
    assetId: AssetId,
    validationErrors: string[],
    operation: "create" | "update" | "delete"
  ) {
    super("AssetValidationFailed", assetId, {
      validationErrors,
      operation,
      errorCount: validationErrors.length
    });
  }
  
  getValidationErrors(): string[] {
    return this.eventData.validationErrors;
  }
  
  getOperation(): string {
    return this.eventData.operation;
  }
  
  getErrorCount(): number {
    return this.eventData.errorCount;
  }
}

/**
 * Asset import/export events
 */
export class AssetImportedEvent extends AssetDomainEvent {
  constructor(
    assetId: AssetId,
    source: string,
    format: string,
    metadata: Record<string, any> = {}
  ) {
    super("AssetImported", assetId, {
      source,
      format,
      metadata
    });
  }
  
  getSource(): string {
    return this.eventData.source;
  }
  
  getFormat(): string {
    return this.eventData.format;
  }
  
  getMetadata(): Record<string, any> {
    return this.eventData.metadata;
  }
}

export class AssetExportedEvent extends AssetDomainEvent {
  constructor(
    assetId: AssetId,
    destination: string,
    format: string,
    metadata: Record<string, any> = {}
  ) {
    super("AssetExported", assetId, {
      destination,
      format,
      metadata
    });
  }
  
  getDestination(): string {
    return this.eventData.destination;
  }
  
  getFormat(): string {
    return this.eventData.format;
  }
  
  getMetadata(): Record<string, any> {
    return this.eventData.metadata;
  }
}

/**
 * Asset synchronization events
 */
export class AssetSynchronizedEvent extends AssetDomainEvent {
  constructor(
    assetId: AssetId,
    syncSource: string,
    changes: string[]
  ) {
    super("AssetSynchronized", assetId, {
      syncSource,
      changes,
      changeCount: changes.length
    });
  }
  
  getSyncSource(): string {
    return this.eventData.syncSource;
  }
  
  getChanges(): string[] {
    return this.eventData.changes;
  }
  
  getChangeCount(): number {
    return this.eventData.changeCount;
  }
}

export class AssetConflictDetectedEvent extends AssetDomainEvent {
  constructor(
    assetId: AssetId,
    conflictType: "version" | "content" | "reference",
    details: Record<string, any>
  ) {
    super("AssetConflictDetected", assetId, {
      conflictType,
      details
    });
  }
  
  getConflictType(): string {
    return this.eventData.conflictType;
  }
  
  getDetails(): Record<string, any> {
    return this.eventData.details;
  }
}

/**
 * Event factory for creating common asset events
 */
export class AssetEventFactory {
  static created(
    assetId: AssetId,
    className: ClassName,
    ontology: OntologyPrefix,
    title: string,
    properties: Record<string, any> = {}
  ): AssetCreatedEvent {
    return new AssetCreatedEvent(assetId, className, ontology, title, properties);
  }
  
  static updated(
    assetId: AssetId,
    changes: Record<string, { oldValue: any; newValue: any }>,
    version: number
  ): AssetUpdatedEvent {
    return new AssetUpdatedEvent(assetId, changes, version);
  }
  
  static titleUpdated(
    assetId: AssetId,
    oldTitle: string,
    newTitle: string
  ): AssetTitleUpdatedEvent {
    return new AssetTitleUpdatedEvent(assetId, oldTitle, newTitle);
  }
  
  static propertyUpdated(
    assetId: AssetId,
    propertyKey: string,
    oldValue: any,
    newValue: any
  ): AssetPropertyUpdatedEvent {
    return new AssetPropertyUpdatedEvent(assetId, propertyKey, oldValue, newValue);
  }
  
  static deleted(
    assetId: AssetId,
    className: string,
    title: string,
    soft: boolean = true
  ): AssetDeletedEvent {
    return new AssetDeletedEvent(assetId, className, title, soft);
  }
  
  static validationFailed(
    assetId: AssetId,
    validationErrors: string[],
    operation: "create" | "update" | "delete"
  ): AssetValidationFailedEvent {
    return new AssetValidationFailedEvent(assetId, validationErrors, operation);
  }
}