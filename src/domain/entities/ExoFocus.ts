import { Entity } from "../core/Entity";
import { Result } from "../core/Result";

export interface ExoFocusProps {
  name: string;
  description?: string;
  filters: FocusFilter[];
  priority: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FocusFilter {
  type: "class" | "tag" | "property" | "timeframe" | "relation";
  operator:
    | "includes"
    | "excludes"
    | "equals"
    | "contains"
    | "before"
    | "after"
    | "between";
  value: any;
  property?: string;
}

export class ExoFocus extends Entity<ExoFocusProps> {
  private _focusId: string;

  private constructor(props: ExoFocusProps, id?: string) {
    super(props);
    this._focusId = id || this.generateId();
  }

  private generateId(): string {
    return (
      "focus-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9)
    );
  }

  get id(): string {
    return this._focusId;
  }

  public static create(props: ExoFocusProps, id?: string): Result<ExoFocus> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail<ExoFocus>("Focus name is required");
    }

    if (props.priority < 0 || props.priority > 100) {
      return Result.fail<ExoFocus>("Priority must be between 0 and 100");
    }

    return Result.ok<ExoFocus>(new ExoFocus(props, id));
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get filters(): FocusFilter[] {
    return this.props.filters;
  }

  get priority(): number {
    return this.props.priority;
  }

