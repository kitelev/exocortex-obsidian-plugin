import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import * as path from "path";
import { TaskCreationService, AssetClass } from "@exocortex/core";
import { NodeFsAdapter } from "../adapters/NodeFsAdapter.js";

export function createInstanceCommand(): Command {
  const cmd = new Command("instance");

  cmd
    .description("Create an instance from a prototype")
    .requiredOption("-p, --prototype <path>", "Path to prototype file")
    .option("-l, --label <label>", "Instance label")
    .option("--size <size>", "Task size (for task instances)")
    .option("-r, --root <path>", "Root directory of vault", process.cwd())
    .action(async (options) => {
      const spinner = ora("Creating instance from prototype...").start();

      try {
        const adapter = new NodeFsAdapter(options.root);
        const service = new TaskCreationService(adapter);

        const prototypePath = path.relative(options.root, options.prototype);
        const metadata = await adapter.getFileMetadata(prototypePath);

        let sourceClass = AssetClass.TASK_PROTOTYPE;
        if (metadata.exo__Instance_class) {
          const classes = Array.isArray(metadata.exo__Instance_class)
            ? metadata.exo__Instance_class
            : [metadata.exo__Instance_class];

          const normalizedClass = classes[0]?.replace(/["'[\]]/g, "").trim();
          if (normalizedClass === AssetClass.MEETING_PROTOTYPE) {
            sourceClass = AssetClass.MEETING_PROTOTYPE;
          }
        }

        const createdPath = await service.createTask(
          prototypePath,
          metadata,
          sourceClass,
          options.label,
          options.size || null,
        );

        spinner.succeed(chalk.green(`Instance created: ${createdPath}`));
      } catch (error) {
        spinner.fail(
          chalk.red(`Failed to create instance: ${(error as Error).message}`),
        );
        process.exit(1);
      }
    });

  return cmd;
}
