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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AdminController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const sessions_service_1 = require("../sessions/sessions.service");
const appeals_service_1 = require("../appeals/appeals.service");
let AdminController = AdminController_1 = class AdminController {
    constructor(usersService, sessionsService, appealsService) {
        this.usersService = usersService;
        this.sessionsService = sessionsService;
        this.appealsService = appealsService;
        this.logger = new common_1.Logger(AdminController_1.name);
    }
    async getAllUsers() {
        return this.usersService.getAllUsers();
    }
    async getPendingUsers() {
        return this.usersService.getPendingUsers();
    }
    async getUser(id) {
        return this.usersService.findById(id);
    }
    async updateUserStatus(id, statusData) {
        return this.usersService.updateUserStatus(id, statusData);
    }
    async getUserStats() {
        return this.usersService.getUserStats();
    }
    async getAllSessions() {
        return this.sessionsService.getActiveSessions();
    }
    async getSession(id) {
        return this.sessionsService.findById(id);
    }
    async updateSessionStatus(id, body) {
        return this.sessionsService.updateSessionStatus(id, body.status);
    }
    async getSessionStats() {
        return this.sessionsService.getSessionStats();
    }
    async getAllAppeals() {
        return this.appealsService.getAllAppeals();
    }
    async getPendingAppeals() {
        return this.appealsService.getPendingAppeals();
    }
    async getAppeal(id) {
        return this.appealsService.findById(id);
    }
    async updateAppealStatus(id, statusData) {
        return this.appealsService.updateAppealStatus(id, statusData);
    }
    async getAppealStats() {
        return this.appealsService.getAppealStats();
    }
    async getPendingReminders() {
        return this.sessionsService.getPendingReminders();
    }
    async markReminderAsSent(id) {
        return this.sessionsService.markReminderAsSent(id);
    }
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
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Get)('users/pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingUsers", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUser", null);
__decorate([
    (0, common_1.Put)('users/:id/status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserStatus", null);
__decorate([
    (0, common_1.Get)('users/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserStats", null);
__decorate([
    (0, common_1.Get)('sessions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllSessions", null);
__decorate([
    (0, common_1.Get)('sessions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSession", null);
__decorate([
    (0, common_1.Put)('sessions/:id/status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSessionStatus", null);
__decorate([
    (0, common_1.Get)('sessions/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSessionStats", null);
__decorate([
    (0, common_1.Get)('appeals'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllAppeals", null);
__decorate([
    (0, common_1.Get)('appeals/pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingAppeals", null);
__decorate([
    (0, common_1.Get)('appeals/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAppeal", null);
__decorate([
    (0, common_1.Put)('appeals/:id/status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateAppealStatus", null);
__decorate([
    (0, common_1.Get)('appeals/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAppealStats", null);
__decorate([
    (0, common_1.Get)('reminders/pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingReminders", null);
__decorate([
    (0, common_1.Post)('reminders/:id/mark-sent'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "markReminderAsSent", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboardStats", null);
exports.AdminController = AdminController = AdminController_1 = __decorate([
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        sessions_service_1.SessionsService,
        appeals_service_1.AppealsService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map