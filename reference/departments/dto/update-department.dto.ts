import { PartialType } from '@nestjs/swagger';
import { CreateDepartmentDto } from '@/departments/dto/create-department.dto';

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}
