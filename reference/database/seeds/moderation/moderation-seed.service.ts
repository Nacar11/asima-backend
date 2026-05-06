import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ISeedService } from '../seed.interface';
import { Repository } from 'typeorm';
import { ModerationItemEntity } from '@/moderation/persistence/entities/moderation-item.entity';
import { ContentReportEntity } from '@/moderation/persistence/entities/content-report.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ContentTypeEnum } from '@/moderation/enums/content-type.enum';
import { ModerationStatusEnum } from '@/moderation/enums/moderation-status.enum';
import { ModerationPriorityEnum } from '@/moderation/enums/moderation-priority.enum';
import { ReportStatusEnum } from '@/moderation/enums/report-status.enum';

@Injectable()
export class ModerationSeedService implements ISeedService {
  constructor(
    @InjectRepository(ModerationItemEntity)
    private moderationItemRepository: Repository<ModerationItemEntity>,
    @InjectRepository(ContentReportEntity)
    private contentReportRepository: Repository<ContentReportEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    try {
      const moderationCount = await this.moderationItemRepository.count();
      const reportCount = await this.contentReportRepository.count();

      // Get users for seeding
      const users = await this.userRepository.find({
        order: { id: 'ASC' },
        take: 10,
      });

      if (users.length === 0) {
        console.warn('⚠️  No users found. Skipping moderation seed.');
        return;
      }

      // Get admin user for reviewer
      const adminUser = await this.userRepository.findOne({
        where: { system_admin: true },
      });

      // Seed moderation items if none exist
      if (!moderationCount) {
        const moderationItems: Partial<ModerationItemEntity>[] = [
          {
            content_type: ContentTypeEnum.SERVICE,
            content_id: 1,
            reported_by: users[0]?.id || null,
            reported_reason: 'Spam or misleading',
            status: ModerationStatusEnum.PENDING,
            priority: ModerationPriorityEnum.HIGH,
            reviewed_by: null,
            reviewed_at: null,
            admin_notes: null,
          },
          {
            content_type: ContentTypeEnum.REVIEW,
            content_id: 1,
            reported_by: users[1]?.id || null,
            reported_reason: 'Inappropriate language',
            status: ModerationStatusEnum.PENDING,
            priority: ModerationPriorityEnum.MEDIUM,
            reviewed_by: null,
            reviewed_at: null,
            admin_notes: null,
          },
          {
            content_type: ContentTypeEnum.MESSAGE,
            content_id: 1,
            reported_by: users[2]?.id || null,
            reported_reason: 'Harassment',
            status: ModerationStatusEnum.APPROVED,
            priority: ModerationPriorityEnum.URGENT,
            reviewed_by: adminUser?.id || null,
            reviewed_at: new Date(),
            admin_notes: 'Content reviewed and approved. No violations found.',
          },
          {
            content_type: ContentTypeEnum.PROFILE,
            content_id: 1,
            reported_by: users[0]?.id || null,
            reported_reason: 'Fake profile',
            status: ModerationStatusEnum.REJECTED,
            priority: ModerationPriorityEnum.HIGH,
            reviewed_by: adminUser?.id || null,
            reviewed_at: new Date(),
            admin_notes: 'Profile verified as legitimate. Report rejected.',
          },
          {
            content_type: ContentTypeEnum.IMAGE,
            content_id: 1,
            reported_by: users[1]?.id || null,
            reported_reason: 'Inappropriate content',
            status: ModerationStatusEnum.FLAGGED,
            priority: ModerationPriorityEnum.URGENT,
            reviewed_by: adminUser?.id || null,
            reviewed_at: new Date(),
            admin_notes:
              'Flagged for supervisor review due to sensitive content.',
          },
          {
            content_type: ContentTypeEnum.SERVICE,
            content_id: 2,
            reported_by: users[2]?.id || null,
            reported_reason: 'Spam or misleading',
            status: ModerationStatusEnum.PENDING,
            priority: ModerationPriorityEnum.LOW,
            reviewed_by: null,
            reviewed_at: null,
            admin_notes: null,
          },
          {
            content_type: ContentTypeEnum.REVIEW,
            content_id: 2,
            reported_by: users[0]?.id || null,
            reported_reason: 'Spam or misleading',
            status: ModerationStatusEnum.PENDING,
            priority: ModerationPriorityEnum.MEDIUM,
            reviewed_by: null,
            reviewed_at: null,
            admin_notes: null,
          },
        ];

        await this.moderationItemRepository.save(moderationItems);
        console.log(
          `✅ ${moderationItems.length} moderation items seeded successfully`,
        );
      } else {
        console.log('⚠️  Moderation items already exist, skipping seed');
      }

      // Seed content reports if none exist
      if (!reportCount) {
        const contentReports: Partial<ContentReportEntity>[] = [
          {
            content_type: ContentTypeEnum.SERVICE,
            content_id: 1,
            reported_by: users[0]?.id || 1,
            reason: 'Spam or misleading',
            details: 'This service description contains false information',
            status: ReportStatusEnum.PENDING,
          },
          {
            content_type: ContentTypeEnum.REVIEW,
            content_id: 1,
            reported_by: users[1]?.id || 1,
            reason: 'Inappropriate language',
            details: 'Review contains offensive language',
            status: ReportStatusEnum.PENDING,
          },
          {
            content_type: ContentTypeEnum.MESSAGE,
            content_id: 1,
            reported_by: users[2]?.id || 1,
            reason: 'Harassment',
            details: 'Message contains harassing content',
            status: ReportStatusEnum.PENDING,
          },
          {
            content_type: ContentTypeEnum.PROFILE,
            content_id: 1,
            reported_by: users[0]?.id || 1,
            reason: 'Fake profile',
            details: 'Profile appears to be fake or impersonating',
            status: ReportStatusEnum.PENDING,
          },
          {
            content_type: ContentTypeEnum.IMAGE,
            content_id: 1,
            reported_by: users[1]?.id || 1,
            reason: 'Inappropriate content',
            details: 'Image contains inappropriate or offensive content',
            status: ReportStatusEnum.PENDING,
          },
        ];

        await this.contentReportRepository.save(contentReports);
        console.log(
          `✅ ${contentReports.length} content reports seeded successfully`,
        );
      } else {
        console.log('⚠️  Content reports already exist, skipping seed');
      }
    } catch (error) {
      console.error('❌ Error seeding moderation data:', error);
      throw error;
    }
  }
}
