import { Module } from '@nestjs/common';
import { PricingsService } from './pricings.service';

@Module({
  providers: [PricingsService]
})
export class PricingsModule {}
