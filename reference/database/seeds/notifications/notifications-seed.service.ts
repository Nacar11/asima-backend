import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '@/notifications/persistence/entities/notification.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ISeedService } from '../seed.interface';

/**
 * Service for seeding notifications
 */
@Injectable()
export class NotificationsSeedService implements ISeedService {
  constructor(
    @InjectRepository(NotificationEntity)
    private repository: Repository<NotificationEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const count = await this.repository.count();

    if (!count) {
      const users = await this.userRepository.find({ take: 3 });

      if (users.length === 0) {
        console.log('⚠️  No users found. Skipping notifications seed.');
        return;
      }

      const notifications = [
        {
          user_id: users[0].id,
          type: 'booking_confirmed',
          title: 'Booking Confirmed',
          body: 'Your booking has been confirmed by the service provider.',
          entity_type: 'booking',
          entity_id: 1,
          action_url: '/bookings/1',
          read_at: null,
          push_sent: false,
        },
        {
          user_id: users[0].id,
          type: 'milestone_approved',
          title: 'Milestone Approved',
          body: 'Your milestone has been approved. Payment will be released soon.',
          entity_type: 'booking_milestone',
          entity_id: 1,
          action_url: '/bookings/1/milestones',
          read_at: null,
          push_sent: false,
        },
        {
          user_id: users[0].id,
          type: 'payment_received',
          title: 'Payment Received',
          body: 'Your payment has been successfully processed.',
          entity_type: 'checkout_payment',
          entity_id: 1,
          action_url: '/payments/1',
          read_at: new Date(),
          push_sent: true,
          push_sent_at: new Date(),
        },
      ];

      await this.repository.save(
        notifications.map((notification) =>
          this.repository.create(notification),
        ),
      );

      console.log(
        `✅ ${notifications.length} notifications seeded successfully`,
      );
    }
  }
}
