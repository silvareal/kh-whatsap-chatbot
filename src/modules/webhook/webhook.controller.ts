import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { WhatsAppService } from '../services/whatsapp.service';
import { ChatbotService } from '../chatbot/chatbot.service';
import { WhatsAppWebhookEntry } from '../../types/whatsapp.type';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly chatbotService: ChatbotService,
  ) {}

  /**
   * WhatsApp webhook verification endpoint
   */
  @Get()
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    this.logger.log(
      `Webhook verification request: mode=${mode}, token=${token}`,
    );

    const verificationResponse = this.whatsappService.verifyWebhook(
      mode,
      token,
      challenge,
    );

    if (verificationResponse) {
      this.logger.log('Webhook verified successfully');
      res.status(HttpStatus.OK).send(verificationResponse);
    } else {
      this.logger.warn('Webhook verification failed');
      res.status(HttpStatus.FORBIDDEN).send('Forbidden');
    }
  }

  /**
   * WhatsApp webhook endpoint for receiving messages
   */
  @Post()
  async handleWebhook(
    @Body() webhookData: WhatsAppWebhookEntry,
    @Res() res: Response,
  ) {
    try {
      this.logger.log(
        'Received webhook data:',
        JSON.stringify(webhookData, null, 2),
      );

      // Process webhook data to extract messages
      const messages = this.whatsappService.processWebhook(webhookData);

      // Process each message through the chatbot
      for (const message of messages) {
        this.logger.log(
          `Processing message from ${message.from}: ${JSON.stringify(message.content)}`,
        );
        await this.chatbotService.processMessage(message);
      }

      res.status(HttpStatus.OK).send('OK');
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error');
    }
  }
}
