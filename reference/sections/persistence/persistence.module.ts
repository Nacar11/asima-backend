import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseSectionRepository } from '@/sections/persistence/base-section.repository';
import { SectionRepository } from '@/sections/persistence/repositories/section.repository';
import { SectionEntity } from '@/sections/persistence/entities/section.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SectionEntity])],
  providers: [
    {
      provide: BaseSectionRepository,
      useClass: SectionRepository,
    },
  ],
  exports: [BaseSectionRepository],
})
export class SectionPersistenceModule {}
