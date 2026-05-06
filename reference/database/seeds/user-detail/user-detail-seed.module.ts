import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDetailEntity } from '@/user-details/persistence/entities/user-detail.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { UserDetailSeedService } from './user-detail-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserDetailEntity, UserEntity])],
  providers: [UserDetailSeedService],
  exports: [UserDetailSeedService],
})
export class UserDetailSeedModule {}
