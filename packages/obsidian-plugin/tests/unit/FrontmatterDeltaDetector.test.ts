import { FrontmatterDeltaDetector } from "../../src/application/services/FrontmatterDeltaDetector";

describe("FrontmatterDeltaDetector", () => {
  let detector: FrontmatterDeltaDetector;

  beforeEach(() => {
    detector = new FrontmatterDeltaDetector();
  });

  describe("detectChanges", () => {
    it("should detect added properties", () => {
      const oldMetadata = {
        exo__Asset_label: "Test",
      };

      const newMetadata = {
        exo__Asset_label: "Test",
        ems__Effort_votes: 5,
      };

      const delta = detector.detectChanges(oldMetadata, newMetadata);

      expect(delta.added).toEqual(["ems__Effort_votes"]);
      expect(delta.removed).toEqual([]);
      expect(delta.modified).toEqual([]);
    });

    it("should detect removed properties", () => {
      const oldMetadata = {
        exo__Asset_label: "Test",
        ems__Effort_votes: 5,
      };

      const newMetadata = {
        exo__Asset_label: "Test",
      };

      const delta = detector.detectChanges(oldMetadata, newMetadata);

      expect(delta.added).toEqual([]);
      expect(delta.removed).toEqual(["ems__Effort_votes"]);
      expect(delta.modified).toEqual([]);
    });

    it("should detect modified properties (string)", () => {
      const oldMetadata = {
        exo__Asset_label: "Old Label",
      };

      const newMetadata = {
        exo__Asset_label: "New Label",
      };

      const delta = detector.detectChanges(oldMetadata, newMetadata);

      expect(delta.added).toEqual([]);
      expect(delta.removed).toEqual([]);
      expect(delta.modified).toEqual(["exo__Asset_label"]);
    });

    it("should detect modified properties (number)", () => {
      const oldMetadata = {
        ems__Effort_votes: 3,
      };

      const newMetadata = {
        ems__Effort_votes: 5,
      };

      const delta = detector.detectChanges(oldMetadata, newMetadata);

      expect(delta.added).toEqual([]);
      expect(delta.removed).toEqual([]);
      expect(delta.modified).toEqual(["ems__Effort_votes"]);
    });

    it("should detect modified properties (boolean)", () => {
      const oldMetadata = {
        exo__Asset_isArchived: false,
      };

      const newMetadata = {
        exo__Asset_isArchived: true,
      };

      const delta = detector.detectChanges(oldMetadata, newMetadata);

      expect(delta.added).toEqual([]);
      expect(delta.removed).toEqual([]);
      expect(delta.modified).toEqual(["exo__Asset_isArchived"]);
    });

    it("should detect modified arrays (content change)", () => {
      const oldMetadata = {
        aliases: ["Old Alias"],
      };

      const newMetadata = {
        aliases: ["New Alias"],
      };

      const delta = detector.detectChanges(oldMetadata, newMetadata);

      expect(delta.added).toEqual([]);
      expect(delta.removed).toEqual([]);
      expect(delta.modified).toEqual(["aliases"]);
    });

    it("should detect modified arrays (order change)", () => {
      const oldMetadata = {
        aliases: ["Alias A", "Alias B"],
      };

      const newMetadata = {
        aliases: ["Alias B", "Alias A"],
      };

      const delta = detector.detectChanges(oldMetadata, newMetadata);

      expect(delta.added).toEqual([]);
      expect(delta.removed).toEqual([]);
      expect(delta.modified).toEqual(["aliases"]);
    });

    it("should detect modified arrays (length change)", () => {
      const oldMetadata = {
        aliases: ["Alias A"],
      };

      const newMetadata = {
        aliases: ["Alias A", "Alias B"],
      };

      const delta = detector.detectChanges(oldMetadata, newMetadata);

      expect(delta.added).toEqual([]);
      expect(delta.removed).toEqual([]);
      expect(delta.modified).toEqual(["aliases"]);
    });

    it("should detect modified objects (deep equality)", () => {
      const oldMetadata = {
        customObject: { key: "value1" },
      };

      const newMetadata = {
        customObject: { key: "value2" },
      };

      const delta = detector.detectChanges(oldMetadata, newMetadata);

      expect(delta.added).toEqual([]);
      expect(delta.removed).toEqual([]);
      expect(delta.modified).toEqual(["customObject"]);
    });

    it("should not detect changes when properties are identical", () => {
      const oldMetadata = {
        exo__Asset_label: "Test",
        ems__Effort_votes: 5,
        aliases: ["Alias A", "Alias B"],
      };

      const newMetadata = {
        exo__Asset_label: "Test",
        ems__Effort_votes: 5,
        aliases: ["Alias A", "Alias B"],
      };

      const delta = detector.detectChanges(oldMetadata, newMetadata);

      expect(delta.added).toEqual([]);
      expect(delta.removed).toEqual([]);
      expect(delta.modified).toEqual([]);
    });

    it("should handle null values (added)", () => {
      const oldMetadata = {};

      const newMetadata = {
        ems__Effort_votes: null,
      };

      const delta = detector.detectChanges(oldMetadata, newMetadata);

      expect(delta.added).toEqual(["ems__Effort_votes"]);
      expect(delta.removed).toEqual([]);
      expect(delta.modified).toEqual([]);
    });

    it("should handle null values (removed)", () => {
      const oldMetadata = {
        ems__Effort_votes: null,
      };

      const newMetadata = {};

      const delta = detector.detectChanges(oldMetadata, newMetadata);

      expect(delta.added).toEqual([]);
      expect(delta.removed).toEqual(["ems__Effort_votes"]);
      expect(delta.modified).toEqual([]);
    });

    it("should handle null to value change", () => {
      const oldMetadata = {
        ems__Effort_votes: null,
      };

      const newMetadata = {
        ems__Effort_votes: 5,
      };

      const delta = detector.detectChanges(oldMetadata, newMetadata);

      expect(delta.added).toEqual([]);
      expect(delta.removed).toEqual([]);
      expect(delta.modified).toEqual(["ems__Effort_votes"]);
    });

    it("should handle undefined values (added)", () => {
      const oldMetadata = {};

      const newMetadata = {
        ems__Effort_votes: undefined,
      };

      const delta = detector.detectChanges(oldMetadata, newMetadata);

      expect(delta.added).toEqual(["ems__Effort_votes"]);
      expect(delta.removed).toEqual([]);
      expect(delta.modified).toEqual([]);
    });

    it("should handle empty metadata", () => {
      const delta = detector.detectChanges({}, {});

      expect(delta.added).toEqual([]);
      expect(delta.removed).toEqual([]);
      expect(delta.modified).toEqual([]);
    });

    it("should handle multiple changes simultaneously", () => {
      const oldMetadata = {
        exo__Asset_label: "Old Label",
        ems__Effort_votes: 3,
        ems__Effort_status: "Draft",
      };

      const newMetadata = {
        exo__Asset_label: "New Label",
        ems__Effort_status: "Draft",
        ems__Effort_day: "2025-11-12",
      };

      const delta = detector.detectChanges(oldMetadata, newMetadata);

      expect(delta.added).toContain("ems__Effort_day");
      expect(delta.removed).toContain("ems__Effort_votes");
      expect(delta.modified).toContain("exo__Asset_label");
      expect(delta.added).toHaveLength(1);
      expect(delta.removed).toHaveLength(1);
      expect(delta.modified).toHaveLength(1);
    });
  });

  describe("getAllChangedProperties", () => {
    it("should return union of added, removed, and modified properties", () => {
      const delta = {
        added: ["prop1", "prop2"],
        removed: ["prop3"],
        modified: ["prop4", "prop5"],
      };

      const allChanged = detector.getAllChangedProperties(delta);

      expect(allChanged).toContain("prop1");
      expect(allChanged).toContain("prop2");
      expect(allChanged).toContain("prop3");
      expect(allChanged).toContain("prop4");
      expect(allChanged).toContain("prop5");
      expect(allChanged).toHaveLength(5);
    });

    it("should return empty array when no changes", () => {
      const delta = {
        added: [],
        removed: [],
        modified: [],
      };

      const allChanged = detector.getAllChangedProperties(delta);

      expect(allChanged).toEqual([]);
    });

    it("should return only added properties when no removed or modified", () => {
      const delta = {
        added: ["prop1", "prop2"],
        removed: [],
        modified: [],
      };

      const allChanged = detector.getAllChangedProperties(delta);

      expect(allChanged).toEqual(["prop1", "prop2"]);
    });

    it("should return only removed properties when no added or modified", () => {
      const delta = {
        added: [],
        removed: ["prop1", "prop2"],
        modified: [],
      };

      const allChanged = detector.getAllChangedProperties(delta);

      expect(allChanged).toEqual(["prop1", "prop2"]);
    });

    it("should return only modified properties when no added or removed", () => {
      const delta = {
        added: [],
        removed: [],
        modified: ["prop1", "prop2"],
      };

      const allChanged = detector.getAllChangedProperties(delta);

      expect(allChanged).toEqual(["prop1", "prop2"]);
    });
  });
});
