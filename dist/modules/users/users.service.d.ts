import { PrismaService } from '../../database/primsa.service';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type UserStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BANNED';
export type CareType = 'MEDICATION' | 'SURGICAL';
export interface CreateUserDto {
    whatsappNumber: string;
    fullName: string;
    age: number;
    gender: Gender;
    passport: string;
}
export interface UpdateUserStatusDto {
    status: UserStatus;
    adminNotes?: string;
}
export declare class UsersService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createUser(userData: CreateUserDto): Promise<any>;
    findByWhatsAppNumber(whatsappNumber: string): Promise<any>;
    findById(id: string): Promise<any>;
    updateUserStatus(userId: string, statusData: UpdateUserStatusDto): Promise<any>;
    isReturningUser(whatsappNumber: string): Promise<boolean>;
    hasOngoingSession(userId: string): Promise<boolean>;
    getOngoingSession(userId: string): Promise<any>;
    assignCounselor(userId: string, counselorId: string): Promise<any>;
    getPendingUsers(): Promise<any>;
    getAllUsers(): Promise<any>;
    canCreateAppeal(userId: string): Promise<boolean>;
    getUserStats(): Promise<{
        total: any;
        pending: any;
        accepted: any;
        rejected: any;
        banned: any;
    }>;
}
