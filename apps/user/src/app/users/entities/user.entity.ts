import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, Index } from 'typeorm';
import { DriverProfile } from './driver-profile.entity';
import { Role } from '@uit-go-backend/shared';

@Entity({ name: 'users' })
@Index('idx_users_email', ['email'])
@Index('idx_users_role', ['role'])
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  // Authentication
  @Column({ name: 'email', type: 'varchar', length: 255, unique: true, nullable: false })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true, select: false })
  passwordHash: string;

  // Profile
  @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: false })
  fullName: string;

  @Column({ name: 'phone', type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl: string;

  // Role & Status
  @Column({
    name: 'role',
    type: 'varchar',
    length: 20,
    nullable: false
  })
  role: Role;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // Timestamps
  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: false })
  updatedAt: Date;

  // Relations
  @OneToOne(() => DriverProfile, profile => profile.user)
  driverProfile: DriverProfile;
}
