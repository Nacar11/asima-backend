import { Module } from '@nestjs/common';
import { ProductTagsService } from './product-tags.service';
import { ProductTagsController } from './product-tags.controller';
import { ProductTagPersistenceModule } from './persistence/persistence.module';
import { TagPersistenceModule } from '@/tags/persistence/persistence.module';

@Module({
  imports: [ProductTagPersistenceModule, TagPersistenceModule],
  controllers: [ProductTagsController],
  providers: [ProductTagsService],
  exports: [ProductTagsService, ProductTagPersistenceModule],
})
export class ProductTagsModule {}
