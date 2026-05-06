import { DeepPartial } from '@/utils/types/deep-partial.type';
import { NullableType } from '@/utils/types/nullable.type';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { Attachments } from '@/attachments/domain/attachments';
import { User } from '@/users/domain/user';
import { QueryRunner } from 'typeorm';

export abstract class BaseAttachmentsRepository {
  abstract create(
    data: Omit<Attachments, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Attachments>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<Attachments>>;

  abstract findById(id: Attachments['id']): Promise<NullableType<Attachments>>;

  abstract findByRecordIdAndType(
    recordId: Attachments['record_id'],
    recordType: Attachments['record_type'],
  ): Promise<NullableType<Attachments[]>>;

  abstract findByRecordIdAndTypeWithoutThrow(
    recordId: Attachments['record_id'],
    recordType: Attachments['record_type'],
  ): Promise<NullableType<Attachments>>;

  abstract findByRecordIdWithoutThrow(
    recordId: Attachments['record_id'],
  ): Promise<NullableType<Attachments>>;

  abstract findByIds(ids: Attachments['id'][]): Promise<Attachments[]>;

  abstract update(
    id: Attachments['id'],
    payload: DeepPartial<Attachments>,
  ): Promise<Attachments | null>;

  abstract remove(id: Attachments['id'], causer: User): Promise<void>;

  abstract bulkRemove(attachments: Attachments[], causer: User): Promise<void>;

  abstract bulkRemoveWithConditions(
    options: Record<string, any>,
    queryRunner?: QueryRunner,
  ): Promise<void>;
}
