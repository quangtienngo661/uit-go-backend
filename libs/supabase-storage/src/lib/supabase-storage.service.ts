import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { sanitizeFileName } from '@uit-go-backend/shared';

@Injectable()
export class SupabaseStorageService {
  private supabase: SupabaseClient;

  private readonly avatarBucket = process.env['SUPABASE_AVATAR_BUCKET_NAME'] || 'avatars';

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL is not configured');
    }
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    if (!supabaseKey) {
      throw new Error('SUPABASE_KEY is not configured');
    }
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // upload image from buffer
  async uploadImageFromBuffer(
    buffer: Buffer,
    fileName: string,
    bucketName: string,
  ): Promise<string | null> {
    const ext = fileName.split('.').pop();
    let contentType = 'image/png'; // default fallback
    fileName = sanitizeFileName(fileName);
    const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${fileName}`;

    switch (ext?.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
    }

    const { data, error } = await this.supabase.storage.from(bucketName).upload(uniqueFileName, buffer, {
      contentType: contentType,
      upsert: true,
    });
    if (error) {
      throw error;
    }

    const { data: publicUrlData } = this.supabase.storage.from(bucketName).getPublicUrl(uniqueFileName);
    if (!publicUrlData || !publicUrlData.publicUrl) {
      return null;
    }

    return publicUrlData.publicUrl;
  }

  async uploadImageFromFile(
    filePath: string,
    fileName: string,
    bucketName: string,
  ): Promise<string | null> {
    const buffer = fs.readFileSync(filePath);
    fs.unlinkSync(filePath);
    return await this.uploadImageFromBuffer(buffer, fileName, bucketName);
  }


}

