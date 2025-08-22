import { Notice } from "obsidian";
import { INotificationService } from "../../application/ports/INotificationService";

/**
 * Obsidian implementation of notification service
 */
export class ObsidianNotificationService implements INotificationService {
  showNotice(message: string, timeout?: number): void {
    new Notice(message, timeout);
  }

  showError(message: string, timeout?: number): void {
    new Notice(`Error: ${message}`, timeout || 5000);
  }

  showSuccess(message: string, timeout?: number): void {
    new Notice(`✓ ${message}`, timeout);
  }

  showWarning(message: string, timeout?: number): void {
    new Notice(`⚠ ${message}`, timeout || 4000);
  }
}
