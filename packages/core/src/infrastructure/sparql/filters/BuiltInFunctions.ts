import type { Subject, Predicate, Object as RDFObject } from "../../../domain/models/rdf/Triple";
import { IRI } from "../../../domain/models/rdf/IRI";
import { Literal } from "../../../domain/models/rdf/Literal";
import { BlankNode } from "../../../domain/models/rdf/BlankNode";

export type RDFTerm = Subject | Predicate | RDFObject;

export class BuiltInFunctions {
  static str(term: RDFTerm | undefined): string {
    if (term === undefined) {
      throw new Error("STR: argument is undefined");
    }

    if (term instanceof IRI) {
      return term.value;
    }

    if (term instanceof Literal) {
      return term.value;
    }

    if (term instanceof BlankNode) {
      return term.id;
    }

    return String(term);
  }

  static lang(term: RDFTerm | undefined): string {
    if (term === undefined) {
      throw new Error("LANG: argument is undefined");
    }

    if (term instanceof Literal && term.language) {
      return term.language;
    }

    return "";
  }

  static datatype(term: RDFTerm | undefined): IRI {
    if (term === undefined) {
      throw new Error("DATATYPE: argument is undefined");
    }

    if (term instanceof Literal) {
      if (term.datatype) {
        return term.datatype;
      }
      if (term.language) {
        return new IRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#langString");
      }
      return new IRI("http://www.w3.org/2001/XMLSchema#string");
    }

    throw new Error("DATATYPE: argument must be a literal");
  }

  static bound(term: RDFTerm | undefined): boolean {
    return term !== undefined;
  }

  static isIRI(term: RDFTerm | undefined): boolean {
    if (term === undefined) {
      return false;
    }
    return term instanceof IRI;
  }

  static isBlank(term: RDFTerm | undefined): boolean {
    if (term === undefined) {
      return false;
    }
    return term instanceof BlankNode;
  }

  static isLiteral(term: RDFTerm | undefined): boolean {
    if (term === undefined) {
      return false;
    }
    return term instanceof Literal;
  }

  static regex(text: string, pattern: string, flags?: string): boolean {
    try {
      const regex = new RegExp(pattern, flags);
      return regex.test(text);
    } catch (error) {
      throw new Error(`REGEX: invalid pattern '${pattern}': ${(error as Error).message}`);
    }
  }

  static compare(a: RDFTerm | string | number, b: RDFTerm | string | number, operator: string): boolean {
    const aValue = this.toComparableValue(a);
    const bValue = this.toComparableValue(b);

    switch (operator) {
      case "=":
        return aValue === bValue;
      case "!=":
        return aValue !== bValue;
      case "<":
        return aValue < bValue;
      case ">":
        return aValue > bValue;
      case "<=":
        return aValue <= bValue;
      case ">=":
        return aValue >= bValue;
      default:
        throw new Error(`Unknown comparison operator: ${operator}`);
    }
  }

  private static toComparableValue(value: RDFTerm | string | number): string | number {
    if (typeof value === "string" || typeof value === "number") {
      return value;
    }

    if (value instanceof Literal) {
      const datatype = value.datatype?.value;
      if (datatype?.includes("#integer") || datatype?.includes("#decimal") || datatype?.includes("#double")) {
        const num = parseFloat(value.value);
        if (!isNaN(num)) {
          return num;
        }
      }
      return value.value;
    }

    if (value instanceof IRI) {
      return value.value;
    }

    if (value instanceof BlankNode) {
      return value.id;
    }

    return String(value);
  }

  // W3C SPARQL 1.1 String Functions
  // https://www.w3.org/TR/sparql11-query/#func-contains

  static contains(str: string, substr: string): boolean {
    return str.includes(substr);
  }

  static strStarts(str: string, prefix: string): boolean {
    return str.startsWith(prefix);
  }

  static strEnds(str: string, suffix: string): boolean {
    return str.endsWith(suffix);
  }

  static strlen(str: string): number {
    return str.length;
  }

  static ucase(str: string): string {
    return str.toUpperCase();
  }

  static lcase(str: string): string {
    return str.toLowerCase();
  }

