import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
} from 'typeorm';
import { BaseMasterEntitySubscriber } from '@/utils/typeorm/subscriber/base-master-entity.subscriber';
import { CompanyEntity } from '@/companies/persistence/entities/company.entity';
import { ClsService } from 'nestjs-cls';

@EventSubscriber()
export class CompanySubscriber
  extends BaseMasterEntitySubscriber
  implements EntitySubscriberInterface<CompanyEntity>
{
  listenTo() {
    return CompanyEntity;
  }

  constructor(cls: ClsService, dataSource: DataSource) {
    super(cls, dataSource);
  }
}
