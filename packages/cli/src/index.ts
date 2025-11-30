#!/usr/bin/env node

import "reflect-metadata";
import { Command } from "commander";
import { sparqlQueryCommand } from "./commands/sparql-query.js";
import { commandCommand } from "./commands/command.js";

const program = new Command();

program
  .name("exocortex")
  .description("CLI tool for Exocortex knowledge management system")
  .version("0.1.0");

program
  .command("sparql")
  .description("SPARQL query execution")
  .addCommand(sparqlQueryCommand());

program.addCommand(commandCommand());

program.parse();
