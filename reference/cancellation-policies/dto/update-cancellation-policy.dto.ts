import { PartialType } from '@nestjs/swagger';
import { CreateCancellationPolicyDto } from '@/cancellation-policies/dto/create-cancellation-policy.dto';

export class UpdateCancellationPolicyDto extends PartialType(
  CreateCancellationPolicyDto,
) {}
