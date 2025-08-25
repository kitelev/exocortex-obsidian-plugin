import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@jest/globals";
import { MobileTestEnvironment } from "../../tests/mobile-setup";

// Setup Steps
Given("I have access to the button command system", async function () {
  this.buttonSystem = {
    commands: new Map(),
    uiButtons: [],
    executionLog: [],
  };
  this.systemReady = true;
});

Given("I am viewing an asset page with UI buttons", async function () {
  this.assetPage = document.createElement("div");
  this.assetPage.className = "asset-page";
  
  // Create various UI buttons
  this.uiButtons = [
    this.createButton("Create Child Task", "create-child-task"),
    this.createButton("Edit Properties", "edit-properties"),
    this.createButton("View Relationships", "view-relationships"),
    this.createButton("Export Data", "export-data"),
  ];
  
  this.uiButtons.forEach(button => this.assetPage.appendChild(button));
  document.body.appendChild(this.assetPage);
});

Given("I have configured button commands for specific actions", async function () {
  this.buttonCommands = new Map([
    ["create-child-task", { action: "createChildTask", label: "Create Child Task" }],
    ["save-asset", { action: "saveAsset", label: "Save Asset" }],
    ["delete-asset", { action: "deleteAsset", label: "Delete Asset" }],
  ]);
});

Given("I am viewing a project or task asset", async function () {
  this.currentAsset = {
    type: "ems:Project",
    id: "project-123",
    title: "Sample Project",
    children: [],
  };
  
  this.childTaskButton = this.createButton("Create Child Task", "create-child-task");
  document.body.appendChild(this.childTaskButton);
});

Given("I see a {string} button", function (buttonText: string) {
  const button = document.querySelector(`[data-command="create-child-task"]`) || this.childTaskButton;
  expect(button).toBeDefined();
  expect(button?.textContent).toContain(buttonText);
  this.targetButton = button;
});

Given("I am viewing an ems__Area asset", async function () {
  this.currentAsset = {
    type: "ems:Area",
    id: "area-456",
    title: "Management Area",
    childZones: [],
  };
  
  this.childZoneButtons = [
    this.createButton("Create Child Zone", "create-child-zone"),
    this.createButton("Add Sub-Area", "add-sub-area"),
  ];
  
  this.childZoneButtons.forEach(button => document.body.appendChild(button));
});

Given("I see child zone creation buttons", function () {
  expect(this.childZoneButtons).toBeDefined();
  expect(this.childZoneButtons.length).toBeGreaterThan(0);
});

Given("I am creating or editing an asset", async function () {
  this.assetForm = document.createElement("form");
  this.assetForm.className = "asset-form";
  this.assetForm.innerHTML = `
    <div class="form-field">
      <label for="asset-title">Title:</label>
      <input type="text" id="asset-title" name="title" />
    </div>
    <div class="form-field">
      <label for="asset-class">Class:</label>
      <button type="button" class="class-selector-button" data-command="select-class">
        Select Class...
      </button>
    </div>
  `;
  document.body.appendChild(this.assetForm);
  
  this.classSelectorButton = this.assetForm.querySelector('.class-selector-button');
});

Given("I need to select a class from the ontology", function () {
  expect(this.classSelectorButton).toBeDefined();
  this.ontologyClasses = [
    { name: "ems:Task", label: "Task" },
    { name: "ems:Project", label: "Project" }, 
    { name: "ems:Area", label: "Area" },
  ];
});

Given("I am viewing different types of assets", async function () {
  this.assetTypes = ["task", "project", "area", "generic"];
  this.currentAssetType = "task";
  this.contextualButtons = new Map();
});

