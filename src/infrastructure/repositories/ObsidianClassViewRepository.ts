import { App, TFile } from "obsidian";
import { IClassViewRepository } from "../../domain/repositories/IClassViewRepository";
import { ClassView, DisplayOptions } from "../../domain/aggregates/ClassView";
import { ClassName } from "../../domain/value-objects/ClassName";
import { AssetId } from "../../domain/value-objects/AssetId";
import { Result } from "../../domain/core/Result";
import { UIButton } from "../../domain/entities/UIButton";

/**
 * Obsidian implementation of ClassView repository
 * Maps between domain entities and Obsidian vault files
 */
export class ObsidianClassViewRepository implements IClassViewRepository {
  constructor(private app: App) {}

  async findByClassName(
    className: ClassName,
  ): Promise<Result<ClassView | null>> {
    try {
      const files = this.app.vault.getMarkdownFiles();

      for (const file of files) {
        const metadata = this.app.metadataCache.getFileCache(file);
        if (!metadata?.frontmatter) continue;

        const instanceClass = metadata.frontmatter["exo__Instance_class"];
        if (instanceClass !== "[[ui__ClassView]]") continue;

        const targetClass = metadata.frontmatter["ui__ClassView_targetClass"];
        if (!targetClass) continue;

        const cleanTargetClass = this.cleanAssetReference(targetClass);
        if (cleanTargetClass !== className.value) continue;

        // Found the ClassView for this class
        return this.buildClassViewFromFile(file);
      }

      return Result.ok<ClassView | null>(null);
    } catch (error) {
      return Result.fail<ClassView | null>(
        `Failed to find ClassView: ${error.message}`,
      );
    }
  }

  async findById(id: AssetId): Promise<Result<ClassView | null>> {
    try {
      const file = this.app.vault.getAbstractFileByPath(id.toString() + ".md");
      if (!file || !(file instanceof TFile)) {
        return Result.ok<ClassView | null>(null);
      }

      return this.buildClassViewFromFile(file);
    } catch (error) {
      return Result.fail<ClassView | null>(
        `Failed to find ClassView by ID: ${error.message}`,
      );
    }
  }

