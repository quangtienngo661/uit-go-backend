import { Controller, Logger } from '@nestjs/common';
import {
  MessagePattern,
  Payload,
  Ctx,
  RmqContext,
} from '@nestjs/microservices';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(private readonly notificationService: NotificationService) {}

  @MessagePattern('trip.created')
  async handleTripCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log(`📩 Received trip.created: ${JSON.stringify(data)}`);

    await this.notificationService.sendPushNotification(
      data.driverToken,
      'Chuyến đi mới!',
      `${data.userName} vừa đặt xe.`,
    );

    const channel = context.getChannelRef();
    channel.ack(context.getMessage());
  }

  @MessagePattern('trip.completed')
  async handleTripCompleted(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log(`📩 Received trip.completed: ${JSON.stringify(data)}`);

    await this.notificationService.sendEmailNotification(
      data.userEmail,
      'Chuyến đi đã hoàn tất',
      'Cảm ơn bạn đã sử dụng UIT-Go!',
    );

    const channel = context.getChannelRef();
    channel.ack(context.getMessage());
  }
}
