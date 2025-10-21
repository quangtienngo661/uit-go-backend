import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn, Index } from "typeorm";
import { User } from "./user.entity";
import { VerificationStatus, VehicleType } from "@uit-go-backend/shared";

@Entity({ name: 'driver_profiles' })
@Index('idx_driver_profiles_user_id', ['user'])
@Index('idx_driver_profiles_verification', ['verificationStatus'])
@Index('idx_driver_profiles_rating', ['rating'], { where: "verification_status = 'approved'" })
export class DriverProfile {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  // Foreign Key to users
  @OneToOne(() => User, (user) => user.driverProfile, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Vehicle Information
  @Column({
    name: 'vehicle_type',
    type: 'varchar',
    length: 50,
    nullable: false
  })
  vehicleType: VehicleType;

  @Column({
    name: 'license_plate',
    type: 'varchar',
    length: 20,
    nullable: false,
    unique: true
  })
  licensePlate: string;

  @Column({ name: 'vehicle_model', type: 'varchar', length: 100, nullable: true })
  vehicleModel: string;

  @Column({ name: 'vehicle_color', type: 'varchar', length: 50, nullable: true })
  vehicleColor: string;

  // Verification Status
  @Column({
    name: 'verification_status',
    type: 'varchar',
    length: 20,
    default: 'pending'
  })
  verificationStatus: VerificationStatus;

  // Performance Metrics
  @Column({
    name: 'rating',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 5.00
  })
  rating: number;

  @Column({
    name: 'total_trips',
    type: 'integer',
    default: 0
  })
  totalTrips: number;

  @Column({
    name: 'total_revenue',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0
  })
  totalRevenue: number;

  // Timestamps
  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: false })
  updatedAt: Date;
}
