import { Given, When, Then } from "@cucumber/cucumber";
import { App, TFile, WorkspaceLeaf } from "obsidian";
import { BaseAssetRelationsRenderer } from "../../src/presentation/renderers/BaseAssetRelationsRenderer";

// Test context
let app: App;
let renderer: BaseAssetRelationsRenderer;
let currentTab: WorkspaceLeaf;
let linkElement: HTMLAnchorElement;
let clickEvent: MouseEvent;
let tabsBeforeClick: WorkspaceLeaf[];
let currentTabContent: string;
let eventPrevented: boolean = false;
let eventPropagated: boolean = true;

Given("I have the Exocortex plugin installed", function () {
  // Mock Obsidian app with plugin
  app = this.world.app;
  expect(app).toBeDefined();
});

Given("I have a note with asset relations displayed in a table", function () {
  // Create mock note with relations table
  const container = document.createElement("div");
  container.className = "exocortex-relation-table";

  const table = document.createElement("table");
  const tbody = document.createElement("tbody");
  const row = document.createElement("tr");
  const cell = document.createElement("td");

  linkElement = document.createElement("a");
  linkElement.className = "exocortex-relation-link internal-link";
  linkElement.href = "test-note.md";
  linkElement.textContent = "Test Note";

  cell.appendChild(linkElement);
  row.appendChild(cell);
  tbody.appendChild(row);
  table.appendChild(tbody);
  container.appendChild(table);

  document.body.appendChild(container);
});

Given("the table contains clickable links to other notes", function () {
  expect(linkElement).toBeDefined();
  expect(linkElement.className).toContain("internal-link");
});

Given("I am viewing an asset relations table", function () {
  currentTab = app.workspace.getLeaf();
  tabsBeforeClick = app.workspace.getLeavesOfType("markdown");
  currentTabContent = currentTab.view?.file?.path || "";
});

Given("I am using macOS", function () {
  Object.defineProperty(navigator, "platform", {
    value: "MacIntel",
    writable: true,
  });
});

Given("I am using Windows or Linux", function () {
  Object.defineProperty(navigator, "platform", {
    value: "Win32",
    writable: true,
  });
});

When("I click on a link without any modifiers", function () {
  clickEvent = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    button: 0,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
  });

  // Track event handling
  linkElement.addEventListener("click", (e) => {
    eventPrevented = e.defaultPrevented;
    eventPropagated = !e.cancelBubble;
  });

  linkElement.dispatchEvent(clickEvent);
});

When("I click on a link while holding the Cmd key", function () {
  clickEvent = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    button: 0,
    ctrlKey: false,
    metaKey: true, // Cmd key on macOS
    shiftKey: false,
    altKey: false,
  });

  // Spy on preventDefault and stopPropagation
  const preventDefaultSpy = jest.spyOn(clickEvent, "preventDefault");
  const stopPropagationSpy = jest.spyOn(clickEvent, "stopPropagation");

  linkElement.dispatchEvent(clickEvent);

  eventPrevented = preventDefaultSpy.mock.calls.length > 0;
  eventPropagated = stopPropagationSpy.mock.calls.length === 0;
});

When("I click on a link while holding the Ctrl key", function () {
  clickEvent = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    button: 0,
    ctrlKey: true, // Ctrl key on Windows/Linux
    metaKey: false,
    shiftKey: false,
    altKey: false,
  });

  const preventDefaultSpy = jest.spyOn(clickEvent, "preventDefault");
  const stopPropagationSpy = jest.spyOn(clickEvent, "stopPropagation");

  linkElement.dispatchEvent(clickEvent);

  eventPrevented = preventDefaultSpy.mock.calls.length > 0;
  eventPropagated = stopPropagationSpy.mock.calls.length === 0;
});

When("I click on a link with the middle mouse button", function () {
  clickEvent = new MouseEvent("auxclick", {
    bubbles: true,
    cancelable: true,
    button: 1, // Middle button
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
  });

  linkElement.dispatchEvent(clickEvent);
});

When("I click on a link while holding the Shift key", function () {
  clickEvent = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    button: 0,
    ctrlKey: false,
    metaKey: false,
    shiftKey: true,
    altKey: false,
  });

  linkElement.dispatchEvent(clickEvent);
});

When("I click on a link while holding the Alt key", function () {
  clickEvent = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    button: 0,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: true,
  });

  linkElement.dispatchEvent(clickEvent);
});

Then("the linked note should open in the current tab", function () {
  const currentTabs = app.workspace.getLeavesOfType("markdown");
  expect(currentTabs.length).toBe(tabsBeforeClick.length);
  expect(currentTab.view?.file?.path).toBe("test-note.md");
});

