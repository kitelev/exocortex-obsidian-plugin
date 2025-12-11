/**
 * Area factory for creating test data.
 *
 * @example
 * // Simple area
 * const area = AreaFactory.create();
 *
 * // Area with children
 * const parentArea = AreaFactory.create({ label: "Work" });
 * const childArea = AreaFactory.withParent(parentArea.basename);
 *
 * // Archived area
 * const archivedArea = AreaFactory.archived();
 */

import type {
  AreaFixture,
  FileInfo,
  Metadata,
} from "../types";

let areaCounter = 0;

/**
 * Reset the area counter. Call this in beforeEach() to ensure deterministic IDs.
 */
export function resetAreaCounter(): void {
  areaCounter = 0;
}

/**
 * Generate a unique ID for areas.
 */
function generateId(): string {
  areaCounter++;
  return `area-${areaCounter}`;
}

/**
 * Default area fixture values.
 */
const DEFAULT_AREA: Omit<AreaFixture, "path" | "basename" | "label"> = {
  isArchived: false,
  createdAt: Date.now(),
};

/**
 * Area factory for creating test fixtures.
 */
export const AreaFactory = {
  /**
   * Create an area fixture with optional overrides.
   */
  create(overrides: Partial<AreaFixture> = {}): AreaFixture {
    const id = generateId();
    const basename = overrides.basename ?? id;

    return {
      path: overrides.path ?? `areas/${basename}.md`,
      basename,
      label: overrides.label ?? `Test Area ${areaCounter}`,
      parent: overrides.parent,
      isArchived: overrides.isArchived ?? DEFAULT_AREA.isArchived,
      createdAt: overrides.createdAt ?? DEFAULT_AREA.createdAt,
    };
  },

  /**
   * Create multiple area fixtures.
   */
  createMany(count: number, overrides: Partial<AreaFixture> = {}): AreaFixture[] {
    return Array.from({ length: count }, () => AreaFactory.create(overrides));
  },

  // Convenience methods

  /**
   * Create an archived area.
   */
  archived(overrides: Partial<AreaFixture> = {}): AreaFixture {
    return AreaFactory.create({ isArchived: true, ...overrides });
  },

  /**
   * Create an area with a parent (sub-area).
   */
  withParent(parent: string, overrides: Partial<AreaFixture> = {}): AreaFixture {
    return AreaFactory.create({ parent, ...overrides });
  },

  // Pre-defined common areas

  /**
   * Create a Work area.
   */
  work(overrides: Partial<AreaFixture> = {}): AreaFixture {
    return AreaFactory.create({
      label: "Work",
      basename: "work-area",
      ...overrides,
    });
  },

  /**
   * Create a Personal area.
   */
  personal(overrides: Partial<AreaFixture> = {}): AreaFixture {
    return AreaFactory.create({
      label: "Personal",
      basename: "personal-area",
      ...overrides,
    });
  },

  /**
   * Create a Health area.
   */
  health(overrides: Partial<AreaFixture> = {}): AreaFixture {
    return AreaFactory.create({
      label: "Health",
      basename: "health-area",
      ...overrides,
    });
  },

  /**
   * Create a Learning area.
   */
  learning(overrides: Partial<AreaFixture> = {}): AreaFixture {
    return AreaFactory.create({
      label: "Learning",
      basename: "learning-area",
      ...overrides,
    });
  },

  /**
   * Create a hierarchical area structure.
   */
  hierarchy(): {
    root: AreaFixture;
    child1: AreaFixture;
    child2: AreaFixture;
    grandchild: AreaFixture;
  } {
    const root = AreaFactory.create({ label: "Root Area", basename: "root-area" });
    const child1 = AreaFactory.withParent(root.basename, {
      label: "Child Area 1",
      basename: "child-area-1",
    });
    const child2 = AreaFactory.withParent(root.basename, {
      label: "Child Area 2",
      basename: "child-area-2",
    });
    const grandchild = AreaFactory.withParent(child1.basename, {
      label: "Grandchild Area",
      basename: "grandchild-area",
    });

    return { root, child1, child2, grandchild };
  },

  // Metadata conversion

  /**
   * Convert an AreaFixture to frontmatter metadata format.
   */
  toMetadata(fixture: AreaFixture): Metadata {
    const metadata: Metadata = {
      exo__Instance_class: "[[ems__Area]]",
      exo__Asset_label: fixture.label,
      exo__Asset_uid: fixture.basename,
      exo__Asset_createdAt: fixture.createdAt,
      exo__Asset_isArchived: fixture.isArchived,
    };

    if (fixture.parent) {
      metadata.ems__Area_parent = `[[${fixture.parent}]]`;
    }

    return metadata;
  },

  /**
   * Convert an AreaFixture to a TFile-like object.
   */
  toFile(fixture: AreaFixture): FileInfo & { stat: object; vault: null; parent: null; extension: string } {
    return {
      path: fixture.path,
      basename: fixture.basename,
      name: `${fixture.basename}.md`,
      extension: "md",
      parent: null,
      vault: null,
      stat: {
        ctime: fixture.createdAt ?? Date.now(),
        mtime: Date.now(),
        size: 0,
      },
    };
  },
};

export default AreaFactory;
