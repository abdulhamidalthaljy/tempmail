# TempMail Backend API

A complete Node.js/Express backend for the TempMail disposable email service.

## Features

- 🎯 **Temporary Email Generation**: Generate unique disposable email addresses
- 📧 **SMTP Server**: Receive real emails via built-in SMTP server
- 📨 **Message Management**: Store, retrieve, and manage email messages
- 🧹 **Auto Cleanup**: Automatic cleanup of expired emails and messages
- 🔒 **Security**: Rate limiting, input validation, and secure headers
- 📊 **API Endpoints**: RESTful API for frontend integration
- 🪝 **Webhook Support**: Mock email generation for testing
- 🗄️ **MongoDB**: Persistent storage with optimized indexes

## Quick Start

### Prerequisites

- Node.js (v18+)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone and navigate to backend:**

   ```bash
   cd tempmail/backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and other settings
   ```

4. **Setup database:**

   ```bash
   npm run setup
   ```

5. **Start the server:**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

The API will be available at `http://localhost:3000`

## API Endpoints

### Email Management

#### Generate New Email

```http
POST /api/email/new
```

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "abc123@temp-mail.local",
    "domain": "temp-mail.local",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "expiresAt": "2024-01-15T11:30:00.000Z",
    "timeRemaining": {
      "expired": false,
      "hours": 0,
      "minutes": 59,
      "seconds": 30
    }
  }
}
```

#### Get Email Details

```http
GET /api/email/:address
```

#### Get Messages

```http
GET /api/email/:address/messages?page=1&limit=20&unread=true
```

#### Get Specific Message

```http
GET /api/email/:address/message/:messageId
```

#### Mark Message as Read

```http
PUT /api/email/:address/message/:messageId/read
```

#### Delete Message

```http
DELETE /api/email/:address/message/:messageId
```

#### Delete Email Address

```http
DELETE /api/email/:address
```

### Webhook Endpoints

#### Receive Email via Webhook

```http
POST /api/webhook/email
```

**Request Body:**

```json
{
  "to": "abc123@temp-mail.local",
  "from": "sender@example.com",
  "subject": "Test Email",
  "body": "Email content",
  "bodyHtml": "<p>Email content</p>",
  "attachments": []
}
```

#### Generate Mock Email

```http
POST /api/webhook/mock-email
```

**Request Body:**

```json
{
  "emailAddress": "abc123@temp-mail.local",
  "count": 3
}
```

### System Endpoints

#### Health Check

```http
GET /health
```

#### API Information

```http
GET /
```

## Configuration

### Environment Variables

| Variable                   | Description                 | Default                              |
| -------------------------- | --------------------------- | ------------------------------------ |
| `PORT`                     | Server port                 | `3000`                               |
| `MONGODB_URI`              | MongoDB connection string   | `mongodb://localhost:27017/tempmail` |
| `EMAIL_DOMAIN`             | Domain for generated emails | `temp-mail.local`                    |
| `EMAIL_EXPIRY_HOURS`       | Email expiration time       | `1`                                  |
| `SMTP_PORT`                | SMTP server port            | `2525`                               |
| `CLEANUP_INTERVAL_MINUTES` | Cleanup frequency           | `5`                                  |
| `MAX_MESSAGES_PER_EMAIL`   | Max messages per email      | `50`                                 |
| `RATE_LIMIT_MAX_REQUESTS`  | Rate limit per window       | `100`                                |
| `FRONTEND_URL`             | Frontend URL for CORS       | `http://localhost:4200`              |
| `MOCK_EMAIL_ENABLED`       | Enable mock mode            | `true`                               |

### MongoDB Setup

The application automatically creates necessary indexes on startup. For production:

1. Ensure MongoDB is running
2. Create a dedicated database
3. Update `MONGODB_URI` in `.env`
4. Run database setup: `npm run setup`

### SMTP Server

The built-in SMTP server listens on port 2525 by default. To receive real emails:

1. Set `MOCK_EMAIL_ENABLED=false`
2. Configure your domain's MX record to point to your server
3. Ensure port 2525 (or your chosen port) is accessible

## Development

### Project Structure

```
src/
├── models/           # MongoDB models
│   ├── TempEmail.js     # Temporary email schema
│   └── EmailMessage.js  # Email message schema
├── routes/           # Express routes
│   ├── emailRoutes.js   # Email management endpoints
│   └── webhookRoutes.js # Webhook endpoints
├── services/         # Business logic
│   ├── cleanupService.js # Auto cleanup service
│   └── smtpService.js   # SMTP server service
├── middleware/       # Express middleware
│   ├── errorHandler.js  # Error handling
│   └── validation.js    # Input validation
├── scripts/          # Utility scripts
│   └── setup.js        # Database setup
└── server.js         # Main application entry
```

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run setup` - Setup database and indexes
- `npm test` - Run tests (when implemented)
- `npm run lint` - Run ESLint

### Development Mode

In development mode (`MOCK_EMAIL_ENABLED=true`):

- SMTP server is disabled
- Use webhook endpoints to simulate incoming emails
- Full API functionality available for frontend testing

### Testing Emails

1. **Generate an email address:**

   ```bash
   curl -X POST http://localhost:3000/api/email/new
   ```

2. **Send a mock email:**

   ```bash
   curl -X POST http://localhost:3000/api/webhook/mock-email \
     -H "Content-Type: application/json" \
     -d '{"emailAddress":"your-generated-email@temp-mail.local","count":1}'
   ```

3. **Check messages:**
   ```bash
   curl http://localhost:3000/api/email/your-generated-email@temp-mail.local/messages
   ```

## Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Validates all inputs and sanitizes data
- **Security Headers**: Helmet.js for security headers
- **CORS**: Configurable cross-origin resource sharing
- **Error Handling**: Comprehensive error handling and logging

## Production Deployment

1. **Environment Setup:**

   - Set `NODE_ENV=production`
   - Use strong `JWT_SECRET`
   - Configure production MongoDB URI
   - Set appropriate rate limits

2. **Database:**

   - Use MongoDB Atlas or dedicated MongoDB server
   - Enable authentication
   - Set up backups

3. **Reverse Proxy:**

   - Use Nginx or similar for SSL termination
   - Configure rate limiting at proxy level
   - Set up proper logging

4. **Monitoring:**
   - Monitor application logs
   - Set up health check endpoints
   - Monitor MongoDB performance

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed:**

   - Verify MongoDB is running
   - Check connection string in `.env`
   - Ensure network access to MongoDB

2. **SMTP Server Not Receiving:**

   - Check firewall settings
   - Verify port configuration
   - Ensure MX records point to server

3. **Rate Limiting Issues:**
   - Adjust `RATE_LIMIT_MAX_REQUESTS`
   - Check client IP addressing
   - Consider using Redis for rate limiting in production

### Logs

The application logs important events:

- Email generation and expiration
- Message processing
- Cleanup operations
- Errors and warnings

Monitor logs for troubleshooting and performance optimization.

## API Response Format

All API responses follow this format:

**Success Response:**

```json
{
  "success": true,
  "data": {
    /* response data */
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Error message"
}
```

**Paginated Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      /* data array */
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```
