import {
  ButtonCommand,
  CommandType,
} from "../../../../src/domain/entities/ButtonCommand";
import { AssetId } from "../../../../src/domain/value-objects/AssetId";
import { Result } from "../../../../src/domain/core/Result";

describe("ButtonCommand - CREATE_CHILD_TASK", () => {
  describe("create", () => {
    it("should create a CREATE_CHILD_TASK command successfully", () => {
      const props = {
        id: AssetId.create("create-task-btn").getValue(),
        type: CommandType.CREATE_CHILD_TASK,
        name: "Create Child Task",
        description: "Creates a new task as child of current project",
        requiresInput: false,
        parameters: [],
        targetClass: "ems__Project",
      };

      const result = ButtonCommand.create(props);

      expect(result.isSuccess).toBe(true);
      const command = result.getValue();
      expect(command.type).toBe(CommandType.CREATE_CHILD_TASK);
      expect(command.name).toBe("Create Child Task");
      expect(command.targetClass).toBe("ems__Project");
      expect(command.requiresInput).toBe(false);
    });

    it("should create command with optional task title parameter", () => {
      const props = {
        id: AssetId.create("create-task-btn").getValue(),
        type: CommandType.CREATE_CHILD_TASK,
        name: "Create Child Task",
        requiresInput: true,
        parameters: [
          {
            name: "taskTitle",
            type: "string" as const,
            required: false,
            label: "Task Title",
            description: "Optional title for the new task",
          },
        ],
        targetClass: "ems__Project",
      };

      const result = ButtonCommand.create(props);

      expect(result.isSuccess).toBe(true);
      const command = result.getValue();
      expect(command.parameters).toHaveLength(1);
      expect(command.parameters[0].name).toBe("taskTitle");
    });
  });

  describe("canExecute", () => {
    it("should allow execution when current class is ems__Project", () => {
      const command = ButtonCommand.create({
        id: AssetId.create("create-task-btn").getValue(),
        type: CommandType.CREATE_CHILD_TASK,
        name: "Create Child Task",
        requiresInput: false,
        parameters: [],
        targetClass: "ems__Project",
      }).getValue();

      const canExecute = command.canExecute({
        currentClass: "ems__Project",
      });

      expect(canExecute).toBe(true);
    });

    it("should not allow execution when current class is not ems__Project", () => {
      const command = ButtonCommand.create({
        id: AssetId.create("create-task-btn").getValue(),
        type: CommandType.CREATE_CHILD_TASK,
        name: "Create Child Task",
        requiresInput: false,
        parameters: [],
        targetClass: "ems__Project",
      }).getValue();

      const canExecute = command.canExecute({
        currentClass: "ems__Task",
      });

      expect(canExecute).toBe(false);
    });

    it("should allow execution when no target class specified", () => {
      const command = ButtonCommand.create({
        id: AssetId.create("create-task-btn").getValue(),
        type: CommandType.CREATE_CHILD_TASK,
        name: "Create Child Task",
        requiresInput: false,
        parameters: [],
      }).getValue();

      const canExecute = command.canExecute({
        currentClass: "any__Class",
      });

      expect(canExecute).toBe(true);
    });
  });

  describe("buildExecutionContext", () => {
    it("should build execution context for CREATE_CHILD_TASK", () => {
      const command = ButtonCommand.create({
        id: AssetId.create("create-task-btn").getValue(),
        type: CommandType.CREATE_CHILD_TASK,
        name: "Create Child Task",
        requiresInput: false,
        parameters: [],
        targetClass: "ems__Project",
      }).getValue();

      const result = command.buildExecutionContext({});

      expect(result.isSuccess).toBe(true);
      const context = result.getValue();
      expect(context.commandType).toBe(CommandType.CREATE_CHILD_TASK);
      expect(context.targetClass).toBe("ems__Project");
    });

    it("should include provided parameters in context", () => {
      const command = ButtonCommand.create({
        id: AssetId.create("create-task-btn").getValue(),
        type: CommandType.CREATE_CHILD_TASK,
        name: "Create Child Task",
        requiresInput: true,
        parameters: [
          {
            name: "taskTitle",
            type: "string" as const,
            required: false,
            label: "Task Title",
          },
        ],
        targetClass: "ems__Project",
      }).getValue();

      const result = command.buildExecutionContext({
        taskTitle: "New Important Task",
      });

      expect(result.isSuccess).toBe(true);
      const context = result.getValue();
      expect(context.parameters.taskTitle).toBe("New Important Task");
    });
  });
});
