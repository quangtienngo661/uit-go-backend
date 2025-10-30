import { Module } from '@nestjs/common';
import { NotificationListener } from './notification.listener';
import { NotificationService } from './notification.service';

@Module({
  controllers: [NotificationListener],
  providers: [NotificationService],
})
export class AppModule {}
