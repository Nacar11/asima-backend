import { DeepPartial } from '@/utils/types/deep-partial.type';
import { NullableType } from '@/utils/types/nullable.type';
import { DocumentSignatory } from '@/document-signatories/domain/document-signatory';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { QueryRunner } from 'typeorm';

export abstract class BaseDocumentSignatoryRepository {
  abstract create(
    data: Omit<
      DocumentSignatory,
      | 'id'
      | 'status'
      | 'created_at'
      | 'updated_at'
      | 'created_by'
      | 'updated_by'
    >,
  ): Promise<DocumentSignatory>;

  abstract findManyBy(
    loadOptions: GetQueryParams,
  ): Promise<{ data: DocumentSignatory[]; totalCount: number }>;

  abstract findById(
    id: DocumentSignatory['id'],
  ): Promise<NullableType<DocumentSignatory>>;

  abstract findByMenuCode(
    code: string,
  ): Promise<NullableType<DocumentSignatory>>;

  abstract findByMenuId(menu: number): Promise<NullableType<DocumentSignatory>>;

  abstract findByIds(
    ids: DocumentSignatory['id'][],
  ): Promise<DocumentSignatory[]>;

  abstract findAll(): Promise<DocumentSignatory[]>;

  abstract update(
    id: DocumentSignatory['id'],
    payload: DeepPartial<DocumentSignatory>,
  ): Promise<DocumentSignatory | null>;

  abstract bulkUpdate(
    ids: DocumentSignatory['id'][],
    payload: DeepPartial<DocumentSignatory>,
    queryRunner?: QueryRunner,
  ): Promise<void>;

  abstract remove(id: DocumentSignatory['id']): Promise<void>;
}
