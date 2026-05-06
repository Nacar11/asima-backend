import { Module } from '@nestjs/common';
import { SubSectionsService } from '@/sub-sections/sub-sections.service';
import { SubSectionsController } from '@/sub-sections/sub-sections.controller';
import { SubSectionPersistenceModule } from '@/sub-sections/persistence/persistence.module';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [SubSectionPersistenceModule, UsersModule],
  controllers: [SubSectionsController],
  providers: [SubSectionsService],
  exports: [SubSectionsService, SubSectionPersistenceModule],
})
export class SubSectionsModule {}
