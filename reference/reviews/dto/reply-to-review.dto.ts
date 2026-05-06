import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ReplyToReviewDto {
  @ApiProperty({
    description: 'Seller reply to the review',
    example: 'Thank you for your feedback! We appreciate your business.',
    maxLength: 1000,
    minLength: 1,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  reply_text: string;
}
