import { TripStatus, VehicleType } from "@uit-go-backend/shared";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, Index } from "typeorm";
import { Rating } from "./rating.entity";

@Entity('trips')
@Index('idx_trips_passenger_id', ['passengerId'])
@Index('idx_trips_driver_id', ['driverId'], { where: "driver_id IS NOT NULL" })
@Index('idx_trips_status', ['tripStatus'])
@Index('idx_trips_created_at', ['createdAt'])
@Index('idx_trips_searching', ['tripStatus', 'createdAt'], { where: "trip_status = 'searching'" })
export class Trip {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  // References (NO FK - cross-database)
  @Column('uuid', { nullable: false, name: 'passenger_id' })
  passengerId: string;

  @Column('text', { name: 'potential_drivers', array: true, default: [] })
  potentialDrivers?: string[];

  @Column('uuid', { nullable: true, name: 'driver_id' })
  driverId: string;

  // Pickup Location
  @Column({ name: 'pickup_lat', type: 'decimal', precision: 10, scale: 8, nullable: false })
  pickupLat: number;

  @Column({ name: 'pickup_lng', type: 'decimal', precision: 11, scale: 8, nullable: false })
  pickupLng: number;

  @Column({ name: 'pickup_address', type: 'text', nullable: false })
  pickupAddress: string;

  // Dropoff Location
  @Column({ name: 'dropoff_lat', type: 'decimal', precision: 10, scale: 8, nullable: false })
  dropoffLat: number;

  @Column({ name: 'dropoff_lng', type: 'decimal', precision: 11, scale: 8, nullable: false })
  dropoffLng: number;

  @Column({ name: 'dropoff_address', type: 'text', nullable: false })
  dropoffAddress: string;

  // Trip Details
  @Column({
    name: 'vehicle_type',
    type: 'varchar',
    length: 50,
    nullable: false
  })
  vehicleType: VehicleType;

  // Status (Simple State Machine)
  @Column({
    name: 'trip_status',
    type: 'varchar',
    length: 20,
    nullable: false,
    default: 'searching'
  })
  tripStatus: TripStatus;

  // Pricing
  @Column({ name: 'distance_km', type: 'decimal', precision: 6, scale: 2, nullable: true })
  distanceKm: number;

  @Column({ name: 'estimated_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedPrice: number;

  @Column({ name: 'final_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  finalPrice: number;

  // Cancellation
  @Column({
    name: 'cancelled_by',
    type: 'varchar',
    length: 20,
    nullable: true
  })
  cancelledBy: string;

  // Timestamps
  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: false })
  createdAt: Date;

  @Column({ name: 'accepted_at', type: 'timestamp', nullable: true })
  acceptedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: false })
  updatedAt: Date;

  @OneToMany(() => Rating, rating => rating.trip)
  ratings: Rating[];
}
