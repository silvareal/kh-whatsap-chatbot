import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { WhatsAppService } from '../services/whatsapp.service';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { AppealsService } from '../appeals/appeals.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [
    ChatbotService,
    WhatsAppService,
    UsersService,
    SessionsService,
    AppealsService,
  ],
  exports: [ChatbotService],
})
export class ChatbotModule {}
