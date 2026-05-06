import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, EntityManager, QueryRunner } from 'typeorm';
import { AttachmentsEntity } from '@/attachments/persistence/entities/attachments.entity';
import { NullableType } from '@/utils/types/nullable.type';
import { Attachments } from '@/attachments/domain/attachments';
import { BaseAttachmentsRepository } from '@/attachments/persistence/base-attachments.repository';
import { AttachmentsMapper } from '@/attachments/persistence/mappers/attachments.mapper';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { StatusEnum } from '@/attachments/attachments.enum';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';

@Injectable()
export class AttachmentsRepository implements BaseAttachmentsRepository {
  constructor(
    @InjectRepository(AttachmentsEntity)
    private readonly attachmentsRepository: Repository<AttachmentsEntity>,
  ) {}

  protected getRepository(
    queryRunner?: QueryRunner,
  ): Repository<AttachmentsEntity> {
    return queryRunner
      ? queryRunner.manager.getRepository(AttachmentsEntity)
      : this.attachmentsRepository;
  }

  async create(data: Attachments): Promise<Attachments> {
    const persistenceModel = AttachmentsMapper.toPersistence(data);
    const newEntity = await this.attachmentsRepository.save(
      this.attachmentsRepository.create(persistenceModel),
    );
    return AttachmentsMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<Attachments>> {
    const [entities, totalResults] =
      await this.attachmentsRepository.findAndCount({
        skip: (paginationOptions.page - 1) * paginationOptions.limit,
        take: paginationOptions.limit,
      });

    const data = entities.map((entity) => AttachmentsMapper.toDomain(entity));
    return { data, totalResults };
  }

  async findById(id: Attachments['id']): Promise<NullableType<Attachments>> {
    const entity = await this.attachmentsRepository.findOne({
      where: { id },
    });

    return entity ? AttachmentsMapper.toDomain(entity) : null;
  }

  async findByRecordIdAndType(
    recordId: Attachments['record_id'],
    recordType: Attachments['record_type'],
  ): Promise<NullableType<Attachments[]>> {
    const entities = await this.attachmentsRepository.find({
      where: {
        record_id: recordId,
        record_type: recordType,
      },
    });

    if (entities.length === 0)
      throw new NotFoundException(
        'No attachments found for the given record ID and type.',
      );

    return entities.map((entity) => AttachmentsMapper.toDomain(entity));
  }

  async findAllByRecordIdAndType(
    recordId: Attachments['record_id'],
    recordType: Attachments['record_type'],
  ): Promise<Attachments[]> {
    const attachments = await this.attachmentsRepository.find({
      where: {
        record_id: recordId,
        record_type: recordType,
      },
    });

    if (!attachments)
      throw new NotFoundException(
        'No attachment found for the given record ID and type.',
      );

    return attachments.map((entity) => AttachmentsMapper.toDomain(entity));
  }

  async findByRecordIdAndTypeWithoutThrow(
    recordId: Attachments['record_id'],
    recordType: Attachments['record_type'],
  ): Promise<NullableType<Attachments>> {
    const entity = await this.attachmentsRepository.findOne({
      where: {
        record_id: recordId,
        record_type: recordType,
      },
    });

    return entity ? AttachmentsMapper.toDomain(entity) : null;
  }

  async findByRecordIdWithoutThrow(
    recordId: Attachments['record_id'],
  ): Promise<NullableType<Attachments>> {
    const entity = await this.attachmentsRepository.findOne({
      where: { record_id: recordId },
    });

    return entity ? AttachmentsMapper.toDomain(entity) : null;
  }
  async findByIds(ids: Attachments['id'][]): Promise<Attachments[]> {
    const entities = await this.attachmentsRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => AttachmentsMapper.toDomain(entity));
  }

  async update(
    id: Attachments['id'],
    payload: Partial<Attachments>,
  ): Promise<Attachments> {
    const entity = await this.attachmentsRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    const updatedEntity = await this.attachmentsRepository.save(
      this.attachmentsRepository.create(
        AttachmentsMapper.toPersistence({
          ...AttachmentsMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return AttachmentsMapper.toDomain(updatedEntity);
  }

  async remove(id: Attachments['id'], causer: User): Promise<void> {
    const attachment = await this.attachmentsRepository.findOne({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const userEntity = UserMapper.toPersistence(causer);
    const transactionManager = this.attachmentsRepository.manager;

    await transactionManager.transaction(async (manager: EntityManager) => {
      try {
        await manager.update(
          AttachmentsEntity,
          { id },
          {
            status: StatusEnum.CANCELLED,
            updated_by: userEntity,
            deleted_by: userEntity,
          },
        );

        await manager.softDelete(AttachmentsEntity, { id });
      } catch (error) {
        console.log(error);

        await manager.update(
          AttachmentsEntity,
          { id },
          {
            status: StatusEnum.CANCELLED,
            updated_by: userEntity,
            deleted_by: null,
          },
        );
      }
    });
  }

  async bulkRemove(attachments: Attachments[], causer: User): Promise<void> {
    const removalPromises = attachments.map((customer) => {
      return this.remove(customer.id, causer);
    });

    try {
      await Promise.all(removalPromises);
    } catch (error) {
      console.error('Error during attachments bulk remove:', error);
      throw new UnprocessableEntityException(
        'Some attachments could not be removed',
      );
    }
  }

  async bulkRemoveWithConditions(
    options: Record<string, any>,
    queryRunner?: QueryRunner,
  ): Promise<void> {
    await this.getRepository(queryRunner)
      .createQueryBuilder()
      .softDelete()
      .where(options)
      .execute();
  }
}
