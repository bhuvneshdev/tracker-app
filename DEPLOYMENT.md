# 🚀 Deployment Guide - Tracker App

## Quick Deploy (Recommended)

### Prerequisites
- GitHub account
- Neon account (free database)
- Render account (free hosting)
- Vercel account (free hosting)

---

## Step 1: Database Setup (Neon)

1. **Go to [neon.tech](https://neon.tech)**
2. **Sign up/Login** with GitHub
3. **Create new project**:
   - Project name: `tracker-app`
   - Region: Choose closest to you
4. **Copy the connection string** (looks like: `postgresql://user:pass@host/db?sslmode=require`)

---

## Step 2: Backend Deployment (Render)

1. **Go to [render.com](https://render.com)**
2. **Sign up/Login** with GitHub
3. **Click "New +" → "Web Service"**
4. **Connect your GitHub repository**
5. **Configure service**:
   ```
   Name: tracker-api
   Build Command: cd apps/api && npm install && npm run build
   Start Command: cd apps/api && npm start
   ```
6. **Add Environment Variables**:
   ```
   NODE_ENV=production
   DATABASE_URL=[Your Neon connection string]
   ```
7. **Click "Create Web Service"**
8. **Wait for deployment** (5-10 minutes)
9. **Copy your service URL** (e.g., `https://tracker-api.onrender.com`)

---

## Step 3: Frontend Deployment (Vercel)

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Login** with GitHub
3. **Click "New Project"**
4. **Import your GitHub repository**
5. **Configure project**:
   ```
   Framework Preset: Vite
   Root Directory: apps/web
   Build Command: npm run build
   Output Directory: dist
   ```
6. **Add Environment Variables**:
   ```
   VITE_API_URL=https://tracker-api.onrender.com/api
   ```
7. **Click "Deploy"**
8. **Wait for deployment** (2-3 minutes)
9. **Your app is live!** 🎉

---

## Step 4: Database Migration

After deployment, you need to run the database migration:

1. **Go to your Render dashboard**
2. **Click on your API service**
3. **Go to "Shell" tab**
4. **Run these commands**:
   ```bash
   cd apps/api
   npx prisma generate
   npx prisma db push
   ```

---

## Step 5: Test Your Live App

1. **Visit your Vercel URL** (e.g., `https://tracker-app.vercel.app`)
2. **Add a test entry** to verify everything works
3. **Check the calculation** is working correctly

---

## Troubleshooting

### Common Issues:

1. **Database Connection Error**:
   - Check your `DATABASE_URL` in Render environment variables
   - Ensure Neon database is active

2. **API Not Found**:
   - Verify `VITE_API_URL` in Vercel environment variables
   - Check Render service is running

3. **Build Failures**:
   - Check build logs in Render/Vercel
   - Ensure all dependencies are in package.json

### Support:
- **Render**: Check service logs in dashboard
- **Vercel**: Check deployment logs
- **Neon**: Check connection in dashboard

---

## Cost Breakdown

**Free Tier Limits:**
- **Neon**: 3 projects, 0.5GB storage
- **Render**: 750 hours/month, 512MB RAM
- **Vercel**: Unlimited deployments, 100GB bandwidth

**Total Cost: $0/month** 🎉

---

## Next Steps

1. **Custom Domain** (Optional):
   - Add custom domain in Vercel
   - Update DNS settings

2. **Monitoring**:
   - Set up uptime monitoring
   - Add error tracking

3. **Backup**:
   - Set up database backups in Neon
   - Export data regularly

---

## Your Live URLs

After deployment, you'll have:
- **Frontend**: `https://tracker-app.vercel.app`
- **Backend**: `https://tracker-api.onrender.com`
- **Database**: Neon dashboard

**Your Tracker App will be live and accessible from anywhere!** 🌍
