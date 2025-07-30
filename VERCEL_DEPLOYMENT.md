# TempMail Frontend Deployment to Vercel

## Prerequisites

1. ✅ Backend deployed to Railway: `https://tempmail-production-740f.up.railway.app`
2. ✅ GitHub repository: `https://github.com/abdulhamidalthaljy/tempmail`
3. ✅ Vercel account (free)

## Deployment Steps

### 1. **Push to GitHub** (if not already done)

```bash
# Navigate to your project root
cd c:\Users\admin\Desktop\JKU\my_projects\tempmail

# Add all files to git
git add .
git commit -m "Prepare frontend for Vercel deployment"
git push origin main
```

### 2. **Deploy to Vercel**

#### Option A: Using Vercel Website (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import `abdulhamidalthaljy/tempmail`
5. **Important Settings:**
   - **Framework Preset**: Angular
   - **Root Directory**: `frontend/client`
   - **Build Command**: `npm run build:vercel`
   - **Output Directory**: `dist/client/browser`
   - **Install Command**: `npm install`

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend/client

# Deploy
vercel --prod
```

### 3. **Configure Environment Variables in Vercel**

After deployment, go to your Vercel project dashboard:

1. Go to Settings → Environment Variables
2. Add these variables:
   - `NODE_ENV` = `production`
   - `API_URL` = `https://tempmail-production-740f.up.railway.app/api`

### 4. **Update Railway Backend CORS**

The backend is already configured to accept Vercel domains (\*.vercel.app), so no changes needed!

### 5. **Test Your Deployment**

After deployment, your frontend will be available at:
`https://your-project-name.vercel.app`

## What's Been Configured

✅ **Environment Configuration**:

- Development: `http://localhost:3000/api`
- Production: `https://tempmail-production-740f.up.railway.app/api`

✅ **CORS Configuration**: Backend already allows Vercel domains

✅ **Build Configuration**: Optimized for Vercel deployment

✅ **Routing**: SPA routing configured for Vercel

## Testing

1. Visit your Vercel URL
2. Generate a temporary email
3. Send a test email from Gmail/Yahoo to the temp email
4. Check if it appears in the inbox

## Troubleshooting

### Build Fails

- Check that `frontend/client` is set as root directory in Vercel
- Verify build command is `npm run build:vercel`

### API Calls Fail

- Check if CORS is allowing your Vercel domain
- Verify Railway backend is running
- Check browser console for specific errors

### Emails Not Receiving

- Verify Mailgun webhook is pointing to Railway (already configured)
- Check Railway logs for webhook hits
- Test with a simple email from Gmail

## Architecture Overview

```
Email Sender → Mailgun → Railway Backend → MongoDB Atlas
                           ↓
Vercel Frontend ← Railway API ← Database
```

Your complete TempMail system:

- **Frontend**: Vercel (Global CDN)
- **Backend**: Railway (Always-on)
- **Database**: MongoDB Atlas (Cloud)
- **Email Service**: Mailgun (Webhooks)
