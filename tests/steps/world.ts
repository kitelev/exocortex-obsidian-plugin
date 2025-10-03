/**
 * Cucumber World - shared context for all step definitions
 */

import { setWorldConstructor, World as CucumberWorld, IWorldOptions } from "@cucumber/cucumber";
import { UniversalLayoutRenderer } from "../../src/presentation/renderers/UniversalLayoutRenderer";
import { AssetRelation } from "../../src/presentation/renderers/BaseAssetRelationsRenderer";

export interface ExocortexWorld extends CucumberWorld {
  // Test fixtures
  renderer: UniversalLayoutRenderer;
  mockApp: any;
  container: HTMLElement;

  // Test data
  relations: AssetRelation[];
  currentHeader: Element | null;

  // Helper methods
  getRowNames(): string[];
  clickHeader(headerText: string): Element | null;
  createMockApp(): any;
}

class CustomWorld extends CucumberWorld implements ExocortexWorld {
  renderer!: UniversalLayoutRenderer;
  mockApp: any;
  container!: HTMLElement;
  relations: AssetRelation[] = [];
  currentHeader: Element | null = null;

  constructor(options: IWorldOptions) {
    super(options);
  }

  createMockApp(): any {
    return {
      workspace: {
        getActiveFile: jest.fn(),
        openLinkText: jest.fn(),
      },
      metadataCache: {
        resolvedLinks: {},
        getFileCache: jest.fn(),
        on: jest.fn(),
      },
      vault: {
        getAbstractFileByPath: jest.fn(),
      },
    };
  }

  getRowNames(): string[] {
    const rows = this.container.querySelectorAll("tbody tr");
    return Array.from(rows).map(
      (row) => row.querySelector("td")?.textContent || ""
    );
  }

  clickHeader(headerText: string): Element | null {
    const headers = this.container.querySelectorAll("th");
    for (const header of Array.from(headers)) {
      if (header.textContent?.includes(headerText)) {
        const clickEvent = new MouseEvent("click", { bubbles: true });
        header.dispatchEvent(clickEvent);
        return header;
      }
    }
    return null;
  }
}

setWorldConstructor(CustomWorld);
