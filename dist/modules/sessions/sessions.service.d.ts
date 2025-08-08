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
export declare class SessionsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createSession(sessionData: CreateSessionDto): Promise<any>;
    findById(id: string): Promise<any>;
    getActiveSession(userId: string): Promise<any>;
    createIntakeForm(intakeData: CreateIntakeFormDto): Promise<any>;
    processIntakeForm(sessionId: string): Promise<any>;
    private handleMedicationCare;
    private handleSurgicalCare;
    updateSessionStatus(sessionId: string, status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ESCALATED'): Promise<any>;
    getUserSessions(userId: string): Promise<any>;
    getActiveSessions(): Promise<any>;
    createFeedbackForm(sessionId: string): Promise<any>;
    submitFeedback(sessionId: string, rating: number, comment?: string): Promise<any>;
    getPendingReminders(): Promise<any>;
    markReminderAsSent(reminderId: string): Promise<any>;
    getSessionStats(): Promise<{
        total: any;
        active: any;
        completed: any;
        escalated: any;
    }>;
}
