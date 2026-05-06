import { FranchiseStatusEventEntity } from '@/franchises/persistence/entities/franchise-status-event.entity';
import { FranchiseStatusEvent } from '@/franchises/domain/franchise-status-event';
import { getCauser } from '@/utils/helpers/entity.helper';

export class FranchiseStatusEventMapper {
  static toDomain(raw: FranchiseStatusEventEntity): FranchiseStatusEvent {
    const domainEntity = new FranchiseStatusEvent();
    Object.assign(domainEntity, raw);

    if (raw.created_by) {
      domainEntity.created_by = getCauser(raw.created_by);
    }

    return domainEntity;
  }

  static toPersistence(
    domainEntity: Partial<FranchiseStatusEvent>,
  ): Partial<FranchiseStatusEventEntity> {
    const persistenceEntity: Partial<FranchiseStatusEventEntity> = {};

    if (domainEntity.franchise_id !== undefined) {
      persistenceEntity.franchise_id = domainEntity.franchise_id;
    }

    if (domainEntity.previous_status !== undefined) {
      persistenceEntity.previous_status = domainEntity.previous_status;
    }

    if (domainEntity.new_status !== undefined) {
      persistenceEntity.new_status = domainEntity.new_status;
    }

    if (domainEntity.description !== undefined) {
      persistenceEntity.description = domainEntity.description;
    }

    return persistenceEntity;
  }
}
