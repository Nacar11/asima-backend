import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributeEntity } from './entities/attribute.entity';
import { AttributeRepository } from './repositories/attribute.repository';
import { BaseAttributeRepository } from './repositories/base-attribute.repository';
import { AttributeMapper } from './mappers/attribute.mapper';
import { AttributeValueEntity } from '@/attribute-values/persistence/entities/attribute-value.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AttributeEntity, AttributeValueEntity])],
  providers: [
    AttributeRepository,
    {
      provide: BaseAttributeRepository,
      useClass: AttributeRepository,
    },
    AttributeMapper,
  ],
  exports: [BaseAttributeRepository, AttributeRepository, AttributeMapper],
})
export class AttributePersistenceModule {}
