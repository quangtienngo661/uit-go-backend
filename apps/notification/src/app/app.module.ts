import { Module } from '@nestjs/common';
import { NotificationListener } from './notification.listener';
import { NotificationService } from './notification.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [NotificationListener],
  providers: [NotificationService],
})
export class AppModule {}
