/**
 * Visual Regression Tests for DailyTasksTable Component
 *
 * Tests visual appearance of the DailyTasksTable component
 * including task icons, status indicators, and table layout.
 *
 * Run with: npm run test:component
 * Update snapshots: npm run test:component -- --update-snapshots
 */
import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import {
  DailyTasksTable,
  DailyTask,
} from "../../../src/presentation/components/DailyTasksTable";

test.describe("DailyTasksTable Visual Regression", () => {
  const baseTasks: DailyTask[] = [
    {
      file: { path: "task1.md", basename: "task1" },
      path: "task1.md",
      title: "Task 1",
      label: "Regular Task",
      startTime: "09:00",
      endTime: "10:00",
      startTimestamp: null,
      endTimestamp: null,
      status: "ems__EffortStatusInProgress",
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
      startTimestamp: null,
      endTimestamp: null,
      status: "ems__EffortStatusDone",
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
      title: "Meeting",
      label: "Team Sync",
      startTime: "14:00",
      endTime: "15:00",
      startTimestamp: null,
      endTimestamp: null,
      status: "ems__EffortStatusInProgress",
      metadata: {},
      isDone: false,
      isTrashed: false,
      isDoing: false,
      isMeeting: true,
      isBlocked: false,
    },
  ];

  test("default table layout", async ({ mount }) => {
    const component = await mount(<DailyTasksTable tasks={baseTasks} />);
    await expect(component).toHaveScreenshot("table-default.png");
  });

  test("table with all status icons", async ({ mount }) => {
    const tasksWithIcons: DailyTask[] = [
      {
        file: { path: "done.md", basename: "done" },
        path: "done.md",
        title: "Done Task",
        label: "Done Task",
        startTime: "09:00",
        endTime: "10:00",
        startTimestamp: null,
        endTimestamp: null,
        status: "ems__EffortStatusDone",
        metadata: {},
        isDone: true,
        isTrashed: false,
        isDoing: false,
        isMeeting: false,
        isBlocked: false,
      },
      {
        file: { path: "doing.md", basename: "doing" },
        path: "doing.md",
        title: "Doing Task",
        label: "Doing Task",
        startTime: "10:00",
        endTime: "11:00",
        startTimestamp: null,
        endTimestamp: null,
        status: "ems__EffortStatusDoing",
        metadata: {},
        isDone: false,
        isTrashed: false,
        isDoing: true,
        isMeeting: false,
        isBlocked: false,
      },
      {
        file: { path: "trashed.md", basename: "trashed" },
        path: "trashed.md",
        title: "Trashed Task",
        label: "Trashed Task",
        startTime: "11:00",
        endTime: "12:00",
        startTimestamp: null,
        endTimestamp: null,
        status: "ems__EffortStatusTrashed",
        metadata: {},
        isDone: false,
        isTrashed: true,
        isDoing: false,
        isMeeting: false,
        isBlocked: false,
      },
      {
        file: { path: "meeting.md", basename: "meeting" },
        path: "meeting.md",
        title: "Meeting",
        label: "Team Meeting",
        startTime: "12:00",
        endTime: "13:00",
        startTimestamp: null,
        endTimestamp: null,
        status: "ems__EffortStatusInProgress",
        metadata: {},
        isDone: false,
        isTrashed: false,
        isDoing: false,
        isMeeting: true,
        isBlocked: false,
      },
      {
        file: { path: "blocked.md", basename: "blocked" },
        path: "blocked.md",
        title: "Blocked Task",
        label: "Blocked Task",
        startTime: "13:00",
        endTime: "14:00",
        startTimestamp: null,
        endTimestamp: null,
        status: "ems__EffortStatusInProgress",
        metadata: {},
        isDone: false,
        isTrashed: false,
        isDoing: false,
        isMeeting: false,
        isBlocked: true,
      },
    ];

    const component = await mount(<DailyTasksTable tasks={tasksWithIcons} />);
    await expect(component).toHaveScreenshot("table-all-icons.png");
  });

  test("table with Effort Area column", async ({ mount }) => {
    const tasksWithArea: DailyTask[] = [
      {
        file: { path: "task1.md", basename: "task1" },
        path: "task1.md",
        title: "Task 1",
        label: "Backend Task",
        startTime: "09:00",
        endTime: "10:00",
        startTimestamp: null,
        endTimestamp: null,
        status: "ems__EffortStatusInProgress",
        metadata: { ems__Effort_area: "[[backend]]" },
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
        label: "Frontend Task",
        startTime: "10:00",
        endTime: "11:00",
        startTimestamp: null,
        endTimestamp: null,
        status: "ems__EffortStatusInProgress",
        metadata: { ems__Effort_area: "[[frontend]]" },
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
    await expect(component).toHaveScreenshot("table-with-effort-area.png");
  });

  test("table with Votes column", async ({ mount }) => {
    const tasksWithVotes: DailyTask[] = [
      {
        file: { path: "task1.md", basename: "task1" },
        path: "task1.md",
        title: "Task 1",
        label: "High Priority",
        startTime: "09:00",
        endTime: "10:00",
        startTimestamp: null,
        endTimestamp: null,
        status: "ems__EffortStatusInProgress",
        metadata: { ems__Effort_votes: 15 },
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
        label: "Low Priority",
        startTime: "10:00",
        endTime: "11:00",
        startTimestamp: null,
        endTimestamp: null,
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
      <DailyTasksTable tasks={tasksWithVotes} showEffortVotes={true} />,
    );
    await expect(component).toHaveScreenshot("table-with-votes.png");
  });

  test("empty table", async ({ mount }) => {
    const component = await mount(<DailyTasksTable tasks={[]} />);
    await expect(component).toHaveScreenshot("table-empty.png");
  });

  test("table with sort indicator ascending", async ({ mount }) => {
    const component = await mount(<DailyTasksTable tasks={baseTasks} />);
    await component.locator('thead th:has-text("Name")').click();
    await expect(component).toHaveScreenshot("table-sort-ascending.png");
  });

  test("table with sort indicator descending", async ({ mount }) => {
    const component = await mount(<DailyTasksTable tasks={baseTasks} />);
    const nameHeader = component.locator('thead th:has-text("Name")');
    await nameHeader.click(); // First click: ascending
    await nameHeader.click(); // Second click: descending
    await expect(component).toHaveScreenshot("table-sort-descending.png");
  });

  test("table with empty time slots", async ({ mount }) => {
    const tasksWithGap: DailyTask[] = [
      {
        file: { path: "task1.md", basename: "task1" },
        path: "task1.md",
        title: "Task 1",
        label: "Morning Task",
        startTime: "09:00",
        endTime: "10:00",
        startTimestamp: new Date("2025-01-15T09:00:00").getTime(),
        endTimestamp: new Date("2025-01-15T10:00:00").getTime(),
        status: "ems__EffortStatusInProgress",
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
        label: "Afternoon Task",
        startTime: "11:00",
        endTime: "12:00",
        startTimestamp: new Date("2025-01-15T11:00:00").getTime(),
        endTimestamp: new Date("2025-01-15T12:00:00").getTime(),
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
      <DailyTasksTable tasks={tasksWithGap} showEmptySlots={true} />,
    );
    await expect(component).toHaveScreenshot("table-with-empty-slots.png");
  });

  test("table row hover", async ({ mount, page }) => {
    const component = await mount(<DailyTasksTable tasks={baseTasks} />);
    await component.locator('tr[data-path="task1.md"]').hover();
    await page.waitForTimeout(100);
    await expect(component).toHaveScreenshot("table-row-hover.png");
  });

  test("completed meeting with combined icons", async ({ mount }) => {
    const completedMeetingTask: DailyTask[] = [
      {
        file: { path: "meeting.md", basename: "meeting" },
        path: "meeting.md",
        title: "Meeting",
        label: "Completed Meeting",
        startTime: "14:00",
        endTime: "15:00",
        startTimestamp: null,
        endTimestamp: null,
        status: "ems__EffortStatusDone",
        metadata: {},
        isDone: true,
        isTrashed: false,
        isDoing: false,
        isMeeting: true,
        isBlocked: false,
      },
    ];

    const component = await mount(
      <DailyTasksTable tasks={completedMeetingTask} />,
    );
    await expect(component).toHaveScreenshot("table-completed-meeting.png");
  });
});
