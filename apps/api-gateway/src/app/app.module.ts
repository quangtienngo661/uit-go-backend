import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DriverModule } from './driver/driver.module';
import { NotificationModule } from './notification/notification.module';
import { TripModule } from './trip/trip.module';
import { UserModule } from './user/user.module';
import { AuthCommonModule } from '../common/auth/auth-common.module';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Make env vars available globally
    AuthCommonModule,
    AuthModule,
    DriverModule,
    NotificationModule,
    TripModule,
    UserModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
