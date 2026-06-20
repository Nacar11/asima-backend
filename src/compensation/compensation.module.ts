import { Module } from '@nestjs/common';
import { CompensationService } from '@/compensation/compensation.service';
import { CompensationPersistenceModule } from '@/compensation/persistence/persistence.module';
import { AdminCompensationController } from '@/compensation/controllers/admin-compensation.controller';

@Module({
  imports: [CompensationPersistenceModule],
  controllers: [AdminCompensationController],
  providers: [CompensationService],
  exports: [CompensationService, CompensationPersistenceModule],
})
export class CompensationModule {}
