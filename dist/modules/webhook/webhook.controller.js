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
var WebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_service_1 = require("../services/whatsapp.service");
const chatbot_service_1 = require("../chatbot/chatbot.service");
let WebhookController = WebhookController_1 = class WebhookController {
    constructor(whatsappService, chatbotService) {
        this.whatsappService = whatsappService;
        this.chatbotService = chatbotService;
        this.logger = new common_1.Logger(WebhookController_1.name);
    }
    async verifyWebhook(mode, token, challenge, res) {
        this.logger.log(`Webhook verification request: mode=${mode}, token=${token}`);
        const verificationResponse = this.whatsappService.verifyWebhook(mode, token, challenge);
        if (verificationResponse) {
            this.logger.log('Webhook verified successfully');
            res.status(common_1.HttpStatus.OK).send(verificationResponse);
        }
        else {
            this.logger.warn('Webhook verification failed');
            res.status(common_1.HttpStatus.FORBIDDEN).send('Forbidden');
        }
    }
    async handleWebhook(webhookData, res) {
        try {
            this.logger.log('Received webhook data:', JSON.stringify(webhookData, null, 2));
            const messages = this.whatsappService.processWebhook(webhookData);
            for (const message of messages) {
                this.logger.log(`Processing message from ${message.from}: ${JSON.stringify(message.content)}`);
                await this.chatbotService.processMessage(message);
            }
            res.status(common_1.HttpStatus.OK).send('OK');
        }
        catch (error) {
            this.logger.error('Error processing webhook:', error);
            res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).send('Error');
        }
    }
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('hub.mode')),
    __param(1, (0, common_1.Query)('hub.verify_token')),
    __param(2, (0, common_1.Query)('hub.challenge')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "verifyWebhook", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "handleWebhook", null);
exports.WebhookController = WebhookController = WebhookController_1 = __decorate([
    (0, common_1.Controller)('webhook'),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsAppService,
        chatbot_service_1.ChatbotService])
], WebhookController);
//# sourceMappingURL=webhook.controller.js.map