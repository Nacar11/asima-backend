import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModerationItemEntity } from './entities/moderation-item.entity';
import { ModerationActionEntity } from './entities/moderation-action.entity';
import { ContentReportEntity } from './entities/content-report.entity';
import { ModerationItemRepository } from './repositories/moderation-item.repository';
import { ModerationActionRepository } from './repositories/moderation-action.repository';
import { ContentReportRepository } from './repositories/content-report.repository';
import { BaseModerationItemRepository } from './base-moderation-item.repository';
import { BaseContentReportRepository } from './base-content-report.repository';

/**
 * Persistence module for moderation.
 *
 * Registers TypeORM entities and provides repository implementations.
 *
 * @version 1
 * @since 1.0.0
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ModerationItemEntity,
      ModerationActionEntity,
      ContentReportEntity,
    ]),
  ],
  providers: [
    ModerationItemRepository,
    ModerationActionRepository,
    ContentReportRepository,
    {
      provide: BaseModerationItemRepository,
      useClass: ModerationItemRepository,
    },
    {
      provide: BaseContentReportRepository,
      useClass: ContentReportRepository,
    },
  ],
  exports: [
    BaseModerationItemRepository,
    BaseContentReportRepository,
    ModerationActionRepository,
  ],
})
export class ModerationPersistenceModule {}
