import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModerationItemEntity } from '@/moderation/persistence/entities/moderation-item.entity';
import { ContentReportEntity } from '@/moderation/persistence/entities/content-report.entity';
import { ModerationSeedService } from '@/database/seeds/moderation/moderation-seed.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ModerationItemEntity,
      ContentReportEntity,
      UserEntity,
    ]),
  ],
  providers: [ModerationSeedService],
  exports: [ModerationSeedService],
})
export class ModerationSeedModule {}
