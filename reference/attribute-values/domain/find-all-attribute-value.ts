import { AttributeValue } from './attribute-value';

export type FindAllAttributeValue = {
  data: AttributeValue[];
  totalCount: number;
  page: number;
  limit: number;
};
