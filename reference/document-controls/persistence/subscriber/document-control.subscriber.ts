import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
} from 'typeorm';
import { BaseMasterEntitySubscriber } from '@/utils/typeorm/subscriber/base-master-entity.subscriber';
import { DocumentControlEntity } from '@/document-controls/persistence/entities/document-control.entity';
import { ClsService } from 'nestjs-cls';

@EventSubscriber()
export class DocumentControlSubscriber
  extends BaseMasterEntitySubscriber
  implements EntitySubscriberInterface<DocumentControlEntity>
{
  listenTo() {
    return DocumentControlEntity;
  }

  constructor(cls: ClsService, dataSource: DataSource) {
    super(cls, dataSource);
  }
}
