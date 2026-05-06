import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseMenuRepository } from '@/menus/persistence/base-menu.repository';
import { MenuRepository } from '@/menus/persistence/repositories/menu.repository';
import { MenuEntity } from '@/menus/persistence/entities/menu.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MenuEntity])],
  providers: [
    {
      provide: BaseMenuRepository,
      useClass: MenuRepository,
    },
  ],
  exports: [BaseMenuRepository],
})
export class MenuPersistenceModule {}
