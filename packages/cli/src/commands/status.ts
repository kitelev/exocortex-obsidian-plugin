import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import * as path from "path";
import { TaskStatusService } from "@exocortex/core";
import { NodeFsAdapter } from "../adapters/NodeFsAdapter.js";

export function statusCommand(): Command {
  const cmd = new Command("todo");

  cmd
    .description("Move task to ToDo status")
    .requiredOption("-t, --task <path>", "Path to task file")
    .option("-r, --root <path>", "Root directory of vault", process.cwd())
    .action(async (options) => {
      const spinner = ora("Updating task status to ToDo...").start();

      try {
        const adapter = new NodeFsAdapter(options.root);
        const service = new TaskStatusService(adapter);

        const taskPath = path.relative(options.root, options.task);
        await service.moveToToDo(taskPath);

        spinner.succeed(
          chalk.green(`Task status updated to ToDo: ${taskPath}`),
        );
      } catch (error) {
        spinner.fail(
          chalk.red(`Failed to update status: ${(error as Error).message}`),
        );
        process.exit(1);
      }
    });

  return cmd;
}
