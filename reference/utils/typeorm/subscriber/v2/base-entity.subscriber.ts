import { BaseEntityHelper } from '@/utils/typeorm/entity/base.entity';
import { ClsService } from 'nestjs-cls';
import {
  DataSource,
  EntitySubscriberInterface,
  InsertEvent,
  LoadEvent,
  RecoverEvent,
  RemoveEvent,
  SoftRemoveEvent,
  TransactionCommitEvent,
  TransactionRollbackEvent,
  TransactionStartEvent,
  UpdateEvent,
} from 'typeorm';
import type {
  AfterQueryEvent,
  BeforeQueryEvent,
  QueryEvent,
} from 'typeorm/subscriber/event/QueryEvent';

/**
 * Represents all possible lifecycle event types that can occur
 * on an entity within the application.
 */
export type EntityEventType =
  | 'beforeQuery'
  | 'afterQuery'
  | 'afterLoad'
  | 'beforeInsert'
  | 'afterInsert'
  | 'beforeUpdate'
  | 'afterUpdate'
  | 'beforeRemove'
  | 'afterRemove'
  | 'beforeSoftRemove'
  | 'afterSoftRemove'
  | 'beforeRecover'
  | 'afterRecover'
  | 'beforeTransactionStart'
  | 'afterTransactionStart'
  | 'beforeTransactionCommit'
  | 'afterTransactionCommit'
  | 'beforeTransactionRollback'
  | 'afterTransactionRollback';

/**
 * Union type representing all possible event objects that can be passed to
 * the dispatch method of an entity event handler.
 *
 * @template T - The entity type related to the event.
 */
export type EventType<T> =
  | QueryEvent<T>
  | LoadEvent<T>
  | InsertEvent<T>
  | UpdateEvent<T>
  | SoftRemoveEvent<T>
  | RecoverEvent<T>
  | T
  | TransactionStartEvent
  | TransactionCommitEvent
  | TransactionRollbackEvent;

/**
 * Abstract class that defines the structure for entity event handlers.
 *
 * @template T - The entity type the handler applies to.
 */
export abstract class AbstractEntityEvent<T> {
  /**
   * Determines the priority of the event handler.
   * Lower values mean higher priority. Defaults to 0.
   */
  priority?: number = 0;

  /**
   * Specifies which event types the handler should respond to.
   */
  readonly eventTrigger: EntityEventType[] = [];

  /**
   * Dispatch function that performs logic for the specific event.
   *
   * @param eventType - The type of entity event.
   * @param event - The event data.
   */
  abstract dispatch(
    eventType: EntityEventType,
    event: EventType<T>,
  ): Promise<void> | void;

