import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { CheckoutSession } from './entities/checkout-session.entity';
import { User } from '@/users/domain/user';
import { randomBytes } from 'crypto';

@Injectable()
export class CheckoutSessionsService {
  constructor(
    @InjectRepository(CheckoutSession)
    private readonly repository: Repository<CheckoutSession>,
  ) {}

  async create(params: {
    user: User;
    paymentMethodCode: string;
    items: any;
    shippingAddressId?: number;
    billingAddressId?: number;
    totalAmount: number;
  }): Promise<CheckoutSession> {
    const sessionToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2); // 2 hour expiry

    const session = this.repository.create({
      user_id: params.user.id,
      session_token: sessionToken,
      payment_method_code: params.paymentMethodCode,
      items: params.items,
      shipping_address_id: params.shippingAddressId,
      billing_address_id: params.billingAddressId,
      total_amount: params.totalAmount,
      status: 'pending',
      expires_at: expiresAt,
    });

    return await this.repository.save(session);
  }

  async findByToken(token: string): Promise<CheckoutSession | null> {
    return await this.repository.findOne({
      where: { session_token: token },
      relations: ['user', 'shipping_address', 'billing_address'],
    });
  }

  async markAsCompleted(sessionId: number): Promise<void> {
    await this.repository.update(sessionId, { status: 'completed' });
  }

  async markAsCancelled(sessionId: number): Promise<void> {
    await this.repository.update(sessionId, { status: 'cancelled' });
  }

  async cleanupExpiredSessions(): Promise<void> {
    await this.repository.update(
      {
        status: 'pending',
        expires_at: LessThan(new Date()),
      },
      { status: 'expired' },
    );
  }

  async findActivePendingByUser(
    userId: number,
  ): Promise<CheckoutSession | null> {
    return await this.repository.findOne({
      where: {
        user_id: userId,
        status: 'pending',
      },
      order: {
        created_at: 'DESC',
      },
    });
  }
}
