import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/primsa.service';
import { CareType } from '../users/users.service';

export interface CreateIntakeFormDto {
  userId: string;
  sessionId: string;
  name: string;
  age: number;
  state: string;
  typeOfCare: CareType;
  whatsappNumber: string;
  address: string;
}

export interface CreateSessionDto {
  userId: string;
  type?: CareType;
}

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new session for a user
   */
  async createSession(sessionData: CreateSessionDto) {
    try {
      const session = await this.prisma.session.create({
        data: {
          userId: sessionData.userId,
          type: sessionData.type,
          status: 'IN_PROGRESS',
        },
        include: {
          user: true,
        },
      });

      this.logger.log(
        `Created new session: ${session.id} for user: ${sessionData.userId}`,
      );
      return session;
    } catch (error) {
      this.logger.error(`Failed to create session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  async findById(id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: {
        user: true,
        intakeForm: true,
        reminders: true,
      },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return session;
  }

  /**
   * Get user's active session
   */
  async getActiveSession(userId: string) {
    return this.prisma.session.findFirst({
      where: {
        userId,
        status: 'IN_PROGRESS',
      },
      include: {
        intakeForm: true,
        reminders: true,
      },
    });
  }

  /**
   * Create intake form
   */
  async createIntakeForm(intakeData: CreateIntakeFormDto) {
    try {
      const intakeForm = await this.prisma.intakeForm.create({
        data: {
          userId: intakeData.userId,
          sessionId: intakeData.sessionId,
          name: intakeData.name,
          age: intakeData.age,
          state: intakeData.state,
          typeOfCare: intakeData.typeOfCare,
          whatsappNumber: intakeData.whatsappNumber,
          address: intakeData.address,
          isCompleted: true,
        },
        include: {
          session: true,
          user: true,
        },
      });

      // Update session with care type
      await this.prisma.session.update({
        where: { id: intakeData.sessionId },
        data: { type: intakeData.typeOfCare },
      });

      this.logger.log(
        `Created intake form for session: ${intakeData.sessionId}`,
      );
      return intakeForm;
    } catch (error) {
      this.logger.error(`Failed to create intake form: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process intake form and create necessary procedures
   */
  async processIntakeForm(sessionId: string) {
    const session = await this.findById(sessionId);
    const intakeForm = session.intakeForm;

    if (!intakeForm) {
      throw new NotFoundException('Intake form not found for this session');
    }

    if (intakeForm.typeOfCare === 'MEDICATION') {
      await this.handleMedicationCare(session);
    } else if (intakeForm.typeOfCare === 'SURGICAL') {
      await this.handleSurgicalCare(session);
    }

    return session;
  }

  /**
   * Handle medication care workflow
   */
  private async handleMedicationCare(session: any) {
    // Assign counselor (you can implement counselor assignment logic here)
    const availableCounselor = await this.prisma.counselor.findFirst({
      where: { isActive: true },
    });

    if (availableCounselor) {
      await this.prisma.user.update({
        where: { id: session.userId },
        data: { counselorId: availableCounselor.id },
      });
    }

    // Create reminder for counselor follow-up in 2 weeks
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    await this.prisma.reminder.create({
      data: {
        sessionId: session.id,
        type: 'COUNSELOR_FOLLOWUP',
        dueDate: twoWeeksFromNow,
      },
    });

    // Create feedback form reminder
    const feedbackReminderDate = new Date();
    feedbackReminderDate.setDate(feedbackReminderDate.getDate() + 7);

    await this.prisma.reminder.create({
      data: {
        sessionId: session.id,
        type: 'FEEDBACK_REQUEST',
        dueDate: feedbackReminderDate,
      },
    });

    this.logger.log(
      `Medication care workflow set up for session: ${session.id}`,
    );
  }

  /**
   * Handle surgical care workflow
   */
  private async handleSurgicalCare(session: any) {
    // Create reminder for medical report request
    const reportReminderDate = new Date();
    reportReminderDate.setDate(reportReminderDate.getDate() + 3);

    await this.prisma.reminder.create({
      data: {
        sessionId: session.id,
        type: 'MEDICAL_REPORT_REQUEST',
        dueDate: reportReminderDate,
      },
    });

    this.logger.log(`Surgical care workflow set up for session: ${session.id}`);
  }

  /**
   * Update session status
   */
  async updateSessionStatus(
    sessionId: string,
    status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ESCALATED',
  ) {
    const updateData: any = { status };

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const session = await this.prisma.session.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        user: true,
        intakeForm: true,
      },
    });

    this.logger.log(`Updated session ${sessionId} status to: ${status}`);
    return session;
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId },
      include: {
        intakeForm: true,
        reminders: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all active sessions
   */
  async getActiveSessions() {
    return this.prisma.session.findMany({
      where: { status: 'IN_PROGRESS' },
      include: {
        user: true,
        intakeForm: true,
        reminders: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create feedback form
   */
  async createFeedbackForm(sessionId: string) {
    const existingFeedback = await this.prisma.feedbackForm.findUnique({
      where: { sessionId },
    });

    if (existingFeedback) {
      throw new BadRequestException(
        'Feedback form already exists for this session',
      );
    }

    const feedbackForm = await this.prisma.feedbackForm.create({
      data: {
        sessionId,
      },
      include: {
        session: true,
      },
    });

    this.logger.log(`Created feedback form for session: ${sessionId}`);
    return feedbackForm;
  }

  /**
   * Submit feedback
   */
  async submitFeedback(sessionId: string, rating: number, comment?: string) {
    const feedbackForm = await this.prisma.feedbackForm.update({
      where: { sessionId },
      data: {
        rating,
        comment,
        isCompleted: true,
      },
      include: {
        session: true,
      },
    });

    this.logger.log(`Feedback submitted for session: ${sessionId}`);
    return feedbackForm;
  }

  /**
   * Get pending reminders
   */
  async getPendingReminders() {
    return this.prisma.reminder.findMany({
      where: {
        isSent: false,
        dueDate: {
          lte: new Date(),
        },
      },
      include: {
        session: {
          include: {
            user: true,
            intakeForm: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  /**
   * Mark reminder as sent
   */
  async markReminderAsSent(reminderId: string) {
    return this.prisma.reminder.update({
      where: { id: reminderId },
      data: { isSent: true },
    });
  }

  /**
   * Get session statistics
   */
  async getSessionStats() {
    const totalSessions = await this.prisma.session.count();
    const activeSessions = await this.prisma.session.count({
      where: { status: 'IN_PROGRESS' },
    });
    const completedSessions = await this.prisma.session.count({
      where: { status: 'COMPLETED' },
    });
    const escalatedSessions = await this.prisma.session.count({
      where: { status: 'ESCALATED' },
    });

    return {
      total: totalSessions,
      active: activeSessions,
      completed: completedSessions,
      escalated: escalatedSessions,
    };
  }
}
