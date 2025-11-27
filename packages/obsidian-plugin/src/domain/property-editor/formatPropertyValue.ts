/**
 * Formats a property value for YAML frontmatter storage.
 * @param value - The value to format
 * @returns The formatted string value
 */
export function formatPropertyValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "boolean") {
    return value.toString();
  }
  if (typeof value === "number") {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return `\n${value.map((v) => `  - ${v}`).join("\n")}`;
  }
  return String(value);
}
