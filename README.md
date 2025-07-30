# 📧 TempMail - Temporary Email Service

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit_Site-blue?style=for-the-badge)](https://tempmail-xi.vercel.app)
[![Backend API](https://img.shields.io/badge/🔗_API-Railway-purple?style=for-the-badge)](https://tempmail-production-740f.up.railway.app)
[![License](https://img.shields.io/badge/📝_License-MIT-green?style=for-the-badge)](LICENSE)

A fully functional temporary email service that provides disposable email addresses with **real email receiving capabilities**. Built with Angular 17, Node.js, MongoDB, and Mailgun integration.

![TempMail Preview](https://via.placeholder.com/800x400/4285f4/ffffff?text=TempMail+Preview)

## ✨ Features

- 🔥 **Real Email Receiving** - Receive actual emails from any sender via Mailgun webhooks
- ⚡ **Instant Email Generation** - Create disposable email addresses in seconds
- 📱 **Responsive Design** - Modern UI built with Angular 17 and Bootstrap 5
- 🔄 **Auto-Refresh Inbox** - Real-time email updates without page reload
- 📧 **Reply & Forward** - Send replies and forward emails using SMTP
- 💾 **Persistent Sessions** - Email state persists across browser refreshes
- 🧹 **Auto-Cleanup** - Automatic cleanup of expired emails and messages
- 🔒 **Secure & Fast** - Rate limiting, input validation, and optimized performance

## 🚀 Live Demo

**Frontend**: [https://tempmail-xi.vercel.app](https://tempmail-xi.vercel.app)  
**Backend API**: [https://tempmail-production-740f.up.railway.app](https://tempmail-production-740f.up.railway.app)

## 🛠️ Technology Stack

<table>
<tr>
<td><strong>Frontend</strong></td>
<td><strong>Backend</strong></td>
<td><strong>Database & Services</strong></td>
</tr>
<tr>
<td>

- Angular 17
- TypeScript
- Bootstrap 5
- RxJS

</td>
<td>

- Node.js
- Express.js
- Mongoose ODM
- Nodemailer

</td>
<td>

- MongoDB Atlas
- Mailgun API
- Railway (Backend)
- Vercel (Frontend)

</td>
</tr>
</table>

## 📋 Prerequisites

- **Node.js** 18 or higher
- **MongoDB Atlas** account
- **Mailgun** account (for real email receiving)
- **Gmail** account (for SMTP sending)

## ⚙️ Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/abdulhamidalthaljy/tempmail.git
cd tempmail
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in the backend directory:

```env
# MongoDB
MONGODB_URI=your_mongodb_atlas_connection_string

# Mailgun Configuration
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain
MAILGUN_WEBHOOK_URL=your_webhook_url

# Gmail SMTP
GMAIL_USER=your_gmail_address
GMAIL_APP_PASSWORD=your_gmail_app_password

# Application
PORT=3000
NODE_ENV=production
FRONTEND_URL=http://localhost:4200
```

Start backend server:

```bash
npm start
```

### 3. Frontend Setup

```bash
cd frontend/client
npm install
ng serve
```

Visit: `http://localhost:4200`

## 📡 API Documentation

### Email Management

| Method   | Endpoint                     | Description                  |
| -------- | ---------------------------- | ---------------------------- |
| `POST`   | `/api/email/generate`        | Generate new temporary email |
| `GET`    | `/api/email/:email/messages` | Get messages for email       |
| `DELETE` | `/api/email/:email`          | Delete temporary email       |

### Message Operations

| Method | Endpoint                               | Description      |
| ------ | -------------------------------------- | ---------------- |
| `POST` | `/api/email/:email/reply/:messageId`   | Reply to message |
| `POST` | `/api/email/:email/forward/:messageId` | Forward message  |

### Webhooks

| Method | Endpoint               | Description              |
| ------ | ---------------------- | ------------------------ |
| `POST` | `/api/webhook/mailgun` | Mailgun webhook endpoint |

## 🏗️ Project Structure

```
tempmail/
├── 📁 frontend/client/     # Angular 17 Frontend
│   ├── 📁 src/app/
│   │   ├── 📁 components/
│   │   │   ├── 📄 home/           # Email generation
│   │   │   ├── 📄 inbox/          # Message list
│   │   │   └── 📄 email-viewer/   # Email details
│   │   └── 📁 services/
│   │       └── 📄 email.service.ts
│   └── 📄 angular.json
├── 📁 backend/             # Node.js Backend
│   ├── 📁 src/
│   │   ├── 📁 models/
│   │   │   ├── 📄 TempEmail.js
│   │   │   └── 📄 EmailMessage.js
│   │   ├── 📁 routes/
│   │   │   ├── 📄 emailRoutes.js
│   │   │   └── 📄 webhookRoutes.js
│   │   ├── 📁 services/
│   │   │   ├── 📄 cleanupService.js
│   │   │   └── 📄 smtpEmailService.js
│   │   └── 📄 server.js
│   └── 📄 package.json
├── 📄 nixpacks.toml        # Railway deployment
├── 📄 railway.json         # Railway configuration
└── 📄 README.md
```

## 🔧 Environment Configuration

### Backend Environment Variables

```env
# Required
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tempmail
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain
GMAIL_USER=your_gmail_address
GMAIL_APP_PASSWORD=your_gmail_app_password

# Optional
PORT=3000
NODE_ENV=production
EMAIL_EXPIRY_HOURS=1
CLEANUP_INTERVAL_MINUTES=5
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment

Update `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: "https://your-backend-url.com",
};
```

## 🚀 Deployment

### Backend (Railway)

1. Connect GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Frontend (Vercel)

1. Connect GitHub repository to Vercel
2. Set framework preset to "Angular"
3. Set root directory to `frontend/client`
4. Deploy automatically on push to main branch

### Mailgun Webhook Setup

1. Configure webhook URL: `https://your-backend-url.com/api/webhook/mailgun`
2. Set webhook events: `delivered`, `failed`, `opened`, `clicked`

## 🗃️ Database Schema

### TempEmail Collection

```javascript
{
  email: String,      // Unique temporary email address
  expiresAt: Date,    // Expiration timestamp
  createdAt: Date     // Creation timestamp
}
```

### EmailMessage Collection

```javascript
{
  to: String,         // Recipient email
  from: String,       // Sender email
  subject: String,    // Email subject
  text: String,       // Plain text content
  html: String,       // HTML content
  messageId: String,  // Unique message ID
  receivedAt: Date,   // Timestamp received
  source: String      // 'mailgun' or 'smtp'
}
```

## 🔒 Security Features

- **CORS Protection** - Whitelist specific domains
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Input Validation** - Comprehensive input sanitization
- **Security Headers** - Helmet.js security middleware
- **Environment Variables** - Secure configuration management

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [**Mailgun**](https://www.mailgun.com/) - Email receiving services
- [**Railway**](https://railway.app/) - Backend hosting platform
- [**Vercel**](https://vercel.com/) - Frontend hosting platform
- [**MongoDB Atlas**](https://www.mongodb.com/atlas) - Database hosting

## 🐛 Issues & Support

If you encounter any issues or have questions:

1. **Check** existing [GitHub Issues](https://github.com/abdulhamidalthaljy/tempmail/issues)
2. **Create** a new issue with detailed information
3. **Join** our discussions for community support

## ⭐ Show Your Support

If this project helped you, please consider giving it a **⭐ star** on GitHub!

---

<div align="center">

**[🌐 Live Demo](https://tempmail-xi.vercel.app)** | **[📚 Documentation](https://github.com/abdulhamidalthaljy/tempmail)** | **[🐛 Report Bug](https://github.com/abdulhamidalthaljy/tempmail/issues)**

Made with ❤️ by [abdulhamidalthaljy](https://github.com/abdulhamidalthaljy)

</div>
