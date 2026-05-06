import type { ISortFilter } from '@/devextreme/devextreme.interface';
import type { SortTransformType } from '@/devextreme/devextreme.type';
import { BaseGetDto } from '@/devextreme/dto/base-get.dto';
import { OrderByCondition } from 'typeorm';

export function singleSortMap(
  sort: SortTransformType,
  fieldMapTo: ISortFilter,
) {
  const result: Record<string, string> = {};

  const { field, relatedFields } = fieldMapTo;
  const orderValue = sort[field];

  for (const mapField of relatedFields) {
    result[mapField] = orderValue;
  }

  return result;
}

/**
 * Maps sorting configuration from specified fields to their related fields
 * Only processes fields that exist in both currentSort and fieldMaps
 * @param currentSort - The current sorting configuration
 * @param fieldMaps - Array of field mapping configurations
 * @returns Record of mapped fields with their sort orders
 */
export function processMultiSortMapping(
  currentSort: BaseGetDto['sort'],
  fieldMaps: ISortFilter[],
): OrderByCondition {
  const sortResult: Record<string, string> = {};
  const processedFields = new Set<string>();

  // Early return if currentSort is null or undefined
  if (!currentSort || typeof currentSort !== 'object') {
    return sortResult as OrderByCondition;
  }

  // Process fields that exist in both currentSort and fieldMaps
  for (const fieldSort of fieldMaps) {
    const { field, relatedFields } = fieldSort;

    // Check if this field exists in the current sort
    if (field in currentSort) {
      const orderValue = currentSort[field];

      // Apply the same sort order to all related fields
      for (const mapField of relatedFields) {
        sortResult[mapField] = orderValue;
      }

      // Mark this field as processed
      processedFields.add(field);
    }
  }

  // Include original sort fields that weren't in fieldMaps
  for (const [field, order] of Object.entries(currentSort)) {
    if (!processedFields.has(field)) {
      sortResult[field] = order;
    }
  }

  return sortResult as OrderByCondition;
}
