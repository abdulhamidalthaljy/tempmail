# TempMail Clone - Disposable Email Service

A complete disposable email service with Angular frontend and Node.js backend, featuring temporary email generation, message storage, and mock email testing capabilities.

## 🚀 Features

- **Disposable Email Generation**: Create temporary email addresses that auto-expire
- **Real-time Inbox**: View incoming messages instantly
- **Message Management**: Read, mark as read, and auto-cleanup expired messages
- **Mock Email Testing**: Add test emails to any inbox for development/demo purposes
- **Responsive UI**: Modern Bootstrap-based interface
- **Auto-cleanup**: Automatic removal of expired emails and messages
- **MongoDB Storage**: Persistent message storage with MongoDB Atlas
- **Rate Limiting**: API protection with configurable rate limits
- **Security**: Helmet security headers, CORS protection, input validation

## 📁 Project Structure

```
tempmail/
├── frontend/           # Angular 17 Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── header/           # Navigation header
│   │   │   │   ├── home/             # Email generation page
│   │   │   │   ├── inbox/            # Message list view
│   │   │   │   └── email-viewer/     # Email detail view
│   │   │   └── services/
│   │   │       └── email.service.ts  # API communication
│   │   └── assets/
│   └── angular.json
├── backend/            # Node.js Express Backend
│   ├── src/
│   │   ├── models/
│   │   │   ├── TempEmail.js          # Email address schema
│   │   │   └── EmailMessage.js       # Message schema
│   │   ├── routes/
│   │   │   └── emailRoutes.js        # API endpoints
│   │   ├── services/
│   │   │   ├── cleanupService.js     # Auto-cleanup service
│   │   │   ├── smtpService.js        # Mock SMTP service
│   │   │   └── realSMTPService.js    # Production SMTP service
│   │   ├── middleware/
│   │   │   ├── validation.js         # Input validation
│   │   │   ├── errorHandler.js       # Error handling
│   │   │   └── asyncHandler.js       # Async wrapper
│   │   └── server.js                 # Main server file
│   └── package.json
└── test_mock_email.cmd # Testing script
```

## 🛠️ Technology Stack

### Frontend

- **Angular 17**: Modern web framework with standalone components
- **Bootstrap 5**: Responsive UI framework
- **TypeScript**: Type-safe development
- **RxJS**: Reactive programming for API calls

### Backend

- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB Atlas**: Cloud database
- **Mongoose**: MongoDB object modeling
- **JWT**: Authentication (ready for implementation)

### Security & Middleware

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Express Rate Limit**: API rate limiting
- **bcryptjs**: Password hashing (ready for auth)
- **Validator**: Input validation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Angular CLI (`npm install -g @angular/cli`)

### Backend Setup

1. **Navigate to backend directory:**

   ```cmd
   cd backend
   ```

2. **Install dependencies:**

   ```cmd
   npm install
   ```

3. **Set up environment variables:**
   Create `.env` file in the backend directory:

   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   EMAIL_DOMAIN=temp-mail.local
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   ```

4. **Start the backend server:**
   ```cmd
   npm start
   ```
   Server will run on `http://localhost:3000`

### Frontend Setup

1. **Navigate to frontend directory:**

   ```cmd
   cd frontend
   ```

2. **Install dependencies:**

   ```cmd
   npm install
   ```

3. **Start the development server:**
   ```cmd
   ng serve
   ```
   Frontend will run on `http://localhost:4200`

## 📡 API Endpoints

### Email Management

- `POST /api/email/new` - Create new temporary email
- `GET /api/email/:address` - Get email details and time remaining
- `GET /api/email/:address/messages` - Get messages for an email address
- `GET /api/email/:address/messages/:messageId` - Get specific message
- `PUT /api/email/:address/messages/:messageId/read` - Mark message as read
- `DELETE /api/email/:address/messages/:messageId` - Delete message

### Testing & Development

- `POST /api/email/:address/mock-message` - Add mock email for testing
- `POST /api/email/test-mock` - Test mock endpoint functionality
- `GET /api/email/cleanup/stats` - Get cleanup statistics

### Health & Monitoring

- `GET /api/health` - Server health check
- `GET /api/email/stats` - System statistics

