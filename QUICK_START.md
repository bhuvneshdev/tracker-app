# Quick Start Guide

Get your Canada Residency Days Tracker running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)

## Quick Setup

### 1. Clone and Setup
```bash
# If you haven't already cloned the repository
git clone <your-repo-url>
cd tracker

# Run the automated setup script
./setup.sh
```

### 2. Configure Database
Edit `apps/api/.env` and update the database connection:
```env
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/canada_tracker"
```

### 3. Start the Application
```bash
npm run dev
```

That's it! Your application is now running at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## Manual Setup (if automated script doesn't work)

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Setup Database
```bash
cd apps/api
npx prisma generate
npx prisma db push
```

### 3. Start Development Servers
```bash
# Terminal 1 - API
cd apps/api
npm run dev

# Terminal 2 - Web
cd apps/web
npm run dev
```

## First Use

1. Open http://localhost:5173 in your browser
2. Click "Add Entry/Exit" to add your first record
3. Select "Entry to Canada" or "Exit from Canada"
4. Choose your date/time and port of entry
5. Save and view your progress!

## Need Help?

- Check the full [README.md](README.md) for detailed documentation
- See [DATABASE_SETUP.md](DATABASE_SETUP.md) for database configuration help
- Make sure PostgreSQL is running and accessible
- Verify your database connection string in `.env`

## Common Issues

**"Database connection failed"**
- Check if PostgreSQL is running
- Verify your connection string in `.env`
- Make sure the database exists

**"Port already in use"**
- Change the port in `.env` file
- Or kill the process using the port

**"Module not found"**
- Run `npm install` in both `apps/api` and `apps/web` directories
- Or run `npm run install:all` from the root
