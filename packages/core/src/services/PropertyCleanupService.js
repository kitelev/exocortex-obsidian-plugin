/**
 * Service for cleaning empty properties from file frontmatter
 */
export class PropertyCleanupService {
    constructor(vault) {
        this.vault = vault;
    }
    /**
     * Remove all empty properties from file frontmatter
     * Empty properties are: null, undefined, "", [], {}
     */
    async cleanEmptyProperties(file) {
        const fileContent = await this.vault.read(file);
        const updatedContent = this.removeEmptyPropertiesFromContent(fileContent);
        await this.vault.modify(file, updatedContent);
    }
    /**
     * Remove empty properties from file content
     */
    removeEmptyPropertiesFromContent(content) {
        const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
        const match = content.match(frontmatterRegex);
        if (!match) {
            return content;
        }
        const frontmatterContent = match[1];
        const lines = frontmatterContent.split("\n");
        const cleanedLines = [];
        let i = 0;
        while (i < lines.length) {
            const line = lines[i];
            const trimmed = line.trim();
            // Skip empty lines
            if (trimmed === "") {
                cleanedLines.push(line);
                i++;
                continue;
            }
            // Check if this is a property line (key: value)
            const propertyMatch = trimmed.match(/^([^:]+):\s*(.*)$/);
            if (propertyMatch) {
                const value = propertyMatch[2];
                // Check if this is a list property (value is empty and next lines are indented)
                if (value === "" && i + 1 < lines.length) {
                    const nextLine = lines[i + 1];
                    if (nextLine.match(/^\s+- /)) {
                        // This is a list property, collect all list items
                        const listItems = [];
                        let j = i + 1;
                        while (j < lines.length && lines[j].match(/^\s+- /)) {
                            listItems.push(lines[j]);
                            j++;
                        }
                        // Check if all list items are empty
                        const allEmpty = listItems.every((item) => {
                            const itemValue = item.replace(/^\s+- /, "").trim();
                            return this.isEmptyValue(itemValue);
                        });
                        if (allEmpty) {
                            // Skip the property key and all list items
                            i = j;
                            continue;
                        }
                        else {
                            // Keep the property and its list items
                            cleanedLines.push(line);
                            for (let k = i + 1; k < j; k++) {
                                cleanedLines.push(lines[k]);
                            }
                            i = j;
                            continue;
                        }
                    }
                }
                // Check if value is empty (but not a list)
                if (this.isEmptyValue(value)) {
                    // Skip this line (remove empty property)
                    i++;
                    continue;
                }
                // Keep non-empty property
                cleanedLines.push(line);
                i++;
            }
            else if (trimmed.match(/^\s*- /)) {
                // This is a list item without a property key (orphaned)
                // This shouldn't happen in valid YAML, but skip it
                i++;
            }
            else {
                // Not a property line (might be continuation), keep it
                cleanedLines.push(line);
                i++;
            }
        }
        const cleanedFrontmatter = cleanedLines.join("\n");
        return content.replace(frontmatterRegex, `---\n${cleanedFrontmatter}\n---`);
    }
    /**
     * Check if a value string represents an empty value
     */
    isEmptyValue(value) {
        const trimmed = value.trim();
        // Empty string
        if (trimmed === "")
            return true;
        // null or undefined
        if (trimmed === "null" || trimmed === "undefined")
            return true;
        // Empty array []
        if (trimmed === "[]")
            return true;
        // Empty object {}
        if (trimmed === "{}")
            return true;
        // Quoted empty string
        if (trimmed === '""' || trimmed === "''")
            return true;
        return false;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJvcGVydHlDbGVhbnVwU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIlByb3BlcnR5Q2xlYW51cFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUE7O0dBRUc7QUFDSCxNQUFNLE9BQU8sc0JBQXNCO0lBQ2pDLFlBQW9CLEtBQVk7UUFBWixVQUFLLEdBQUwsS0FBSyxDQUFPO0lBQUcsQ0FBQztJQUVwQzs7O09BR0c7SUFDSCxLQUFLLENBQUMsb0JBQW9CLENBQUMsSUFBVztRQUNwQyxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hELE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUMxRSxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztJQUNoRCxDQUFDO0lBRUQ7O09BRUc7SUFDSyxnQ0FBZ0MsQ0FBQyxPQUFlO1FBQ3RELE1BQU0sZ0JBQWdCLEdBQUcsdUJBQXVCLENBQUM7UUFDakQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBRTlDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNYLE9BQU8sT0FBTyxDQUFDO1FBQ2pCLENBQUM7UUFFRCxNQUFNLGtCQUFrQixHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwQyxNQUFNLEtBQUssR0FBRyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0MsTUFBTSxZQUFZLEdBQWEsRUFBRSxDQUFDO1FBRWxDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNWLE9BQU8sQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUN4QixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxD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QkFDeEIsQ0FBQyxFQUFFLENBQUM7WUFDTixDQUFDO1FBQ0gsQ0FBQztRQUVELE1BQU0sa0JBQWtCLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsUUFBUSxrQkFBa0IsT0FBTyxDQUFDLENBQUM7SUFDOUUsQ0FBQztJQUVEOztPQUVHO0lBQ0ssWUFBWSxDQUFDLEtBQWE7UUFDaEMsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1FBRTdCLGVBQWU7UUFDZixJQUFJLE9BQU8sS0FBSyxFQUFFO1lBQUUsT0FBTyxJQUFJLENBQUM7UUFFaEMsb0JBQW9CO1FBQ3BCLElBQUksT0FBTyxLQUFLLE1BQU0sSUFBSSxPQUFPLEtBQUssV0FBVztZQUFFLE9BQU8sSUFBSSxDQUFDO1FBRS9ELGlCQUFpQjtRQUNqQixJQUFJLE9BQU8sS0FBSyxJQUFJO1lBQUUsT0FBTyxJQUFJLENBQUM7UUFFbEMsa0JBQWtCO1FBQ2xCLElBQUksT0FBTyxLQUFLLElBQUk7WUFBRSxPQUFPLElBQUksQ0FBQztRQUVsQyxzQkFBc0I7UUFDdEIsSUFBSSxPQUFPLEtBQUssSUFBSSxJQUFJLE9BQU8sS0FBSyxJQUFJO1lBQUUsT0FBTyxJQUFJLENBQUM7UUFFdEQsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBURmlsZSwgVmF1bHQgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuLyoqXG4gKiBTZXJ2aWNlIGZvciBjbGVhbmluZyBlbXB0eSBwcm9wZXJ0aWVzIGZyb20gZmlsZSBmcm9udG1hdHRlclxuICovXG5leHBvcnQgY2xhc3MgUHJvcGVydHlDbGVhbnVwU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgdmF1bHQ6IFZhdWx0KSB7fVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYWxsIGVtcHR5IHByb3BlcnRpZXMgZnJvbSBmaWxlIGZyb250bWF0dGVyXG4gICAqIEVtcHR5IHByb3BlcnRpZXMgYXJlOiBudWxsLCB1bmRlZmluZWQsIFwiXCIsIFtdLCB7fVxuICAgKi9cbiAgYXN5bmMgY2xlYW5FbXB0eVByb3BlcnRpZXMoZmlsZTogVEZpbGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlQ29udGVudCA9IGF3YWl0IHRoaXMudmF1bHQucmVhZChmaWxlKTtcbiAgICBjb25zdCB1cGRhdGVkQ29udGVudCA9IHRoaXMucmVtb3ZlRW1wdHlQcm9wZXJ0aWVzRnJvbUNvbnRlbnQoZmlsZUNvbnRlbnQpO1xuICAgIGF3YWl0IHRoaXMudmF1bHQubW9kaWZ5KGZpbGUsIHVwZGF0ZWRDb250ZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgZW1wdHkgcHJvcGVydGllcyBmcm9tIGZpbGUgY29udGVudFxuICAgKi9cbiAgcHJpdmF0ZSByZW1vdmVFbXB0eVByb3BlcnRpZXNGcm9tQ29udGVudChjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGZyb250bWF0dGVyUmVnZXggPSAvXi0tLVxcbihbXFxzXFxTXSo/KVxcbi0tLS87XG4gICAgY29uc3QgbWF0Y2ggPSBjb250ZW50Lm1hdGNoKGZyb250bWF0dGVyUmVnZXgpO1xuXG4gICAgaWYgKCFtYXRjaCkge1xuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfVxuXG4gICAgY29uc3QgZnJvbnRtYXR0ZXJDb250ZW50ID0gbWF0Y2hbMV07XG4gICAgY29uc3QgbGluZXMgPSBmcm9udG1hdHRlckNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XG4gICAgY29uc3QgY2xlYW5lZExpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgbGV0IGkgPSAwO1xuICAgIHdoaWxlIChpIDwgbGluZXMubGVuZ3RoKSB7XG4gICAgICBjb25zdCBsaW5lID0gbGluZXNbaV07XG4gICAgICBjb25zdCB0cmltbWVkID0gbGluZS50cmltKCk7XG5cbiAgICAgIC8vIFNraXAgZW1wdHkgbGluZXNcbiAgICAgIGlmICh0cmltbWVkID09PSBcIlwiKSB7XG4gICAgICAgIGNsZWFuZWRMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgICBpKys7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBDaGVjayBpZiB0aGlzIGlzIGEgcHJvcGVydHkgbGluZSAoa2V5OiB2YWx1ZSlcbiAgICAgIGNvbnN0IHByb3BlcnR5TWF0Y2ggPSB0cmltbWVkLm1hdGNoKC9eKFteOl0rKTpcXHMqKC4qKSQvKTtcbiAgICAgIGlmIChwcm9wZXJ0eU1hdGNoKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcHJvcGVydHlNYXRjaFsyXTtcblxuICAgICAgICAvLyBDaGVjayBpZiB0aGlzIGlzIGEgbGlzdCBwcm9wZXJ0eSAodmFsdWUgaXMgZW1wdHkgYW5kIG5leHQgbGluZXMgYXJlIGluZGVudGVkKVxuICAgICAgICBpZiAodmFsdWUgPT09IFwiXCIgJiYgaSArIDEgPCBsaW5lcy5sZW5ndGgpIHtcbiAgICAgICAgICBjb25zdCBuZXh0TGluZSA9IGxpbmVzW2kgKyAxXTtcbiAgICAgICAgICBpZiAobmV4dExpbmUubWF0Y2goL15cXHMrLSAvKSkge1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBhIGxpc3QgcHJvcGVydHksIGNvbGxlY3QgYWxsIGxpc3QgaXRlbXNcbiAgICAgICAgICAgIGNvbnN0IGxpc3RJdGVtczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgICAgIGxldCBqID0gaSArIDE7XG4gICAgICAgICAgICB3aGlsZSAoaiA8IGxpbmVzLmxlbmd0aCAmJiBsaW5lc1tqXS5tYXRjaCgvXlxccystIC8pKSB7XG4gICAgICAgICAgICAgIGxpc3RJdGVtcy5wdXNoKGxpbmVzW2pdKTtcbiAgICAgICAgICAgICAgaisrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBDaGVjayBpZiBhbGwgbGlzdCBpdGVtcyBhcmUgZW1wdHlcbiAgICAgICAgICAgIGNvbnN0IGFsbEVtcHR5ID0gbGlzdEl0ZW1zLmV2ZXJ5KChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGl0ZW1WYWx1ZSA9IGl0ZW0ucmVwbGFjZSgvXlxccystIC8sIFwiXCIpLnRyaW0oKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNFbXB0eVZhbHVlKGl0ZW1WYWx1ZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKGFsbEVtcHR5KSB7XG4gICAgICAgICAgICAgIC8vIFNraXAgdGhlIHByb3BlcnR5IGtleSBhbmQgYWxsIGxpc3QgaXRlbXNcbiAgICAgICAgICAgICAgaSA9IGo7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gS2VlcCB0aGUgcHJvcGVydHkgYW5kIGl0cyBsaXN0IGl0ZW1zXG4gICAgICAgICAgICAgIGNsZWFuZWRMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgICAgICAgICBmb3IgKGxldCBrID0gaSArIDE7IGsgPCBqOyBrKyspIHtcbiAgICAgICAgICAgICAgICBjbGVhbmVkTGluZXMucHVzaChsaW5lc1trXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaSA9IGo7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIGlmIHZhbHVlIGlzIGVtcHR5IChidXQgbm90IGEgbGlzdClcbiAgICAgICAgaWYgKHRoaXMuaXNFbXB0eVZhbHVlKHZhbHVlKSkge1xuICAgICAgICAgIC8vIFNraXAgdGhpcyBsaW5lIChyZW1vdmUgZW1wdHkgcHJvcGVydHkpXG4gICAgICAgICAgaSsrO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gS2VlcCBub24tZW1wdHkgcHJvcGVydHlcbiAgICAgICAgY2xlYW5lZExpbmVzLnB1c2gobGluZSk7XG4gICAgICAgIGkrKztcbiAgICAgIH0gZWxzZSBpZiAodHJpbW1lZC5tYXRjaCgvXlxccyotIC8pKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBsaXN0IGl0ZW0gd2l0aG91dCBhIHByb3BlcnR5IGtleSAob3JwaGFuZWQpXG4gICAgICAgIC8vIFRoaXMgc2hvdWxkbid0IGhhcHBlbiBpbiB2YWxpZCBZQU1MLCBidXQgc2tpcCBpdFxuICAgICAgICBpKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBOb3QgYSBwcm9wZXJ0eSBsaW5lIChtaWdodCBiZSBjb250aW51YXRpb24pLCBrZWVwIGl0XG4gICAgICAgIGNsZWFuZWRMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgICBpKys7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgY2xlYW5lZEZyb250bWF0dGVyID0gY2xlYW5lZExpbmVzLmpvaW4oXCJcXG5cIik7XG4gICAgcmV0dXJuIGNvbnRlbnQucmVwbGFjZShmcm9udG1hdHRlclJlZ2V4LCBgLS0tXFxuJHtjbGVhbmVkRnJvbnRtYXR0ZXJ9XFxuLS0tYCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYSB2YWx1ZSBzdHJpbmcgcmVwcmVzZW50cyBhbiBlbXB0eSB2YWx1ZVxuICAgKi9cbiAgcHJpdmF0ZSBpc0VtcHR5VmFsdWUodmFsdWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHRyaW1tZWQgPSB2YWx1ZS50cmltKCk7XG5cbiAgICAvLyBFbXB0eSBzdHJpbmdcbiAgICBpZiAodHJpbW1lZCA9PT0gXCJcIikgcmV0dXJuIHRydWU7XG5cbiAgICAvLyBudWxsIG9yIHVuZGVmaW5lZFxuICAgIGlmICh0cmltbWVkID09PSBcIm51bGxcIiB8fCB0cmltbWVkID09PSBcInVuZGVmaW5lZFwiKSByZXR1cm4gdHJ1ZTtcblxuICAgIC8vIEVtcHR5IGFycmF5IFtdXG4gICAgaWYgKHRyaW1tZWQgPT09IFwiW11cIikgcmV0dXJuIHRydWU7XG5cbiAgICAvLyBFbXB0eSBvYmplY3Qge31cbiAgICBpZiAodHJpbW1lZCA9PT0gXCJ7fVwiKSByZXR1cm4gdHJ1ZTtcblxuICAgIC8vIFF1b3RlZCBlbXB0eSBzdHJpbmdcbiAgICBpZiAodHJpbW1lZCA9PT0gJ1wiXCInIHx8IHRyaW1tZWQgPT09IFwiJydcIikgcmV0dXJuIHRydWU7XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cbiJdfQ==