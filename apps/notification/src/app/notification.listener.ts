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

  constructor(private readonly notificationService: NotificationService) { }

  @MessagePattern('trip.created')
  async handleTripCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log(`📩 Received trip.created: ${JSON.stringify(data)}`);

    if (data.userEmail) {
      await this.notificationService.sendEmailNotification(
        data.userEmail,
        'Xác nhận đặt chuyến thành công',
        'Bạn đã đặt chuyến đi thành công. Cảm ơn bạn đã sử dụng UIT-Go!',
      );
    }

    if (data.driverEmail) {
      await this.notificationService.sendEmailNotification(
        data.driverEmail,
        'Có chuyến đi mới!',
        'Một hành khách vừa đặt chuyến. Hãy kiểm tra ứng dụng để nhận chuyến.',
      );
    }
  }

  @MessagePattern('driver.accepted')
  async handleDriverAccepted(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log(`📩 Received driver.accepted: ${JSON.stringify(data)}`);

    await this.notificationService.sendEmailNotification(
      data.userEmail,
      'Tài xế đã nhận chuyến',
      'Tài xế của bạn đã nhận chuyến và đang trên đường đến đón bạn.',
    );
  }

  @MessagePattern('trip.started')
  async handleTripStarted(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log(`📩 Received trip.started: ${JSON.stringify(data)}`);

    await this.notificationService.sendEmailNotification(
      data.userEmail,
      'Chuyến đi của bạn đã bắt đầu',
      'Tài xế đã bắt đầu chuyến đi. Chúc bạn có một hành trình an toàn!',
    );
  }

  @MessagePattern('trip.completed')
  async handleTripCompleted(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log(`📩 Received trip.completed: ${JSON.stringify(data)}`);

    await this.notificationService.sendEmailNotification(
      data.userEmail,
      'Chuyến đi đã hoàn tất',
      'Cảm ơn bạn đã đồng hành cùng UIT-Go! Hãy đánh giá tài xế của bạn nhé.',
    );
  }

  @MessagePattern('trip.cancelled')
  async handleTripCancelled(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log(`📩 Received trip.cancelled: ${JSON.stringify(data)}`);

    if (data.isAuto) {
      await this.notificationService.sendEmailNotification(
        data.userEmail,
        'Chuyến đi đã bị hủy tự động',
        'Chuyến đi của bạn đã bị hủy do không có tài xế nhận chuyến. Vui lòng thử đặt chuyến lại.',
      );
    } else {
      await this.notificationService.sendEmailNotification(
        data.driverEmail,
        'Chuyến đi đã bị hủy',
        'Hành khách đã hủy chuyến đi. Bạn có thể chờ chuyến mới.',
      );
    }
  }
}
