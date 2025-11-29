import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SupabaseStorageModule } from '@uit-go-backend/supabase-storage';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.USER_SERVICE_HOST || 'user-service',
          port: parseInt(process.env.USER_SERVICE_PORT || '3002'),
        },
      },
    ]),
    SupabaseStorageModule,
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
