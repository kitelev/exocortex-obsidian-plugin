import { Command } from "commander";
import { resolve } from "path";
import { CommandExecutor } from "../executors/CommandExecutor.js";

export interface CommandOptions {
  vault: string;
  label?: string;
}

/**
 * Creates the 'command' subcommand for executing plugin commands via CLI
 *
 * @returns Commander Command instance configured for command execution
 *
 * @example
 * exocortex command rename-to-uid "03 Knowledge/tasks/task.md"
 * exocortex command start "path/to/task.md" --vault /path/to/vault
 */
export function commandCommand(): Command {
  return new Command("command")
    .description("Execute plugin command on single asset")
    .argument("<command-name>", "Command to execute (rename-to-uid, start, complete, etc.)")
    .argument("<filepath>", "Path to asset file (relative to vault root or absolute)")
    .option("--vault <path>", "Path to Obsidian vault", process.cwd())
    .option("--label <value>", "New label value (required for update-label command)")
    .action(async (commandName: string, filepath: string, options: CommandOptions) => {
      const vaultPath = resolve(options.vault);
      const executor = new CommandExecutor(vaultPath);

      switch (commandName) {
        // Maintenance commands
        case "rename-to-uid":
          await executor.executeRenameToUid(filepath);
          break;

        case "update-label":
          if (!options.label) {
            console.error("Error: --label option is required for update-label command");
            console.error("Usage: exocortex command update-label <filepath> --label \"<value>\"");
            process.exit(2); // ExitCodes.INVALID_ARGUMENTS
          }
          await executor.executeUpdateLabel(filepath, options.label);
          break;

        // Status transition commands
        case "start":
          await executor.executeStart(filepath);
          break;

        case "complete":
          await executor.executeComplete(filepath);
          break;

        case "trash":
          await executor.executeTrash(filepath);
          break;

        case "archive":
          await executor.executeArchive(filepath);
          break;

        case "move-to-backlog":
          await executor.executeMoveToBacklog(filepath);
          break;

        case "move-to-analysis":
          await executor.executeMoveToAnalysis(filepath);
          break;

        case "move-to-todo":
          await executor.executeMoveToToDo(filepath);
          break;

        default:
          // For other commands, use the old generic execute method
          await executor.execute(commandName, filepath, options);
          break;
      }
    });
}
