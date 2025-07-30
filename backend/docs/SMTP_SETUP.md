# Real SMTP Integration Setup

## Overview

To receive real emails, you need to set up an SMTP server that can receive emails sent to your domain. Here are several approaches:

## Option 1: Using a Real Domain + MX Records (Production Ready)

### Step 1: Get a Domain

1. Purchase a domain (e.g., `yourdomain.com`) from providers like:
   - Namecheap
   - GoDaddy
   - Cloudflare

### Step 2: Set up MX Records

Add MX record pointing to your server:

```
Type: MX
Name: @
Value: mail.yourdomain.com
Priority: 10
```

### Step 3: Set up A Record for Mail Server

```
Type: A
Name: mail
Value: YOUR_SERVER_IP
```

### Step 4: Configure SMTP Server

Update your `.env` file:

```env
EMAIL_DOMAIN=yourdomain.com
SMTP_PORT=25
SMTP_HOST=0.0.0.0
```

### Step 5: Enable Real SMTP

Set `MOCK_EMAIL_ENABLED=false` in `.env`

## Option 2: Using Webhook Services (Easier for Development)

### Using Mailgun Webhooks

1. Sign up for [Mailgun](https://www.mailgun.com/)
2. Verify your domain
3. Set up webhook endpoint in Mailgun dashboard
4. Point to: `https://yourdomain.com/api/webhook/mailgun`

### Using SendGrid Webhooks

1. Sign up for [SendGrid](https://sendgrid.com/)
2. Configure Inbound Parse webhook
3. Point to: `https://yourdomain.com/api/webhook/sendgrid`

## Option 3: Testing with Mailtrap/MailHog

### Using Mailtrap (Development)

1. Sign up for [Mailtrap](https://mailtrap.io/)
2. Get SMTP credentials
3. Update `.env`:

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_username
SMTP_PASS=your_password
```

### Using MailHog (Local Development)

1. Install MailHog: `go install github.com/mailhog/MailHog@latest`
2. Start MailHog: `MailHog`
3. Configure SMTP to use localhost:1025

## Option 4: Using Your Server with Port Forwarding

### Requirements

- A server with public IP
- Port 25 open (or alternative port)
- Domain pointing to your server

### Setup

1. Deploy your backend to a VPS (DigitalOcean, AWS, etc.)
2. Open port 25 (or 2525)
3. Configure firewall rules
4. Set up reverse proxy with Nginx

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name mail.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Implementation Steps

### 1. Enable Real SMTP in Backend

Update `src/services/smtpService.js`:

```javascript
const SMTPServer = require("smtp-server").SMTPServer;
const { simpleParser } = require("mailparser");

class RealSMTPService {
  constructor() {
    this.server = new SMTPServer({
      authOptional: true,
      onData: this.handleEmail.bind(this),
    });
  }

  async handleEmail(stream, session, callback) {
    try {
      const parsed = await simpleParser(stream);

      // Extract recipient email
      const recipients = parsed.to.value || [];

      for (const recipient of recipients) {
        const emailAddress = recipient.address;

        // Check if this is a valid temp email
        const tempEmail = await TempEmail.findByAddress(emailAddress);

        if (tempEmail && !tempEmail.isExpired()) {
          // Save the email message
          const message = new EmailMessage({
            tempEmailId: tempEmail._id,
            emailAddress: emailAddress,
            from: parsed.from.text,
            to: emailAddress,
            subject: parsed.subject || "",
            body: parsed.text || "",
            bodyHtml: parsed.html || "",
            bodyText: parsed.text || "",
            source: "smtp",
            receivedAt: new Date(),
          });

          await message.save();
        }
      }

      callback();
    } catch (error) {
      callback(error);
    }
  }

  start() {
    const port = process.env.SMTP_PORT || 25;
    this.server.listen(port, () => {
      console.log(`📧 SMTP Server listening on port ${port}`);
    });
  }
}
```

### 2. Update Environment Variables

```env
# Real SMTP Configuration
EMAIL_DOMAIN=yourdomain.com
SMTP_PORT=25
SMTP_HOST=0.0.0.0
MOCK_EMAIL_ENABLED=false

# Optional: Authentication
SMTP_AUTH_REQUIRED=false
SMTP_USERNAME=
SMTP_PASSWORD=
```

### 3. Security Considerations

- Use TLS/SSL certificates
- Implement rate limiting
- Add SPF, DKIM, DMARC records
- Monitor for spam/abuse

### 4. Testing Real Emails

1. Send email to: `test@yourdomain.com`
2. Check if it appears in the inbox
3. Verify all email parsing works correctly

## Deployment Recommendations

### For Production:

1. Use a VPS (DigitalOcean, AWS EC2)
2. Set up proper DNS records
3. Configure SSL certificates
4. Implement monitoring and logging
5. Set up backup systems

### For Development:

1. Use webhook services (Mailgun, SendGrid)
2. Use local testing tools (MailHog, Mailtrap)
3. Test with ngrok for webhooks

## Troubleshooting

### Common Issues:

1. **Port 25 blocked**: Use alternative ports (587, 2525)
2. **DNS not propagating**: Wait 24-48 hours
3. **Emails marked as spam**: Configure SPF/DKIM records
4. **Firewall issues**: Check server firewall settings

### Debugging:

1. Check server logs
2. Use `telnet` to test SMTP connection
3. Verify DNS records with `dig` or `nslookup`
4. Test with email testing tools
