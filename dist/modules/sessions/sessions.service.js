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
var SessionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const primsa_service_1 = require("../../database/primsa.service");
let SessionsService = SessionsService_1 = class SessionsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SessionsService_1.name);
    }
    async createSession(sessionData) {
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
            this.logger.log(`Created new session: ${session.id} for user: ${sessionData.userId}`);
            return session;
        }
        catch (error) {
            this.logger.error(`Failed to create session: ${error.message}`);
            throw error;
        }
    }
    async findById(id) {
        const session = await this.prisma.session.findUnique({
            where: { id },
            include: {
                user: true,
                intakeForm: true,
                reminders: true,
            },
        });
        if (!session) {
            throw new common_1.NotFoundException(`Session with ID ${id} not found`);
        }
        return session;
    }
    async getActiveSession(userId) {
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
    async createIntakeForm(intakeData) {
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
            await this.prisma.session.update({
                where: { id: intakeData.sessionId },
                data: { type: intakeData.typeOfCare },
            });
            this.logger.log(`Created intake form for session: ${intakeData.sessionId}`);
            return intakeForm;
        }
        catch (error) {
            this.logger.error(`Failed to create intake form: ${error.message}`);
            throw error;
        }
    }
    async processIntakeForm(sessionId) {
        const session = await this.findById(sessionId);
        const intakeForm = session.intakeForm;
        if (!intakeForm) {
            throw new common_1.NotFoundException('Intake form not found for this session');
        }
        if (intakeForm.typeOfCare === 'MEDICATION') {
            await this.handleMedicationCare(session);
        }
        else if (intakeForm.typeOfCare === 'SURGICAL') {
            await this.handleSurgicalCare(session);
        }
        return session;
    }
    async handleMedicationCare(session) {
        const availableCounselor = await this.prisma.counselor.findFirst({
            where: { isActive: true },
        });
        if (availableCounselor) {
            await this.prisma.user.update({
                where: { id: session.userId },
                data: { counselorId: availableCounselor.id },
            });
        }
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
        await this.prisma.reminder.create({
            data: {
                sessionId: session.id,
                type: 'COUNSELOR_FOLLOWUP',
                dueDate: twoWeeksFromNow,
            },
        });
        const feedbackReminderDate = new Date();
        feedbackReminderDate.setDate(feedbackReminderDate.getDate() + 7);
        await this.prisma.reminder.create({
            data: {
                sessionId: session.id,
                type: 'FEEDBACK_REQUEST',
                dueDate: feedbackReminderDate,
            },
        });
        this.logger.log(`Medication care workflow set up for session: ${session.id}`);
    }
    async handleSurgicalCare(session) {
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
    async updateSessionStatus(sessionId, status) {
        const updateData = { status };
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
    async getUserSessions(userId) {
        return this.prisma.session.findMany({
            where: { userId },
            include: {
                intakeForm: true,
                reminders: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
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
    async createFeedbackForm(sessionId) {
        const existingFeedback = await this.prisma.feedbackForm.findUnique({
            where: { sessionId },
        });
        if (existingFeedback) {
            throw new common_1.BadRequestException('Feedback form already exists for this session');
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
    async submitFeedback(sessionId, rating, comment) {
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
    async markReminderAsSent(reminderId) {
        return this.prisma.reminder.update({
            where: { id: reminderId },
            data: { isSent: true },
        });
    }
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
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = SessionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [primsa_service_1.PrismaService])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map