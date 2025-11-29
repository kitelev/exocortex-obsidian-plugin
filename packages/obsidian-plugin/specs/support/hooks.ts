import { Before, After, BeforeAll, AfterAll, Status } from "@cucumber/cucumber";
import { ExocortexWorld } from "./world.js";

// Global state for test run
let totalScenarios = 0;
let passedScenarios = 0;
let failedScenarios = 0;

BeforeAll(async function () {
  console.log("\n🚀 Starting Exocortex BDD Test Suite\n");
  totalScenarios = 0;
  passedScenarios = 0;
  failedScenarios = 0;
});

Before(async function (this: ExocortexWorld) {
  // Reset world state before each scenario
  this.reset();
  totalScenarios++;
});

After(async function (this: ExocortexWorld, { result }) {
  if (result?.status === Status.PASSED) {
    passedScenarios++;
  } else if (result?.status === Status.FAILED) {
    failedScenarios++;
  }
});

AfterAll(async function () {
  const coverage = totalScenarios > 0
    ? Math.round((passedScenarios / totalScenarios) * 100)
    : 0;

  console.log("\n📊 BDD Test Summary:");
  console.log(`   Total Scenarios: ${totalScenarios}`);
  console.log(`   ✅ Passed: ${passedScenarios}`);
  console.log(`   ❌ Failed: ${failedScenarios}`);
  console.log(`   📈 Coverage: ${coverage}%\n`);
});
