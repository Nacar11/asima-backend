import { DynamicModule, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { STORAGE_CONFIG } from './storage.enum';
import { ConfigModule, ConfigService } from '@nestjs/config';
import storageConfig from './storage.config';
import { StorageConfig } from './storage.interface';
import { StorageController } from './storage.controller';

@Module({})
export class StorageModule {
  static register(): DynamicModule {
    return {
      module: StorageModule,
      imports: [ConfigModule.forFeature(storageConfig)],
      providers: [
        {
          provide: STORAGE_CONFIG,
          inject: [ConfigService],
          useFactory: (configService: ConfigService) =>
            ({
              provider: configService.get('storage.provider', {
                infer: true,
              }) as StorageConfig['provider'],
              config: configService.get('storage.config', {
                infer: true,
              }) as StorageConfig['config'],
            }) satisfies StorageConfig,
        },
        StorageService,
      ],
      controllers: [StorageController],
      exports: [StorageService],
    };
  }
}
