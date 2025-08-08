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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const primsa_service_1 = require("../../database/primsa.service");
let UsersService = UsersService_1 = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(UsersService_1.name);
    }
    async createUser(userData) {
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
            this.logger.log(`Created new user: ${user.id} with WhatsApp number: ${user.whatsappNumber}`);
            return user;
        }
        catch (error) {
            this.logger.error(`Failed to create user: ${error.message}`);
            throw error;
        }
    }
    async findByWhatsAppNumber(whatsappNumber) {
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
    async findById(id) {
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
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }
    async updateUserStatus(userId, statusData) {
        const user = await this.findById(userId);
        if (statusData.status === 'REJECTED') {
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
            this.logger.log(`User ${userId} rejected. Rejection count: ${newRejectionCount}`);
        }
        else {
            await this.prisma.user.update({
                where: { id: userId },
                data: { status: statusData.status },
            });
        }
        return this.findById(userId);
    }
    async isReturningUser(whatsappNumber) {
        const user = await this.findByWhatsAppNumber(whatsappNumber);
        return !!user;
    }
    async hasOngoingSession(userId) {
        const user = await this.findById(userId);
        return user.sessions.some((session) => session.status === 'IN_PROGRESS');
    }
    async getOngoingSession(userId) {
        const user = await this.findById(userId);
        return user.sessions.find((session) => session.status === 'IN_PROGRESS');
    }
    async assignCounselor(userId, counselorId) {
        const user = await this.findById(userId);
        const counselor = await this.prisma.counselor.findUnique({
            where: { id: counselorId },
        });
        if (!counselor) {
            throw new common_1.NotFoundException(`Counselor with ID ${counselorId} not found`);
        }
        if (!counselor.isActive) {
            throw new common_1.BadRequestException('Counselor is not active');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { counselorId },
        });
        this.logger.log(`Assigned counselor ${counselorId} to user ${userId}`);
        return this.findById(userId);
    }
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
    async canCreateAppeal(userId) {
        const user = await this.findById(userId);
        return user.status === 'REJECTED' && !user.isBanned;
    }
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [primsa_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map