export enum BinaryOperator {
  EQUAL = '=',
  GREATER_THAN = '>',
  LESS_THAN = '<',
  NOT_EQUAL = '<>',
  GREATER_THAN_OR_EQUAL = '>=',
  LESS_THAN_OR_EQUAL = '<=',
  CONTAINS = 'contains',
  STARTS_WITH = 'startswith',
  ENDS_WITH = 'endswith',
  NOT_CONTAINS = 'notcontains',
}

export enum GroupOperator {
  OR = 'or',
  AND = 'and',
}

export enum UnaryOperator {
  NOT = '!',
}
