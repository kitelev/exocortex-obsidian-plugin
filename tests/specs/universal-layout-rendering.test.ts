/**
 * BDD Tests for Universal Layout Basic Rendering
 * Based on: specs/features/layout/universal-layout-rendering.feature
 *
 * Validates core universal layout functionality
 */

import { UniversalLayoutRenderer } from "../../src/presentation/renderers/UniversalLayoutRenderer";
import { AssetRelation } from "../../src/domain/entities/Asset";

describe("Feature: Universal Layout Basic Rendering", () => {
  let renderer: UniversalLayoutRenderer;
  let mockApp: any;
  let container: HTMLElement;

  beforeEach(() => {
    mockApp = {
      workspace: {
        getActiveFile: jest.fn(),
        openLinkText: jest.fn(),
      },
      metadataCache: {
        resolvedLinks: {},
        getFileCache: jest.fn(),
        on: jest.fn(),
      },
      vault: {
        getAbstractFileByPath: jest.fn(),
      },
    };

    renderer = new UniversalLayoutRenderer(mockApp);
    container = document.createElement("div");
  });

  describe("Правило: Отображение таблицы связанных заметок", () => {
    it("должен отобразить таблицу с правильными колонками", async () => {
      const relations: AssetRelation[] = [
        {
          path: "Задача 1.md",
          title: "Задача 1",
          metadata: { exo__Instance_class: "[[ems__Task]]" },
          propertyName: "exo__Parent",
          modified: Date.now(),
          created: Date.now(),
        },
        {
          path: "Задача 2.md",
          title: "Задача 2",
          metadata: { exo__Instance_class: "[[ems__Task]]" },
          propertyName: "exo__Parent",
          modified: Date.now(),
          created: Date.now(),
        },
        {
          path: "Область работ.md",
          title: "Область работ",
          metadata: { exo__Instance_class: "[[ems__Area]]" },
          propertyName: undefined, // body link
          modified: Date.now(),
          created: Date.now(),
        },
      ];

      await (renderer as any).renderTable(container, relations, {
        layout: "table",
        showProperties: ["exo__Instance_class"],
      });

      // Проверяем наличие таблицы
      const table = container.querySelector("table");
      expect(table).not.toBeNull();

      // Проверяем колонки
      const headers = container.querySelectorAll("th");
      const headerTexts = Array.from(headers).map((h) => h.textContent);

      expect(headerTexts.some((t) => t?.includes("Name"))).toBe(true);
      expect(headerTexts).toContain("exo__Instance_class");
      expect(headerTexts).toContain("Relation Type");
      expect(headerTexts).toContain("Modified");

      // Проверяем количество строк
      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(3);

      // Проверяем, что заголовки sortable
      const nameHeader = Array.from(headers).find((h) =>
        h.textContent?.includes("Name")
      );
      expect(nameHeader?.classList.contains("sortable")).toBe(true);

      const classHeader = Array.from(headers).find(
        (h) => h.textContent === "exo__Instance_class"
      );
      expect(classHeader?.classList.contains("sortable")).toBe(true);
    });

    it("должен отображать Relation Type корректно", async () => {
      const relations: AssetRelation[] = [
        {
          path: "Task1.md",
          title: "Task 1",
          metadata: {},
          propertyName: "exo__Parent",
          modified: Date.now(),
          created: Date.now(),
        },
        {
          path: "Task2.md",
          title: "Task 2",
          metadata: {},
          propertyName: undefined, // body link
          modified: Date.now(),
          created: Date.now(),
        },
      ];

      await (renderer as any).renderTable(container, relations, {
        layout: "table",
      });

      const cells = container.querySelectorAll(".relation-type");
      expect(cells.length).toBe(2);

      const relationTypes = Array.from(cells).map((c) => c.textContent);
      expect(relationTypes).toContain("exo__Parent");
      expect(relationTypes).toContain("body");
    });
  });

  describe("Правило: Обработка пустых состояний", () => {
    it("должен корректно рендерить пустую таблицу", async () => {
      const relations: AssetRelation[] = [];

      await (renderer as any).renderTable(container, relations, {
        layout: "table",
      });

      // Таблица создается, но без строк
      const table = container.querySelector("table");
      expect(table).not.toBeNull();

      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(0);

      // Сообщение показывается на уровне render(), не renderTable()
      // Это тестируется в unit тестах UniversalLayoutRenderer
    });
  });

  describe("Правило: Фильтрация архивных заметок", () => {
    it("должен автоматически скрывать архивные заметки", async () => {
      // This is tested in UniversalLayoutRenderer.test.ts archived filtering suite
      // Just verify the basic behavior is documented
      const archivedRelation: AssetRelation = {
        path: "Archived.md",
        title: "Archived Task",
        metadata: { archived: true },
        modified: Date.now(),
        created: Date.now(),
      };

      // isAssetArchived should return true
      const isArchived = (renderer as any).isAssetArchived(
        archivedRelation.metadata
      );
      expect(isArchived).toBe(true);
    });
  });

  describe("Регрессионные тесты", () => {
    it("должен корректно обрабатывать relations без metadata", async () => {
      const relations: AssetRelation[] = [
        {
          path: "Note.md",
          title: "Note",
          metadata: undefined as any,
          modified: Date.now(),
          created: Date.now(),
        },
      ];

      await (renderer as any).renderTable(container, relations, {
        layout: "table",
        showProperties: ["exo__Instance_class"],
      });

      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(1);

      // Instance Class должен показать "-"
      const instanceCell = rows[0]?.querySelector(".instance-class");
      expect(instanceCell?.textContent).toBe("-");
    });

    it("должен корректно обрабатывать relations с пустым metadata", async () => {
      const relations: AssetRelation[] = [
        {
          path: "Note.md",
          title: "Note",
          metadata: {},
          modified: Date.now(),
          created: Date.now(),
        },
      ];

      await (renderer as any).renderTable(container, relations, {
        layout: "table",
        showProperties: ["exo__Instance_class"],
      });

      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(1);
    });
  });
});
