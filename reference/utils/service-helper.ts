import { StatusDto } from '@/statuses/dto/status.dto';
import { StatusEnum } from '@/statuses/statuses.enum';
import { UnprocessableEntityException } from '@nestjs/common';

export const getValidatedStatus = (statusDto: StatusDto | undefined) => {
  if (!statusDto) {
    return { id: StatusEnum.active };
  }

  const statusObject = Object.values(StatusEnum)
    .map(String)
    .includes(String(statusDto.id));

  if (!statusObject) {
    throw new UnprocessableEntityException('Status does not exist');
  }

  return { id: statusDto.id };
};
