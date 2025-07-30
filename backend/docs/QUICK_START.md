## Quick Setup Instructions

### For Testing Mock Emails (Current Setup):

1. Generate a new temporary email
2. Click "📧 Add Test Email" button
3. View the email in the inbox
4. Test reading individual emails

### For Real SMTP Integration:

#### Option A: Simple Development Testing

1. Update `.env`:
   ```
   MOCK_EMAIL_ENABLED=false
   EMAIL_DOMAIN=yourdomain.com
   SMTP_PORT=2525
   ```
2. Restart the backend server
3. Send emails to: user@yourdomain.com
4. They will appear in the inbox

#### Option B: Production Setup

1. Get a domain (e.g., tempmail.com)
2. Set up MX record: mail.tempmail.com -> YOUR_SERVER_IP
3. Set up A record: mail.tempmail.com -> YOUR_SERVER_IP
4. Update `.env` with your domain
5. Deploy to a server with public IP
6. Open port 25 (or 2525) on firewall

#### Option C: Using Webhook Services (Recommended)

1. Sign up for Mailgun/SendGrid
2. Configure webhook to point to your API
3. Receive emails via webhooks instead of SMTP

### Test Commands:

```bash
# Run SMTP setup wizard
node src/scripts/setup-smtp.js

# Test API endpoints
curl -X POST http://localhost:3000/api/email/new
curl -X POST http://localhost:3000/api/email/YOUR_EMAIL/mock-message \
  -H "Content-Type: application/json" \
  -d '{"from":"test@example.com","subject":"Test","body":"Hello!"}'
```