  /**
   * Optional method to determine if the event should be handled.
   * Defaults to true if not overridden.
   *
   * @param event - The event to evaluate.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldDispatch?(event: EventType<T>): boolean {
    return true;
  }
}

/**
 * Base class for subscribing to entity lifecycle events and
 * dispatching them to custom event handlers.
 *
 * @template T - The type of entity this subscriber is for.
 */
export abstract class BaseEntitySubscriber<T extends BaseEntityHelper>
  implements EntitySubscriberInterface
{
  /**
   * Array of event handlers that will be triggered based on event type.
   */
  protected eventHandlers: AbstractEntityEvent<T>[] = [];

  /**
   * Registers this subscriber with the given data source and initializes the CLS service.
   *
   * @param cls - Context Local Storage (CLS) service to access scoped values like current user.
   * @param dataSource - The database data source to attach this subscriber to.
   */
  constructor(
    protected readonly cls: ClsService,
    dataSource: DataSource,
  ) {
    dataSource.subscribers.push(this);
  }

  /** Dispatches 'afterLoad' event to handlers */
  async afterLoad(entity: T) {
    await this.dispatchEvents('afterLoad', entity);
  }

  /** Dispatches 'beforeQuery' event to handlers */
  async beforeQuery(event: BeforeQueryEvent<T>) {
    await this.dispatchEvents('beforeQuery', event);
  }

  /** Dispatches 'afterQuery' event to handlers */
  async afterQuery(event: AfterQueryEvent<T>) {
    await this.dispatchEvents('afterQuery', event);
  }

  /**
   * Sets created_by and updated_by fields before insertion if a current user exists,
   * then dispatches 'beforeInsert' event.
   */
  async beforeInsert(event: InsertEvent<T>) {
    const currentUser = this.cls.get('currentUser');
    if (currentUser) {
      event.entity.created_by = currentUser;
      event.entity.updated_by = currentUser;
    }

    await this.dispatchEvents('beforeInsert', event);
  }

  /** Dispatches 'afterInsert' event to handlers */
  async afterInsert(event: InsertEvent<T>) {
    await this.dispatchEvents('afterInsert', event);
  }

  /** Dispatches 'beforeUpdate' event to handlers */
  async beforeUpdate(event: UpdateEvent<T>) {
    const currentUser = this.cls.get('currentUser');
    if (currentUser && event.entity) {
      event.entity.updated_by = currentUser;
    }
    await this.dispatchEvents('beforeUpdate', event);
  }

  /** Dispatches 'afterUpdate' event to handlers */
  async afterUpdate(event: UpdateEvent<T>) {
    await this.dispatchEvents('afterUpdate', event);
  }

  /** Dispatches 'beforeRemove' event to handlers */
  async beforeRemove(event: RemoveEvent<T>) {
    await this.dispatchEvents('beforeRemove', event);
  }

  /** Dispatches 'afterRemove' event to handlers */
  async afterRemove(event: RemoveEvent<T>) {
    await this.dispatchEvents('afterRemove', event);
  }

  /** Dispatches 'beforeSoftRemove' event to handlers */
  async beforeSoftRemove(event: SoftRemoveEvent<T>) {
    const currentUser = this.cls.get('currentUser');
    if (currentUser && event.entity) {
      event.entity.deleted_by = currentUser;
    }
    await this.dispatchEvents('beforeSoftRemove', event);
  }

  /** Dispatches 'afterSoftRemove' event to handlers */
  async afterSoftRemove(event: SoftRemoveEvent<T>) {
    await this.dispatchEvents('afterSoftRemove', event);
  }

  /** Dispatches 'beforeRecover' event to handlers */
  async beforeRecover(event: RecoverEvent<T>) {
    await this.dispatchEvents('beforeRecover', event);
  }

  /** Dispatches 'afterRecover' event to handlers */
  async afterRecover(event: RecoverEvent<T>) {
    await this.dispatchEvents('afterRecover', event);
  }

  /** Dispatches 'beforeTransactionStart' event to handlers */
  async beforeTransactionStart(event: TransactionStartEvent) {
    await this.dispatchEvents('beforeTransactionStart', event);
  }

  /** Dispatches 'afterTransactionStart' event to handlers */
  async afterTransactionStart(event: TransactionStartEvent) {
    await this.dispatchEvents('afterTransactionStart', event);
  }

  /** Dispatches 'beforeTransactionCommit' event to handlers */
  async beforeTransactionCommit(event: TransactionCommitEvent) {
    await this.dispatchEvents('beforeTransactionCommit', event);
  }

  /** Dispatches 'afterTransactionCommit' event to handlers */
  async afterTransactionCommit(event: TransactionCommitEvent) {
    await this.dispatchEvents('afterTransactionCommit', event);
  }

  /** Dispatches 'beforeTransactionRollback' event to handlers */
  async beforeTransactionRollback(event: TransactionRollbackEvent) {
    await this.dispatchEvents('beforeTransactionRollback', event);
  }

  /** Dispatches 'afterTransactionRollback' event to handlers */
  async afterTransactionRollback(event: TransactionRollbackEvent) {
    await this.dispatchEvents('afterTransactionRollback', event);
  }

  /**
   * Internal method that dispatches the given event type to all
   * matching handlers in order of priority.
   *
   * @param type - The type of entity event being dispatched.
   * @param event - The event object to pass to handlers.
   */
  private async dispatchEvents(type: EntityEventType, event: EventType<T>) {
    const applicableHandlers = this.eventHandlers
      .filter(
        (handler) =>
          handler.eventTrigger.includes(type) &&
          (handler.shouldDispatch?.(event) ?? true),
      )
      .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

    for (const handler of applicableHandlers) {
      await handler.dispatch(type, event);
    }
  }
}
