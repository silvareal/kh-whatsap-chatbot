import { HttpService } from '@nestjs/axios';
import { WhatsAppMessage, WhatsAppResponse, WhatsAppWebhookEntry, ProcessedMessage } from '../../types/whatsapp.type';
export declare class WhatsAppService {
    private readonly httpService;
    private readonly logger;
    private readonly baseUrl;
    private readonly accessToken;
    private readonly phoneNumberId;
    private readonly verifyToken;
    constructor(httpService: HttpService);
    sendTextMessage(to: string, text: string, previewUrl?: boolean): Promise<WhatsAppResponse>;
    sendImageMessage(to: string, imageUrl: string, caption?: string): Promise<WhatsAppResponse>;
    sendVideoMessage(to: string, videoUrl: string, caption?: string): Promise<WhatsAppResponse>;
    sendAudioMessage(to: string, audioUrl: string): Promise<WhatsAppResponse>;
    sendDocumentMessage(to: string, documentUrl: string, filename?: string, caption?: string): Promise<WhatsAppResponse>;
    sendLocationMessage(to: string, latitude: number, longitude: number, name?: string, address?: string): Promise<WhatsAppResponse>;
    sendContactMessage(to: string, contactName: string, phoneNumber: string, firstName?: string, lastName?: string): Promise<WhatsAppResponse>;
    sendButtonMessage(to: string, bodyText: string, buttons: Array<{
        id: string;
        title: string;
    }>): Promise<WhatsAppResponse>;
    sendListMessage(to: string, bodyText: string, sections: Array<{
        title: string;
        rows: Array<{
            id: string;
            title: string;
            description?: string;
        }>;
    }>): Promise<WhatsAppResponse>;
    sendTemplateMessage(to: string, templateName: string, languageCode?: string, components?: Array<{
        type: 'header' | 'body' | 'button';
        parameters?: Array<{
            type: 'text' | 'image' | 'document' | 'video';
            text?: string;
            image?: {
                link: string;
            };
            document?: {
                link: string;
                filename?: string;
            };
            video?: {
                link: string;
            };
        }>;
    }>): Promise<WhatsAppResponse>;
    sendMessage(message: WhatsAppMessage): Promise<WhatsAppResponse>;
    verifyWebhook(mode: string, token: string, challenge: string): string | null;
    processWebhook(webhookData: WhatsAppWebhookEntry): ProcessedMessage[];
    getMessageStatus(messageId: string): Promise<any>;
    markMessageAsRead(messageId: string): Promise<void>;
    getMediaUrl(mediaId: string): Promise<string>;
    downloadMedia(mediaId: string): Promise<Buffer>;
}
