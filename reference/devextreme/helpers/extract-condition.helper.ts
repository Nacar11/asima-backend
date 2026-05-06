export function extractCondition(
  filter: any,
  targetField: string,
): { updated: any; extracted: any } {
  if (!filter) return { updated: filter, extracted: null };

  if (Array.isArray(filter[0]) || typeof filter[0] === 'string') {
    if (filter[0] === targetField) {
      if (
        filter[1] == '=' ||
        filter[1] == '!=' ||
        filter[1] == '>=' ||
        filter[1] == '<='
      )
        return { updated: filter, extracted: null };
      return { updated: null, extracted: filter };
    }
  }

  if (Array.isArray(filter)) {
    const updatedFilter: any[] = [];
    let extracted: any = null;

    for (let i = 0; i < filter.length; i++) {
      const part = filter[i];

      if (Array.isArray(part)) {
        const { updated, extracted: childExtracted } = extractCondition(
          part,
          targetField,
        );
        if (childExtracted && !extracted) extracted = childExtracted;
        if (updated) updatedFilter.push(updated);
      } else {
        updatedFilter.push(part);
      }
    }

    const flat = updatedFilter.length === 1 ? updatedFilter[0] : updatedFilter;

    return {
      updated: flat.length === 0 ? null : flat,
      extracted,
    };
  }

  return { updated: filter, extracted: null };
}