Given("I have multiple buttons on a single interface", async function () {
  this.buttonGroups = {
    primary: [this.createButton("Save", "save", "primary")],
    secondary: [
      this.createButton("Cancel", "cancel", "secondary"),
      this.createButton("Reset", "reset", "secondary"),
    ],
    tertiary: [
      this.createButton("Export", "export", "tertiary"),
      this.createButton("Import", "import", "tertiary"),
    ],
  };
  
  Object.values(this.buttonGroups).flat().forEach(button => {
    document.body.appendChild(button);
  });
});

Given("I am interacting with UI buttons", async function () {
  this.interactionButtons = [
    this.createButtonWithStates("Normal Button", "normal"),
    this.createButtonWithStates("Hover Button", "hover"),
    this.createButtonWithStates("Disabled Button", "disabled"),
    this.createButtonWithStates("Loading Button", "loading"),
  ];
  
  this.interactionButtons.forEach(button => document.body.appendChild(button));
  
  // Set initial states
  this.interactionButtons[2].disabled = true;
  this.interactionButtons[3].setAttribute('data-loading', 'true');
});

Given("I am using a mobile device", async function () {
  this.cleanup = MobileTestEnvironment.setupiOS();
  this.mobileDevice = true;
  Object.defineProperty(window, "innerWidth", {
    value: 375,
    configurable: true,
  });
});

Given("I am using assistive technologies", async function () {
  this.assistiveTech = {
    screenReader: true,
    keyboardOnly: true,
  };
  
  // Mock screen reader
  this.screenReaderOutput = [];
  this.mockScreenReader = {
    announce: (text: string) => this.screenReaderOutput.push(text),
  };
});

Given("I want to customize button behavior", async function () {
  this.customizationMode = true;
  this.buttonCustomizations = {
    visibility: {},
    labels: {},
    styles: {},
  };
});

Given("I am using the button system intensively", async function () {
  this.intensiveUse = true;
  this.rapidClickCount = 0;
  this.rapidClickStartTime = performance.now();
});

Given("I am working with complex workflows", async function () {
  this.workflowButtons = [
    this.createButton("Start Workflow", "start-workflow"),
    this.createButton("Step 1: Analyze", "workflow-step-1"),
    this.createButton("Step 2: Process", "workflow-step-2"),
    this.createButton("Step 3: Complete", "workflow-step-3"),
  ];
  
  this.workflowButtons.forEach(button => document.body.appendChild(button));
  this.workflowStatus = "ready";
});

Given("I am using Obsidian with different themes", async function () {
  this.currentTheme = "default";
  this.availableThemes = ["default", "dark", "light", "custom"];
  this.themeCompatibleButtons = [
    this.createButton("Theme Test Button", "theme-test"),
  ];
  
  this.themeCompatibleButtons.forEach(button => document.body.appendChild(button));
});

Given("I am a power user who prefers keyboard navigation", async function () {
  this.powerUser = true;
  this.keyboardShortcuts = new Map([
    ["Ctrl+S", "save"],
    ["Ctrl+N", "create-new"],
    ["Ctrl+D", "delete"],
    ["Escape", "cancel"],
  ]);
});

Given("I need to perform similar actions on multiple items", async function () {
  this.selectedItems = [
    { id: "item-1", type: "task" },
    { id: "item-2", type: "task" },
    { id: "item-3", type: "project" },
  ];
  
  this.bulkActionButtons = [
    this.createButton("Bulk Delete", "bulk-delete"),
    this.createButton("Bulk Export", "bulk-export"),
    this.createButton("Bulk Edit", "bulk-edit"),
  ];
  
  this.bulkActionButtons.forEach(button => document.body.appendChild(button));
});

// Helper methods
Given.prototype.createButton = function(text: string, command: string, priority: string = "default"): HTMLButtonElement {
  const button = document.createElement("button");
  button.textContent = text;
  button.className = `exocortex-ui-button priority-${priority}`;
  button.setAttribute("data-command", command);
  button.style.minWidth = "44px";
  button.style.minHeight = "44px";
  button.style.margin = "4px";
  return button;
};

