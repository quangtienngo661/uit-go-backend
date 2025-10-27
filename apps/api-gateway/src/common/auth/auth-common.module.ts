import { Module, Global } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SupabaseStrategy } from '../../strategies/supabase.strategy';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { HttpModule } from '@nestjs/axios';

@Global() // Makes this module available everywhere without importing
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'supabase' }),
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.USER_SERVICE_HOST || 'user-service',
          port: parseInt(process.env.USER_SERVICE_PORT || '3002')
        }
      }
    ]),
    HttpModule,
  ],
  providers: [SupabaseStrategy],
  exports: [SupabaseStrategy, PassportModule],
})
export class AuthCommonModule {}
