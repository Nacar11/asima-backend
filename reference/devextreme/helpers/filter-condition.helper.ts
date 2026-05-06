import { operatorToSQL } from '@/devextreme/devextreme.constant';
import { IFieldFilter } from '@/devextreme/devextreme.interface';
import {
  ConditionType,
  QueryConditionType,
} from '@/devextreme/devextreme.type';
import { BaseGetDto } from '@/devextreme/dto/base-get.dto';

/**
 * This function searches for a specific condition within a nested array structure, which represents various filter conditions.
 *
 * The function recursively looks through the provided `condition` (which is of type `QueryConditionType`), searching for
 * an array that contains a key matching the provided `key`. If a matching condition is found, it returns that condition.
 *
 * @param condition - The condition to search within. It is an array of conditions where each condition can be:
 *                    - A direct condition array (e.g., `[field, operator, value]`)
 *                    - A nested array that may contain further conditions (e.g., with "or" operators).
 * @param key - The key (or field) to search for within the conditions.
 *
 * @returns - Returns the matching condition as `ConditionType` if found, otherwise `null`.
 *           - `ConditionType` is expected to be an array like `[field, operator, value]`.
 *           - If a matching condition isn't found, `null` is returned.
 */
export function findCondition(
  condition: QueryConditionType,
  key: string,
): ConditionType | null {
  for (const item of condition) {
    if (Array.isArray(item)) {
      if (typeof item[0] === 'string' && item[0] === key) {
        return item as ConditionType;
      }
      // Ensure we're only passing arrays that match QueryConditionType[]
      if (
        Array.isArray(item) &&
        item.every((subItem) => Array.isArray(subItem) || subItem === 'or')
      ) {
        const found = findCondition(item as QueryConditionType, key);
        if (found) return found;
      }
    }
  }
  return null;
}

/**
 * This function processes an array of field filters (`fieldFilters`) and applies related field conditions to an
 * existing filter array (`filter`). It constructs new conditions for each related field and updates the `filter` accordingly.
 * The function resolves asynchronously, ensuring all filter transformations are completed before returning the final result.
 *
 * @param filter - The existing filter array (of type `BaseGetDto['filter']`) to which related field conditions will be added.
 *                 This filter is modified in place.
 * @param fieldFilters - An array of `IFieldFilter` objects, where each object contains:
 *                       - `field`: The field to look for in the filter (which will be modified).
 *                       - `relatedFields`: A list of related fields to apply conditions to.
 *
 * @returns A promise that resolves to the updated `filter` array with the related fields and 'or' operators added.
 *          The final `filter` structure may include multiple blocks of conditions, separated by 'or' operators.
 */
export async function createFieldFilters(
  filter: BaseGetDto['filter'],
  fieldFilters: IFieldFilter[],
): Promise<BaseGetDto['filter']> {
  const CONDITION_LENGTH = 3;

  // Handle single condition array by wrapping it
  if (
    Array.isArray(filter) &&
    filter.length === CONDITION_LENGTH &&
    typeof filter[1] === 'string' &&
    Object.keys(operatorToSQL).includes(filter[1])
  ) {
    filter = [filter] as (string | string[])[];
  }

  async function processFilterRecursively(
    currentFilter: BaseGetDto['filter'],
    depth = 0,
  ): Promise<void> {
    for (
      let filterIndex = 0;
      filterIndex < currentFilter.length;
      filterIndex++
    ) {
      const currentItem = currentFilter[filterIndex];

      // Skip logical operators
      if (!Array.isArray(currentItem)) {
        continue;
      }

      // Check if this is a condition array (field, operator, value)
      if (
        currentItem.length === CONDITION_LENGTH &&
        typeof currentItem[1] === 'string' &&
        Object.keys(operatorToSQL).includes(currentItem[1] as string)
      ) {
        // This is a condition array, check for field filters
        const fieldName = currentItem[0] as string;
        const fieldFilter = fieldFilters.find((ff) => ff.field === fieldName);

        if (fieldFilter) {
          const [, operator, filterValue] = currentItem;
          const newConditions: (string | string[])[] = [];

          for (
            let relatedFieldIndex = 0;
            relatedFieldIndex < fieldFilter.relatedFields.length;
            relatedFieldIndex++
          ) {
            const relatedField = fieldFilter.relatedFields[relatedFieldIndex];
            newConditions.push([relatedField, operator, filterValue]);

            if (relatedFieldIndex < fieldFilter.relatedFields.length - 1) {
              newConditions.push('or');
            }
          }

          if (newConditions.length > 0) {
            currentFilter[filterIndex] = newConditions as string[];
          }
        }
      }
      // If it's a nested array (not a condition), process it recursively
      else if (Array.isArray(currentItem)) {
        await processFilterRecursively(currentItem, depth + 1);
      }
    }
  }

  await processFilterRecursively(filter);
  return filter;
}
