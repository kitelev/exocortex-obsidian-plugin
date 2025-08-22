#!/usr/bin/env node

/**
 * Comprehensive Obsidian Plugin Validation Script
 *
 * This script validates the plugin against Obsidian community standards:
 * - https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
 * - https://github.com/obsidianmd/obsidian-releases
 */

const fs = require("fs");
const path = require("path");

class PluginValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.infoMessages = [];
  }

  error(message) {
    this.errors.push(message);
    console.error(`❌ ERROR: ${message}`);
  }

  warn(message) {
    this.warnings.push(message);
    console.warn(`⚠️  WARNING: ${message}`);
  }

  info(message) {
    this.infoMessages.push(message);
    console.log(`ℹ️  INFO: ${message}`);
  }

  success(message) {
    console.log(`✅ ${message}`);
  }

  validateFileExists(filePath, required = true) {
    if (!fs.existsSync(filePath)) {
      if (required) {
        this.error(`Required file missing: ${filePath}`);
        return false;
      } else {
        this.warn(`Optional file missing: ${filePath}`);
        return false;
      }
    }
    return true;
  }

  validateManifest() {
    this.info("Validating manifest.json...");

    if (!this.validateFileExists("manifest.json")) {
      return false;
    }

    let manifest;
    try {
      const manifestContent = fs.readFileSync("manifest.json", "utf8");
      manifest = JSON.parse(manifestContent);
    } catch (error) {
      this.error(`Invalid JSON in manifest.json: ${error.message}`);
      return false;
    }

    // Required fields
    const requiredFields = ["id", "name", "version", "minAppVersion"];
    for (const field of requiredFields) {
      if (!manifest[field]) {
        this.error(`manifest.json missing required field: ${field}`);
      }
    }

    // Validate ID format
    if (manifest.id) {
      if (!/^[a-z0-9-]+$/.test(manifest.id)) {
        this.error(
          "Plugin ID must only contain lowercase letters, numbers, and hyphens",
        );
      }
      if (manifest.id.length < 3 || manifest.id.length > 50) {
        this.error("Plugin ID must be between 3 and 50 characters");
      }
    }

    // Validate version format (SemVer)
    if (manifest.version) {
      if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9-.]+)?$/.test(manifest.version)) {
        this.error(
          "Plugin version must follow semantic versioning (e.g., 1.0.0)",
        );
      }
    }

    // Validate minAppVersion
    if (manifest.minAppVersion) {
      if (!/^\d+\.\d+\.\d+$/.test(manifest.minAppVersion)) {
        this.error("minAppVersion must follow semantic versioning format");
      }
    }

    // Optional but recommended fields
    const recommendedFields = ["description", "author", "authorUrl"];
    for (const field of recommendedFields) {
      if (!manifest[field]) {
        this.warn(`manifest.json missing recommended field: ${field}`);
      }
    }

    // Check description length
    if (manifest.description && manifest.description.length > 250) {
      this.warn(
        "Plugin description should be under 250 characters for better display",
      );
    }

    this.success("manifest.json validation completed");
    return true;
  }

  validateVersionsFile() {
    this.info("Validating versions.json...");

    if (!this.validateFileExists("versions.json")) {
      return false;
    }

    let versions;
    try {
      const versionsContent = fs.readFileSync("versions.json", "utf8");
      versions = JSON.parse(versionsContent);
    } catch (error) {
      this.error(`Invalid JSON in versions.json: ${error.message}`);
      return false;
    }

    // Validate structure
    if (typeof versions !== "object" || Array.isArray(versions)) {
      this.error("versions.json must be an object with version keys");
      return false;
    }

    // Validate version entries
    for (const [version, minAppVersion] of Object.entries(versions)) {
      if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9-.]+)?$/.test(version)) {
        this.error(`Invalid version format in versions.json: ${version}`);
      }
      if (!/^\d+\.\d+\.\d+$/.test(minAppVersion)) {
        this.error(
          `Invalid minAppVersion format in versions.json: ${minAppVersion} for version ${version}`,
        );
      }
    }

    this.success("versions.json validation completed");
    return true;
  }

  validateMainFile() {
    this.info("Validating main.js...");

    if (!this.validateFileExists("main.js")) {
      return false;
    }

    // Check file size
    const stats = fs.statSync("main.js");
    const fileSizeInMB = stats.size / (1024 * 1024);

    if (fileSizeInMB > 2) {
      this.warn(
        `main.js is quite large (${fileSizeInMB.toFixed(2)}MB). Consider code splitting.`,
      );
    }

    if (stats.size === 0) {
      this.error("main.js is empty");
      return false;
    }

    // Basic syntax validation
    try {
      const mainContent = fs.readFileSync("main.js", "utf8");
      new Function("module", "exports", "require", mainContent);
    } catch (error) {
      this.error(`main.js syntax error: ${error.message}`);
      return false;
    }

    this.success("main.js validation completed");
    return true;
  }

  validateVersionConsistency() {
    this.info("Validating version consistency...");

    // Read package.json
    let packageVersion, manifestVersion;

    if (fs.existsSync("package.json")) {
      try {
        const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
        packageVersion = packageJson.version;
      } catch (error) {
        this.warn(`Could not read package.json: ${error.message}`);
      }
    }

    if (fs.existsSync("manifest.json")) {
      try {
        const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
        manifestVersion = manifest.version;
      } catch (error) {
        this.warn(`Could not read manifest.json: ${error.message}`);
      }
    }

    if (
      packageVersion &&
      manifestVersion &&
      packageVersion !== manifestVersion
    ) {
      this.warn(
        `Version mismatch: package.json (${packageVersion}) vs manifest.json (${manifestVersion})`,
      );
    } else if (packageVersion && manifestVersion) {
      this.success("Version consistency check passed");
    }

    return true;
  }

  validateRequiredFiles() {
    this.info("Validating required files...");

    const requiredFiles = ["main.js", "manifest.json"];

    const recommendedFiles = ["README.md", "LICENSE", "CHANGELOG.md"];

    let allRequired = true;
    for (const file of requiredFiles) {
      if (!this.validateFileExists(file, true)) {
        allRequired = false;
      }
    }

    for (const file of recommendedFiles) {
      this.validateFileExists(file, false);
    }

    if (allRequired) {
      this.success("Required files validation completed");
    }

    return allRequired;
  }

  validateStyles() {
    this.info("Validating styles.css...");

    if (fs.existsSync("styles.css")) {
      const stats = fs.statSync("styles.css");
      if (stats.size === 0) {
        this.warn("styles.css exists but is empty");
      } else {
        this.success("styles.css found and not empty");
      }
    } else {
      this.info("styles.css not found (optional)");
    }

    return true;
  }

  validateDirectoryStructure() {
    this.info("Validating directory structure...");

    const expectedDirs = ["src", "tests"];

    for (const dir of expectedDirs) {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        this.success(`${dir}/ directory found`);
      } else {
        this.info(
          `${dir}/ directory not found (recommended for organized projects)`,
        );
      }
    }

    return true;
  }

  validatePackageJson() {
    this.info("Validating package.json...");

    if (!this.validateFileExists("package.json", false)) {
      return true; // package.json is not required for Obsidian plugins
    }

    let packageJson;
    try {
      const packageContent = fs.readFileSync("package.json", "utf8");
      packageJson = JSON.parse(packageContent);
    } catch (error) {
      this.warn(`Invalid JSON in package.json: ${error.message}`);
      return false;
    }

    // Check for Obsidian-related dependencies
    const devDeps = packageJson.devDependencies || {};
    if (!devDeps.obsidian) {
      this.warn(
        "obsidian package not found in devDependencies (recommended for TypeScript support)",
      );
    }

    // Check Node.js engine requirements
    if (packageJson.engines && packageJson.engines.node) {
      const nodeVersion = packageJson.engines.node;
      if (!nodeVersion.includes("18") && !nodeVersion.includes("20")) {
        this.warn(
          "Consider specifying Node.js 18+ in engines for better CI compatibility",
        );
      }
    }

    this.success("package.json validation completed");
    return true;
  }

  run() {
    console.log("🔍 Starting Obsidian Plugin Validation...\n");

    const validations = [
      () => this.validateRequiredFiles(),
      () => this.validateManifest(),
      () => this.validateVersionsFile(),
      () => this.validateMainFile(),
      () => this.validateVersionConsistency(),
      () => this.validateStyles(),
      () => this.validateDirectoryStructure(),
      () => this.validatePackageJson(),
    ];

    for (const validation of validations) {
      validation();
      console.log(""); // Add spacing between validations
    }

    // Summary
    console.log("📋 VALIDATION SUMMARY");
    console.log("=====================");

    if (this.errors.length === 0) {
      console.log("✅ No errors found!");
    } else {
      console.log(`❌ ${this.errors.length} error(s) found:`);
      this.errors.forEach((error) => console.log(`   • ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log(`⚠️  ${this.warnings.length} warning(s):`);
      this.warnings.forEach((warning) => console.log(`   • ${warning}`));
    }

    console.log("");

    if (this.errors.length === 0) {
      console.log(
        "🎉 Plugin validation passed! Your plugin is ready for release.",
      );
      return true;
    } else {
      console.log("❌ Plugin validation failed. Please fix the errors above.");
      return false;
    }
  }
}

// Run validation
const validator = new PluginValidator();
const success = validator.run();
process.exit(success ? 0 : 1);
