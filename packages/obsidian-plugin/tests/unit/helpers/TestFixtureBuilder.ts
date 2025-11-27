import { TFile } from "obsidian";

export type EffortStatus =
  | "Draft"
  | "Backlog"
  | "Analysis"
  | "To Do"
  | "Doing"
  | "Done"
  | "Trashed";

export type TaskSize = "XXS" | "XS" | "S" | "M" | "L" | "XL";

export interface TaskFixture {
  path: string;
  basename: string;
  label: string;
  status: EffortStatus;
  size?: TaskSize;
  votes?: number;
  area?: string;
  parent?: string;
  day?: string;
  isArchived?: boolean;
  createdAt?: number;
  startTimestamp?: number;
  endTimestamp?: number;
}

export interface ProjectFixture {
  path: string;
  basename: string;
  label: string;
  status: EffortStatus;
  votes?: number;
  area?: string;
  parent?: string;
  isArchived?: boolean;
  createdAt?: number;
}

export interface AreaFixture {
  path: string;
  basename: string;
  label: string;
  parent?: string;
  isArchived?: boolean;
  createdAt?: number;
}

export interface MeetingFixture extends TaskFixture {
  scheduledAt?: number;
}

export interface ConceptFixture {
  path: string;
  basename: string;
  label: string;
  isArchived?: boolean;
  createdAt?: number;
}

export interface MockVaultFixture {
  tasks: TaskFixture[];
  projects: ProjectFixture[];
  areas: AreaFixture[];
  meetings: MeetingFixture[];
  concepts: ConceptFixture[];
}

const STATUS_TO_WIKILINK: Record<EffortStatus, string> = {
  Draft: "[[ems__EffortStatusDraft]]",
  Backlog: "[[ems__EffortStatusBacklog]]",
  Analysis: "[[ems__EffortStatusAnalysis]]",
  "To Do": "[[ems__EffortStatusToDo]]",
  Doing: "[[ems__EffortStatusDoing]]",
  Done: "[[ems__EffortStatusDone]]",
  Trashed: "[[ems__EffortStatusTrashed]]",
};

const SIZE_TO_WIKILINK: Record<TaskSize, string> = {
  XXS: "[[ems__TaskSize_XXS]]",
  XS: "[[ems__TaskSize_XS]]",
  S: "[[ems__TaskSize_S]]",
  M: "[[ems__TaskSize_M]]",
  L: "[[ems__TaskSize_L]]",
  XL: "[[ems__TaskSize_XL]]",
};

let fixtureCounter = 0;

function generateUid(): string {
  fixtureCounter++;
  return `test-uid-${fixtureCounter}-${Date.now()}`;
}

function resetCounter(): void {
  fixtureCounter = 0;
}

export class TestFixtureBuilder {
  static resetFixtureCounter(): void {
    resetCounter();
  }

  static task(overrides: Partial<TaskFixture> = {}): TaskFixture {
    const id = generateUid();
    const basename = overrides.basename || `task-${id}`;
    return {
      path: overrides.path || `tasks/${basename}.md`,
      basename,
      label: overrides.label || `Test Task ${id}`,
      status: overrides.status || "Draft",
      size: overrides.size,
      votes: overrides.votes ?? 0,
      area: overrides.area,
      parent: overrides.parent,
      day: overrides.day,
      isArchived: overrides.isArchived ?? false,
      createdAt: overrides.createdAt ?? Date.now(),
      startTimestamp: overrides.startTimestamp,
      endTimestamp: overrides.endTimestamp,
    };
  }

  static project(overrides: Partial<ProjectFixture> = {}): ProjectFixture {
    const id = generateUid();
    const basename = overrides.basename || `project-${id}`;
    return {
      path: overrides.path || `projects/${basename}.md`,
      basename,
      label: overrides.label || `Test Project ${id}`,
      status: overrides.status || "Draft",
      votes: overrides.votes ?? 0,
      area: overrides.area,
      parent: overrides.parent,
      isArchived: overrides.isArchived ?? false,
      createdAt: overrides.createdAt ?? Date.now(),
    };
  }

  static area(overrides: Partial<AreaFixture> = {}): AreaFixture {
    const id = generateUid();
    const basename = overrides.basename || `area-${id}`;
    return {
      path: overrides.path || `areas/${basename}.md`,
      basename,
      label: overrides.label || `Test Area ${id}`,
      parent: overrides.parent,
      isArchived: overrides.isArchived ?? false,
      createdAt: overrides.createdAt ?? Date.now(),
    };
  }

