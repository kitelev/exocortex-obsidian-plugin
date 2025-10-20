import { test, expect } from "@playwright/experimental-ct-react";
import { VoteOnEffortButton } from "../../src/presentation/components/VoteOnEffortButton";
import { TFile } from "obsidian";

const mockFile = { path: "test-task.md", basename: "test-task" } as TFile;

test.describe("VoteOnEffortButton Component", () => {
  test("should render button for Task with Backlog status", async ({  mount }) => {
    const mockOnVote = async () => {};

    const component = await mount(
      <VoteOnEffortButton
        instanceClass="[[ems__Task]]"
        metadata={{ ems__Effort_status: "[[ems__EffortStatusBacklog]]" }}
        isArchived={false}
        sourceFile={mockFile}
        onVote={mockOnVote}
      />,
    );

    await expect(component).toBeVisible();
    await expect(component).toHaveText("Vote");
  });

  test("should render button for Project with ToDo status", async ({ mount }) => {
    const mockOnVote = async () => {};

    const component = await mount(
      <VoteOnEffortButton
        instanceClass="[[ems__Project]]"
        metadata={{ ems__Effort_status: "[[ems__EffortStatusToDo]]" }}
        isArchived={false}
        sourceFile={mockFile}
        onVote={mockOnVote}
      />,
    );

    await expect(component).toBeVisible();
    await expect(component).toHaveText("Vote");
  });

  test("should NOT render button for archived Task", async ({ mount }) => {
    const mockOnVote = async () => {};

    const component = await mount(
      <VoteOnEffortButton
        instanceClass="[[ems__Task]]"
        metadata={{ ems__Effort_status: "[[ems__EffortStatusBacklog]]" }}
        isArchived={true}
        sourceFile={mockFile}
        onVote={mockOnVote}
      />,
    );

    await expect(component).not.toBeVisible();
  });

  test("should NOT render button for non-effort asset (Area)", async ({ mount }) => {
    const mockOnVote = async () => {};

    const component = await mount(
      <VoteOnEffortButton
        instanceClass="[[ems__Area]]"
        metadata={{}}
        isArchived={false}
        sourceFile={mockFile}
        onVote={mockOnVote}
      />,
    );

    await expect(component).not.toBeVisible();
  });

  test("should display vote count when votes exist", async ({ mount }) => {
    const mockOnVote = async () => {};

    const component = await mount(
      <VoteOnEffortButton
        instanceClass="[[ems__Task]]"
        metadata={{ ems__Effort_votes: 5 }}
        isArchived={false}
        sourceFile={mockFile}
        onVote={mockOnVote}
      />,
    );

    await expect(component).toBeVisible();
    await expect(component).toHaveText("Vote (5)");
  });

  test("should display 'Vote' when no votes exist", async ({ mount }) => {
    const mockOnVote = async () => {};

    const component = await mount(
      <VoteOnEffortButton
        instanceClass="[[ems__Task]]"
        metadata={{}}
        isArchived={false}
        sourceFile={mockFile}
        onVote={mockOnVote}
      />,
    );

    await expect(component).toBeVisible();
    await expect(component).toHaveText("Vote");
  });

  test("should call onVote when clicked", async ({ mount }) => {
    let voteCallCount = 0;
    const mockOnVote = async () => {
      voteCallCount++;
    };

    const component = await mount(
      <VoteOnEffortButton
        instanceClass="[[ems__Task]]"
        metadata={{}}
        isArchived={false}
        sourceFile={mockFile}
        onVote={mockOnVote}
      />,
    );

    await component.click();

    await expect.poll(() => voteCallCount).toBe(1);
  });

  test("should handle Task class without brackets", async ({ mount }) => {
    const mockOnVote = async () => {};

    const component = await mount(
      <VoteOnEffortButton
        instanceClass="ems__Task"
        metadata={{}}
        isArchived={false}
        sourceFile={mockFile}
        onVote={mockOnVote}
      />,
    );

    await expect(component).toBeVisible();
  });

  test("should handle Project class without brackets", async ({ mount }) => {
    const mockOnVote = async () => {};

    const component = await mount(
      <VoteOnEffortButton
        instanceClass="ems__Project"
        metadata={{}}
        isArchived={false}
        sourceFile={mockFile}
        onVote={mockOnVote}
      />,
    );

    await expect(component).toBeVisible();
  });

  test("should handle array of classes with Task", async ({ mount }) => {
    const mockOnVote = async () => {};

    const component = await mount(
      <VoteOnEffortButton
        instanceClass={["[[ems__Task]]", "[[SomeOtherClass]]"]}
        metadata={{}}
        isArchived={false}
        sourceFile={mockFile}
        onVote={mockOnVote}
      />,
    );

    await expect(component).toBeVisible();
  });

  test("should have correct CSS class", async ({ mount }) => {
    const mockOnVote = async () => {};

    const component = await mount(
      <VoteOnEffortButton
        instanceClass="[[ems__Task]]"
        metadata={{}}
        isArchived={false}
        sourceFile={mockFile}
        onVote={mockOnVote}
      />,
    );

    await expect(component).toHaveClass("exocortex-vote-btn");
  });

  test("should prevent default event when button is clicked", async ({ mount }) => {
    const mockOnVote = async () => {};

    const component = await mount(
      <VoteOnEffortButton
        instanceClass="[[ems__Task]]"
        metadata={{}}
        isArchived={false}
        sourceFile={mockFile}
        onVote={mockOnVote}
      />,
    );

    // The button should have type="button" which prevents form submission
    await expect(component).toHaveAttribute("type", "button");
  });

  test("should display tooltip with current vote count", async ({ mount }) => {
    const mockOnVote = async () => {};

    const component = await mount(
      <VoteOnEffortButton
        instanceClass="[[ems__Task]]"
        metadata={{ ems__Effort_votes: 10 }}
        isArchived={false}
        sourceFile={mockFile}
        onVote={mockOnVote}
      />,
    );

    await expect(component).toHaveAttribute("title", "Vote on this effort (current votes: 10)");
  });

  test("should show zero votes in tooltip when no votes", async ({ mount }) => {
    const mockOnVote = async () => {};

    const component = await mount(
      <VoteOnEffortButton
        instanceClass="[[ems__Task]]"
        metadata={{}}
        isArchived={false}
        sourceFile={mockFile}
        onVote={mockOnVote}
      />,
    );

    await expect(component).toHaveAttribute("title", "Vote on this effort (current votes: 0)");
  });

  test("should handle large vote counts", async ({ mount }) => {
    const mockOnVote = async () => {};

    const component = await mount(
      <VoteOnEffortButton
        instanceClass="[[ems__Task]]"
        metadata={{ ems__Effort_votes: 999 }}
        isArchived={false}
        sourceFile={mockFile}
        onVote={mockOnVote}
      />,
    );

    await expect(component).toHaveText("Vote (999)");
  });

  test("should treat invalid vote count as zero", async ({ mount }) => {
    const mockOnVote = async () => {};

    const component = await mount(
      <VoteOnEffortButton
        instanceClass="[[ems__Task]]"
        metadata={{ ems__Effort_votes: "invalid" }}
        isArchived={false}
        sourceFile={mockFile}
        onVote={mockOnVote}
      />,
    );

    await expect(component).toHaveText("Vote");
  });

  test("should handle missing parent path", async ({ mount }) => {
    const mockFileWithoutParent = { path: "test.md", basename: "test", parent: null } as TFile;
    const mockOnVote = async () => {};

    const component = await mount(
      <VoteOnEffortButton
        instanceClass="[[ems__Task]]"
        metadata={{}}
        isArchived={false}
        sourceFile={mockFileWithoutParent}
        onVote={mockOnVote}
      />,
    );

    await expect(component).toBeVisible();
  });
});
