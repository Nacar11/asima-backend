import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ProductionUserSeedService } from './production-user-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [ProductionUserSeedService],
  exports: [ProductionUserSeedService],
})
export class ProductionUserSeedModule {}
