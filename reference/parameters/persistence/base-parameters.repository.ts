import { DeepPartial } from '@/utils/types/deep-partial.type';
import { NullableType } from '@/utils/types/nullable.type';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { Parameter } from '@/parameters/domain/parameter';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';

export abstract class BaseParametersRepository {
  abstract create(
    data: Omit<
      Parameter,
      | 'id'
      | 'status'
      | 'created_at'
      | 'updated_at'
      | 'created_by'
      | 'updated_by'
    >,
  ): Promise<Parameter>;
  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<Parameter>>;

  abstract findManyBy(
    loadOptions: GetQueryParams,
  ): Promise<{ data: Parameter[]; totalCount: number }>;

  abstract findByCode(
    code: Parameter['code'],
  ): Promise<NullableType<Parameter>>;

  abstract findByParamItem(
    param_items: Parameter['param_items'],
  ): Promise<NullableType<Parameter>>;

  abstract findById(id: Parameter['id']): Promise<NullableType<Parameter>>;

  abstract findByIds(ids: Parameter['id'][]): Promise<Parameter[]>;

  abstract findAll(): Promise<Parameter[]>;

  abstract update(
    id: Parameter['id'],
    payload: DeepPartial<Parameter>,
  ): Promise<Parameter | null>;

  abstract remove(id: Parameter['id']): Promise<void>;

  abstract checkFreeze(): Promise<void>;
}
