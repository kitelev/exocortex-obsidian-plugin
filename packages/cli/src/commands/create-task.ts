import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import * as path from "path";
import { TaskCreationService, AssetClass } from "@exocortex/core";
import { NodeFsAdapter } from "../adapters/NodeFsAdapter.js";

export function createTaskCommand(): Command {
  const cmd = new Command("task");

  cmd
    .description("Create a new task from an area or project")
    .requiredOption(
      "-s, --source <path>",
      "Path to source file (area or project)",
    )
    .option("-l, --label <label>", "Task label")
    .option("--size <size>", "Task size")
    .option("-r, --root <path>", "Root directory of vault", process.cwd())
    .action(async (options) => {
      const spinner = ora("Creating task...").start();

      try {
        const adapter = new NodeFsAdapter(options.root);
        const service = new TaskCreationService(adapter);

        const sourcePath = path.relative(options.root, options.source);
        const metadata = await adapter.getFileMetadata(sourcePath);

        let sourceClass = AssetClass.AREA;
        if (metadata.exo__Instance_class) {
          const classes = Array.isArray(metadata.exo__Instance_class)
            ? metadata.exo__Instance_class
            : [metadata.exo__Instance_class];

          const normalizedClass = classes[0]?.replace(/["'[\]]/g, "").trim();
          if (normalizedClass === AssetClass.PROJECT) {
            sourceClass = AssetClass.PROJECT;
          } else if (normalizedClass === AssetClass.TASK_PROTOTYPE) {
            sourceClass = AssetClass.TASK_PROTOTYPE;
          }
        }

        const createdPath = await service.createTask(
          sourcePath,
          metadata,
          sourceClass,
          options.label,
          options.size || null,
        );

        spinner.succeed(chalk.green(`Task created: ${createdPath}`));
      } catch (error) {
        spinner.fail(
          chalk.red(`Failed to create task: ${(error as Error).message}`),
        );
        process.exit(1);
      }
    });

  return cmd;
}
