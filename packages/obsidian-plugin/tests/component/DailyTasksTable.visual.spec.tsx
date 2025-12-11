import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import {
  DailyTasksTable,
  DailyTask,
  DailyTasksTableWithToggle,
} from "../../src/presentation/components/DailyTasksTable";

/**
 * Visual Regression Tests for DailyTasksTable Component
 *
 * These tests capture screenshots to detect visual regressions in:
 * - Table layout and styling
 * - Status icons (✅, ❌, 🚩, 🔄, 👥)
 * - Column sorting indicators
 * - Empty slots display
 * - Toggle button states
 *
 * Run with: npm run test:component -- DailyTasksTable.visual
 * Update snapshots: npx playwright test --update-snapshots
 */
test.describe("DailyTasksTable Visual Regression", () => {
  const mockTasks: DailyTask[] = [
    {
      file: { path: "task1.md", basename: "task1" },
      path: "task1.md",
      title: "Task 1",
      label: "First Task",
      startTime: "09:00",
      endTime: "10:00",
      startTimestamp: new Date("2025-01-15T09:00:00").getTime(),
      endTimestamp: new Date("2025-01-15T10:00:00").getTime(),
      status: "In Progress",
      metadata: {},
      isDone: false,
      isTrashed: false,
      isDoing: false,
      isMeeting: false,
      isBlocked: false,
    },
    {
      file: { path: "task2.md", basename: "task2" },
      path: "task2.md",
      title: "Task 2",
      label: "Completed Task",
      startTime: "10:30",
      endTime: "11:30",
      startTimestamp: new Date("2025-01-15T10:30:00").getTime(),
      endTimestamp: new Date("2025-01-15T11:30:00").getTime(),
      status: "Done",
      metadata: {},
      isDone: true,
      isTrashed: false,
      isDoing: false,
      isMeeting: false,
      isBlocked: false,
    },
    {
      file: { path: "meeting1.md", basename: "meeting1" },
      path: "meeting1.md",
      title: "Meeting 1",
      label: "Team Sync",
      startTime: "14:00",
      endTime: "15:00",
      startTimestamp: new Date("2025-01-15T14:00:00").getTime(),
      endTimestamp: new Date("2025-01-15T15:00:00").getTime(),
      status: "In Progress",
      metadata: {},
      isDone: false,
      isTrashed: false,
      isDoing: false,
      isMeeting: true,
      isBlocked: false,
    },
    {
      file: { path: "doing-task.md", basename: "doing-task" },
      path: "doing-task.md",
      title: "Active Task",
      label: "Currently Working On",
      startTime: "08:00",
      endTime: "12:00",
      startTimestamp: new Date("2025-01-15T08:00:00").getTime(),
      endTimestamp: new Date("2025-01-15T12:00:00").getTime(),
      status: "Doing",
      metadata: {},
      isDone: false,
      isTrashed: false,
      isDoing: true,
      isMeeting: false,
      isBlocked: false,
    },
    {
      file: { path: "blocked-task.md", basename: "blocked-task" },
      path: "blocked-task.md",
      title: "Blocked Task",
      label: "Waiting for Review",
      startTime: "16:00",
      endTime: "17:00",
      startTimestamp: new Date("2025-01-15T16:00:00").getTime(),
      endTimestamp: new Date("2025-01-15T17:00:00").getTime(),
      status: "Blocked",
      metadata: {},
      isDone: false,
      isTrashed: false,
      isDoing: false,
      isMeeting: false,
      isBlocked: true,
    },
  ];

  test("default table layout with all status icons", async ({ mount }) => {
    const component = await mount(
      <div style={{ width: "800px", padding: "20px" }}>
        <DailyTasksTable tasks={mockTasks} showEmptySlots={false} />
      </div>,
    );

    await expect(component).toHaveScreenshot("table-default.png");
  });

  test("table with effort area column", async ({ mount }) => {
    const tasksWithArea: DailyTask[] = mockTasks.map((task, index) => ({
      ...task,
      metadata: { ems__Effort_area: `[[area-${index}]]` },
    }));

    const component = await mount(
      <div style={{ width: "900px", padding: "20px" }}>
        <DailyTasksTable
          tasks={tasksWithArea}
          showEffortArea={true}
          showEmptySlots={false}
        />
      </div>,
    );

    await expect(component).toHaveScreenshot("table-with-effort-area.png");
  });

  test("table with votes column", async ({ mount }) => {
    const tasksWithVotes: DailyTask[] = mockTasks.map((task, index) => ({
      ...task,
      metadata: { ems__Effort_votes: (index + 1) * 2 },
    }));

    const component = await mount(
      <div style={{ width: "900px", padding: "20px" }}>
        <DailyTasksTable
          tasks={tasksWithVotes}
          showEffortVotes={true}
          showEmptySlots={false}
        />
      </div>,
    );

    await expect(component).toHaveScreenshot("table-with-votes.png");
  });

  test("table with empty slots displayed", async ({ mount }) => {
    const tasksWithGap: DailyTask[] = [
      {
        file: { path: "task1.md", basename: "task1" },
        path: "task1.md",
        title: "Morning Task",
        label: "Morning Task",
        startTime: "09:00",
        endTime: "10:00",
        startTimestamp: new Date("2025-01-15T09:00:00").getTime(),
        endTimestamp: new Date("2025-01-15T10:00:00").getTime(),
        status: "In Progress",
        metadata: {},
        isDone: false,
        isTrashed: false,
        isDoing: false,
        isMeeting: false,
        isBlocked: false,
      },
      {
        file: { path: "task2.md", basename: "task2" },
        path: "task2.md",
        title: "Afternoon Task",
        label: "Afternoon Task",
        startTime: "14:00",
        endTime: "15:00",
        startTimestamp: new Date("2025-01-15T14:00:00").getTime(),
        endTimestamp: new Date("2025-01-15T15:00:00").getTime(),
        status: "In Progress",
        metadata: {},
        isDone: false,
        isTrashed: false,
        isDoing: false,
        isMeeting: false,
        isBlocked: false,
      },
    ];

    const component = await mount(
      <div style={{ width: "800px", padding: "20px" }}>
        <DailyTasksTable tasks={tasksWithGap} showEmptySlots={true} />
      </div>,
    );

    await expect(component).toHaveScreenshot("table-with-empty-slots.png");
  });

  test("sorted by name ascending", async ({ mount, page }) => {
    const component = await mount(
      <div style={{ width: "800px", padding: "20px" }}>
        <DailyTasksTable tasks={mockTasks} showEmptySlots={false} />
      </div>,
    );

    // Click name header to sort
    await component.locator('th:has-text("Name")').click();
    await page.waitForTimeout(100);

    await expect(component).toHaveScreenshot("table-sorted-name-asc.png");
  });

  test("sorted by name descending", async ({ mount, page }) => {
    const component = await mount(
      <div style={{ width: "800px", padding: "20px" }}>
        <DailyTasksTable tasks={mockTasks} showEmptySlots={false} />
      </div>,
    );

    // Click name header twice to sort descending
    await component.locator('th:has-text("Name")').click();
    await component.locator('th:has-text("Name")').click();
    await page.waitForTimeout(100);

    await expect(component).toHaveScreenshot("table-sorted-name-desc.png");
  });

  test("empty table state", async ({ mount }) => {
    const component = await mount(
      <div style={{ width: "800px", padding: "20px" }}>
        <DailyTasksTable tasks={[]} showEmptySlots={false} />
      </div>,
    );

    await expect(component).toHaveScreenshot("table-empty.png");
  });
});

