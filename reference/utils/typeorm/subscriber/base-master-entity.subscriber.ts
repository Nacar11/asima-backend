import { MasterStatusEnum } from '@/utils/enums/status-enum';
import { BaseMasterEntityHelper } from '@/utils/typeorm/entity/base-master.entity';
import { BaseWithStatusEntitySubscriber } from '@/utils/typeorm/subscriber/base-with-status-entity.subscriber';
import { Injectable } from '@nestjs/common';

/**
 * Subscriber for `BaseMasterEntityHelper` entities.
 * This class listens for insert, update, and remove events to set status values (e.g., ACTIVE, CANCELLED)
 * and track the user responsible for the changes.
 *
 * @extends BaseEntitySubscriber<BaseMasterEntityHelper>
 * @implements {EntitySubscriberInterface<BaseMasterEntityHelper>}
 */
@Injectable()
export abstract class BaseMasterEntitySubscriber extends BaseWithStatusEntitySubscriber<
  BaseMasterEntityHelper,
  MasterStatusEnum
> {
  /**
   * Returns the initial status for master entities.
   * Defaults to `ACTIVE`.
   *
   * @returns {MasterStatusEnum} - The initial status of the entity.
   */
  protected getInitialStatus(): MasterStatusEnum {
    return MasterStatusEnum.ACTIVE;
  }

  /**
   * Returns the cancelled status for master entities.
   * Defaults to `CANCELLED`.
   *
   * @returns {MasterStatusEnum} - The cancelled status of the entity.
   */
  protected getCancelledStatus(): MasterStatusEnum {
    return MasterStatusEnum.CANCELLED;
  }
}
