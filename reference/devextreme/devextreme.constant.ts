import { BinaryOperatorType } from '@/devextreme/devextreme.type';

export const operatorToSQL: Record<BinaryOperatorType, string> = {
  '=': '=',
  '>': '>',
  '<': '<',
  '<>': '<>',
  '>=': '>=',
  '<=': '<=',
  contains: 'ILIKE',
  startswith: 'ILIKE',
  endswith: 'ILIKE',
  notcontains: 'NOT ILIKE',
};
