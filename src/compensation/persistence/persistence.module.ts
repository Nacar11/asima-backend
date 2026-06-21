import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompensationEntity } from '@/compensation/persistence/entities/compensation.entity';
import { CompensationRepository } from '@/compensation/persistence/repositories/compensation.repository';
import { BaseCompensationRepository } from '@/compensation/persistence/base-compensation.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CompensationEntity])],
  providers: [
    CompensationRepository,
    { provide: BaseCompensationRepository, useClass: CompensationRepository },
  ],
  exports: [BaseCompensationRepository, CompensationRepository, TypeOrmModule],
})
export class CompensationPersistenceModule {}
