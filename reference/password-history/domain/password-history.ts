import { ApiProperty } from '@nestjs/swagger';

export class PasswordHistory {
  @ApiProperty({
    type: Number,
  })
  id: number;

  @ApiProperty({
    type: Number,
  })
  user_id: number;

  @ApiProperty({
    type: String,
  })
  password_hash: string;

  @ApiProperty()
  created_at: Date;
}
