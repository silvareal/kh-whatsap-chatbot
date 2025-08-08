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
var WhatsAppService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const env_constant_1 = require("../../constants/env.constant");
let WhatsAppService = WhatsAppService_1 = class WhatsAppService {
    constructor(httpService) {
        this.httpService = httpService;
        this.logger = new common_1.Logger(WhatsAppService_1.name);
        this.baseUrl = env_constant_1.WHATSAPP_API_URL;
        this.accessToken = env_constant_1.WHATSAPP_ACCESS_TOKEN;
        this.phoneNumberId = env_constant_1.WHATSAPP_PHONE_NUMBER_ID;
        this.verifyToken = env_constant_1.WHATSAPP_VERIFY_TOKEN;
    }
    async sendTextMessage(to, text, previewUrl) {
        const message = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'text',
            text: {
                body: text,
                preview_url: previewUrl,
            },
        };
        return this.sendMessage(message);
    }
    async sendImageMessage(to, imageUrl, caption) {
        const message = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'image',
            image: {
                link: imageUrl,
                caption,
            },
        };
        return this.sendMessage(message);
    }
    async sendVideoMessage(to, videoUrl, caption) {
        const message = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'video',
            video: {
                link: videoUrl,
                caption,
            },
        };
        return this.sendMessage(message);
    }
    async sendAudioMessage(to, audioUrl) {
        const message = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'audio',
            audio: {
                link: audioUrl,
            },
        };
        return this.sendMessage(message);
    }
    async sendDocumentMessage(to, documentUrl, filename, caption) {
        const message = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'document',
            document: {
                link: documentUrl,
                filename,
                caption,
            },
        };
        return this.sendMessage(message);
    }
    async sendLocationMessage(to, latitude, longitude, name, address) {
        const message = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'location',
            location: {
                latitude,
                longitude,
                name,
                address,
            },
        };
        return this.sendMessage(message);
    }
    async sendContactMessage(to, contactName, phoneNumber, firstName, lastName) {
        const message = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'contact',
            contact: {
                name: {
                    formatted_name: contactName,
                    first_name: firstName,
                    last_name: lastName,
                },
                phones: [
                    {
                        phone: phoneNumber,
                    },
                ],
            },
        };
        return this.sendMessage(message);
    }
    async sendButtonMessage(to, bodyText, buttons) {
        const message = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'interactive',
            interactive: {
                type: 'button',
                body: {
                    text: bodyText,
                },
                action: {
                    buttons: buttons.map((button) => ({
                        type: 'reply',
                        reply: {
                            id: button.id,
                            title: button.title,
                        },
                    })),
                },
            },
        };
        return this.sendMessage(message);
    }
    async sendListMessage(to, bodyText, sections) {
        const message = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'interactive',
            interactive: {
                type: 'list',
                body: {
                    text: bodyText,
                },
                action: {
                    sections,
                },
            },
        };
        return this.sendMessage(message);
    }
    async sendTemplateMessage(to, templateName, languageCode = 'en_US', components) {
        const message = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: languageCode,
                },
                components,
            },
        };
        return this.sendMessage(message);
    }
    async sendMessage(message) {
        try {
            const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
            this.logger.log(`Sending message to ${message.to}: ${JSON.stringify(message)}`);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(url, message, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
            }));
            this.logger.log(`Message sent successfully: ${JSON.stringify(response.data)}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to send message: ${error.message}`, error.stack);
            throw error;
        }
    }
    verifyWebhook(mode, token, challenge) {
        if (mode === 'subscribe' && token === this.verifyToken) {
            this.logger.log('Webhook verified successfully');
            return challenge;
        }
        this.logger.warn('Webhook verification failed');
        return null;
    }
    processWebhook(webhookData) {
        const processedMessages = [];
        for (const change of webhookData.changes) {
            if (change.field === 'messages') {
                const value = change.value;
                if (value.messages && value.contacts) {
                    const contactMap = new Map();
                    value.contacts.forEach((contact) => {
                        contactMap.set(contact.wa_id, contact.profile.name);
                    });
                    value.messages.forEach((message) => {
                        const contactName = contactMap.get(message.from);
                        let content = {};
                        switch (message.type) {
                            case 'text':
                                content = message.text;
                                break;
                            case 'image':
                                content = message.image;
                                break;
                            case 'video':
                                content = message.video;
                                break;
                            case 'audio':
                                content = message.audio;
                                break;
                            case 'document':
                                content = message.document;
                                break;
                            case 'location':
                                content = message.location;
                                break;
                            case 'contacts':
                                content = message.contacts;
                                break;
                            case 'interactive':
                                content = message.interactive;
                                break;
                            default:
                                content = message;
                        }
                        processedMessages.push({
                            from: message.from,
                            messageId: message.id,
                            timestamp: message.timestamp,
                            type: message.type,
                            content,
                            contactName,
                        });
                    });
                }
            }
        }
        this.logger.log(`Processed ${processedMessages.length} messages from webhook`);
        return processedMessages;
    }
    async getMessageStatus(messageId) {
        try {
            const url = `${this.baseUrl}/${messageId}`;
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to get message status: ${error.message}`, error.stack);
            throw error;
        }
    }
    async markMessageAsRead(messageId) {
        try {
            const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
            await (0, rxjs_1.firstValueFrom)(this.httpService.post(url, {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId,
            }, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
            }));
            this.logger.log(`Message ${messageId} marked as read`);
        }
        catch (error) {
            this.logger.error(`Failed to mark message as read: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getMediaUrl(mediaId) {
        try {
            const url = `${this.baseUrl}/${mediaId}`;
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            }));
            return response.data.url;
        }
        catch (error) {
            this.logger.error(`Failed to get media URL: ${error.message}`, error.stack);
            throw error;
        }
    }
    async downloadMedia(mediaId) {
        try {
            const mediaUrl = await this.getMediaUrl(mediaId);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(mediaUrl, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
                responseType: 'arraybuffer',
            }));
            return Buffer.from(response.data);
        }
        catch (error) {
            this.logger.error(`Failed to download media: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.WhatsAppService = WhatsAppService;
exports.WhatsAppService = WhatsAppService = WhatsAppService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], WhatsAppService);
//# sourceMappingURL=whatsapp.service.js.map