import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/primsa.service';

export interface CreateAppealDto {
  userId: string;
  reason: string;
}

export interface UpdateAppealDto {
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  adminNotes?: string;
}

@Injectable()
export class AppealsService {
  private readonly logger = new Logger(AppealsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new appeal
   */
  async createAppeal(appealData: CreateAppealDto) {
    try {
      const appeal = await this.prisma.appeal.create({
        data: {
          userId: appealData.userId,
          reason: appealData.reason,
          status: 'PENDING',
        },
        include: {
          user: true,
        },
      });

      this.logger.log(`Created appeal for user: ${appealData.userId}`);
      return appeal;
    } catch (error) {
      this.logger.error(`Failed to create appeal: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get appeal by ID
   */
  async findById(id: string) {
    const appeal = await this.prisma.appeal.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!appeal) {
      throw new NotFoundException(`Appeal with ID ${id} not found`);
    }

    return appeal;
  }

  /**
   * Update appeal status (admin action)
   */
  async updateAppealStatus(appealId: string, statusData: UpdateAppealDto) {
    const appeal = await this.findById(appealId);

    if (appeal.status !== 'PENDING') {
      throw new BadRequestException('Appeal has already been processed');
    }

    const updatedAppeal = await this.prisma.appeal.update({
      where: { id: appealId },
      data: {
        status: statusData.status,
        adminNotes: statusData.adminNotes,
      },
      include: {
        user: true,
      },
    });

    // If appeal is accepted, update user status
    if (statusData.status === 'ACCEPTED') {
      await this.prisma.user.update({
        where: { id: appeal.userId },
        data: { status: 'PENDING' }, // Reset to pending for new review
      });
    }

    this.logger.log(
      `Updated appeal ${appealId} status to: ${statusData.status}`,
    );
    return updatedAppeal;
  }

  /**
   * Get all pending appeals
   */
  async getPendingAppeals() {
    return this.prisma.appeal.findMany({
      where: { status: 'PENDING' },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get user's appeals
   */
  async getUserAppeals(userId: string) {
    return this.prisma.appeal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all appeals
   */
  async getAllAppeals() {
    return this.prisma.appeal.findMany({
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Check if user has pending appeal
   */
  async hasPendingAppeal(userId: string): Promise<boolean> {
    const appeal = await this.prisma.appeal.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
    });

    return !!appeal;
  }

  /**
   * Get appeal statistics
   */
  async getAppealStats() {
    const totalAppeals = await this.prisma.appeal.count();
    const pendingAppeals = await this.prisma.appeal.count({
      where: { status: 'PENDING' },
    });
    const acceptedAppeals = await this.prisma.appeal.count({
      where: { status: 'ACCEPTED' },
    });
    const rejectedAppeals = await this.prisma.appeal.count({
      where: { status: 'REJECTED' },
    });

    return {
      total: totalAppeals,
      pending: pendingAppeals,
      accepted: acceptedAppeals,
      rejected: rejectedAppeals,
    };
  }
}
