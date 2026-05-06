import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderFormTemplateDto {
  @ApiProperty({ type: Number })
  @IsInt()
  id: number;

  @ApiProperty({ type: Number })
  @IsInt()
  sequence_order: number;
}

export class ReorderFormTemplatesDto {
  @ApiProperty({
    type: [ReorderFormTemplateDto],
    description: 'Array of form templates with their new order',
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReorderFormTemplateDto)
  templates: ReorderFormTemplateDto[];
}
