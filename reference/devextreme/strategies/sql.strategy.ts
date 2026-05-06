import {
  FilterGroup,
  GroupOperatorType,
  SingleFilter,
} from '@/devextreme/devextreme.type';
import { BaseGetDto } from '@/devextreme/dto/base-get.dto';
import { IStrategy } from '../devextreme.interface';
import { FilterOptions } from '@/devextreme/devextreme.type';
import {
  BinaryOperator,
  GroupOperator,
  UnaryOperator,
} from '@/devextreme/devextreme.enum';
import { operatorToSQL } from '@/devextreme/devextreme.constant';

export class SqlStrategy implements IStrategy {
  get({ skip, take, sort, filter }: BaseGetDto) {
    const where = this.buildWhereCondition(filter as FilterOptions);
    return {
      skip,
      take,
      sort,
      where,
    };
  }

  public buildCondition(filterOption: SingleFilter) {
    const [field, operator, value] = filterOption;

    switch (operator) {
      case BinaryOperator.EQUAL:
      case BinaryOperator.GREATER_THAN:
      case BinaryOperator.LESS_THAN:
      case BinaryOperator.NOT_EQUAL:
      case BinaryOperator.GREATER_THAN_OR_EQUAL:
      case BinaryOperator.LESS_THAN_OR_EQUAL:
        return `${field} ${operator} '${value}'`;

      case BinaryOperator.CONTAINS:
      case BinaryOperator.NOT_CONTAINS:
        return `${field} ${operatorToSQL[operator]} '%${value}%'`;

      case BinaryOperator.STARTS_WITH:
        return `${field} ${operatorToSQL[operator]} '%${value}'`;

      case BinaryOperator.ENDS_WITH:
        return `${field} ${operatorToSQL[operator]} '${value}%'`;

      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  public buildWhereCondition(filters: FilterOptions): string {
    try {
      // Attempt to parse the filter if it's a string
      if (typeof filters === 'string') {
        filters = JSON.parse(filters) as FilterOptions;
      }
    } catch (error) {
      console.error('Failed to parse filter string:', error);
      return '';
    }

    if (!Array.isArray(filters)) return '';

    // Handle single filter case
    if (
      filters.length === 3 &&
      typeof filters[1] === 'string' &&
      Object.values(BinaryOperator).includes(filters[1] as BinaryOperator)
    ) {
      return this.buildCondition(filters as SingleFilter);
    }

    return this.processFilterGroup(filters as FilterGroup);
  }

  private processFilterGroup(group: FilterGroup): string {
    if (group.length === 0) return '';

    const parts: string[] = [];
    let currentOperator: GroupOperatorType = GroupOperator.AND; // Default operator
    let isNegated = false;

    for (let i = 0; i < group.length; i++) {
      const item = group[i];

      // Detect Negation ("!")
      if (typeof item === 'string' && item === UnaryOperator.NOT) {
        isNegated = true;
        continue;
      }

      // Handle group operator
      if (
        typeof item === 'string' &&
        (item === GroupOperator.AND || item === GroupOperator.OR)
      ) {
        currentOperator = item;
        continue;
      }

      // Handle single filter condition
      if (
        Array.isArray(item) &&
        item.length === 3 &&
        typeof item[1] === 'string' &&
        Object.values(BinaryOperator).includes(item[1] as BinaryOperator)
      ) {
        parts.push(this.buildCondition(item as SingleFilter));
        continue;
      }

      // Handle nested filter group
      if (Array.isArray(item)) {
        const nestedCondition = this.processFilterGroup(item as FilterGroup);
        if (nestedCondition) {
          parts.push(`(${nestedCondition})`);
        }
      }
    }

    const finalCondition = parts.join(` ${currentOperator} `);

    // Apply NOT if negation was detected
    return isNegated ? `NOT (${finalCondition})` : finalCondition;
  }
}
