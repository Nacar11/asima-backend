import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ExposeUser {
  @ApiProperty({
    type: Number,
  })
  @Expose()
  id: number;

  @ApiProperty({
    type: String,
    example: 'John',
  })
  @Expose()
  first_name: string | null;

  @ApiProperty({
    type: String,
    example: null,
  })
  @Expose()
  middle_name?: string | null;

  @ApiProperty({
    type: String,
    example: 'Doe',
  })
  @Expose()
  last_name: string | null;

  @ApiProperty({
    type: String,
    example: 'john.doe@cody.inc',
  })
  @Expose()
  email: string | null;

  @ApiPropertyOptional({
    type: String,
    example:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII',
    nullable: true,
  })
  image?: string | null;
}
