import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagEntity } from '@/tags/persistence/entities/tag.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { TagSeedService } from '@/database/seeds/tag/tag-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([TagEntity, SellerEntity, UserEntity])],
  providers: [TagSeedService],
  exports: [TagSeedService],
})
export class TagSeedModule {}