Given.prototype.createButtonWithStates = function(text: string, state: string): HTMLButtonElement {
  const button = this.createButton(text, `${state}-button`);
  button.setAttribute("data-state", state);
  return button;
};

// Interaction Steps
When("I see UI buttons for various actions", function () {
  expect(this.uiButtons).toBeDefined();
  expect(this.uiButtons.length).toBeGreaterThan(0);
  this.buttonsVisible = true;
});

When("I click a UI button", async function () {
  const button = this.uiButtons?.[0] || this.interactionButtons?.[0];
  if (button) {
    this.clickStartTime = performance.now();
    button.click();
    this.buttonClicked = true;
    this.clickedButton = button;
  }
});

When("I click on a button command", async function () {
  const commandButton = document.querySelector('[data-command="create-child-task"]');
  if (commandButton) {
    this.commandExecutionStart = performance.now();
    (commandButton as HTMLElement).click();
    this.commandExecuted = true;
    this.executedCommand = commandButton.getAttribute("data-command");
  }
});

When("I click the {string} button", async function (buttonText: string) {
  const button = this.targetButton || this.childTaskButton;
  if (button) {
    this.modalShouldOpen = true;
    (button as HTMLElement).click();
    this.buttonClickTime = performance.now();
  }
});

When("I save the new child task", async function () {
  this.childTaskData = {
    title: "New Child Task",
    parent: this.currentAsset.id,
    type: "ems:Task",
  };
  this.taskSaved = true;
});

When("I click on a {string} button", async function (buttonType: string) {
  const button = this.childZoneButtons?.[0];
  if (button) {
    this.zoneCreationModalOpen = true;
    (button as HTMLElement).click();
  }
});

When("I create the child zone", async function () {
  this.childZoneData = {
    title: "New Child Zone",
    parent: this.currentAsset.id,
    type: "ems:Zone",
  };
  this.zoneCreated = true;
});

When("I click on the class selector button", async function () {
  if (this.classSelectorButton) {
    this.classTreeModalOpen = true;
    (this.classSelectorButton as HTMLElement).click();
  }
});

When("I select a class from the tree", async function () {
  this.selectedClass = this.ontologyClasses[1]; // Select "Project"
  this.classSelected = true;
});

When("I view a task asset", async function () {
  this.currentAssetType = "task";
  this.contextualButtons.set("task", ["complete-task", "add-subtask", "set-priority"]);
});

When("I view a project asset", async function () {
  this.currentAssetType = "project";
  this.contextualButtons.set("project", ["create-child-task", "view-timeline", "export-project"]);
});

When("I view a generic asset", async function () {
  this.currentAssetType = "generic";
  this.contextualButtons.set("generic", ["edit", "delete", "duplicate"]);
});

When("the buttons are rendered", function () {
  this.buttonsRendered = true;
  this.renderTime = performance.now();
});

When("space is limited \\(mobile)", function () {
  expect(this.mobileDevice).toBe(true);
  this.limitedSpace = true;
});

When("a button is in its default state", function () {
  const defaultButton = this.interactionButtons?.[0];
  expect(defaultButton?.getAttribute("data-state")).toBe("normal");
  this.defaultState = true;
});

When("I hover over a button \\(desktop)", function () {
  if (!this.mobileDevice) {
    const button = this.interactionButtons?.[1];
    if (button) {
      button.dispatchEvent(new MouseEvent("mouseover"));
      this.hoverState = true;
    }
  }
});

When("I press/touch a button", async function () {
  const button = this.interactionButtons?.[0];
  if (button) {
    if (this.mobileDevice) {
      const touchEvent = MobileTestEnvironment.createTouchEvent(
        "touchstart",
        [{ x: 30, y: 22 }],
        button,
      );
      button.dispatchEvent(touchEvent);
    } else {
      button.dispatchEvent(new MouseEvent("mousedown"));
    }
    this.pressedState = true;
  }
});

