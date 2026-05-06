import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { RecommendationsController } from '@/recommendations/recommendations.controller';
import { RecommendationsService } from '@/recommendations/recommendations.service';

describe('RecommendationsController', () => {
  let controller: RecommendationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot()],
      controllers: [RecommendationsController],
      providers: [
        {
          provide: RecommendationsService,
          useValue: {
            getRecommendations: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RecommendationsController>(
      RecommendationsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
