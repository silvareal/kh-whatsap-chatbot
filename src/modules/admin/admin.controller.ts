import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { UsersService, UpdateUserStatusDto } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { AppealsService, UpdateAppealDto } from '../appeals/appeals.service';

@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly appealsService: AppealsService,
  ) {}

  // User Management
  @Get('users')
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Get('users/pending')
  async getPendingUsers() {
    return this.usersService.getPendingUsers();
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put('users/:id/status')
  @HttpCode(HttpStatus.OK)
  async updateUserStatus(
    @Param('id') id: string,
    @Body() statusData: UpdateUserStatusDto,
  ) {
    return this.usersService.updateUserStatus(id, statusData);
  }

  @Get('users/stats')
  async getUserStats() {
    return this.usersService.getUserStats();
  }

  // Session Management
  @Get('sessions')
  async getAllSessions() {
    return this.sessionsService.getActiveSessions();
  }

  @Get('sessions/:id')
  async getSession(@Param('id') id: string) {
    return this.sessionsService.findById(id);
  }

  @Put('sessions/:id/status')
  @HttpCode(HttpStatus.OK)
  async updateSessionStatus(
    @Param('id') id: string,
    @Body()
    body: { status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ESCALATED' },
  ) {
    return this.sessionsService.updateSessionStatus(id, body.status);
  }

  @Get('sessions/stats')
  async getSessionStats() {
    return this.sessionsService.getSessionStats();
  }

  // Appeal Management
  @Get('appeals')
  async getAllAppeals() {
    return this.appealsService.getAllAppeals();
  }

  @Get('appeals/pending')
  async getPendingAppeals() {
    return this.appealsService.getPendingAppeals();
  }

  @Get('appeals/:id')
  async getAppeal(@Param('id') id: string) {
    return this.appealsService.findById(id);
  }

  @Put('appeals/:id/status')
  @HttpCode(HttpStatus.OK)
  async updateAppealStatus(
    @Param('id') id: string,
    @Body() statusData: UpdateAppealDto,
  ) {
    return this.appealsService.updateAppealStatus(id, statusData);
  }

  @Get('appeals/stats')
  async getAppealStats() {
    return this.appealsService.getAppealStats();
  }

  // Reminder Management
  @Get('reminders/pending')
  async getPendingReminders() {
    return this.sessionsService.getPendingReminders();
  }

  @Post('reminders/:id/mark-sent')
  @HttpCode(HttpStatus.OK)
  async markReminderAsSent(@Param('id') id: string) {
    return this.sessionsService.markReminderAsSent(id);
  }

  // Dashboard Stats
  @Get('dashboard')
  async getDashboardStats() {
    const [userStats, sessionStats, appealStats] = await Promise.all([
      this.usersService.getUserStats(),
      this.sessionsService.getSessionStats(),
      this.appealsService.getAppealStats(),
    ]);

    return {
      users: userStats,
      sessions: sessionStats,
      appeals: appealStats,
      timestamp: new Date().toISOString(),
    };
  }
}
