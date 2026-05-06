import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';

import { CostCentersService } from '@/masters/cost-centers/cost-centers.service';

@ValidatorConstraint({ async: true })
@Injectable()
export class CostCenterValidator implements ValidatorConstraintInterface {
  constructor(private readonly costCenterService: CostCentersService) {}

  async validate(
    value: number | null | undefined,
    args: any,
  ): Promise<boolean> {
    // Allow null/undefined values (optional field)
    if (value === null || value === undefined) {
      return true;
    }

    if (typeof value !== 'number') return false;

    const costCenter = await this.costCenterService.findById(value);

    if (costCenter) {
      const targetObject = args.object as Record<string, any>;
      targetObject[args.property] = costCenter;
      return true;
    }

    return false;
  }

  defaultMessage(): string {
    return 'Cost Center does not exist!';
  }
}
