"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const auth_guard_1 = require("./guards/auth.guard");
const core_2 = require("@nestjs/core");
const nestjs_pino_1 = require("nestjs-pino");
const nestjs_pino_2 = require("nestjs-pino");
const compression = require("compression");
async function bootstrap() {
    process.env.TZ = 'Africa/Lagos';
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const logger = app.get(nestjs_pino_2.Logger);
    app.use(compression());
    app.enableCors();
    app.setGlobalPrefix('api/v1');
    app.useGlobalGuards(new auth_guard_1.AuthGuard(app.get(core_2.Reflector)));
    app.useLogger(logger);
    app.useGlobalInterceptors(new nestjs_pino_1.LoggerErrorInterceptor());
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map