import { ILike } from 'typeorm';
import { IStrategy } from '../devextreme.interface';
import { BaseGetDto } from '../dto/base-get.dto';

export class TypeOrmStrategy implements IStrategy {
  get({ skip, take, sort, filter }: BaseGetDto) {
    const where = this.buildWhereCondition(filter);
    return {
      skip,
      take,
      sort,
      where,
    };
  }

  private buildWhereCondition(filterArray: any) {
    if (!filterArray) return {};

    // Flat single condition: ["field", "=", "value"]
    if (
      filterArray.length === 3 &&
      typeof filterArray[0] === 'string' &&
      typeof filterArray[1] === 'string'
    ) {
      return [
        this.buildCondition(filterArray[0], filterArray[1], filterArray[2]),
      ];
    }

    // Nested multi-condition array: [["field", "=", "value"], "and", [...]]
    const where: any[] = [];
    for (const element of filterArray) {
      if (Array.isArray(element)) {
        where.push(this.buildCondition(element[0], element[1], element[2]));
      }
    }

    return where.length > 0 ? where : {};
  }

  private buildCondition(field: string, operator: string, value: any) {
    switch (operator.toLowerCase()) {
      case 'contains':
        return { [field]: ILike(`%${value}%`) };
      case '=':
        return { [field]: value };
      default:
        return {};
    }
  }
}
