import { ApplicationLoggerService } from '@/loggers/services/application.logger.service';
import { FileLoggerStrategy } from '@/loggers/strategies/file.logger.strategy';
import { Module } from '@nestjs/common';

@Module({
  providers: [ApplicationLoggerService, FileLoggerStrategy],
  exports: [ApplicationLoggerService, FileLoggerStrategy],
})
export class LoggersModule {}
