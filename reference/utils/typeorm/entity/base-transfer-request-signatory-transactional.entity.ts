import { UserEntity } from '@/users/persistence/entities/user.entity';
import { BaseTransactionalEntityHelper } from '@/utils/typeorm/entity/base-transactional.entity';
import { JoinColumn, ManyToOne } from 'typeorm';

export abstract class BaseTransferRequestSignatoryTransactionalEntityHelper extends BaseTransactionalEntityHelper {
  @ManyToOne(() => UserEntity, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
    cascade: false,
  })
  @JoinColumn({ name: 'reviewed_by' })
  reviewed_by?: UserEntity | null;

  @ManyToOne(() => UserEntity, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
    cascade: false,
  })
  @JoinColumn({ name: 'approved_by' })
  approved_by?: UserEntity | null;
}
