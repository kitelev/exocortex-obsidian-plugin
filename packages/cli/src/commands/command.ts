import { Command } from "commander";
import { resolve } from "path";
import { CommandExecutor } from "../executors/CommandExecutor.js";

export interface CommandOptions {
  vault: string;
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
    .argument("<command-name>", "Command to execute (e.g., rename-to-uid, start, complete)")
    .argument("<filepath>", "Path to asset file (relative to vault root or absolute)")
    .option("--vault <path>", "Path to Obsidian vault", process.cwd())
    .action(async (commandName: string, filepath: string, options: CommandOptions) => {
      const vaultPath = resolve(options.vault);

      const executor = new CommandExecutor(vaultPath);
      await executor.execute(commandName, filepath, options);
    });
}
