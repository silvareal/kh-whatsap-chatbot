"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ChatbotService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotService = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_service_1 = require("../services/whatsapp.service");
const users_service_1 = require("../users/users.service");
const sessions_service_1 = require("../sessions/sessions.service");
const appeals_service_1 = require("../appeals/appeals.service");
let ChatbotService = ChatbotService_1 = class ChatbotService {
    constructor(whatsappService, usersService, sessionsService, appealsService) {
        this.whatsappService = whatsappService;
        this.usersService = usersService;
        this.sessionsService = sessionsService;
        this.appealsService = appealsService;
        this.logger = new common_1.Logger(ChatbotService_1.name);
        this.userStates = new Map();
    }
    async processMessage(message) {
        const { from, content } = message;
        const userState = this.getUserState(from);
        try {
            if (userState.userId) {
                const user = await this.usersService.findById(userState.userId);
                if (user.isBanned) {
                    await this.sendBannedMessage(from);
                    return;
                }
            }
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
        }
        catch (error) {
            this.logger.error(`Error processing message: ${error.message}`);
            await this.sendErrorMessage(from);
        }
    }
    async handleInitialGreeting(from, content, userState) {
        const userText = content?.body?.toLowerCase() || '';
        if (userText.includes('hello') ||
            userText.includes('hi') ||
            userText.includes('start')) {
            const isReturningUser = await this.usersService.isReturningUser(from);
            if (isReturningUser) {
                await this.handleReturningUser(from, userState);
            }
            else {
                await this.startNewUserSignup(from, userState);
            }
        }
        else {
            await this.sendWelcomeMessage(from);
        }
    }
    async handleNewUserSignup(from, content, userState) {
        const userText = content?.body || '';
        const step = userState.collectedData.step || 0;
        switch (step) {
            case 0:
                userState.collectedData.fullName = userText;
                userState.collectedData.step = 1;
                await this.sendMessage(from, 'Please provide your age (number only):');
                break;
            case 1:
                const age = parseInt(userText);
                if (isNaN(age) || age < 1 || age > 120) {
                    await this.sendMessage(from, 'Please provide a valid age (1-120):');
                    return;
                }
                userState.collectedData.age = age;
                userState.collectedData.step = 2;
                await this.sendGenderOptions(from);
                break;
            case 2:
                const gender = this.parseGender(userText);
                if (!gender) {
                    await this.sendMessage(from, 'Please select a valid gender option (1, 2, or 3):');
                    return;
                }
                userState.collectedData.gender = gender;
                userState.collectedData.step = 3;
                await this.sendMessage(from, 'Please provide your passport number:');
                break;
            case 3:
                userState.collectedData.passport = userText;
                userState.collectedData.step = 4;
                const userData = {
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
    async handleReturningUser(from, userState) {
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
    async handleAcceptedUser(from, user, userState) {
        const hasOngoingSession = await this.usersService.hasOngoingSession(user.id);
        if (hasOngoingSession) {
            await this.sendOngoingSessionOptions(from, userState);
        }
        else {
            await this.startIntakeForm(from, userState);
        }
    }
    async handleRejectedUser(from, user, userState) {
        const canAppeal = await this.usersService.canCreateAppeal(user.id);
        const hasPendingAppeal = await this.appealsService.hasPendingAppeal(user.id);
        if (hasPendingAppeal) {
            await this.sendAppealPendingMessage(from);
        }
        else if (canAppeal) {
            await this.startAppealForm(from, userState);
        }
        else {
            await this.sendRejectionMessage(from, user.rejectionCount);
        }
    }
    async handleIntakeForm(from, content, userState) {
        const userText = content?.body || '';
        const step = userState.collectedData.intakeStep || 0;
        switch (step) {
            case 0:
                userState.collectedData.intakeName = userText;
                userState.collectedData.intakeStep = 1;
                await this.sendMessage(from, 'Please provide your age:');
                break;
            case 1:
                const age = parseInt(userText);
                if (isNaN(age) || age < 1 || age > 120) {
                    await this.sendMessage(from, 'Please provide a valid age (1-120):');
                    return;
                }
                userState.collectedData.intakeAge = age;
                userState.collectedData.intakeStep = 2;
                await this.sendMessage(from, 'Please provide your state:');
                break;
            case 2:
                userState.collectedData.intakeState = userText;
                userState.collectedData.intakeStep = 3;
                await this.sendCareTypeOptions(from);
                break;
            case 3:
                const careType = this.parseCareType(userText);
                if (!careType) {
                    await this.sendMessage(from, 'Please select a valid care type (1 or 2):');
                    return;
                }
                userState.collectedData.intakeCareType = careType;
                userState.collectedData.intakeStep = 4;
                await this.sendMessage(from, 'Please provide your WhatsApp number:');
                break;
            case 4:
                userState.collectedData.intakeWhatsappNumber = userText;
                userState.collectedData.intakeStep = 5;
                await this.sendMessage(from, 'Please provide your address:');
                break;
            case 5:
                userState.collectedData.intakeAddress = userText;
                const session = await this.sessionsService.createSession({
                    userId: userState.userId,
                });
                const intakeData = {
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
                await this.sendIntakeCompletedMessage(from, userState.collectedData.intakeCareType);
                break;
        }
    }
    async handleAppealForm(from, content, userState) {
        const userText = content?.body || '';
        if (userText.length < 10) {
            await this.sendMessage(from, 'Please provide a detailed reason for your appeal (at least 10 characters):');
            return;
        }
        const appealData = {
            userId: userState.userId,
            reason: userText,
        };
        await this.appealsService.createAppeal(appealData);
        userState.currentStep = 'APPEAL_SUBMITTED';
        await this.sendAppealSubmittedMessage(from);
    }
    async handleFeedbackForm(from, content, userState) {
        const userText = content?.body || '';
        const step = userState.collectedData.feedbackStep || 0;
        switch (step) {
            case 0:
                const rating = parseInt(userText);
                if (isNaN(rating) || rating < 1 || rating > 5) {
                    await this.sendMessage(from, 'Please provide a rating between 1 and 5:');
                    return;
                }
                userState.collectedData.feedbackRating = rating;
                userState.collectedData.feedbackStep = 1;
                await this.sendMessage(from, 'Please provide any additional comments (or type "skip" to skip):');
                break;
            case 1:
                const comment = userText.toLowerCase() === 'skip' ? null : userText;
                await this.sessionsService.submitFeedback(userState.collectedData.sessionId, userState.collectedData.feedbackRating, comment);
                userState.currentStep = 'FEEDBACK_COMPLETED';
                await this.sendFeedbackCompletedMessage(from);
                break;
        }
    }
    async handleMedicalReportRequest(from, content, userState) {
        if (content?.type === 'document') {
            await this.sendMessage(from, 'Thank you for uploading your medical report. Our team will review it and get back to you soon.');
            userState.currentStep = 'MEDICAL_REPORT_RECEIVED';
        }
        else {
            await this.sendMessage(from, "Please upload your medical report or doctor's scan as a document.");
        }
    }
    async handleDefaultFlow(from, content, userState) {
        const userText = content?.body?.toLowerCase() || '';
        if (userText.includes('help')) {
            await this.sendHelpMessage(from);
        }
        else if (userText.includes('status')) {
            await this.sendStatusMessage(from, userState);
        }
        else {
            await this.sendDefaultResponse(from);
        }
    }
    async sendWelcomeMessage(to) {
        await this.whatsappService.sendTextMessage(to, 'Welcome to our healthcare service! 👋\n\nPlease type "hello" or "start" to begin.');
    }
    async sendMessage(to, text) {
        await this.whatsappService.sendTextMessage(to, text);
    }
    async startNewUserSignup(from, userState) {
        userState.currentStep = 'NEW_USER_SIGNUP';
        userState.collectedData = { step: 0 };
        await this.sendMessage(from, "Welcome! Let's get you registered. Please provide your full name:");
    }
    async sendGenderOptions(from) {
        await this.whatsappService.sendButtonMessage(from, 'Please select your gender:', [
            { id: 'male', title: 'Male' },
            { id: 'female', title: 'Female' },
            { id: 'other', title: 'Other' },
        ]);
    }
    async sendCareTypeOptions(from) {
        await this.whatsappService.sendButtonMessage(from, 'What type of care do you need?', [
            { id: 'medication', title: 'Medication' },
            { id: 'surgical', title: 'Surgical' },
        ]);
    }
    async sendApprovalPendingMessage(from) {
        await this.sendMessage(from, 'Thank you for your registration! Your application is now under review by our admin team. We will notify you once it has been processed.');
    }
    async sendOngoingSessionOptions(from, userState) {
        await this.whatsappService.sendButtonMessage(from, 'You have an ongoing session. What would you like to do?', [
            { id: 'continue', title: 'Continue Ongoing' },
            { id: 'restart', title: 'Start Again' },
        ]);
    }
    async startIntakeForm(from, userState) {
        userState.currentStep = 'INTAKE_FORM';
        userState.collectedData = { intakeStep: 0 };
        await this.sendMessage(from, "Let's complete your intake form. Please provide your full name:");
    }
    async startAppealForm(from, userState) {
        userState.currentStep = 'APPEAL_FORM';
        await this.sendMessage(from, 'Please provide a detailed reason for your appeal. Explain why you believe your application should be reconsidered:');
    }
    async sendIntakeCompletedMessage(from, careType) {
        if (careType === 'MEDICATION') {
            await this.sendMessage(from, 'Thank you for completing your intake form! You have been assigned a counselor. You will receive medication information and dosage instructions shortly.');
        }
        else {
            await this.sendMessage(from, "Thank you for completing your intake form! Please upload your doctor's report or medical scan as a document.");
        }
    }
    async sendAppealSubmittedMessage(from) {
        await this.sendMessage(from, 'Your appeal has been submitted successfully. Our admin team will review it and get back to you soon.');
    }
    async sendAppealPendingMessage(from) {
        await this.sendMessage(from, 'You already have a pending appeal. Please wait for our admin team to review it.');
    }
    async sendRejectionMessage(from, rejectionCount) {
        if (rejectionCount >= 3) {
            await this.sendMessage(from, 'Your account has been permanently banned due to multiple rejections. You cannot appeal further.');
        }
        else {
            await this.sendMessage(from, `Your application has been rejected. You have been rejected ${rejectionCount} times. You can appeal this decision.`);
        }
    }
    async sendBannedMessage(from) {
        await this.sendMessage(from, 'Your account has been permanently banned. You cannot use this service.');
    }
    async sendHelpMessage(from) {
        await this.sendMessage(from, 'Here are the available commands:\n• "hello" or "start" - Begin registration\n• "status" - Check your application status\n• "help" - Show this help message');
    }
    async sendStatusMessage(from, userState) {
        if (!userState.userId) {
            await this.sendMessage(from, 'You are not registered yet. Please type "hello" to start registration.');
            return;
        }
        const user = await this.usersService.findById(userState.userId);
        await this.sendMessage(from, `Your current status: ${user.status}\nRejection count: ${user.rejectionCount}`);
    }
    async sendDefaultResponse(from) {
        await this.sendMessage(from, 'I didn\'t understand that. Type "help" for available commands or "hello" to start registration.');
    }
    async sendErrorMessage(from) {
        await this.sendMessage(from, 'Sorry, something went wrong. Please try again or contact support if the issue persists.');
    }
    async sendFeedbackCompletedMessage(from) {
        await this.sendMessage(from, 'Thank you for your feedback! Your response has been recorded.');
    }
    parseGender(text) {
        const normalized = text.toLowerCase().trim();
        if (normalized === '1' || normalized === 'male')
            return 'MALE';
        if (normalized === '2' || normalized === 'female')
            return 'FEMALE';
        if (normalized === '3' || normalized === 'other')
            return 'OTHER';
        return null;
    }
    parseCareType(text) {
        const normalized = text.toLowerCase().trim();
        if (normalized === '1' || normalized === 'medication')
            return 'MEDICATION';
        if (normalized === '2' || normalized === 'surgical')
            return 'SURGICAL';
        return null;
    }
    getUserState(whatsappNumber) {
        if (!this.userStates.has(whatsappNumber)) {
            this.userStates.set(whatsappNumber, {
                currentStep: 'INITIAL_GREETING',
                collectedData: {},
                isNewUser: true,
            });
        }
        return this.userStates.get(whatsappNumber);
    }
    clearUserState(whatsappNumber) {
        this.userStates.delete(whatsappNumber);
    }
};
exports.ChatbotService = ChatbotService;
exports.ChatbotService = ChatbotService = ChatbotService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsAppService,
        users_service_1.UsersService,
        sessions_service_1.SessionsService,
        appeals_service_1.AppealsService])
], ChatbotService);
//# sourceMappingURL=chatbot.service.js.map