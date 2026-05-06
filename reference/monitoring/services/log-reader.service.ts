import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { StructuredLogEntry } from '@/loggers/loggers.interface';
import { LoggerLevel } from '@/loggers/loggers.enum';

@Injectable()
export class LogReaderService {
  private readonly logFilePath: string;

  constructor() {
    const directory = './logs';
    const file = 'app.log';
    this.logFilePath = path.join(process.cwd(), `${directory}/${file}`);
  }

  /**
   * Read logs from file with filters.
   *
   * @param options - Filter options
   */
  async readLogs(options: {
    level?: LoggerLevel;
    startDate?: Date;
    endDate?: Date;
    userId?: number;
    endpoint?: string;
    limit?: number;
  }): Promise<StructuredLogEntry[]> {
    if (!fs.existsSync(this.logFilePath)) {
      return Promise.resolve([]);
    }

    const fileContent = fs.readFileSync(this.logFilePath, 'utf-8');
    const lines = fileContent.split('\n').filter((line) => line.trim());

    const logs: StructuredLogEntry[] = [];

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);

        // Convert timestamp string to Date object
        const entry: StructuredLogEntry = {
          ...parsed,
          timestamp: parsed.timestamp ? new Date(parsed.timestamp) : new Date(),
        };

        // Apply filters
        if (options.level && entry.level !== options.level) {
          continue;
        }

        if (options.startDate && entry.timestamp < options.startDate) {
          continue;
        }

        if (options.endDate && entry.timestamp > options.endDate) {
          continue;
        }

        if (options.userId && entry.context?.userId !== options.userId) {
          continue;
        }

        if (options.endpoint && entry.context?.endpoint !== options.endpoint) {
          continue;
        }

        logs.push(entry);
      } catch {
        // Skip invalid JSON lines (old format logs)
        continue;
      }
    }

    // Sort by timestamp descending (newest first)
    logs.sort((a, b) => {
      const timeA =
        a.timestamp instanceof Date
          ? a.timestamp.getTime()
          : new Date(a.timestamp).getTime();
      const timeB =
        b.timestamp instanceof Date
          ? b.timestamp.getTime()
          : new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    // Apply limit
    const limit = options.limit || 100;
    return logs.slice(0, limit);
  }

  /**
   * Get error logs only.
   */
  getErrorLogs(limit = 100): Promise<StructuredLogEntry[]> {
    return this.readLogs({
      level: LoggerLevel.ERROR,
      limit,
    });
  }

  /**
   * Get logs count by level.
   */
  async getLogsCount(): Promise<Record<LoggerLevel, number>> {
    const logs = await this.readLogs({ limit: 10000 });
    const counts: Record<LoggerLevel, number> = {
      [LoggerLevel.DEBUG]: 0,
      [LoggerLevel.INFO]: 0,
      [LoggerLevel.WARN]: 0,
      [LoggerLevel.ERROR]: 0,
      [LoggerLevel.FATAL]: 0,
    };

    logs.forEach((log) => {
      counts[log.level] = (counts[log.level] || 0) + 1;
    });

    return counts;
  }
}
