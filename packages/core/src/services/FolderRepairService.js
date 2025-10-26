/**
 * Service for repairing asset folder locations based on exo__Asset_isDefinedBy references
 */
export class FolderRepairService {
    constructor(vault, app) {
        this.vault = vault;
        this.app = app;
    }
    /**
     * Get the expected folder for an asset based on its exo__Asset_isDefinedBy property
     * Returns null if no expected folder can be determined
     */
    async getExpectedFolder(file, metadata) {
        const isDefinedBy = metadata?.exo__Asset_isDefinedBy;
        if (!isDefinedBy) {
            return null;
        }
        // Extract the reference (handle both [[Reference]] and "[[Reference]]" formats)
        const reference = this.extractReference(isDefinedBy);
        if (!reference) {
            return null;
        }
        // Find the referenced file
        const referencedFile = this.app.metadataCache.getFirstLinkpathDest(reference, file.path);
        if (!referencedFile) {
            return null;
        }
        // Get the folder of the referenced file
        return this.getFileFolder(referencedFile);
    }
    /**
     * Move asset to its expected folder based on exo__Asset_isDefinedBy
     */
    async repairFolder(file, expectedFolder) {
        // Construct new path
        const newPath = `${expectedFolder}/${file.name}`;
        // Check if target path already exists
        const existingFile = this.vault.getAbstractFileByPath(newPath);
        if (existingFile) {
            throw new Error(`Cannot move file: ${newPath} already exists`);
        }
        // Ensure target folder exists
        await this.ensureFolderExists(expectedFolder);
        // Move the file
        await this.vault.rename(file, newPath);
    }
    /**
     * Get the folder path for a file
     */
    getFileFolder(file) {
        const folderPath = file.parent?.path || "";
        return folderPath;
    }
    /**
     * Extract reference from various formats:
     * - [[Reference]] -> Reference
     * - "[[Reference]]" -> Reference
     * - Reference -> Reference
     */
    extractReference(value) {
        if (typeof value !== "string") {
            return null;
        }
        // Remove quotes if present
        let cleaned = value.trim().replace(/^["']|["']$/g, "");
        // Remove wiki-link brackets if present
        cleaned = cleaned.replace(/^\[\[|\]\]$/g, "");
        return cleaned || null;
    }
    /**
     * Ensure a folder exists, creating it if necessary
     */
    async ensureFolderExists(folderPath) {
        if (!folderPath) {
            return;
        }
        const folder = this.vault.getAbstractFileByPath(folderPath);
        // Duck typing: Check if it's a folder (has children property, no extension)
        if (folder && "children" in folder) {
            return;
        }
        // Create folder recursively
        await this.vault.createFolder(folderPath);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRm9sZGVyUmVwYWlyU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkZvbGRlclJlcGFpclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUE7O0dBRUc7QUFDSCxNQUFNLE9BQU8sbUJBQW1CO0lBQzlCLFlBQ1UsS0FBWSxFQUVaLEdBQVE7UUFGUixVQUFLLEdBQUwsS0FBSyxDQUFPO1FBRVosUUFBRyxHQUFILEdBQUcsQ0FBSztJQUNmLENBQUM7SUFFSjs7O09BR0c7SUFDSCxLQUFLLENBQUMsaUJBQWlCLENBQ3JCLElBQVcsRUFDWCxRQUE2QjtRQUU3QixNQUFNLFdBQVcsR0FBRyxRQUFRLEVBQUUsc0JBQXNCLENBQUM7UUFFckQsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2pCLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUVELGdGQUFnRjtRQUNoRixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDckQsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2YsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBRUQsMkJBQTJCO1FBQzNCLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLG9CQUFvQixDQUNoRSxTQUFTLEVBQ1QsSUFBSSxDQUFDLElBQUksQ0FDVixDQUFDO1FBRUYsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3BCLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUVELHdDQUF3QztRQUN4QyxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFXLEVBQUUsY0FBc0I7UUFDcEQscUJBQXFCO1FBQ3JCLE1BQU0sT0FBTyxHQUFHLEdBQUcsY0FBYyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUVqRCxzQ0FBc0M7UUFDdEMsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMvRCxJQUFJLFlBQVksRUFBRSxDQUFDO1lBQ2pCLE1BQU0sSUFBSSxLQUFLLENBQ2IscUJBQXFCLE9BQU8saUJBQWlCLENBQzlDLENBQUM7UUFDSixDQUFDO1FBRUQsOEJBQThCO1FBQzlCLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBRTlDLGdCQUFnQjtRQUNoQixNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztJQUN6QyxDQUFDO0lBRUQ7O09BRUc7SUFDSyxhQUFhLENBQUMsSUFBVztRQUMvQixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksSUFBSSxFQUFFLENBQUM7UUFDM0MsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ssZ0JBQWdCLENBQUMsS0FBVTtRQUNqQyxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQzlCLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUVELDJCQUEyQjtRQUMzQixJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUV2RCx1Q0FBdUM7UUFDdkMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRTlDLE9BQU8sT0FBTyxJQUFJLElBQUksQ0FBQztJQUN6QixDQUFDO0lBRUQ7O09BRUc7SUFDSyxLQUFLLENBQUMsa0JBQWtCLENBQUMsVUFBa0I7UUFDakQsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2hCLE9BQU87UUFDVCxDQUFDO1FBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM1RCw0RUFBNEU7UUFDNUUsSUFBSSxNQUFNLElBQUksVUFBVSxJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ25DLE9BQU87UUFDVCxDQUFDO1FBRUQsNEJBQTRCO1FBQzVCLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDNUMsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVEZpbGUsIFZhdWx0IH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbi8qKlxuICogU2VydmljZSBmb3IgcmVwYWlyaW5nIGFzc2V0IGZvbGRlciBsb2NhdGlvbnMgYmFzZWQgb24gZXhvX19Bc3NldF9pc0RlZmluZWRCeSByZWZlcmVuY2VzXG4gKi9cbmV4cG9ydCBjbGFzcyBGb2xkZXJSZXBhaXJTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSB2YXVsdDogVmF1bHQsXG4gICAgIFxuICAgIHByaXZhdGUgYXBwOiBhbnksXG4gICkge31cblxuICAvKipcbiAgICogR2V0IHRoZSBleHBlY3RlZCBmb2xkZXIgZm9yIGFuIGFzc2V0IGJhc2VkIG9uIGl0cyBleG9fX0Fzc2V0X2lzRGVmaW5lZEJ5IHByb3BlcnR5XG4gICAqIFJldHVybnMgbnVsbCBpZiBubyBleHBlY3RlZCBmb2xkZXIgY2FuIGJlIGRldGVybWluZWRcbiAgICovXG4gIGFzeW5jIGdldEV4cGVjdGVkRm9sZGVyKFxuICAgIGZpbGU6IFRGaWxlLFxuICAgIG1ldGFkYXRhOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LFxuICApOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgICBjb25zdCBpc0RlZmluZWRCeSA9IG1ldGFkYXRhPy5leG9fX0Fzc2V0X2lzRGVmaW5lZEJ5O1xuXG4gICAgaWYgKCFpc0RlZmluZWRCeSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gRXh0cmFjdCB0aGUgcmVmZXJlbmNlIChoYW5kbGUgYm90aCBbW1JlZmVyZW5jZV1dIGFuZCBcIltbUmVmZXJlbmNlXV1cIiBmb3JtYXRzKVxuICAgIGNvbnN0IHJlZmVyZW5jZSA9IHRoaXMuZXh0cmFjdFJlZmVyZW5jZShpc0RlZmluZWRCeSk7XG4gICAgaWYgKCFyZWZlcmVuY2UpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIEZpbmQgdGhlIHJlZmVyZW5jZWQgZmlsZVxuICAgIGNvbnN0IHJlZmVyZW5jZWRGaWxlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdChcbiAgICAgIHJlZmVyZW5jZSxcbiAgICAgIGZpbGUucGF0aCxcbiAgICApO1xuXG4gICAgaWYgKCFyZWZlcmVuY2VkRmlsZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gR2V0IHRoZSBmb2xkZXIgb2YgdGhlIHJlZmVyZW5jZWQgZmlsZVxuICAgIHJldHVybiB0aGlzLmdldEZpbGVGb2xkZXIocmVmZXJlbmNlZEZpbGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIE1vdmUgYXNzZXQgdG8gaXRzIGV4cGVjdGVkIGZvbGRlciBiYXNlZCBvbiBleG9fX0Fzc2V0X2lzRGVmaW5lZEJ5XG4gICAqL1xuICBhc3luYyByZXBhaXJGb2xkZXIoZmlsZTogVEZpbGUsIGV4cGVjdGVkRm9sZGVyOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyBDb25zdHJ1Y3QgbmV3IHBhdGhcbiAgICBjb25zdCBuZXdQYXRoID0gYCR7ZXhwZWN0ZWRGb2xkZXJ9LyR7ZmlsZS5uYW1lfWA7XG5cbiAgICAvLyBDaGVjayBpZiB0YXJnZXQgcGF0aCBhbHJlYWR5IGV4aXN0c1xuICAgIGNvbnN0IGV4aXN0aW5nRmlsZSA9IHRoaXMudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5ld1BhdGgpO1xuICAgIGlmIChleGlzdGluZ0ZpbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYENhbm5vdCBtb3ZlIGZpbGU6ICR7bmV3UGF0aH0gYWxyZWFkeSBleGlzdHNgLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBFbnN1cmUgdGFyZ2V0IGZvbGRlciBleGlzdHNcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlckV4aXN0cyhleHBlY3RlZEZvbGRlcik7XG5cbiAgICAvLyBNb3ZlIHRoZSBmaWxlXG4gICAgYXdhaXQgdGhpcy52YXVsdC5yZW5hbWUoZmlsZSwgbmV3UGF0aCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBmb2xkZXIgcGF0aCBmb3IgYSBmaWxlXG4gICAqL1xuICBwcml2YXRlIGdldEZpbGVGb2xkZXIoZmlsZTogVEZpbGUpOiBzdHJpbmcge1xuICAgIGNvbnN0IGZvbGRlclBhdGggPSBmaWxlLnBhcmVudD8ucGF0aCB8fCBcIlwiO1xuICAgIHJldHVybiBmb2xkZXJQYXRoO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4dHJhY3QgcmVmZXJlbmNlIGZyb20gdmFyaW91cyBmb3JtYXRzOlxuICAgKiAtIFtbUmVmZXJlbmNlXV0gLT4gUmVmZXJlbmNlXG4gICAqIC0gXCJbW1JlZmVyZW5jZV1dXCIgLT4gUmVmZXJlbmNlXG4gICAqIC0gUmVmZXJlbmNlIC0+IFJlZmVyZW5jZVxuICAgKi9cbiAgcHJpdmF0ZSBleHRyYWN0UmVmZXJlbmNlKHZhbHVlOiBhbnkpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBSZW1vdmUgcXVvdGVzIGlmIHByZXNlbnRcbiAgICBsZXQgY2xlYW5lZCA9IHZhbHVlLnRyaW0oKS5yZXBsYWNlKC9eW1wiJ118W1wiJ10kL2csIFwiXCIpO1xuXG4gICAgLy8gUmVtb3ZlIHdpa2ktbGluayBicmFja2V0cyBpZiBwcmVzZW50XG4gICAgY2xlYW5lZCA9IGNsZWFuZWQucmVwbGFjZSgvXlxcW1xcW3xcXF1cXF0kL2csIFwiXCIpO1xuXG4gICAgcmV0dXJuIGNsZWFuZWQgfHwgbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbnN1cmUgYSBmb2xkZXIgZXhpc3RzLCBjcmVhdGluZyBpdCBpZiBuZWNlc3NhcnlcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZW5zdXJlRm9sZGVyRXhpc3RzKGZvbGRlclBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghZm9sZGVyUGF0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGZvbGRlclBhdGgpO1xuICAgIC8vIER1Y2sgdHlwaW5nOiBDaGVjayBpZiBpdCdzIGEgZm9sZGVyIChoYXMgY2hpbGRyZW4gcHJvcGVydHksIG5vIGV4dGVuc2lvbilcbiAgICBpZiAoZm9sZGVyICYmIFwiY2hpbGRyZW5cIiBpbiBmb2xkZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgZm9sZGVyIHJlY3Vyc2l2ZWx5XG4gICAgYXdhaXQgdGhpcy52YXVsdC5jcmVhdGVGb2xkZXIoZm9sZGVyUGF0aCk7XG4gIH1cbn1cbiJdfQ==