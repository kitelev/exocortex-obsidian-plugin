export interface PropertyDelta {
  added: string[];
  removed: string[];
  modified: string[];
}

export class FrontmatterDeltaDetector {
  detectChanges(
    oldMetadata: Record<string, unknown>,
    newMetadata: Record<string, unknown>,
  ): PropertyDelta {
    const delta: PropertyDelta = {
      added: [],
      removed: [],
      modified: [],
    };

    const allKeys = new Set([
      ...Object.keys(oldMetadata),
      ...Object.keys(newMetadata),
    ]);

    for (const key of allKeys) {
      const hadProp = key in oldMetadata;
      const hasProp = key in newMetadata;

      if (!hadProp && hasProp) {
        delta.added.push(key);
      } else if (hadProp && !hasProp) {
        delta.removed.push(key);
      } else if (hadProp && hasProp) {
        const oldVal = JSON.stringify(oldMetadata[key]);
        const newVal = JSON.stringify(newMetadata[key]);
        if (oldVal !== newVal) {
          delta.modified.push(key);
        }
      }
    }

    return delta;
  }

  getAllChangedProperties(delta: PropertyDelta): string[] {
    return [...delta.added, ...delta.removed, ...delta.modified];
  }
}
