import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AccountsService } from '../services/accounts.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Account } from '../entities/account.entity';

@ApiTags('accounts')
@Controller('accounts')
export class AccountsController {
  private readonly logger = new Logger(AccountsController.name);

  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get all accounts for the logged in user' })
  @ApiResponse({ status: 200, description: 'Returns all accounts for the user' })
  async getUserAccounts(@Req() req: any) {
    try {
      const userId = req.user.id;
      return await this.accountsService.findByUserId(userId);
    } catch (error) {
      this.logger.error(`Error fetching user accounts: ${error.message}`);
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get a specific account by ID' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Returns the account details' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccount(@Param('id') id: string, @Req() req: any) {
    try {
      const account = await this.accountsService.findById(id);
      
      // Check if this account belongs to the user
      if (account.userId !== req.user.id) {
        throw new BadRequestException('You do not have permission to access this account');
      }
      
      return account;
    } catch (error) {
      this.logger.error(`Error fetching account: ${error.message}`);
      throw error;
    }
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  async createAccount(@Body() accountData: Partial<Account>, @Req() req: any) {
    try {
      // Ensure the account is created for the logged in user
      accountData.userId = req.user.id;
      
      return await this.accountsService.create(accountData);
    } catch (error) {
      this.logger.error(`Error creating account: ${error.message}`);
      throw error;
    }
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update an existing account' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account updated successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async updateAccount(
    @Param('id') id: string,
    @Body() accountData: Partial<Account>,
    @Req() req: any
  ) {
    try {
      // Verify that this account belongs to the user
      const account = await this.accountsService.findById(id);
      if (account.userId !== req.user.id) {
        throw new BadRequestException('You do not have permission to modify this account');
      }
      
      // Don't allow changing the userId
      delete accountData.userId;
      
      return await this.accountsService.update(id, accountData);
    } catch (error) {
      this.logger.error(`Error updating account: ${error.message}`);
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete an account' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async deleteAccount(@Param('id') id: string, @Req() req: any) {
    try {
      // Verify that this account belongs to the user
      const account = await this.accountsService.findById(id);
      if (account.userId !== req.user.id) {
        throw new BadRequestException('You do not have permission to delete this account');
      }
      
      await this.accountsService.delete(id);
      return { message: 'Account deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting account: ${error.message}`);
      throw error;
    }
  }

  @Put(':id/set-primary')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Set an account as the primary account' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account set as primary successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async setPrimaryAccount(@Param('id') id: string, @Req() req: any) {
    try {
      // Verify that this account belongs to the user
      const account = await this.accountsService.findById(id);
      if (account.userId !== req.user.id) {
        throw new BadRequestException('You do not have permission to modify this account');
      }
      
      const updatedAccount = await this.accountsService.setPrimaryAccount(req.user.id, id);
      return { message: 'Account set as primary successfully', account: updatedAccount };
    } catch (error) {
      this.logger.error(`Error setting primary account: ${error.message}`);
      throw error;
    }
  }
}