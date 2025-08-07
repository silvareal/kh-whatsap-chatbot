import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  WhatsAppMessage,
  WhatsAppResponse,
  WhatsAppWebhookEntry,
  ProcessedMessage,
} from '../../types/whatsapp.type';
import {
  WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_API_URL,
  WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_VERIFY_TOKEN,
} from '../../constants/env.constant';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;
  private readonly verifyToken: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = WHATSAPP_API_URL;
    this.accessToken = WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = WHATSAPP_PHONE_NUMBER_ID;
    this.verifyToken = WHATSAPP_VERIFY_TOKEN;
  }

  /**
   * Send a text message
   */
  async sendTextMessage(
    to: string,
    text: string,
    previewUrl?: boolean,
  ): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
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

  /**
   * Send an image message
   */
  async sendImageMessage(
    to: string,
    imageUrl: string,
    caption?: string,
  ): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
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

  /**
   * Send a video message
   */
  async sendVideoMessage(
    to: string,
    videoUrl: string,
    caption?: string,
  ): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
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

  /**
   * Send an audio message
   */
  async sendAudioMessage(
    to: string,
    audioUrl: string,
  ): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
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

  /**
   * Send a document message
   */
  async sendDocumentMessage(
    to: string,
    documentUrl: string,
    filename?: string,
    caption?: string,
  ): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
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

  /**
   * Send a location message
   */
  async sendLocationMessage(
    to: string,
    latitude: number,
    longitude: number,
    name?: string,
    address?: string,
  ): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
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

  /**
   * Send a contact message
   */
  async sendContactMessage(
    to: string,
    contactName: string,
    phoneNumber: string,
    firstName?: string,
    lastName?: string,
  ): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
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

  /**
   * Send an interactive button message
   */
  async sendButtonMessage(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>,
  ): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
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
            type: 'reply' as const,
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

  /**
   * Send an interactive list message
   */
  async sendListMessage(
    to: string,
    bodyText: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>,
  ): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
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

  /**
   * Send a template message
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'en_US',
    components?: Array<{
      type: 'header' | 'body' | 'button';
      parameters?: Array<{
        type: 'text' | 'image' | 'document' | 'video';
        text?: string;
        image?: { link: string };
        document?: { link: string; filename?: string };
        video?: { link: string };
      }>;
    }>,
  ): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
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

  /**
   * Generic method to send any WhatsApp message
   */
  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;

      this.logger.log(
        `Sending message to ${message.to}: ${JSON.stringify(message)}`,
      );

      const response = await firstValueFrom(
        this.httpService.post<WhatsAppResponse>(url, message, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      this.logger.log(
        `Message sent successfully: ${JSON.stringify(response.data)}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to send message: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Verify webhook challenge
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.verifyToken) {
      this.logger.log('Webhook verified successfully');
      return challenge;
    }

    this.logger.warn('Webhook verification failed');
    return null;
  }

  /**
   * Process incoming webhook data
   */
  processWebhook(webhookData: WhatsAppWebhookEntry): ProcessedMessage[] {
    const processedMessages: ProcessedMessage[] = [];

    for (const change of webhookData.changes) {
      if (change.field === 'messages') {
        const value = change.value;

        if (value.messages && value.contacts) {
          // Create a map of contact names for easy lookup
          const contactMap = new Map();
          value.contacts.forEach((contact) => {
            contactMap.set(contact.wa_id, contact.profile.name);
          });

          // Process each message
          value.messages.forEach((message) => {
            const contactName = contactMap.get(message.from);

            let content: any = {};

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

    this.logger.log(
      `Processed ${processedMessages.length} messages from webhook`,
    );
    return processedMessages;
  }

  /**
   * Get message status
   */
  async getMessageStatus(messageId: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/${messageId}`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to get message status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;

      await firstValueFrom(
        this.httpService.post(
          url,
          {
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId,
          },
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(`Message ${messageId} marked as read`);
    } catch (error) {
      this.logger.error(
        `Failed to mark message as read: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get media URL
   */
  async getMediaUrl(mediaId: string): Promise<string> {
    try {
      const url = `${this.baseUrl}/${mediaId}`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }),
      );

      return response.data.url;
    } catch (error) {
      this.logger.error(
        `Failed to get media URL: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Download media
   */
  async downloadMedia(mediaId: string): Promise<Buffer> {
    try {
      const mediaUrl = await this.getMediaUrl(mediaId);

      const response = await firstValueFrom(
        this.httpService.get(mediaUrl, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          responseType: 'arraybuffer',
        }),
      );

      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(
        `Failed to download media: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
