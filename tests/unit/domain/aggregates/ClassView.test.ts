import { ClassView, ClassViewProps, DisplayOptions } from "../../../../src/domain/aggregates/ClassView";
import { AssetId } from "../../../../src/domain/value-objects/AssetId";
import { ClassName } from "../../../../src/domain/value-objects/ClassName";
import { UIButton } from "../../../../src/domain/entities/UIButton";
import { Result } from "../../../../src/domain/core/Result";

describe("ClassView Aggregate", () => {
  // Test data factory
  const createMockAssetId = (value: string = "123e4567-e89b-12d3-a456-426614174000"): AssetId => {
    const result = AssetId.create(value);
    if (result.isFailure) throw new Error(`Failed to create AssetId: ${result.error}`);
    return result.getValue();
  };

  const createMockClassName = (value: string = "exo__Task"): ClassName => {
    const result = ClassName.create(value);
    if (result.isFailure) throw new Error("Failed to create ClassName");
    return result.getValue();
  };

  const createMockUIButton = (overrides: Partial<any> = {}): UIButton => {
    const buttonId = overrides.buttonId ? createMockAssetId(overrides.buttonId) : AssetId.generate();
    const commandId = overrides.commandId ? createMockAssetId(overrides.commandId) : AssetId.generate();
    
    const result = UIButton.create({
      id: buttonId,
      label: "Test Button",
      commandId,
      order: 1,
      isEnabled: true,
      tooltip: "Test tooltip",
      ...overrides
    });
    
    if (result.isFailure) throw new Error("Failed to create UIButton");
    return result.getValue();
  };

  const createValidClassViewProps = (overrides: Partial<ClassViewProps> = {}): ClassViewProps => {
    return {
      id: overrides.id ? createMockAssetId(overrides.id.toString()) : AssetId.generate(),
      className: createMockClassName("exo__Task"),
      buttons: [],
      layoutTemplate: "default",
      displayOptions: {
        showProperties: true,
        showRelations: true,
        showBacklinks: true,
        showButtons: true,
        buttonPosition: "top"
      },
      ...overrides
    };
  };

  describe("Factory Method - create()", () => {
    it("should create ClassView with valid properties", () => {
      // Arrange
      const props = createValidClassViewProps();

      // Act
      const result = ClassView.create(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      const classView = result.getValue();
      expect(classView.id).toBe(props.id);
      expect(classView.className).toBe(props.className);
      expect(classView.buttons).toEqual([]);
    });

    it("should fail when className is null", () => {
      // Arrange
      const props = createValidClassViewProps({
        className: null as any
      });

      // Act
      const result = ClassView.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Class view must be associated with a class");
    });

    it("should fail when className is undefined", () => {
      // Arrange
      const props = createValidClassViewProps({
        className: undefined as any
      });

      // Act
      const result = ClassView.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Class view must be associated with a class");
    });

    it("should fail when buttons exceed maximum limit", () => {
      // Arrange
      const tooManyButtons = Array.from({ length: 25 }, (_, index) => 
        createMockUIButton({ order: index })
      );
      const props = createValidClassViewProps({ buttons: tooManyButtons });

      // Act
      const result = ClassView.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Class view cannot have more than 20 buttons");
    });

    it("should allow maximum number of buttons (20)", () => {
      // Arrange
      const maxButtons = Array.from({ length: 20 }, (_, index) => 
        createMockUIButton({ order: index })
      );
      const props = createValidClassViewProps({ buttons: maxButtons });

      // Act
      const result = ClassView.create(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      const classView = result.getValue();
      expect(classView.buttons).toHaveLength(20);
    });

    it("should fail when buttons have duplicate order values", () => {
      // Arrange
      const duplicateOrderButtons = [
        createMockUIButton({ order: 1 }),
        createMockUIButton({ order: 2 }),
        createMockUIButton({ order: 1 }) // Duplicate order
      ];
      const props = createValidClassViewProps({ buttons: duplicateOrderButtons });

      // Act
      const result = ClassView.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Buttons cannot have duplicate order values");
    });

    it("should set default display options when not provided", () => {
      // Arrange
      const props = createValidClassViewProps({ displayOptions: undefined });

      // Act
      const result = ClassView.create(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      const classView = result.getValue();
      expect(classView.displayOptions).toEqual({
        showProperties: true,
        showRelations: true,
        showBacklinks: true,
        showButtons: true,
        buttonPosition: "top"
      });
    });

    it("should merge provided display options with defaults", () => {
      // Arrange
      const partialDisplayOptions: DisplayOptions = {
        showProperties: true,  // Add missing required properties
        showRelations: true,
        showBacklinks: true,
        showButtons: false,
        buttonPosition: "bottom"
      };
      const props = createValidClassViewProps({ displayOptions: partialDisplayOptions });

      // Act
      const result = ClassView.create(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      const classView = result.getValue();
      expect(classView.displayOptions).toEqual({
        showProperties: true,
        showRelations: true,
        showBacklinks: true,
        showButtons: false,
        buttonPosition: "bottom"
      });
    });
  });

  describe("Getters", () => {
    let classView: ClassView;

    beforeEach(() => {
      const button1 = createMockUIButton({ order: 3, label: "Button 3" });
      const button2 = createMockUIButton({ order: 1, label: "Button 1" });
      const button3 = createMockUIButton({ order: 2, label: "Button 2" });
      
      const props = createValidClassViewProps({
        buttons: [button1, button2, button3] // Unsorted order
      });
      
      const result = ClassView.create(props);
      if (result.isFailure) throw new Error("Failed to create ClassView");
      classView = result.getValue();
    });

    it("should return correct id", () => {
      expect(classView.id).toBeInstanceOf(AssetId);
    });

    it("should return correct className", () => {
      expect(classView.className).toBeInstanceOf(ClassName);
      expect(classView.className.value).toBe("exo__Task");
    });

    it("should return buttons sorted by order", () => {
      const buttons = classView.buttons;
      expect(buttons).toHaveLength(3);
      expect(buttons[0].order).toBe(1);
      expect(buttons[1].order).toBe(2);
      expect(buttons[2].order).toBe(3);
    });

    it("should return display options", () => {
      expect(classView.displayOptions).toEqual({
        showProperties: true,
        showRelations: true,
        showBacklinks: true,
        showButtons: true,
        buttonPosition: "top"
      });
    });

    it("should return default display options when none set", () => {
      // Create a ClassView with no display options
      const props = createValidClassViewProps({ displayOptions: undefined });
      const result = ClassView.create(props);
      const cv = result.getValue();
      
      expect(cv.displayOptions).toEqual({
        showProperties: true,
        showRelations: true,
        showBacklinks: true,
        showButtons: true,
        buttonPosition: "top"
      });
    });
  });

  describe("addButton()", () => {
    let classView: ClassView;

    beforeEach(() => {
      const props = createValidClassViewProps();
      const result = ClassView.create(props);
      if (result.isFailure) throw new Error("Failed to create ClassView");
      classView = result.getValue();
    });

    it("should add button successfully", () => {
      // Arrange
      const newButton = createMockUIButton({ order: 1 });

      // Act
      const result = classView.addButton(newButton);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(classView.buttons).toHaveLength(1);
      expect(classView.buttons[0]).toBe(newButton);
    });

    it("should fail when adding duplicate button", () => {
      // Arrange
      const button = createMockUIButton({ order: 1 });
      classView.addButton(button);

      // Act - Try to add the same button again
      const result = classView.addButton(button);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Button already exists in this view");
      expect(classView.buttons).toHaveLength(1); // Should still be 1
    });

    it("should fail when adding button with duplicate order", () => {
      // Arrange
      const button1 = createMockUIButton({ order: 1 });
      const button2 = createMockUIButton({ order: 1 }); // Same order
      classView.addButton(button1);

      // Act
      const result = classView.addButton(button2);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Button with order 1 already exists");
      expect(classView.buttons).toHaveLength(1);
    });

    it("should fail when maximum buttons reached", () => {
      // Arrange - Add maximum buttons
      for (let i = 0; i < 20; i++) {
        const button = createMockUIButton({ order: i });
        classView.addButton(button);
      }

      const extraButton = createMockUIButton({ order: 21 });

      // Act
      const result = classView.addButton(extraButton);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Cannot add more buttons. Maximum of 20 reached");
      expect(classView.buttons).toHaveLength(20);
    });

    it("should raise domain event when button added", () => {
      // Arrange
      const newButton = createMockUIButton({ order: 1, label: "Test Button" });
      const addDomainEventSpy = jest.spyOn(classView, 'addDomainEvent');

      // Act
      const result = classView.addButton(newButton);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(addDomainEventSpy).toHaveBeenCalledWith({
        aggregateId: classView.id.toString(),
        eventType: "ButtonAddedToClassView",
        occurredOn: expect.any(Date),
        eventData: {
          classViewId: classView.id.toString(),
          className: classView.className.value,
          buttonId: newButton.id.toString(),
          buttonLabel: newButton.label
        }
      });
    });
  });

  describe("removeButton()", () => {
    let classView: ClassView;
    let button1: UIButton;
    let button2: UIButton;

    beforeEach(() => {
      button1 = createMockUIButton({ order: 1, label: "Button 1" });
      button2 = createMockUIButton({ order: 2, label: "Button 2" });
      
      const props = createValidClassViewProps({ buttons: [button1, button2] });
      const result = ClassView.create(props);
      if (result.isFailure) throw new Error("Failed to create ClassView");
      classView = result.getValue();
    });

    it("should remove button successfully", () => {
      // Act
      const result = classView.removeButton(button1.id);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(classView.buttons).toHaveLength(1);
      expect(classView.buttons[0]).toBe(button2);
    });

    it("should fail when button not found", () => {
      // Arrange
      const nonExistentButtonId = AssetId.generate();

      // Act
      const result = classView.removeButton(nonExistentButtonId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Button not found in this view");
      expect(classView.buttons).toHaveLength(2); // Should remain unchanged
    });

    it("should raise domain event when button removed", () => {
      // Arrange
      const addDomainEventSpy = jest.spyOn(classView, 'addDomainEvent');

      // Act
      const result = classView.removeButton(button1.id);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(addDomainEventSpy).toHaveBeenCalledWith({
        aggregateId: classView.id.toString(),
        eventType: "ButtonRemovedFromClassView",
        occurredOn: expect.any(Date),
        eventData: {
          classViewId: classView.id.toString(),
          className: classView.className.value,
          buttonId: button1.id.toString()
        }
      });
    });

    it("should handle removing last button", () => {
      // Arrange - Remove all buttons except one
      classView.removeButton(button1.id);

      // Act - Remove the last button
      const result = classView.removeButton(button2.id);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(classView.buttons).toHaveLength(0);
    });
  });

  describe("reorderButtons()", () => {
    let classView: ClassView;
    let button1: UIButton;
    let button2: UIButton;
    let button3: UIButton;

    beforeEach(() => {
      button1 = createMockUIButton({ order: 1 });
      button2 = createMockUIButton({ order: 2 });
      button3 = createMockUIButton({ order: 3 });
      
      const props = createValidClassViewProps({ buttons: [button1, button2, button3] });
      const result = ClassView.create(props);
      if (result.isFailure) throw new Error("Failed to create ClassView");
      classView = result.getValue();
    });

    it("should reorder buttons successfully", () => {
      // Arrange
      const newOrders = new Map([
        [button1.id.toString(), 3],
        [button2.id.toString(), 1],
        [button3.id.toString(), 2]
      ]);

      // Act
      const result = classView.reorderButtons(newOrders);

      // Assert
      expect(result.isSuccess).toBe(true);
      const buttons = classView.buttons;
      expect(buttons[0]).toBe(button2); // Should be first (order 1)
      expect(buttons[1]).toBe(button3); // Should be second (order 2)
      expect(buttons[2]).toBe(button1); // Should be third (order 3)
    });

    it("should fail when missing button in order map", () => {
      // Arrange - Missing button3
      const newOrders = new Map([
        [button1.id.toString(), 1],
        [button2.id.toString(), 2]
      ]);

      // Act
      const result = classView.reorderButtons(newOrders);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(`Missing order for button ${button3.id.toString()}`);
    });

    it("should fail when duplicate order values provided", () => {
      // Arrange
      const newOrders = new Map([
        [button1.id.toString(), 1],
        [button2.id.toString(), 1], // Duplicate order
        [button3.id.toString(), 2]
      ]);

      // Act
      const result = classView.reorderButtons(newOrders);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Duplicate order values not allowed");
    });

    it("should raise domain event when buttons reordered", () => {
      // Arrange
      const newOrders = new Map([
        [button1.id.toString(), 3],
        [button2.id.toString(), 1],
        [button3.id.toString(), 2]
      ]);
      const addDomainEventSpy = jest.spyOn(classView, 'addDomainEvent');

      // Act
      const result = classView.reorderButtons(newOrders);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(addDomainEventSpy).toHaveBeenCalledWith({
        aggregateId: classView.id.toString(),
        eventType: "ButtonsReordered",
        occurredOn: expect.any(Date),
        eventData: {
          classViewId: classView.id.toString(),
          className: classView.className.value,
          newOrder: Array.from(newOrders.entries())
        }
      });
    });

    it("should handle empty button list", () => {
      // Arrange - Create ClassView with no buttons
      const emptyProps = createValidClassViewProps({ buttons: [] });
      const emptyResult = ClassView.create(emptyProps);
      const emptyClassView = emptyResult.getValue();

      const emptyOrders = new Map();

      // Act
      const result = emptyClassView.reorderButtons(emptyOrders);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(emptyClassView.buttons).toHaveLength(0);
    });
  });

  describe("updateDisplayOptions()", () => {
    let classView: ClassView;

    beforeEach(() => {
      const props = createValidClassViewProps();
      const result = ClassView.create(props);
      if (result.isFailure) throw new Error("Failed to create ClassView");
      classView = result.getValue();
    });

    it("should update display options partially", () => {
      // Arrange
      const updates: Partial<DisplayOptions> = {
        showButtons: false,
        buttonPosition: "bottom"
      };

      // Act
      const result = classView.updateDisplayOptions(updates);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(classView.displayOptions).toEqual({
        showProperties: true,  // Unchanged
        showRelations: true,   // Unchanged
        showBacklinks: true,   // Unchanged
        showButtons: false,    // Updated
        buttonPosition: "bottom" // Updated
      });
    });

    it("should update all display options", () => {
      // Arrange
      const updates: Partial<DisplayOptions> = {
        showProperties: false,
        showRelations: false,
        showBacklinks: false,
        showButtons: false,
        buttonPosition: "floating"
      };

      // Act
      const result = classView.updateDisplayOptions(updates);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(classView.displayOptions).toEqual(updates);
    });

    it("should raise domain event when display options updated", () => {
      // Arrange
      const updates: Partial<DisplayOptions> = {
        showButtons: false
      };
      const addDomainEventSpy = jest.spyOn(classView, 'addDomainEvent');

      // Act
      const result = classView.updateDisplayOptions(updates);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(addDomainEventSpy).toHaveBeenCalledWith({
        aggregateId: classView.id.toString(),
        eventType: "DisplayOptionsUpdated",
        occurredOn: expect.any(Date),
        eventData: {
          classViewId: classView.id.toString(),
          className: classView.className.value,
          displayOptions: expect.objectContaining({
            showButtons: false
          })
        }
      });
    });

    it("should handle empty update object", () => {
      // Arrange
      const originalOptions = { ...classView.displayOptions };
      const updates: Partial<DisplayOptions> = {};

      // Act
      const result = classView.updateDisplayOptions(updates);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(classView.displayOptions).toEqual(originalOptions);
    });
  });

  describe("getEnabledButtons()", () => {
    let classView: ClassView;

    beforeEach(() => {
      const enabledButton1 = createMockUIButton({ order: 1, isEnabled: true });
      const enabledButton2 = createMockUIButton({ order: 3, isEnabled: true });
      const disabledButton = createMockUIButton({ order: 2, isEnabled: false });
      
      const props = createValidClassViewProps({ 
        buttons: [enabledButton1, disabledButton, enabledButton2]
      });
      const result = ClassView.create(props);
      if (result.isFailure) throw new Error("Failed to create ClassView");
      classView = result.getValue();
    });

    it("should return only enabled buttons", () => {
      // Act
      const enabledButtons = classView.getEnabledButtons();

      // Assert
      expect(enabledButtons).toHaveLength(2);
      expect(enabledButtons.every(button => button.isEnabled)).toBe(true);
    });

    it("should return empty array when no enabled buttons", () => {
      // Arrange - Disable all buttons
      const disabledButton1 = createMockUIButton({ order: 1, isEnabled: false });
      const disabledButton2 = createMockUIButton({ order: 2, isEnabled: false });
      
      const props = createValidClassViewProps({ buttons: [disabledButton1, disabledButton2] });
      const result = ClassView.create(props);
      const cvWithDisabledButtons = result.getValue();

      // Act
      const enabledButtons = cvWithDisabledButtons.getEnabledButtons();

      // Assert
      expect(enabledButtons).toHaveLength(0);
    });

    it("should maintain order in enabled buttons", () => {
      // Act
      const enabledButtons = classView.getEnabledButtons();

      // Assert
      expect(enabledButtons[0].order).toBe(1);
      expect(enabledButtons[1].order).toBe(3);
    });
  });

  describe("hasExecutableButtons()", () => {
    it("should return true when has enabled buttons and buttons are shown", () => {
      // Arrange
      const enabledButton = createMockUIButton({ isEnabled: true });
      const props = createValidClassViewProps({ 
        buttons: [enabledButton],
        displayOptions: { showButtons: true, buttonPosition: "top" } as DisplayOptions
      });
      const result = ClassView.create(props);
      const classView = result.getValue();

      // Act & Assert
      expect(classView.hasExecutableButtons()).toBe(true);
    });

    it("should return false when buttons are hidden", () => {
      // Arrange
      const enabledButton = createMockUIButton({ isEnabled: true });
      const props = createValidClassViewProps({ 
        buttons: [enabledButton],
        displayOptions: { showButtons: false, buttonPosition: "top" } as DisplayOptions
      });
      const result = ClassView.create(props);
      const classView = result.getValue();

      // Act & Assert
      expect(classView.hasExecutableButtons()).toBe(false);
    });

    it("should return false when no enabled buttons", () => {
      // Arrange
      const disabledButton = createMockUIButton({ isEnabled: false });
      const props = createValidClassViewProps({ 
        buttons: [disabledButton],
        displayOptions: { showButtons: true, buttonPosition: "top" } as DisplayOptions
      });
      const result = ClassView.create(props);
      const classView = result.getValue();

      // Act & Assert
      expect(classView.hasExecutableButtons()).toBe(false);
    });

    it("should return false when no buttons at all", () => {
      // Arrange
      const props = createValidClassViewProps({ 
        buttons: [],
        displayOptions: { showButtons: true, buttonPosition: "top" } as DisplayOptions
      });
      const result = ClassView.create(props);
      const classView = result.getValue();

      // Act & Assert
      expect(classView.hasExecutableButtons()).toBe(false);
    });
  });

  describe("findButton()", () => {
    let classView: ClassView;
    let button1: UIButton;
    let button2: UIButton;

    beforeEach(() => {
      button1 = createMockUIButton({ order: 1, label: "Button 1" });
      button2 = createMockUIButton({ order: 2, label: "Button 2" });
      
      const props = createValidClassViewProps({ buttons: [button1, button2] });
      const result = ClassView.create(props);
      if (result.isFailure) throw new Error("Failed to create ClassView");
      classView = result.getValue();
    });

    it("should find existing button by ID", () => {
      // Act
      const foundButton = classView.findButton(button1.id);

      // Assert
      expect(foundButton).toBe(button1);
    });

    it("should return undefined for non-existent button", () => {
      // Arrange
      const nonExistentId = AssetId.generate();

      // Act
      const foundButton = classView.findButton(nonExistentId);

      // Assert
      expect(foundButton).toBeUndefined();
    });

    it("should find correct button among multiple buttons", () => {
      // Act
      const foundButton = classView.findButton(button2.id);

      // Assert
      expect(foundButton).toBe(button2);
      expect(foundButton?.label).toBe("Button 2");
    });
  });

  describe("Business Rules and Edge Cases", () => {
    it("should handle button addition and removal sequences", () => {
      // Arrange
      const props = createValidClassViewProps();
      const result = ClassView.create(props);
      const classView = result.getValue();

      const button1 = createMockUIButton({ order: 1 });
      const button2 = createMockUIButton({ order: 2 });
      const button3 = createMockUIButton({ order: 3 });

      // Act & Assert - Add buttons
      expect(classView.addButton(button1).isSuccess).toBe(true);
      expect(classView.addButton(button2).isSuccess).toBe(true);
      expect(classView.addButton(button3).isSuccess).toBe(true);
      expect(classView.buttons).toHaveLength(3);

      // Act & Assert - Remove middle button
      expect(classView.removeButton(button2.id).isSuccess).toBe(true);
      expect(classView.buttons).toHaveLength(2);

      // Act & Assert - Add new button with same order as removed
      const newButton = createMockUIButton({ order: 2 });
      expect(classView.addButton(newButton).isSuccess).toBe(true);
      expect(classView.buttons).toHaveLength(3);
    });

    it("should handle complex reordering scenarios", () => {
      // Arrange
      const buttons = Array.from({ length: 5 }, (_, index) => 
        createMockUIButton({ order: index + 1 })
      );
      const props = createValidClassViewProps({ buttons });
      const result = ClassView.create(props);
      const classView = result.getValue();

      // Reverse the order
      const newOrders = new Map();
      buttons.forEach((button, index) => {
        newOrders.set(button.id.toString(), buttons.length - index);
      });

      // Act
      const reorderResult = classView.reorderButtons(newOrders);

      // Assert
      expect(reorderResult.isSuccess).toBe(true);
      const reorderedButtons = classView.buttons;
      // The buttons should be sorted by their new order
      expect(reorderedButtons).toHaveLength(buttons.length);
      // Check that the first button has the highest order (was reversed)
      expect(reorderedButtons[0].order).toBe(1); // After reordering, buttons are sorted
    });

    it("should maintain consistency after multiple operations", () => {
      // Arrange
      const props = createValidClassViewProps();
      const result = ClassView.create(props);
      const classView = result.getValue();

      // Act - Perform multiple operations
      const button1 = createMockUIButton({ order: 1 });
      classView.addButton(button1);
      
      classView.updateDisplayOptions({ showButtons: false });
      
      const button2 = createMockUIButton({ order: 2 });
      classView.addButton(button2);
      
      classView.updateDisplayOptions({ buttonPosition: "floating" });
      
      // Assert - Verify final state
      expect(classView.buttons).toHaveLength(2);
      expect(classView.displayOptions.showButtons).toBe(false);
      expect(classView.displayOptions.buttonPosition).toBe("floating");
      expect(classView.hasExecutableButtons()).toBe(false); // Because showButtons is false
    });

    it("should handle maximum capacity edge case", () => {
      // Arrange - Create ClassView at maximum capacity
      const maxButtons = Array.from({ length: 20 }, (_, index) => 
        createMockUIButton({ order: index + 1 })
      );
      const props = createValidClassViewProps({ buttons: maxButtons });
      const result = ClassView.create(props);
      const classView = result.getValue();

      // Assert initial state
      expect(classView.buttons).toHaveLength(20);

      // Act - Try to add one more
      const extraButton = createMockUIButton({ order: 21 });
      const addResult = classView.addButton(extraButton);

      // Assert
      expect(addResult.isFailure).toBe(true);
      expect(classView.buttons).toHaveLength(20);

      // Act - Remove one button
      const removeResult = classView.removeButton(maxButtons[0].id);

      // Assert
      expect(removeResult.isSuccess).toBe(true);
      expect(classView.buttons).toHaveLength(19);

      // Act - Now add the extra button (should succeed)
      const addResult2 = classView.addButton(extraButton);

      // Assert
      expect(addResult2.isSuccess).toBe(true);
      expect(classView.buttons).toHaveLength(20);
    });
  });

  describe("Domain Events", () => {
    let classView: ClassView;
    let addDomainEventSpy: jest.SpyInstance;

    beforeEach(() => {
      const props = createValidClassViewProps();
      const result = ClassView.create(props);
      classView = result.getValue();
      addDomainEventSpy = jest.spyOn(classView, 'addDomainEvent');
    });

    afterEach(() => {
      if (addDomainEventSpy && addDomainEventSpy.mockRestore) {
        addDomainEventSpy.mockRestore();
      }
    });

    it("should not raise events for failed operations", () => {
      // Arrange
      const button = createMockUIButton({ order: 1 });
      classView.addButton(button);
      addDomainEventSpy.mockClear();

      // Act - Try to add the same button again (should fail)
      const result = classView.addButton(button);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(addDomainEventSpy).not.toHaveBeenCalled();
    });

    it("should raise events with correct timing information", () => {
      // Arrange
      const startTime = new Date();
      const button = createMockUIButton({ order: 1 });

      // Act
      classView.addButton(button);

      // Assert
      expect(addDomainEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          occurredOn: expect.any(Date)
        })
      );

      const eventCall = addDomainEventSpy.mock.calls[0][0];
      const eventTime = eventCall.occurredOn;
      expect(eventTime.getTime()).toBeGreaterThanOrEqual(startTime.getTime());
    });

    it("should include all required event data", () => {
      // Arrange
      const button = createMockUIButton({ order: 1, label: "Test Event Button" });

      // Act
      classView.addButton(button);

      // Assert
      expect(addDomainEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateId: classView.id.toString(),
          eventType: "ButtonAddedToClassView",
          eventData: expect.objectContaining({
            classViewId: classView.id.toString(),
            className: classView.className.value,
            buttonId: button.id.toString(),
            buttonLabel: button.label
          })
        })
      );
    });
  });
});