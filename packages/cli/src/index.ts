#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createTaskCommand } from './commands/create-task.js';
import { createInstanceCommand } from './commands/create-instance.js';
import { statusCommand } from './commands/status.js';
import { planCommand } from './commands/plan.js';

const program = new Command();

program
  .name('exocortex')
  .description('CLI tool for Exocortex knowledge management system')
  .version('0.1.0');

program
  .command('create')
  .description('Create new assets')
  .addCommand(createTaskCommand())
  .addCommand(createInstanceCommand());

program
  .command('status')
  .description('Manage task status')
  .addCommand(statusCommand());

program
  .command('plan')
  .description('Plan tasks for specific days')
  .addCommand(planCommand());

program.parse();
