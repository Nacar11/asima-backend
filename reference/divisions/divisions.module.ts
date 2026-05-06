import { UsersModule } from '@/users/users.module';
import { Module } from '@nestjs/common';
import { DivisionsService } from '@/divisions/divisions.service';
import { DivisionsController } from '@/divisions/divisions.controller';
import { DivisionPersistenceModule } from '@/divisions/persistence/persistence.module';

@Module({
  imports: [UsersModule, DivisionPersistenceModule],
  controllers: [DivisionsController],
  providers: [DivisionsService],
  exports: [DivisionsService, DivisionPersistenceModule],
})
export class DivisionsModule {}
