import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagEntity } from './entities/tag.entity';
import { TagRepository } from './repositories/tag.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TagEntity])],
  providers: [TagRepository],
  exports: [TagRepository, TypeOrmModule],
})
export class TagPersistenceModule {}