  static meeting(overrides: Partial<MeetingFixture> = {}): MeetingFixture {
    const id = generateUid();
    const basename = overrides.basename || `meeting-${id}`;
    return {
      path: overrides.path || `meetings/${basename}.md`,
      basename,
      label: overrides.label || `Test Meeting ${id}`,
      status: overrides.status || "Draft",
      size: overrides.size,
      votes: overrides.votes ?? 0,
      area: overrides.area,
      parent: overrides.parent,
      day: overrides.day,
      isArchived: overrides.isArchived ?? false,
      createdAt: overrides.createdAt ?? Date.now(),
      startTimestamp: overrides.startTimestamp,
      endTimestamp: overrides.endTimestamp,
      scheduledAt: overrides.scheduledAt,
    };
  }

  static concept(overrides: Partial<ConceptFixture> = {}): ConceptFixture {
    const id = generateUid();
    const basename = overrides.basename || `concept-${id}`;
    return {
      path: overrides.path || `concepts/${basename}.md`,
      basename,
      label: overrides.label || `Test Concept ${id}`,
      isArchived: overrides.isArchived ?? false,
      createdAt: overrides.createdAt ?? Date.now(),
    };
  }

  static toMetadata(
    fixture: TaskFixture | ProjectFixture | AreaFixture | MeetingFixture | ConceptFixture,
    instanceClass: string,
  ): Record<string, unknown> {
    const metadata: Record<string, unknown> = {
      exo__Instance_class: `[[${instanceClass}]]`,
      exo__Asset_label: fixture.label,
      exo__Asset_uid: generateUid(),
      exo__Asset_createdAt: fixture.createdAt,
      exo__Asset_isArchived: fixture.isArchived,
    };

    if ("status" in fixture) {
      metadata.ems__Effort_status = STATUS_TO_WIKILINK[fixture.status];
    }

    if ("votes" in fixture && fixture.votes !== undefined) {
      metadata.ems__Effort_votes = fixture.votes;
    }

    if ("area" in fixture && fixture.area) {
      metadata.ems__Effort_area = `[[${fixture.area}]]`;
    }

    if ("parent" in fixture && fixture.parent) {
      if (instanceClass === "ems__Area") {
        metadata.ems__Area_parent = `[[${fixture.parent}]]`;
      } else {
        metadata.ems__Effort_parent = `[[${fixture.parent}]]`;
      }
    }

    if ("size" in fixture && fixture.size) {
      metadata.ems__Task_size = SIZE_TO_WIKILINK[fixture.size];
    }

    if ("day" in fixture && fixture.day) {
      metadata.ems__Effort_day = `[[${fixture.day}]]`;
    }

    if ("startTimestamp" in fixture && fixture.startTimestamp) {
      metadata.ems__Effort_startTimestamp = fixture.startTimestamp;
    }

    if ("endTimestamp" in fixture && fixture.endTimestamp) {
      metadata.ems__Effort_endTimestamp = fixture.endTimestamp;
    }

    return metadata;
  }

  static toTFile(fixture: { path: string; basename: string }): TFile {
    return {
      path: fixture.path,
      name: `${fixture.basename}.md`,
      basename: fixture.basename,
      extension: "md",
      parent: null,
      vault: null,
      stat: {
        ctime: Date.now(),
        mtime: Date.now(),
        size: 0,
      },
    } as TFile;
  }

  static emptyVault(): MockVaultFixture {
    return {
      tasks: [],
      projects: [],
      areas: [],
      meetings: [],
      concepts: [],
    };
  }

  static simpleVault(): MockVaultFixture {
    resetCounter();

    const area = TestFixtureBuilder.area({ label: "Work", basename: "work-area" });
    const project = TestFixtureBuilder.project({
      label: "Q1 Goals",
      basename: "q1-goals",
      area: area.basename,
      status: "Doing",
    });
    const task1 = TestFixtureBuilder.task({
      label: "Complete report",
      basename: "complete-report",
      parent: project.basename,
      status: "To Do",
      size: "M",
      votes: 3,
    });
    const task2 = TestFixtureBuilder.task({
      label: "Review PR",
      basename: "review-pr",
      parent: project.basename,
      status: "Doing",
      size: "S",
      votes: 1,
    });
    const task3 = TestFixtureBuilder.task({
      label: "Archive this",
      basename: "archive-this",
      status: "Done",
      isArchived: true,
    });

    return {
      tasks: [task1, task2, task3],
      projects: [project],
      areas: [area],
      meetings: [],
      concepts: [],
    };
  }

