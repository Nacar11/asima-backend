import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseDivisionRepository } from '@/divisions/persistence/base-division.repository';
import { DivisionRepository } from '@/divisions/persistence/repositories/division.repository';
import { DivisionEntity } from '@/divisions/persistence/entities/division.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DivisionEntity])],
  providers: [
    {
      provide: BaseDivisionRepository,
      useClass: DivisionRepository,
    },
  ],
  exports: [BaseDivisionRepository],
})
export class DivisionPersistenceModule {}
