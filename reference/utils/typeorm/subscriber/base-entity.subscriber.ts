import { BaseEntityHelper } from '@/utils/typeorm/entity/base.entity';
import { ClsService } from 'nestjs-cls';
import { DataSource, InsertEvent, SoftRemoveEvent, UpdateEvent } from 'typeorm';

type SubscriberConstructor = {
  new (...args: any[]): any;
  _registeredDataSources?: WeakSet<DataSource>;
};
/**
 * Abstract base class for handling entity lifecycle events related to `BaseMasterEntityHelper` or `BaseTransactionalEntityHelper`.
 * This class manages setting the status of an entity before insert, update, or removal events.
 * It also tracks the user responsible for the changes, including who created, updated, or deleted the entity.
 *
 * @template T - The type of entity the subscriber will handle, either `BaseMasterEntityHelper` or `BaseTransactionalEntityHelper`.
 */
export abstract class BaseEntitySubscriber<T extends BaseEntityHelper> {
  private static getRegistry(
    subclass: SubscriberConstructor,
  ): WeakSet<DataSource> {
    if (!subclass._registeredDataSources) {
      subclass._registeredDataSources = new WeakSet<DataSource>();
    }
    return subclass._registeredDataSources;
  }

  /**
   * Creates an instance of `BaseEntitySubscriber`.
   *
   * @param cls - The ClsService for accessing the current user's context.
   * @param dataSource - The data source to which this subscriber is attached.
   */
  constructor(
    protected readonly cls: ClsService,
    protected readonly dataSource: DataSource,
  ) {
    // Cast this.constructor to SubscriberConstructor for type safety
    const registry = BaseEntitySubscriber.getRegistry(
      this.constructor as SubscriberConstructor,
    );
    if (!registry.has(dataSource)) {
      dataSource.subscribers.push(this);
      registry.add(dataSource);
    }
  }

  /**
   * Lifecycle event triggered before an entity is inserted into the database.
   * Sets the initial status, created_by, and updated_by fields.
   *
   * @param event - The insert event containing the entity to be inserted.
   */
  beforeInsert(event: InsertEvent<T>) {
    const currentUser = this.cls.get('currentUser');
    if (currentUser) {
      event.entity.created_by = currentUser;
      event.entity.updated_by = currentUser;
    }
  }

  /**
   * Lifecycle event triggered before an entity is updated in the database.
   * Sets the updated_by field to the current user.
   *
   * @param event - The update event containing the entity to be updated.
   */
  beforeUpdate(event: UpdateEvent<T>) {
    const currentUser = this.cls.get('currentUser');
    if (currentUser && event.entity) {
      event.entity.updated_by = currentUser;
    }
  }

  /**
   * Lifecycle event triggered before an entity is soft remove in the database.
   * Sets the cancelled status and deleted_by field to the current user.
   *
   * @param event - The soft remove event containing the entity to be soft removed.
   */
  async beforeSoftRemove(event: SoftRemoveEvent<T>) {
    const currentUser = this.cls.get('currentUser');
    if (currentUser && event.entity) {
      event.entity.deleted_by = currentUser;
      // If you need to save the changes explicitly
      await event.manager.save(event.entity);
    }
  }
}
