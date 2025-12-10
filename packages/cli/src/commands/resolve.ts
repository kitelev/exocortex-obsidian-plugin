import { Command } from "commander";
import { existsSync, readdirSync } from "fs";
import { resolve, join, basename, relative } from "path";
import { ErrorHandler, type OutputFormat } from "../utils/ErrorHandler.js";
import { VaultNotFoundError, InvalidArgumentsError } from "../utils/errors/index.js";
import { ResponseBuilder, ErrorCode, type ResolveResult } from "../responses/index.js";
import { ExitCodes } from "../utils/ExitCodes.js";

export interface ResolveOptions {
  vault: string;
  format: "uri" | "path" | "json";
  output?: OutputFormat;
  partial?: boolean;
}

/**
 * Creates the 'resolve' command for resolving UUIDs to file paths
 *
 * @returns Commander Command instance configured for UUID resolution
 *
 * @example
 * # Default: returns obsidian:// URI
 * exocortex resolve 3b584ede-e33c-4666-8a89-5d1506618452
 *
 * # Return absolute file path
 * exocortex resolve 3b584ede --format path
 *
 * # Return JSON with all formats
 * exocortex resolve 3b584ede --format json
 *
 * # Find all matches for partial UUID
 * exocortex resolve 3b58 --partial
 */
export function resolveCommand(): Command {
  return new Command("resolve")
    .description("Resolve UUID to file path")
    .argument("<uuid>", "Full or partial UUID to resolve")
    .option("--vault <path>", "Path to Obsidian vault", process.cwd())
    .option("--format <type>", "Output format: uri|path|json (default: uri)", "uri")
    .option("--output <type>", "Response format: text|json (for MCP tools)", "text")
    .option("--partial", "Match partial UUIDs (returns all matches)")
    .action(async (uuid: string, options: ResolveOptions) => {
      const outputFormat = (options.output || "text") as OutputFormat;
      ErrorHandler.setFormat(outputFormat);

      try {
        const startTime = Date.now();

        // Validate UUID format (basic validation)
        if (!isValidUuidFormat(uuid)) {
          throw new InvalidArgumentsError(
            `Invalid UUID format: ${uuid}`,
            "exocortex resolve <uuid> [--format uri|path|json] [--partial]",
            { uuid },
          );
        }

        const vaultPath = resolve(options.vault);
        if (!existsSync(vaultPath)) {
          throw new VaultNotFoundError(vaultPath);
        }

        // Find matching files
        const matches = findFilesWithUuid(vaultPath, uuid, options.partial ?? false);
        const duration = Date.now() - startTime;

        if (matches.length === 0) {
          if (outputFormat === "json") {
            const response = ResponseBuilder.error(
              ErrorCode.VALIDATION_FILE_NOT_FOUND,
              `UUID not found: ${uuid}`,
              ExitCodes.FILE_NOT_FOUND,
              { context: { uuid } },
            );
            console.log(JSON.stringify(response, null, 2));
          } else {
            console.error(`UUID not found: ${uuid}`);
          }
          process.exit(1);
        }

        // Output results based on format
        if (options.partial || matches.length > 1) {
          // Multiple matches
          outputMultipleResults(
            matches,
            vaultPath,
            options.format,
            outputFormat,
            uuid,
            duration,
          );
        } else {
          // Single match
          outputSingleResult(
            matches[0],
            vaultPath,
            options.format,
            outputFormat,
            uuid,
            duration,
          );
        }
      } catch (error) {
        ErrorHandler.handle(error as Error);
      }
    });
}

/**
 * Validates UUID format (full or partial)
 * Accepts:
 * - Full UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * - Partial UUID: at least 4 hex characters
 */
function isValidUuidFormat(uuid: string): boolean {
  // Must be at least 4 characters for partial match
  if (uuid.length < 4) {
    return false;
  }

  // Allow full UUID format or hex-only partial
  const fullUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const partialPattern = /^[0-9a-f-]+$/i;

  return fullUuidPattern.test(uuid) || partialPattern.test(uuid);
}

