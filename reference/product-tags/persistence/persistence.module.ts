import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductTagEntity } from './entities/product-tag.entity';
import { ProductTagRepository } from './repositories/product-tag.repository';
import { TagPersistenceModule } from '@/tags/persistence/persistence.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProductTagEntity]), TagPersistenceModule],
  providers: [ProductTagRepository],
  exports: [ProductTagRepository, TypeOrmModule],
})
export class ProductTagPersistenceModule {}
