import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/primsa.service';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type UserStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BANNED';
export type CareType = 'MEDICATION' | 'SURGICAL';

export interface CreateUserDto {
  whatsappNumber: string;
  fullName: string;
  age: number;
  gender: Gender;
  passport: string;
}

export interface UpdateUserStatusDto {
  status: UserStatus;
  adminNotes?: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new user during initial signup
   */
  async createUser(userData: CreateUserDto) {
    try {
      const user = await this.prisma.user.create({
        data: {
          whatsappNumber: userData.whatsappNumber,
          fullName: userData.fullName,
          age: userData.age,
          gender: userData.gender,
          passport: userData.passport,
          status: 'PENDING',
        },
      });

      this.logger.log(
        `Created new user: ${user.id} with WhatsApp number: ${user.whatsappNumber}`,
      );
      return user;
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find user by WhatsApp number
   */
  async findByWhatsAppNumber(whatsappNumber: string) {
    const user = await this.prisma.user.findUnique({
      where: { whatsappNumber },
      include: {
        sessions: {
          where: { status: 'IN_PROGRESS' },
          include: {
            intakeForm: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        counselor: true,
      },
    });

    return user;
  }

  /**
   * Find user by ID
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        sessions: {
          include: {
            intakeForm: true,
            reminders: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        counselor: true,
        appeals: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Update user status (admin action)
   */
  async updateUserStatus(userId: string, statusData: UpdateUserStatusDto) {
    const user = await this.findById(userId);

    if (statusData.status === 'REJECTED') {
      // Increment rejection count
      const newRejectionCount = user.rejectionCount + 1;
      const isBanned = newRejectionCount >= 3;

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          status: isBanned ? 'BANNED' : 'REJECTED',
          rejectionCount: newRejectionCount,
          isBanned,
        },
      });

      this.logger.log(
        `User ${userId} rejected. Rejection count: ${newRejectionCount}`,
      );
    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: { status: statusData.status },
      });
    }

    return this.findById(userId);
  }

  /**
   * Check if user is a returning user
   */
  async isReturningUser(whatsappNumber: string): Promise<boolean> {
    const user = await this.findByWhatsAppNumber(whatsappNumber);
    return !!user;
  }

  /**
   * Check if user has ongoing session
   */
  async hasOngoingSession(userId: string): Promise<boolean> {
    const user = await this.findById(userId);
    return user.sessions.some((session) => session.status === 'IN_PROGRESS');
  }

  /**
   * Get user's ongoing session
   */
  async getOngoingSession(userId: string) {
    const user = await this.findById(userId);
    return user.sessions.find((session) => session.status === 'IN_PROGRESS');
  }

  /**
   * Assign counselor to user
   */
  async assignCounselor(userId: string, counselorId: string) {
    const user = await this.findById(userId);
    const counselor = await this.prisma.counselor.findUnique({
      where: { id: counselorId },
    });

    if (!counselor) {
      throw new NotFoundException(`Counselor with ID ${counselorId} not found`);
    }

    if (!counselor.isActive) {
      throw new BadRequestException('Counselor is not active');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { counselorId },
    });

    this.logger.log(`Assigned counselor ${counselorId} to user ${userId}`);
    return this.findById(userId);
  }

  /**
   * Get all pending users for admin review
   */
  async getPendingUsers() {
    return this.prisma.user.findMany({
      where: { status: 'PENDING' },
      include: {
        sessions: {
          include: {
            intakeForm: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get all users with their sessions
   */
  async getAllUsers() {
    return this.prisma.user.findMany({
      include: {
        sessions: {
          include: {
            intakeForm: true,
            reminders: true,
          },
        },
        counselor: true,
        appeals: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Check if user can create appeal
   */
  async canCreateAppeal(userId: string): Promise<boolean> {
    const user = await this.findById(userId);
    return user.status === 'REJECTED' && !user.isBanned;
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    const totalUsers = await this.prisma.user.count();
    const pendingUsers = await this.prisma.user.count({
      where: { status: 'PENDING' },
    });
    const acceptedUsers = await this.prisma.user.count({
      where: { status: 'ACCEPTED' },
    });
    const rejectedUsers = await this.prisma.user.count({
      where: { status: 'REJECTED' },
    });
    const bannedUsers = await this.prisma.user.count({
      where: { status: 'BANNED' },
    });

    return {
      total: totalUsers,
      pending: pendingUsers,
      accepted: acceptedUsers,
      rejected: rejectedUsers,
      banned: bannedUsers,
    };
  }
}
