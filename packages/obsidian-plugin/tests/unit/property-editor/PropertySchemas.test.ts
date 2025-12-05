import {
  PROPERTY_SCHEMAS,
  EFFORT_STATUS_VALUES,
  TASK_SIZE_VALUES,
  getPropertySchemaForClass,
  getEditableProperties,
  getPropertyByName,
  getStatusLabel,
  type PropertySchemaDefinition,
} from "../../../src/domain/property-editor/PropertySchemas";

describe("PropertySchemas", () => {
  describe("EFFORT_STATUS_VALUES", () => {
    it("should have 7 status values", () => {
      expect(EFFORT_STATUS_VALUES).toHaveLength(7);
    });

    it("should have all required status values", () => {
      const labels = EFFORT_STATUS_VALUES.map((s) => s.label);
      expect(labels).toContain("Draft");
      expect(labels).toContain("Backlog");
      expect(labels).toContain("Analysis");
      expect(labels).toContain("To Do");
      expect(labels).toContain("Doing");
      expect(labels).toContain("Done");
      expect(labels).toContain("Trashed");
    });

    it("should have wikilink format values", () => {
      for (const status of EFFORT_STATUS_VALUES) {
        expect(status.value).toMatch(/^\[\[ems__EffortStatus\w+\]\]$/);
      }
    });
  });

  describe("TASK_SIZE_VALUES", () => {
    it("should have 6 size values", () => {
      expect(TASK_SIZE_VALUES).toHaveLength(6);
    });

    it("should have all size values in order", () => {
      const labels = TASK_SIZE_VALUES.map((s) => s.label);
      expect(labels).toEqual(["XXS", "XS", "S", "M", "L", "XL"]);
    });

    it("should have wikilink format values", () => {
      for (const size of TASK_SIZE_VALUES) {
        expect(size.value).toMatch(/^\[\[ems__TaskSize_\w+\]\]$/);
      }
    });
  });

  describe("PROPERTY_SCHEMAS", () => {
    it("should have schemas for all expected asset classes", () => {
      const expectedClasses = [
        "ems__Task",
        "ems__Meeting",
        "ems__Project",
        "ems__Initiative",
        "ems__Area",
        "ims__Concept",
      ];

      for (const className of expectedClasses) {
        expect(PROPERTY_SCHEMAS[className]).toBeDefined();
        expect(PROPERTY_SCHEMAS[className].length).toBeGreaterThan(0);
      }
    });

    it("should have common properties in all schemas", () => {
      const commonProperties = [
        "exo__Asset_label",
        "exo__Asset_uid",
        "exo__Asset_createdAt",
        "exo__Asset_isArchived",
      ];

      for (const [, schema] of Object.entries(PROPERTY_SCHEMAS)) {
        for (const propName of commonProperties) {
          const prop = schema.find((p) => p.name === propName);
          expect(prop).toBeDefined();
        }
      }
    });

    it("should have effort properties in effort-based classes", () => {
      const effortClasses = [
        "ems__Task",
        "ems__Meeting",
        "ems__Project",
        "ems__Initiative",
      ];
      const effortProperties = [
        "ems__Effort_status",
        "ems__Effort_area",
        "ems__Effort_parent",
        "ems__Effort_votes",
      ];

      for (const className of effortClasses) {
        const schema = PROPERTY_SCHEMAS[className];
        for (const propName of effortProperties) {
          const prop = schema.find((p) => p.name === propName);
          expect(prop).toBeDefined();
        }
      }
    });

    it("should have task-specific properties only for tasks and meetings", () => {
      const taskClasses = ["ems__Task", "ems__Meeting"];
      const nonTaskClasses = [
        "ems__Project",
        "ems__Initiative",
        "ems__Area",
        "ims__Concept",
      ];

      for (const className of taskClasses) {
        const prop = PROPERTY_SCHEMAS[className].find(
          (p) => p.name === "ems__Task_size",
        );
        expect(prop).toBeDefined();
      }

      for (const className of nonTaskClasses) {
        const prop = PROPERTY_SCHEMAS[className].find(
          (p) => p.name === "ems__Task_size",
        );
        expect(prop).toBeUndefined();
      }
    });

    it("should have area-specific properties only for areas", () => {
      const areaProp = PROPERTY_SCHEMAS["ems__Area"].find(
        (p) => p.name === "ems__Area_parent",
      );
      expect(areaProp).toBeDefined();

      const nonAreaClasses = [
        "ems__Task",
        "ems__Meeting",
        "ems__Project",
        "ims__Concept",
      ];
      for (const className of nonAreaClasses) {
        const prop = PROPERTY_SCHEMAS[className].find(
          (p) => p.name === "ems__Area_parent",
        );
        expect(prop).toBeUndefined();
      }
    });
  });

  describe("getPropertySchemaForClass", () => {
    it("should return schema for known class", () => {
      const schema = getPropertySchemaForClass("ems__Task");
      expect(schema.length).toBeGreaterThan(0);
      expect(schema.some((p) => p.name === "exo__Asset_label")).toBe(true);
      expect(schema.some((p) => p.name === "ems__Effort_status")).toBe(true);
      expect(schema.some((p) => p.name === "ems__Task_size")).toBe(true);
    });

    it("should strip wikilink brackets from class name", () => {
      const schema = getPropertySchemaForClass("[[ems__Task]]");
      expect(schema).toEqual(PROPERTY_SCHEMAS["ems__Task"]);
    });

    it("should return common properties for unknown class", () => {
      const schema = getPropertySchemaForClass("unknown__Class");
      expect(schema.length).toBe(4);
      expect(schema.some((p) => p.name === "exo__Asset_label")).toBe(true);
      expect(schema.some((p) => p.name === "exo__Asset_uid")).toBe(true);
    });

    it("should return schema for Area class", () => {
      const schema = getPropertySchemaForClass("ems__Area");
      expect(schema.some((p) => p.name === "ems__Area_parent")).toBe(true);
      expect(schema.some((p) => p.name === "ems__Effort_status")).toBe(false);
    });

    it("should return schema for Concept class", () => {
      const schema = getPropertySchemaForClass("ims__Concept");
      expect(schema.some((p) => p.name === "exo__Asset_label")).toBe(true);
      expect(schema.some((p) => p.name === "ems__Effort_status")).toBe(false);
    });
  });

  describe("getEditableProperties", () => {
    it("should filter out read-only properties", () => {
      const editable = getEditableProperties("ems__Task");
      const readOnlyProps = editable.filter((p) => p.readOnly === true);
      expect(readOnlyProps).toHaveLength(0);
    });

    it("should not include uid property", () => {
      const editable = getEditableProperties("ems__Task");
      expect(editable.some((p) => p.name === "exo__Asset_uid")).toBe(false);
    });

    it("should not include createdAt property", () => {
      const editable = getEditableProperties("ems__Task");
      expect(editable.some((p) => p.name === "exo__Asset_createdAt")).toBe(
        false,
      );
    });

    it("should not include timestamp properties", () => {
      const editable = getEditableProperties("ems__Task");
      expect(
        editable.some((p) => p.name === "ems__Effort_startTimestamp"),
      ).toBe(false);
      expect(editable.some((p) => p.name === "ems__Effort_endTimestamp")).toBe(
        false,
      );
    });

    it("should include editable properties", () => {
      const editable = getEditableProperties("ems__Task");
      expect(editable.some((p) => p.name === "exo__Asset_label")).toBe(true);
      expect(editable.some((p) => p.name === "ems__Effort_status")).toBe(true);
      expect(editable.some((p) => p.name === "exo__Asset_isArchived")).toBe(
        true,
      );
    });

    it("should work with wikilink-formatted class names", () => {
      const editable = getEditableProperties("[[ems__Task]]");
      expect(editable.some((p) => p.name === "exo__Asset_label")).toBe(true);
    });
  });

  describe("getPropertyByName", () => {
    it("should find property by name", () => {
      const prop = getPropertyByName("ems__Task", "exo__Asset_label");
      expect(prop).toBeDefined();
      expect(prop?.label).toBe("Label");
      expect(prop?.type).toBe("text");
      expect(prop?.required).toBe(true);
    });

    it("should return undefined for non-existent property", () => {
      const prop = getPropertyByName("ems__Task", "non_existent_property");
      expect(prop).toBeUndefined();
    });

    it("should find effort status property", () => {
      const prop = getPropertyByName("ems__Task", "ems__Effort_status");
      expect(prop).toBeDefined();
      expect(prop?.type).toBe("status-select");
    });

    it("should find task size property", () => {
      const prop = getPropertyByName("ems__Task", "ems__Task_size");
      expect(prop).toBeDefined();
      expect(prop?.type).toBe("size-select");
    });

    it("should not find task-specific property in area class", () => {
      const prop = getPropertyByName("ems__Area", "ems__Task_size");
      expect(prop).toBeUndefined();
    });

    it("should work with wikilink-formatted class names", () => {
      const prop = getPropertyByName("[[ems__Task]]", "exo__Asset_label");
      expect(prop).toBeDefined();
    });
  });

  describe("property schema structure", () => {
    it("should have valid field types", () => {
      const validTypes = [
        "text",
        "status-select",
        "size-select",
        "wikilink",
        "number",
        "boolean",
        "timestamp",
      ];

      for (const [, schema] of Object.entries(PROPERTY_SCHEMAS)) {
        for (const prop of schema) {
          expect(validTypes).toContain(prop.type);
        }
      }
    });

    it("should have labels for all properties", () => {
      for (const [, schema] of Object.entries(PROPERTY_SCHEMAS)) {
        for (const prop of schema) {
          expect(prop.label).toBeDefined();
          expect(prop.label.length).toBeGreaterThan(0);
        }
      }
    });

    it("should have filters for wikilink properties", () => {
      for (const [, schema] of Object.entries(PROPERTY_SCHEMAS)) {
        const wikilinks = schema.filter((p) => p.type === "wikilink");
        for (const prop of wikilinks) {
          expect(prop.filter).toBeDefined();
          expect(prop.filter?.length).toBeGreaterThan(0);
        }
      }
    });

    it("should have min value for number properties where appropriate", () => {
      const votesProperty = getPropertyByName("ems__Task", "ems__Effort_votes");
      expect(votesProperty?.type).toBe("number");
      expect(votesProperty?.min).toBe(0);
    });
  });

  describe("getStatusLabel", () => {
    it("should return human-readable label for raw URI", () => {
      expect(getStatusLabel("ems__EffortStatusDoing")).toBe("Doing");
      expect(getStatusLabel("ems__EffortStatusDone")).toBe("Done");
      expect(getStatusLabel("ems__EffortStatusTrashed")).toBe("Trashed");
      expect(getStatusLabel("ems__EffortStatusDraft")).toBe("Draft");
      expect(getStatusLabel("ems__EffortStatusBacklog")).toBe("Backlog");
      expect(getStatusLabel("ems__EffortStatusAnalysis")).toBe("Analysis");
      expect(getStatusLabel("ems__EffortStatusToDo")).toBe("To Do");
    });

    it("should return human-readable label for wiki-link wrapped URI", () => {
      expect(getStatusLabel("[[ems__EffortStatusDoing]]")).toBe("Doing");
      expect(getStatusLabel("[[ems__EffortStatusDone]]")).toBe("Done");
      expect(getStatusLabel("[[ems__EffortStatusToDo]]")).toBe("To Do");
    });

    it("should return the label as-is if already human-readable", () => {
      expect(getStatusLabel("Doing")).toBe("Doing");
      expect(getStatusLabel("Done")).toBe("Done");
      expect(getStatusLabel("To Do")).toBe("To Do");
    });

    it("should handle case-insensitive label matching", () => {
      expect(getStatusLabel("doing")).toBe("Doing");
      expect(getStatusLabel("DONE")).toBe("Done");
      expect(getStatusLabel("to do")).toBe("To Do");
    });

    it("should return dash for null or undefined", () => {
      expect(getStatusLabel(null)).toBe("-");
      expect(getStatusLabel(undefined)).toBe("-");
    });

    it("should return dash for empty string", () => {
      expect(getStatusLabel("")).toBe("-");
    });

    it("should return original value for unknown status", () => {
      expect(getStatusLabel("unknown_status")).toBe("unknown_status");
      expect(getStatusLabel("CustomStatus")).toBe("CustomStatus");
    });
  });
});
