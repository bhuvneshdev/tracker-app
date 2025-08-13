# Database Setup Guide

This guide will help you set up PostgreSQL for the Canada Residency Days Tracker.

## Option 1: Local PostgreSQL Installation

### macOS (using Homebrew)
```bash
# Install PostgreSQL
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Create database
createdb canada_tracker
```

### Ubuntu/Debian
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user and create database
sudo -u postgres psql
CREATE DATABASE canada_tracker;
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE canada_tracker TO your_username;
\q
```

### Windows
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Install with default settings
3. Use pgAdmin or psql to create database:
```sql
CREATE DATABASE canada_tracker;
```

## Option 2: Cloud Database (Recommended for Production)

### Railway
1. Go to https://railway.app/
2. Create new project
3. Add PostgreSQL service
4. Copy the connection string to your `.env` file

### Supabase
1. Go to https://supabase.com/
2. Create new project
3. Go to Settings > Database
4. Copy the connection string to your `.env` file

### PlanetScale
1. Go to https://planetscale.com/
2. Create new database
3. Copy the connection string to your `.env` file

## Configuration

1. Create `.env` file in `apps/api/` directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/canada_tracker"
PORT=3001
```

2. Replace the connection string with your actual database details:
   - `username`: Your PostgreSQL username
   - `password`: Your PostgreSQL password
   - `localhost`: Database host (use your cloud database URL if using cloud)
   - `5432`: Port (usually 5432 for PostgreSQL)
   - `canada_tracker`: Database name

## Testing the Connection

After setting up your database and `.env` file:

```bash
cd apps/api
npx prisma db push
```

If successful, you should see a message indicating the database schema was pushed successfully.

## Troubleshooting

### Connection Refused
- Make sure PostgreSQL is running
- Check if the port is correct (default: 5432)
- Verify firewall settings

### Authentication Failed
- Check username and password
- Ensure the user has proper permissions
- Try connecting with `psql` to test credentials

### Database Not Found
- Create the database: `createdb canada_tracker`
- Or connect to PostgreSQL and run: `CREATE DATABASE canada_tracker;`

## Security Notes

- Never commit your `.env` file to version control
- Use strong passwords for production databases
- Consider using connection pooling for production applications
- Regularly backup your database
