import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import {
  DailyProjectsTable,
  DailyProject,
  DailyProjectsTableWithToggle,
} from "../../src/presentation/components/DailyProjectsTable";

test.describe("DailyProjectsTable", () => {
  const mockProjects: DailyProject[] = [
    {
      file: { path: "project1.md", basename: "project1" },
      path: "project1.md",
      title: "Project 1",
      label: "First Project",
      startTime: "09:00",
      endTime: "17:00",
      startTimestamp: new Date("2025-01-15T09:00:00").getTime(),
      endTimestamp: new Date("2025-01-15T17:00:00").getTime(),
      status: "ems__EffortStatusInProgress",
      metadata: {},
      isDone: false,
      isTrashed: false,
      isBlocked: false,
    },
    {
      file: { path: "project2.md", basename: "project2" },
      path: "project2.md",
      title: "Project 2",
      label: "Second Project",
      startTime: "10:00",
      endTime: "18:00",
      startTimestamp: new Date("2025-01-15T10:00:00").getTime(),
      endTimestamp: new Date("2025-01-15T18:00:00").getTime(),
      status: "ems__EffortStatusDone",
      metadata: {},
      isDone: true,
      isTrashed: false,
      isBlocked: false,
    },
    {
      file: { path: "project3.md", basename: "project3" },
      path: "project3.md",
      title: "Project 3",
      label: "Trashed Project",
      startTime: "",
      endTime: "",
      startTimestamp: null,
      endTimestamp: null,
      status: "ems__EffortStatusTrashed",
      metadata: {},
      isDone: false,
      isTrashed: true,
      isBlocked: false,
    },
  ];

  test("should render projects table with all columns", async ({ mount }) => {
    const component = await mount(<DailyProjectsTable projects={mockProjects} />);

    await expect(component.locator("table")).toBeVisible();
    await expect(component.locator("thead th").nth(0)).toContainText("Name");
    await expect(component.locator("thead th").nth(1)).toContainText("Start");
    await expect(component.locator("thead th").nth(2)).toContainText("End");
    await expect(component.locator("thead th").nth(3)).toContainText("Status");
  });

  test("should render all projects", async ({ mount }) => {
    const component = await mount(<DailyProjectsTable projects={mockProjects} />);

    const rows = component.locator("tbody tr");
    await expect(rows).toHaveCount(3);
  });

  test("should display project with done icon", async ({ mount }) => {
    const component = await mount(<DailyProjectsTable projects={mockProjects} />);

    const doneProject = component.locator(
      'tr[data-path="project2.md"] .project-name a',
    );
    await expect(doneProject).toContainText("✅");
    await expect(doneProject).toContainText("Second Project");
  });

  test("should display project with trashed icon", async ({ mount }) => {
    const component = await mount(<DailyProjectsTable projects={mockProjects} />);

    const trashedProject = component.locator(
      'tr[data-path="project3.md"] .project-name a',
    );
    await expect(trashedProject).toContainText("❌");
    await expect(trashedProject).toContainText("Trashed Project");
  });

  test("should display project with package icon for in-progress", async ({
    mount,
  }) => {
    const component = await mount(<DailyProjectsTable projects={mockProjects} />);

    const activeProject = component.locator(
      'tr[data-path="project1.md"] .project-name a',
    );
    await expect(activeProject).toContainText("📦");
    await expect(activeProject).toContainText("First Project");
  });

  test("should display start and end times", async ({ mount }) => {
    const component = await mount(<DailyProjectsTable projects={mockProjects} />);

    const projectRow = component.locator('tr[data-path="project1.md"]');
    await expect(projectRow.locator(".project-start")).toContainText("09:00");
    await expect(projectRow.locator(".project-end")).toContainText("17:00");
  });

  test("should display dash for missing times", async ({ mount }) => {
    const component = await mount(<DailyProjectsTable projects={mockProjects} />);

    const projectRow = component.locator('tr[data-path="project3.md"]');
    await expect(projectRow.locator(".project-start")).toContainText("-");
    await expect(projectRow.locator(".project-end")).toContainText("-");
  });

  test("should display status as clickable link", async ({ mount }) => {
    const component = await mount(<DailyProjectsTable projects={mockProjects} />);

    const statusLink = component.locator(
      'tr[data-path="project1.md"] .project-status a',
    );
    await expect(statusLink).toBeVisible();
    await expect(statusLink).toContainText("ems__EffortStatusInProgress");
    await expect(statusLink).toHaveAttribute(
      "data-href",
      "ems__EffortStatusInProgress",
    );
  });

  test("should call onProjectClick when project name is clicked", async ({
    mount,
  }) => {
    let clickedPath = "";
    const component = await mount(
      <DailyProjectsTable
        projects={mockProjects}
        onProjectClick={(path) => {
          clickedPath = path;
        }}
      />,
    );

    await component
      .locator('tr[data-path="project1.md"] .project-name a')
      .click();
    expect(clickedPath).toBe("project1.md");
  });

  test("should call onProjectClick when status is clicked", async ({
    mount,
  }) => {
    let clickedPath = "";
    const component = await mount(
      <DailyProjectsTable
        projects={mockProjects}
        onProjectClick={(path) => {
          clickedPath = path;
        }}
      />,
    );

    await component
      .locator('tr[data-path="project1.md"] .project-status a')
      .click();
    expect(clickedPath).toBe("ems__EffortStatusInProgress");
  });

  test("should display blocker icon when project is blocked", async ({
    mount,
  }) => {
    const blockedProject: DailyProject = {
      file: { path: "blocked-project.md", basename: "blocked-project" },
      path: "blocked-project.md",
      title: "Blocked Project",
      label: "Blocked Project",
      startTime: "09:00",
      endTime: "17:00",
      status: "ems__EffortStatusInProgress",
      metadata: {},
      isDone: false,
      isTrashed: false,
      isBlocked: true,
    };

    const component = await mount(
      <DailyProjectsTable projects={[blockedProject]} />,
    );

    const projectName = component.locator(
      'tr[data-path="blocked-project.md"] .project-name a',
    );
    await expect(projectName).toContainText("🚩");
    await expect(projectName).toContainText("📦");
    await expect(projectName).toContainText("Blocked Project");
  });

  test("should not display blocker icon when project is not blocked", async ({
    mount,
  }) => {
    const unblockedProject: DailyProject = {
      file: { path: "unblocked-project.md", basename: "unblocked-project" },
      path: "unblocked-project.md",
      title: "Unblocked Project",
      label: "Unblocked Project",
      startTime: "09:00",
      endTime: "17:00",
      status: "ems__EffortStatusInProgress",
      metadata: {},
      isDone: false,
      isTrashed: false,
      isBlocked: false,
    };

    const component = await mount(
      <DailyProjectsTable projects={[unblockedProject]} />,
    );

    const projectName = component.locator(
      'tr[data-path="unblocked-project.md"] .project-name a',
    );
    const text = await projectName.textContent();
    expect(text).not.toContain("🚩");
  });

  test("should render empty table when no projects", async ({ mount }) => {
    const component = await mount(<DailyProjectsTable projects={[]} />);

    await expect(component.locator("table")).toBeVisible();
    await expect(component.locator("tbody tr")).toHaveCount(0);
  });

  test("should handle project without label", async ({ mount }) => {
    const projectWithoutLabel: DailyProject = {
      file: { path: "no-label.md", basename: "no-label" },
      path: "no-label.md",
      title: "No Label Project",
      label: "",
      startTime: "12:00",
      endTime: "13:00",
      status: "ems__EffortStatusInProgress",
      metadata: {},
      isDone: false,
      isTrashed: false,
      isBlocked: false,
    };

    const component = await mount(
      <DailyProjectsTable projects={[projectWithoutLabel]} />,
    );

    const projectLink = component.locator(
      'tr[data-path="no-label.md"] .project-name a',
    );
    await expect(projectLink).toContainText("No Label Project");
  });

  test("should have correct CSS classes", async ({ mount }) => {
    const component = await mount(<DailyProjectsTable projects={mockProjects} />);

    await expect(
      component.locator("table.exocortex-projects-table"),
    ).toBeVisible();
    await expect(component).toContainText("Name");
    await expect(component).toContainText("Start");
    await expect(component).toContainText("End");
    await expect(component).toContainText("Status");
  });

  test("should render project links as internal-link class", async ({
    mount,
  }) => {
    const component = await mount(<DailyProjectsTable projects={mockProjects} />);

    const projectLinks = component.locator(".project-name a.internal-link");
    await expect(projectLinks).toHaveCount(3);
  });

  test("should have sortable headers with pointer cursor", async ({ mount }) => {
    const component = await mount(<DailyProjectsTable projects={mockProjects} />);

    const nameHeader = component.locator('thead th:has-text("Name")');
    await expect(nameHeader).toHaveClass(/sortable/);
    await expect(nameHeader).toHaveCSS("cursor", "pointer");

    const startHeader = component.locator('thead th:has-text("Start")');
    await expect(startHeader).toHaveClass(/sortable/);

    const endHeader = component.locator('thead th:has-text("End")');
    await expect(endHeader).toHaveClass(/sortable/);

    const statusHeader = component.locator('thead th:has-text("Status")');
    await expect(statusHeader).toHaveClass(/sortable/);
  });

  test("should sort projects by name ascending on first click", async ({ mount }) => {
    const component = await mount(<DailyProjectsTable projects={mockProjects} />);

    await component.locator('thead th:has-text("Name")').click();

    const rows = component.locator("tbody tr");
    await expect(rows).toHaveCount(3);

    await expect(component.locator('thead th:has-text("Name")')).toContainText("↑");
  });

  test("should sort projects by name descending on second click", async ({ mount }) => {
    const component = await mount(<DailyProjectsTable projects={mockProjects} />);

    const nameHeader = component.locator('thead th:has-text("Name")');
    await nameHeader.click();
    await nameHeader.click();

    const rows = component.locator("tbody tr");
    await expect(rows).toHaveCount(3);

    await expect(nameHeader).toContainText("↓");
  });

  test("should sort projects by start time", async ({ mount }) => {
    const component = await mount(<DailyProjectsTable projects={mockProjects} />);

    await component.locator('thead th:has-text("Start")').click();

    const rows = component.locator("tbody tr");
    const lastRow = rows.last();
    await expect(lastRow.locator(".project-start")).toContainText("10:00");
  });

  test("should sort projects by end time", async ({ mount }) => {
    const component = await mount(<DailyProjectsTable projects={mockProjects} />);

    await component.locator('thead th:has-text("End")').click();

    const rows = component.locator("tbody tr");
    const lastRow = rows.last();
    await expect(lastRow.locator(".project-end")).toContainText("18:00");
  });

  test("should sort projects by status", async ({ mount }) => {
    const component = await mount(<DailyProjectsTable projects={mockProjects} />);

    await component.locator('thead th:has-text("Status")').click();

    await expect(component.locator('thead th:has-text("Status")')).toContainText("↑");
  });

  test("should filter archived projects when showArchived is false", async ({
    mount,
  }) => {
    const projectsWithArchived: DailyProject[] = [
      {
        file: { path: "project1.md", basename: "project1" },
        path: "project1.md",
        title: "Active Project",
        label: "Active",
        startTime: "09:00",
        endTime: "10:00",
        startTimestamp: new Date("2025-01-15T09:00:00").getTime(),
        endTimestamp: new Date("2025-01-15T10:00:00").getTime(),
        status: "ems__EffortStatusInProgress",
        metadata: { exo__Asset_isArchived: false },
        isDone: false,
        isTrashed: false,
        isBlocked: false,
      },
      {
        file: { path: "project2.md", basename: "project2" },
        path: "project2.md",
        title: "Archived Project",
        label: "Archived",
        startTime: "11:00",
        endTime: "12:00",
        startTimestamp: new Date("2025-01-15T11:00:00").getTime(),
        endTimestamp: new Date("2025-01-15T12:00:00").getTime(),
        status: "ems__EffortStatusDone",
        metadata: { exo__Asset_isArchived: true },
        isDone: true,
        isTrashed: false,
        isBlocked: false,
      },
    ];

    const component = await mount(
      <DailyProjectsTable projects={projectsWithArchived} showArchived={false} />,
    );

    const rows = component.locator("tbody tr");
    await expect(rows).toHaveCount(1);
    await expect(rows.first().locator(".project-name a")).toContainText("Active");
  });

  test("should show all projects when showArchived is true", async ({
    mount,
  }) => {
    const projectsWithArchived: DailyProject[] = [
      {
        file: { path: "project1.md", basename: "project1" },
        path: "project1.md",
        title: "Active Project",
        label: "Active",
        startTime: "09:00",
        endTime: "10:00",
        startTimestamp: new Date("2025-01-15T09:00:00").getTime(),
        endTimestamp: new Date("2025-01-15T10:00:00").getTime(),
        status: "ems__EffortStatusInProgress",
        metadata: { exo__Asset_isArchived: false },
        isDone: false,
        isTrashed: false,
        isBlocked: false,
      },
      {
        file: { path: "project2.md", basename: "project2" },
        path: "project2.md",
        title: "Archived Project",
        label: "Archived",
        startTime: "11:00",
        endTime: "12:00",
        startTimestamp: new Date("2025-01-15T11:00:00").getTime(),
        endTimestamp: new Date("2025-01-15T12:00:00").getTime(),
        status: "ems__EffortStatusDone",
        metadata: { exo__Asset_isArchived: true },
        isDone: true,
        isTrashed: false,
        isBlocked: false,
      },
    ];

    const component = await mount(
      <DailyProjectsTable projects={projectsWithArchived} showArchived={true} />,
    );

    const rows = component.locator("tbody tr");
    await expect(rows).toHaveCount(2);
  });
});

