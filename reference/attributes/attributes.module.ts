import { Module } from '@nestjs/common';
import { AttributesService } from './attributes.service';
import { AttributesController } from './attributes.controller';
import { AttributePersistenceModule } from './persistence/attribute-persistence.module';

@Module({
  imports: [AttributePersistenceModule],
  controllers: [AttributesController],
  providers: [AttributesService],
  exports: [AttributesService],
})
export class AttributesModule {}
