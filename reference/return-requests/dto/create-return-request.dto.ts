import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { Type, Transform, plainToInstance } from 'class-transformer';
import { ReturnItemDto } from './return-item.dto';
import { Base64ToMulterPipe } from '@/storage/storage.pipe';

/**
 * Inner DTO containing the actual return request data
 */
export class ReturnRequestDataDto {
  @ApiProperty({
    description: 'Reason for return',
    example: 'Product damaged during shipping',
    maxLength: 2500,
  })
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }
    return value.trim().replace(/\r\n/g, '\n');
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2500)
  reason: string;

  @ApiProperty({
    description: 'Items to return with quantities',
    type: [ReturnItemDto],
    example: [
      { sales_order_item_id: 1, quantity: 1 },
      { sales_order_item_id: 2, quantity: 2 },
    ],
  })
  @Transform(({ value }) => {
    // Convert single object to array
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      value = [value];
    }
    // Convert plain objects to ReturnItemDto instances
    if (Array.isArray(value)) {
      return value.map((item) => plainToInstance(ReturnItemDto, item));
    }
    return value;
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];

  @ApiPropertyOptional({
    description: 'Media IDs to attach (if uploaded separately)',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  media_ids?: number[];

  @ApiPropertyOptional({
    description:
      'Base64 encoded images (max 5). Accepts raw base64 string or data URI format.',
    type: [String],
    example: ['/9j/4AAQSkZJRg...'],
  })
  @IsOptional()
  // Note: Transformation is handled in CreateReturnRequestDto.data @Transform
  // to avoid double-transformation issues with plainToInstance
  base64_files?: Express.Multer.File[];
}

/**
 * DTO for return request - supports both multipart/form-data and JSON
 *
 * Option 1 (multipart): { data: JSON.stringify({reason, items}), files: [binary] }
 * Option 2 (JSON): { data: {reason, items, base64_files: ["data:image/jpeg;base64,..."] } }
 * Option 3 (mixed): Both files and base64_files can be combined (max 5 total)
 */
export class CreateReturnRequestDto {
  @ApiProperty({
    description:
      'Return request data containing reason, items, and optionally base64_files. ' +
      'For multipart requests, send as JSON string. For JSON requests, send as object.',
    example:
      '{"reason":"Product damaged","items":[{"sales_order_item_id":1,"quantity":1}],"base64_files":["/9j/4AAQ..."]}',
  })
  @Transform(({ value }) => {
    let parsed = value;

    // Parse JSON string if needed (for multipart/form-data requests)
    if (typeof value === 'string') {
      try {
        parsed = JSON.parse(value);
      } catch {
        return value;
      }
    }

    if (typeof parsed !== 'object' || parsed === null) {
      return value;
    }

    // Manually transform base64_files since plainToInstance doesn't trigger @Transform
    if (parsed.base64_files && Array.isArray(parsed.base64_files)) {
      // Check if already transformed (has buffer property = Multer file object)
      // This handles the case where ValidationPipe triggers transform twice
      const alreadyTransformed =
        parsed.base64_files.length > 0 &&
        parsed.base64_files[0] &&
        typeof parsed.base64_files[0] === 'object' &&
        parsed.base64_files[0].buffer;

      if (!alreadyTransformed) {
        const pipe = new Base64ToMulterPipe();
        parsed.base64_files = parsed.base64_files
          .slice(0, 5) // Max 5 files
          .map((base64String: string) => {
            if (typeof base64String !== 'string') {
              return null;
            }
            try {
              return pipe.transform(base64String);
            } catch {
              return null;
            }
          })
          .filter(Boolean);
      }
    }

    // Save transformed base64_files before plainToInstance
    const transformedBase64Files = parsed.base64_files;

    const result = plainToInstance(ReturnRequestDataDto, parsed);

    // Restore base64_files after plainToInstance (it may get lost during transformation)
    if (transformedBase64Files && transformedBase64Files.length > 0) {
      result.base64_files = transformedBase64Files;
    }

    return result;
  })
  @ValidateNested()
  @Type(() => ReturnRequestDataDto)
  data: ReturnRequestDataDto;

  @ApiPropertyOptional({
    description: 'Photos/evidence to upload (max 5 files)',
    type: 'array',
    items: { type: 'string', format: 'binary' },
  })
  @IsOptional()
  files?: Express.Multer.File[];
}