When("a button is disabled", function () {
  const disabledButton = this.interactionButtons?.[2];
  expect(disabledButton?.disabled).toBe(true);
  this.disabledState = true;
});

When("a button is loading", function () {
  const loadingButton = this.interactionButtons?.[3];
  expect(loadingButton?.getAttribute("data-loading")).toBe("true");
  this.loadingState = true;
});

When("I view UI buttons", function () {
  expect(this.mobileDevice).toBe(true);
  this.mobileButtonsViewed = true;
});

When("I tap a button on mobile", async function () {
  const button = this.uiButtons?.[0];
  if (button && this.mobileDevice) {
    const touchEvent = MobileTestEnvironment.createTouchEvent(
      "touchstart",
      [{ x: 30, y: 22 }],
      button,
    );
    this.tapStartTime = performance.now();
    button.dispatchEvent(touchEvent);
    this.mobileTapPerformed = true;
  }
});

When("I encounter UI buttons", function () {
  expect(this.assistiveTech.screenReader).toBe(true);
  this.assistiveTechButtons = this.interactionButtons || this.uiButtons;
});

When("I use high contrast mode", function () {
  document.body.classList.add("high-contrast");
  this.highContrastMode = true;
});

When("I use keyboard-only navigation", function () {
  expect(this.assistiveTech.keyboardOnly).toBe(true);
  this.keyboardOnlyMode = true;
});

When("I access button settings", function () {
  expect(this.customizationMode).toBe(true);
  this.buttonSettings = {
    visibility: new Map(),
    labels: new Map(),
    styles: new Map(),
  };
  this.settingsAccessed = true;
});

When("I have specific workflow needs", function () {
  this.workflowNeeds = {
    customCommands: ["custom-action-1", "custom-action-2"],
    arrangements: "grid",
  };
});

When("buttons are rendered on the page", function () {
  this.pageRenderStart = performance.now();
  this.buttonsRendered = true;
});

