import { test, expect } from "@playwright/experimental-ct-react";
import { VoteOnEffortButton } from "../../src/presentation/components/VoteOnEffortButton";
import { TFile } from "obsidian";

test.describe("VoteOnEffortButton Component", () => {
  test("should render button for Task with Backlog status", async ({  mount }) => {
    const mockFile = { parent: { path: "/tasks" } } as TFile;
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

    await expect(component.getByRole("button")).toBeVisible();
    await expect(component.getByRole("button")).toHaveText("Vote");
  });

  test("should render button for Project with ToDo status", async ({ mount }) => {
    const mockFile = { parent: { path: "/projects" } } as TFile;
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

    await expect(component.getByRole("button")).toBeVisible();
    await expect(component.getByRole("button")).toHaveText("Vote");
  });

  test("should NOT render button for archived Task", async ({ mount }) => {
    const mockFile = { parent: { path: "/tasks" } } as TFile;
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

    await expect(component.getByRole("button")).not.toBeVisible();
  });

  test("should NOT render button for non-effort asset (Area)", async ({ mount }) => {
    const mockFile = { parent: { path: "/areas" } } as TFile;
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

    await expect(component.getByRole("button")).not.toBeVisible();
  });

  test("should display vote count when votes exist", async ({ mount }) => {
    const mockFile = { parent: { path: "/tasks" } } as TFile;
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

    await expect(component.getByRole("button")).toBeVisible();
    await expect(component.getByRole("button")).toHaveText("Vote (5)");
  });

  test("should display 'Vote' when no votes exist", async ({ mount }) => {
    const mockFile = { parent: { path: "/tasks" } } as TFile;
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

    await expect(component.getByRole("button")).toBeVisible();
    await expect(component.getByRole("button")).toHaveText("Vote");
  });

  test("should call onVote when clicked", async ({ mount, page }) => {
    const mockFile = { parent: { path: "/tasks" } } as TFile;
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

    const button = component.getByRole("button");
    await button.click();

    // Wait a bit for async operation
    await page.waitForTimeout(100);

    expect(voteCallCount).toBe(1);
  });

  test("should handle Task class without brackets", async ({ mount }) => {
    const mockFile = { parent: { path: "/tasks" } } as TFile;
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

    await expect(component.getByRole("button")).toBeVisible();
  });

  test("should handle Project class without brackets", async ({ mount }) => {
    const mockFile = { parent: { path: "/projects" } } as TFile;
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

    await expect(component.getByRole("button")).toBeVisible();
  });

  test("should handle array of classes with Task", async ({ mount }) => {
    const mockFile = { parent: { path: "/tasks" } } as TFile;
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

    await expect(component.getByRole("button")).toBeVisible();
  });

  test("should have correct CSS class", async ({ mount }) => {
    const mockFile = { parent: { path: "/tasks" } } as TFile;
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

    const button = component.getByRole("button");
    await expect(button).toHaveClass("exocortex-vote-btn");
  });

  test("should prevent default event behavior on click", async ({ mount, page }) => {
    const mockFile = { parent: { path: "/tasks" } } as TFile;
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

    const button = component.getByRole("button");

    // Attach event listener to check if preventDefault was called
    await page.evaluate(() => {
      const btn = document.querySelector(".exocortex-vote-btn");
      if (btn) {
        btn.addEventListener("click", (e) => {
          (window as any).defaultPrevented = e.defaultPrevented;
        });
      }
    });

    await button.click();

    // Wait for event propagation
    await page.waitForTimeout(50);

    const defaultPrevented = await page.evaluate(() => (window as any).defaultPrevented);
    expect(defaultPrevented).toBe(true);
  });

  test("should display tooltip with current vote count", async ({ mount }) => {
    const mockFile = { parent: { path: "/tasks" } } as TFile;
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

    const button = component.getByRole("button");
    await expect(button).toHaveAttribute("title", "Vote on this effort (current votes: 10)");
  });

  test("should show zero votes in tooltip when no votes", async ({ mount }) => {
    const mockFile = { parent: { path: "/tasks" } } as TFile;
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

    const button = component.getByRole("button");
    await expect(button).toHaveAttribute("title", "Vote on this effort (current votes: 0)");
  });

  test("should handle large vote counts", async ({ mount }) => {
    const mockFile = { parent: { path: "/tasks" } } as TFile;
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

    await expect(component.getByRole("button")).toHaveText("Vote (999)");
  });

  test("should treat invalid vote count as zero", async ({ mount }) => {
    const mockFile = { parent: { path: "/tasks" } } as TFile;
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

    await expect(component.getByRole("button")).toHaveText("Vote");
  });

  test("should handle missing parent path", async ({ mount }) => {
    const mockFile = { parent: null } as TFile;
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

    await expect(component.getByRole("button")).toBeVisible();
  });
});
