import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

dotenv.config();

const config = new ConfigService();

export const NODE_ENV = config.get('NODE_ENV');
export const IS_DEVELOPMENT = NODE_ENV === 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_STAGING = NODE_ENV === 'staging';

export const PORT = config.get('PORT') || 3000;

export const DATABASE_URL = config.getOrThrow('DATABASE_URL');

export const LOGTAIL_SOURCE_TOKEN = config.get('LOGTAIL_SOURCE_TOKEN');
export const LOGTAIL_INGESTING_HOST = config.get('LOGTAIL_INGESTING_HOST');
export const JWT_SECRET = config.get('JWT_SECRET');
export const JWT_EXPIRATION_TIME = config.get('JWT_EXPIRATION_TIME');

// WhatsApp API Configuration
export const WHATSAPP_API_URL =
  config.get('WHATSAPP_API_URL') || 'https://graph.facebook.com/v18.0';
export const WHATSAPP_ACCESS_TOKEN = config.getOrThrow('WHATSAPP_ACCESS_TOKEN');
export const WHATSAPP_PHONE_NUMBER_ID = config.getOrThrow(
  'WHATSAPP_PHONE_NUMBER_ID',
);
export const WHATSAPP_VERIFY_TOKEN =
  config.get('WHATSAPP_VERIFY_TOKEN') || 'default_verify_token';
