import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateCompensationDto } from '@/compensation/dto/admin/create-compensation.dto';

/**
 * Admin-only payload for `POST /admin/compensation/bulk` — set pay for many
 * employees in one all-or-nothing transaction. Each item is a standard
 * set-pay payload; the service rejects duplicate `employee_id`s up front.
 */
export class BulkCreateCompensationDto {
  @ApiProperty({
    type: [CreateCompensationDto],
    description: 'One set-pay item per employee (1–200, no duplicate employee_id).',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CreateCompensationDto)
  items!: CreateCompensationDto[];
}
