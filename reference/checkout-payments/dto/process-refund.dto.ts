import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class ProcessRefundDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
