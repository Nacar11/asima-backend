import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuEntity } from '@/menus/persistence/entities/menu.entity';
import { MenuSeedService } from '@/database/seeds/menu/menu-seed.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, MenuEntity])],
  providers: [MenuSeedService],
  exports: [MenuSeedService],
})
export class MenuSeedModule {}
