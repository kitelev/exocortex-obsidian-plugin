import React from "react";
import { TFile } from "obsidian";
import { EventListenerManager } from "../../../adapters/events/EventListenerManager";
import { BacklinksCacheManager } from "../../../adapters/caching/BacklinksCacheManager";
import { ReactRenderer } from "../../utils/ReactRenderer";
import { ActionButtonsGroup } from "../../components/ActionButtonsGroup";
import { ButtonGroupsBuilder } from "../../builders/ButtonGroupsBuilder";
import { DailyTasksRenderer } from "../DailyTasksRenderer";
import { DailyProjectsRenderer } from "../DailyProjectsRenderer";
import { PropertiesRenderer } from "../layout/PropertiesRenderer";
import { AreaTreeRenderer } from "../layout/AreaTreeRenderer";
import { RelationsRenderer, UniversalLayoutConfig } from "../layout/RelationsRenderer";
import { LayoutSection } from "../../../application/services/PropertyDependencyResolver";
import { SectionStateManager } from "./SectionStateManager";

type RenderHeaderFn = (container: HTMLElement, sectionId: string, title: string) => void;

interface RendererDependencies {
  propertiesRenderer: PropertiesRenderer;
  buttonGroupsBuilder: ButtonGroupsBuilder;
  dailyTasksRenderer: DailyTasksRenderer;
  dailyProjectsRenderer: DailyProjectsRenderer;
  areaTreeRenderer: AreaTreeRenderer;
  relationsRenderer: RelationsRenderer;
  reactRenderer: ReactRenderer;
  backlinksCacheManager: BacklinksCacheManager;
  sectionStateManager: SectionStateManager;
  eventListenerManager: EventListenerManager;
}

/**
 * Handles incremental updates to layout sections
 */
export class IncrementalUpdateHandler {
  private static readonly SECTION_SELECTORS: Record<LayoutSection, string> = {
    [LayoutSection.PROPERTIES]: ".exocortex-properties-section",
    [LayoutSection.BUTTONS]: ".exocortex-buttons-section",
    [LayoutSection.DAILY_TASKS]: ".exocortex-daily-tasks-section",
    [LayoutSection.DAILY_PROJECTS]: ".exocortex-daily-projects-section",
    [LayoutSection.AREA_TREE]: ".exocortex-area-tree-section",
    [LayoutSection.RELATIONS]: ".exocortex-assets-relations",
  };

  constructor(private deps: RendererDependencies) {}

  async updateSections(
    rootContainer: HTMLElement,
    file: TFile,
    sections: LayoutSection[],
    config: UniversalLayoutConfig,
  ): Promise<void> {
    const renderHeader = this.createRenderHeader();

    for (const section of sections) {
      await this.updateSection(rootContainer, file, section, config, renderHeader);
    }
  }

  private createRenderHeader(): RenderHeaderFn {
    return (container: HTMLElement, sectionId: string, title: string) =>
      this.deps.sectionStateManager.renderHeader(
        container, sectionId, title, this.deps.eventListenerManager);
  }

  private async updateSection(
    rootContainer: HTMLElement,
    file: TFile,
    section: LayoutSection,
    config: UniversalLayoutConfig,
    renderHeader: RenderHeaderFn,
  ): Promise<void> {
    const selector = IncrementalUpdateHandler.SECTION_SELECTORS[section];
    const containerElement = rootContainer.querySelector(selector);
    if (!(containerElement instanceof HTMLElement)) return;
    const container = containerElement;

    switch (section) {
      case LayoutSection.PROPERTIES:
        await this.updateProperties(rootContainer, container, file, renderHeader);
        break;
      case LayoutSection.BUTTONS:
        await this.updateButtons(rootContainer, container, file);
        break;
      case LayoutSection.DAILY_TASKS:
      case LayoutSection.DAILY_PROJECTS:
      case LayoutSection.AREA_TREE:
      case LayoutSection.RELATIONS:
        await this.updateRelationSection(rootContainer, container, file, section, config, renderHeader);
        break;
    }
  }

  private async updateProperties(
    rootContainer: HTMLElement,
    container: HTMLElement,
    file: TFile,
    renderHeader: RenderHeaderFn,
  ): Promise<void> {
    container.empty();
    const backlinks = this.deps.backlinksCacheManager.getBacklinks(file.path);
    await this.deps.propertiesRenderer.render(
      container.parentElement || rootContainer,
      file,
      { hideAliases: backlinks && backlinks.size > 0 },
      renderHeader,
      this.deps.sectionStateManager.isCollapsed("properties"),
    );
  }

  private async updateButtons(
    rootContainer: HTMLElement,
    container: HTMLElement,
    file: TFile,
  ): Promise<void> {
    container.remove();
    const buttonGroups = await this.deps.buttonGroupsBuilder.build(file);
    if (buttonGroups.length > 0) {
      const buttonsContainer = rootContainer.createDiv({ cls: "exocortex-buttons-section" });
      this.deps.reactRenderer.render(
        buttonsContainer,
        React.createElement(ActionButtonsGroup, { groups: buttonGroups }),
      );
    }
  }

  private async updateRelationSection(
    rootContainer: HTMLElement,
    container: HTMLElement,
    file: TFile,
    section: LayoutSection,
    config: UniversalLayoutConfig,
    renderHeader: RenderHeaderFn,
  ): Promise<void> {
    container.empty();
    const relations = await this.deps.relationsRenderer.getAssetRelations(file, config);
    const parent = container.parentElement || rootContainer;
    const { sectionStateManager: ssm } = this.deps;

    switch (section) {
      case LayoutSection.DAILY_TASKS:
        await this.deps.dailyTasksRenderer.render(
          parent, file, renderHeader, ssm.isCollapsed("daily-tasks"));
        break;
      case LayoutSection.DAILY_PROJECTS:
        await this.deps.dailyProjectsRenderer.render(
          parent, file, renderHeader, ssm.isCollapsed("daily-projects"));
        break;
      case LayoutSection.AREA_TREE:
        await this.deps.areaTreeRenderer.render(
          parent, file, relations, renderHeader, ssm.isCollapsed("area-tree"));
        break;
      case LayoutSection.RELATIONS:
        await this.deps.relationsRenderer.render(
          parent, relations, config, renderHeader, ssm.isCollapsed("relations"));
        break;
    }
  }
}
