import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { DriverProfile } from './entities/driver-profile.entity';
import { CreateDriverProfileDto } from './dto/create-driver-profile.dto';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { Role } from '@uit-go-backend/shared';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DriverProfile)
    private readonly driverProfileRepository: Repository<DriverProfile>
  ) {}

  // passenger related
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Set default role to PASSENGER if not provided
    if (!createUserDto.role) {
      createUserDto.role = Role.PASSENGER;
    }
    const user = this.userRepository.create({
      ...createUserDto,
    });
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['driverProfile'],
    });
    if (!user) {
      return null;
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.softRemove(user);
  }

  async getCurrentProfile(userId: string): Promise<User> {
    return this.findOne(userId);
  }

  // driver profile related
  async createDriverProfile(
    createDriverProfileDto: CreateDriverProfileDto
  ): Promise<DriverProfile> {
    const user = await this.userRepository.findOne({
      where: { id: createDriverProfileDto.userId },
    });
    if (!user) {
      throw new NotFoundException(
        `User with ID ${createDriverProfileDto.userId} not found`
      );
    }
    user.role = Role.DRIVER;
    await this.userRepository.save(user);

    const driverProfile = this.driverProfileRepository.create({
      ...createDriverProfileDto,
      user,
    });
    return this.driverProfileRepository.save(driverProfile);
  }

  async findAllDriverProfiles(): Promise<DriverProfile[]> {
    return this.driverProfileRepository.find({ relations: ['user'] });
  }

  async findDriverProfile(id: string): Promise<User | null> {
    const driverProfile = await this.userRepository.findOne({
      where: { id },
      relations: ['driverProfile'],
    });
    if (!driverProfile) {
      return null;
    }
    return driverProfile;
  }

  async updateDriverProfile(
    id: string,
    updateDriverProfileDto: UpdateDriverProfileDto
  ): Promise<DriverProfile> {
    const driverProfile = await this.findDriverProfile(id);
    if (!driverProfile) {
      throw new NotFoundException(`Driver profile with ID ${id} not found`);
    }
    Object.assign(driverProfile, updateDriverProfileDto);
    return this.driverProfileRepository.save(driverProfile);
  }

  async removeDriverProfile(id: string): Promise<void> {
    const driverProfile = await this.findDriverProfile(id);
    await this.driverProfileRepository.softRemove(driverProfile);
  }

  async findDriverByEmail(email: string): Promise<DriverProfile | null> {
    const user = await this.userRepository.findOne({ where: { email, role: Role.DRIVER }, relations: ['driverProfile'] });
    if (!user || !user.driverProfile) {
      return null;
    }
    return user.driverProfile;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['driverProfile']
    });
    return user || null;
  }

  async findPassengerByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email, role: Role.PASSENGER } });
    if (!user) {
      return null;
    }
    return user;
  }

  async findDriverByPassengerId(passengerId: string): Promise<DriverProfile | null> {
    const driverProfile = await this.driverProfileRepository.findOne({
      where: { user: { id: passengerId } },
      relations: ['user'],
    });
    if (!driverProfile) {
      return null;
    }
    return driverProfile;
  }

  async updateDriverProfileByUserId(
    userId: string,
    updateDriverProfileDto: UpdateDriverProfileDto
  ): Promise<DriverProfile> {
    const driverProfile = await this.driverProfileRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!driverProfile) {
      throw new NotFoundException(`Driver profile for user ID ${userId} not found`);
    }
    Object.assign(driverProfile, updateDriverProfileDto);
    return this.driverProfileRepository.save(driverProfile);
  }

  async markVerified(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      user.isVerified = true;
      await this.userRepository.save(user);
    }
    return user;
  }

  // async createUserFromSupabase(payload: {createUserDto: CreateUserDto, supabaseId: string, email: string, isVerified: boolean}) {
  //   const { createUserDto, supabaseId, email, isVerified } = payload;

  //   // check if user already exists
  //   const existingUser = await this.userRepository.findOne({ where: { email } });
  //   if (existingUser) {
  //     throw new ConflictException(`User with email ${email} already exists`);
  //   }

  //   const user = this.userRepository.create({
  //     ...createUserDto,
  //     id: supabaseId,
  //     email,
  //     isVerified,
  //     ...(createUserDto.avatar_url !== undefined && { avatar_url: createUserDto.avatar_url }),
  //   });
  //   return this.userRepository.save(user);
  // }
}

