import { IConfiguration } from "@exocortex/core";
import { Plugin } from "obsidian";

export class ObsidianConfiguration implements IConfiguration {
  constructor(private plugin: Plugin) {}

  get<T = any>(key: string): T | undefined {
    const settings = (this.plugin as any).settings;
    if (!settings) {
      return undefined;
    }

    const keys = key.split(".");
    let value: any = settings;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }

    return value as T;
  }

  async set<T = any>(key: string, value: T): Promise<void> {
    const settings = (this.plugin as any).settings;
    if (!settings) {
      throw new Error("Plugin settings not initialized");
    }

    const keys = key.split(".");
    const lastKey = keys.pop();
    if (!lastKey) {
      throw new Error("Invalid configuration key");
    }
    let current: any = settings;

    for (const k of keys) {
      if (!current[k] || typeof current[k] !== "object") {
        current[k] = {};
      }
      current = current[k];
    }

    current[lastKey] = value;

    if (typeof (this.plugin as any).saveSettings === "function") {
      await (this.plugin as any).saveSettings();
    }
  }

  getAll(): Record<string, any> {
    return (this.plugin as any).settings || {};
  }
}
