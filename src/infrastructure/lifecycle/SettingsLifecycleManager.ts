import { Plugin, Notice } from "obsidian";
import { ILifecycleManager } from "../../application/ports/ILifecycleManager";
import {
  ExocortexSettings,
  DEFAULT_SETTINGS,
} from "../../domain/entities/ExocortexSettings";
import { ExocortexSettingTab } from "../../presentation/settings/ExocortexSettingTab";

/**
 * Settings Lifecycle Manager following Pure Fabrication Pattern (GRASP)
 * Single Responsibility: Manage plugin settings lifecycle
 */
export class SettingsLifecycleManager implements ILifecycleManager {
  private settings: ExocortexSettings;

  constructor(private readonly plugin: Plugin) {}

  async initialize(): Promise<void> {
    // Load settings
    await this.loadSettings();

    // Add settings tab
    this.plugin.addSettingTab(
      new ExocortexSettingTab(this.plugin.app, this.plugin as any),
    );
  }

  async cleanup(): Promise<void> {
    // Settings cleanup is handled by Obsidian automatically
  }

  getManagerId(): string {
    return "SettingsLifecycleManager";
  }

  getSettings(): ExocortexSettings {
    return this.settings;
  }

  /**
   * Load plugin settings from data.json
   */
  private async loadSettings(): Promise<void> {
    try {
      const data = await this.plugin.loadData();
      const settingsResult = ExocortexSettings.create(data || {});

      if (settingsResult.isFailure) {
        console.error("Failed to load settings:", settingsResult.getError());
        this.settings = new ExocortexSettings(DEFAULT_SETTINGS);
      } else {
        this.settings = settingsResult.getValue()!;
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      this.settings = new ExocortexSettings(DEFAULT_SETTINGS);
    }
  }

  /**
   * Save plugin settings to data.json
   */
  async saveSettings(): Promise<void> {
    try {
      await this.plugin.saveData(this.settings.toJSON());
    } catch (error) {
      console.error("Error saving settings:", error);
      new Notice("Failed to save settings");
    }
  }
}
