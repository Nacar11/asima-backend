import { DeepPartial } from '@/utils/types/deep-partial.type';
import { NullableType } from '@/utils/types/nullable.type';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { Company } from '@/companies/domain/company';
import { QueryRunner } from 'typeorm';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';

export abstract class BaseCompanyRepository {
  abstract create(
    data: Omit<
      Company,
      | 'id'
      | 'status'
      | 'created_at'
      | 'updated_at'
      | 'created_by'
      | 'updated_by'
    >,
  ): Promise<Company>;

  abstract findManyBy(
    loadOptions: GetQueryParams,
  ): Promise<{ data: Company[]; totalCount: number }>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<Company>>;

  abstract findByName(company_name: string): Promise<Company | null>;
  abstract findByShortName(short_name: string): Promise<Company | null>;
  abstract findByTin(tin: string): Promise<Company | null>;
  abstract setAsMain(id: Company['id']): Promise<Company>;

  abstract bulkRemove(ids: Company['id'][]): Promise<void>;
  abstract bulkHold(ids: Company['id'][]): Promise<void>;
  abstract bulkRelease(ids: Company['id'][]): Promise<void>;

  abstract findById(id: Company['id']): Promise<NullableType<Company>>;

  abstract findByIds(ids: Company['id'][]): Promise<Company[]>;

  abstract findAll(): Promise<Company[]>;

  abstract update(
    id: Company['id'],
    payload: DeepPartial<Company>,
    queryRunner?: QueryRunner,
  ): Promise<Company | null>;

  abstract remove(id: Company['id']): Promise<void>;
}
