import { Module } from '@nestjs/common';
import { MenusService } from '@/menus/menus.service';
import { MenusController } from '@/menus/menus.controller';
import { MenuPersistenceModule } from '@/menus/persistence/persistence.module';
import { MenuExistsConstraint } from '@/menus/menus.validator';

@Module({
  imports: [
    // import modules, etc.
    MenuPersistenceModule,
  ],
  controllers: [MenusController],
  providers: [MenusService, MenuExistsConstraint],
  exports: [MenusService, MenuPersistenceModule, MenuExistsConstraint],
})
export class MenusModule {}
