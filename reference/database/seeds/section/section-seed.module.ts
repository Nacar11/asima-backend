import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SectionEntity } from '@/sections/persistence/entities/section.entity';
import { SectionSeedService } from '@/database/seeds/section/section-seed.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, SectionEntity])],
  providers: [SectionSeedService],
  exports: [SectionSeedService],
})
export class SectionSeedModule {}
