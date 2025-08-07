import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WhatsAppService } from '../services/whatsapp.service';
import { ChatbotService } from '../chatbot/chatbot.service';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { AppealsService } from '../appeals/appeals.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [WebhookController],
  providers: [
    WhatsAppService,
    ChatbotService,
    UsersService,
    SessionsService,
    AppealsService,
  ],
  exports: [WebhookController],
})
export class WebhookModule {}
