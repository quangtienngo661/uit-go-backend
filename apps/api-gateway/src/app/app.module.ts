import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DriverModule } from './driver/driver.module';
import { NotificationModule } from './notification/notification.module';
import { TripModule } from './trip/trip.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    AuthModule, 
    DriverModule, 
    NotificationModule, 
    TripModule, 
    UserModule, 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
