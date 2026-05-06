import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '@/storage/storage.module';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { EdistrictEntity } from '@/discovery/persistence/entities/edistrict.entity';
import { EdistrictSeedService } from './edistrict-seed.service';

@Module({
  imports: [
    StorageModule.register(),
    TypeOrmModule.forFeature([EdistrictEntity, SellerEntity]),
  ],
  providers: [EdistrictSeedService],
  exports: [EdistrictSeedService],
})
export class EdistrictSeedModule {}
