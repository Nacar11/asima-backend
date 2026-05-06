import { Module } from '@nestjs/common';
import { ParametersModule } from '@/parameters/parameters.module';
import { PlatformFeeSettingsService } from '@/platform-fee-settings/platform-fee-settings.service';
import { PlatformFeeSettingsController } from '@/platform-fee-settings/platform-fee-settings.controller';

@Module({
  imports: [ParametersModule],
  controllers: [PlatformFeeSettingsController],
  providers: [PlatformFeeSettingsService],
  exports: [PlatformFeeSettingsService],
})
export class PlatformFeeSettingsModule {}
