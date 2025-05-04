import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('game_achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  name: string;
  
  @Column()
  description: string;
  
  @Column({ name: 'image_url' })
  imageUrl: string;
  
  @Column()
  points: number;
  
  @Column()
  requirements: string;
  
  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}