  async save(classView: ClassView): Promise<Result<void>> {
    try {
      const filePath = `${classView.id.toString()}.md`;
      const content = this.serializeClassView(classView);

      const existingFile = this.app.vault.getAbstractFileByPath(filePath);
      if (existingFile instanceof TFile) {
        await this.app.vault.modify(existingFile, content);
      } else {
        await this.app.vault.create(filePath, content);
      }

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to save ClassView: ${error.message}`);
    }
  }

  async delete(id: AssetId): Promise<Result<void>> {
    try {
      const file = this.app.vault.getAbstractFileByPath(id.toString() + ".md");
      if (file instanceof TFile) {
        await this.app.vault.delete(file);
      }
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to delete ClassView: ${error.message}`);
    }
  }

  async findAll(): Promise<Result<ClassView[]>> {
    try {
      const classViews: ClassView[] = [];
      const files = this.app.vault.getMarkdownFiles();

      for (const file of files) {
        const metadata = this.app.metadataCache.getFileCache(file);
        if (!metadata?.frontmatter) continue;

        const instanceClass = metadata.frontmatter["exo__Instance_class"];
        if (instanceClass !== "[[ui__ClassView]]") continue;

        const result = await this.buildClassViewFromFile(file);
        if (result.isSuccess && result.getValue()) {
          classViews.push(result.getValue()!);
        }
      }

      return Result.ok<ClassView[]>(classViews);
    } catch (error) {
      return Result.fail<ClassView[]>(
        `Failed to find all ClassViews: ${error.message}`,
      );
    }
  }

  async exists(className: ClassName): Promise<Result<boolean>> {
    const result = await this.findByClassName(className);
    if (result.isFailure) {
      return Result.fail<boolean>(result.error);
    }
    return Result.ok<boolean>(result.getValue() !== null);
  }

  private async buildClassViewFromFile(
    file: TFile,
  ): Promise<Result<ClassView | null>> {
    try {
      const metadata = this.app.metadataCache.getFileCache(file);
      if (!metadata?.frontmatter) {
        return Result.ok<ClassView | null>(null);
      }

      const fm = metadata.frontmatter;

      // Parse target class
      const targetClass = fm["ui__ClassView_targetClass"];
      if (!targetClass) {
        return Result.ok<ClassView | null>(null);
      }

      const classNameResult = ClassName.create(
        this.cleanAssetReference(targetClass),
      );
      if (classNameResult.isFailure) {
        return Result.fail<ClassView | null>(classNameResult.error);
      }

      // Parse buttons
      const buttonRefs = fm["ui__ClassView_buttons"] || [];
      const buttons: UIButton[] = [];

      for (const buttonRef of this.ensureArray(buttonRefs)) {
        const buttonResult = await this.loadButton(
          this.cleanAssetReference(buttonRef),
        );
        if (buttonResult.isSuccess && buttonResult.getValue()) {
          buttons.push(buttonResult.getValue()!);
        }
      }

      // Parse display options
      const displayOptions: DisplayOptions = {
        showProperties: fm["ui__ClassView_showProperties"] !== false,
        showRelations: fm["ui__ClassView_showRelations"] !== false,
        showBacklinks: fm["ui__ClassView_showBacklinks"] !== false,
        showButtons: fm["ui__ClassView_showButtons"] !== false,
        buttonPosition: fm["ui__ClassView_buttonPosition"] || "top",
      };

      // Create ClassView
      const idResult = AssetId.create(file.basename);
      if (idResult.isFailure) {
        return Result.fail<ClassView | null>(idResult.error);
      }

      const classViewResult = ClassView.create({
        id: idResult.getValue(),
        className: classNameResult.getValue(),
        buttons: buttons,
        layoutTemplate: fm["ui__ClassView_template"],
        displayOptions: displayOptions,
      });

      if (classViewResult.isFailure) {
        return Result.fail<ClassView | null>(classViewResult.error);
      }

      return Result.ok<ClassView | null>(classViewResult.getValue());
    } catch (error) {
      return Result.fail<ClassView | null>(
        `Failed to build ClassView: ${error.message}`,
      );
    }
  }

  private async loadButton(
    buttonName: string,
  ): Promise<Result<UIButton | null>> {
    try {
      const file = this.app.vault.getAbstractFileByPath(buttonName + ".md");
      if (!file || !(file instanceof TFile)) {
        return Result.ok<UIButton | null>(null);
      }

      const metadata = this.app.metadataCache.getFileCache(file);
      if (!metadata?.frontmatter) {
        return Result.ok<UIButton | null>(null);
      }

      const fm = metadata.frontmatter;

      const idResult = AssetId.create(file.basename);
      const commandIdResult = AssetId.create(
        this.cleanAssetReference(fm["ui__Button_command"] || ""),
      );

      if (idResult.isFailure || commandIdResult.isFailure) {
        return Result.ok<UIButton | null>(null);
      }

      const buttonResult = UIButton.create({
        id: idResult.getValue(),
        label: fm["ui__Button_label"] || file.basename,
        commandId: commandIdResult.getValue(),
        order: fm["ui__Button_order"] || 0,
        isEnabled: fm["ui__Button_enabled"] !== false,
        tooltip: fm["ui__Button_tooltip"],
      });

      if (buttonResult.isFailure) {
        return Result.fail<UIButton | null>(buttonResult.error);
      }

      return Result.ok<UIButton | null>(buttonResult.getValue());
    } catch (error) {
      return Result.fail<UIButton | null>(
        `Failed to load button: ${error.message}`,
      );
    }
  }

  private serializeClassView(classView: ClassView): string {
    const frontmatter = {
      exo__Instance_class: "[[ui__ClassView]]",
      ui__ClassView_targetClass: `[[${classView.className.value}]]`,
      ui__ClassView_buttons: classView.buttons.map(
        (b) => `[[${b.id.toString()}]]`,
      ),
      ui__ClassView_showProperties: classView.displayOptions.showProperties,
      ui__ClassView_showRelations: classView.displayOptions.showRelations,
      ui__ClassView_showBacklinks: classView.displayOptions.showBacklinks,
      ui__ClassView_showButtons: classView.displayOptions.showButtons,
      ui__ClassView_buttonPosition: classView.displayOptions.buttonPosition,
    };

    const yamlContent = this.toYaml(frontmatter);
    return `---\n${yamlContent}---\n\n# ClassView: ${classView.className.value}\n`;
  }

  private cleanAssetReference(ref: string): string {
    if (typeof ref !== "string") return "";
    return ref.replace(/\[\[|\]\]/g, "").trim();
  }

  private ensureArray(value: any): any[] {
    if (Array.isArray(value)) return value;
    if (value) return [value];
    return [];
  }

  private toYaml(obj: any): string {
    // Simple YAML serialization
    return (
      Object.entries(obj)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}:\n${value.map((v) => `  - ${v}`).join("\n")}`;
          }
          return `${key}: ${value}`;
        })
        .join("\n") + "\n"
    );
  }
}
