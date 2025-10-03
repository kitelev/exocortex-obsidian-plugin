/**
 * BDD Tests for Instance Class Links
 * Based on: specs/features/layout/instance-class-links.feature
 *
 * CRITICAL REQUIREMENT:
 * Instance Class column MUST display clickable links, not plain text with [[]]
 */

import { UniversalLayoutRenderer } from "../../src/presentation/renderers/UniversalLayoutRenderer";
import { AssetRelation } from "../../src/domain/entities/Asset";

describe("Feature: Кликабельные ссылки в колонке Instance Class", () => {
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
        getAbstractFileByPath: jest.fn().mockReturnValue({
          path: "ems__Task.md",
          name: "ems__Task",
        }),
      },
    };

    renderer = new UniversalLayoutRenderer(mockApp);
    container = document.createElement("div");
  });

  describe("Правило: Instance Class всегда отображается как internal-link", () => {
    describe("Сценарий: Простое значение Instance Class", () => {
      it("ДОЛЖЕН создавать элемент <a> с классом internal-link", async () => {
        // Дано: существует заметка с Instance Class
        const relations: AssetRelation[] = [
          {
            path: "Задача.md",
            title: "Задача",
            metadata: {
              exo__Instance_class: "[[ems__Task]]",
            },
            modified: Date.now(),
            created: Date.now(),
            propertyName: "exo__Parent",
          },
        ];

        // Когда: рендерим таблицу
        await (renderer as any).renderTable(container, relations, {
          layout: "table",
          showProperties: ["exo__Instance_class"],
        });

        // Тогда: в колонке Instance Class есть ссылка
        const cells = container.querySelectorAll("tbody td:nth-child(2)");
        expect(cells.length).toBeGreaterThan(0);

        const cell = cells[0];
        const link = cell.querySelector("a");

        // Проверяем требования из спецификации
        expect(link).not.toBeNull();
        expect(link?.tagName.toLowerCase()).toBe("a");
        expect(link?.textContent).toBe("ems__Task");
        expect(link?.classList.contains("internal-link")).toBe(true);
        expect(link?.getAttribute("href")).toBe("ems__Task");

        // НЕ должно быть символов [[ или ]]
        expect(cell.textContent).not.toContain("[[");
        expect(cell.textContent).not.toContain("]]");
      });

      it("НЕ ДОЛЖЕН отображать [[ems__Task]] как простой текст", async () => {
        const relations: AssetRelation[] = [
          {
            path: "Задача.md",
            title: "Задача",
            metadata: { exo__Instance_class: "[[ems__Task]]" },
            modified: Date.now(),
            created: Date.now(),
          },
        ];

        await (renderer as any).renderTable(container, relations, {
          layout: "table",
          showProperties: ["exo__Instance_class"],
        });

        const cell = container.querySelector("tbody td:nth-child(2)");

        // КРИТИЧЕСКОЕ требование: НЕ должно быть [[ems__Task]]
        expect(cell?.textContent).not.toContain("[[ems__Task]]");
        expect(cell?.textContent).not.toContain("[[");
        expect(cell?.textContent).not.toContain("]]");
      });
    });

    describe("Сценарий: Массив значений Instance Class", () => {
      it("должен отображать первое значение как ссылку", async () => {
        const relations: AssetRelation[] = [
          {
            path: "Гибрид.md",
            title: "Гибридный объект",
            metadata: {
              exo__Instance_class: ["[[ems__Task]]", "[[ems__Document]]"],
            },
            modified: Date.now(),
            created: Date.now(),
          },
        ];

        await (renderer as any).renderTable(container, relations, {
          layout: "table",
          showProperties: ["exo__Instance_class"],
        });

        const link = container.querySelector("tbody td:nth-child(2) a");

        expect(link).not.toBeNull();
        expect(link?.textContent).toContain("ems__Task");
        expect(link?.classList.contains("internal-link")).toBe(true);
      });
    });

    describe("Сценарий: Клик на Instance Class ссылку", () => {
      it("должен открывать файл класса при клике", async () => {
        const relations: AssetRelation[] = [
          {
            path: "Задача 1.md",
            title: "Задача 1",
            metadata: { exo__Instance_class: "[[ems__Task]]" },
            modified: Date.now(),
            created: Date.now(),
          },
        ];

        await (renderer as any).renderTable(container, relations, {
          layout: "table",
          showProperties: ["exo__Instance_class"],
        });

        const link = container.querySelector("tbody td:nth-child(2) a");
        expect(link).not.toBeNull();

        // Симулируем клик
        const clickEvent = new MouseEvent("click", { bubbles: true });
        link?.dispatchEvent(clickEvent);

        // Должен вызвать openLinkText
        expect(mockApp.workspace.openLinkText).toHaveBeenCalledWith(
          expect.stringContaining("ems__Task"),
          expect.any(String),
          expect.any(Boolean)
        );
      });
    });

    describe("Сценарий: Отсутствующий Instance Class", () => {
      it('должен отображать "-" без ссылки', async () => {
        const relations: AssetRelation[] = [
          {
            path: "Без класса.md",
            title: "Без Класса",
            metadata: {},
            modified: Date.now(),
            created: Date.now(),
          },
        ];

        await (renderer as any).renderTable(container, relations, {
          layout: "table",
          showProperties: ["exo__Instance_class"],
        });

        const cell = container.querySelector("tbody td:nth-child(2)");

        expect(cell?.textContent).toContain("-");
        expect(cell?.querySelector("a")).toBeNull();
      });
    });

    describe("Сценарий: Instance Class с префиксом", () => {
      it("должен сохранять полное имя с префиксом в ссылке", async () => {
        const relations: AssetRelation[] = [
          {
            path: "Проект.md",
            title: "Проект EMS",
            metadata: { exo__Instance_class: "[[ems__Project]]" },
            modified: Date.now(),
            created: Date.now(),
          },
        ];

        await (renderer as any).renderTable(container, relations, {
          layout: "table",
          showProperties: ["exo__Instance_class"],
        });

        const link = container.querySelector("tbody td:nth-child(2) a");

        expect(link?.textContent).toBe("ems__Project");
        expect(link?.textContent).toContain("ems__");
      });
    });
  });

  describe("Правило: Форматирование Instance Class", () => {
    describe("Сценарий: Удаление wiki-link синтаксиса", () => {
      it.each([
        ["[[ems__Task]]", "ems__Task"],
        ["[[ems__Project]]", "ems__Project"],
        ["[[ems__Area]]", "ems__Area"],
      ])("должен преобразовать %s в %s", async (input, expected) => {
        const relations: AssetRelation[] = [
          {
            path: "test.md",
            title: "Test",
            metadata: { exo__Instance_class: input },
            modified: Date.now(),
            created: Date.now(),
          },
        ];

        await (renderer as any).renderTable(container, relations, {
          layout: "table",
          showProperties: ["exo__Instance_class"],
        });

        const link = container.querySelector("tbody td:nth-child(2) a");

        expect(link?.textContent).toBe(expected);
        expect(link?.textContent).not.toContain("[[");
        expect(link?.textContent).not.toContain("]]");
      });
    });

    describe("Сценарий: Обработка пустых значений", () => {
      it.each([
        [null, "-"],
        [undefined, "-"],
        ["", "-"],
        [[], "-"],
      ])('должен отобразить "%s" как "-"', async (value, expected) => {
        const relations: AssetRelation[] = [
          {
            path: "test.md",
            title: "Test",
            metadata: { exo__Instance_class: value as any },
            modified: Date.now(),
            created: Date.now(),
          },
        ];

        await (renderer as any).renderTable(container, relations, {
          layout: "table",
          showProperties: ["exo__Instance_class"],
        });

        const cell = container.querySelector("tbody td:nth-child(2)");

        expect(cell?.textContent).toBe(expected);
        expect(cell?.querySelector("a")).toBeNull();
      });
    });
  });

  describe("Регрессионный тест: Текущее поведение vs Требуемое", () => {
    it("FAILS: Текущая реализация показывает [[ems__Task]] вместо ссылки", async () => {
      const relations: AssetRelation[] = [
        {
          path: "Задача.md",
          title: "Задача",
          metadata: { exo__Instance_class: "[[ems__Task]]" },
          modified: Date.now(),
          created: Date.now(),
        },
      ];

      await (renderer as any).renderTable(container, relations, {
        layout: "table",
        showProperties: ["exo__Instance_class"],
      });

      const cell = container.querySelector("tbody td:nth-child(2)");

      // Этот тест должен упасть, показывая gap в реализации
      try {
        expect(cell?.querySelector("a")).not.toBeNull();
        expect(cell?.textContent).not.toContain("[[");
        expect(cell?.textContent).not.toContain("]]");
      } catch (error) {
        console.error("❌ КРИТИЧЕСКИЙ GAP: Instance Class не является ссылкой!");
        console.error("   Текущее: ", cell?.innerHTML);
        console.error(
          '   Требуется: <a class="internal-link" href="ems__Task">ems__Task</a>'
        );
        throw error;
      }
    });
  });
});
