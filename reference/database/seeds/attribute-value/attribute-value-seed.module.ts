import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributeValueEntity } from '@/attribute-values/persistence/entities/attribute-value.entity';
import { AttributeEntity } from '@/attributes/persistence/entities/attribute.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { AttributeValueSeedService } from './attribute-value-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AttributeValueEntity,
      AttributeEntity,
      UserEntity,
    ]),
  ],
  providers: [AttributeValueSeedService],
  exports: [AttributeValueSeedService],
})
export class AttributeValueSeedModule {}
