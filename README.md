# 📊 Tracker App

A comprehensive web application to track your 730-day residency obligation as a Canadian Permanent Resident. Perfect for PR holders living in the USA on H1B who need to maintain their residency status.

## Features

- **Day Counting Logic**: Accurately counts days based on your specific requirements:
  - Entry at 11:59 PM on August 12 = 1 day counted
  - Exit at 12:01 AM on August 13 = 1 day counted
  - Total: 2 days for this trip
- **Port of Entry Tracking**: Pre-configured with common border crossings including:
  - Pacific Highway (Peace Arch)
  - Douglas (Peace Arch)
  - And many more US-Canada border crossings
- **Real-time Statistics**: 
  - Total days in Canada
  - Remaining days needed
  - Progress percentage toward 730 days
- **Modern UI**: Clean, responsive interface with beautiful progress tracking
- **Data Persistence**: PostgreSQL database with Prisma ORM
- **Full CRUD Operations**: Add, edit, delete entry/exit records

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Date Handling**: Luxon + date-fns
- **UI Icons**: Lucide React

## Deployment Options

### 🆓 Free Deployment (Recommended)
Deploy for **$0/month** using:
- **Frontend**: Vercel (free tier)
- **Backend API**: Render (free tier)
- **Database**: Neon (free tier)

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### 🏠 Local Development
Run locally with PostgreSQL for development and testing.

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

## Setup Instructions

### 1. Database Setup

First, set up your PostgreSQL database and update the connection string:

```bash
# Create a .env file in the api directory
cd apps/api
cp .env.example .env
```

Edit `apps/api/.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/canada_tracker"
```

### 2. Install Dependencies

```bash
# Install API dependencies
cd apps/api
npm install

# Install web dependencies
cd ../web
npm install
```

### 3. Database Migration

```bash
cd apps/api
npx prisma generate
npx prisma db push
```

### 4. Start the Application

**Terminal 1 - Start the API server:**
```bash
cd apps/api
npm run dev
```

**Terminal 2 - Start the web application:**
```bash
cd apps/web
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Usage

### Adding Entry/Exit Records

1. Click "Add Entry/Exit" button
2. Select the type (Entry to Canada or Exit from Canada)
3. Choose the date and time
4. Select the port of entry from the dropdown
5. Add optional notes
6. Save the record

### Viewing Statistics

The dashboard shows:
- **Total Days**: Your cumulative days in Canada
- **Remaining Days**: Days still needed to reach 730
- **Target**: Always 730 days
- **Progress**: Visual progress bar and percentage

### Managing Records

- **Edit**: Click the edit icon to modify any entry
- **Delete**: Click the trash icon to remove entries
- **View**: All entries are displayed in a sortable table

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/entries` - Get all entry/exit records
- `POST /api/entries` - Create new entry/exit record
- `PUT /api/entries/:id` - Update existing record
- `DELETE /api/entries/:id` - Delete record
- `GET /api/stats` - Get residency statistics

## Day Calculation Logic

The application implements your specific day counting rules:

1. **Entry Day**: If you enter Canada at any time on a day, that entire day counts
2. **Exit Day**: If you leave Canada at any time on a day, that entire day counts
3. **Consecutive Days**: Days between entry and exit are all counted
4. **Open Entries**: If you have an entry without a corresponding exit, days are counted until today

Example:
- Enter Canada: August 12, 11:59 PM → August 12 counts as 1 day
- Exit Canada: August 13, 12:01 AM → August 13 counts as 1 day
- Total: 2 days for this trip

## Development

### Project Structure

```
tracker/
├── apps/
│   ├── api/                 # Backend API
│   │   ├── src/
│   │   │   └── index.ts     # Main server file
│   │   ├── prisma/
│   │   │   └── schema.prisma # Database schema
│   │   └── package.json
│   └── web/                 # Frontend React app
│       ├── src/
│       │   ├── App.tsx      # Main React component
│       │   └── main.tsx     # React entry point
│       └── package.json
└── README.md
```

### Available Scripts

**Root:**
- `npm run dev` - Start both API and web in development
- `npm run install:all` - Install dependencies for both apps
- `./setup.sh` - Automated setup script
- `./deploy.sh` - Deployment helper script

**API:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run generate` - Generate Prisma client
- `npm run db:push` - Push database schema
- `npm run db:studio` - Open Prisma Studio

**Web:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this for your personal residency tracking needs.

## Support

If you encounter any issues or have questions about the day calculation logic, please open an issue on GitHub.

---

**Note**: This application is designed for personal use to track your residency days. Always consult with an immigration lawyer for official residency calculations and compliance requirements.
