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
var AppealsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppealsService = void 0;
const common_1 = require("@nestjs/common");
const primsa_service_1 = require("../../database/primsa.service");
let AppealsService = AppealsService_1 = class AppealsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AppealsService_1.name);
    }
    async createAppeal(appealData) {
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
        }
        catch (error) {
            this.logger.error(`Failed to create appeal: ${error.message}`);
            throw error;
        }
    }
    async findById(id) {
        const appeal = await this.prisma.appeal.findUnique({
            where: { id },
            include: {
                user: true,
            },
        });
        if (!appeal) {
            throw new common_1.NotFoundException(`Appeal with ID ${id} not found`);
        }
        return appeal;
    }
    async updateAppealStatus(appealId, statusData) {
        const appeal = await this.findById(appealId);
        if (appeal.status !== 'PENDING') {
            throw new common_1.BadRequestException('Appeal has already been processed');
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
        if (statusData.status === 'ACCEPTED') {
            await this.prisma.user.update({
                where: { id: appeal.userId },
                data: { status: 'PENDING' },
            });
        }
        this.logger.log(`Updated appeal ${appealId} status to: ${statusData.status}`);
        return updatedAppeal;
    }
    async getPendingAppeals() {
        return this.prisma.appeal.findMany({
            where: { status: 'PENDING' },
            include: {
                user: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async getUserAppeals(userId) {
        return this.prisma.appeal.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getAllAppeals() {
        return this.prisma.appeal.findMany({
            include: {
                user: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async hasPendingAppeal(userId) {
        const appeal = await this.prisma.appeal.findFirst({
            where: {
                userId,
                status: 'PENDING',
            },
        });
        return !!appeal;
    }
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
};
exports.AppealsService = AppealsService;
exports.AppealsService = AppealsService = AppealsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [primsa_service_1.PrismaService])
], AppealsService);
//# sourceMappingURL=appeals.service.js.map