test.describe("DailyTasksTableWithToggle Visual Regression", () => {
  const mockTasks: DailyTask[] = [
    {
      file: { path: "task1.md", basename: "task1" },
      path: "task1.md",
      title: "Task 1",
      label: "Sample Task",
      startTime: "09:00",
      endTime: "10:00",
      status: "In Progress",
      metadata: { ems__Effort_area: "[[backend]]", ems__Effort_votes: 5 },
      isDone: false,
      isTrashed: false,
      isDoing: false,
      isMeeting: false,
      isBlocked: false,
    },
  ];

  test("toggle buttons default state", async ({ mount }) => {
    const component = await mount(
      <div style={{ width: "800px", padding: "20px" }}>
        <DailyTasksTableWithToggle
          tasks={mockTasks}
          showEffortArea={false}
          onToggleEffortArea={() => {}}
          showEffortVotes={false}
          onToggleEffortVotes={() => {}}
        />
      </div>,
    );

    await expect(component).toHaveScreenshot("table-toggle-default.png");
  });

  test("toggle buttons with all columns shown", async ({ mount }) => {
    const component = await mount(
      <div style={{ width: "900px", padding: "20px" }}>
        <DailyTasksTableWithToggle
          tasks={mockTasks}
          showEffortArea={true}
          onToggleEffortArea={() => {}}
          showEffortVotes={true}
          onToggleEffortVotes={() => {}}
        />
      </div>,
    );

    await expect(component).toHaveScreenshot("table-toggle-all-columns.png");
  });

  test("toggle buttons with archived toggle", async ({ mount }) => {
    const component = await mount(
      <div style={{ width: "900px", padding: "20px" }}>
        <DailyTasksTableWithToggle
          tasks={mockTasks}
          showEffortArea={false}
          onToggleEffortArea={() => {}}
          showEffortVotes={false}
          onToggleEffortVotes={() => {}}
          showArchived={false}
          onToggleArchived={() => {}}
        />
      </div>,
    );

    await expect(component).toHaveScreenshot("table-toggle-with-archived.png");
  });

  test("toggle buttons with empty slots toggle", async ({ mount }) => {
    const component = await mount(
      <div style={{ width: "900px", padding: "20px" }}>
        <DailyTasksTableWithToggle
          tasks={mockTasks}
          showEffortArea={false}
          onToggleEffortArea={() => {}}
          showEffortVotes={false}
          onToggleEffortVotes={() => {}}
          showEmptySlots={true}
          onToggleEmptySlots={() => {}}
        />
      </div>,
    );

    await expect(component).toHaveScreenshot(
      "table-toggle-with-empty-slots.png",
    );
  });
});
