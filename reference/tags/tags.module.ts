import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { TagPersistenceModule } from './persistence/persistence.module';

@Module({
  imports: [TagPersistenceModule],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService, TagPersistenceModule],
})
export class TagsModule {}
