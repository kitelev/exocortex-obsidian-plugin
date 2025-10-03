/**
 * Cucumber Hooks - setup and teardown for scenarios
 */

import { Before, After, BeforeAll, AfterAll } from "@cucumber/cucumber";
import { ExocortexWorld } from "./world";
import { UniversalLayoutRenderer } from "../../src/presentation/renderers/UniversalLayoutRenderer";

BeforeAll(function () {
  // Global setup if needed
});

Before(function (this: ExocortexWorld) {
  // Setup before each scenario
  this.mockApp = this.createMockApp();
  this.renderer = new UniversalLayoutRenderer(this.mockApp);
  this.container = document.createElement("div");
  this.relations = [];
  this.currentHeader = null;
});

After(function (this: ExocortexWorld) {
  // Cleanup after each scenario
  this.container.remove();
  this.relations = [];
  this.currentHeader = null;
});

AfterAll(function () {
  // Global cleanup if needed
});
