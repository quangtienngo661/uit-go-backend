import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  async handleTripCreated(data: any) {
    this.logger.log(`🚀 Handling trip.created for ${data.userName}`);
  }

  async handleTripCompleted(data: any) {
    this.logger.log(`✅ Handling trip.completed for ${data.userEmail}`);
  }
}
