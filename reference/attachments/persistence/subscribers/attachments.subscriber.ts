import { StatusEnum } from '@/attachments/attachments.enum';
import { AttachmentsEntity } from '@/attachments/persistence/entities/attachments.entity';
import { BaseWithStatusEntitySubscriber } from '@/utils/typeorm/subscriber/base-with-status-entity.subscriber';
import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { DataSource, EventSubscriber } from 'typeorm';

@Injectable()
@EventSubscriber()
export class AttachmentSubscriber extends BaseWithStatusEntitySubscriber<
  AttachmentsEntity,
  StatusEnum
> {
  listenTo() {
    return AttachmentsEntity;
  }

  constructor(cls: ClsService, dataSource: DataSource) {
    super(cls, dataSource);
  }

  protected getInitialStatus(): StatusEnum {
    return StatusEnum.ACTIVE;
  }

  protected getCancelledStatus(): StatusEnum {
    return StatusEnum.CANCELLED;
  }
}
