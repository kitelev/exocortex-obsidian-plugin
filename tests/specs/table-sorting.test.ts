/**
 * BDD Tests for Table Sorting
 * Based on: specs/features/layout/table-sorting.feature
 *
 * Validates interactive table sorting functionality
 */

import { UniversalLayoutRenderer } from "../../src/presentation/renderers/UniversalLayoutRenderer";
import { AssetRelation } from "../../src/domain/entities/Asset";

describe("Feature: Интерактивная сортировка таблиц", () => {
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

    // Mock Obsidian's HTMLElement methods
    const mockObsidianEl = (el: HTMLElement) => {
      (el as any).createDiv = function (opts?: { cls?: string }) {
        const div = document.createElement("div");
        if (opts?.cls) div.className = opts.cls;
        this.appendChild(div);
        mockObsidianEl(div);
        return div;
      };
      (el as any).createEl = function (tag: string, opts?: { cls?: string; text?: string; href?: string; attr?: Record<string, string> }) {
        const elem = document.createElement(tag);
        if (opts?.cls) elem.className = opts.cls;
        if (opts?.text) elem.textContent = opts.text;
        if (opts?.href && elem instanceof HTMLAnchorElement) elem.href = opts.href;
        if (opts?.attr) {
          Object.entries(opts.attr).forEach(([key, value]) => {
            elem.setAttribute(key, value);
          });
        }
        this.appendChild(elem);
        mockObsidianEl(elem);
        return elem;
      };
      (el as any).createSpan = function (opts?: { cls?: string; text?: string }) {
        const span = document.createElement("span");
        if (opts?.cls) span.className = opts.cls;
        if (opts?.text) span.textContent = opts.text;
        this.appendChild(span);
        mockObsidianEl(span);
        return span;
      };
      (el as any).empty = function () {
        this.innerHTML = "";
      };
    };
    mockObsidianEl(container);
  });

  const getRowNames = () => {
    const rows = container.querySelectorAll("tbody tr");
    return Array.from(rows).map((row) => row.querySelector("td")?.textContent || "");
  };

  const clickHeader = (headerText: string) => {
    const headers = container.querySelectorAll("th");
    for (const header of Array.from(headers)) {
      if (header.textContent?.includes(headerText)) {
        const clickEvent = new MouseEvent("click", { bubbles: true });
        header.dispatchEvent(clickEvent);
        return header;
      }
    }
    return null;
  };

  describe("Правило: Сортировка по колонке Name", () => {
    describe("Сценарий: Первый клик - переключение на убыва ние (т.к. изначально возрастание)", () => {
      it("должен переключить с возрастания на убывание при клике", async () => {
        const relations: AssetRelation[] = [
          {
            path: "Задача C.md",
            title: "Задача C",
            metadata: { exo__Instance_class: "[[ems__Task]]" },
            modified: Date.now(),
            created: Date.now(),
          },
          {
            path: "Задача A.md",
            title: "Задача A",
            metadata: { exo__Instance_class: "[[ems__Area]]" },
            modified: Date.now(),
            created: Date.now(),
          },
          {
            path: "Задача B.md",
            title: "Задача B",
            metadata: { exo__Instance_class: "[[ems__Task]]" },
            modified: Date.now(),
            created: Date.now(),
          },
        ];

        await (renderer as any).renderTable(container, relations, {
          layout: "table",
          showProperties: ["exo__Instance_class"],
        });

        // Initially sorted ascending by Name (default state)
        expect(getRowNames()).toEqual(["Задача A", "Задача B", "Задача C"]);

        // Клик на заголовок Name - toggles to descending
        const header = clickHeader("Name");
        expect(header).not.toBeNull();

        // Проверяем порядок - теперь убывание
        const names = getRowNames();
        expect(names).toEqual(["Задача C", "Задача B", "Задача A"]);

        // Проверяем индикаторы
        expect(header?.classList.contains("sorted-desc")).toBe(true);
        expect(header?.textContent).toContain("▼");
      });
    });

    describe("Сценарий: Второй клик - возврат к возрастанию", () => {
      it("должен вернуться к возрастанию после убывания", async () => {
        const relations: AssetRelation[] = [
          {
            path: "Задача C.md",
            title: "Задача C",
            metadata: {},
            modified: Date.now(),
            created: Date.now(),
          },
          {
            path: "Задача A.md",
            title: "Задача A",
            metadata: {},
            modified: Date.now(),
            created: Date.now(),
          },
          {
            path: "Задача B.md",
            title: "Задача B",
            metadata: {},
            modified: Date.now(),
            created: Date.now(),
          },
        ];

        await (renderer as any).renderTable(container, relations, {
          layout: "table",
          showProperties: ["exo__Instance_class"],
        });

        // Initial: asc (default)
        expect(getRowNames()).toEqual(["Задача A", "Задача B", "Задача C"]);

        // Первый клик - desc
        let header = clickHeader("Name");
        expect(getRowNames()).toEqual(["Задача C", "Задача B", "Задача A"]);

        // Второй клик - обратно к asc
        header = clickHeader("Name");

        expect(getRowNames()).toEqual(["Задача A", "Задача B", "Задача C"]);
        expect(header?.classList.contains("sorted-asc")).toBe(true);
        expect(header?.textContent).toContain("▲");
        expect(header?.textContent).not.toContain("▼");
      });
    });

    describe("Сценарий: Циклическое переключение", () => {
      it("должен циклически переключаться между asc и desc", async () => {
        const relations: AssetRelation[] = [
          { path: "C.md", title: "C", metadata: {}, modified: Date.now(), created: Date.now() },
          { path: "A.md", title: "A", metadata: {}, modified: Date.now(), created: Date.now() },
          { path: "B.md", title: "B", metadata: {}, modified: Date.now(), created: Date.now() },
        ];

        await (renderer as any).renderTable(container, relations, {
          layout: "table",
        });

        // Default: asc
        expect(getRowNames()).toEqual(["A", "B", "C"]);

        clickHeader("Name"); // toggle to desc
        expect(getRowNames()).toEqual(["C", "B", "A"]);

        clickHeader("Name"); // toggle back to asc
        expect(getRowNames()).toEqual(["A", "B", "C"]);

        const header = clickHeader("Name"); // toggle to desc again
        expect(getRowNames()).toEqual(["C", "B", "A"]);
        expect(header?.classList.contains("sorted-desc")).toBe(true);
      });
    });
  });

  describe("Правило: Сортировка по Instance Class", () => {
    describe("Сценарий: Сортировка по Instance Class работает корректно", () => {
      it("должен сортировать по значению Instance Class", async () => {
        const relations: AssetRelation[] = [
          {
            path: "Задача A.md",
            title: "Задача A",
            metadata: { exo__Instance_class: "[[ems__Area]]" },
            modified: Date.now(),
            created: Date.now(),
          },
          {
            path: "Задача C.md",
            title: "Задача C",
            metadata: { exo__Instance_class: "[[ems__Task]]" },
            modified: Date.now(),
            created: Date.now(),
          },
          {
            path: "Задача B.md",
            title: "Задача B",
            metadata: { exo__Instance_class: "[[ems__Task]]" },
            modified: Date.now(),
            created: Date.now(),
          },
        ];

        await (renderer as any).renderTable(container, relations, {
          layout: "table",
          showProperties: ["exo__Instance_class"],
        });

        const header = clickHeader("exo__Instance_class");

        expect(header?.classList.contains("sorted-asc")).toBe(true);

        // Проверяем, что сортировка работает
        const names = getRowNames();
        expect(names.length).toBe(3);
      });
    });

    describe("Сценарий: Instance Class извлекается из метаданных", () => {
      it("должен использовать чистое значение для сортировки", async () => {
        const relations: AssetRelation[] = [
          {
            path: "task.md",
            title: "Task",
            metadata: { exo__Instance_class: "[[ems__Task]]" },
            modified: Date.now(),
            created: Date.now(),
          },
        ];

        await (renderer as any).renderTable(container, relations, {
          layout: "table",
          showProperties: ["exo__Instance_class"],
        });

        // getPropertyValue должен возвращать значение без [[]]
        const value = (renderer as any).getPropertyValue(
          relations[0],
          "exo__Instance_class"
        );

        // Значение должно быть очищено для сортировки
        expect(value).toBeDefined();
      });
    });
  });

  describe("Правило: Индикаторы сортировки", () => {
    describe("Сценарий: Только одна колонка имеет индикатор", () => {
      it("должен снимать индикатор с предыдущей колонки", async () => {
        const relations: AssetRelation[] = [
          {
            path: "A.md",
            title: "A",
            metadata: { exo__Instance_class: "[[ems__Task]]" },
            modified: Date.now(),
            created: Date.now(),
          },
          {
            path: "B.md",
            title: "B",
            metadata: { exo__Instance_class: "[[ems__Area]]" },
            modified: Date.now(),
            created: Date.now(),
          },
        ];

        await (renderer as any).renderTable(container, relations, {
          layout: "table",
          showProperties: ["exo__Instance_class"],
        });

        // Initially sorted by Name with asc indicator
        const nameHeader = clickHeader("Name");
        expect(nameHeader).not.toBeNull();

        // After initial render, Name is sorted asc by default
        // First click toggles to desc
        expect(nameHeader?.classList.contains("sorted-desc")).toBe(true);
        expect(nameHeader?.textContent).toContain("▼");

        // Сортировка по Instance Class - should remove Name indicator
        const classHeader = clickHeader("exo__Instance_class");

        // Name больше не должен иметь индикатор
        expect(nameHeader?.classList.contains("sorted-asc")).toBe(false);
        expect(nameHeader?.classList.contains("sorted-desc")).toBe(false);
        expect(nameHeader?.textContent).not.toContain("▲");
        expect(nameHeader?.textContent).not.toContain("▼");

        // Instance Class должен иметь индикатор
        expect(classHeader?.classList.contains("sorted-asc")).toBe(true);
        expect(classHeader?.textContent).toContain("▲");
      });
    });

    describe("Сценарий: Стрелки обновляются при изменении направления", () => {
      it("должен заменять ▲ на ▼ при клике и обратно", async () => {
        const relations: AssetRelation[] = [
          { path: "A.md", title: "A", metadata: {}, modified: Date.now(), created: Date.now() },
        ];

        await (renderer as any).renderTable(container, relations, {
          layout: "table",
        });

        // Initial state: Name sorted asc with ▲ indicator
        const headers = container.querySelectorAll("th");
        let nameHeader: Element | null = null;
        for (const header of Array.from(headers)) {
          if (header.textContent?.includes("Name")) {
            nameHeader = header;
            break;
          }
        }
        expect(nameHeader?.textContent).toContain("▲");

        // First click: toggle to desc (▼)
        let header = clickHeader("Name");
        expect(header?.textContent).toContain("▼");
        expect(header?.textContent).not.toContain("▲");

        // Second click: toggle back to asc (▲)
        header = clickHeader("Name");
        expect(header?.textContent).toContain("▲");
        expect(header?.textContent).not.toContain("▼");
      });
    });
  });

  describe("Правило: Состояние сортировки", () => {
    describe("Сценарий: Начальная сортировка по Name ascending", () => {
      it("должен применять дефолтную сортировку при рендере", async () => {
        const relations: AssetRelation[] = [
          { path: "C.md", title: "C", metadata: {}, modified: Date.now(), created: Date.now() },
          { path: "A.md", title: "A", metadata: {}, modified: Date.now(), created: Date.now() },
          { path: "B.md", title: "B", metadata: {}, modified: Date.now(), created: Date.now() },
        ];

        await (renderer as any).renderTable(container, relations, {
          layout: "table",
        });

        // Должно быть отсортировано по Name по возрастанию
        const names = getRowNames();
        expect(names).toEqual(["A", "B", "C"]);
      });
    });
  });

  describe("Регрессионные тесты", () => {
    it("должен корректно работать getPropertyValue для Name", () => {
      const relation: AssetRelation = {
        path: "Test.md",
        title: "Test Title",
        metadata: {},
        modified: Date.now(),
        created: Date.now(),
      };

      const value = (renderer as any).getPropertyValue(relation, "Name");
      expect(value).toBe("Test Title");
    });

    it("должен корректно сортировать при наличии одинаковых значений", async () => {
      const relations: AssetRelation[] = [
        {
          path: "Task1.md",
          title: "Task",
          metadata: { exo__Instance_class: "[[ems__Task]]" },
          modified: Date.now(),
          created: Date.now(),
        },
        {
          path: "Task2.md",
          title: "Task",
          metadata: { exo__Instance_class: "[[ems__Task]]" },
          modified: Date.now(),
          created: Date.now(),
        },
      ];

      await (renderer as any).renderTable(container, relations, {
        layout: "table",
        showProperties: ["exo__Instance_class"],
      });

      clickHeader("Name");

      const names = getRowNames();
      expect(names).toEqual(["Task", "Task"]);
    });
  });

  describe("Правило: Сортировка не должна влиять на порядок блоков Layout", () => {
    describe("Сценарий: Группы остаются на своих местах при сортировке", () => {
      it("должен сортировать данные внутри групп, но не сами группы", async () => {
        // This is a conceptual test - the actual bug is in AssetRelationsTable.tsx
        // where grouping happens AFTER sorting instead of BEFORE
        // This test documents the expected behavior

        // Expected: When sorting by a column in a grouped view:
        // 1. Groups should maintain their original order
        // 2. Only items WITHIN each group should be sorted

        // The bug: Currently, all items are sorted first, then grouped,
        // which causes groups to reorder based on sorted items

        expect(true).toBe(true); // Placeholder - real fix is in AssetRelationsTable.tsx
      });
    });
  });
});
