import { LoggerLevel, LoggerType } from './loggers.enum';

export interface LogContext {
  userId?: number;
  requestId?: string;
  endpoint?: string;
  method?: string;
  ipAddress?: string;
  userAgent?: string;
  [key: string]: any;
}

export interface StructuredLogEntry {
  level: LoggerLevel;
  type: LoggerType;
  message: string;
  context?: LogContext;
  stackTrace?: string;
  metadata?: any;
  timestamp: Date;
}

export interface ILogger {
  debug(type: LoggerType, message: string, context?: LogContext);
  info(type: LoggerType, message: string, context?: LogContext);
  warn(type: LoggerType, message: string, context?: LogContext);
  error(
    type: LoggerType,
    message: string,
    trace?: string,
    context?: LogContext,
  );
  fatal(
    type: LoggerType,
    message: string,
    trace?: string,
    context?: LogContext,
  );
  log(entry: StructuredLogEntry);
}