## 🧪 Testing Mock Emails

The project includes a mock email feature for testing and demonstration:

### Using the Test Script

Run the automated test script:

```cmd
test_mock_email.cmd
```

### Manual Testing

1. **Create a temporary email:**

   ```cmd
   curl -X POST http://localhost:3000/api/email/new
   ```

2. **Add a mock email:**

   ```cmd
   curl -X POST -H "Content-Type: application/json" ^
   -d "{\"subject\":\"Test Email\",\"from\":\"test@example.com\",\"body\":\"Hello World!\"}" ^
   http://localhost:3000/api/email/YOUR_EMAIL_ADDRESS/mock-message
   ```

3. **Check the inbox:**
   ```cmd
   curl http://localhost:3000/api/email/YOUR_EMAIL_ADDRESS/messages
   ```

### Frontend Mock Email Button

The frontend includes an "Add Mock Email" button on the home page that:

- Adds a test email to the current temporary email address
- Automatically refreshes the inbox to show the new message
- Provides instant feedback for testing the inbox functionality

## 🔧 Configuration

### Database Configuration

The project is configured to use MongoDB Atlas. Update the connection string in your `.env` file:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tempmail
```

### Email Domain

Configure your email domain in the `.env` file:

```env
EMAIL_DOMAIN=yourdomain.com
```

### Auto-cleanup Settings

Messages are automatically cleaned up based on the email expiration time. The cleanup service runs every 5 minutes by default.

## 🌐 Production Deployment

### Real SMTP Integration

For production use, implement real SMTP receiving:

1. **Set up MX records** for your domain
2. **Configure SMTP server** using the provided `realSMTPService.js`
3. **Update environment variables** for production
4. **Set up webhook services** for email forwarding (Mailgun, SendGrid, etc.)

### Example Webhook Integration

```javascript
// Example webhook endpoint for Mailgun
app.post("/webhook/mailgun", async (req, res) => {
  const { recipient, sender, subject, body } = req.body;

  // Process incoming email
  await processIncomingEmail({
    to: recipient,
    from: sender,
    subject: subject,
    body: body,
  });

  res.status(200).send("OK");
});
```

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: All inputs are validated and sanitized
- **CORS Protection**: Configured for secure cross-origin requests
- **Security Headers**: Helmet.js provides essential security headers
- **Error Handling**: Comprehensive error handling without information leakage

## 🚀 Performance

- **Database Indexing**: Optimized MongoDB indexes for fast queries
- **Automatic Cleanup**: Expired emails and messages are cleaned automatically
- **Compression**: Gzip compression for API responses
- **Pagination**: Large message lists are paginated

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Future Enhancements

- [ ] User accounts and authentication
- [ ] Email forwarding to real addresses
- [ ] File attachments support
- [ ] Email templates
- [ ] API key management
- [ ] Advanced filtering and search
- [ ] Real-time notifications
- [ ] Mobile app support

## 🐛 Troubleshooting

### Common Issues

1. **Backend won't start**: Check MongoDB connection string and network access
2. **Frontend build errors**: Ensure Angular CLI and dependencies are up to date
3. **CORS errors**: Verify backend CORS configuration matches frontend URL
4. **Database connection**: Ensure MongoDB Atlas allows connections from your IP

### Debug Mode

Start the backend with additional logging:

```cmd
NODE_ENV=development npm start
```

### Health Check

Verify services are running:

- Backend: `http://localhost:3000/api/health`
- Frontend: `http://localhost:4200`

---

## 🌟 Project Status

- ✅ **Frontend**: Complete Angular 17 application with Bootstrap UI
- ✅ **Backend**: Full Node.js/Express API with MongoDB integration
- ✅ **Database**: MongoDB Atlas cloud database configured
- ✅ **Mock Testing**: Working mock email system for development
- ✅ **Auto-cleanup**: Automatic cleanup of expired content
- ✅ **Security**: Production-ready security middleware
- 📋 **Real SMTP**: Ready for production SMTP integration
- 📋 **Authentication**: Framework ready for user accounts

**Current State**: Fully functional disposable email service ready for development and testing. Production SMTP integration available for deployment.
