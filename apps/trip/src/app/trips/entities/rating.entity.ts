import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Trip } from "./trip.entity";
import { Role } from "@uit-go-backend/shared";

@Entity({ name: 'ratings' })
@Index('idx_ratings_trip_id', ['trip'])
@Index('idx_ratings_rated_user', ['ratedUser'])
@Index('idx_ratings_rater_role', ['raterRole'])
export class Rating {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @ManyToOne(() => Trip, (trip) => trip.ratings, { nullable: false })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  // WHO rated WHOM
  @Column('uuid', { name: 'rated_by', nullable: false })
  ratedBy: string;

  @Column('uuid', { name: 'rated_user', nullable: false })
  ratedUser: string;

  @Column({ 
    name: 'rater_role', 
    type: 'varchar', 
    length: 20, 
    nullable: false 
  })
  raterRole: Role; // 'passenger' | 'driver'

  // Rating Details
  @Column({ name: 'rating', type: 'integer', nullable: false })
  rating: number; // 1-5 stars

  @Column({ name: 'comment', type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: false })
  createdAt: Date;
}
