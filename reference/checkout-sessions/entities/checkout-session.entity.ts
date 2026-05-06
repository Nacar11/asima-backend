import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';

@Entity('checkout_sessions')
export class CheckoutSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ unique: true })
  session_token: string;

  @Column()
  payment_method_code: string;

  @Column('jsonb')
  items: any;

  @Column({ nullable: true })
  shipping_address_id?: number;

  @ManyToOne(() => UserAddressEntity, { nullable: true })
  @JoinColumn({ name: 'shipping_address_id' })
  shipping_address?: UserAddressEntity;

  @Column({ nullable: true })
  billing_address_id?: number;

  @ManyToOne(() => UserAddressEntity, { nullable: true })
  @JoinColumn({ name: 'billing_address_id' })
  billing_address?: UserAddressEntity;

  @Column('decimal', { precision: 10, scale: 2 })
  total_amount: number;

  @Column({ default: 'pending' })
  status: string; // pending, completed, expired, cancelled

  @Column()
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