/**
 * Recursively finds all markdown files containing the UUID in their filename
 */
function findFilesWithUuid(
  vaultPath: string,
  uuid: string,
  partial: boolean,
): string[] {
  const matches: string[] = [];
  const uuidLower = uuid.toLowerCase();

  function walk(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip hidden directories and common non-content directories
        if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
          walk(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const fileNameLower = entry.name.toLowerCase();

        if (partial) {
          // Partial match: filename contains the UUID fragment
          if (fileNameLower.includes(uuidLower)) {
            matches.push(fullPath);
          }
        } else {
          // Exact match: filename starts with the UUID or is exactly the UUID
          // Handle both "uuid.md" and "uuid - title.md" patterns
          if (
            fileNameLower.startsWith(uuidLower + ".md") ||
            fileNameLower.startsWith(uuidLower + " ") ||
            fileNameLower.startsWith(uuidLower + "-")
          ) {
            matches.push(fullPath);
          }
        }
      }
    }
  }

  walk(vaultPath);
  return matches;
}

/**
 * Converts a file path to obsidian:// URI
 */
function pathToObsidianUri(relativePath: string): string {
  const encoded = encodeURI(relativePath);
  return `obsidian://vault/${encoded}`;
}

/**
 * Extracts UUID from filename (assumes UUID is at the start)
 */
function extractUuidFromFilename(filename: string): string {
  // Match UUID pattern at start of filename
  const match = filename.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (match) {
    return match[1];
  }
  // Return filename without extension as fallback
  return basename(filename, ".md");
}

/**
 * Outputs a single match result
 */
function outputSingleResult(
  absolutePath: string,
  vaultPath: string,
  format: "uri" | "path" | "json",
  outputFormat: OutputFormat,
  searchUuid: string,
  duration: number,
): void {
  const relativePath = relative(vaultPath, absolutePath);
  const uri = pathToObsidianUri(relativePath);
  const uuid = extractUuidFromFilename(basename(absolutePath));

  if (outputFormat === "json") {
    const result: ResolveResult = {
      uuid,
      path: relativePath,
      absolutePath,
      uri,
    };
    const response = ResponseBuilder.success(result, {
      durationMs: duration,
      searchUuid,
    });
    console.log(JSON.stringify(response, null, 2));
  } else {
    switch (format) {
      case "path":
        console.log(absolutePath);
        break;
      case "json":
        console.log(
          JSON.stringify(
            {
              uuid,
              path: relativePath,
              absolutePath,
              uri,
            },
            null,
            2,
          ),
        );
        break;
      case "uri":
      default:
        console.log(uri);
        break;
    }
  }
}

/**
 * Outputs multiple match results (for --partial flag)
 */
function outputMultipleResults(
  matches: string[],
  vaultPath: string,
  format: "uri" | "path" | "json",
  outputFormat: OutputFormat,
  searchUuid: string,
  duration: number,
): void {
  const results = matches.map((absolutePath) => {
    const relativePath = relative(vaultPath, absolutePath);
    const uri = pathToObsidianUri(relativePath);
    const uuid = extractUuidFromFilename(basename(absolutePath));

    return {
      uuid,
      path: relativePath,
      absolutePath,
      uri,
    };
  });

  if (outputFormat === "json") {
    const response = ResponseBuilder.success(
      { matches: results, count: results.length },
      {
        durationMs: duration,
        searchUuid,
        itemCount: results.length,
      },
    );
    console.log(JSON.stringify(response, null, 2));
  } else {
    switch (format) {
      case "path":
        for (const result of results) {
          console.log(result.absolutePath);
        }
        break;
      case "json":
        console.log(JSON.stringify(results, null, 2));
        break;
      case "uri":
      default:
        for (const result of results) {
          console.log(result.uri);
        }
        break;
    }
  }
}
