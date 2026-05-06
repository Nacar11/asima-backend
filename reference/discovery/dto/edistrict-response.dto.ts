import { ApiProperty } from '@nestjs/swagger';

export class EdistrictResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'anjo-world' })
  key: string;

  @ApiProperty({ example: 'Anjo World' })
  name: string;

  @ApiProperty({ example: 'Browse services on', nullable: true })
  subtitle: string | null;

  @ApiProperty({ example: 'Ulrak Pickle Ball Hub', nullable: true })
  store_name: string | null;

  @ApiProperty({ example: 4, nullable: true })
  seller_id: number | null;

  @ApiProperty({
    example: 'https://cdn.example.com/edistricts/anjo-world.jpg',
    nullable: true,
  })
  image_url: string | null;

  @ApiProperty({
    example: 'https://cdn.example.com/edistricts/bg-anjo-world.webp',
    nullable: true,
  })
  background_image_url: string | null;

  @ApiProperty({
    example: 'active',
    enum: ['active', 'inactive', 'coming_soon'],
  })
  status: string;

  @ApiProperty({ example: 1 })
  display_order: number;

  @ApiProperty({
    example: false,
    description: 'Whether this edistrict requires an active membership',
  })
  is_members_only: boolean;

  @ApiProperty({
    example: false,
    description:
      'True when is_members_only=true and the requesting user has no active membership',
  })
  is_locked: boolean;
}
