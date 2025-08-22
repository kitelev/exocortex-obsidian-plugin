/**
 * Test Environment Detection Utility
 * Controls when Obsidian downloads should occur during testing
 */

export class TestEnvironmentDetector {
  /**
   * Determines if we're running in an environment where Obsidian downloads should occur
   */
  static shouldDownloadObsidian(): boolean {
    // Check environment indicators for Docker/CI
    const isCI = process.env.CI === "true";
    const isDocker =
      process.env.DOCKER_ENV === "true" || process.env.IS_DOCKER === "true";
    const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
    const forceDownload = process.env.FORCE_OBSIDIAN_DOWNLOAD === "true";

    // Check if we're inside a Docker container
    const isInsideDocker = this.detectDockerEnvironment();

    // Allow download only in CI/Docker environments or when explicitly forced
    return (
      isCI || isDocker || isGitHubActions || isInsideDocker || forceDownload
    );
  }

  /**
   * Detects if we're running inside a Docker container
   */
  private static detectDockerEnvironment(): boolean {
    try {
      const fs = require("fs");

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

  /**
   * Gets the appropriate WDIO configuration based on environment
   */
  static getWdioConfig(): string {
    if (this.shouldDownloadObsidian()) {
      console.log(
        "🐳 Using CI/Docker configuration - Obsidian download enabled",
      );
      return "./wdio.conf.ci.ts";
    } else {
      console.log("💻 Using local configuration - Obsidian download disabled");
      return "./wdio.conf.local.ts";
    }
  }

  /**
   * Logs environment detection results
   */
  static logEnvironmentInfo(): void {
    console.log("🔍 Environment Detection Results:");
    console.log(`  CI: ${process.env.CI}`);
    console.log(`  Docker: ${process.env.DOCKER_ENV || process.env.IS_DOCKER}`);
    console.log(`  GitHub Actions: ${process.env.GITHUB_ACTIONS}`);
    console.log(`  Force Download: ${process.env.FORCE_OBSIDIAN_DOWNLOAD}`);
    console.log(`  Inside Docker: ${this.detectDockerEnvironment()}`);
    console.log(`  Should Download: ${this.shouldDownloadObsidian()}`);
  }
}
