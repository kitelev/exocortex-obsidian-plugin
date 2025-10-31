import { IVaultAdapter, IFile } from "../interfaces/IVaultAdapter";
/**
 * Service for managing effort voting functionality
 * Handles incrementing ems__Effort_votes property on Tasks/Projects
 */
export declare class EffortVotingService {
  private vault;
  constructor(vault: IVaultAdapter);
  /**
   * Increment the vote count for an effort
   * Creates property if it doesn't exist (starts at 1)
   * @param effortFile - The file representing the effort (Task or Project)
   * @returns The new vote count after increment
   */
  incrementEffortVotes(effortFile: IFile): Promise<number>;
  /**
   * Extract current vote count from file content
   * Returns 0 if property doesn't exist
   * @param content - The file content to parse
   * @returns Current vote count (0 if property doesn't exist)
   */
  private extractVoteCount;
  /**
   * Update frontmatter with new vote count
   * Creates frontmatter if it doesn't exist
   * Adds or updates ems__Effort_votes property
   * @param content - Original file content
   * @param voteCount - New vote count to set
   * @returns Updated file content with new vote count
   */
  private updateFrontmatterWithVotes;
}
//# sourceMappingURL=EffortVotingService.d.ts.map
