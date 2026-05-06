import { Injectable } from '@nestjs/common';
import { ParametersService } from '@/parameters/parameters.service';
import { PlatformFeeSettingsDto } from '@/platform-fee-settings/dto/platform-fee-settings.dto';

const DEFAULT_PLATFORM_FEE_PERCENT = 0;
const PLATFORM_FEE_PARAMETER_CODE = 'platform_fee_percent';
const PLATFORM_FEE_PARAMETER_ITEM = 'store_settings';
const PLATFORM_FEE_PARAMETER_DESCRIPTION =
  'Default platform fee percentage applied to bookings';

@Injectable()
export class PlatformFeeSettingsService {
  constructor(private readonly parametersService: ParametersService) {}

  async getSettings(): Promise<PlatformFeeSettingsDto> {
    const existing = await this.parametersService.findByCode(
      PLATFORM_FEE_PARAMETER_CODE,
    );

    return {
      platform_fee_percent:
        existing?.numeric_value !== null &&
        existing?.numeric_value !== undefined
          ? Number(existing.numeric_value)
          : DEFAULT_PLATFORM_FEE_PERCENT,
    };
  }

  async updateSettings(
    input: PlatformFeeSettingsDto,
  ): Promise<PlatformFeeSettingsDto> {
    const existing = await this.parametersService.findByCode(
      PLATFORM_FEE_PARAMETER_CODE,
    );

    if (existing) {
      await this.parametersService.update(existing.id, {
        param_items: existing.param_items || PLATFORM_FEE_PARAMETER_ITEM,
        description: existing.description || PLATFORM_FEE_PARAMETER_DESCRIPTION,
        numeric_value: input.platform_fee_percent,
      });
    } else {
      await this.parametersService.create({
        code: PLATFORM_FEE_PARAMETER_CODE,
        param_items: PLATFORM_FEE_PARAMETER_ITEM,
        description: PLATFORM_FEE_PARAMETER_DESCRIPTION,
        string_value: '',
        numeric_value: input.platform_fee_percent,
        boolean_value: false,
        date_value: null as any,
      });
    }

    return this.getSettings();
  }
}
