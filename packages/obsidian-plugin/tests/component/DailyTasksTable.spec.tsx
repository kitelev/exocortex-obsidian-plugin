import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import {
  DailyTasksTable,
  DailyTask,
  DailyTasksTableWithToggle,
} from "../../src/presentation/components/DailyTasksTable";

test.describe("DailyTasksTable", () => {
  const mockTasks: DailyTask[] = [
    {
      file: { path: "task1.md", basename: "task1" },
      path: "task1.md",
      title: "Task 1",
      label: "First Task",
      startTime: "09:00",
      endTime: "10:00",
      status: "ems__EffortStatusInProgress",
      metadata: {},
      isDone: false,
      isTrashed: false,
      isMeeting: false,
    },
    {
      file: { path: "task2.md", basename: "task2" },
      path: "task2.md",
      title: "Task 2",
      label: "Second Task",
      startTime: "10:30",
      endTime: "11:30",
      status: "ems__EffortStatusDone",
      metadata: {},
      isDone: true,
      isTrashed: false,
      isMeeting: false,
    },
    {
      file: { path: "meeting1.md", basename: "meeting1" },
      path: "meeting1.md",
      title: "Meeting 1",
      label: "Team Sync",
      startTime: "14:00",
      endTime: "15:00",
      status: "ems__EffortStatusInProgress",
      metadata: {},
      isDone: false,
      isTrashed: false,
      isMeeting: true,
    },
    {
      file: { path: "task3.md", basename: "task3" },
      path: "task3.md",
      title: "Task 3",
      label: "Trashed Task",
      startTime: "",
      endTime: "",
      status: "ems__EffortStatusTrashed",
      metadata: {},
      isDone: false,
      isTrashed: true,
      isMeeting: false,
    },
    {
      file: { path: "meeting2.md", basename: "meeting2" },
      path: "meeting2.md",
      title: "Meeting 2",
      label: "Completed Meeting",
      startTime: "16:00",
      endTime: "17:00",
      status: "ems__EffortStatusDone",
      metadata: {},
      isDone: true,
      isTrashed: false,
      isMeeting: true,
    },
  ];

  test("should render tasks table with all columns", async ({ mount }) => {
    const component = await mount(<DailyTasksTable tasks={mockTasks} />);

    await expect(component.locator("table")).toBeVisible();
    await expect(component.locator("thead th").nth(0)).toContainText("Name");
    await expect(component.locator("thead th").nth(1)).toContainText("Start");
    await expect(component.locator("thead th").nth(2)).toContainText("End");
    await expect(component.locator("thead th").nth(3)).toContainText("Status");
  });

  test("should render all tasks", async ({ mount }) => {
    const component = await mount(<DailyTasksTable tasks={mockTasks} />);

    const rows = component.locator("tbody tr");
    await expect(rows).toHaveCount(5);
  });

  test("should display task with done icon", async ({ mount }) => {
    const component = await mount(<DailyTasksTable tasks={mockTasks} />);

    const doneTask = component.locator('tr[data-path="task2.md"] .task-name a');
    await expect(doneTask).toContainText("✅");
    await expect(doneTask).toContainText("Second Task");
  });

  test("should display task with trashed icon", async ({ mount }) => {
    const component = await mount(<DailyTasksTable tasks={mockTasks} />);

    const trashedTask = component.locator(
      'tr[data-path="task3.md"] .task-name a',
    );
    await expect(trashedTask).toContainText("❌");
    await expect(trashedTask).toContainText("Trashed Task");
  });

  test("should display meeting with meeting icon", async ({ mount }) => {
    const component = await mount(<DailyTasksTable tasks={mockTasks} />);

    const meetingTask = component.locator(
      'tr[data-path="meeting1.md"] .task-name a',
    );
    await expect(meetingTask).toContainText("👥");
    await expect(meetingTask).toContainText("Team Sync");
  });

  test("should display completed meeting with both done and meeting icons", async ({
    mount,
  }) => {
    const component = await mount(<DailyTasksTable tasks={mockTasks} />);

    const completedMeeting = component.locator(
      'tr[data-path="meeting2.md"] .task-name a',
    );
    await expect(completedMeeting).toContainText("✅ 👥");
    await expect(completedMeeting).toContainText("Completed Meeting");
  });

  test("should display start and end times", async ({ mount }) => {
    const component = await mount(<DailyTasksTable tasks={mockTasks} />);

    const taskRow = component.locator('tr[data-path="task1.md"]');
    await expect(taskRow.locator(".task-start")).toContainText("09:00");
    await expect(taskRow.locator(".task-end")).toContainText("10:00");
  });

  test("should display dash for missing times", async ({ mount }) => {
    const component = await mount(<DailyTasksTable tasks={mockTasks} />);

    const taskRow = component.locator('tr[data-path="task3.md"]');
    await expect(taskRow.locator(".task-start")).toContainText("-");
    await expect(taskRow.locator(".task-end")).toContainText("-");
  });

  test("should display status as clickable link", async ({ mount }) => {
    const component = await mount(<DailyTasksTable tasks={mockTasks} />);

    const statusLink = component.locator(
      'tr[data-path="task1.md"] .task-status a',
    );
    await expect(statusLink).toBeVisible();
    await expect(statusLink).toContainText("ems__EffortStatusInProgress");
    await expect(statusLink).toHaveAttribute(
      "data-href",
      "ems__EffortStatusInProgress",
    );
  });

  test("should call onTaskClick when task name is clicked", async ({
    mount,
  }) => {
    let clickedPath = "";
    const component = await mount(
      <DailyTasksTable
        tasks={mockTasks}
        onTaskClick={(path) => {
          clickedPath = path;
        }}
      />,
    );

    await component.locator('tr[data-path="task1.md"] .task-name a').click();
    expect(clickedPath).toBe("task1.md");
  });

  test("should call onTaskClick when status is clicked", async ({ mount }) => {
    let clickedPath = "";
    const component = await mount(
      <DailyTasksTable
        tasks={mockTasks}
        onTaskClick={(path) => {
          clickedPath = path;
        }}
      />,
    );

    await component.locator('tr[data-path="task1.md"] .task-status a').click();
    expect(clickedPath).toBe("ems__EffortStatusInProgress");
  });

  // NOTE: Skipped due to Playwright CT limitation with function props
  // Function props don't serialize correctly across browser/Node boundary
  // Feature is verified working in UI integration tests (UniversalLayoutRenderer.ui.test.ts)
  test.skip("should use getAssetLabel to resolve task names", async ({
    mount,
  }) => {
    const component = await mount(
      <DailyTasksTable
        tasks={mockTasks}
        getAssetLabel={(path) => {
          if (path === "task1.md") return "Custom Label for Task 1";
          return null;
        }}
      />,
    );

    const taskLink = component.locator('tr[data-path="task1.md"] .task-name a');
    await expect(taskLink).toContainText("Custom Label for Task 1");
  });

  test("should render empty table when no tasks", async ({ mount }) => {
    const component = await mount(<DailyTasksTable tasks={[]} />);

    await expect(component.locator("table")).toBeVisible();
    await expect(component.locator("tbody tr")).toHaveCount(0);
  });

  test("should handle task without label", async ({ mount }) => {
    const taskWithoutLabel: DailyTask = {
      file: { path: "no-label.md", basename: "no-label" },
      path: "no-label.md",
      title: "No Label Task",
      label: "",
      startTime: "12:00",
      endTime: "13:00",
      status: "ems__EffortStatusInProgress",
      metadata: {},
      isDone: false,
      isTrashed: false,
      isMeeting: false,
    };

    const component = await mount(
      <DailyTasksTable tasks={[taskWithoutLabel]} />,
    );

    const taskLink = component.locator(
      'tr[data-path="no-label.md"] .task-name a',
    );
    await expect(taskLink).toContainText("No Label Task");
  });

  test("should have correct CSS classes", async ({ mount }) => {
    const component = await mount(<DailyTasksTable tasks={mockTasks} />);

    await expect(
      component.locator("table.exocortex-tasks-table"),
    ).toBeVisible();
    await expect(component).toContainText("Name");
    await expect(component).toContainText("Start");
    await expect(component).toContainText("End");
    await expect(component).toContainText("Status");
  });

  test("should render task links as internal-link class", async ({ mount }) => {
    const component = await mount(<DailyTasksTable tasks={mockTasks} />);

    const taskLinks = component.locator(".task-name a.internal-link");
    await expect(taskLinks).toHaveCount(5);
  });

  test("should show Effort Area column when showEffortArea is true", async ({
    mount,
  }) => {
    const tasksWithArea: DailyTask[] = [
      {
        file: { path: "task1.md", basename: "task1" },
        path: "task1.md",
        title: "Task 1",
        label: "First Task",
        startTime: "09:00",
        endTime: "10:00",
        status: "ems__EffortStatusInProgress",
        metadata: { ems__Effort_area: "[[backend]]" },
        isDone: false,
        isTrashed: false,
        isDoing: false,
        isMeeting: false,
        isBlocked: false,
      },
    ];

    const component = await mount(
      <DailyTasksTable tasks={tasksWithArea} showEffortArea={true} />,
    );

    await expect(component.locator("thead th").nth(4)).toContainText(
      "Effort Area",
    );
    await expect(component.locator(".task-effort-area")).toBeVisible();
  });

  test("should hide Effort Area column when showEffortArea is false", async ({
    mount,
  }) => {
    const component = await mount(
      <DailyTasksTable tasks={mockTasks} showEffortArea={false} />,
    );

    await expect(component.locator("thead th")).toHaveCount(4);
    await expect(component.locator(".task-effort-area")).toHaveCount(0);
  });
});

