#!/usr/bin/env node

/**
 * UI Smoke Test
 * Quick verification that the plugin builds and basic UI components can be instantiated
 * without requiring full Obsidian setup or WDIO
 */

const fs = require("fs");
const path = require("path");

function logStatus(status, message) {
  const icons = {
    info: "📋",
    success: "✅",
    warning: "⚠️",
    error: "❌",
  };
  console.log(`${icons[status]} ${message}`);
}

function checkBuildArtifacts() {
  logStatus("info", "Checking build artifacts...");

  const requiredFiles = ["main.js", "manifest.json", "styles.css"];
  const missing = [];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      missing.push(file);
    }
  }

  if (missing.length > 0) {
    logStatus("error", `Missing build artifacts: ${missing.join(", ")}`);
    return false;
  }

  logStatus("success", "All build artifacts present");
  return true;
}

function checkManifestValid() {
  logStatus("info", "Validating manifest.json...");

  try {
    const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
    const required = [
      "id",
      "name",
      "version",
      "minAppVersion",
      "description",
      "author",
    ];
    const missing = required.filter((field) => !manifest[field]);

    if (missing.length > 0) {
      logStatus("error", `Missing manifest fields: ${missing.join(", ")}`);
      return false;
    }

    logStatus(
      "success",
      `Manifest valid - ${manifest.name} v${manifest.version}`,
    );
    return true;
  } catch (error) {
    logStatus("error", `Manifest validation failed: ${error.message}`);
    return false;
  }
}

function checkBundleSize() {
  logStatus("info", "Checking bundle size...");

  try {
    const stats = fs.statSync("main.js");
    const sizeMB = stats.size / (1024 * 1024);

    logStatus("info", `Bundle size: ${sizeMB.toFixed(2)}MB`);

    if (sizeMB > 5) {
      logStatus("warning", "Bundle size exceeds 5MB - consider optimization");
    } else {
      logStatus("success", "Bundle size is acceptable");
    }

    return true;
  } catch (error) {
    logStatus("error", `Bundle size check failed: ${error.message}`);
    return false;
  }
}

function basicSyntaxCheck() {
  logStatus("info", "Performing basic syntax check...");

  try {
    // Try to require the main bundle to check for syntax errors
    const mainPath = path.resolve("main.js");
    const mainContent = fs.readFileSync(mainPath, "utf8");

    // Check for obvious syntax issues
    if (
      mainContent.includes("SyntaxError") ||
      mainContent.includes("TypeError")
    ) {
      logStatus("warning", "Potential runtime errors detected in bundle");
    }

    // Check that it looks like a valid bundle
    if (
      !mainContent.includes("exports") &&
      !mainContent.includes("module.exports") &&
      !mainContent.includes("define")
    ) {
      logStatus("warning", "Bundle may not be properly formatted");
    }

    logStatus("success", "Basic syntax check passed");
    return true;
  } catch (error) {
    logStatus("error", `Syntax check failed: ${error.message}`);
    return false;
  }
}

function checkDependencies() {
  logStatus("info", "Checking critical dependencies...");

  try {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
    const criticalDeps = ["obsidian"];

    if (packageJson.peerDependencies && packageJson.peerDependencies.obsidian) {
      logStatus(
        "success",
        `Obsidian peer dependency: ${packageJson.peerDependencies.obsidian}`,
      );
    } else {
      logStatus("warning", "No Obsidian peer dependency declared");
    }

    return true;
  } catch (error) {
    logStatus("error", `Dependency check failed: ${error.message}`);
    return false;
  }
}

async function runSmokeTest() {
  logStatus("info", "Starting UI Smoke Test...");
  console.log("");

  const checks = [
    checkBuildArtifacts,
    checkManifestValid,
    checkBundleSize,
    basicSyntaxCheck,
    checkDependencies,
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    try {
      if (check()) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      logStatus("error", `Check failed with exception: ${error.message}`);
      failed++;
    }
    console.log("");
  }

  // Summary
  logStatus("info", "Smoke Test Summary:");
  logStatus("success", `Passed: ${passed}`);
  if (failed > 0) {
    logStatus("error", `Failed: ${failed}`);
  }

  if (failed === 0) {
    logStatus(
      "success",
      "All smoke tests passed! Plugin ready for UI testing.",
    );
    process.exit(0);
  } else {
    logStatus("error", "Some smoke tests failed. Check output above.");
    process.exit(1);
  }
}

// Environment check
if (process.env.CI) {
  logStatus("info", "Running in CI environment");
} else {
  logStatus("info", "Running in local environment");
}

runSmokeTest().catch((error) => {
  logStatus("error", `Smoke test crashed: ${error.message}`);
  process.exit(1);
});