  get active(): boolean {
    return this.props.active;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public addFilter(filter: FocusFilter): Result<void> {
    if (!this.isValidFilter(filter)) {
      return Result.fail<void>("Invalid filter configuration");
    }

    this.props.filters.push(filter);
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  public removeFilter(index: number): Result<void> {
    if (index < 0 || index >= this.props.filters.length) {
      return Result.fail<void>("Invalid filter index");
    }

    this.props.filters.splice(index, 1);
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  public activate(): void {
    this.props.active = true;
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.active = false;
    this.props.updatedAt = new Date();
  }

  public updatePriority(priority: number): Result<void> {
    if (priority < 0 || priority > 100) {
      return Result.fail<void>("Priority must be between 0 and 100");
    }

    this.props.priority = priority;
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  public matchesAsset(asset: any): boolean {
    if (!this.props.active) {
      return true;
    }

    for (const filter of this.props.filters) {
      if (!this.evaluateFilter(filter, asset)) {
        return false;
      }
    }

    return true;
  }

  public matchesTriple(triple: {
    subject: string;
    predicate: string;
    object: string;
  }): boolean {
    if (!this.props.active) {
      return true;
    }

    for (const filter of this.props.filters) {
      if (filter.type === "property" && filter.property) {
        if (filter.property !== triple.predicate) {
          continue;
        }

        if (!this.evaluateValue(filter.operator, triple.object, filter.value)) {
          return false;
        }
      }
    }

    return true;
  }

  private isValidFilter(filter: FocusFilter): boolean {
    const validTypes = ["class", "tag", "property", "timeframe", "relation"];
    const validOperators = [
      "includes",
      "excludes",
      "equals",
      "contains",
      "before",
      "after",
      "between",
    ];

    return (
      validTypes.includes(filter.type) &&
      validOperators.includes(filter.operator)
    );
  }

  private evaluateFilter(filter: FocusFilter, asset: any): boolean {
    switch (filter.type) {
      case "class":
        return this.evaluateClassFilter(filter, asset);
      case "tag":
        return this.evaluateTagFilter(filter, asset);
      case "property":
        return this.evaluatePropertyFilter(filter, asset);
      case "timeframe":
        return this.evaluateTimeframeFilter(filter, asset);
      case "relation":
        return this.evaluateRelationFilter(filter, asset);
      default:
        return true;
    }
  }

  private evaluateClassFilter(filter: FocusFilter, asset: any): boolean {
    const assetClass = asset["exo__Instance_class"] || asset.class;
    if (!assetClass) return false;

    const className = assetClass.replace(/\[\[|\]\]/g, "");

    switch (filter.operator) {
      case "equals":
        return className === filter.value;
      case "includes":
        return Array.isArray(filter.value)
          ? filter.value.includes(className)
          : className === filter.value;
      case "excludes":
        return Array.isArray(filter.value)
          ? !filter.value.includes(className)
          : className !== filter.value;
      case "contains":
        return className
          .toLowerCase()
          .includes(String(filter.value).toLowerCase());
      default:
        return true;
    }
  }

  private evaluateTagFilter(filter: FocusFilter, asset: any): boolean {
    const tags = asset.tags || asset["exo__Asset_tags"] || [];
    const tagArray = Array.isArray(tags) ? tags : [tags];

    switch (filter.operator) {
      case "includes":
        return tagArray.some(
          (tag) =>
            tag === filter.value ||
            (Array.isArray(filter.value) && filter.value.includes(tag)),
        );
      case "excludes":
        return !tagArray.some(
          (tag) =>
            tag === filter.value ||
            (Array.isArray(filter.value) && filter.value.includes(tag)),
        );
      case "contains":
        return tagArray.some((tag) =>
          tag.toLowerCase().includes(String(filter.value).toLowerCase()),
        );
      default:
        return true;
    }
  }

  private evaluatePropertyFilter(filter: FocusFilter, asset: any): boolean {
    if (!filter.property) return true;

    const value = asset[filter.property];
    if (value === undefined) return filter.operator === "excludes";

    return this.evaluateValue(filter.operator, value, filter.value);
  }

  private evaluateTimeframeFilter(filter: FocusFilter, asset: any): boolean {
    const dateProperties = [
      "exo__Asset_createdAt",
      "exo__Asset_updatedAt",
      "ems__Task_dueDate",
      "ems__Event_date",
    ];

    for (const prop of dateProperties) {
      const dateValue = asset[prop];
      if (dateValue) {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return this.evaluateDateValue(filter.operator, date, filter.value);
        }
      }
    }

    return filter.operator === "excludes";
  }

  private evaluateRelationFilter(filter: FocusFilter, asset: any): boolean {
    // This would need access to the graph to evaluate relations
    // For now, return true
    return true;
  }

  private evaluateValue(
    operator: string,
    actualValue: any,
    filterValue: any,
  ): boolean {
    switch (operator) {
      case "equals":
        return actualValue === filterValue;
      case "includes":
        if (Array.isArray(actualValue)) {
          return actualValue.includes(filterValue);
        }
        return actualValue === filterValue;
      case "excludes":
        if (Array.isArray(actualValue)) {
          return !actualValue.includes(filterValue);
        }
        return actualValue !== filterValue;
      case "contains":
        return String(actualValue)
          .toLowerCase()
          .includes(String(filterValue).toLowerCase());
      default:
        return true;
    }
  }

  private evaluateDateValue(
    operator: string,
    date: Date,
    filterValue: any,
  ): boolean {
    switch (operator) {
      case "before":
        return date < new Date(filterValue);
      case "after":
        return date > new Date(filterValue);
      case "between":
        if (Array.isArray(filterValue) && filterValue.length === 2) {
          const start = new Date(filterValue[0]);
          const end = new Date(filterValue[1]);
          return date >= start && date <= end;
        }
        return false;
      case "equals":
        const filterDate = new Date(filterValue);
        return date.toDateString() === filterDate.toDateString();
      default:
        return true;
    }
  }

  public toJSON(): any {
    return {
      id: this.id,
      name: this.props.name,
      description: this.props.description,
      filters: this.props.filters,
      priority: this.props.priority,
      active: this.props.active,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }

  public static fromJSON(json: any): Result<ExoFocus> {
    return ExoFocus.create(
      {
        name: json.name,
        description: json.description,
        filters: json.filters || [],
        priority: json.priority || 50,
        active: json.active !== false,
        createdAt: new Date(json.createdAt || Date.now()),
        updatedAt: new Date(json.updatedAt || Date.now()),
      },
      json.id,
    );
  }
}