  static complexVault(): MockVaultFixture {
    resetCounter();

    const personalArea = TestFixtureBuilder.area({
      label: "Personal",
      basename: "personal-area",
    });
    const workArea = TestFixtureBuilder.area({
      label: "Work",
      basename: "work-area",
    });
    const subArea = TestFixtureBuilder.area({
      label: "Engineering",
      basename: "engineering-area",
      parent: workArea.basename,
    });

    const initiative = TestFixtureBuilder.project({
      label: "2024 Roadmap",
      basename: "2024-roadmap",
      area: workArea.basename,
      status: "Doing",
    });
    const project1 = TestFixtureBuilder.project({
      label: "Feature A",
      basename: "feature-a",
      parent: initiative.basename,
      area: subArea.basename,
      status: "Doing",
      votes: 5,
    });
    const project2 = TestFixtureBuilder.project({
      label: "Feature B",
      basename: "feature-b",
      parent: initiative.basename,
      area: subArea.basename,
      status: "Backlog",
      votes: 2,
    });

    const tasks = [
      TestFixtureBuilder.task({
        label: "Design API",
        basename: "design-api",
        parent: project1.basename,
        status: "Done",
        size: "L",
        votes: 3,
      }),
      TestFixtureBuilder.task({
        label: "Implement API",
        basename: "implement-api",
        parent: project1.basename,
        status: "Doing",
        size: "XL",
        votes: 5,
      }),
      TestFixtureBuilder.task({
        label: "Write tests",
        basename: "write-tests",
        parent: project1.basename,
        status: "To Do",
        size: "M",
        votes: 2,
      }),
      TestFixtureBuilder.task({
        label: "Document feature",
        basename: "document-feature",
        parent: project1.basename,
        status: "Backlog",
        size: "S",
        votes: 1,
      }),
      TestFixtureBuilder.task({
        label: "Research alternatives",
        basename: "research-alternatives",
        parent: project2.basename,
        status: "Draft",
        size: "XS",
        votes: 0,
      }),
      TestFixtureBuilder.task({
        label: "Personal task",
        basename: "personal-task",
        area: personalArea.basename,
        status: "To Do",
        size: "XXS",
      }),
    ];

    const meetings = [
      TestFixtureBuilder.meeting({
        label: "Sprint Planning",
        basename: "sprint-planning",
        parent: project1.basename,
        status: "Done",
        scheduledAt: Date.now() - 86400000,
      }),
      TestFixtureBuilder.meeting({
        label: "Design Review",
        basename: "design-review",
        parent: project1.basename,
        status: "To Do",
        scheduledAt: Date.now() + 86400000,
      }),
    ];

    const concepts = [
      TestFixtureBuilder.concept({
        label: "API Design Patterns",
        basename: "api-design-patterns",
      }),
      TestFixtureBuilder.concept({
        label: "Testing Strategy",
        basename: "testing-strategy",
      }),
    ];

    return {
      tasks,
      projects: [initiative, project1, project2],
      areas: [personalArea, workArea, subArea],
      meetings,
      concepts,
    };
  }

  static withTasksByStatus(
    statuses: EffortStatus[],
  ): { tasks: TaskFixture[]; metadata: Map<string, Record<string, unknown>> } {
    resetCounter();
    const tasks = statuses.map((status, index) =>
      TestFixtureBuilder.task({
        label: `Task ${index + 1} (${status})`,
        basename: `task-${status.toLowerCase().replace(" ", "-")}-${index}`,
        status,
      }),
    );

    const metadata = new Map<string, Record<string, unknown>>();
    tasks.forEach((task) => {
      metadata.set(task.path, TestFixtureBuilder.toMetadata(task, "ems__Task"));
    });

    return { tasks, metadata };
  }

  static withTasksBySize(
    sizes: TaskSize[],
  ): { tasks: TaskFixture[]; metadata: Map<string, Record<string, unknown>> } {
    resetCounter();
    const tasks = sizes.map((size, index) =>
      TestFixtureBuilder.task({
        label: `Task ${index + 1} (${size})`,
        basename: `task-size-${size.toLowerCase()}-${index}`,
        size,
        status: "To Do",
      }),
    );

    const metadata = new Map<string, Record<string, unknown>>();
    tasks.forEach((task) => {
      metadata.set(task.path, TestFixtureBuilder.toMetadata(task, "ems__Task"));
    });

    return { tasks, metadata };
  }

  static withArchivedTasks(
    count: number,
  ): { tasks: TaskFixture[]; metadata: Map<string, Record<string, unknown>> } {
    resetCounter();
    const tasks = Array.from({ length: count }, (_, index) =>
      TestFixtureBuilder.task({
        label: `Archived Task ${index + 1}`,
        basename: `archived-task-${index}`,
        status: "Done",
        isArchived: true,
      }),
    );

    const metadata = new Map<string, Record<string, unknown>>();
    tasks.forEach((task) => {
      metadata.set(task.path, TestFixtureBuilder.toMetadata(task, "ems__Task"));
    });

    return { tasks, metadata };
  }

  static createMockFileCache(
    fixtures: Array<{
      fixture: TaskFixture | ProjectFixture | AreaFixture | MeetingFixture | ConceptFixture;
      instanceClass: string;
    }>,
  ): Map<string, { frontmatter: Record<string, unknown> }> {
    const cache = new Map<string, { frontmatter: Record<string, unknown> }>();

    fixtures.forEach(({ fixture, instanceClass }) => {
      cache.set(fixture.path, {
        frontmatter: TestFixtureBuilder.toMetadata(fixture, instanceClass),
      });
    });

    return cache;
  }
}
