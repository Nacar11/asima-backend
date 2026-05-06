import { Test, TestingModule } from '@nestjs/testing';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';

describe('HomeController', () => {
  let homeController: HomeController;
  let homeService: HomeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HomeController],
      providers: [
        {
          provide: HomeService,
          useValue: {
            appInfo: jest
              .fn()
              .mockResolvedValue({ message: 'App is running!' }),
          },
        },
      ],
    }).compile();

    homeController = module.get<HomeController>(HomeController);
    homeService = module.get<HomeService>(HomeService);
  });

  it('should be defined', () => {
    expect(homeController).toBeDefined();
  });

  describe('appInfo', () => {
    it('should return app info', async () => {
      const result = await homeController.appInfo();
      expect(result).toEqual({ message: 'App is running!' });
      expect(homeService.appInfo).toHaveBeenCalled();
    });
  });
});
