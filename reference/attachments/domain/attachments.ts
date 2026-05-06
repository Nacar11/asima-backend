import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { User } from '@/users/domain/user';
import {
  FileTypeEnum,
  RecordTypeEnum,
  StatusEnum,
} from '@/attachments/attachments.enum';

export class Attachments {
  [x: string]: any;
  @ApiProperty({
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Indicates the type of record this attachment is linked to',
    type: String,
    enum: RecordTypeEnum,
    nullable: false,
    example: RecordTypeEnum.EMPLOYEE_CERTIFICATE,
  })
  record_type: RecordTypeEnum;

  @ApiProperty({
    description: "Reference to the record ID based on 'record_type'",
    type: Number,
    nullable: false,
    example: 1234,
  })
  record_id: number;

  @ApiProperty({
    description: 'The name of the uploaded file',
    type: String,
    nullable: false,
    example: 'report.pdf',
  })
  file_name: string;

  @ApiProperty({
    description: 'Path or URL to the stored file',
    type: String,
    nullable: false,
    example:
      'https://static.remove.bg/sample-gallery/graphics/bird-thumbnail.jpg',
  })
  file_path: string;

  @ApiProperty({
    description: 'The type of file (e.g., PDF, JPEG, PNG, DOCX)',
    type: String,
    enum: FileTypeEnum,
    nullable: false,
    example: FileTypeEnum.PDF,
  })
  file_type: FileTypeEnum;

  @ApiProperty({
    type: String,
    nullable: false,
    example: StatusEnum.ACTIVE,
  })
  status: StatusEnum;

  @ApiProperty({
    type: () => User,
    nullable: false,
    example: { id: 1, first_name: 'John', last_name: 'Doe', cost_center: '00' },
  })
  created_by: Pick<User, 'id' | 'first_name' | 'last_name' | 'cost_center'>;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({
    type: () => User,
    nullable: false,
    example: { id: 1, first_name: 'John', last_name: 'Doe', cost_center: '00' },
  })
  updated_by: Pick<User, 'id' | 'first_name' | 'last_name' | 'cost_center'>;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({
    type: () => User,
    nullable: true,
    example: null,
  })
  deleted_by?: Pick<
    User,
    'id' | 'first_name' | 'last_name' | 'cost_center'
  > | null;

  @ApiProperty({
    example: null,
  })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
