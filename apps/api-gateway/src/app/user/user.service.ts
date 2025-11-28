import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateDriverProfileDto } from './dto/create-driver-profile.dto';
import { SupabaseStorageService } from '@uit-go-backend/supabase-storage';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    private readonly supabaseStorageService: SupabaseStorageService,
    private readonly configService: ConfigService,
  ) {}

  async createPassenger(data: CreateUserDto, imageBuffer?: Buffer, imageName?: string) {
    if (imageBuffer && imageName) {
      const avatarBucketName =
        this.configService.get<string>('SUPABASE_AVATAR_BUCKET_NAME') || 'avatars';
      try {
        const imageUrl = await this.supabaseStorageService.uploadImageFromBuffer(
          imageBuffer,
          imageName,
          avatarBucketName,
        );
        data.avatarUrl = imageUrl || data.avatarUrl;
      } catch (error) {
        console.error('Error uploading image to Supabase:', error);
      }
    }
    try {
      const result = await firstValueFrom(
        this.userClient.send({ cmd: 'createPassenger' }, data).pipe(
          timeout(5000) // 5 second timeout
        )
      );
      return result;
    } catch (error) {
      this.logger.error('Error calling User Service:', error.message);
      throw error;
    }
  }

  async createDriverProfile(data: CreateDriverProfileDto) {
    return firstValueFrom(
      this.userClient.send({ cmd: 'createDriverProfile' }, data)
    );
  }

  async findAllPassengers() {
    return firstValueFrom(
      this.userClient.send({ cmd: 'findAllPassengers' }, {})
    );
  }

  async findOnePassenger(id: string) {
    return firstValueFrom(
      this.userClient.send({ cmd: 'findOnePassenger' }, id)
    );
  }

  async updatePassenger(id: string, data: UpdateUserDto, imageBuffer?: Buffer, imageName?: string) {
    if (imageBuffer && imageName) {
      const avatarBucketName =
        this.configService.get<string>('SUPABASE_AVATAR_BUCKET_NAME') || 'avatars';
      try {
        const imageUrl = await this.supabaseStorageService.uploadImageFromBuffer(
          imageBuffer,
          imageName,
          avatarBucketName,
        );
        data.avatarUrl = imageUrl || data.avatarUrl;
      } catch (error) {
        console.error('Error uploading image to Supabase:', error);
      }
    }
    return firstValueFrom(
      this.userClient.send({ cmd: 'updatePassenger' }, { id, ...data })
    );
  }

  async removePassenger(id: string) {
    return firstValueFrom(
      this.userClient.send({ cmd: 'removePassenger' }, id)
    );
  }

  async findAllDriverProfiles() {
    return firstValueFrom(
      this.userClient.send({ cmd: 'findAllDriverProfiles' }, {})
    );
  }

  async findOneDriverProfile(id: string) {
    return firstValueFrom(
      this.userClient.send({ cmd: 'findDriverProfile' }, id)
    );
  }

  async updateDriverProfile(id: string, data: any) {
    return firstValueFrom(
      this.userClient.send(
        { cmd: 'updateDriverProfile' },
        { id, ...data }
      )
    );
  }

  async updateDriverProfileByUserId(userId: string, data: any) {
    return firstValueFrom(
      this.userClient.send(
        { cmd: 'updateDriverProfileByUserId' },
        { userId, data }
      )
    );
  }

  async removeDriverProfile(id: string) {
    return firstValueFrom(
      this.userClient.send({ cmd: 'removeDriverProfile' }, id)
    );
  }
}