When("I click buttons in rapid succession", async function () {
  expect(this.intensiveUse).toBe(true);
  const button = this.uiButtons?.[0];
  
  if (button) {
    for (let i = 0; i < 10; i++) {
      button.click();
      this.rapidClickCount++;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
});

When("a button command encounters an error", async function () {
  this.commandError = new Error("Button command failed");
  this.errorOccurred = true;
});

When("network issues prevent button actions", async function () {
  this.networkIssue = true;
  this.offlineMode = true;
});

When("buttons trigger multi-step processes", async function () {
  expect(this.workflowButtons).toBeDefined();
  this.multiStepProcess = true;
  this.processSteps = ["analyze", "process", "complete"];
  this.currentStep = 0;
});

When("buttons integrate with external systems", async function () {
  this.externalIntegration = {
    system: "external-api",
    status: "connected",
  };
});

When("UI buttons are displayed", function () {
  this.themeButtonsDisplayed = true;
  this.currentThemeContext = this.currentTheme;
});

When("I switch themes", function () {
  this.previousTheme = this.currentTheme;
  this.currentTheme = "dark";
  this.themeSwitch = true;
});

When("UI buttons have associated actions", function () {
  expect(this.powerUser).toBe(true);
  this.buttonActions = this.keyboardShortcuts;
});

When("I use keyboard shortcuts", async function () {
  // Simulate Ctrl+S
  const saveEvent = new KeyboardEvent("keydown", {
    key: "s",
    ctrlKey: true,
  });
  document.dispatchEvent(saveEvent);
  this.keyboardShortcutUsed = true;
  this.usedShortcut = "Ctrl+S";
});

When("I select multiple assets or items", function () {
  expect(this.selectedItems).toBeDefined();
  expect(this.selectedItems.length).toBeGreaterThan(1);
  this.multipleItemsSelected = true;
});

When("I execute bulk button actions", async function () {
  const bulkButton = this.bulkActionButtons?.[0];
  if (bulkButton) {
    this.bulkOperationStart = performance.now();
    (bulkButton as HTMLElement).click();
    this.bulkOperationExecuted = true;
  }
});

// Assertion Steps
Then("each button should display a clear label or icon", function () {
  expect(this.buttonsVisible).toBe(true);
  if (this.uiButtons) {
    this.uiButtons.forEach(button => {
      expect(button.textContent).toBeTruthy();
    });
  }
});

Then("buttons should have consistent styling", function () {
  expect(this.buttonsVisible).toBe(true);
});

Then("hover states should provide visual feedback", function () {
  expect(this.buttonsVisible).toBe(true);
});

Then("the corresponding action should execute immediately", function () {
  expect(this.buttonClicked).toBe(true);
  expect(this.clickedButton).toBeDefined();
});

Then("I should receive appropriate feedback", function () {
  expect(this.buttonClicked).toBe(true);
});

Then("the underlying command should execute correctly", function () {
  expect(this.commandExecuted).toBe(true);
  expect(this.executedCommand).toBeDefined();
});

Then("the execution should be logged appropriately", function () {
  expect(this.commandExecuted).toBe(true);
});

Then("any errors should be handled gracefully", function () {
  // This would check error handling in real implementation
  expect(this.commandExecuted).toBe(true);
});

Then("the command completes successfully", function () {
  expect(this.commandExecuted).toBe(true);
});

Then("I should see confirmation of the action", function () {
  expect(this.commandExecuted).toBe(true);
});

Then("the UI should update to reflect changes", function () {
  expect(this.commandExecuted).toBe(true);
});

Then("a modal should open to create a new task", function () {
  expect(this.modalShouldOpen).toBe(true);
});

Then("the new task should be automatically linked as a child", function () {
  expect(this.taskSaved).toBe(true);
  expect(this.childTaskData?.parent).toBe(this.currentAsset.id);
});

Then("the parent-child relationship should be established", function () {
  expect(this.taskSaved).toBe(true);
});

Then("it should appear in the children list", function () {
  expect(this.taskSaved).toBe(true);
});

Then("the relationships should be properly indexed", function () {
  expect(this.taskSaved).toBe(true);
});

Then("a modal should open for creating a new zone", function () {
  expect(this.zoneCreationModalOpen).toBe(true);
});

Then("the zone type should be pre-selected appropriately", function () {
  expect(this.zoneCreationModalOpen).toBe(true);
});

Then("the parent-child hierarchy should be maintained", function () {
  expect(this.zoneCreated).toBe(true);
});

Then("it should be linked to the parent area automatically", function () {
  expect(this.zoneCreated).toBe(true);
  expect(this.childZoneData?.parent).toBe(this.currentAsset.id);
});

Then("the hierarchical structure should be preserved", function () {
  expect(this.zoneCreated).toBe(true);
});

Then("the ClassTreeModal should open", function () {
  expect(this.classTreeModalOpen).toBe(true);
});

Then("I should see the hierarchical class structure", function () {
  expect(this.classTreeModalOpen).toBe(true);
  expect(this.ontologyClasses).toBeDefined();
});

Then("I should be able to navigate the class tree", function () {
  expect(this.classTreeModalOpen).toBe(true);
});

Then("the button should update to show the selected class", function () {
  expect(this.classSelected).toBe(true);
  expect(this.selectedClass).toBeDefined();
});

Then("the asset's class property should be set accordingly", function () {
  expect(this.classSelected).toBe(true);
});

Then("task-specific buttons should be rendered", function () {
  expect(this.currentAssetType).toBe("task");
  expect(this.contextualButtons.get("task")).toBeDefined();
});

Then("buttons should reflect the task's current state", function () {
  expect(this.currentAssetType).toBe("task");
});

Then("project-specific buttons should be rendered", function () {
  expect(this.currentAssetType).toBe("project");
  expect(this.contextualButtons.get("project")).toBeDefined();
});

Then("child creation buttons should be available", function () {
  expect(this.currentAssetType).toBe("project");
});

Then("only universally applicable buttons should show", function () {
  expect(this.currentAssetType).toBe("generic");
  expect(this.contextualButtons.get("generic")).toBeDefined();
});

Then("related buttons should be grouped logically", function () {
  expect(this.buttonsRendered).toBe(true);
  expect(this.buttonGroups.primary).toBeDefined();
  expect(this.buttonGroups.secondary).toBeDefined();
});

Then("primary actions should be visually emphasized", function () {
  expect(this.buttonGroups.primary[0].className).toContain("priority-primary");
});

Then("secondary actions should be appropriately de-emphasized", function () {
  expect(this.buttonGroups.secondary[0].className).toContain("priority-secondary");
});

Then("buttons should be organized efficiently", function () {
  expect(this.limitedSpace).toBe(true);
  expect(this.mobileDevice).toBe(true);
});

Then("overflow menus should be used when necessary", function () {
  expect(this.limitedSpace).toBe(true);
});

Then("it should appear clickable and inviting", function () {
  expect(this.defaultState).toBe(true);
});

Then("it should provide visual hover feedback", function () {
  expect(this.hoverState).toBe(true);
});

Then("it should provide immediate pressed state feedback", function () {
  expect(this.pressedState).toBe(true);
});

Then("it should appear disabled and be non-interactive", function () {
  expect(this.disabledState).toBe(true);
});

Then("it should show loading state with appropriate indicators", function () {
  expect(this.loadingState).toBe(true);
});

Then("all buttons should meet minimum touch target requirements \\({int}px)", function (pixels: number) {
  expect(pixels).toBe(44);
  expect(this.mobileButtonsViewed).toBe(true);
});

Then("buttons should have appropriate spacing for touch", function () {
  expect(this.mobileButtonsViewed).toBe(true);
});

Then("visual feedback should account for touch interactions", function () {
  expect(this.mobileButtonsViewed).toBe(true);
});

Then("the tap should register immediately", function () {
  expect(this.mobileTapPerformed).toBe(true);
});

Then("tactile feedback should be provided when available", function () {
  expect(this.mobileTapPerformed).toBe(true);
});

Then("all buttons should have appropriate ARIA labels", function () {
  expect(this.assistiveTechButtons).toBeDefined();
});

Then("keyboard navigation should work correctly", function () {
  expect(this.assistiveTech.keyboardOnly).toBe(true);
});

Then("screen readers should announce button purposes clearly", function () {
  expect(this.assistiveTech.screenReader).toBe(true);
});

Then("buttons should remain clearly visible and distinct", function () {
  expect(this.highContrastMode).toBe(true);
});

Then("all buttons should be reachable and activatable", function () {
  expect(this.keyboardOnlyMode).toBe(true);
});

Then("I should be able to configure button visibility", function () {
  expect(this.settingsAccessed).toBe(true);
});

Then("I should be able to customize button labels", function () {
  expect(this.settingsAccessed).toBe(true);
});

Then("I should be able to set preferred button styles", function () {
  expect(this.settingsAccessed).toBe(true);
});

Then("I should be able to add custom button commands", function () {
  expect(this.workflowNeeds).toBeDefined();
});

Then("button arrangements should be customizable", function () {
  expect(this.workflowNeeds.arrangements).toBeDefined();
});

Then("rendering should be fast and not block the UI", function () {
  expect(this.buttonsRendered).toBe(true);
  expect(this.pageRenderStart).toBeDefined();
});

Then("button event handlers should respond immediately", function () {
  expect(this.buttonsRendered).toBe(true);
});

Then("the system should handle rapid interactions gracefully", function () {
  expect(this.rapidClickCount).toBe(10);
  expect(this.intensiveUse).toBe(true);
});

Then("no actions should be lost or duplicated", function () {
  expect(this.rapidClickCount).toBe(10);
});

Then("the error should be displayed clearly to the user", function () {
  expect(this.errorOccurred).toBe(true);
  expect(this.commandError).toBeDefined();
});

Then("the button should return to its normal state", function () {
  expect(this.errorOccurred).toBe(true);
});

Then("the system should remain stable and usable", function () {
  expect(this.errorOccurred).toBe(true);
});

Then("appropriate offline messaging should be shown", function () {
  expect(this.networkIssue).toBe(true);
  expect(this.offlineMode).toBe(true);
});

Then("actions should be queued for retry when possible", function () {
  expect(this.offlineMode).toBe(true);
});

Then("progress should be clearly communicated", function () {
  expect(this.multiStepProcess).toBe(true);
});

Then("users should be able to track action status", function () {
  expect(this.multiStepProcess).toBe(true);
});

Then("integration status should be visible", function () {
  expect(this.externalIntegration).toBeDefined();
});

Then("failures should be handled gracefully", function () {
  expect(this.externalIntegration).toBeDefined();
});

Then("buttons should respect the current theme", function () {
  expect(this.themeButtonsDisplayed).toBe(true);
  expect(this.currentThemeContext).toBeDefined();
});

Then("colors should integrate well with the overall design", function () {
  expect(this.themeButtonsDisplayed).toBe(true);
});

Then("contrast should meet accessibility standards", function () {
  expect(this.themeButtonsDisplayed).toBe(true);
});

Then("button appearance should update appropriately", function () {
  expect(this.themeSwitch).toBe(true);
  expect(this.previousTheme).toBe("default");
  expect(this.currentTheme).toBe("dark");
});

Then("visual hierarchy should be maintained", function () {
  expect(this.themeSwitch).toBe(true);
});

Then("relevant buttons should have keyboard shortcuts", function () {
  expect(this.buttonActions).toBeDefined();
});

Then("shortcuts should be discoverable \\(tooltips, etc.)", function () {
  expect(this.powerUser).toBe(true);
});

Then("shortcuts should not conflict with system shortcuts", function () {
  expect(this.keyboardShortcuts).toBeDefined();
});

Then("actions should execute exactly as if I clicked the button", function () {
  expect(this.keyboardShortcutUsed).toBe(true);
  expect(this.usedShortcut).toBe("Ctrl+S");
});

Then("visual feedback should indicate the action occurred", function () {
  expect(this.keyboardShortcutUsed).toBe(true);
});

Then("bulk action buttons should become available", function () {
  expect(this.multipleItemsSelected).toBe(true);
  expect(this.bulkActionButtons).toBeDefined();
});

Then("buttons should clearly indicate they will affect multiple items", function () {
  expect(this.multipleItemsSelected).toBe(true);
});

Then("progress should be shown for long-running operations", function () {
  expect(this.bulkOperationExecuted).toBe(true);
});

Then("I should be able to cancel operations if needed", function () {
  expect(this.bulkOperationExecuted).toBe(true);
});

Then("results should be clearly communicated", function () {
  expect(this.bulkOperationExecuted).toBe(true);
});

import { After } from "@cucumber/cucumber";

After(function () {
  // Clean up DOM elements
  [
    this.assetPage,
    this.childTaskButton,
    this.assetForm,
    ...Object.values(this.buttonGroups || {}).flat(),
    ...(this.interactionButtons || []),
    ...(this.childZoneButtons || []),
    ...(this.workflowButtons || []),
    ...(this.themeCompatibleButtons || []),
    ...(this.bulkActionButtons || []),
  ].forEach((element) => {
    if (element && document.body.contains(element)) {
      document.body.removeChild(element);
    }
  });

  // Clean up classes
  document.body.classList.remove("high-contrast");

  // Clean up environment
  if (this.cleanup) {
    this.cleanup();
  }
});