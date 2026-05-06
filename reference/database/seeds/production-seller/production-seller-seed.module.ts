import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionSellerSeedService } from './production-seller-seed.service';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SellerEntity,
      UserEntity,
      UserAssignmentEntity,
      UserGroupEntity,
    ]),
  ],
  providers: [ProductionSellerSeedService],
  exports: [ProductionSellerSeedService],
})
export class ProductionSellerSeedModule {}
