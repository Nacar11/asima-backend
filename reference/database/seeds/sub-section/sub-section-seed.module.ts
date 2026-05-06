import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubSectionEntity } from '@/sub-sections/persistence/entities/sub-section.entity';
import { SubSectionSeedService } from '@/database/seeds/sub-section/sub-section-seed.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, SubSectionEntity])],
  providers: [SubSectionSeedService],
  exports: [SubSectionSeedService],
})
export class SubSectionSeedModule {}
