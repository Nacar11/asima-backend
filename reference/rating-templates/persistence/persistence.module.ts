import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingTemplateEntity } from '@/rating-templates/persistence/entities/rating-template.entity';
import { RatingTemplateRepository } from '@/rating-templates/persistence/repositories/rating-template.repository';
import { BaseRatingTemplateRepository } from '@/rating-templates/persistence/base-rating-template.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RatingTemplateEntity])],
  providers: [
    {
      provide: BaseRatingTemplateRepository,
      useClass: RatingTemplateRepository,
    },
  ],
  exports: [BaseRatingTemplateRepository],
})
export class RatingTemplatePersistenceModule {}
