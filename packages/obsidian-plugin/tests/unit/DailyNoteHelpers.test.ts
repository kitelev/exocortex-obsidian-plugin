import { DailyNoteHelpers } from "../../src/presentation/renderers/helpers/DailyNoteHelpers";
import { MetadataExtractor } from "@exocortex/core";
import { TFile } from "obsidian";

describe("DailyNoteHelpers", () => {
  let mockMetadataExtractor: jest.Mocked<MetadataExtractor>;

  beforeEach(() => {
    mockMetadataExtractor = {
      extractMetadata: jest.fn(),
      extractInstanceClass: jest.fn(),
    } as unknown as jest.Mocked<MetadataExtractor>;
  });

  describe("extractDailyNoteInfo", () => {
    it("should return isDailyNote=false for non-DailyNote file", () => {
      const mockFile = { path: "test.md" } as TFile;
      mockMetadataExtractor.extractMetadata.mockReturnValue({});
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[ems__Task]]",
      );

      const result = DailyNoteHelpers.extractDailyNoteInfo(
        mockFile,
        mockMetadataExtractor,
      );

      expect(result.isDailyNote).toBe(false);
      expect(result.day).toBeNull();
    });

    it("should return isDailyNote=true with day for DailyNote with [[bracket]] format", () => {
      const mockFile = { path: "2025-10-15.md" } as TFile;
      mockMetadataExtractor.extractMetadata.mockReturnValue({
        pn__DailyNote_day: "[[2025-10-15]]",
      });
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[pn__DailyNote]]",
      );

      const result = DailyNoteHelpers.extractDailyNoteInfo(
        mockFile,
        mockMetadataExtractor,
      );

      expect(result.isDailyNote).toBe(true);
      expect(result.day).toBe("2025-10-15");
    });

    it("should return isDailyNote=true with day for DailyNote without brackets", () => {
      const mockFile = { path: "2025-10-15.md" } as TFile;
      mockMetadataExtractor.extractMetadata.mockReturnValue({
        pn__DailyNote_day: "2025-10-15",
      });
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "pn__DailyNote",
      );

      const result = DailyNoteHelpers.extractDailyNoteInfo(
        mockFile,
        mockMetadataExtractor,
      );

      expect(result.isDailyNote).toBe(true);
      expect(result.day).toBe("2025-10-15");
    });

    it("should return isDailyNote=true with day=null when pn__DailyNote_day is missing", () => {
      const mockFile = { path: "daily.md" } as TFile;
      mockMetadataExtractor.extractMetadata.mockReturnValue({});
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[pn__DailyNote]]",
      );

      const result = DailyNoteHelpers.extractDailyNoteInfo(
        mockFile,
        mockMetadataExtractor,
      );

      expect(result.isDailyNote).toBe(true);
      expect(result.day).toBeNull();
    });
  });

  describe("findDailyNoteByDate", () => {
    it("should find DailyNote by date when it exists", () => {
      const mockFile1 = { path: "2025-10-14.md" } as TFile;
      const mockFile2 = { path: "2025-10-15.md" } as TFile;
      const mockFile3 = { path: "2025-10-16.md" } as TFile;

      const mockApp = {
        vault: {
          getMarkdownFiles: jest.fn().mockReturnValue([
            mockFile1,
            mockFile2,
            mockFile3,
          ]),
        },
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce({ pn__DailyNote_day: "[[2025-10-14]]" })
        .mockReturnValueOnce({ pn__DailyNote_day: "[[2025-10-15]]" })
        .mockReturnValueOnce({ pn__DailyNote_day: "[[2025-10-16]]" });

      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[pn__DailyNote]]",
      );

      const result = DailyNoteHelpers.findDailyNoteByDate(
        mockApp,
        mockMetadataExtractor,
        "2025-10-15",
      );

      expect(result).toBe(mockFile2);
    });

    it("should return null when DailyNote for given date does not exist", () => {
      const mockFile1 = { path: "2025-10-14.md" } as TFile;
      const mockFile2 = { path: "2025-10-16.md" } as TFile;

      const mockApp = {
        vault: {
          getMarkdownFiles: jest.fn().mockReturnValue([mockFile1, mockFile2]),
        },
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce({ pn__DailyNote_day: "[[2025-10-14]]" })
        .mockReturnValueOnce({ pn__DailyNote_day: "[[2025-10-16]]" });

      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[pn__DailyNote]]",
      );

      const result = DailyNoteHelpers.findDailyNoteByDate(
        mockApp,
        mockMetadataExtractor,
        "2025-10-15",
      );

      expect(result).toBeNull();
    });

    it("should return null when no markdown files exist", () => {
      const mockApp = {
        vault: {
          getMarkdownFiles: jest.fn().mockReturnValue([]),
        },
      };

      const result = DailyNoteHelpers.findDailyNoteByDate(
        mockApp,
        mockMetadataExtractor,
        "2025-10-15",
      );

      expect(result).toBeNull();
    });

    it("should handle DailyNote with day property without brackets", () => {
      const mockFile1 = { path: "2025-10-15.md" } as TFile;

      const mockApp = {
        vault: {
          getMarkdownFiles: jest.fn().mockReturnValue([mockFile1]),
        },
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue({
        pn__DailyNote_day: "2025-10-15",
      });

      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "pn__DailyNote",
      );

      const result = DailyNoteHelpers.findDailyNoteByDate(
        mockApp,
        mockMetadataExtractor,
        "2025-10-15",
      );

      expect(result).toBe(mockFile1);
    });

    it("should skip non-DailyNote files", () => {
      const mockFile1 = { path: "task.md" } as TFile;
      const mockFile2 = { path: "2025-10-15.md" } as TFile;

      const mockApp = {
        vault: {
          getMarkdownFiles: jest.fn().mockReturnValue([mockFile1, mockFile2]),
        },
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce({ pn__DailyNote_day: undefined })
        .mockReturnValueOnce({ pn__DailyNote_day: "[[2025-10-15]]" });

      mockMetadataExtractor.extractInstanceClass
        .mockReturnValueOnce("[[ems__Task]]")
        .mockReturnValueOnce("[[pn__DailyNote]]");

      const result = DailyNoteHelpers.findDailyNoteByDate(
        mockApp,
        mockMetadataExtractor,
        "2025-10-15",
      );

      expect(result).toBe(mockFile2);
    });

    it("should skip DailyNote files without pn__DailyNote_day property", () => {
      const mockFile1 = { path: "daily-1.md" } as TFile;
      const mockFile2 = { path: "2025-10-15.md" } as TFile;

      const mockApp = {
        vault: {
          getMarkdownFiles: jest.fn().mockReturnValue([mockFile1, mockFile2]),
        },
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce({})
        .mockReturnValueOnce({ pn__DailyNote_day: "[[2025-10-15]]" });

      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[pn__DailyNote]]",
      );

      const result = DailyNoteHelpers.findDailyNoteByDate(
        mockApp,
        mockMetadataExtractor,
        "2025-10-15",
      );

      expect(result).toBe(mockFile2);
    });
  });

  describe("isEffortInDay", () => {
    const day = "2025-11-02";

    it("returns true when startTimestamp is in day", () => {
      const metadata = { ems__Effort_startTimestamp: "2025-11-02T14:30:00" };
      expect(DailyNoteHelpers.isEffortInDay(metadata, day)).toBe(true);
    });

    it("returns true when endTimestamp is in day", () => {
      const metadata = { ems__Effort_endTimestamp: "2025-11-02T17:00:00" };
      expect(DailyNoteHelpers.isEffortInDay(metadata, day)).toBe(true);
    });

    it("returns true when plannedStartTimestamp is in day", () => {
      const metadata = {
        ems__Effort_plannedStartTimestamp: "2025-11-02T09:00:00",
      };
      expect(DailyNoteHelpers.isEffortInDay(metadata, day)).toBe(true);
    });

    it("returns true when plannedEndTimestamp is in day", () => {
      const metadata = {
        ems__Effort_plannedEndTimestamp: "2025-11-02T18:00:00",
      };
      expect(DailyNoteHelpers.isEffortInDay(metadata, day)).toBe(true);
    });

    it("returns false when all timestamps are on different day", () => {
      const metadata = {
        ems__Effort_startTimestamp: "2025-11-03T14:30:00",
        ems__Effort_endTimestamp: "2025-11-03T17:00:00",
      };
      expect(DailyNoteHelpers.isEffortInDay(metadata, day)).toBe(false);
    });

    it("returns true for task spanning midnight (start in day, end next day)", () => {
      const metadata = {
        ems__Effort_startTimestamp: "2025-11-02T23:30:00",
        ems__Effort_endTimestamp: "2025-11-03T01:00:00",
      };
      expect(DailyNoteHelpers.isEffortInDay(metadata, day)).toBe(true);
    });

    it("returns false when no timestamp fields present", () => {
      const metadata = { ems__Effort_status: "Draft" };
      expect(DailyNoteHelpers.isEffortInDay(metadata, day)).toBe(false);
    });

    it("returns false when timestamp format is invalid", () => {
      const metadata = { ems__Effort_startTimestamp: "invalid-date" };
      expect(DailyNoteHelpers.isEffortInDay(metadata, day)).toBe(false);
    });

    it("returns false when day string format is invalid", () => {
      const metadata = { ems__Effort_startTimestamp: "2025-11-02T14:30:00" };
      expect(DailyNoteHelpers.isEffortInDay(metadata, "invalid-day")).toBe(
        false,
      );
    });

    it("returns true when only one of multiple timestamps is in day", () => {
      const metadata = {
        ems__Effort_startTimestamp: "2025-11-03T09:00:00", // Next day
        ems__Effort_plannedStartTimestamp: "2025-11-02T10:00:00", // This day
      };
      expect(DailyNoteHelpers.isEffortInDay(metadata, day)).toBe(true);
    });

    it("handles timestamps at day boundaries (00:00:00 and 23:59:59)", () => {
      const metadataStart = {
        ems__Effort_startTimestamp: "2025-11-02T00:00:00",
      };
      const metadataEnd = { ems__Effort_endTimestamp: "2025-11-02T23:59:59" };

      expect(DailyNoteHelpers.isEffortInDay(metadataStart, day)).toBe(true);
      expect(DailyNoteHelpers.isEffortInDay(metadataEnd, day)).toBe(true);
    });

    it("returns false for timestamp just before day start", () => {
      const metadata = { ems__Effort_endTimestamp: "2025-11-01T23:59:59" };
      expect(DailyNoteHelpers.isEffortInDay(metadata, day)).toBe(false);
    });

    it("returns false for timestamp just after day end", () => {
      const metadata = { ems__Effort_startTimestamp: "2025-11-03T00:00:00" };
      expect(DailyNoteHelpers.isEffortInDay(metadata, day)).toBe(false);
    });
  });
});
