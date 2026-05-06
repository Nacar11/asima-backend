import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseSubSectionRepository } from '@/sub-sections/persistence/base-sub-section.repository';
import { SubSectionRepository } from '@/sub-sections/persistence/repositories/sub-section.repository';
import { SubSectionEntity } from '@/sub-sections/persistence/entities/sub-section.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SubSectionEntity])],
  providers: [
    {
      provide: BaseSubSectionRepository,
      useClass: SubSectionRepository,
    },
  ],
  exports: [BaseSubSectionRepository],
})
export class SubSectionPersistenceModule {}
