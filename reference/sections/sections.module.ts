import { Module } from '@nestjs/common';
import { SectionsService } from '@/sections/sections.service';
import { SectionsController } from '@/sections/sections.controller';
import { SectionPersistenceModule } from '@/sections/persistence/persistence.module';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [SectionPersistenceModule, UsersModule],
  controllers: [SectionsController],
  providers: [SectionsService],
  exports: [SectionsService, SectionPersistenceModule],
})
export class SectionsModule {}
