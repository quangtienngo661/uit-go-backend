import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      envFilePath: '../../../.env',
      isGlobal: true,
      cache: true
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
