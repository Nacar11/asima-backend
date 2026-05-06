import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
} from 'typeorm';
import { BaseMasterEntitySubscriber } from '@/utils/typeorm/subscriber/base-master-entity.subscriber';
import { DocumentSignatoryEntity } from '@/document-signatories/persistence/entities/document-signatory.entity';
import { ClsService } from 'nestjs-cls';

@EventSubscriber()
export class DocumentSignatorySubscriber
  extends BaseMasterEntitySubscriber
  implements EntitySubscriberInterface<DocumentSignatoryEntity>
{
  listenTo() {
    return DocumentSignatoryEntity;
  }

  constructor(cls: ClsService, dataSource: DataSource) {
    super(cls, dataSource);
  }
}
