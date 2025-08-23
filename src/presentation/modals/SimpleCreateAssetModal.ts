import { App, Modal, Notice, TFile } from "obsidian";

export class SimpleCreateAssetModal extends Modal {
  private assetName: string = "";
  private assetType: string = "Note";
  private relatedTo: string = "";

  constructor(app: App) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    
    contentEl.createEl("h2", { text: "Create New Asset" });
    
    // Asset name input
    const nameDiv = contentEl.createDiv();
    nameDiv.createEl("label", { text: "Name:" });
    const nameInput = nameDiv.createEl("input", {
      type: "text",
      placeholder: "Enter asset name",
    });
    nameInput.addEventListener("input", (e) => {
      this.assetName = (e.target as HTMLInputElement).value;
    });
    
    // Asset type dropdown
    const typeDiv = contentEl.createDiv();
    typeDiv.createEl("label", { text: "Type:" });
    const typeSelect = typeDiv.createEl("select");
    ["Note", "Task", "Project", "Person", "Document"].forEach(type => {
      typeSelect.createEl("option", { text: type, value: type });
    });
    typeSelect.addEventListener("change", (e) => {
      this.assetType = (e.target as HTMLSelectElement).value;
    });
    
    // Related to input (optional)
    const relatedDiv = contentEl.createDiv();
    relatedDiv.createEl("label", { text: "Related to (optional):" });
    const relatedInput = relatedDiv.createEl("input", {
      type: "text",
      placeholder: "Name of related asset",
    });
    relatedInput.addEventListener("input", (e) => {
      this.relatedTo = (e.target as HTMLInputElement).value;
    });
    
    // Buttons
    const buttonDiv = contentEl.createDiv({ cls: "modal-button-container" });
    
    const createButton = buttonDiv.createEl("button", { text: "Create" });
    createButton.addEventListener("click", async () => {
      if (this.assetName) {
        await this.createAsset();
        this.close();
      } else {
        new Notice("Please enter an asset name");
      }
    });
    
    const cancelButton = buttonDiv.createEl("button", { text: "Cancel" });
    cancelButton.addEventListener("click", () => {
      this.close();
    });
  }

  private async createAsset() {
    const fileName = `${this.assetName}.md`;
    const folder = "Assets"; // Default folder
    const filePath = `${folder}/${fileName}`;
    
    // Create folder if it doesn't exist
    if (!this.app.vault.getAbstractFileByPath(folder)) {
      await this.app.vault.createFolder(folder);
    }
    
    // Check if file already exists
    if (this.app.vault.getAbstractFileByPath(filePath)) {
      new Notice(`Asset "${this.assetName}" already exists`);
      return;
    }
    
    // Create frontmatter
    const frontmatter: Record<string, any> = {
      title: this.assetName,
      type: this.assetType,
      created: new Date().toISOString(),
    };
    
    if (this.relatedTo) {
      frontmatter.relatedTo = this.relatedTo;
    }
    
    // Create file content
    const content = [
      "---",
      ...Object.entries(frontmatter).map(([key, value]) => `${key}: ${value}`),
      "---",
      "",
      `# ${this.assetName}`,
      "",
      "## Description",
      "",
      "Add description here...",
      "",
      "## Notes",
      "",
    ].join("\n");
    
    // Create the file
    const file = await this.app.vault.create(filePath, content);
    
    // Open the file
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(file);
    
    new Notice(`Created asset: ${this.assetName}`);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}