import { PartialType } from '@nestjs/swagger';
import { CreateDivisionDto } from '@/divisions/dto/create-division.dto';

export class UpdateDivisionDto extends PartialType(CreateDivisionDto) {}