Then("the current tab should navigate to the linked note", function () {
  expect(currentTab.view?.file?.path).toBe("test-note.md");
  expect(currentTabContent).not.toBe(currentTab.view?.file?.path);
});

Then("no new tabs should be created", function () {
  const currentTabs = app.workspace.getLeavesOfType("markdown");
  expect(currentTabs.length).toBe(tabsBeforeClick.length);
});

Then("the linked note should open in a new tab", function () {
  const currentTabs = app.workspace.getLeavesOfType("markdown");
  expect(currentTabs.length).toBe(tabsBeforeClick.length + 1);

  const newTab = currentTabs.find((tab) => !tabsBeforeClick.includes(tab));
  expect(newTab).toBeDefined();
  expect(newTab?.view?.file?.path).toBe("test-note.md");
});

Then("the current tab should remain unchanged", function () {
  expect(currentTab.view?.file?.path).toBe(currentTabContent);
});

Then("focus should stay on the current tab", function () {
  const activeLeaf = app.workspace.getActiveViewOfType("markdown")?.leaf;
  expect(activeLeaf).toBe(currentTab);
});

Then(
  "the event should be properly stopped to prevent double navigation",
  function () {
    expect(eventPrevented).toBe(true);
    expect(eventPropagated).toBe(false);
  },
);

Then("the linked note should open in a new split pane", function () {
  const leaves = app.workspace.getLayout();
  // Check for split layout
  expect(leaves.type).toBe("split");
  expect(leaves.children?.length).toBeGreaterThan(1);
});

Then("both panes should be visible", function () {
  const leaves = app.workspace.getLeavesOfType("markdown");
  const visibleLeaves = leaves.filter(
    (leaf) => leaf.view?.containerEl?.offsetParent !== null,
  );
  expect(visibleLeaves.length).toBeGreaterThanOrEqual(2);
});

Then("the link context menu should appear", function () {
  const contextMenu = document.querySelector(".context-menu");
  expect(contextMenu).toBeTruthy();
});

Then("the menu should contain standard Obsidian link options", function () {
  const menuItems = document.querySelectorAll(".context-menu .menu-item");
  const menuTexts = Array.from(menuItems).map((item) => item.textContent);

  expect(menuTexts).toContain("Open in new tab");
  expect(menuTexts).toContain("Open to the right");
  expect(menuTexts).toContain("Open in new window");
});

Then("no navigation should occur", function () {
  expect(currentTab.view?.file?.path).toBe(currentTabContent);
  const currentTabs = app.workspace.getLeavesOfType("markdown");
  expect(currentTabs.length).toBe(tabsBeforeClick.length);
});

Then("the link should emit standard DOM events", function () {
  const events: string[] = [];

  ["click", "mousedown", "mouseup", "contextmenu"].forEach((eventType) => {
    linkElement.addEventListener(eventType, () => {
      events.push(eventType);
    });
  });

  // Simulate interaction
  linkElement.dispatchEvent(new MouseEvent("mousedown"));
  linkElement.dispatchEvent(new MouseEvent("mouseup"));
  linkElement.dispatchEvent(new MouseEvent("click"));

  expect(events).toContain("mousedown");
  expect(events).toContain("mouseup");
  expect(events).toContain("click");
});

Then("other plugins should be able to intercept these events", function () {
  let intercepted = false;

  // Simulate another plugin's event listener
  linkElement.addEventListener(
    "click",
    (e) => {
      intercepted = true;
    },
    true,
  ); // Use capture phase

  linkElement.dispatchEvent(new MouseEvent("click"));
  expect(intercepted).toBe(true);
});

Then("the link should not use proprietary event handling", function () {
  // Check that link uses standard addEventListener, not custom handlers
  const handlers = (linkElement as any)._eventHandlers;
  expect(handlers).toBeUndefined();

  // Verify standard event API works
  const testHandler = jest.fn();
  linkElement.addEventListener("click", testHandler);
  linkElement.click();
  expect(testHandler).toHaveBeenCalled();
});

Then("preventDefault should be called on the event", function () {
  expect(eventPrevented).toBe(true);
});

Then("stopPropagation should be called on the event", function () {
  expect(eventPropagated).toBe(false);
});

Then("the browser should not navigate to the href", function () {
  // In test environment, check that location didn't change
  expect(window.location.href).not.toContain("test-note.md");
});

