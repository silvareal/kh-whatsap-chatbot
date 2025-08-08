import { UsersService, UpdateUserStatusDto } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { AppealsService, UpdateAppealDto } from '../appeals/appeals.service';
export declare class AdminController {
    private readonly usersService;
    private readonly sessionsService;
    private readonly appealsService;
    private readonly logger;
    constructor(usersService: UsersService, sessionsService: SessionsService, appealsService: AppealsService);
    getAllUsers(): Promise<any>;
    getPendingUsers(): Promise<any>;
    getUser(id: string): Promise<any>;
    updateUserStatus(id: string, statusData: UpdateUserStatusDto): Promise<any>;
    getUserStats(): Promise<{
        total: any;
        pending: any;
        accepted: any;
        rejected: any;
        banned: any;
    }>;
    getAllSessions(): Promise<any>;
    getSession(id: string): Promise<any>;
    updateSessionStatus(id: string, body: {
        status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ESCALATED';
    }): Promise<any>;
    getSessionStats(): Promise<{
        total: any;
        active: any;
        completed: any;
        escalated: any;
    }>;
    getAllAppeals(): Promise<any>;
    getPendingAppeals(): Promise<any>;
    getAppeal(id: string): Promise<any>;
    updateAppealStatus(id: string, statusData: UpdateAppealDto): Promise<any>;
    getAppealStats(): Promise<{
        total: any;
        pending: any;
        accepted: any;
        rejected: any;
    }>;
    getPendingReminders(): Promise<any>;
    markReminderAsSent(id: string): Promise<any>;
    getDashboardStats(): Promise<{
        users: {
            total: any;
            pending: any;
            accepted: any;
            rejected: any;
            banned: any;
        };
        sessions: {
            total: any;
            active: any;
            completed: any;
            escalated: any;
        };
        appeals: {
            total: any;
            pending: any;
            accepted: any;
            rejected: any;
        };
        timestamp: string;
    }>;
}
