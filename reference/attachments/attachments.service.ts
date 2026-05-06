import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateAttachmentsDto } from '@/attachments/dto/create-attachments.dto';
import { UpdateAttachmentsDto } from '@/attachments/dto/update-attachments.dto';
import { BaseAttachmentsRepository } from '@/attachments/persistence/base-attachments.repository';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { Attachments } from '@/attachments/domain/attachments';
import { User } from '@/users/domain/user';
import {
  getFileTypeFromURL,
  mimeToFileTypeMap,
} from '@/utils/helpers/attachment.helper';
import { basename } from 'path';
import { QueryRunner } from 'typeorm';

@Injectable()
export class AttachmentsService {
  constructor(
    // Dependencies here
    private readonly attachmentsRepository: BaseAttachmentsRepository,
  ) {}

  async create(createAttachmentsDto: CreateAttachmentsDto, causer: User) {
    let attachment = new Attachments();

    Object.assign(attachment, createAttachmentsDto);

    const mimeTypeResult = await getFileTypeFromURL(
      createAttachmentsDto.file_path,
    );
    const finalFileName = basename(createAttachmentsDto.file_path);

    const mimeType = mimeTypeResult ? mimeTypeResult : null;
    if (!mimeType)
      throw new UnprocessableEntityException('Attachment type not found');

    const finalFileType = mimeToFileTypeMap[mimeType];

    attachment.file_name = finalFileName;
    attachment.file_type = finalFileType;
    attachment.created_by = causer;
    attachment.updated_by = causer;

    attachment = await this.attachmentsRepository.create(attachment);

    if (!attachment)
      throw new UnprocessableEntityException('Unable to create Attachment');

    return this.findById(attachment.id);
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.attachmentsRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  async findById(id: Attachments['id']) {
    const attachment = await this.attachmentsRepository.findById(id);

    if (!attachment) throw new NotFoundException('Attachment does not exist!');

    return attachment;
  }

  async findByRecordIdAndType(
    recordId: Attachments['record_id'],
    recordType: Attachments['record_type'],
  ): Promise<Attachments[]> {
    const attachments = await this.attachmentsRepository.findByRecordIdAndType(
      recordId,
      recordType,
    );

    if (!attachments || attachments.length === 0)
      throw new NotFoundException('Attachments do not exist!');

    return attachments;
  }

  async findByRecordIdAndTypeWithoutThrow(
    recordId: Attachments['record_id'],
    recordType: Attachments['record_type'],
  ) {
    const attachment =
      await this.attachmentsRepository.findByRecordIdAndTypeWithoutThrow(
        recordId,
        recordType,
      );

    return attachment;
  }

  async findByRecordIdWithoutThrow(recordId: Attachments['record_id']) {
    const attachment =
      await this.attachmentsRepository.findByRecordIdWithoutThrow(recordId);
    return attachment;
  }

  findByIds(ids: Attachments['id'][]) {
    return this.attachmentsRepository.findByIds(ids);
  }

  async update(
    id: Attachments['id'],
    updateAttachmentsDto: UpdateAttachmentsDto,
    causer: User,
  ) {
    const attachment = await this.findById(id);
    const partialAttachment: Partial<Attachments> = new Attachments();

    if (!attachment) throw new NotFoundException('Attachment does not exist!');

    Object.assign(partialAttachment, updateAttachmentsDto);
    if (updateAttachmentsDto.file_path) {
      const mimeTypeResult = await getFileTypeFromURL(
        updateAttachmentsDto.file_path,
      );
      const finalFileName = basename(updateAttachmentsDto.file_path);

      const mimeType = mimeTypeResult ? mimeTypeResult : null;
      if (!mimeType)
        throw new UnprocessableEntityException('Attachment type not found');

      const finalFileType = mimeToFileTypeMap[mimeType];

      partialAttachment.file_name = finalFileName;
      partialAttachment.file_type = finalFileType;
    }
    partialAttachment.updated_by = causer;

    await this.attachmentsRepository.update(id, partialAttachment);

    return this.findById(attachment.id);
  }

  async remove(id: Attachments['id'], causer: User) {
    const attachments = await this.findById(id);

    if (!attachments)
      throw new NotFoundException('Attachments does not exist!');

    return this.attachmentsRepository.remove(id, causer);
  }

  async bulkRemove(ids: string, causer: User) {
    const idList = ids.split(',').map((id) => parseInt(id));
    const attachments = await this.findByIds(idList);

    if (attachments.length === 0) return;

    await this.attachmentsRepository.bulkRemove(attachments, causer);
  }

  async bulkRemoveWithConditions(
    options: Record<string, any>,
    queryRunner?: QueryRunner,
  ) {
    await this.attachmentsRepository.bulkRemoveWithConditions(
      options,
      queryRunner,
    );
  }
}