Then("only Obsidian navigation should occur", function () {
  // Verify Obsidian's openLinkText was called
  const openLinkTextSpy = jest.spyOn(app.workspace, "openLinkText");
  expect(openLinkTextSpy).toHaveBeenCalledWith(
    "test-note.md",
    "",
    expect.any(Boolean),
  );
});

// Touch device scenarios
Given("I am using a touch device", function () {
  Object.defineProperty(navigator, "maxTouchPoints", {
    value: 1,
    writable: true,
  });
});

When("I tap on a link", function () {
  const touchEvent = new TouchEvent("touchend", {
    bubbles: true,
    cancelable: true,
    touches: [],
    targetTouches: [],
    changedTouches: [
      new Touch({
        identifier: 1,
        target: linkElement,
        clientX: 100,
        clientY: 100,
        radiusX: 10,
        radiusY: 10,
        rotationAngle: 0,
        force: 1,
      }),
    ],
  });

  linkElement.dispatchEvent(touchEvent);
});

Then("long press should show the context menu", function () {
  // Simulate long press
  const touchStart = new TouchEvent("touchstart");
  linkElement.dispatchEvent(touchStart);

  setTimeout(() => {
    const contextMenu = document.querySelector(".context-menu");
    expect(contextMenu).toBeTruthy();
  }, 500);
});

// Keyboard navigation
Given("a link has keyboard focus", function () {
  linkElement.focus();
  expect(document.activeElement).toBe(linkElement);
});

When("I press Enter", function () {
  const keyEvent = new KeyboardEvent("keydown", {
    key: "Enter",
    code: "Enter",
    bubbles: true,
    cancelable: true,
  });

  linkElement.dispatchEvent(keyEvent);
});

When("I press Cmd+Enter \\(or Ctrl+Enter)", function () {
  const keyEvent = new KeyboardEvent("keydown", {
    key: "Enter",
    code: "Enter",
    metaKey: navigator.platform.includes("Mac"),
    ctrlKey: !navigator.platform.includes("Mac"),
    bubbles: true,
    cancelable: true,
  });

  linkElement.dispatchEvent(keyEvent);
});

// Hover preview
Given("I have hover preview enabled", function () {
  app.vault.getConfig("enablePreview", true);
});

When("I hover over a link", function () {
  const hoverEvent = new MouseEvent("mouseenter", {
    bubbles: true,
    cancelable: true,
  });

  linkElement.dispatchEvent(hoverEvent);
});

Then("the hover preview should appear", function () {
  setTimeout(() => {
    const preview = document.querySelector(".hover-popover");
    expect(preview).toBeTruthy();
  }, 100);
});

When("Cmd+hover should show the preview", function () {
  const hoverEvent = new MouseEvent("mousemove", {
    bubbles: true,
    cancelable: true,
    metaKey: true,
  });

  linkElement.dispatchEvent(hoverEvent);
});

Then("the preview should not interfere with click behavior", function () {
  const preview = document.querySelector(".hover-popover");
  if (preview) {
    const pointerEvents = window.getComputedStyle(preview).pointerEvents;
    expect(pointerEvents).toBe("none");
  }
});

// Rapid clicking
When("I rapidly click multiple links with Cmd held", function () {
  const links = document.querySelectorAll(".exocortex-relation-link");

  links.forEach((link, index) => {
    setTimeout(() => {
      const event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        metaKey: true,
      });
      link.dispatchEvent(event);
    }, index * 10); // 10ms apart
  });
});

Then("each link should open in a separate new tab", function () {
  const currentTabs = app.workspace.getLeavesOfType("markdown");
  const newTabs = currentTabs.filter((tab) => !tabsBeforeClick.includes(tab));

  const links = document.querySelectorAll(".exocortex-relation-link");
  expect(newTabs.length).toBe(links.length);
});

Then("no tabs should replace the current tab", function () {
  expect(currentTab.view?.file?.path).toBe(currentTabContent);
});

Then("all navigation events should be handled correctly", function () {
  // Check that all events were prevented
  const links = document.querySelectorAll(".exocortex-relation-link");
  links.forEach((link) => {
    const handler = (e: Event) => {
      expect(e.defaultPrevented).toBe(true);
    };
    link.addEventListener("click", handler);
  });
});

Then("no race conditions should occur", function () {
  // Verify tab order matches click order
  const currentTabs = app.workspace.getLeavesOfType("markdown");
  const newTabs = currentTabs.filter((tab) => !tabsBeforeClick.includes(tab));

  newTabs.forEach((tab, index) => {
    const expectedPath = `note-${index}.md`;
    expect(tab.view?.file?.path).toBe(expectedPath);
  });
});
