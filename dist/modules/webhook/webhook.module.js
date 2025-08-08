"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookModule = void 0;
const common_1 = require("@nestjs/common");
const webhook_controller_1 = require("./webhook.controller");
const whatsapp_service_1 = require("../services/whatsapp.service");
const chatbot_service_1 = require("../chatbot/chatbot.service");
const users_service_1 = require("../users/users.service");
const sessions_service_1 = require("../sessions/sessions.service");
const appeals_service_1 = require("../appeals/appeals.service");
const database_module_1 = require("../../database/database.module");
let WebhookModule = class WebhookModule {
};
exports.WebhookModule = WebhookModule;
exports.WebhookModule = WebhookModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        controllers: [webhook_controller_1.WebhookController],
        providers: [
            whatsapp_service_1.WhatsAppService,
            chatbot_service_1.ChatbotService,
            users_service_1.UsersService,
            sessions_service_1.SessionsService,
            appeals_service_1.AppealsService,
        ],
        exports: [webhook_controller_1.WebhookController],
    })
], WebhookModule);
//# sourceMappingURL=webhook.module.js.map