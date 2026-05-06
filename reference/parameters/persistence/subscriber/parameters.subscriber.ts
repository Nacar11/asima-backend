import {
  EventSubscriber,
  EntitySubscriberInterface,
  DataSource,
} from 'typeorm';
import { BaseMasterEntitySubscriber } from '@/utils/typeorm/subscriber/base-master-entity.subscriber';
import { ParameterEntity } from '@/parameters/persistence/entities/parameter.entity';
import { ClsService } from 'nestjs-cls';

@EventSubscriber()
export class ParametersSubscriber
  extends BaseMasterEntitySubscriber
  implements EntitySubscriberInterface<ParameterEntity>
{
  listenTo() {
    return ParameterEntity;
  }
  constructor(cls: ClsService, dataSource: DataSource) {
    super(cls, dataSource);
  }
}
