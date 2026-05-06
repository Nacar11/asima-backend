import * as fs from 'fs';
import * as path from 'path';
import { ILogger, LogContext, StructuredLogEntry } from '../loggers.interface';
import { LoggerLevel, LoggerType } from '../loggers.enum';

/**
 * A concrete implementation of the `ILogger` interface that writes log messages to a file.
 * The log file is created in a `logs` directory, and log entries are appended to the file with a timestamp.
 *
 * @implements {ILogger}
 */
export class FileLoggerStrategy implements ILogger {
  /**
   * Path to the log file where log entries are written.
   *
   * @private
   * @type {string}
   */
  private logFilePath: string;

  /**
   * Creates an instance of `FileLoggerStrategy`.
   * The constructor initializes the log file path and ensures that the `logs` directory exists.
   * If the directory doesn't exist, it will be created.
   *
   * @constructor
   */
  constructor() {
    const directory = './logs'; // Directory where log files will be stored
    const file = 'app.log'; // Log file name

    // Create the directory if it doesn't exist
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory);
    }

    // Set the full path for the log file
    this.logFilePath = path.join(process.cwd(), `${directory}/${file}`);
  }

  /**
   * Writes a log message to the log file.
   * Appends the log message with a timestamp to the specified log file.
   *
   * @private
   * @param {string} log - The log message to be written to the file.
   */
  private writeToFile(log: string) {
    fs.appendFileSync(
      this.logFilePath,
      `\n${new Date().toISOString()} - ${log}\n`, // Log with a timestamp
    );
  }

  /**
   * Writes a structured log entry (JSON format) to the log file.
   *
   * @private
   * @param {StructuredLogEntry} entry - The structured log entry to be written.
   */
  private writeStructuredLog(entry: StructuredLogEntry) {
    const logEntry = JSON.stringify(entry);
    fs.appendFileSync(this.logFilePath, `${logEntry}\n`);
  }

  debug(type: LoggerType, message: string, context?: LogContext) {
    const entry: StructuredLogEntry = {
      level: LoggerLevel.DEBUG,
      type,
      message,
      context,
      timestamp: new Date(),
    };
    this.writeStructuredLog(entry);
  }

  info(type: LoggerType, message: string, context?: LogContext) {
    const entry: StructuredLogEntry = {
      level: LoggerLevel.INFO,
      type,
      message,
      context,
      timestamp: new Date(),
    };
    this.writeStructuredLog(entry);
  }

  /**
   * Logs a warning message to the log file.
   * The log message includes the type and level of the log entry.
   *
   * @param {LoggerType} type - The type of the log message (e.g., 'database', 'network').
   * @param {string} message - The warning message to be logged.
   * @param {LogContext} [context] - Optional context information.
   */
  warn(type: LoggerType, message: string, context?: LogContext) {
    const entry: StructuredLogEntry = {
      level: LoggerLevel.WARN,
      type,
      message,
      context,
      timestamp: new Date(),
    };
    this.writeStructuredLog(entry);
  }

  /**
   * Logs an error message to the log file.
   * The log message includes the type, level, and an optional trace for additional error details.
   *
   * @param {LoggerType} type - The type of the log message (e.g., 'database', 'network').
   * @param {string} message - The error message to be logged.
   * @param {string} [trace] - Optional trace information related to the error.
   * @param {LogContext} [context] - Optional context information.
   */
  error(
    type: LoggerType,
    message: string,
    trace?: string,
    context?: LogContext,
  ) {
    const entry: StructuredLogEntry = {
      level: LoggerLevel.ERROR,
      type,
      message,
      context,
      stackTrace: trace,
      timestamp: new Date(),
    };
    this.writeStructuredLog(entry);
  }

  fatal(
    type: LoggerType,
    message: string,
    trace?: string,
    context?: LogContext,
  ) {
    const entry: StructuredLogEntry = {
      level: LoggerLevel.FATAL,
      type,
      message,
      context,
      stackTrace: trace,
      timestamp: new Date(),
    };
    this.writeStructuredLog(entry);
  }

  log(entry: StructuredLogEntry) {
    this.writeStructuredLog(entry);
  }
}
