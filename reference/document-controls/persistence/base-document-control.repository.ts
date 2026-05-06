import { DeepPartial } from '@/utils/types/deep-partial.type';
import { NullableType } from '@/utils/types/nullable.type';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { DocumentControl } from '@/document-controls/domain/document-control';
import { QueryRunner } from 'typeorm';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';

export abstract class BaseDocumentControlRepository {
  abstract create(
    data: Omit<
      DocumentControl,
      | 'id'
      | 'status'
      | 'created_at'
      | 'updated_at'
      | 'created_by'
      | 'updated_by'
    >,
  ): Promise<DocumentControl>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<DocumentControl>>;

  abstract findById(
    id: DocumentControl['id'],
  ): Promise<NullableType<DocumentControl>>;

  abstract findByIds(ids: DocumentControl['id'][]): Promise<DocumentControl[]>;

  abstract findByMenuCode(code: string): Promise<NullableType<DocumentControl>>;

  abstract findByMenuId(menu: number): Promise<NullableType<DocumentControl>>;

  abstract findAll(): Promise<DocumentControl[]>;

  abstract findManyBy(
    loadOptions: GetQueryParams,
  ): Promise<{ data: DocumentControl[]; totalCount: number }>;

  abstract bulkUpdate(
    ids: DocumentControl['id'][],
    payload: DeepPartial<DocumentControl>,
    queryRunner?: QueryRunner,
  ): Promise<void>;

  abstract update(
    id: DocumentControl['id'],
    payload: DeepPartial<DocumentControl>,
  ): Promise<DocumentControl | null>;

  abstract remove(id: DocumentControl['id']): Promise<void>;
}
