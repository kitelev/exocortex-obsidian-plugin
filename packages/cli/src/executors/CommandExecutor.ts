import path from "path";
import { NodeFsAdapter } from "../adapters/NodeFsAdapter.js";
import { PathResolver } from "../utils/PathResolver.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { ExitCodes } from "../utils/ExitCodes.js";
import { FrontmatterService } from "@exocortex/core";

/**
 * Executes plugin commands on single assets via CLI
 *
 * Coordinates path resolution, file validation, and command execution
 * using @exocortex/core business logic.
 */
export class CommandExecutor {
  private pathResolver: PathResolver;
  private fsAdapter: NodeFsAdapter;
  private frontmatterService: FrontmatterService;

  constructor(vaultRoot: string) {
    this.pathResolver = new PathResolver(vaultRoot);
    this.fsAdapter = new NodeFsAdapter(vaultRoot);
    this.frontmatterService = new FrontmatterService();
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

  /**
   * Executes rename-to-uid command
   *
   * Renames file to match its exo__Asset_uid property value.
   * If label is missing, sets it to the original filename.
   *
   * @param filepath - Path to the asset file
   *
   * @example
   * executor.executeRenameToUid("03 Knowledge/tasks/my-task.md")
   * // Renames to: 03 Knowledge/tasks/task-uid-123.md
   */
  async executeRenameToUid(filepath: string): Promise<void> {
    try {
      // Resolve and validate path
      const resolvedPath = this.pathResolver.resolve(filepath);
      this.pathResolver.validate(resolvedPath);

      // Get relative path for NodeFsAdapter
      const relativePath = resolvedPath.replace(
        this.pathResolver.getVaultRoot() + "/",
        "",
      );

      // Read metadata to check UID
      const metadata = await this.fsAdapter.getFileMetadata(relativePath);

      if (!metadata.exo__Asset_uid) {
        throw new Error("Asset missing exo__Asset_uid property");
      }

      // Check if already renamed
      const currentBasename = path.basename(relativePath, ".md");
      const targetBasename = metadata.exo__Asset_uid;

      if (currentBasename === targetBasename) {
        console.log(`✅ Already renamed: ${filepath}`);
        console.log(`   Current filename matches UID: ${targetBasename}.md`);
        process.exit(ExitCodes.SUCCESS);
      }

      // If label missing, update it to preserve original filename
      if (!metadata.exo__Asset_label || metadata.exo__Asset_label.trim() === "") {
        const content = await this.fsAdapter.readFile(relativePath);
        const updatedContent = this.frontmatterService.updateProperty(
          content,
          "exo__Asset_label",
          currentBasename,
        );

        // Also add to aliases if not archived
        const isArchived = this.isAssetArchived(metadata);
        let finalContent = updatedContent;
        if (!isArchived) {
          finalContent = this.frontmatterService.updateProperty(
            updatedContent,
            "aliases",
            `\n  - ${currentBasename}`,
          );
        }

        await this.fsAdapter.updateFile(relativePath, finalContent);
        console.log(`   Updated label: "${currentBasename}"`);
      }

      // Construct new path
      const directory = path.dirname(relativePath);
      const newPath =
        directory !== "." ? `${directory}/${targetBasename}.md` : `${targetBasename}.md`;

      // Rename file
      await this.fsAdapter.renameFile(relativePath, newPath);

      console.log(`✅ Renamed to UID format`);
      console.log(`   Old: ${relativePath}`);
      console.log(`   New: ${newPath}`);
      process.exit(ExitCodes.SUCCESS);
    } catch (error) {
      ErrorHandler.handle(error as Error);
    }
  }

  /**
   * Executes update-label command
   *
   * Updates exo__Asset_label property and synchronizes aliases array.
   *
   * @param filepath - Path to the asset file
   * @param newLabel - New label value
   *
   * @example
   * executor.executeUpdateLabel("03 Knowledge/tasks/task.md", "New Task Name")
   */
  async executeUpdateLabel(filepath: string, newLabel: string): Promise<void> {
    try {
      // Validate label
      if (!newLabel || newLabel.trim().length === 0) {
        throw new Error("Label cannot be empty");
      }

      const trimmedLabel = newLabel.trim();

      // Resolve and validate path
      const resolvedPath = this.pathResolver.resolve(filepath);
      this.pathResolver.validate(resolvedPath);

      // Get relative path for NodeFsAdapter
      const relativePath = resolvedPath.replace(
        this.pathResolver.getVaultRoot() + "/",
        "",
      );

      // Read current content
      const content = await this.fsAdapter.readFile(relativePath);

      // Update label
      let updatedContent = this.frontmatterService.updateProperty(
        content,
        "exo__Asset_label",
        trimmedLabel,
      );

      // Update aliases array
      const parsed = this.frontmatterService.parse(updatedContent);
      const currentAliases = this.extractAliasesFromFrontmatter(parsed.content);

      if (!currentAliases.includes(trimmedLabel)) {
        // If no aliases exist yet, create array
        if (currentAliases.length === 0) {
          updatedContent = this.frontmatterService.updateProperty(
            updatedContent,
            "aliases",
            `\n  - ${trimmedLabel}`,
          );
        } else {
          // Append to existing aliases
          updatedContent = this.frontmatterService.updateProperty(
            updatedContent,
            "aliases",
            `${currentAliases.map((a) => `\n  - ${a}`).join("")}\n  - ${trimmedLabel}`,
          );
        }
      }

      // Write updated content
      await this.fsAdapter.updateFile(relativePath, updatedContent);

      console.log(`✅ Updated label`);
      console.log(`   File: ${filepath}`);
      console.log(`   New label: "${trimmedLabel}"`);
      console.log(`   Aliases synchronized`);
      process.exit(ExitCodes.SUCCESS);
    } catch (error) {
      ErrorHandler.handle(error as Error);
    }
  }

  /**
   * Checks if asset is archived
   * @private
   */
  private isAssetArchived(metadata: Record<string, any>): boolean {
    if (metadata?.exo__Asset_isArchived === true) {
      return true;
    }

    const archivedValue = metadata?.archived;

    if (archivedValue === undefined || archivedValue === null) {
      return false;
    }

    if (typeof archivedValue === "boolean") {
      return archivedValue;
    }

    if (typeof archivedValue === "number") {
      return archivedValue !== 0;
    }

    if (typeof archivedValue === "string") {
      const normalized = archivedValue.toLowerCase().trim();
      return (
        normalized === "true" || normalized === "yes" || normalized === "1"
      );
    }

    return false;
  }

  /**
   * Extracts aliases from frontmatter content
   * @private
   */
  private extractAliasesFromFrontmatter(frontmatterContent: string): string[] {
    const aliasesMatch = frontmatterContent.match(/aliases:\s*\n((?:  - .*\n?)*)/);
    if (!aliasesMatch) {
      return [];
    }

    const aliasLines = aliasesMatch[1].split("\n").filter((line) => line.trim());
    return aliasLines.map((line) => line.replace(/^\s*-\s*/, "").trim());
  }
}
