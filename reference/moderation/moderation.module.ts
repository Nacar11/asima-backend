import { Module } from '@nestjs/common';
import { ModerationPersistenceModule } from '@/moderation/persistence/persistence.module';
import { ModerationService } from '@/moderation/moderation.service';
import { ModerationController } from '@/moderation/moderation.controller';

/**
 * Moderation Module.
 *
 * Orchestrates all components of the content moderation system.
 *
 * @version 1
 * @since 1.0.0
 */
@Module({
  imports: [ModerationPersistenceModule],
  controllers: [ModerationController],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
