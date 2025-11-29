import { Module } from '@nestjs/common';
import { SupabaseStorageService } from './supabase-storage.service';

@Module({
  controllers: [],
  providers: [SupabaseStorageService],
  exports: [SupabaseStorageService],
})
export class SupabaseStorageModule {}
