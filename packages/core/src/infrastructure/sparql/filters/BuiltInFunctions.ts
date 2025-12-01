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
}
