import { TFile, Vault } from "obsidian";

/**
 * Service for managing effort voting functionality
 * Handles incrementing ems__Effort_votes property on Tasks/Projects
 */
export class EffortVotingService {
  constructor(private vault: Vault) {}

  /**
   * Increment the vote count for an effort
   * Creates property if it doesn't exist (starts at 1)
   * @param effortFile - The file representing the effort (Task or Project)
   * @returns The new vote count after increment
   */
  async incrementEffortVotes(effortFile: TFile): Promise<number> {
    const fileContent = await this.vault.read(effortFile);
    const currentVotes = this.extractVoteCount(fileContent);
    const newVoteCount = currentVotes + 1;

    const updatedContent = this.updateFrontmatterWithVotes(
      fileContent,
      newVoteCount,
    );
    await this.vault.modify(effortFile, updatedContent);

    return newVoteCount;
  }

  /**
   * Extract current vote count from file content
   * Returns 0 if property doesn't exist
   * @param content - The file content to parse
   * @returns Current vote count (0 if property doesn't exist)
   */
  private extractVoteCount(content: string): number {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) return 0;

    const frontmatterContent = match[1];
    const votesMatch = frontmatterContent.match(/ems__Effort_votes:\s*(\d+)/);

    if (votesMatch && votesMatch[1]) {
      return parseInt(votesMatch[1], 10);
    }

    return 0;
  }

  /**
   * Update frontmatter with new vote count
   * Creates frontmatter if it doesn't exist
   * Adds or updates ems__Effort_votes property
   * @param content - Original file content
   * @param voteCount - New vote count to set
   * @returns Updated file content with new vote count
   */
  private updateFrontmatterWithVotes(
    content: string,
    voteCount: number,
  ): string {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      // No frontmatter - create it
      const newFrontmatter = `---
ems__Effort_votes: ${voteCount}
---
${content}`;
      return newFrontmatter;
    }

    // Update existing frontmatter
    const frontmatterContent = match[1];
    let updatedFrontmatter = frontmatterContent;

    if (updatedFrontmatter.includes("ems__Effort_votes:")) {
      // Update existing property
      updatedFrontmatter = updatedFrontmatter.replace(
        /ems__Effort_votes:.*$/m,
        `ems__Effort_votes: ${voteCount}`,
      );
    } else {
      // Add new property
      updatedFrontmatter += `\nems__Effort_votes: ${voteCount}`;
    }

    return content.replace(
      frontmatterRegex,
      `---\n${updatedFrontmatter}\n---`,
    );
  }
}
