import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppService } from '../services/whatsapp.service';
import { UsersService, CreateUserDto } from '../users/users.service';
import {
  SessionsService,
  CreateIntakeFormDto,
} from '../sessions/sessions.service';
import { AppealsService, CreateAppealDto } from '../appeals/appeals.service';
import { ProcessedMessage } from '../../types/whatsapp.type';

export interface UserConversationState {
  userId?: string;
  currentStep: string;
  collectedData: any;
  isNewUser: boolean;
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private userStates = new Map<string, UserConversationState>();

  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly appealsService: AppealsService,
  ) {}

  /**
   * Main entry point for processing incoming messages
   */
  async processMessage(message: ProcessedMessage) {
    const { from, content } = message;
    const userState = this.getUserState(from);

    try {
      // Check if user is banned
      if (userState.userId) {
        const user = await this.usersService.findById(userState.userId);
        if (user.isBanned) {
          await this.sendBannedMessage(from);
          return;
        }
      }

      // Handle different conversation states
      switch (userState.currentStep) {
        case 'INITIAL_GREETING':
          await this.handleInitialGreeting(from, content, userState);
          break;
        case 'NEW_USER_SIGNUP':
          await this.handleNewUserSignup(from, content, userState);
          break;
        case 'INTAKE_FORM':
          await this.handleIntakeForm(from, content, userState);
          break;
        case 'APPEAL_FORM':
          await this.handleAppealForm(from, content, userState);
          break;
        case 'FEEDBACK_FORM':
          await this.handleFeedbackForm(from, content, userState);
          break;
        case 'MEDICAL_REPORT_REQUEST':
          await this.handleMedicalReportRequest(from, content, userState);
          break;
        default:
          await this.handleDefaultFlow(from, content, userState);
      }
    } catch (error) {
      this.logger.error(`Error processing message: ${error.message}`);
      await this.sendErrorMessage(from);
    }
  }

  /**
   * Handle initial greeting and determine user flow
   */
  private async handleInitialGreeting(
    from: string,
    content: any,
    userState: UserConversationState,
  ) {
    const userText = content?.body?.toLowerCase() || '';

    if (
      userText.includes('hello') ||
      userText.includes('hi') ||
      userText.includes('start')
    ) {
      const isReturningUser = await this.usersService.isReturningUser(from);

      if (isReturningUser) {
        await this.handleReturningUser(from, userState);
      } else {
        await this.startNewUserSignup(from, userState);
      }
    } else {
      await this.sendWelcomeMessage(from);
    }
  }

  /**
   * Handle new user signup flow
   */
  private async handleNewUserSignup(
    from: string,
    content: any,
    userState: UserConversationState,
  ) {
    const userText = content?.body || '';
    const step = userState.collectedData.step || 0;

    switch (step) {
      case 0: // Full Name
        userState.collectedData.fullName = userText;
        userState.collectedData.step = 1;
        await this.sendMessage(from, 'Please provide your age (number only):');
        break;
      case 1: // Age
        const age = parseInt(userText);
        if (isNaN(age) || age < 1 || age > 120) {
          await this.sendMessage(from, 'Please provide a valid age (1-120):');
          return;
        }
        userState.collectedData.age = age;
        userState.collectedData.step = 2;
        await this.sendGenderOptions(from);
        break;
      case 2: // Gender
        const gender = this.parseGender(userText);
        if (!gender) {
          await this.sendMessage(
            from,
            'Please select a valid gender option (1, 2, or 3):',
          );
          return;
        }
        userState.collectedData.gender = gender;
        userState.collectedData.step = 3;
        await this.sendMessage(from, 'Please provide your passport number:');
        break;
      case 3: // Passport
        userState.collectedData.passport = userText;
        userState.collectedData.step = 4;

        // Create user
        const userData: CreateUserDto = {
          whatsappNumber: from,
          fullName: userState.collectedData.fullName,
          age: userState.collectedData.age,
          gender: userState.collectedData.gender,
          passport: userState.collectedData.passport,
        };

        const user = await this.usersService.createUser(userData);
        userState.userId = user.id;
        userState.currentStep = 'PENDING_APPROVAL';

        await this.sendApprovalPendingMessage(from);
        break;
    }
  }

  /**
   * Handle returning user flow
   */
  private async handleReturningUser(
    from: string,
    userState: UserConversationState,
  ) {
    const user = await this.usersService.findByWhatsAppNumber(from);
    userState.userId = user.id;

    switch (user.status) {
      case 'PENDING':
        await this.sendApprovalPendingMessage(from);
        break;
      case 'ACCEPTED':
        await this.handleAcceptedUser(from, user, userState);
        break;
      case 'REJECTED':
        await this.handleRejectedUser(from, user, userState);
        break;
      case 'BANNED':
        await this.sendBannedMessage(from);
        break;
    }
  }

  /**
   * Handle accepted user flow
   */
  private async handleAcceptedUser(
    from: string,
    user: any,
    userState: UserConversationState,
  ) {
    const hasOngoingSession = await this.usersService.hasOngoingSession(
      user.id,
    );

    if (hasOngoingSession) {
      await this.sendOngoingSessionOptions(from, userState);
    } else {
      await this.startIntakeForm(from, userState);
    }
  }

  /**
   * Handle rejected user flow
   */
  private async handleRejectedUser(
    from: string,
    user: any,
    userState: UserConversationState,
  ) {
    const canAppeal = await this.usersService.canCreateAppeal(user.id);
    const hasPendingAppeal = await this.appealsService.hasPendingAppeal(
      user.id,
    );

    if (hasPendingAppeal) {
      await this.sendAppealPendingMessage(from);
    } else if (canAppeal) {
      await this.startAppealForm(from, userState);
    } else {
      await this.sendRejectionMessage(from, user.rejectionCount);
    }
  }

  /**
   * Handle intake form flow
   */
  private async handleIntakeForm(
    from: string,
    content: any,
    userState: UserConversationState,
  ) {
    const userText = content?.body || '';
    const step = userState.collectedData.intakeStep || 0;

    switch (step) {
      case 0: // Name
        userState.collectedData.intakeName = userText;
        userState.collectedData.intakeStep = 1;
        await this.sendMessage(from, 'Please provide your age:');
        break;
      case 1: // Age
        const age = parseInt(userText);
        if (isNaN(age) || age < 1 || age > 120) {
          await this.sendMessage(from, 'Please provide a valid age (1-120):');
          return;
        }
        userState.collectedData.intakeAge = age;
        userState.collectedData.intakeStep = 2;
        await this.sendMessage(from, 'Please provide your state:');
        break;
      case 2: // State
        userState.collectedData.intakeState = userText;
        userState.collectedData.intakeStep = 3;
        await this.sendCareTypeOptions(from);
        break;
      case 3: // Type of Care
        const careType = this.parseCareType(userText);
        if (!careType) {
          await this.sendMessage(
            from,
            'Please select a valid care type (1 or 2):',
          );
          return;
        }
        userState.collectedData.intakeCareType = careType;
        userState.collectedData.intakeStep = 4;
        await this.sendMessage(from, 'Please provide your WhatsApp number:');
        break;
      case 4: // WhatsApp Number
        userState.collectedData.intakeWhatsappNumber = userText;
        userState.collectedData.intakeStep = 5;
        await this.sendMessage(from, 'Please provide your address:');
        break;
      case 5: // Address
        userState.collectedData.intakeAddress = userText;

        // Create session and intake form
        const session = await this.sessionsService.createSession({
          userId: userState.userId,
        });

        const intakeData: CreateIntakeFormDto = {
          userId: userState.userId,
          sessionId: session.id,
          name: userState.collectedData.intakeName,
          age: userState.collectedData.intakeAge,
          state: userState.collectedData.intakeState,
          typeOfCare: userState.collectedData.intakeCareType,
          whatsappNumber: userState.collectedData.intakeWhatsappNumber,
          address: userState.collectedData.intakeAddress,
        };

        await this.sessionsService.createIntakeForm(intakeData);
        await this.sessionsService.processIntakeForm(session.id);

        userState.currentStep = 'INTAKE_COMPLETED';
        await this.sendIntakeCompletedMessage(
          from,
          userState.collectedData.intakeCareType,
        );
        break;
    }
  }

  /**
   * Handle appeal form flow
   */
  private async handleAppealForm(
    from: string,
    content: any,
    userState: UserConversationState,
  ) {
    const userText = content?.body || '';

    if (userText.length < 10) {
      await this.sendMessage(
        from,
        'Please provide a detailed reason for your appeal (at least 10 characters):',
      );
      return;
    }

    const appealData: CreateAppealDto = {
      userId: userState.userId,
      reason: userText,
    };

    await this.appealsService.createAppeal(appealData);
    userState.currentStep = 'APPEAL_SUBMITTED';
    await this.sendAppealSubmittedMessage(from);
  }

  /**
   * Handle feedback form
   */
  private async handleFeedbackForm(
    from: string,
    content: any,
    userState: UserConversationState,
  ) {
    const userText = content?.body || '';
    const step = userState.collectedData.feedbackStep || 0;

    switch (step) {
      case 0: // Rating
        const rating = parseInt(userText);
        if (isNaN(rating) || rating < 1 || rating > 5) {
          await this.sendMessage(
            from,
            'Please provide a rating between 1 and 5:',
          );
          return;
        }
        userState.collectedData.feedbackRating = rating;
        userState.collectedData.feedbackStep = 1;
        await this.sendMessage(
          from,
          'Please provide any additional comments (or type "skip" to skip):',
        );
        break;
      case 1: // Comments
        const comment = userText.toLowerCase() === 'skip' ? null : userText;
        await this.sessionsService.submitFeedback(
          userState.collectedData.sessionId,
          userState.collectedData.feedbackRating,
          comment,
        );
        userState.currentStep = 'FEEDBACK_COMPLETED';
        await this.sendFeedbackCompletedMessage(from);
        break;
    }
  }

  /**
   * Handle medical report request
   */
  private async handleMedicalReportRequest(
    from: string,
    content: any,
    userState: UserConversationState,
  ) {
    if (content?.type === 'document') {
      // Handle document upload
      await this.sendMessage(
        from,
        'Thank you for uploading your medical report. Our team will review it and get back to you soon.',
      );
      userState.currentStep = 'MEDICAL_REPORT_RECEIVED';
    } else {
      await this.sendMessage(
        from,
        "Please upload your medical report or doctor's scan as a document.",
      );
    }
  }

  /**
   * Handle default flow
   */
  private async handleDefaultFlow(
    from: string,
    content: any,
    userState: UserConversationState,
  ) {
    const userText = content?.body?.toLowerCase() || '';

    if (userText.includes('help')) {
      await this.sendHelpMessage(from);
    } else if (userText.includes('status')) {
      await this.sendStatusMessage(from, userState);
    } else {
      await this.sendDefaultResponse(from);
    }
  }

  // Helper methods for sending messages
  private async sendWelcomeMessage(to: string) {
    await this.whatsappService.sendTextMessage(
      to,
      'Welcome to our healthcare service! 👋\n\nPlease type "hello" or "start" to begin.',
    );
  }

  private async sendMessage(to: string, text: string) {
    await this.whatsappService.sendTextMessage(to, text);
  }

  private async startNewUserSignup(
    from: string,
    userState: UserConversationState,
  ) {
    userState.currentStep = 'NEW_USER_SIGNUP';
    userState.collectedData = { step: 0 };
    await this.sendMessage(
      from,
      "Welcome! Let's get you registered. Please provide your full name:",
    );
  }

  private async sendGenderOptions(from: string) {
    await this.whatsappService.sendButtonMessage(
      from,
      'Please select your gender:',
      [
        { id: 'male', title: 'Male' },
        { id: 'female', title: 'Female' },
        { id: 'other', title: 'Other' },
      ],
    );
  }

  private async sendCareTypeOptions(from: string) {
    await this.whatsappService.sendButtonMessage(
      from,
      'What type of care do you need?',
      [
        { id: 'medication', title: 'Medication' },
        { id: 'surgical', title: 'Surgical' },
      ],
    );
  }

  private async sendApprovalPendingMessage(from: string) {
    await this.sendMessage(
      from,
      'Thank you for your registration! Your application is now under review by our admin team. We will notify you once it has been processed.',
    );
  }

  private async sendOngoingSessionOptions(
    from: string,
    userState: UserConversationState,
  ) {
    await this.whatsappService.sendButtonMessage(
      from,
      'You have an ongoing session. What would you like to do?',
      [
        { id: 'continue', title: 'Continue Ongoing' },
        { id: 'restart', title: 'Start Again' },
      ],
    );
  }

  private async startIntakeForm(
    from: string,
    userState: UserConversationState,
  ) {
    userState.currentStep = 'INTAKE_FORM';
    userState.collectedData = { intakeStep: 0 };
    await this.sendMessage(
      from,
      "Let's complete your intake form. Please provide your full name:",
    );
  }

  private async startAppealForm(
    from: string,
    userState: UserConversationState,
  ) {
    userState.currentStep = 'APPEAL_FORM';
    await this.sendMessage(
      from,
      'Please provide a detailed reason for your appeal. Explain why you believe your application should be reconsidered:',
    );
  }

  private async sendIntakeCompletedMessage(from: string, careType: string) {
    if (careType === 'MEDICATION') {
      await this.sendMessage(
        from,
        'Thank you for completing your intake form! You have been assigned a counselor. You will receive medication information and dosage instructions shortly.',
      );
    } else {
      await this.sendMessage(
        from,
        "Thank you for completing your intake form! Please upload your doctor's report or medical scan as a document.",
      );
    }
  }

  private async sendAppealSubmittedMessage(from: string) {
    await this.sendMessage(
      from,
      'Your appeal has been submitted successfully. Our admin team will review it and get back to you soon.',
    );
  }

  private async sendAppealPendingMessage(from: string) {
    await this.sendMessage(
      from,
      'You already have a pending appeal. Please wait for our admin team to review it.',
    );
  }

  private async sendRejectionMessage(from: string, rejectionCount: number) {
    if (rejectionCount >= 3) {
      await this.sendMessage(
        from,
        'Your account has been permanently banned due to multiple rejections. You cannot appeal further.',
      );
    } else {
      await this.sendMessage(
        from,
        `Your application has been rejected. You have been rejected ${rejectionCount} times. You can appeal this decision.`,
      );
    }
  }

  private async sendBannedMessage(from: string) {
    await this.sendMessage(
      from,
      'Your account has been permanently banned. You cannot use this service.',
    );
  }

  private async sendHelpMessage(from: string) {
    await this.sendMessage(
      from,
      'Here are the available commands:\n• "hello" or "start" - Begin registration\n• "status" - Check your application status\n• "help" - Show this help message',
    );
  }

  private async sendStatusMessage(
    from: string,
    userState: UserConversationState,
  ) {
    if (!userState.userId) {
      await this.sendMessage(
        from,
        'You are not registered yet. Please type "hello" to start registration.',
      );
      return;
    }

    const user = await this.usersService.findById(userState.userId);
    await this.sendMessage(
      from,
      `Your current status: ${user.status}\nRejection count: ${user.rejectionCount}`,
    );
  }

  private async sendDefaultResponse(from: string) {
    await this.sendMessage(
      from,
      'I didn\'t understand that. Type "help" for available commands or "hello" to start registration.',
    );
  }

  private async sendErrorMessage(from: string) {
    await this.sendMessage(
      from,
      'Sorry, something went wrong. Please try again or contact support if the issue persists.',
    );
  }

  private async sendFeedbackCompletedMessage(from: string) {
    await this.sendMessage(
      from,
      'Thank you for your feedback! Your response has been recorded.',
    );
  }

  // Helper methods for parsing user input
  private parseGender(text: string): string | null {
    const normalized = text.toLowerCase().trim();
    if (normalized === '1' || normalized === 'male') return 'MALE';
    if (normalized === '2' || normalized === 'female') return 'FEMALE';
    if (normalized === '3' || normalized === 'other') return 'OTHER';
    return null;
  }

  private parseCareType(text: string): string | null {
    const normalized = text.toLowerCase().trim();
    if (normalized === '1' || normalized === 'medication') return 'MEDICATION';
    if (normalized === '2' || normalized === 'surgical') return 'SURGICAL';
    return null;
  }

  // State management
  private getUserState(whatsappNumber: string): UserConversationState {
    if (!this.userStates.has(whatsappNumber)) {
      this.userStates.set(whatsappNumber, {
        currentStep: 'INITIAL_GREETING',
        collectedData: {},
        isNewUser: true,
      });
    }
    return this.userStates.get(whatsappNumber)!;
  }

  private clearUserState(whatsappNumber: string) {
    this.userStates.delete(whatsappNumber);
  }
}
