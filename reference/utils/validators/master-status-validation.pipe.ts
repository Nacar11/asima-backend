import { MasterStatusEnum } from '@/utils/enums/accounting.enum';
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class MasterStatusValidationPipe implements PipeTransform {
  private readonly allowedStatuses = Object.keys(MasterStatusEnum).map(
    (status) => status.toLowerCase(),
  );

  transform(value: string) {
    if (!this.isValidStatus(value)) {
      throw new BadRequestException(
        `Invalid status. Allowed values: ${this.allowedStatuses.join(', ')}`,
      );
    }
    return MasterStatusEnum[value.toUpperCase()];
  }

  private isValidStatus(status: string): boolean {
    return this.allowedStatuses.includes(status.toLowerCase());
  }
}
