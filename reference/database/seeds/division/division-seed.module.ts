import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DivisionEntity } from '@/divisions/persistence/entities/division.entity';
import { DivisionSeedService } from '@/database/seeds/division/division-seed.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, DivisionEntity])],
  providers: [DivisionSeedService],
  exports: [DivisionSeedService],
})
export class DivisionSeedModule {}
