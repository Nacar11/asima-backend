import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FranchiseEntity } from '@/franchises/persistence/entities/franchise.entity';
import { FranchiseStatusEventEntity } from '@/franchises/persistence/entities/franchise-status-event.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { FranchiseSeedService } from './franchise-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FranchiseEntity,
      FranchiseStatusEventEntity,
      UserEntity,
    ]),
  ],
  providers: [FranchiseSeedService],
  exports: [FranchiseSeedService],
})
export class FranchiseSeedModule {}
