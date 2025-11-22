import { NodeFsAdapter } from "../adapters/NodeFsAdapter.js";
import { PathResolver } from "../utils/PathResolver.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { ExitCodes } from "../utils/ExitCodes.js";

/**
 * Executes plugin commands on single assets via CLI
 *
 * Coordinates path resolution, file validation, and command execution
 * using @exocortex/core business logic.
 */
export class CommandExecutor {
  private pathResolver: PathResolver;
  private fsAdapter: NodeFsAdapter;

  constructor(vaultRoot: string) {
    this.pathResolver = new PathResolver(vaultRoot);
    this.fsAdapter = new NodeFsAdapter(vaultRoot);
  }

  /**
   * Executes a command on a single asset
   *
   * @param commandName - Name of the command to execute
   * @param filepath - Path to the asset file (relative or absolute)
   * @param options - Additional command options
   *
   * @example
   * executor.execute("rename-to-uid", "03 Knowledge/tasks/task.md", {})
   */
  async execute(
    commandName: string,
    filepath: string,
    options: Record<string, any>,
  ): Promise<void> {
    try {
      // Resolve and validate path
      const resolvedPath = this.pathResolver.resolve(filepath);
      this.pathResolver.validate(resolvedPath);

      // Read file to verify it exists and is accessible
      await this.fsAdapter.readFile(
        resolvedPath.replace(this.pathResolver.getVaultRoot() + "/", ""),
      );

      // For now, just log execution (actual command logic will be added in follow-up issues)
      console.log(`✅ Command infrastructure verified`);
      console.log(`   Command: ${commandName}`);
      console.log(`   File: ${resolvedPath}`);
      console.log(`   Vault: ${this.pathResolver.getVaultRoot()}`);

      if (Object.keys(options).length > 0) {
        console.log(`   Options: ${JSON.stringify(options, null, 2)}`);
      }

      console.log(
        `\n📝 Note: Actual command execution will be implemented in follow-up issues.`,
      );
      console.log(`    This PR establishes the infrastructure foundation.`);

      process.exit(ExitCodes.SUCCESS);
    } catch (error) {
      ErrorHandler.handle(error as Error);
    }
  }

  /**
   * Gets the vault root path
   */
  getVaultRoot(): string {
    return this.pathResolver.getVaultRoot();
  }
}
