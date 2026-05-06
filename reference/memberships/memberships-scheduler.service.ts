import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { MembershipEntity } from '@/memberships/persistence/entities/membership.entity';
import { MembershipStatusEnum } from '@/memberships/enums/membership-status.enum';
import { NotificationTypeEnum } from '@/notifications/enums/notification-type.enum';
import { ParametersService } from '@/parameters/parameters.service';
import { MailService } from '@/mail/mail.service';

@Injectable()
export class MembershipsSchedulerService {
  private readonly logger = new Logger(MembershipsSchedulerService.name);

  constructor(
    @InjectRepository(MembershipEntity)
    private readonly membershipRepository: Repository<MembershipEntity>,
    private readonly parametersService: ParametersService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Pre-expiry notification: fire exactly once per membership on the day
   * that is `auto_renewal_days_before_expiration` days before its `ends_at`.
   *
   * Window is matched via DATE(ends_at) = DATE(now + N_days). The cron runs
   * daily, so each membership hits this condition exactly once.
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendPreExpiryNotifications(): Promise<void> {
    this.logger.log('Starting pre-expiry notification check...');
    const autoRenewalParam = await this.parametersService.findByCode(
      'auto_renewal_days_before_expiration',
    );
    const daysBefore: number = Math.round(autoRenewalParam?.numeric_value ?? 3);

    const target = new Date(Date.now() + daysBefore * 86_400_000);
    const memberships = await this.membershipRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.user', 'u')
      .where('m.status = :status', { status: MembershipStatusEnum.ACTIVE })
      .andWhere('DATE(m.ends_at) = DATE(:target)', { target })
      .select(['m.id', 'm.user_id', 'm.ends_at', 'u.email', 'u.first_name', 'u.last_name'])
      .getMany();

    if (memberships.length === 0) {
      this.logger.log('No memberships in pre-expiry notification window.');
      return;
    }

    for (const m of memberships) {
      const userEmail = m.user?.email;
      if (!userEmail) {
        this.logger.warn(`Membership ${m.id} has no user email, skipping.`);
        continue;
      }

      const userName = [m.user?.first_name, m.user?.last_name]
        .filter(Boolean)
        .join(' ') || userEmail;

      const expiryDate = m.ends_at
        ? m.ends_at.toLocaleDateString('en-US', {
            month: 'long',
            day: '2-digit',
            year: 'numeric',
            timeZone: 'Asia/Manila',
          })
        : undefined;

      try {
        await this.mailService.sendNotificationEmail({
          to: userEmail,
          data: {
            userName,
            title: 'Your membership is expiring soon',
            body: `Your membership expires in ${daysBefore} day${daysBefore === 1 ? '' : 's'}. Renew now to keep your benefits.`,
            type: NotificationTypeEnum.MEMBERSHIP_EXPIRING_SOON,
            entityType: 'membership',
            entityId: m.id,
            actionUrl: '/membership',
            expiryDate,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to send pre-expiry email for membership ${m.id}: ${(error as Error)?.message}`,
        );
      }
    }
    this.logger.log(`Sent ${memberships.length} pre-expiry email(s).`);
  }

  /**
   * Transition ACTIVE memberships into GRACE_PERIOD when `ends_at` has passed.
   * Sends a "membership expired — grace remaining" notification.
   * Runs daily at midnight.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async enterGracePeriod(): Promise<void> {
    this.logger.log('Starting grace-period transition check...');
    const now = new Date();

    const entering = await this.membershipRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.user', 'u')
      .where('m.status = :status', { status: MembershipStatusEnum.ACTIVE })
      .andWhere('m.ends_at < :now', { now })
      .select(['m.id', 'm.user_id', 'm.grace_ends_at', 'u.email', 'u.first_name', 'u.last_name'])
      .getMany();

    if (entering.length === 0) {
      this.logger.log('No memberships entering grace period.');
      return;
    }

    const ids = entering.map((m) => m.id);
    await this.membershipRepository.update(ids, {
      status: MembershipStatusEnum.GRACE_PERIOD,
    });
    this.logger.log(
      `Transitioned ${ids.length} membership(s) to GRACE_PERIOD.`,
    );

    for (const membership of entering) {
      const graceDaysLeft = membership.grace_ends_at
        ? Math.max(
            1,
            Math.ceil(
              (membership.grace_ends_at.getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          )
        : 7;

      const graceEndsAt = membership.grace_ends_at
        ? membership.grace_ends_at.toLocaleDateString('en-US', {
            month: 'long',
            day: '2-digit',
            year: 'numeric',
            timeZone: 'Asia/Manila',
          })
        : undefined;

      const userEmail = membership.user?.email;
      if (!userEmail) {
        this.logger.warn(`Membership ${membership.id} has no user email, skipping grace-period email.`);
        continue;
      }

      const userName = [membership.user?.first_name, membership.user?.last_name]
        .filter(Boolean)
        .join(' ') || userEmail;

      try {
        await this.mailService.sendNotificationEmail({
          to: userEmail,
          data: {
            userName,
            title: 'Your membership has expired — grace period active',
            body: `You have ${graceDaysLeft} day${graceDaysLeft === 1 ? '' : 's'} of grace access remaining. Renew now to avoid losing your benefits.`,
            type: NotificationTypeEnum.MEMBERSHIP_GRACE_PERIOD,
            entityType: 'membership',
            entityId: membership.id,
            actionUrl: '/membership',
            graceEndsAt,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to send grace-period email for membership ${membership.id}: ${(error as Error)?.message}`,
        );
      }
    }
  }

  /**
   * Expire GRACE_PERIOD memberships whose `grace_ends_at` has passed.
   * Runs daily at midnight.
   *
   * Note: ACTIVE → EXPIRED is handled by `enterGracePeriod` (ACTIVE becomes
   * GRACE_PERIOD first, then this cron expires it after the grace window).
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireOverdueMemberships(): Promise<void> {
    this.logger.log('Starting membership expiration check...');
    const now = new Date();

    const result = await this.membershipRepository.update(
      {
        status: MembershipStatusEnum.GRACE_PERIOD,
        grace_ends_at: LessThan(now),
      },
      { status: MembershipStatusEnum.EXPIRED },
    );

    this.logger.log(`Expired ${result.affected ?? 0} membership(s).`);
  }

  /**
   * Expire CANCELLED memberships whose `ends_at` has passed.
   * Cancelled members retain access until ends_at; the ~24h window is intentional.
   * Runs daily at midnight.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireCancelledMemberships(): Promise<void> {
    this.logger.log('Starting cancelled membership expiration check...');
    const now = new Date();

    const result = await this.membershipRepository.update(
      {
        status: MembershipStatusEnum.CANCELLED,
        ends_at: LessThan(now),
      },
      { status: MembershipStatusEnum.EXPIRED },
    );

    this.logger.log(
      `Expired ${result.affected ?? 0} cancelled membership(s).`,
    );
  }
}
