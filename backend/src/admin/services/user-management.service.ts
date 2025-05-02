import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class UserManagementService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUsers(query: any) {
    const { _start = 0, _end = 10, _sort = 'createdAt', _order = 'DESC', q } = query;
    
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    
    // Handle search if 'q' parameter is provided
    if (q) {
      queryBuilder.where('user.username LIKE :search OR user.email LIKE :search OR user.fullName LIKE :search', {
        search: `%${q}%`,
      });
    }
    
    // Apply sorting
    const sortOrder = _order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    queryBuilder.orderBy(`user.${_sort}`, sortOrder);
    
    // Get total count for header
    const total = await queryBuilder.getCount();
    
    // Apply pagination
    queryBuilder.skip(Number(_start)).take(Number(_end) - Number(_start));
    
    // Execute query
    const users = await queryBuilder.getMany();
    
    // Return user data with X-Total-Count header
    return {
      users,
      total
    };
  }

  async getUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async updateUserStatus(id: string, statusDto: any) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    // Update user status based on provided DTO
    if (statusDto.isActive !== undefined) {
      user.isActive = statusDto.isActive;
    }
    
    if (statusDto.isVerified !== undefined) {
      user.isVerified = statusDto.isVerified;
    }
    
    // Save changes
    return this.userRepository.save(user);
  }

  async getUserSessions(query: any) {
    // This is a placeholder for session monitoring
    // In a real implementation, this would connect to your auth session storage
    return {
      sessions: [],
      total: 0
    };
  }

  async terminateSession(id: string) {
    // This is a placeholder for session termination
    // In a real implementation, this would invalidate the specific session
    return { success: true, message: 'Session terminated' };
  }
}