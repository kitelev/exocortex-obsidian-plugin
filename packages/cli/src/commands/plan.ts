import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { PlanningService } from '@exocortex/core';
import { FileSystemVaultAdapter } from '../adapters/FileSystemVaultAdapter.js';
import * as path from 'path';

export function planCommand(): Command {
  const cmd = new Command('today');

  cmd
    .description('Plan task for today')
    .requiredOption('-t, --task <path>', 'Path to task file')
    .option('-r, --root <path>', 'Root directory of vault', process.cwd())
    .action(async (options) => {
      const spinner = ora('Planning task for today...').start();

      try {
        const adapter = new FileSystemVaultAdapter(options.root);
        const service = new PlanningService(adapter);

        const taskPath = path.relative(options.root, options.task);
        await service.planOnToday(taskPath);

        spinner.succeed(chalk.green(`Task planned for today: ${taskPath}`));
      } catch (error) {
        spinner.fail(chalk.red(`Failed to plan task: ${(error as Error).message}`));
        process.exit(1);
      }
    });

  return cmd;
}
