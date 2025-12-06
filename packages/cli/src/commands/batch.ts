import { Command } from "commander";
import { resolve } from "path";
import fs from "fs-extra";
import { BatchExecutor, type BatchResult } from "../executors/BatchExecutor.js";
import { ErrorHandler, type OutputFormat } from "../utils/ErrorHandler.js";
import { InvalidArgumentsError } from "../utils/errors/index.js";
import { ResponseBuilder } from "../responses/index.js";
import { ExitCodes } from "../utils/ExitCodes.js";

export interface BatchOptions {
  vault: string;
  input?: string;
  file?: string;
  atomic?: boolean;
  dryRun?: boolean;
  format?: OutputFormat;
}

/**
 * Outputs batch result in the specified format
 */
function outputResult(format: OutputFormat, result: BatchResult): void {
  if (format === "json") {
    const response = ResponseBuilder.success(result, {
      durationMs: result.durationMs,
      itemCount: result.total,
    });
    console.log(JSON.stringify(response, null, 2));
  } else {
    // Text format output
    console.log(`\n📦 Batch Execution ${result.success ? "Complete" : "Failed"}`);
    console.log(`   Total: ${result.total} operations`);
    console.log(`   ✅ Succeeded: ${result.succeeded}`);
    console.log(`   ❌ Failed: ${result.failed}`);
    console.log(`   ⏱️  Duration: ${result.durationMs}ms`);

    if (result.atomic) {
      console.log(`   🔒 Atomic mode: ${result.rolledBack ? "Rolled back" : "Committed"}`);
    }

    if (result.failed > 0) {
      console.log("\n📋 Failed Operations:");
      for (const op of result.results.filter((r) => !r.success)) {
        console.log(`   ❌ ${op.command} ${op.filepath}: ${op.error}`);
      }
    }

    if (result.succeeded > 0 && format === "text") {
      console.log("\n📋 Successful Operations:");
      for (const op of result.results.filter((r) => r.success)) {
        console.log(`   ✅ ${op.command} ${op.filepath}: ${op.action}`);
      }
    }
  }
}

/**
 * Creates the 'batch' subcommand for executing multiple operations efficiently
 *
 * @returns Commander Command instance configured for batch execution
 *
 * @example
 * # Execute batch from JSON input
 * exocortex batch --input '[{"command":"start","filepath":"task1.md"},{"command":"complete","filepath":"task2.md"}]'
 *
 * # Execute batch from file
 * exocortex batch --file operations.json
 *
 * # Atomic mode (all-or-nothing)
 * exocortex batch --file operations.json --atomic
 *
 * # Dry run (preview without executing)
 * exocortex batch --file operations.json --dry-run
 *
 * # JSON output for MCP integration
 * exocortex batch --file operations.json --format json
 */
export function batchCommand(): Command {
  return new Command("batch")
    .description("Execute multiple operations in a single CLI invocation")
    .option("--vault <path>", "Path to Obsidian vault", process.cwd())
    .option("--input <json>", "JSON array of operations to execute")
    .option("--file <path>", "Path to JSON file containing operations")
    .option("--atomic", "All-or-nothing execution (rollback on any failure)")
    .option("--dry-run", "Preview changes without modifying files")
    .option("--format <type>", "Output format: text|json (default: text)", "text")
    .action(async (options: BatchOptions) => {
      const format = (options.format || "text") as OutputFormat;
      ErrorHandler.setFormat(format);

      try {
        const vaultPath = resolve(options.vault);

        // Get operations from input or file
        let operationsJson: string;

        if (options.input) {
          operationsJson = options.input;
        } else if (options.file) {
          const filePath = resolve(options.file);
          if (!fs.existsSync(filePath)) {
            throw new InvalidArgumentsError(
              `Batch file not found: ${filePath}`,
              "exocortex batch --file operations.json",
            );
          }
          operationsJson = await fs.readFile(filePath, "utf-8");
        } else {
          throw new InvalidArgumentsError(
            "Either --input or --file option is required",
            'exocortex batch --input \'[{"command":"start","filepath":"task.md"}]\' or exocortex batch --file operations.json',
          );
        }

        // Parse operations
        const operations = BatchExecutor.parseInput(operationsJson);

        if (operations.length === 0) {
          throw new InvalidArgumentsError(
            "Batch input contains no operations",
            'exocortex batch --input \'[{"command":"start","filepath":"task.md"}]\'',
          );
        }

        // Execute batch
        const executor = new BatchExecutor(vaultPath, options.dryRun);
        const result = await executor.executeBatch(operations, options.atomic);

        // Output result
        outputResult(format, result);

        // Exit with appropriate code
        process.exit(result.success ? ExitCodes.SUCCESS : ExitCodes.OPERATION_FAILED);
      } catch (error) {
        ErrorHandler.handle(error as Error);
      }
    });
}
