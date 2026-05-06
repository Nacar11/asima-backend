import { LoggerLevel, LoggerType } from '@/loggers/loggers.enum';
import { FileLoggerStrategy } from '@/loggers/strategies/file.logger.strategy';
import { LogContext, StructuredLogEntry } from '@/loggers/loggers.interface';
import { ConsoleLogger, Injectable } from '@nestjs/common';

@Injectable()
export class ApplicationLoggerService extends ConsoleLogger {
  constructor(private readonly fileLoggerStrategy: FileLoggerStrategy) {
    super();
  }

  debug(message: string, context?: string | LogContext) {
    const logContext =
      typeof context === 'string' ? { context } : context || {};
    if (typeof context === 'string') super.debug(message, context);
    else super.debug(message);
    this.fileLoggerStrategy.debug(LoggerType.APPLICATION, message, logContext);
  }

  log(message: string, context?: string | LogContext) {
    const logContext =
      typeof context === 'string' ? { context } : context || {};
    if (typeof context === 'string') super.log(message, context);
    else super.log(message);
    this.fileLoggerStrategy.info(LoggerType.APPLICATION, message, logContext);
  }

  warn(message: string, context?: string | LogContext) {
    const logContext =
      typeof context === 'string' ? { context } : context || {};
    if (typeof context === 'string') super.warn(message, context);
    else super.warn(message);
    this.fileLoggerStrategy.warn(LoggerType.APPLICATION, message, logContext);
  }

  error(message: string, trace?: string, context?: string | LogContext) {
    const logContext =
      typeof context === 'string' ? { context } : context || {};
    super.error(
      message,
      trace,
      typeof context === 'string' ? context : undefined,
    );
    this.fileLoggerStrategy.error(
      LoggerType.APPLICATION,
      message,
      trace,
      logContext,
    );
  }

  fatal(message: string, trace?: string, context?: string | LogContext) {
    const logContext =
      typeof context === 'string' ? { context } : context || {};
    super.error(
      `[FATAL] ${message}`,
      trace,
      typeof context === 'string' ? context : undefined,
    );
    this.fileLoggerStrategy.fatal(
      LoggerType.APPLICATION,
      message,
      trace,
      logContext,
    );
  }

  /**
   * Log structured entry directly.
   *
   * @param entry - Structured log entry
   */
  logStructured(entry: StructuredLogEntry) {
    this.fileLoggerStrategy.log(entry);
    const logMessage = `[${entry.level}] [${entry.type}] ${entry.message}`;
    super.log(logMessage, entry.context?.context as string);
  }

  /**
   * Log user activity.
   *
   * @param message - Activity message
   * @param userId - User ID
   * @param metadata - Additional metadata
   */
  logUserActivity(message: string, userId: number, metadata?: any) {
    const entry: StructuredLogEntry = {
      level: LoggerLevel.INFO,
      type: LoggerType.USER_ACTIVITY,
      message,
      context: { userId },
      metadata,
      timestamp: new Date(),
    };
    this.logStructured(entry);
  }
}
