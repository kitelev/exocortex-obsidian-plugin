#!/usr/bin/env node

/**
 * Automated Changelog Generation Script
 *
 * Generates CHANGELOG.md from git commits following Keep a Changelog format
 * https://keepachangelog.com/en/1.0.0/
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

class ChangelogGenerator {
  constructor() {
    this.changeTypes = {
      feat: "Added",
      feature: "Added",
      add: "Added",
      fix: "Fixed",
      bugfix: "Fixed",
      bug: "Fixed",
      hotfix: "Fixed",
      docs: "Changed",
      doc: "Changed",
      documentation: "Changed",
      style: "Changed",
      refactor: "Changed",
      perf: "Changed",
      performance: "Changed",
      test: "Changed",
      tests: "Changed",
      build: "Changed",
      ci: "Changed",
      chore: "Changed",
      update: "Changed",
      upgrade: "Changed",
      deps: "Changed",
      dependency: "Changed",
      dependencies: "Changed",
      remove: "Removed",
      delete: "Removed",
      deprecate: "Deprecated",
      security: "Security",
    };
  }

  log(message) {
    console.log(`📝 ${message}`);
  }

  error(message) {
    console.error(`❌ ${message}`);
  }

  success(message) {
    console.log(`✅ ${message}`);
  }

  getGitTags() {
    try {
      const tags = execSync("git tag --sort=-version:refname", {
        encoding: "utf8",
      }).trim();
      return tags ? tags.split("\n") : [];
    } catch (error) {
      return [];
    }
  }

  getCommitsBetween(from, to = "HEAD") {
    try {
      const range = from ? `${from}..${to}` : to;
      const commits = execSync(
        `git log ${range} --pretty=format:"%H|%s|%an|%ad" --date=short`,
        { encoding: "utf8" },
      ).trim();

      if (!commits) return [];

      return commits.split("\n").map((line) => {
        const [hash, subject, author, date] = line.split("|");
        return { hash, subject, author, date };
      });
    } catch (error) {
      this.error(`Failed to get commits: ${error.message}`);
      return [];
    }
  }

  categorizeCommit(commitSubject) {
    const subject = commitSubject.toLowerCase();

    // Check for conventional commit format (type: description)
    const conventionalMatch = subject.match(/^(\w+)(\(.+\))?:\s*(.+)/);
    if (conventionalMatch) {
      const type = conventionalMatch[1];
      const description = conventionalMatch[3];
      const category = this.changeTypes[type] || "Changed";
      return { category, description: commitSubject };
    }

    // Check for common prefixes
    for (const [keyword, category] of Object.entries(this.changeTypes)) {
      if (
        subject.startsWith(keyword + " ") ||
        subject.startsWith(keyword + ":")
      ) {
        return { category, description: commitSubject };
      }
    }

    // Default to Changed if no pattern matches
    return { category: "Changed", description: commitSubject };
  }

  getCurrentVersion() {
    try {
      const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
      return manifest.version;
    } catch (error) {
      try {
        const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
        return packageJson.version;
      } catch (error) {
        return "0.0.0";
      }
    }
  }

  formatDate(date) {
    return date || new Date().toISOString().split("T")[0];
  }

  generateChangelogSection(version, commits, date) {
    if (!commits || commits.length === 0) {
      return "";
    }

    const categorized = {
      Added: [],
      Changed: [],
      Deprecated: [],
      Removed: [],
      Fixed: [],
      Security: [],
    };

    commits.forEach((commit) => {
      // Skip merge commits and version bump commits
      if (
        commit.subject.startsWith("Merge ") ||
        commit.subject.includes("version bump") ||
        commit.subject.includes("Update version") ||
        commit.subject.match(/^v?\d+\.\d+\.\d+/)
      ) {
        return;
      }

      const { category, description } = this.categorizeCommit(commit.subject);
      if (categorized[category]) {
        categorized[category].push(description);
      }
    });

    let section = `## [${version}] - ${this.formatDate(date)}\n\n`;
    let hasContent = false;

    Object.entries(categorized).forEach(([category, items]) => {
      if (items.length > 0) {
        section += `### ${category}\n\n`;
        items.forEach((item) => {
          section += `- ${item}\n`;
        });
        section += "\n";
        hasContent = true;
      }
    });

    return hasContent ? section : "";
  }

  readExistingChangelog() {
    if (!fs.existsSync("CHANGELOG.md")) {
      return this.createChangelogHeader();
    }

    return fs.readFileSync("CHANGELOG.md", "utf8");
  }

  createChangelogHeader() {
    return `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;
  }

  updateChangelog(newContent) {
    const existing = this.readExistingChangelog();

    // Find where to insert new content
    const lines = existing.split("\n");
    const headerEnd = lines.findIndex((line) => line.startsWith("## "));

    if (headerEnd === -1) {
      // No existing versions, append to end
      return existing + newContent;
    }

    // Insert new content before first existing version
    const beforeVersions = lines.slice(0, headerEnd).join("\n");
    const afterVersions = lines.slice(headerEnd).join("\n");

    return beforeVersions + newContent + afterVersions;
  }

  generateFullChangelog() {
    this.log("Generating full changelog from git history...");

    const tags = this.getGitTags();
    const currentVersion = this.getCurrentVersion();
    let changelog = this.createChangelogHeader();

    if (tags.length === 0) {
      // No tags, generate changelog for all commits
      this.log("No tags found, generating changelog for all commits");
      const allCommits = this.getCommitsBetween(null);
      const section = this.generateChangelogSection(
        currentVersion,
        allCommits,
        null,
      );
      if (section) {
        changelog += section;
      }
    } else {
      // Generate changelog for unreleased changes
      const unreleasedCommits = this.getCommitsBetween(tags[0]);
      if (unreleasedCommits.length > 0) {
        const unreleasedSection = this.generateChangelogSection(
          "Unreleased",
          unreleasedCommits,
          null,
        );
        if (unreleasedSection) {
          changelog += unreleasedSection;
        }
      }

      // Generate changelog for each version
      for (let i = 0; i < tags.length; i++) {
        const currentTag = tags[i];
        const previousTag = tags[i + 1];

        const commits = this.getCommitsBetween(previousTag, currentTag);
        const section = this.generateChangelogSection(
          currentTag,
          commits,
          null,
        );
        if (section) {
          changelog += section;
        }
      }
    }

    return changelog;
  }

  generateIncremental() {
    this.log("Generating incremental changelog...");

    const tags = this.getGitTags();
    const currentVersion = this.getCurrentVersion();

    // Get commits since last tag
    const lastTag = tags[0];
    const newCommits = this.getCommitsBetween(lastTag);

    if (newCommits.length === 0) {
      this.log("No new commits since last tag");
      return false;
    }

    const newSection = this.generateChangelogSection(
      currentVersion,
      newCommits,
      null,
    );
    if (!newSection) {
      this.log("No significant changes to add to changelog");
      return false;
    }

    const updatedChangelog = this.updateChangelog(newSection);
    fs.writeFileSync("CHANGELOG.md", updatedChangelog, "utf8");

    this.success(`Added ${newCommits.length} commits to changelog`);
    return true;
  }

  run(options = {}) {
    const { full = false, output = "CHANGELOG.md" } = options;

    this.log("Starting changelog generation...");

    try {
      let changelog;

      if (full || !fs.existsSync("CHANGELOG.md")) {
        changelog = this.generateFullChangelog();
        fs.writeFileSync(output, changelog, "utf8");
        this.success(`Generated full changelog: ${output}`);
      } else {
        const updated = this.generateIncremental();
        if (!updated) {
          this.log("Changelog is up to date");
          return true;
        }
      }

      // Validate the generated changelog
      if (fs.existsSync(output)) {
        const stats = fs.statSync(output);
        if (stats.size === 0) {
          this.error("Generated changelog is empty");
          return false;
        }
        this.success("Changelog generation completed successfully");
        return true;
      }

      return false;
    } catch (error) {
      this.error(`Failed to generate changelog: ${error.message}`);
      return false;
    }
  }
}

// Command line interface
const args = process.argv.slice(2);
const options = {};

if (args.includes("--full")) {
  options.full = true;
}

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Changelog Generator

Usage: node generate-changelog.js [options]

Options:
  --full    Generate full changelog from all git history
  --help    Show this help message

Examples:
  node generate-changelog.js           # Incremental update
  node generate-changelog.js --full    # Full regeneration
`);
  process.exit(0);
}

// Run the generator
const generator = new ChangelogGenerator();
const success = generator.run(options);
process.exit(success ? 0 : 1);
