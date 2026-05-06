import { SortTransformType } from './devextreme.type';
import { BaseGetDto } from './dto/base-get.dto';

export interface IStrategy {
  get(getDto: BaseGetDto);
}

export interface IFieldFilter {
  field: string;
  relatedFields: string[];
}

export interface ISortFilter {
  field: string;
  relatedFields: string[];
}

export interface IBaseGet {
  /**
   * Number of records to be returned
   */
  take?: number;

  /**
   * Number of records to be skipped
   */
  skip?: number;

  /**
   * Record sorting configuration
   * Example: [{"selector":"section","desc":false}]
   */
  sort?: SortTransformType;

  /**
   * Filter conditions for records
   * Example: ["status","=","Active"]
   */
  filter?: (string | string[])[];
}

export interface IPaginatedResult<T> {
  data: T[];
  totalCount: number;
}
