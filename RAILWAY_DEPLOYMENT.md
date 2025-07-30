# TempMail Railway Deployment Guide

## 🚀 Deploy to Railway

### Step 1: Prepare Your Repository

1. **Initialize Git repository** (if not already done):

   ```bash
   git init
   git add .
   git commit -m "Initial commit - TempMail project"
   ```

2. **Create GitHub repository**:
   - Go to GitHub and create a new repository named `tempmail`
   - Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/tempmail.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Railway

1. **Go to Railway**: https://railway.app/
2. **Sign up/Login** with your GitHub account
3. **Create New Project** → **Deploy from GitHub repo**
4. **Select your `tempmail` repository**
5. **Railway will automatically detect and build your Node.js app**

### Step 3: Configure Environment Variables

In Railway dashboard, go to your project → **Variables** tab and add these:

**Required Variables:**

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://abdulhamid:abdulhamid@cluster0.1qenb2j.mongodb.net/tempmail?retryWrites=true&w=majority&appName=Cluster0
EMAIL_DOMAIN=sandbox180c032f0d354414b01d862910b553da.mailgun.org
EMAIL_EXPIRY_HOURS=1
GMAIL_USER=abdalhamed9699@gmail.com
GMAIL_APP_PASSWORD=moqxcctnbfwbjdcx
SMTP_HOST=smtp.gmail.com
SMTP_PORT_REAL=587
SMTP_SECURE=false
SMTP_TLS_REJECT_UNAUTHORIZED=false
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CLEANUP_INTERVAL_MINUTES=5
MAX_MESSAGES_PER_EMAIL=50
MOCK_EMAIL_ENABLED=false
MAILGUN_API_KEY=bd118604d6296d732034874b04184dc4-03fd4b1a-4a4cc915
MAILGUN_SENDING_KEY=b80984589119a8c0229b4514a3ff93b1-03fd4b1a-da79b896
MAILGUN_DOMAIN=sandbox180c032f0d354414b01d862910b553da.mailgun.org
MAILGUN_SMTP_HOST=smtp.mailgun.org
MAILGUN_SMTP_PORT=587
MAILGUN_SMTP_USER=01306fa22f28@sandbox180c032f0d354414b01d862910b553da.mailgun.org
MAILGUN_SMTP_PASSWORD=755445@Abduu
```

### Step 4: Get Your Railway URL

1. After deployment, Railway will provide a URL like: `https://your-app-name.railway.app`
2. **Copy this URL** - you'll need it for the next steps

### Step 5: Update Mailgun Webhook

1. **Update the webhook configuration** with your Railway URL:

   ```bash
   # In your local terminal
   cd backend
   node configure-webhook.js setup https://your-app-name.railway.app
   ```

2. **Or manually update in Mailgun dashboard**:
   - Go to: https://app.mailgun.com/mg/dashboard
   - Select your domain: `sandbox180c032f0d354414b01d862910b553da.mailgun.org`
   - Go to "Routes" section
   - Update the webhook URL to: `https://your-app-name.railway.app/api/webhook/mailgun`

### Step 6: Update Environment Variables

In Railway dashboard, add/update:

```
FRONTEND_URL=https://your-frontend-domain.com
MAILGUN_WEBHOOK_URL=https://your-app-name.railway.app/api/webhook/mailgun
```

### Step 7: Deploy Frontend (Optional)

**Option A: Deploy Frontend to Vercel/Netlify:**

1. Build your Angular app: `cd frontend/client && ng build`
2. Deploy the `dist` folder to Vercel or Netlify
3. Update the API endpoints in your frontend to point to Railway URL

**Option B: Serve Frontend from Railway:**

1. Update `railway.json` to serve both backend and frontend
2. Build frontend during deployment

### Step 8: Test Your Deployment

1. **Visit your Railway URL**: `https://your-app-name.railway.app`
2. **Check health endpoint**: `https://your-app-name.railway.app/health`
3. **Test email receiving**:
   - Generate a temp email on your deployed site
   - Send an email to that address
   - Check if it appears in the inbox

### Step 9: MongoDB Atlas Configuration

Ensure MongoDB Atlas allows Railway connections:

1. Go to MongoDB Atlas dashboard
2. **Network Access** → **Add IP Address**
3. Add `0.0.0.0/0` to allow all IPs (for Railway)
4. Or add Railway's specific IP ranges

## 🔧 Troubleshooting

### Common Issues:

1. **Build Fails**:

   - Check Railway logs for specific errors
   - Ensure all dependencies are in `package.json`

2. **Environment Variables**:

   - Double-check all required variables are set
   - No spaces around `=` in variable definitions

3. **MongoDB Connection**:

   - Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
   - Check connection string format

4. **Webhook Not Working**:
   - Verify Mailgun webhook URL is correct
   - Check Railway app logs for webhook requests

## 📱 Production URLs

After deployment, you'll have:

- **Backend API**: `https://your-app-name.railway.app`
- **Health Check**: `https://your-app-name.railway.app/health`
- **Webhook Endpoint**: `https://your-app-name.railway.app/api/webhook/mailgun`

## 🎉 Success!

Your TempMail application is now live and receiving real emails in production!

### Next Steps:

1. Test email receiving functionality
2. Monitor Railway logs for any issues
3. Consider adding a custom domain
4. Set up monitoring and alerts
