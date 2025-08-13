# 🚀 Free Deployment Guide

Deploy your Canada Residency Tracker for **$0** using:
- **Frontend**: Vercel (free tier)
- **Backend API**: Render (free tier) 
- **Database**: Neon (free tier)

## Prerequisites

- GitHub account
- Vercel account (free)
- Render account (free)
- Neon account (free)

## Step 1: Set Up Database (Neon)

1. **Create Neon Account**
   - Go to https://neon.tech/
   - Sign up with GitHub
   - Create a new project

2. **Get Database URL**
   - Copy the connection string from your Neon dashboard
   - It looks like: `postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require`

3. **Test Connection**
   ```bash
   cd apps/api
   # Update .env with your Neon URL
   echo 'DATABASE_URL="your-neon-connection-string"' > .env
   npx prisma db push
   ```

## Step 2: Deploy Backend API (Render)

1. **Connect GitHub to Render**
   - Go to https://render.com/
   - Sign up with GitHub
   - Connect your repository

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Select the repository

3. **Configure Service**
   ```
   Name: canada-tracker-api
   Root Directory: apps/api
   Environment: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

4. **Set Environment Variables**
   - Go to "Environment" tab
   - Add: `DATABASE_URL` = your Neon connection string
   - Add: `NODE_ENV` = production

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Copy the URL (e.g., `https://canada-tracker-api.onrender.com`)

## Step 3: Deploy Frontend (Vercel)

1. **Connect GitHub to Vercel**
   - Go to https://vercel.com/
   - Sign up with GitHub
   - Import your repository

2. **Configure Project**
   ```
   Framework Preset: Vite
   Root Directory: apps/web
   Build Command: npm run build
   Output Directory: dist
   ```

3. **Set Environment Variables**
   - Go to "Settings" → "Environment Variables"
   - Add: `VITE_API_URL` = `https://your-api-url.onrender.com/api`

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment (2-3 minutes)
   - Your app is live! 🎉

## Step 4: Update Database Schema

After deployment, update your database schema:

```bash
# Update the production database
cd apps/api
npx prisma db push --schema=./prisma/schema.prisma
```

## Free Tier Limits

### Vercel (Frontend)
- ✅ Unlimited deployments
- ✅ Custom domains
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS

### Render (Backend API)
- ⚠️ **Important**: Free tier services sleep after 15 minutes of inactivity
- ✅ 750 hours/month (enough for personal use)
- ✅ Automatic HTTPS
- ✅ Custom domains

### Neon (Database)
- ✅ 3GB storage
- ✅ 10GB transfer/month
- ✅ No sleep (always on)
- ✅ Automatic backups

## Cost Breakdown: $0/month

- **Vercel**: $0 (free tier)
- **Render**: $0 (free tier) 
- **Neon**: $0 (free tier)
- **Total**: $0/month 🎉

## Custom Domain (Optional)

### Frontend (Vercel)
1. Go to Vercel dashboard → your project
2. Settings → Domains
3. Add your domain
4. Update DNS records

### Backend (Render)
1. Go to Render dashboard → your service
2. Settings → Custom Domains
3. Add your subdomain (e.g., `api.yourdomain.com`)

## Monitoring & Maintenance

### Health Checks
- Frontend: Vercel automatically monitors
- Backend: Render health check at `/api/health`
- Database: Neon dashboard shows status

### Backups
- Neon: Automatic daily backups (free tier)
- Manual: Export data via Prisma Studio

### Updates
- Push to GitHub → automatic deployment
- Database migrations: `npx prisma db push`

## Troubleshooting

### API Not Responding
- Check Render logs for errors
- Verify DATABASE_URL is correct
- Check if service is sleeping (free tier limitation)

### Frontend Can't Connect to API
- Verify VITE_API_URL is correct
- Check CORS settings
- Test API endpoint directly

### Database Connection Issues
- Check Neon dashboard for status
- Verify connection string format
- Test with `npx prisma studio`

## Production Checklist

- [ ] Database deployed and connected
- [ ] API deployed and responding
- [ ] Frontend deployed and connecting to API
- [ ] Environment variables set correctly
- [ ] Database schema updated
- [ ] Test adding/editing entries
- [ ] Verify day calculations work correctly

## Security Notes

- Environment variables are encrypted
- Database connection uses SSL
- HTTPS enabled by default
- Regular security updates from platforms

## Scaling (When You Need It)

If you exceed free tiers:
- **Vercel Pro**: $20/month (unlimited bandwidth)
- **Render**: $7/month (no sleep, more resources)
- **Neon Pro**: $10/month (more storage/transfer)

But for personal use, free tiers should be sufficient! 🎯

---

**Your app is now live and accessible from anywhere!** 🌍
