import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusSeedService } from '@/database/seeds/status/status-seed.service';
import { StatusEntity } from '@/statuses/persistence/entities/status.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StatusEntity])],
  providers: [StatusSeedService],
  exports: [StatusSeedService],
})
export class StatusSeedModule {}
