import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  BaseAttachmentRepository,
  CreateAttachmentInput,
} from '@/storage/persistence/base-attachment.repository';
import { AttachmentEntity } from '@/storage/persistence/entities/attachment.entity';
import { AttachmentMapper } from '@/storage/persistence/mappers/attachment.mapper';
import { Attachment } from '@/storage/domain/attachment';
import { scopedRepo } from '@/utils/helpers/scoped-repo';

@Injectable()
export class AttachmentRepository extends BaseAttachmentRepository {
  constructor(
    @InjectRepository(AttachmentEntity)
    private readonly repo: Repository<AttachmentEntity>,
  ) {
    super();
  }

  async create(input: CreateAttachmentInput, manager?: EntityManager): Promise<Attachment> {
    const repo = scopedRepo(this.repo, manager);
    const entity = repo.create({
      bucket: input.bucket,
      object_key_prefix: input.object_key_prefix,
      original_filename: input.original_filename,
      content_type: input.content_type,
      size_bytes: input.size_bytes,
      kind: input.kind,
      has_versions: input.has_versions,
      owner_id: input.owner_id,
      created_by: input.created_by ?? null,
      updated_by: input.created_by ?? null,
    });
    const saved = await repo.save(entity);
    const reloaded = await repo.findOneOrFail({ where: { id: saved.id } });
    return AttachmentMapper.toDomain(reloaded);
  }

  async findById(id: number): Promise<Attachment | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? AttachmentMapper.toDomain(entity) : null;
  }
}
