import { Controller, Get, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { Public } from '@/utils/decorators/public.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';

@ApiTags('Health')
@Public()
@SkipThrottle()
@Controller({ path: 'health', version: API_VERSION })
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness + DB readiness check' })
  @ApiResponse({ status: 200, description: 'Service healthy and database reachable' })
  @ApiResponse({ status: 503, description: 'Service running but database is unreachable' })
  async check(): Promise<{ status: string; database: string }> {
    try {
      if (!this.dataSource.isInitialized) {
        throw new Error('DataSource not initialized');
      }
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', database: 'up' };
    } catch {
      throw new HttpException(
        { status: 'error', database: 'down' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
