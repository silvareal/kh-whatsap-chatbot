# WhatsApp Healthcare Chatbot

A comprehensive WhatsApp chatbot system built with NestJS for healthcare service management. The system handles user registration, intake forms, session management, appeals, and automated workflows.

## Features

- **User Registration**: Complete signup flow with admin approval
- **Intake Forms**: Comprehensive patient information collection
- **Session Management**: Track patient sessions and care types
- **Appeal System**: Handle rejected applications with appeal process
- **Automated Workflows**: Medication and surgical care workflows
- **Admin Dashboard**: REST API for managing users, sessions, and appeals
- **WhatsApp Integration**: Full WhatsApp Business API integration
- **Database Management**: PostgreSQL with Prisma ORM

## System Architecture

```
src/
├── modules/
│   ├── services/          # WhatsApp API abstraction
│   ├── users/            # User management
│   ├── sessions/         # Session and intake form management
│   ├── appeals/          # Appeal system
│   ├── chatbot/          # Main chatbot logic
│   ├── webhook/          # WhatsApp webhook handling
│   └── admin/            # Admin REST API
├── database/             # Database configuration
├── constants/            # Environment constants
└── types/               # TypeScript type definitions
```

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- WhatsApp Business API account
- ngrok (for local development)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kh-whatsap-chatbot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/whatsapp_chatbot"

   # WhatsApp Business API
   WHATSAPP_API_URL="https://graph.facebook.com/v18.0"
   WHATSAPP_ACCESS_TOKEN="your_whatsapp_access_token"
   WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
   WHATSAPP_VERIFY_TOKEN="your_webhook_verify_token"

   # JWT (if needed for admin authentication)
   JWT_SECRET="your_jwt_secret"
   JWT_EXPIRATION_TIME="24h"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate dev

   # Seed initial data (optional)
   npx prisma db seed
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run start:dev

   # Production mode
   npm run build
   npm run start:prod
   ```

## WhatsApp Business API Setup

### 1. Create WhatsApp Business App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use existing app
3. Add WhatsApp product to your app
4. Configure WhatsApp Business API

### 2. Get Access Token
1. In your app dashboard, go to WhatsApp > Getting Started
2. Copy your access token
3. Add it to your `.env` file

### 3. Get Phone Number ID
1. In WhatsApp > Phone Numbers
2. Copy the Phone Number ID
3. Add it to your `.env` file

### 4. Configure Webhook
1. Set webhook URL: `https://your-domain.com/webhook`
2. Set verify token (same as in `.env`)
3. Subscribe to messages and message_status events

## Local Development with ngrok

1. **Install ngrok**
   ```bash
   npm install -g ngrok
   ```

2. **Start your application**
   ```bash
   npm run start:dev
   ```

3. **Start ngrok tunnel**
   ```bash
   ngrok http 3000
   ```

4. **Configure webhook**
   - Use the ngrok URL as your webhook URL
   - Example: `https://abc123.ngrok.io/webhook`

## API Endpoints

### Webhook Endpoints
- `GET /webhook` - WhatsApp webhook verification
- `POST /webhook` - Receive WhatsApp messages

### Admin Endpoints

#### User Management
- `GET /admin/users` - Get all users
- `GET /admin/users/pending` - Get pending users
- `GET /admin/users/:id` - Get specific user
- `PUT /admin/users/:id/status` - Update user status
- `GET /admin/users/stats` - Get user statistics

#### Session Management
- `GET /admin/sessions` - Get active sessions
- `GET /admin/sessions/:id` - Get specific session
- `PUT /admin/sessions/:id/status` - Update session status
- `GET /admin/sessions/stats` - Get session statistics

#### Appeal Management
- `GET /admin/appeals` - Get all appeals
- `GET /admin/appeals/pending` - Get pending appeals
- `GET /admin/appeals/:id` - Get specific appeal
- `PUT /admin/appeals/:id/status` - Update appeal status
- `GET /admin/appeals/stats` - Get appeal statistics

#### Dashboard
- `GET /admin/dashboard` - Get comprehensive dashboard stats

#### Reminder Management
- `GET /admin/reminders/pending` - Get pending reminders
- `POST /admin/reminders/:id/mark-sent` - Mark reminder as sent

## Chatbot Flow

### New User Flow
1. User sends "hello" or "start"
2. System collects: full name, age, gender, passport
3. User status set to "PENDING"
4. Admin reviews and accepts/rejects
5. If accepted: proceed to intake form
6. If rejected: user can appeal

### Intake Form Flow
1. Collect: name, age, state, care type, WhatsApp number, address
2. Create session with "IN_PROGRESS" status
3. Based on care type:
   - **Medication**: Assign counselor, send dosage info, set reminders
   - **Surgical**: Request medical reports/scans

### Returning User Flow
1. Check user status
2. If accepted with ongoing session: offer to continue or restart
3. If accepted without session: start intake form
4. If rejected: offer appeal process
5. If banned: deny access

## Database Schema

### Core Models
- **User**: Patient information and status
- **Session**: Care sessions and status
- **IntakeForm**: Patient intake information
- **Counselor**: Healthcare provider information
- **Appeal**: Appeal requests and status
- **Reminder**: Automated reminders
- **FeedbackForm**: Patient feedback
- **MedicalReport**: Medical documents

### Enums
- **Gender**: MALE, FEMALE, OTHER
- **UserStatus**: PENDING, ACCEPTED, REJECTED, BANNED
- **SessionStatus**: IN_PROGRESS, COMPLETED, CANCELLED, ESCALATED
- **CareType**: MEDICATION, SURGICAL
- **AppealStatus**: PENDING, ACCEPTED, REJECTED

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `WHATSAPP_API_URL` | WhatsApp API base URL | Yes |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp API access token | Yes |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp phone number ID | Yes |
| `WHATSAPP_VERIFY_TOKEN` | Webhook verification token | Yes |
| `JWT_SECRET` | JWT signing secret | No |
| `JWT_EXPIRATION_TIME` | JWT expiration time | No |

## Development

### Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Database Management
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

### Code Quality
```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## Deployment

### Docker
```bash
# Build image
docker build -t whatsapp-chatbot .

# Run container
docker run -p 3000:3000 --env-file .env whatsapp-chatbot
```

### Environment Setup
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Set up WhatsApp webhook
5. Deploy application

## Security Considerations

- Use HTTPS in production
- Implement rate limiting
- Add authentication for admin endpoints
- Validate all webhook signatures
- Secure database connections
- Log security events

## Troubleshooting

### Common Issues

1. **Webhook not receiving messages**
   - Check webhook URL configuration
   - Verify access token
   - Check server logs

2. **Database connection issues**
   - Verify DATABASE_URL
   - Check PostgreSQL service
   - Run migrations

3. **WhatsApp API errors**
   - Verify access token
   - Check phone number ID
   - Review API quotas

### Logs
Check application logs for detailed error information:
```bash
# Development
npm run start:dev

# Production
npm run start:prod
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting section
