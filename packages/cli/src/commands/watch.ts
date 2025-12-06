import { Command } from "commander";
import { resolve } from "path";
import { FileSystemWatcher, WatchEvent } from "../watchers/FileSystemWatcher.js";
import { ExitCodes } from "../utils/ExitCodes.js";
import {
  VaultNotFoundError,
  InvalidArgumentsError,
} from "../utils/errors/index.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { ErrorCode, ResponseBuilder } from "../responses/index.js";
import fs from "fs";

export interface WatchOptions {
  vault: string;
  pattern?: string;
  assetType?: string;
  debounce?: number;
}

/**
 * Creates the 'watch' command for monitoring vault file changes
 *
 * Watch command always outputs NDJSON for streaming compatibility.
 * Errors are emitted as structured JSON error events.
 *
 * @returns Commander Command instance configured for file watching
 *
 * @example
 * exocortex watch --vault ~/vault
 * exocortex watch --pattern "tasks/**" --vault ~/vault
 * exocortex watch --asset-type "ems__Task" --vault ~/vault
 */
export function watchCommand(): Command {
  return new Command("watch")
    .description("Watch vault for file changes and emit NDJSON events")
    .option("--vault <path>", "Path to Obsidian vault", process.cwd())
    .option("--pattern <glob>", "Glob pattern to filter files (e.g., '*.md', 'tasks/**')")
    .option("--asset-type <type>", "Filter by asset type (e.g., 'ems__Task', 'ems__Project')")
    .option("--debounce <ms>", "Debounce interval in milliseconds", "100")
    .action(async (options: WatchOptions) => {
      // Watch always uses JSON output for streaming
      ErrorHandler.setFormat("json");

      try {
        const vaultPath = resolve(options.vault);

        // Validate vault path exists and is a directory
        if (!fs.existsSync(vaultPath)) {
          throw new VaultNotFoundError(vaultPath);
        }

        if (!fs.statSync(vaultPath).isDirectory()) {
          throw new InvalidArgumentsError(
            `Vault path is not a directory: ${vaultPath}`,
            "Provide a path to a directory, not a file",
            { vaultPath },
          );
        }

        const debounceMs = parseInt(options.debounce?.toString() ?? "100", 10);
        if (isNaN(debounceMs) || debounceMs < 0) {
          throw new InvalidArgumentsError(
            "--debounce must be a non-negative integer",
            "Use a positive integer value for debounce",
            { debounce: options.debounce },
          );
        }

        const watcher = new FileSystemWatcher(vaultPath, {
          pattern: options.pattern,
          assetType: options.assetType,
          debounceMs,
        });

        // Handle change events - emit as NDJSON
        watcher.on("change", (event: WatchEvent) => {
          console.log(JSON.stringify(event));
        });

        // Handle errors - emit as structured error events
        watcher.on("error", (error: Error) => {
          const errorResponse = ResponseBuilder.error(
            ErrorCode.INTERNAL_OPERATION_FAILED,
            error.message,
            ExitCodes.OPERATION_FAILED,
            {
              recovery: {
                message: "Check file permissions and vault access",
                suggestion: "Ensure the vault directory is accessible",
              },
            },
          );
          console.log(JSON.stringify(errorResponse));
        });

        // Handle graceful shutdown
        const shutdown = () => {
          watcher.stop();
          process.exit(ExitCodes.SUCCESS);
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);

        // Log startup info to stderr (so it doesn't interfere with NDJSON on stdout)
        console.error(`Watching vault: ${vaultPath}`);
        if (options.pattern) {
          console.error(`  Pattern filter: ${options.pattern}`);
        }
        if (options.assetType) {
          console.error(`  Asset type filter: ${options.assetType}`);
        }
        console.error(`  Debounce: ${debounceMs}ms`);
        console.error("Press Ctrl+C to stop");

        // Start watching
        watcher.start();
      } catch (error) {
        ErrorHandler.handle(error as Error);
      }
    });
}