test.describe("DailyTasksTableWithToggle", () => {
  const mockTasks: DailyTask[] = [
    {
      file: { path: "task1.md", basename: "task1" },
      path: "task1.md",
      title: "Task 1",
      label: "First Task",
      startTime: "09:00",
      endTime: "10:00",
      status: "ems__EffortStatusInProgress",
      metadata: { ems__Effort_area: "[[backend]]" },
      isDone: false,
      isTrashed: false,
      isDoing: false,
      isMeeting: false,
      isBlocked: false,
    },
  ];

  test("should render toggle button", async ({ mount }) => {
    const component = await mount(
      <DailyTasksTableWithToggle
        tasks={mockTasks}
        showEffortArea={false}
        onToggleEffortArea={() => {}}
        showEffortVotes={false}
        onToggleEffortVotes={() => {}}
      />,
    );

    await expect(
      component.locator(".exocortex-toggle-effort-area"),
    ).toBeVisible();
    await expect(
      component.locator(".exocortex-toggle-effort-area"),
    ).toContainText("Show Effort Area");
  });

  test("should show 'Hide Effort Area' when showEffortArea is true", async ({
    mount,
  }) => {
    const component = await mount(
      <DailyTasksTableWithToggle
        tasks={mockTasks}
        showEffortArea={true}
        onToggleEffortArea={() => {}}
        showEffortVotes={false}
        onToggleEffortVotes={() => {}}
      />,
    );

    await expect(
      component.locator(".exocortex-toggle-effort-area"),
    ).toContainText("Hide Effort Area");
  });

  test("should call onToggleEffortArea when button is clicked", async ({
    mount,
  }) => {
    let toggleCalled = false;
    const component = await mount(
      <DailyTasksTableWithToggle
        tasks={mockTasks}
        showEffortArea={false}
        onToggleEffortArea={() => {
          toggleCalled = true;
        }}
        showEffortVotes={false}
        onToggleEffortVotes={() => {}}
      />,
    );

    await component.locator(".exocortex-toggle-effort-area").click();
    expect(toggleCalled).toBe(true);
  });

  test("should show Effort Area column when showEffortArea is true", async ({
    mount,
  }) => {
    const component = await mount(
      <DailyTasksTableWithToggle
        tasks={mockTasks}
        showEffortArea={true}
        onToggleEffortArea={() => {}}
        showEffortVotes={false}
        onToggleEffortVotes={() => {}}
      />,
    );

    await expect(component.locator("thead th").nth(4)).toContainText(
      "Effort Area",
    );
    await expect(component.locator(".task-effort-area")).toBeVisible();
  });

  test("should hide Effort Area column when showEffortArea is false", async ({
    mount,
  }) => {
    const component = await mount(
      <DailyTasksTableWithToggle
        tasks={mockTasks}
        showEffortArea={false}
        onToggleEffortArea={() => {}}
        showEffortVotes={false}
        onToggleEffortVotes={() => {}}
      />,
    );

    await expect(component.locator("thead th")).toHaveCount(4);
    await expect(component.locator(".task-effort-area")).toHaveCount(0);
  });

  test("should persist showEffortArea state after re-renders", async ({
    mount,
  }) => {
    let currentShowEffortArea = false;
    const onToggle = () => {
      currentShowEffortArea = !currentShowEffortArea;
    };

    const component = await mount(
      <DailyTasksTableWithToggle
        tasks={mockTasks}
        showEffortArea={currentShowEffortArea}
        onToggleEffortArea={onToggle}
        showEffortVotes={false}
        onToggleEffortVotes={() => {}}
      />,
    );

    await expect(
      component.locator(".exocortex-toggle-effort-area"),
    ).toContainText("Show Effort Area");

    await component.locator(".exocortex-toggle-effort-area").click();
    expect(currentShowEffortArea).toBe(true);
  });

  test("should render Votes toggle button", async ({ mount }) => {
    const component = await mount(
      <DailyTasksTableWithToggle
        tasks={mockTasks}
        showEffortArea={false}
        onToggleEffortArea={() => {}}
        showEffortVotes={false}
        onToggleEffortVotes={() => {}}
      />,
    );

    await expect(
      component.locator(".exocortex-toggle-effort-votes"),
    ).toBeVisible();
    await expect(
      component.locator(".exocortex-toggle-effort-votes"),
    ).toContainText("Show Votes");
  });

  test("should show 'Hide Votes' when showEffortVotes is true", async ({
    mount,
  }) => {
    const component = await mount(
      <DailyTasksTableWithToggle
        tasks={mockTasks}
        showEffortArea={false}
        onToggleEffortArea={() => {}}
        showEffortVotes={true}
        onToggleEffortVotes={() => {}}
      />,
    );

    await expect(
      component.locator(".exocortex-toggle-effort-votes"),
    ).toContainText("Hide Votes");
  });

  test("should call onToggleEffortVotes when button is clicked", async ({
    mount,
  }) => {
    let toggleCalled = false;
    const component = await mount(
      <DailyTasksTableWithToggle
        tasks={mockTasks}
        showEffortArea={false}
        onToggleEffortArea={() => {}}
        showEffortVotes={false}
        onToggleEffortVotes={() => {
          toggleCalled = true;
        }}
      />,
    );

    await component.locator(".exocortex-toggle-effort-votes").click();
    expect(toggleCalled).toBe(true);
  });

  test("should show Votes column when showEffortVotes is true", async ({
    mount,
  }) => {
    const tasksWithVotes: DailyTask[] = [
      {
        file: { path: "task1.md", basename: "task1" },
        path: "task1.md",
        title: "Task 1",
        label: "First Task",
        startTime: "09:00",
        endTime: "10:00",
        status: "ems__EffortStatusInProgress",
        metadata: { ems__Effort_votes: 3 },
        isDone: false,
        isTrashed: false,
        isDoing: false,
        isMeeting: false,
        isBlocked: false,
      },
    ];

    const component = await mount(
      <DailyTasksTableWithToggle
        tasks={tasksWithVotes}
        showEffortArea={false}
        onToggleEffortArea={() => {}}
        showEffortVotes={true}
        onToggleEffortVotes={() => {}}
      />,
    );

    await expect(component.locator("thead th").nth(4)).toContainText("Votes");
    await expect(component.locator(".task-effort-votes")).toBeVisible();
    await expect(component.locator(".task-effort-votes")).toContainText("3");
  });

  test("should hide Votes column when showEffortVotes is false", async ({
    mount,
  }) => {
    const component = await mount(
      <DailyTasksTableWithToggle
        tasks={mockTasks}
        showEffortArea={false}
        onToggleEffortArea={() => {}}
        showEffortVotes={false}
        onToggleEffortVotes={() => {}}
      />,
    );

    await expect(component.locator(".task-effort-votes")).toHaveCount(0);
  });

  test("should display dash when votes are not set", async ({ mount }) => {
    const tasksWithoutVotes: DailyTask[] = [
      {
        file: { path: "task1.md", basename: "task1" },
        path: "task1.md",
        title: "Task 1",
        label: "First Task",
        startTime: "09:00",
        endTime: "10:00",
        status: "ems__EffortStatusInProgress",
        metadata: {},
        isDone: false,
        isTrashed: false,
        isDoing: false,
        isMeeting: false,
        isBlocked: false,
      },
    ];

    const component = await mount(
      <DailyTasksTableWithToggle
        tasks={tasksWithoutVotes}
        showEffortArea={false}
        onToggleEffortArea={() => {}}
        showEffortVotes={true}
        onToggleEffortVotes={() => {}}
      />,
    );

    await expect(component.locator(".task-effort-votes")).toContainText("-");
  });
});
