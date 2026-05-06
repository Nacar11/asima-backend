import { Module } from '@nestjs/common';
import { RatingTemplatePersistenceModule } from '@/rating-templates/persistence/persistence.module';
import { RatingTemplatesService } from '@/rating-templates/rating-templates.service';
import { RatingTemplatesController } from '@/rating-templates/rating-templates.controller';

@Module({
  imports: [RatingTemplatePersistenceModule],
  controllers: [RatingTemplatesController],
  providers: [RatingTemplatesService],
  exports: [RatingTemplatesService],
})
export class RatingTemplatesModule {}