test.describe("DailyProjectsTableWithToggle", () => {
  const mockProjects: DailyProject[] = [
    {
      file: { path: "project1.md", basename: "project1" },
      path: "project1.md",
      title: "Project 1",
      label: "First Project",
      startTime: "09:00",
      endTime: "10:00",
      status: "ems__EffortStatusInProgress",
      metadata: { exo__Asset_isArchived: false },
      isDone: false,
      isTrashed: false,
      isBlocked: false,
    },
    {
      file: { path: "project2.md", basename: "project2" },
      path: "project2.md",
      title: "Project 2",
      label: "Archived Project",
      startTime: "11:00",
      endTime: "12:00",
      status: "ems__EffortStatusDone",
      metadata: { exo__Asset_isArchived: true },
      isDone: true,
      isTrashed: false,
      isBlocked: false,
    },
  ];

  test("should render toggle button for archived projects", async ({
    mount,
  }) => {
    const component = await mount(
      <DailyProjectsTableWithToggle
        projects={mockProjects}
        showArchived={false}
        onToggleArchived={() => {}}
      />,
    );

    await expect(
      component.locator(".exocortex-toggle-archived"),
    ).toBeVisible();
    await expect(
      component.locator(".exocortex-toggle-archived"),
    ).toContainText("Show Archived");
  });

  test("should show 'Hide Archived' when showArchived is true", async ({
    mount,
  }) => {
    const component = await mount(
      <DailyProjectsTableWithToggle
        projects={mockProjects}
        showArchived={true}
        onToggleArchived={() => {}}
      />,
    );

    await expect(
      component.locator(".exocortex-toggle-archived"),
    ).toContainText("Hide Archived");
  });

  test("should call onToggleArchived when button is clicked", async ({
    mount,
  }) => {
    let toggleCalled = false;
    const component = await mount(
      <DailyProjectsTableWithToggle
        projects={mockProjects}
        showArchived={false}
        onToggleArchived={() => {
          toggleCalled = true;
        }}
      />,
    );

    await component.locator(".exocortex-toggle-archived").click();
    expect(toggleCalled).toBe(true);
  });

  test("should filter archived projects when showArchived is false", async ({
    mount,
  }) => {
    const component = await mount(
      <DailyProjectsTableWithToggle
        projects={mockProjects}
        showArchived={false}
        onToggleArchived={() => {}}
      />,
    );

    const rows = component.locator("tbody tr");
    await expect(rows).toHaveCount(1);
    await expect(rows.first().locator(".project-name a")).toContainText(
      "First Project",
    );
  });

  test("should show all projects when showArchived is true", async ({
    mount,
  }) => {
    const component = await mount(
      <DailyProjectsTableWithToggle
        projects={mockProjects}
        showArchived={true}
        onToggleArchived={() => {}}
      />,
    );

    const rows = component.locator("tbody tr");
    await expect(rows).toHaveCount(2);
  });
});
