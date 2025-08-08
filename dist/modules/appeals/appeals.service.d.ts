import { PrismaService } from '../../database/primsa.service';
export interface CreateAppealDto {
    userId: string;
    reason: string;
}
export interface UpdateAppealDto {
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    adminNotes?: string;
}
export declare class AppealsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createAppeal(appealData: CreateAppealDto): Promise<any>;
    findById(id: string): Promise<any>;
    updateAppealStatus(appealId: string, statusData: UpdateAppealDto): Promise<any>;
    getPendingAppeals(): Promise<any>;
    getUserAppeals(userId: string): Promise<any>;
    getAllAppeals(): Promise<any>;
    hasPendingAppeal(userId: string): Promise<boolean>;
    getAppealStats(): Promise<{
        total: any;
        pending: any;
        accepted: any;
        rejected: any;
    }>;
}
