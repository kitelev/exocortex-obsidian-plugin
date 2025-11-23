import "reflect-metadata";
import { container } from "tsyringe";
import { App, Plugin } from "obsidian";
import { DI_TOKENS } from "@exocortex/core";
import { ObsidianLogger } from "./ObsidianLogger";
import { ObsidianEventBus } from "./ObsidianEventBus";
import { ObsidianConfiguration } from "./ObsidianConfiguration";
import { ObsidianNotificationService } from "./ObsidianNotificationService";
import { ObsidianVaultAdapter } from "../../adapters/ObsidianVaultAdapter";

export class PluginContainer {
  static setup(app: App, plugin: Plugin): void {
    container.register(DI_TOKENS.ILogger, {
      useFactory: () => new ObsidianLogger(plugin),
    });

    container.register(DI_TOKENS.IEventBus, {
      useClass: ObsidianEventBus,
    });

    container.register(DI_TOKENS.IConfiguration, {
      useFactory: () => new ObsidianConfiguration(plugin),
    });

    container.register(DI_TOKENS.INotificationService, {
      useClass: ObsidianNotificationService,
    });

    container.register(DI_TOKENS.IVaultAdapter, {
      useFactory: () => new ObsidianVaultAdapter(app.vault, app.metadataCache, app),
    });
  }

  static reset(): void {
    container.clearInstances();
  }
}
