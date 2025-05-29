import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('game_achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ name: 'name' })name: string;
  
  @Column({ name: 'description' })description: string;
  
  @Column({ name: 'image_url' })
  imageUrl: string;
  
  @Column({ name: 'points' })points: number;
  
  @Column({ name: 'requirements' })requirements: string;
  
  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}