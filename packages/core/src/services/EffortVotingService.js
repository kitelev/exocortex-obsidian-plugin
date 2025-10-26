/**
 * Service for managing effort voting functionality
 * Handles incrementing ems__Effort_votes property on Tasks/Projects
 */
export class EffortVotingService {
    constructor(vault) {
        this.vault = vault;
    }
    /**
     * Increment the vote count for an effort
     * Creates property if it doesn't exist (starts at 1)
     * @param effortFile - The file representing the effort (Task or Project)
     * @returns The new vote count after increment
     */
    async incrementEffortVotes(effortFile) {
        const fileContent = await this.vault.read(effortFile);
        const currentVotes = this.extractVoteCount(fileContent);
        const newVoteCount = currentVotes + 1;
        const updatedContent = this.updateFrontmatterWithVotes(fileContent, newVoteCount);
        await this.vault.modify(effortFile, updatedContent);
        return newVoteCount;
    }
    /**
     * Extract current vote count from file content
     * Returns 0 if property doesn't exist
     * @param content - The file content to parse
     * @returns Current vote count (0 if property doesn't exist)
     */
    extractVoteCount(content) {
        // Support both Unix (\n) and Windows (\r\n) line endings
        const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
        const match = content.match(frontmatterRegex);
        if (!match)
            return 0;
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
    updateFrontmatterWithVotes(content, voteCount) {
        // Support both Unix (\n) and Windows (\r\n) line endings
        const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
        const match = content.match(frontmatterRegex);
        // Detect line ending style from original content
        const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
        if (!match) {
            // No frontmatter - create it
            const newFrontmatter = `---${lineEnding}ems__Effort_votes: ${voteCount}${lineEnding}---${lineEnding}${content}`;
            return newFrontmatter;
        }
        // Update existing frontmatter
        const frontmatterContent = match[1];
        let updatedFrontmatter = frontmatterContent;
        if (updatedFrontmatter.includes("ems__Effort_votes:")) {
            // Update existing property
            updatedFrontmatter = updatedFrontmatter.replace(/ems__Effort_votes:.*$/m, `ems__Effort_votes: ${voteCount}`);
        }
        else {
            // Add new property (preserving line ending style)
            updatedFrontmatter += `${lineEnding}ems__Effort_votes: ${voteCount}`;
        }
        return content.replace(frontmatterRegex, `---${lineEnding}${updatedFrontmatter}${lineEnding}---`);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRWZmb3J0Vm90aW5nU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkVmZm9ydFZvdGluZ1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUE7OztHQUdHO0FBQ0gsTUFBTSxPQUFPLG1CQUFtQjtJQUM5QixZQUFvQixLQUFZO1FBQVosVUFBSyxHQUFMLEtBQUssQ0FBTztJQUFHLENBQUM7SUFFcEM7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsb0JBQW9CLENBQUMsVUFBaUI7UUFDMUMsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN0RCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDeEQsTUFBTSxZQUFZLEdBQUcsWUFBWSxHQUFHLENBQUMsQ0FBQztRQUV0QyxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsMEJBQTBCLENBQ3BELFdBQVcsRUFDWCxZQUFZLENBQ2IsQ0FBQztRQUNGLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBRXBELE9BQU8sWUFBWSxDQUFDO0lBQ3RCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNLLGdCQUFnQixDQUFDLE9BQWU7UUFDdEMseURBQXlEO1FBQ3pELE1BQU0sZ0JBQWdCLEdBQUcsNkJBQTZCLENBQUM7UUFDdkQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBRTlDLElBQUksQ0FBQyxLQUFLO1lBQUUsT0FBTyxDQUFDLENBQUM7UUFFckIsTUFBTSxrQkFBa0IsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEMsTUFBTSxVQUFVLEdBQUcsa0JBQWtCLENBQUMsS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7UUFFMUUsSUFBSSxVQUFVLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDaEMsT0FBTyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFRCxPQUFPLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0ssMEJBQTBCLENBQ2hDLE9BQWUsRUFDZixTQUFpQjtRQUVqQix5REFBeUQ7UUFDekQsTUFBTSxnQkFBZ0IsR0FBRyw2QkFBNkIsQ0FBQztRQUN2RCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFFOUMsaURBQWlEO1FBQ2pELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBRTVELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNYLDZCQUE2QjtZQUM3QixNQUFNLGNBQWMsR0FBRyxNQUFNLFVBQVUsc0JBQXNCLFNBQVMsR0FBRyxVQUFVLE1BQU0sVUFBVSxHQUFHLE9BQU8sRUFBRSxDQUFDO1lBQ2hILE9BQU8sY0FBYyxDQUFDO1FBQ3hCLENBQUM7UUFFRCw4QkFBOEI7UUFDOUIsTUFBTSxrQkFBa0IsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEMsSUFBSSxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQztRQUU1QyxJQUFJLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUM7WUFDdEQsMkJBQTJCO1lBQzNCLGtCQUFrQixHQUFHLGtCQUFrQixDQUFDLE9BQU8sQ0FDN0Msd0JBQXdCLEVBQ3hCLHNCQUFzQixTQUFTLEVBQUUsQ0FDbEMsQ0FBQztRQUNKLENBQUM7YUFBTSxDQUFDO1lBQ04sa0RBQWtEO1lBQ2xELGtCQUFrQixJQUFJLEdBQUcsVUFBVSxzQkFBc0IsU0FBUyxFQUFFLENBQUM7UUFDdkUsQ0FBQztRQUVELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FDcEIsZ0JBQWdCLEVBQ2hCLE1BQU0sVUFBVSxHQUFHLGtCQUFrQixHQUFHLFVBQVUsS0FBSyxDQUN4RCxDQUFDO0lBQ0osQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVEZpbGUsIFZhdWx0IH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbi8qKlxuICogU2VydmljZSBmb3IgbWFuYWdpbmcgZWZmb3J0IHZvdGluZyBmdW5jdGlvbmFsaXR5XG4gKiBIYW5kbGVzIGluY3JlbWVudGluZyBlbXNfX0VmZm9ydF92b3RlcyBwcm9wZXJ0eSBvbiBUYXNrcy9Qcm9qZWN0c1xuICovXG5leHBvcnQgY2xhc3MgRWZmb3J0Vm90aW5nU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgdmF1bHQ6IFZhdWx0KSB7fVxuXG4gIC8qKlxuICAgKiBJbmNyZW1lbnQgdGhlIHZvdGUgY291bnQgZm9yIGFuIGVmZm9ydFxuICAgKiBDcmVhdGVzIHByb3BlcnR5IGlmIGl0IGRvZXNuJ3QgZXhpc3QgKHN0YXJ0cyBhdCAxKVxuICAgKiBAcGFyYW0gZWZmb3J0RmlsZSAtIFRoZSBmaWxlIHJlcHJlc2VudGluZyB0aGUgZWZmb3J0IChUYXNrIG9yIFByb2plY3QpXG4gICAqIEByZXR1cm5zIFRoZSBuZXcgdm90ZSBjb3VudCBhZnRlciBpbmNyZW1lbnRcbiAgICovXG4gIGFzeW5jIGluY3JlbWVudEVmZm9ydFZvdGVzKGVmZm9ydEZpbGU6IFRGaWxlKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBjb25zdCBmaWxlQ29udGVudCA9IGF3YWl0IHRoaXMudmF1bHQucmVhZChlZmZvcnRGaWxlKTtcbiAgICBjb25zdCBjdXJyZW50Vm90ZXMgPSB0aGlzLmV4dHJhY3RWb3RlQ291bnQoZmlsZUNvbnRlbnQpO1xuICAgIGNvbnN0IG5ld1ZvdGVDb3VudCA9IGN1cnJlbnRWb3RlcyArIDE7XG5cbiAgICBjb25zdCB1cGRhdGVkQ29udGVudCA9IHRoaXMudXBkYXRlRnJvbnRtYXR0ZXJXaXRoVm90ZXMoXG4gICAgICBmaWxlQ29udGVudCxcbiAgICAgIG5ld1ZvdGVDb3VudCxcbiAgICApO1xuICAgIGF3YWl0IHRoaXMudmF1bHQubW9kaWZ5KGVmZm9ydEZpbGUsIHVwZGF0ZWRDb250ZW50KTtcblxuICAgIHJldHVybiBuZXdWb3RlQ291bnQ7XG4gIH1cblxuICAvKipcbiAgICogRXh0cmFjdCBjdXJyZW50IHZvdGUgY291bnQgZnJvbSBmaWxlIGNvbnRlbnRcbiAgICogUmV0dXJucyAwIGlmIHByb3BlcnR5IGRvZXNuJ3QgZXhpc3RcbiAgICogQHBhcmFtIGNvbnRlbnQgLSBUaGUgZmlsZSBjb250ZW50IHRvIHBhcnNlXG4gICAqIEByZXR1cm5zIEN1cnJlbnQgdm90ZSBjb3VudCAoMCBpZiBwcm9wZXJ0eSBkb2Vzbid0IGV4aXN0KVxuICAgKi9cbiAgcHJpdmF0ZSBleHRyYWN0Vm90ZUNvdW50KGNvbnRlbnQ6IHN0cmluZyk6IG51bWJlciB7XG4gICAgLy8gU3VwcG9ydCBib3RoIFVuaXggKFxcbikgYW5kIFdpbmRvd3MgKFxcclxcbikgbGluZSBlbmRpbmdzXG4gICAgY29uc3QgZnJvbnRtYXR0ZXJSZWdleCA9IC9eLS0tXFxyP1xcbihbXFxzXFxTXSo/KVxccj9cXG4tLS0vO1xuICAgIGNvbnN0IG1hdGNoID0gY29udGVudC5tYXRjaChmcm9udG1hdHRlclJlZ2V4KTtcblxuICAgIGlmICghbWF0Y2gpIHJldHVybiAwO1xuXG4gICAgY29uc3QgZnJvbnRtYXR0ZXJDb250ZW50ID0gbWF0Y2hbMV07XG4gICAgY29uc3Qgdm90ZXNNYXRjaCA9IGZyb250bWF0dGVyQ29udGVudC5tYXRjaCgvZW1zX19FZmZvcnRfdm90ZXM6XFxzKihcXGQrKS8pO1xuXG4gICAgaWYgKHZvdGVzTWF0Y2ggJiYgdm90ZXNNYXRjaFsxXSkge1xuICAgICAgcmV0dXJuIHBhcnNlSW50KHZvdGVzTWF0Y2hbMV0sIDEwKTtcbiAgICB9XG5cbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgZnJvbnRtYXR0ZXIgd2l0aCBuZXcgdm90ZSBjb3VudFxuICAgKiBDcmVhdGVzIGZyb250bWF0dGVyIGlmIGl0IGRvZXNuJ3QgZXhpc3RcbiAgICogQWRkcyBvciB1cGRhdGVzIGVtc19fRWZmb3J0X3ZvdGVzIHByb3BlcnR5XG4gICAqIEBwYXJhbSBjb250ZW50IC0gT3JpZ2luYWwgZmlsZSBjb250ZW50XG4gICAqIEBwYXJhbSB2b3RlQ291bnQgLSBOZXcgdm90ZSBjb3VudCB0byBzZXRcbiAgICogQHJldHVybnMgVXBkYXRlZCBmaWxlIGNvbnRlbnQgd2l0aCBuZXcgdm90ZSBjb3VudFxuICAgKi9cbiAgcHJpdmF0ZSB1cGRhdGVGcm9udG1hdHRlcldpdGhWb3RlcyhcbiAgICBjb250ZW50OiBzdHJpbmcsXG4gICAgdm90ZUNvdW50OiBudW1iZXIsXG4gICk6IHN0cmluZyB7XG4gICAgLy8gU3VwcG9ydCBib3RoIFVuaXggKFxcbikgYW5kIFdpbmRvd3MgKFxcclxcbikgbGluZSBlbmRpbmdzXG4gICAgY29uc3QgZnJvbnRtYXR0ZXJSZWdleCA9IC9eLS0tXFxyP1xcbihbXFxzXFxTXSo/KVxccj9cXG4tLS0vO1xuICAgIGNvbnN0IG1hdGNoID0gY29udGVudC5tYXRjaChmcm9udG1hdHRlclJlZ2V4KTtcblxuICAgIC8vIERldGVjdCBsaW5lIGVuZGluZyBzdHlsZSBmcm9tIG9yaWdpbmFsIGNvbnRlbnRcbiAgICBjb25zdCBsaW5lRW5kaW5nID0gY29udGVudC5pbmNsdWRlcygnXFxyXFxuJykgPyAnXFxyXFxuJyA6ICdcXG4nO1xuXG4gICAgaWYgKCFtYXRjaCkge1xuICAgICAgLy8gTm8gZnJvbnRtYXR0ZXIgLSBjcmVhdGUgaXRcbiAgICAgIGNvbnN0IG5ld0Zyb250bWF0dGVyID0gYC0tLSR7bGluZUVuZGluZ31lbXNfX0VmZm9ydF92b3RlczogJHt2b3RlQ291bnR9JHtsaW5lRW5kaW5nfS0tLSR7bGluZUVuZGluZ30ke2NvbnRlbnR9YDtcbiAgICAgIHJldHVybiBuZXdGcm9udG1hdHRlcjtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgZXhpc3RpbmcgZnJvbnRtYXR0ZXJcbiAgICBjb25zdCBmcm9udG1hdHRlckNvbnRlbnQgPSBtYXRjaFsxXTtcbiAgICBsZXQgdXBkYXRlZEZyb250bWF0dGVyID0gZnJvbnRtYXR0ZXJDb250ZW50O1xuXG4gICAgaWYgKHVwZGF0ZWRGcm9udG1hdHRlci5pbmNsdWRlcyhcImVtc19fRWZmb3J0X3ZvdGVzOlwiKSkge1xuICAgICAgLy8gVXBkYXRlIGV4aXN0aW5nIHByb3BlcnR5XG4gICAgICB1cGRhdGVkRnJvbnRtYXR0ZXIgPSB1cGRhdGVkRnJvbnRtYXR0ZXIucmVwbGFjZShcbiAgICAgICAgL2Vtc19fRWZmb3J0X3ZvdGVzOi4qJC9tLFxuICAgICAgICBgZW1zX19FZmZvcnRfdm90ZXM6ICR7dm90ZUNvdW50fWAsXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBBZGQgbmV3IHByb3BlcnR5IChwcmVzZXJ2aW5nIGxpbmUgZW5kaW5nIHN0eWxlKVxuICAgICAgdXBkYXRlZEZyb250bWF0dGVyICs9IGAke2xpbmVFbmRpbmd9ZW1zX19FZmZvcnRfdm90ZXM6ICR7dm90ZUNvdW50fWA7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbnRlbnQucmVwbGFjZShcbiAgICAgIGZyb250bWF0dGVyUmVnZXgsXG4gICAgICBgLS0tJHtsaW5lRW5kaW5nfSR7dXBkYXRlZEZyb250bWF0dGVyfSR7bGluZUVuZGluZ30tLS1gLFxuICAgICk7XG4gIH1cbn1cbiJdfQ==