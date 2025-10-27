import { Module } from '@nestjs/common';
import { SupabaseAdminProvider } from './supabase-admin.provider';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [SupabaseAdminProvider],
  exports: [SupabaseAdminProvider],
})
export class SupabaseAdminModule {}
