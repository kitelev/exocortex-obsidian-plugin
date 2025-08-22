import {
  Command,
  Notice,
  TFile,
  App,
  Modal,
  Setting,
  ProgressBarComponent,
} from "obsidian";
import { RelationOntologizer } from "../../application/services/RelationOntologizer";

/**
 * Command to ontologize relationships in the current asset or entire vault
 */
export class OntologizeAssetCommand implements Command {
  id = "ontologize-asset-relations";
  name = "Ontologize asset relations";

  private app: App;
  private ontologizer: RelationOntologizer;

  constructor(app: App) {
    this.app = app;
    this.ontologizer = new RelationOntologizer(app);
  }

  async callback(): Promise<void> {
    const activeFile = this.app.workspace.getActiveFile();

    if (!activeFile) {
      new OntologizeVaultModal(this.app, this.ontologizer).open();
      return;
    }

    // Show options modal
    new OntologizeOptionsModal(this.app, this.ontologizer, activeFile).open();
  }
}

/**
 * Modal for choosing ontologization options
 */
class OntologizeOptionsModal extends Modal {
  private ontologizer: RelationOntologizer;
  private currentFile: TFile;

  constructor(app: App, ontologizer: RelationOntologizer, file: TFile) {
    super(app);
    this.ontologizer = ontologizer;
    this.currentFile = file;
  }

  onOpen(): void {
    const { contentEl } = this;

    contentEl.createEl("h2", { text: "Ontologize Relations" });

    contentEl.createEl("p", {
      text: "Convert asset properties to first-class Relation objects. This enables:",
    });

    const benefitsList = contentEl.createEl("ul");
    benefitsList.createEl("li", { text: "Event Sourcing and versioning" });
    benefitsList.createEl("li", { text: "Bidirectional relationships" });
    benefitsList.createEl("li", {
      text: "Beautiful Graph View with relation nodes",
    });
    benefitsList.createEl("li", {
      text: "Flexible access control per relation",
    });

    contentEl.createEl("h3", { text: "Choose scope:" });

    // Current file button
    new Setting(contentEl)
      .setName(`Current file: ${this.currentFile.basename}`)
      .setDesc("Ontologize relations in the current file only")
      .addButton((button) =>
        button
          .setButtonText("Ontologize Current")
          .setCta()
          .onClick(async () => {
            this.close();
            await this.ontologizeCurrentFile();
          }),
      );

    // Entire vault button
    new Setting(contentEl)
      .setName("Entire vault")
      .setDesc("Ontologize all relations in the vault (may take time)")
      .addButton((button) =>
        button
          .setButtonText("Ontologize Vault")
          .setWarning()
          .onClick(() => {
            this.close();
            new OntologizeVaultModal(this.app, this.ontologizer).open();
          }),
      );

    // Cancel button
    new Setting(contentEl).addButton((button) =>
      button.setButtonText("Cancel").onClick(() => this.close()),
    );
  }

  private async ontologizeCurrentFile(): Promise<void> {
    try {
      const relations = await this.ontologizer.ontologizeAsset(
        this.currentFile,
      );

      if (relations.length === 0) {
        new Notice("No object properties found to ontologize");
        return;
      }

      await this.ontologizer.createRelationFiles(relations);

      // Get properties that were converted
      const convertedProperties = [
        ...new Set(relations.map((r) => r.predicate)),
      ];

      // Clean the original asset
      await this.ontologizer.cleanAssetFrontmatter(
        this.currentFile,
        convertedProperties,
      );

      new Notice(`✅ Created ${relations.length} relation assets`);
    } catch (error) {
      console.error("Ontologization failed:", error);
      new Notice(`❌ Ontologization failed: ${error.message}`);
    }
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}

/**
 * Modal for ontologizing entire vault with progress
 */
class OntologizeVaultModal extends Modal {
  private ontologizer: RelationOntologizer;
  private isRunning = false;

  constructor(app: App, ontologizer: RelationOntologizer) {
    super(app);
    this.ontologizer = ontologizer;
  }

  onOpen(): void {
    const { contentEl } = this;

    contentEl.createEl("h2", { text: "Ontologize Entire Vault" });

    contentEl.createEl("p", {
      text: "⚠️ This will convert ALL object properties in your vault to Relation assets.",
      cls: "mod-warning",
    });

    contentEl.createEl("p", { text: "This process will:" });

    const processList = contentEl.createEl("ul");
    processList.createEl("li", { text: "Scan all markdown files" });
    processList.createEl("li", {
      text: "Extract object properties from frontmatter",
    });
    processList.createEl("li", {
      text: 'Create Relation assets in "99 Relations" folder',
    });
    processList.createEl("li", {
      text: "Clean original assets (remove converted properties)",
    });

    // Progress container
    const progressContainer = contentEl.createDiv({
      cls: "ontologize-progress",
    });
    progressContainer.style.display = "none";

    const progressText = progressContainer.createEl("p", {
      text: "Processing...",
    });

    const progressBar = progressContainer.createDiv({ cls: "progress-bar" });
    const progressFill = progressBar.createDiv({ cls: "progress-bar-fill" });
    progressFill.style.width = "0%";
    progressBar.style.height = "20px";
    progressBar.style.backgroundColor = "#e0e0e0";
    progressBar.style.borderRadius = "10px";
    progressBar.style.overflow = "hidden";
    progressFill.style.height = "100%";
    progressFill.style.backgroundColor = "#7c3aed";
    progressFill.style.transition = "width 0.3s ease";

    // Buttons
    const buttonContainer = contentEl.createDiv({ cls: "button-container" });

    const startButton = buttonContainer.createEl("button", {
      text: "Start Migration",
      cls: "mod-cta",
    });

    const cancelButton = buttonContainer.createEl("button", {
      text: "Cancel",
      cls: "mod-cancel",
    });

    startButton.onclick = async () => {
      if (this.isRunning) return;

      this.isRunning = true;
      startButton.disabled = true;
      progressContainer.style.display = "block";

      try {
        const result = await this.ontologizer.migrateVault((current, total) => {
          const percentage = (current / total) * 100;
          progressFill.style.width = `${percentage}%`;
          progressText.textContent = `Processing ${current} of ${total} files...`;
        });

        this.close();

        // Show results
        new Notice(`✅ Migration complete!
- Assets processed: ${result.assetsProcessed}
- Relations created: ${result.relationsCreated}
${result.errors.length > 0 ? `- Errors: ${result.errors.length}` : ""}`);

        if (result.errors.length > 0) {
          console.error("Migration errors:", result.errors);
        }
      } catch (error) {
        console.error("Migration failed:", error);
        new Notice(`❌ Migration failed: ${error.message}`);
      } finally {
        this.isRunning = false;
      }
    };

    cancelButton.onclick = () => {
      if (!this.isRunning) {
        this.close();
      }
    };
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
