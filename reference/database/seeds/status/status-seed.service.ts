import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusEntity } from '@/statuses/persistence/entities/status.entity';
import { StatusEnum } from '@/statuses/statuses.enum';
import { ISeedService } from '../seed.interface';

@Injectable()
export class StatusSeedService implements ISeedService {
  constructor(
    @InjectRepository(StatusEntity)
    private repository: Repository<StatusEntity>,
  ) {}

  async run() {
    const count = await this.repository.count();

    if (!count) {
      await this.repository.save([
        this.repository.create({
          id: StatusEnum.active,
          name: 'Active',
        }),
        this.repository.create({
          id: StatusEnum.inactive,
          name: 'Inactive',
        }),
      ]);
    }
  }
}
