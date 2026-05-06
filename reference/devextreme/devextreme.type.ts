export type SortTransformType = {
  [key: string]: ('ASC' | 'asc') | ('DESC' | 'desc');
};

export type BinaryOperatorType =
  | '='
  | '>'
  | '<'
  | '<>'
  | '>='
  | '<='
  | 'contains'
  | 'startswith'
  | 'endswith'
  | 'notcontains';

export type GroupOperatorType = 'or' | 'and';

export type UnaryOperatorType = '!';

export type SingleFilter = [string, BinaryOperatorType, string];

export type FilterPart =
  | SingleFilter
  | GroupOperatorType
  | FilterGroup
  | UnaryOperatorType;

export type FilterGroup = FilterPart[];

export type FilterOptions = SingleFilter | FilterGroup;

export type ConditionType = [string, BinaryOperatorType, string];

export type QueryConditionType = (
  | ConditionType
  | GroupOperatorType
  | QueryConditionType[]
)[];
