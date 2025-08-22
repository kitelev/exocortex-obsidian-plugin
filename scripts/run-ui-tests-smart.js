#!/usr/bin/env node

/**
 * Smart UI Test Runner
 * Automatically chooses the correct WDIO configuration based on environment
 * Prevents unnecessary Obsidian downloads on local machines
 */

const { spawn } = require("child_process");
const fs = require("fs");

// Environment detection logic
function shouldDownloadObsidian() {
  const isCI = process.env.CI === "true";
  const isDocker =
    process.env.DOCKER_ENV === "true" || process.env.IS_DOCKER === "true";
  const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
  const forceDownload = process.env.FORCE_OBSIDIAN_DOWNLOAD === "true";

  // Check if we're inside a Docker container
  const isInsideDocker = detectDockerEnvironment();

  return isCI || isDocker || isGitHubActions || isInsideDocker || forceDownload;
}

function detectDockerEnvironment() {
  try {
    // Check for .dockerenv file (standard Docker indicator)
    if (fs.existsSync("/.dockerenv")) {
      return true;
    }

    // Check cgroup information
    if (fs.existsSync("/proc/1/cgroup")) {
      const cgroup = fs.readFileSync("/proc/1/cgroup", "utf8");
      if (cgroup.includes("docker") || cgroup.includes("containerd")) {
        return true;
      }
    }

    // Check if running user is typical Docker user
    if (
      process.env.USER === "root" &&
      process.env.HOME === "/root" &&
      process.env.CI
    ) {
      return true;
    }

    return false;
  } catch (error) {
    // If we can't detect, err on the side of caution
    return false;
  }
}

function logEnvironmentInfo() {
  console.log("🔍 Environment Detection Results:");
  console.log(`  CI: ${process.env.CI}`);
  console.log(`  Docker: ${process.env.DOCKER_ENV || process.env.IS_DOCKER}`);
  console.log(`  GitHub Actions: ${process.env.GITHUB_ACTIONS}`);
  console.log(`  Force Download: ${process.env.FORCE_OBSIDIAN_DOWNLOAD}`);
  console.log(`  Inside Docker: ${detectDockerEnvironment()}`);
  console.log(`  Should Download: ${shouldDownloadObsidian()}`);
}

function main() {
  logEnvironmentInfo();

  let configFile;
  let message;

  if (shouldDownloadObsidian()) {
    configFile = "./wdio.conf.ci.ts";
    message = "🐳 Using CI/Docker configuration - Obsidian download enabled";
    console.log(message);
    console.log(`📋 Config file: ${configFile}`);
    console.log("");

    // Run WDIO with the selected configuration
    const wdioProcess = spawn("npx", ["wdio", "run", configFile], {
      stdio: "inherit",
      shell: true,
    });

    wdioProcess.on("error", (error) => {
      console.error("❌ Failed to start WDIO:", error.message);
      process.exit(1);
    });

    wdioProcess.on("close", (code) => {
      if (code === 0) {
        console.log("✅ UI tests completed successfully");
      } else {
        console.error(`❌ UI tests failed with code ${code}`);
      }
      process.exit(code);
    });
  } else {
    // Local environment - skip UI tests unless forced
    message =
      "💻 Local environment detected - UI tests skipped to prevent Obsidian download";
    console.log(message);
    console.log("");
    console.log("🏃 Local development mode:");
    console.log("  - UI tests are skipped to avoid downloading Obsidian");
    console.log("  - Unit and integration tests cover the core functionality");
    console.log("  - Use CI environment for full UI testing");
    console.log("");
    console.log("🔧 To force UI tests locally:");
    console.log("  FORCE_OBSIDIAN_DOWNLOAD=true npm run test:ui");
    console.log("");
    console.log("✅ UI test check completed (skipped in local mode)");
    process.exit(0);
  }
}

main();