  /**
   * SPARQL 1.1 SUBSTR function.
   * https://www.w3.org/TR/sparql11-query/#func-substr
   *
   * @param str - Source string
   * @param start - Starting position (1-based, per SPARQL spec)
   * @param length - Optional length of substring
   * @returns Substring from position start with optional length
   */
  static substr(str: string, start: number, length?: number): string {
    // SPARQL uses 1-based indexing, JavaScript uses 0-based
    const startIndex = start - 1;

    if (startIndex < 0) {
      // For negative start, adjust length and start from 0
      if (length !== undefined) {
        const adjustedLength = length + startIndex;
        if (adjustedLength <= 0) {
          return "";
        }
        return str.substring(0, adjustedLength);
      }
      return str;
    }

    if (length !== undefined) {
      return str.substring(startIndex, startIndex + length);
    }

    return str.substring(startIndex);
  }

  /**
   * SPARQL 1.1 STRBEFORE function.
   * https://www.w3.org/TR/sparql11-query/#func-strbefore
   *
   * Returns the substring before the first occurrence of the separator.
   * Returns empty string if separator not found or str is empty.
   *
   * @param str - Source string
   * @param separator - Separator to search for
   * @returns Substring before separator, or empty string if not found
   */
  static strBefore(str: string, separator: string): string {
    if (separator === "") {
      return "";
    }
    const index = str.indexOf(separator);
    if (index === -1) {
      return "";
    }
    return str.substring(0, index);
  }

  /**
   * SPARQL 1.1 STRAFTER function.
   * https://www.w3.org/TR/sparql11-query/#func-strafter
   *
   * Returns the substring after the first occurrence of the separator.
   * Returns empty string if separator not found or str is empty.
   *
   * @param str - Source string
   * @param separator - Separator to search for
   * @returns Substring after separator, or empty string if not found
   */
  static strAfter(str: string, separator: string): string {
    if (separator === "") {
      return str;
    }
    const index = str.indexOf(separator);
    if (index === -1) {
      return "";
    }
    return str.substring(index + separator.length);
  }

  /**
   * SPARQL 1.1 CONCAT function.
   * https://www.w3.org/TR/sparql11-query/#func-concat
   *
   * Concatenates multiple string arguments.
   *
   * @param strings - Strings to concatenate
   * @returns Concatenated result
   */
  static concat(...strings: string[]): string {
    return strings.join("");
  }

  /**
   * SPARQL 1.1 REPLACE function.
   * https://www.w3.org/TR/sparql11-query/#func-replace
   */
  static replace(str: string, pattern: string, replacement: string, flags?: string): string {
    try {
      const regex = new RegExp(pattern, flags || "g");
      return str.replace(regex, replacement);
    } catch (error) {
      throw new Error(`REPLACE: invalid pattern '${pattern}': ${(error as Error).message}`);
    }
  }

