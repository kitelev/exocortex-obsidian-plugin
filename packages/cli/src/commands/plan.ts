import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
// PlanningService temporarily removed from core - needs migration
// import { PlanningService } from '@exocortex/core';
// import { NodeFsAdapter } from '../adapters/NodeFsAdapter.js';
// import * as path from 'path';

export function planCommand(): Command {
  const cmd = new Command('today');

  cmd
    .description('Plan task for today')
    .requiredOption('-t, --task <path>', 'Path to task file')
    .option('-r, --root <path>', 'Root directory of vault', process.cwd())
    .action(async () => {
      const spinner = ora('Planning task for today...').start();

      try {
        // TODO: Re-enable after PlanningService migration to core
        spinner.fail('Planning command temporarily disabled during monorepo migration');
        return;

        /*
        const adapter = new NodeFsAdapter(options.root);
        const service = new PlanningService(adapter);

        const taskPath = path.relative(options.root, options.task);
        await service.planOnToday(taskPath);

        spinner.succeed(chalk.green(`Task planned for today: ${taskPath}`));
        */
      } catch (error) {
        spinner.fail(chalk.red(`Failed to plan task: ${(error as Error).message}`));
        process.exit(1);
      }
    });

  return cmd;
}
