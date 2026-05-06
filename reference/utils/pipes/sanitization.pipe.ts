/**
 * Global SanitizationPipe for NestJS.
 * Applies data sanitation and normalization rules.
 *
 * Usage:
 *   import { SanitizationPipe } from './sanitization.pipe';
 *   app.useGlobalPipes(new SanitizationPipe());
 */
import {
  defaultSanitizationConfig,
  SanitizationConfig,
} from '@/config/sanitization.config';
import { applySanitizationRules } from '@/utils/helpers/sanitization.helper';
import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
  Optional,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

@Injectable()
export class SanitizationPipe implements PipeTransform {
  constructor(
    @Optional()
    private readonly config: SanitizationConfig = defaultSanitizationConfig,
  ) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (!value || typeof value !== 'object') {
      return value;
    }

    const sanitized = this.sanitizeObject(value, this.config);

    // If a DTO/class is provided, perform validation
    if (metadata.metatype && this.isDto(metadata.metatype)) {
      const object = plainToInstance(metadata.metatype, sanitized);
      const errors = validateSync(object, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      if (errors.length > 0) {
        throw new BadRequestException(errors);
      }
      return object;
    }

    return sanitized;
  }

  private sanitizeObject(obj: any, config: SanitizationConfig, path = ''): any {
    if (Array.isArray(obj)) {
      return obj.map((item, idx) =>
        typeof item === 'object'
          ? this.sanitizeObject(item, config, `${path}[${idx}]`)
          : item,
      );
    }
    if (obj === null || typeof obj !== 'object') return obj;

    const result = { ...obj };

    for (const [key, value] of Object.entries(obj)) {
      const specificRules = config.fields?.[key];
      const wildcardRules = config.fields?.[key]
        ? {}
        : config.fields?.['*'] || {};
      const rules = { ...wildcardRules, ...specificRules };

      if (typeof value === 'string') {
        // Date fields
        if (rules.type === 'date' || /date/i.test(key)) {
          const iso = this.standardizeDate(value);
          result[key] = iso ?? value;
        } else {
          result[key] = applySanitizationRules(value, rules);
        }
      } else if (typeof value === 'object' && value !== null && config.deep) {
        result[key] = this.sanitizeObject(value, config, `${path}.${key}`);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private isDto(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private standardizeDate(value: string): string | null {
    // Accepts ISO, RFC, and common date formats.
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch {}
    return null;
  }
}
