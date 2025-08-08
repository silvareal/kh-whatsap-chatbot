import { Response } from 'express';
import { WhatsAppService } from '../services/whatsapp.service';
import { ChatbotService } from '../chatbot/chatbot.service';
import { WhatsAppWebhookEntry } from '../../types/whatsapp.type';
export declare class WebhookController {
    private readonly whatsappService;
    private readonly chatbotService;
    private readonly logger;
    constructor(whatsappService: WhatsAppService, chatbotService: ChatbotService);
    verifyWebhook(mode: string, token: string, challenge: string, res: Response): Promise<void>;
    handleWebhook(webhookData: WhatsAppWebhookEntry, res: Response): Promise<void>;
}
