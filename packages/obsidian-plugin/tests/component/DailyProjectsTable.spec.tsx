import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import {
  DailyProjectsTable,
  DailyProject,
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

  test("should sort projects by name when clicking Name header", async ({
    mount,
  }) => {
    const component = await mount(<DailyProjectsTable projects={mockProjects} />);

    // Click Name header to sort ascending
    await component.locator('th:has-text("Name")').click();

    // Check ascending sort indicator
    await expect(
      component.locator('th:has-text("Name"):has-text("↑")'),
    ).toBeVisible();

    // Click again to sort descending
    await component.locator('th:has-text("Name")').click();

    // Check descending sort indicator
    await expect(
      component.locator('th:has-text("Name"):has-text("↓")'),
    ).toBeVisible();

    // Click third time to reset sorting
    await component.locator('th:has-text("Name")').click();

    // Check no sort indicator
    await expect(
      component.locator('th:has-text("Name"):has-text("↑")'),
    ).not.toBeVisible();
    await expect(
      component.locator('th:has-text("Name"):has-text("↓")'),
    ).not.toBeVisible();
  });

  test("should sort projects by start time when clicking Start header", async ({
    mount,
  }) => {
    const component = await mount(<DailyProjectsTable projects={mockProjects} />);

    // Click Start header to sort
    await component.locator('th:has-text("Start")').click();

    // Check sort indicator appears
    await expect(
      component.locator('th:has-text("Start"):has-text("↑")'),
    ).toBeVisible();
  });

  test("should sort projects by status when clicking Status header", async ({
    mount,
  }) => {
    const component = await mount(<DailyProjectsTable projects={mockProjects} />);

    // Click Status header to sort
    await component.locator('th:has-text("Status")').click();

    // Check sort indicator appears
    await expect(
      component.locator('th:has-text("Status"):has-text("↑")'),
    ).toBeVisible();
  });

  test("should have sortable class on all header cells", async ({ mount }) => {
    const component = await mount(<DailyProjectsTable projects={mockProjects} />);

    // Check that headers have sortable class
    await expect(component.locator('th.sortable:has-text("Name")')).toBeVisible();
    await expect(component.locator('th.sortable:has-text("Start")')).toBeVisible();
    await expect(component.locator('th.sortable:has-text("End")')).toBeVisible();
    await expect(component.locator('th.sortable:has-text("Status")')).toBeVisible();
  });
});
