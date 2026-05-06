import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { BookingMilestoneEntity } from './persistence/entities/booking-milestone.entity';
import { MilestoneStatusEnum } from './enums/milestone-status.enum';

/**
 * Scheduler service for automated booking milestone tasks.
 *
 * Handles auto-approval of submitted milestones based on the
 * auto_approve_after_hours threshold configured in the service template.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class BookingMilestonesSchedulerService {
  private readonly logger = new Logger(BookingMilestonesSchedulerService.name);

  constructor(
    @InjectRepository(BookingMilestoneEntity)
    private readonly milestoneRepository: Repository<BookingMilestoneEntity>,
  ) {}

  /**
   * Auto-approve submitted milestones after the threshold period.
   *
   * Runs every hour to check for milestones that have been submitted
   * for longer than their auto_approve_after_hours threshold.
   *
   * @returns Number of milestones auto-approved
   */
  @Cron(CronExpression.EVERY_HOUR)
  async autoApproveMilestones(): Promise<number> {
    this.logger.log('Starting milestone auto-approval job...');

    try {
      const now = new Date();

      // Find milestones that are:
      // 1. Status = SUBMITTED
      // 2. Have submitted_at set
      // 3. submitted_at + auto_approve_after_hours < now
      const milestonesToApprove = await this.milestoneRepository
        .createQueryBuilder('milestone')
        .leftJoinAndSelect('milestone.booking', 'booking')
        .where('milestone.status = :status', {
          status: MilestoneStatusEnum.SUBMITTED,
        })
        .andWhere('milestone.submitted_at IS NOT NULL')
        .andWhere('milestone.deleted_at IS NULL')
        .andWhere(
          `milestone.submitted_at + (milestone.auto_approve_after_hours || ' hours')::interval < :now`,
          { now },
        )
        .getMany();

      if (milestonesToApprove.length === 0) {
        this.logger.log('No milestones to auto-approve.');
        return 0;
      }

      this.logger.log(
        `Found ${milestonesToApprove.length} milestones to auto-approve.`,
      );

      let approvedCount = 0;

      for (const milestone of milestonesToApprove) {
        try {
          // Update milestone to approved status
          await this.milestoneRepository.update(milestone.id, {
            status: MilestoneStatusEnum.APPROVED,
            approved_at: now,
            auto_approved: true,
            approved_by: null, // System auto-approval has no user
          });

          // Mark milestone payment as released directly
          // Note: Escrow release requires user context; for auto-approval,
          // we mark payment_released=true and the escrow service can be
          // triggered separately via admin action or background job
          if (milestone.booking_id && milestone.payment_amount > 0) {
            await this.milestoneRepository.update(milestone.id, {
              payment_released: true,
              payment_released_at: now,
            });
            this.logger.log(
              `Marked payment released for milestone ${milestone.id} (amount: ${milestone.payment_amount})`,
            );
          }

          approvedCount++;
          this.logger.log(
            `Auto-approved milestone #${milestone.id} (${milestone.name}) for booking #${milestone.booking_id}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to auto-approve milestone ${milestone.id}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Auto-approval job finished. ${approvedCount} milestones approved.`,
      );

      return approvedCount;
    } catch (error) {
      this.logger.error('Error in milestone auto-approval job:', error);
      return 0;
    }
  }

  /**
   * Get count of milestones pending auto-approval.
   *
   * Useful for monitoring and admin dashboards.
   *
   * @returns Number of milestones that will be auto-approved soon
   */
  async getPendingAutoApprovalCount(): Promise<number> {
    return this.milestoneRepository.count({
      where: {
        status: MilestoneStatusEnum.SUBMITTED,
        deleted_at: IsNull(),
      },
    });
  }
}
