import { App, TFile } from "obsidian";
import { ILogger } from "../../adapters/logging/ILogger";
import { LoggerFactory } from "../../adapters/logging/LoggerFactory";

export class PropertyUpdateService {
  private logger: ILogger;

  constructor(private app: App) {
    this.logger = LoggerFactory.create("PropertyUpdateService");
  }

  async updateProperty(
    file: TFile,
    propertyKey: string,
    newValue: any,
  ): Promise<void> {
    try {
      this.logger.debug(
        `Updating property "${propertyKey}" in file: ${file.path}`,
      );

      await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
        if (newValue === null || newValue === undefined || newValue === "") {
          delete frontmatter[propertyKey];
        } else {
          frontmatter[propertyKey] = newValue;
        }
      });

      this.logger.debug(
        `Successfully updated property "${propertyKey}" in file: ${file.path}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update property "${propertyKey}" in file: ${file.path}`,
        error,
      );
      throw error;
    }
  }

  async updateTextProperty(
    file: TFile,
    propertyKey: string,
    newValue: string,
  ): Promise<void> {
    const trimmedValue = newValue.trim();
    await this.updateProperty(file, propertyKey, trimmedValue || null);
  }

  async updateDateTimeProperty(
    file: TFile,
    propertyKey: string,
    newValue: string | null,
  ): Promise<void> {
    await this.updateProperty(file, propertyKey, newValue);
  }

  async updateNumberProperty(
    file: TFile,
    propertyKey: string,
    newValue: number | null,
  ): Promise<void> {
    await this.updateProperty(file, propertyKey, newValue);
  }

  async updateBooleanProperty(
    file: TFile,
    propertyKey: string,
    newValue: boolean,
  ): Promise<void> {
    await this.updateProperty(file, propertyKey, newValue);
  }
}
