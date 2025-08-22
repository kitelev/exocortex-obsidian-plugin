/**
 * Port interface for user notifications
 * Abstracts notification/messaging system from framework
 */
export interface INotificationService {
  /**
   * Show an informational notice to the user
   */
  showNotice(message: string, timeout?: number): void;

  /**
   * Show an error message to the user
   */
  showError(message: string, timeout?: number): void;

  /**
   * Show a success message to the user
   */
  showSuccess(message: string, timeout?: number): void;

  /**
   * Show a warning message to the user
   */
  showWarning(message: string, timeout?: number): void;
}