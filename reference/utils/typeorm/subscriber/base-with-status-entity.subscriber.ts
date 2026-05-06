import { BaseEntityHelper } from '@/utils/typeorm/entity/base.entity';
import { BaseEntitySubscriber } from '@/utils/typeorm/subscriber/base-entity.subscriber';
import { InsertEvent, SoftRemoveEvent } from 'typeorm';

export abstract class BaseWithStatusEntitySubscriber<
  Entity extends BaseEntityHelper & { status: StatusEnum },
  StatusEnum,
> extends BaseEntitySubscriber<Entity> {
  /**
   * Abstract method to get the initial status of an entity.
   * Should be implemented by subclasses to return the appropriate initial status.
   *
   * @returns {StatusEnum} - The initial status of the entity.
   */
  protected abstract getInitialStatus(): StatusEnum;

  /**
   * Abstract method to get the cancelled status of an entity.
   * Should be implemented by subclasses to return the appropriate cancelled status.
   *
   * @returns {StatusEnum} - The cancelled status of the entity.
   */
  protected abstract getCancelledStatus(): StatusEnum;

  /**
   * Lifecycle event triggered before an entity is inserted into the database.
   * Sets the initial status, created_by, and updated_by fields.
   *
   * @param event - The insert event containing the entity to be inserted.
   */
  async beforeInsert(event: InsertEvent<Entity>) {
    await super.beforeInsert(event);
    if (!event.entity.status) event.entity.status = this.getInitialStatus();
  }

  /**
   * Lifecycle event triggered before an entity is soft remove in the database.
   * Sets the cancelled status and deleted_by field to the current user.
   *
   * @param event - The soft remove event containing the entity to be soft removed.
   */
  async beforeSoftRemove(event: SoftRemoveEvent<Entity>) {
    await super.beforeSoftRemove(event);

    if (event.entity) {
      event.entity.status = this.getInitialStatus();
    }
  }
}
