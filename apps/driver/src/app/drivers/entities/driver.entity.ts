import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { DriverStatus } from '@uit-go-backend/shared'

@Entity({ name: 'drivers' })
export class Driver {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  // Reference to User (NO FK - cross-database)
  @Column('uuid', { name: 'user_id', nullable: false, unique: true })
  userId: string;

  // Current Status
  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    nullable: false,
    default: 'offline'
  })
  status: DriverStatus;

  // Current Location (Fallback - Redis is primary)
  @Column({ name: 'current_lat', type: 'decimal', precision: 10, scale: 8, nullable: true })
  currentLat: number;

  @Column({ name: 'current_lng', type: 'decimal', precision: 11, scale: 8, nullable: true })
  currentLng: number;

  @Column({ name: 'last_location_update', type: 'timestamp', nullable: true })
  lastLocationUpdate: Date;

  // Current Trip
  @Column('uuid', { name: 'current_trip_id', nullable: true })
  currentTripId: string;

  // Simple Daily Stats
  @Column({ name: 'stats_date', type: 'date', default: () => 'CURRENT_DATE' })
  statsDate: Date;

  @Column({ name: 'daily_trips', type: 'integer', default: 0 })
  dailyTrips: number;

  @Column({ name: 'daily_revenue', type: 'decimal', precision: 10, scale: 2, default: 0 })
  dailyRevenue: number;

  // Timestamps
  @Column({ name: 'last_active_at', type: 'timestamp', nullable: true })
  lastActiveAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: false })
  updatedAt: Date;
}
