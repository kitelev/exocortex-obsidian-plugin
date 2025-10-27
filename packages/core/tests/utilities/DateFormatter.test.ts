import { DateFormatter } from "../../src/utilities/DateFormatter";

describe("DateFormatter", () => {
  describe("toLocalTimestamp", () => {
    it("should format date to local timestamp", () => {
      const date = new Date(2025, 9, 24, 14, 30, 45); // Month is 0-based
      const result = DateFormatter.toLocalTimestamp(date);

      expect(result).toBe("2025-10-24T14:30:45");
    });

    it("should pad single digits with zeros", () => {
      const date = new Date(2025, 0, 5, 3, 7, 9); // Jan 5, 3:07:09
      const result = DateFormatter.toLocalTimestamp(date);

      expect(result).toBe("2025-01-05T03:07:09");
    });

    it("should handle midnight", () => {
      const date = new Date(2025, 11, 31, 0, 0, 0);
      const result = DateFormatter.toLocalTimestamp(date);

      expect(result).toBe("2025-12-31T00:00:00");
    });

    it("should handle noon", () => {
      const date = new Date(2025, 5, 15, 12, 0, 0);
      const result = DateFormatter.toLocalTimestamp(date);

      expect(result).toBe("2025-06-15T12:00:00");
    });

    it("should handle end of day", () => {
      const date = new Date(2025, 11, 31, 23, 59, 59);
      const result = DateFormatter.toLocalTimestamp(date);

      expect(result).toBe("2025-12-31T23:59:59");
    });

    it("should handle leap year date", () => {
      const date = new Date(2024, 1, 29, 10, 15, 30); // Feb 29, 2024
      const result = DateFormatter.toLocalTimestamp(date);

      expect(result).toBe("2024-02-29T10:15:30");
    });
  });

  describe("toDateWikilink", () => {
    it("should format date to quoted wikilink", () => {
      const date = new Date(2025, 9, 24, 14, 30, 45);
      const result = DateFormatter.toDateWikilink(date);

      expect(result).toBe('"[[2025-10-24]]"');
    });

    it("should pad single digit months and days", () => {
      const date = new Date(2025, 0, 5); // Jan 5
      const result = DateFormatter.toDateWikilink(date);

      expect(result).toBe('"[[2025-01-05]]"');
    });

    it("should ignore time portion", () => {
      const date1 = new Date(2025, 9, 24, 0, 0, 0);
      const date2 = new Date(2025, 9, 24, 23, 59, 59);

      expect(DateFormatter.toDateWikilink(date1)).toBe('"[[2025-10-24]]"');
      expect(DateFormatter.toDateWikilink(date2)).toBe('"[[2025-10-24]]"');
    });

    it("should handle different years", () => {
      const date1 = new Date(1999, 11, 31);
      const date2 = new Date(2000, 0, 1);
      const date3 = new Date(2100, 0, 1);

      expect(DateFormatter.toDateWikilink(date1)).toBe('"[[1999-12-31]]"');
      expect(DateFormatter.toDateWikilink(date2)).toBe('"[[2000-01-01]]"');
      expect(DateFormatter.toDateWikilink(date3)).toBe('"[[2100-01-01]]"');
    });
  });

  describe("getTodayWikilink", () => {
    it("should return today's date as wikilink", () => {
      const today = new Date();
      const expected = DateFormatter.toDateWikilink(today);
      const result = DateFormatter.getTodayWikilink();

      expect(result).toBe(expected);
    });

    it("should return correct format", () => {
      const result = DateFormatter.getTodayWikilink();

      // Check format: "[[YYYY-MM-DD]]"
      expect(result).toMatch(/^"\[\[\d{4}-\d{2}-\d{2}\]\]"$/);
    });
  });

  describe("toDateString", () => {
    it("should format date to simple string", () => {
      const date = new Date(2025, 9, 24, 14, 30, 45);
      const result = DateFormatter.toDateString(date);

      expect(result).toBe("2025-10-24");
    });

    it("should pad single digits", () => {
      const date = new Date(2025, 0, 5);
      const result = DateFormatter.toDateString(date);

      expect(result).toBe("2025-01-05");
    });

    it("should ignore time portion", () => {
      const date = new Date(2025, 9, 24, 23, 59, 59);
      const result = DateFormatter.toDateString(date);

      expect(result).toBe("2025-10-24");
    });

    it("should handle leap year", () => {
      const date = new Date(2024, 1, 29);
      const result = DateFormatter.toDateString(date);

      expect(result).toBe("2024-02-29");
    });
  });

  describe("parseWikilink", () => {
    it("should parse quoted wikilink", () => {
      const result = DateFormatter.parseWikilink('"[[2025-10-24]]"');

      expect(result).toBe("2025-10-24");
    });

    it("should parse unquoted wikilink", () => {
      const result = DateFormatter.parseWikilink("[[2025-10-24]]");

      expect(result).toBe("2025-10-24");
    });

    it("should parse single-quoted wikilink", () => {
      const result = DateFormatter.parseWikilink("'[[2025-10-24]]'");

      expect(result).toBe("2025-10-24");
    });

    it("should return null for invalid format", () => {
      expect(DateFormatter.parseWikilink("2025-10-24")).toBe(null);
      expect(DateFormatter.parseWikilink("[2025-10-24]")).toBe(null);
      expect(DateFormatter.parseWikilink("[[invalid]]")).toBe(null);
      expect(DateFormatter.parseWikilink("")).toBe(null);
    });

    it("should handle dates with different formats", () => {
      expect(DateFormatter.parseWikilink("[[2025-01-05]]")).toBe("2025-01-05");
      expect(DateFormatter.parseWikilink("[[1999-12-31]]")).toBe("1999-12-31");
      expect(DateFormatter.parseWikilink("[[2100-01-01]]")).toBe("2100-01-01");
    });

    it("should not parse malformed dates", () => {
      expect(DateFormatter.parseWikilink("[[2025-1-5]]")).toBe(null);
      expect(DateFormatter.parseWikilink("[[25-10-24]]")).toBe(null);
      expect(DateFormatter.parseWikilink("[[2025/10/24]]")).toBe(null);
    });

    it("should handle extra spaces", () => {
      const result = DateFormatter.parseWikilink('"[[2025-10-24]]"');

      expect(result).toBe("2025-10-24");
    });
  });

  describe("addDays", () => {
    it("should add positive days", () => {
      const date = new Date(2025, 9, 24);
      const result = DateFormatter.addDays(date, 5);

      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(9); // October
      expect(result.getDate()).toBe(29);
    });

    it("should subtract with negative days", () => {
      const date = new Date(2025, 9, 24);
      const result = DateFormatter.addDays(date, -5);

      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(9); // October
      expect(result.getDate()).toBe(19);
    });

    it("should handle month boundaries", () => {
      const date = new Date(2025, 9, 31); // Oct 31
      const result = DateFormatter.addDays(date, 1);

      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(10); // November
      expect(result.getDate()).toBe(1);
    });

    it("should handle year boundaries", () => {
      const date = new Date(2025, 11, 31); // Dec 31
      const result = DateFormatter.addDays(date, 1);

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(1);
    });

    it("should handle leap year", () => {
      const date = new Date(2024, 1, 28); // Feb 28, 2024
      const result = DateFormatter.addDays(date, 1);

      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(29);
    });

    it("should handle zero days", () => {
      const date = new Date(2025, 9, 24, 14, 30, 45);
      const result = DateFormatter.addDays(date, 0);

      expect(result).not.toBe(date); // Different object
      expect(result.getTime()).toBe(date.getTime()); // Same time value
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(9);
      expect(result.getDate()).toBe(24);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(45);
    });

    it("should not modify original date", () => {
      const date = new Date(2025, 9, 24);
      const originalTime = date.getTime();
      DateFormatter.addDays(date, 5);

      expect(date.getTime()).toBe(originalTime);
    });
  });

  describe("isSameDay", () => {
    it("should return true for same day different times", () => {
      const date1 = new Date(2025, 9, 24, 8, 0, 0);
      const date2 = new Date(2025, 9, 24, 20, 30, 45);

      expect(DateFormatter.isSameDay(date1, date2)).toBe(true);
    });

    it("should return true for same day midnight", () => {
      const date1 = new Date(2025, 9, 24, 0, 0, 0);
      const date2 = new Date(2025, 9, 24, 23, 59, 59);

      expect(DateFormatter.isSameDay(date1, date2)).toBe(true);
    });

    it("should return false for different days", () => {
      const date1 = new Date(2025, 9, 24);
      const date2 = new Date(2025, 9, 25);

      expect(DateFormatter.isSameDay(date1, date2)).toBe(false);
    });

    it("should return false for different months", () => {
      const date1 = new Date(2025, 9, 24);
      const date2 = new Date(2025, 10, 24);

      expect(DateFormatter.isSameDay(date1, date2)).toBe(false);
    });

    it("should return false for different years", () => {
      const date1 = new Date(2025, 9, 24);
      const date2 = new Date(2024, 9, 24);

      expect(DateFormatter.isSameDay(date1, date2)).toBe(false);
    });

    it("should handle same date objects", () => {
      const date = new Date(2025, 9, 24);

      expect(DateFormatter.isSameDay(date, date)).toBe(true);
    });

    it("should handle dates around midnight", () => {
      const date1 = new Date(2025, 9, 24, 23, 59, 59);
      const date2 = new Date(2025, 9, 25, 0, 0, 0);

      expect(DateFormatter.isSameDay(date1, date2)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle dates before 1900", () => {
      const date = new Date(1800, 0, 1);
      const timestamp = DateFormatter.toLocalTimestamp(date);
      const wikilink = DateFormatter.toDateWikilink(date);
      const dateString = DateFormatter.toDateString(date);

      expect(timestamp).toBe("1800-01-01T00:00:00");
      expect(wikilink).toBe('"[[1800-01-01]]"');
      expect(dateString).toBe("1800-01-01");
    });

    it("should handle dates after 2100", () => {
      const date = new Date(2150, 11, 31);
      const timestamp = DateFormatter.toLocalTimestamp(date);
      const wikilink = DateFormatter.toDateWikilink(date);
      const dateString = DateFormatter.toDateString(date);

      expect(timestamp).toBe("2150-12-31T00:00:00");
      expect(wikilink).toBe('"[[2150-12-31]]"');
      expect(dateString).toBe("2150-12-31");
    });

    it("should handle daylight saving time transitions", () => {
      // This test depends on the system's timezone settings
      // Using a date that's likely in DST for many timezones
      const date = new Date(2025, 6, 15); // July 15
      const dateString = DateFormatter.toDateString(date);

      expect(dateString).toBe("2025-07-15");
    });

    it("should preserve milliseconds in addDays", () => {
      const date = new Date(2025, 9, 24, 14, 30, 45, 123);
      const result = DateFormatter.addDays(date, 1);

      expect(result.getMilliseconds()).toBe(123);
    });
  });
});