  /**
   * Parse a date string to a timestamp (milliseconds since epoch).
   * Custom function for date comparison support.
   */
  static parseDate(dateStr: string): number {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`PARSEDATE: invalid date string '${dateStr}'`);
    }
    return date.getTime();
  }

  /**
   * Check if date1 is before date2.
   * Custom function for date comparison support.
   */
  static dateBefore(date1: string, date2: string): boolean {
    const d1 = this.parseDate(date1);
    const d2 = this.parseDate(date2);
    return d1 < d2;
  }

  /**
   * Check if date1 is after date2.
   * Custom function for date comparison support.
   */
  static dateAfter(date1: string, date2: string): boolean {
    const d1 = this.parseDate(date1);
    const d2 = this.parseDate(date2);
    return d1 > d2;
  }

  /**
   * Check if date is within a range [start, end].
   * Custom function for date comparison support.
   */
  static dateInRange(date: string, start: string, end: string): boolean {
    const d = this.parseDate(date);
    const s = this.parseDate(start);
    const e = this.parseDate(end);
    return d >= s && d <= e;
  }

  /**
   * Calculate the difference between two dates in minutes.
   * Returns the absolute difference (always positive).
   * Custom function for duration calculation support.
   *
   * @param date1 - First date string (start timestamp)
   * @param date2 - Second date string (end timestamp)
   * @returns Difference in minutes (positive number)
   */
  static dateDiffMinutes(date1: string, date2: string): number {
    const d1 = this.parseDate(date1);
    const d2 = this.parseDate(date2);
    const diffMs = Math.abs(d2 - d1);
    return Math.round(diffMs / (1000 * 60));
  }

  /**
   * Calculate the difference between two dates in hours.
   * Returns the absolute difference (always positive).
   * Custom function for duration calculation support.
   *
   * @param date1 - First date string (start timestamp)
   * @param date2 - Second date string (end timestamp)
   * @returns Difference in hours (decimal number with 2 decimal places)
   */
  static dateDiffHours(date1: string, date2: string): number {
    const d1 = this.parseDate(date1);
    const d2 = this.parseDate(date2);
    const diffMs = Math.abs(d2 - d1);
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  }

  static logicalAnd(operands: boolean[]): boolean {
    return operands.every((op) => op === true);
  }

  static logicalOr(operands: boolean[]): boolean {
    return operands.some((op) => op === true);
  }

  static logicalNot(operand: boolean): boolean {
    return !operand;
  }

  // SPARQL 1.1 Date/Time Accessor Functions
  // https://www.w3.org/TR/sparql11-query/#func-year

  /**
   * SPARQL 1.1 YEAR function.
   * Returns the year component of a dateTime value.
   */
  static year(dateStr: string): number {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`YEAR: invalid date string '${dateStr}'`);
    }
    return date.getFullYear();
  }

  /**
   * SPARQL 1.1 MONTH function.
   * Returns the month component of a dateTime value (1-12).
   */
  static month(dateStr: string): number {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`MONTH: invalid date string '${dateStr}'`);
    }
    return date.getMonth() + 1; // JavaScript months are 0-indexed
  }

  /**
   * SPARQL 1.1 DAY function.
   * Returns the day component of a dateTime value (1-31).
   */
  static day(dateStr: string): number {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`DAY: invalid date string '${dateStr}'`);
    }
    return date.getDate();
  }

  /**
   * SPARQL 1.1 HOURS function.
   * Returns the hours component of a dateTime value (0-23).
   */
  static hours(dateStr: string): number {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`HOURS: invalid date string '${dateStr}'`);
    }
    return date.getHours();
  }

  /**
   * SPARQL 1.1 MINUTES function.
   * Returns the minutes component of a dateTime value (0-59).
   */
  static minutes(dateStr: string): number {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`MINUTES: invalid date string '${dateStr}'`);
    }
    return date.getMinutes();
  }

  /**
   * SPARQL 1.1 SECONDS function.
   * Returns the seconds component of a dateTime value (0-59, may include decimal).
   */
  static seconds(dateStr: string): number {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`SECONDS: invalid date string '${dateStr}'`);
    }
    // Include milliseconds as decimal seconds
    return date.getSeconds() + date.getMilliseconds() / 1000;
  }

  /**
   * SPARQL 1.1 TIMEZONE function.
   * Returns the timezone offset as a string (e.g., "+05:00", "Z").
   */
  static timezone(dateStr: string): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`TIMEZONE: invalid date string '${dateStr}'`);
    }
    // Check if original string has timezone info
    if (dateStr.endsWith("Z")) {
      return "PT0S"; // UTC
    }
    const tzMatch = dateStr.match(/([+-]\d{2}):?(\d{2})$/);
    if (tzMatch) {
      const hours = parseInt(tzMatch[1], 10);
      const minutes = parseInt(tzMatch[2], 10);
      const sign = hours >= 0 ? "" : "-";
      const absHours = Math.abs(hours);
      if (minutes === 0) {
        return `${sign}PT${absHours}H`;
      }
      return `${sign}PT${absHours}H${minutes}M`;
    }
    // Return local timezone offset
    const offset = -date.getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const mins = Math.abs(offset) % 60;
    const sign = offset >= 0 ? "" : "-";
    if (mins === 0) {
      return `${sign}PT${hours}H`;
    }
    return `${sign}PT${hours}H${mins}M`;
  }

  /**
   * SPARQL 1.1 NOW function.
   * Returns the current dateTime as ISO string.
   */
  static now(): string {
    return new Date().toISOString();
  }

  // Duration arithmetic helpers

  /**
   * Convert milliseconds to minutes.
   * Useful for duration calculations.
   */
  static msToMinutes(ms: number): number {
    return Math.round(ms / (1000 * 60));
  }

  /**
   * Convert milliseconds to hours.
   * Useful for duration calculations.
   */
  static msToHours(ms: number): number {
    return Math.round((ms / (1000 * 60 * 60)) * 100) / 100;
  }

  /**
   * Convert milliseconds to seconds.
   * Useful for duration calculations.
   */
  static msToSeconds(ms: number): number {
    return Math.round(ms / 1000);
  }
}
