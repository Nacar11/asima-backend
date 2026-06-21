import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompensationEntity } from '@/compensation/persistence/entities/compensation.entity';
import { CompensationAuditEntity } from '@/compensation/persistence/entities/compensation-audit.entity';
import { CompensationRepository } from '@/compensation/persistence/repositories/compensation.repository';
import { CompensationAuditRepository } from '@/compensation/persistence/repositories/compensation-audit.repository';
import { BaseCompensationRepository } from '@/compensation/persistence/base-compensation.repository';
import { BaseCompensationAuditRepository } from '@/compensation/persistence/base-compensation-audit.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CompensationEntity, CompensationAuditEntity])],
  providers: [
    CompensationRepository,
    { provide: BaseCompensationRepository, useClass: CompensationRepository },
    CompensationAuditRepository,
    { provide: BaseCompensationAuditRepository, useClass: CompensationAuditRepository },
  ],
  exports: [
    BaseCompensationRepository,
    CompensationRepository,
    BaseCompensationAuditRepository,
    CompensationAuditRepository,
    TypeOrmModule,
  ],
})
export class CompensationPersistenceModule {}
