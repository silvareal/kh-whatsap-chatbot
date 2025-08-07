import { Module } from '@nestjs/common';
import { AppealsService } from './appeals.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [AppealsService],
  exports: [AppealsService],
})
export class AppealsModule {}
