import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributeEntity } from '@/attributes/persistence/entities/attribute.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { AttributeSeedService } from './attribute-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AttributeEntity, SellerEntity, UserEntity]),
  ],
  providers: [AttributeSeedService],
  exports: [AttributeSeedService],
})
export class AttributeSeedModule {}
