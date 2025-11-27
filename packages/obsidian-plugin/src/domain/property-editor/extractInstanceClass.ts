/**
 * Extracts the instance class from frontmatter.
 * Handles various formats: array with wikilinks, plain strings, etc.
 * @param frontmatter - The frontmatter record
 * @returns The extracted instance class name, defaults to "ems__Task"
 */
export function extractInstanceClass(
  frontmatter: Record<string, unknown>,
): string {
  const instanceClass = frontmatter["exo__Instance_class"];
  if (Array.isArray(instanceClass) && instanceClass.length > 0) {
    return String(instanceClass[0])
      .replace(/^\[\[|\]\]$/g, "")
      .replace(/^"|"$/g, "");
  }
  if (typeof instanceClass === "string") {
    return instanceClass.replace(/^\[\[|\]\]$/g, "").replace(/^"|"$/g, "");
  }
  return "ems__Task";
}
